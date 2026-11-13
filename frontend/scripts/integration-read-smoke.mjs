// Read-only verification against existing services through the actual FE proxy.
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { mapCatalogPage, mapProduct, mapBakery } from '../src/services/catalogModels.js'
import { mapSubscriptionPlan } from '../src/services/subscriptionModels.js'

const server = await createServer({
  logLevel: 'silent', server: { host: '127.0.0.1', port: 0, hmr: false, ws: false },
})
let checks = 0
try {
  await server.listen()
  const origin = 'http://127.0.0.1:' + server.httpServer.address().port
  async function read(path, expectedStatus = 200) {
    const response = await fetch(origin + '/api/v1' + path, {
      signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' },
    })
    assert.equal(response.status, expectedStatus, path + ': unexpected HTTP status')
    assert.match(response.headers.get('content-type') || '', /application\/json/i, path)
    const body = await response.json()
    checks++
    console.log(`PASS GET ${path}: ${response.status}`)
    return body.data
  }
  const products = mapCatalogPage(await read('/products?page=1&size=2'), mapProduct)
  const bakeries = mapCatalogPage(await read('/bakeries?page=1&size=2'), mapBakery)
  const plans = await read('/subscription-plans')
  assert.ok(Array.isArray(plans), 'Plans must be an array')
  plans.forEach(mapSubscriptionPlan)
  if (products.result.length) mapProduct(await read('/products/' + products.result[0].id))
  if (bakeries.result.length) mapBakery(await read('/bakeries/' + bakeries.result[0].id))
  for (const path of ['/auth/me', '/orders?scope=mine', '/cake-requests?scope=mine', '/offers?scope=sent', '/generation-jobs', '/conversations', '/admin/bakeries', '/admin/bakery-payments', '/admin/subscription-plans']) await read(path, 401)
  console.log(`${checks} read-only checks passed; products=${products.meta.total}; bakeries=${bakeries.meta.total}; plans=${plans.length}.`)
  console.log('Authenticated CRUD, uploads and paid AI generation are not exercised by this read-only smoke test.')
} finally {
  await server.close()
}
