// Integration against isolated HTTP fixtures through the project's actual Vite proxy.
// All mutations stay in these in-memory servers, never Docker/backend databases.
import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { createServer, loadConfigFromFile } from 'vite'
import { vendorManagementService as vendor } from '../src/services/vendorManagementService.js'
import { orderService } from '../src/services/orderService.js'
import { revalidateCartItem } from '../src/services/checkoutService.js'
import { setAuthToken } from '../src/services/apiClient.js'
import { bakeryId, productId, customerId, orderId, managedProduct, publicProduct, cartItem, order, directRequest, page } from './fixtures/vendorOrder.js'

let vite, bakeryServer, orderServer, origin, calls, product, currentOrder, failure, bodyByKey
const nativeFetch = globalThis.fetch
const respond = (response, status, data) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ statusCode: status, message: status >= 400 ? 'Fixture failure' : 'Success', data })) }
async function fixture(service, request, response) {
  let raw = ''
  for await (const chunk of request) raw += chunk
  const url = new URL(request.url, 'http://fixture')
  calls.push({ service, path: url.pathname, query: url.searchParams, method: request.method, body: raw, headers: request.headers })
  if (failure) return respond(response, failure, null)
  if (request.headers.authorization !== 'Bearer http-fixture-token' && url.pathname !== '/api/v1/products/' + productId) return respond(response, 401, null)
  if (service === 'bakery') {
    if (url.pathname === '/api/v1/products/' + productId) return respond(response, 200, publicProduct)
    if (url.pathname.endsWith('/members')) return respond(response, 200, [{ userId: customerId, memberRole: 'OWNER', status: 'ACTIVE' }])
    if (url.pathname.endsWith('/products') && request.method === 'GET') return respond(response, 200, page([product], { page: Number(url.searchParams.get('page') || 1) }))
    if (request.method === 'POST' && url.pathname.endsWith('/products')) { product = { ...JSON.parse(raw), id: productId, status: 'DRAFT' }; return respond(response, 201, product) }
    if (request.method === 'PATCH' && url.pathname.endsWith('/products/' + productId)) { product = { ...product, ...JSON.parse(raw) }; return respond(response, 200, product) }
    if (request.method === 'POST' && url.pathname.endsWith('/hide')) { if (product.status !== 'PUBLISHED') return respond(response, 409, null); product.status = 'HIDDEN'; return respond(response, 200, product) }
  }
  if (service === 'order') {
    if (url.pathname === '/api/v1/orders' && request.method === 'GET') return respond(response, 200, page([currentOrder], { page: Number(url.searchParams.get('page') || 1) }))
    if (url.pathname === '/api/v1/orders/' + orderId && request.method === 'GET') return respond(response, 200, currentOrder)
    if (url.pathname === '/api/v1/orders/direct' && request.method === 'POST') {
      const key = request.headers['idempotency-key'], prior = bodyByKey.get(key)
      if (prior && prior !== raw) return respond(response, 409, null)
      bodyByKey.set(key, raw)
      return respond(response, prior ? 200 : 201, currentOrder)
    }
    if (url.pathname.endsWith('/status-transitions') && request.method === 'POST') {
      const input = JSON.parse(raw)
      if (currentOrder.status !== 'PENDING' || input.targetStatus !== 'CONFIRMED') return respond(response, 409, null)
      currentOrder = { ...currentOrder, status: 'CONFIRMED', statusHistory: [...currentOrder.statusHistory, { fromStatus: 'PENDING', toStatus: 'CONFIRMED', note: input.reason, changedAt: new Date().toISOString() }] }
      return respond(response, 200, currentOrder)
    }
  }
  return respond(response, 404, null)
}
before(async () => {
  bakeryServer = createHttpServer((request, response) => { void fixture('bakery', request, response).catch(() => respond(response, 500, null)) })
  orderServer = createHttpServer((request, response) => { void fixture('order', request, response).catch(() => respond(response, 500, null)) })
  bakeryServer.listen(0, '127.0.0.1'); orderServer.listen(0, '127.0.0.1')
  await Promise.all([once(bakeryServer, 'listening'), once(orderServer, 'listening')])
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' })
  const proxy = Object.fromEntries(Object.entries(loaded.config.server.proxy).map(([pattern, options]) => [pattern, { ...options, target: /bakeries|products/.test(pattern) && !/subscription/.test(pattern) ? 'http://127.0.0.1:' + bakeryServer.address().port : /orders/.test(pattern) && !/subscription/.test(pattern) ? 'http://127.0.0.1:' + orderServer.address().port : options.target }]))
  vite = await createServer({ ...loaded.config, configFile: false, logLevel: 'error', server: { ...loaded.config.server, host: '127.0.0.1', port: 0, strictPort: false, hmr: false, ws: false, proxy } })
  await vite.listen(); origin = 'http://127.0.0.1:' + vite.httpServer.address().port
  globalThis.fetch = (url, options) => nativeFetch(new URL(url, origin), options)
})
beforeEach(() => { calls = []; product = { ...managedProduct }; currentOrder = structuredClone(order); failure = null; bodyByKey = new Map(); setAuthToken('http-fixture-token') })
after(async () => { globalThis.fetch = nativeFetch; setAuthToken(null); await vite?.close(); bakeryServer?.closeAllConnections(); orderServer?.closeAllConnections(); await Promise.all([bakeryServer && new Promise((resolve) => bakeryServer.close(resolve)), orderServer && new Promise((resolve) => orderServer.close(resolve))]) })

