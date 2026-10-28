import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { setAuthToken } from '../src/services/apiClient.js'
import { vendorManagementService as vendor } from '../src/services/vendorManagementService.js'
import { mapManagedProduct, productPayload, bakeryPayload, operationsPayload, productActions, memberCanEdit } from '../src/services/managementModels.js'
import { orderService } from '../src/services/orderService.js'
import { mapOrder, directOrderPayload, allowedOrderActions, ORDER_STATUSES } from '../src/services/orderModels.js'
import { revalidateCartItem, ADDRESS_BLOCKER } from '../src/services/checkoutService.js'
import { bakeryId, productId, customerId, orderId, groupId, valueId, managedProduct, publicProduct, cartItem, order, directRequest, operations, page, reply } from './fixtures/vendorOrder.js'

const nativeFetch = globalThis.fetch
let handler, calls
beforeEach(() => { calls = []; setAuthToken('isolated-fixture-token'); handler = () => { throw new Error('Unexpected request') }; globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options) } })
after(() => { globalThis.fetch = nativeFetch; setAuthToken(null) })

test('Management product maps flat ProductDto, preserves 0/false and missing fields', () => {
  const product = mapManagedProduct({ ...managedProduct, basePrice: 0 })
  assert.equal(product.basePrice, 0); assert.equal(product.customizable, false); assert.equal(product.defaultServingSize, null)
  assert.equal(mapManagedProduct({ id: productId }).basePrice, null)
  assert.throws(() => mapManagedProduct({ product: managedProduct }), { status: 502 })
  for (const field of ['revenue', 'rating', 'image', 'soldCount']) assert.equal(product[field], undefined)
})
test('Product forms strip all read-only/demo fields and preserve optional nulls on edit', () => {
  const payload = productPayload({ ...managedProduct, id: 'should-not-send', status: 'PUBLISHED', revenue: 999 })
  assert.equal(payload.basePrice, 100000); assert.equal(payload.minimumNoticeHours, 0)
  for (const field of ['id', 'status', 'revenue', 'defaultServingSize', 'categoryId']) assert.equal(payload[field], undefined)
})
test('Product creation rejects blank names/slugs, negative prices and bad numbers before HTTP', async () => {
  for (const patch of [{ name: '' }, { slug: '' }, { basePrice: -1 }, { defaultServingSize: 0 }, { minimumNoticeHours: -1 }]) await assert.rejects(vendor.saveProduct(bakeryId, null, { ...managedProduct, ...patch }), { status: 400 })
  assert.equal(calls.length, 0)
})
test('Bakery fields reject server id/status/operations, require real name/phone and validate email', () => {
  assert.deepEqual(bakeryPayload({ id: bakeryId, status: 'ACTIVE', operations: {}, name: '  Tiệm  ', phoneNumber: 'phone', email: '' }, true), { name: 'Tiệm', phoneNumber: 'phone', email: '' })
  assert.throws(() => bakeryPayload({ name: 'Tiệm' }, true), { status: 400 })
  assert.throws(() => bakeryPayload({ email: 'bad-email' }), { status: 400 })
})
test('Local membership OWNER plus platform vendor role governs editing, non-owners cannot edit', () => {
  for (const role of ['OWNER']) assert.equal(memberCanEdit({ memberRole: role, status: 'ACTIVE' }, ['BAKERY_OWNER']), true)
  assert.equal(memberCanEdit({ memberRole: 'INVALID', status: 'ACTIVE' }, ['BAKERY_OWNER']), false)
  assert.equal(memberCanEdit({ memberRole: 'OWNER', status: 'INACTIVE' }, ['BAKERY_OWNER']), false)
  assert.equal(memberCanEdit(null, ['BAKERY_OWNER']), false)
})
test('Product lifecycle follows backend publish/hide/archive rules', async () => {
  assert.deepEqual(productActions('DRAFT'), ['publish', 'archive']); assert.deepEqual(productActions('PUBLISHED'), ['hide', 'archive']); assert.deepEqual(productActions('ARCHIVED'), [])
  await assert.rejects(vendor.changeProduct(bakeryId, managedProduct, 'hide'), { status: 409 }); assert.equal(calls.length, 0)
})
test('Operations replacement converts number inputs, preserves IDs and rejects incomplete/duplicate data', () => {
  const body = operationsPayload(operations)
  assert.equal(body.serviceAreas[0].deliveryFee, 12000); assert.equal(body.businessHours[0].dayOfWeek, 1); assert.equal(body.addresses[0].id, undefined)
  assert.throws(() => operationsPayload({ addresses: [] }), { status: 400 })
  assert.throws(() => operationsPayload({ ...operations, serviceAreas: [...operations.serviceAreas, ...operations.serviceAreas] }), { status: 422 })
  assert.throws(() => operationsPayload({ ...operations, addresses: [...operations.addresses, ...operations.addresses] }), { status: 422 })
  assert.throws(() => operationsPayload({ ...operations, businessHours: [{ ...operations.businessHours[0], closesAt: '07:00' }] }), { status: 422 })
})
test('Managed products request real bakery endpoint with JWT and supported query fields', async () => {
  handler = () => reply(page([managedProduct], { page: 2, total: 12, pages: 2 }))
  const result = await vendor.getProducts(bakeryId, { query: 'Bánh', status: 'DRAFT', page: 2, size: 10, sort: 'basePrice,asc', unsupported: 'ignored' })
  assert.equal(result.meta.page, 2); assert.equal(result.result[0].name, managedProduct.name)
  const url = new URL(calls[0].url, 'http://fixture'); assert.equal(url.pathname, '/api/v1/bakeries/' + bakeryId + '/products'); assert.equal(url.searchParams.get('sort'), 'basePrice,asc'); assert.equal(url.searchParams.has('unsupported'), false)
  assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer isolated-fixture-token')
})
test('Managed empty products/categories remain empty; malformed envelopes fail', async () => {
  handler = () => reply(page([])); assert.deepEqual((await vendor.getProducts(bakeryId)).result, [])
  handler = () => reply([]); assert.deepEqual(await vendor.getCategories(bakeryId), [])
  handler = () => reply({ results: [managedProduct] }); await assert.rejects(vendor.getProducts(bakeryId), { status: 502 }); await assert.rejects(vendor.getCategories(bakeryId), { status: 502 })
})
test('Membership is resolved from backend self member and never inferred from platform OWNER', async () => {
  handler = () => reply([{ userId: customerId, memberRole: 'OWNER', status: 'ACTIVE' }])
  assert.equal((await vendor.getMembership(bakeryId, customerId)).memberRole, 'OWNER')
  assert.equal(await vendor.getMembership(bakeryId, randomUUID()), null)
})
test('Bakery create/patch and product create/patch send writable payloads only', async () => {
  handler = (url) => reply(url.endsWith('/products') || url.includes('/products/') ? managedProduct : { id: bakeryId, status: 'DRAFT' }, 201)
  await vendor.createBakery({ name: 'Tiệm', phoneNumber: 'phone', ownerUserId: randomUUID(), status: 'ACTIVE' })
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: 'Tiệm', phoneNumber: 'phone' })
  await vendor.updateBakery(bakeryId, { name: 'Tên mới', status: 'ACTIVE' }); assert.equal(calls[1].options.method, 'PATCH')
  await vendor.saveProduct(bakeryId, null, managedProduct); await vendor.saveProduct(bakeryId, productId, managedProduct)
  assert.equal(calls[2].options.method, 'POST'); assert.equal(calls[3].options.method, 'PATCH')
  assert.equal(JSON.parse(calls[2].options.body).status, undefined)
})
test('Image uploads use correct multipart file/files parts and leave boundary to fetch', async () => {
  const file = new File(['fixture'], 'fixture.png', { type: 'image/png' })
  handler = () => reply([{ id: randomUUID(), primary: true }], 201)
  await vendor.uploadProductImages(bakeryId, productId, [file]); assert.equal(calls[0].options.body.getAll('files').length, 1); assert.equal(calls[0].options.headers.has('Content-Type'), false)
  handler = () => reply({ url: 'https://fixture.invalid/image' }, 201)
  await vendor.uploadBakeryImage(bakeryId, 'logo', file); assert.equal(calls[1].options.body.get('file').name, 'fixture.png')
  await assert.rejects(vendor.uploadProductImages(bakeryId, productId, []), { status: 400 })
  await assert.rejects(vendor.uploadBakeryImage(bakeryId, 'logo', new File(['x'], 'x.pdf', { type: 'application/pdf' })), { status: 400 })
})
test('Orders use result/meta and explicit mine/bakery scopes without mock fallback', async () => {
  handler = () => reply(page([order], { page: 3, total: 21, pages: 3 }))
  const result = await orderService.getOrders({ scope: 'bakery', bakeryId, page: 3, size: 10, status: 'PENDING', orderSource: 'DIRECT_CATALOG', createdFrom: '2026-01-01T00:00:00Z', sort: 'neededAt,asc' })
  assert.equal(result.meta.total, 21); assert.equal(result.result[0].totalAmount, 220000); assert.equal(result.result[0].items, undefined)
  assert.match(calls[0].url, /scope=bakery/); assert.match(calls[0].url, /createdFrom=/)
  handler = () => reply(page([])); assert.deepEqual((await orderService.getOrders({ scope: 'mine' })).result, [])
})
test('Order detail maps immutable items/address/history and preserves missing amounts', async () => {
  handler = () => reply(order)
  const result = await orderService.getOrderById(orderId)
  assert.equal(result.deliveryAddress.addressLine, order.deliveryAddress.addressLine); assert.equal(result.items[0].unitPrice, 105000); assert.equal(result.statusHistory[0].toStatus, 'PENDING')
  assert.equal(mapOrder({ id: orderId, bakeryId, customerId }).totalAmount, null)
  assert.throws(() => mapOrder({ ...order, items: null }, true), { status: 502 })
})
test('Vendor order list rejects data returned for another bakery', async () => {
  handler = () => reply(page([{ ...order, bakeryId: randomUUID() }]))
  await assert.rejects(orderService.getOrders({ scope: 'bakery', bakeryId }), { status: 502 })
})
test('Customer actions are cancellation only before baking; Vendor follows exact state machine', () => {
  const customer = { id: customerId, roles: ['CUSTOMER'] }, vendorUser = { id: randomUUID(), roles: ['BAKERY_OWNER'] }
  assert.deepEqual(allowedOrderActions(order, customer, 'mine'), ['CANCELLED'])
  assert.deepEqual(allowedOrderActions({ ...order, status: 'BAKING' }, customer, 'mine'), [])
  assert.deepEqual(allowedOrderActions({ ...order, status: 'BAKING' }, vendorUser, 'bakery'), ['READY'])
  for (const status of ['COMPLETED', 'CANCELLED', 'NEW']) assert.deepEqual(allowedOrderActions({ ...order, status }, vendorUser, 'bakery'), [])
  assert.equal(ORDER_STATUSES.includes('NEW'), false)
  assert.deepEqual(allowedOrderActions(order, { ...customer, roles: ['CUSTOMER', 'BAKERY_OWNER'] }, 'bakery'), ['CANCELLED'])
})
test('Direct checkout requires deliveryAddressId; never generates missing IDs or accepts negative quantity', async () => {
  await assert.rejects(orderService.createDirectOrder({ ...directRequest, deliveryAddressId: undefined }, randomUUID()), { status: 400 })
  await assert.rejects(orderService.createDirectOrder({ ...directRequest, quantity: 0 }, randomUUID()), { status: 422 })
  await assert.rejects(orderService.createDirectOrder({ ...directRequest, requestedDeliveryAt: '2000-01-01' }, randomUUID()), { status: 422 })
  assert.equal(calls.length, 0); assert.match(ADDRESS_BLOCKER, /deliveryAddressId/)
})
test('Order creation sends exact contract, excludes client prices/address/payment and preserves retry key', async () => {
  const key = randomUUID(); handler = () => reply(order, 201)
  const input = { ...directRequest, totalAmount: 1, deliveryFee: 0, status: 'COMPLETED', paymentStatus: 'PAID', deliveryAddress: { addressLine: 'fake' } }
  const result = await orderService.createDirectOrder(input, key); await orderService.createDirectOrder(input, key)
  assert.equal(result.status, 'PENDING')
  for (const call of calls) { assert.equal(call.options.headers.get('Idempotency-Key'), key); assert.deepEqual(JSON.parse(call.options.body), directOrderPayload(directRequest)) }
})
test('Transition sends targetStatus/reason only and rejects mock enum before HTTP', async () => {
  await assert.rejects(orderService.updateOrderStatus(orderId, 'NEW'), { status: 400 })
  handler = () => reply({ ...order, status: 'CONFIRMED' })
  await orderService.updateOrderStatus(orderId, 'CONFIRMED', 'Ghi chú thật')
  assert.deepEqual(JSON.parse(calls[0].options.body), { targetStatus: 'CONFIRMED', reason: 'Ghi chú thật' })
  assert.match(calls[0].url, /status-transitions$/)
})
test('Checkout re-fetches public product, ignores cached price and computes cake/add-on quantities correctly', async () => {
  handler = () => reply(publicProduct)
  const result = await revalidateCartItem(cartItem)
  assert.equal(result.subtotal, 220000); assert.equal(result.product.title, managedProduct.name)
  assert.equal(calls[0].url, '/api/v1/products/' + productId); assert.equal(calls[0].options.headers.has('Authorization'), false)
})
test('Checkout rejects missing product, changed bakery, unavailable options and add-ons', async () => {
  handler = () => reply(null, 404); await assert.rejects(revalidateCartItem(cartItem), { status: 404 })
  handler = () => reply({ ...publicProduct, bakeryId: randomUUID() }); await assert.rejects(revalidateCartItem(cartItem), { status: 409 })
  handler = () => reply(publicProduct)
  await assert.rejects(revalidateCartItem({ ...cartItem, optionSelections: [] }), { status: 422 })
  await assert.rejects(revalidateCartItem({ ...cartItem, optionSelections: [{ optionGroupId: groupId, optionValueIds: [randomUUID()] }] }), { status: 422 })
  await assert.rejects(revalidateCartItem({ ...cartItem, addOns: [{ addOnId: randomUUID(), quantity: 1 }] }), { status: 422 })
  await assert.rejects(revalidateCartItem({ ...cartItem, productId: '#DEMO' }), { status: 400 })
})
test('Duplicate option selections and add-ons cannot be posted as valid direct orders', () => {
  assert.throws(() => directOrderPayload({ ...directRequest, optionSelections: [{ optionGroupId: groupId, optionValueIds: [valueId, valueId] }] }), { status: 422 })
  assert.throws(() => directOrderPayload({ ...directRequest, addOns: [...directRequest.addOns, ...directRequest.addOns] }), { status: 422 })
})
test('Incomplete checkout DTO never treats absent options/add-ons as empty configuration', async () => {
  handler = () => reply({ ...publicProduct, options: undefined })
  await assert.rejects(revalidateCartItem(cartItem), { status: 502 })
  handler = () => reply({ ...publicProduct, product: { ...publicProduct.product, basePrice: null } })
  await assert.rejects(revalidateCartItem(cartItem), { status: 422 })
})
for (const status of [400, 401, 403, 404, 409, 422, 500]) test('Vendor/Order HTTP ' + status + ' is exposed without fake success or empty fallback', async () => {
  handler = () => reply(null, status)
  await assert.rejects(vendor.getProducts(bakeryId, {}, { retryAuth: false }), { status })
  await assert.rejects(orderService.getOrders({ scope: 'mine' }, { retryAuth: false }), { status })
  await assert.rejects(orderService.createDirectOrder(directRequest, randomUUID()), { status })
})
test('Network failures never create local orders or fabricate product status', async () => {
  handler = () => { throw new TypeError('Offline') }
  await assert.rejects(vendor.getProducts(bakeryId), { status: 0 })
  await assert.rejects(orderService.getOrderById(orderId), { status: 0 })
  await assert.rejects(orderService.createDirectOrder(directRequest, randomUUID()), { status: 0 })
  await assert.rejects(orderService.updateOrderStatus(orderId, 'CONFIRMED'), { status: 0 })
})