test('Real Vite routing sends private products/member requests to Bakery and orders to Order', async () => {
  assert.equal((await vendor.getMembership(bakeryId, customerId)).memberRole, 'OWNER')
  const products = await vendor.getProducts(bakeryId, { page: 2, size: 10, sort: 'basePrice,asc' })
  const orders = await orderService.getOrders({ scope: 'bakery', bakeryId, page: 1 })
  assert.equal(products.meta.page, 2); assert.equal(orders.result[0].id, orderId)
  assert.deepEqual(calls.map((call) => call.service), ['bakery', 'bakery', 'order'])
  assert.equal(calls[2].query.get('scope'), 'bakery'); assert.equal(calls[1].headers.authorization, 'Bearer http-fixture-token')
})
test('Product create/edit/lifecycle mutations are observable after re-reading HTTP fixture state', async () => {
  await vendor.saveProduct(bakeryId, null, { name: 'Tên tạo từ form', slug: 'ten-tao', basePrice: 42, customizable: false })
  await vendor.saveProduct(bakeryId, productId, { name: 'Tên đã sửa' })
  assert.equal((await vendor.getProducts(bakeryId)).result[0].name, 'Tên đã sửa')
  product.status = 'PUBLISHED'
  await vendor.changeProduct(bakeryId, product, 'hide')
  assert.equal((await vendor.getProducts(bakeryId)).result[0].status, 'HIDDEN')
})
test('Direct order idempotent replay crosses HTTP with same payload/key; conflicting retry fails', async () => {
  const key = randomUUID()
  assert.equal((await orderService.createDirectOrder(directRequest, key)).status, 'PENDING')
  assert.equal((await orderService.createDirectOrder(directRequest, key)).id, orderId)
  await assert.rejects(orderService.createDirectOrder({ ...directRequest, quantity: 3 }, key), { status: 409 })
  assert.equal(bodyByKey.size, 1)
})
test('Order transition re-fetches confirmed state/history and stale transition returns 409', async () => {
  await orderService.updateOrderStatus(orderId, 'CONFIRMED', 'Fixture confirmation')
  const fresh = await orderService.getOrderById(orderId)
  assert.equal(fresh.status, 'CONFIRMED'); assert.equal(fresh.statusHistory.at(-1).note, 'Fixture confirmation')
  await assert.rejects(orderService.updateOrderStatus(orderId, 'CONFIRMED'), { status: 409 })
})
test('Cart validation reads public catalog through Bakery proxy and creates no orders', async () => {
  assert.equal((await revalidateCartItem(cartItem)).subtotal, 220000)
  assert.equal(calls.length, 1); assert.equal(calls[0].service, 'bakery'); assert.equal(calls[0].method, 'GET'); assert.equal(calls[0].headers.authorization, undefined)
})
for (const status of [400, 401, 403, 404, 409, 500]) test('Actual HTTP/proxy ' + status + ' is not converted into mock data', async () => {
  failure = status
  await assert.rejects(vendor.getProducts(bakeryId, {}, { retryAuth: false }), { status })
  await assert.rejects(orderService.getOrders({ scope: 'mine' }, { retryAuth: false }), { status })
})
