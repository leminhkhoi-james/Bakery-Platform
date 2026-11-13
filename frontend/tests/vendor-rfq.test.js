import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { loadVendorRequests, loadVendorOffers, loadExistingVendorOffer } from '../src/services/vendorRfqService.js'
import { requestMatchesBakery } from '../src/services/vendorRfqModels.js'
import { createDemoStore } from '../src/mockData/store.js'
import { createDemoTransport } from '../src/mockData/transport.js'
import { rfqService } from '../src/services/rfqService.js'
const nativeFetch = globalThis.fetch
after(() => { globalThis.fetch = nativeFetch })
const id = (i) => 'ab000000-0000-4000-8000-' + String(i).padStart(12, '0')
const bakery = { id: id(1), operations: { serviceAreas: [{ city: 'TP. Hồ Chí Minh', district: 'Quận 1', active: true }] } }
const row = (i, district = 'Quận 1') => ({ id: id(i), title: 'Bánh ' + i, status: 'OPEN', deliveryCity: 'TP. Hồ Chí Minh', deliveryDistrict: district })
const reply = (result, page = 1, pages = 1, total = result.length) => Response.json({ data: { result, meta: { page, pageSize: 100, pages, total } } })

test('Chosen shop visibility respects active service areas, target and status', () => {
  assert.equal(requestMatchesBakery(row(2), bakery), true)
  assert.equal(requestMatchesBakery(row(2, 'Bình Thạnh'), bakery), false)
  assert.equal(requestMatchesBakery({ ...row(2), targetBakeryId: id(3) }, bakery), false)
  assert.equal(requestMatchesBakery({ ...row(2, 'Bình Thạnh'), targetBakeryId: bakery.id }, bakery), true)
  assert.equal(requestMatchesBakery(row(2), { ...bakery, status: 'PENDING_APPROVAL' }), false)
  assert.equal(requestMatchesBakery(row(2), { ...bakery, operations: { serviceAreas: [{ city: 'TP. Hồ Chí Minh', district: 'Quận 1', active: false }] } }), false)
})

test('Filter before pagination includes selected-shop requests on later API pages without inventing a bakery filter', async () => {
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options }); const query = new URL(url, 'http://local').searchParams
    return query.get('page') === '1' ? reply([row(2, 'Bình Thạnh')], 1, 2, 2) : reply([row(3)], 2, 2, 2)
  }
  const data = await loadVendorRequests({ bakery, page: 1, size: 12, sort: 'neededAt,asc', status: 'OPEN' })
  assert.equal(data.meta.total, 1); assert.equal(data.result[0].id, id(3)); assert.equal(calls.length, 2)
  assert.equal(calls[0].options.allowMockFallback, false)
  const query = new URL(calls[0].url, 'http://local').searchParams
  assert.equal(query.get('scope'), 'available'); assert.equal(query.get('sort'), 'neededAt,asc'); assert.equal(query.has('bakeryId'), false)
})

test('Selected-shop pagination has an accurate second page, with no mixed-source requests', async () => {
  globalThis.fetch = async () => reply(Array.from({ length: 13 }, (_, i) => row(100 + i)))
  const result = await loadVendorRequests({ bakery, page: 2, size: 12 })
  assert.equal(result.meta.pages, 2); assert.equal(result.meta.total, 13)
  assert.equal(result.result.length, 1); assert.equal(result.result[0].id, id(112))
  const localBakery = { ...bakery, id: 'de000000-0000-4000-8000-000000000010' }
  assert.equal((await loadVendorRequests({ bakery: localBakery })).meta.total, 0)
})

test('Empty real RFQ and sent offers are not replaced by local records; server and permission errors remain failures', async () => {
  const user = { id: id(20), roles: ['BAKERY_OWNER'] }
  let status = 200
  const runtime = createDemoTransport({ getUser: () => user, fetch: async () => status === 200 ? reply([], 1, 0) : Response.json({ message: 'failure' }, { status }) })
  globalThis.fetch = runtime.fetch
  assert.equal((await loadVendorRequests({ bakery })).meta.total, 0)
  assert.equal((await loadVendorOffers({ bakeryId: bakery.id })).meta.total, 0)
  for (status of [401, 403, 500]) await assert.rejects(loadVendorRequests({ bakery }, { retryAuth: false }), { status })
})

test('Sent offers use actual request titles and reject cross-shop rows', async () => {
  const offer = { id: id(5), bakeryId: bakery.id, cakeRequestId: id(3), status: 'PENDING', totalPrice: 500000 }
  globalThis.fetch = async (url) => url.includes('/offers?') ? reply([offer]) : Response.json({ data: { ...row(3), customerId: id(20), images: [], statusHistory: [], optionSelections: [], offers: [] } })
  const result = await loadVendorOffers({ bakeryId: bakery.id })
  assert.equal(result.result[0].requestTitle, 'Bánh 3')
  assert.equal((await loadExistingVendorOffer({ bakeryId: bakery.id, cakeRequestId: id(3) })).id, offer.id)
  globalThis.fetch = async () => reply([{ ...offer, bakeryId: id(7) }])
  await assert.rejects(loadVendorOffers({ bakeryId: bakery.id }), { status: 502 })
})

test('Existing mock graph enforces one offer per shop/request and selected service area without backend writes', async () => {
  const user = { id: id(20), roles: ['BAKERY_OWNER'] }, store = createDemoStore(); store.bind(user)
  let writes = 0
  const transport = createDemoTransport({ store, getUser: () => user, fetch: async (_url, options) => { if (options.method !== 'GET') writes++; return reply([], 1, 0) } })
  globalThis.fetch = transport.fetch
  const shop = store.state.bakeries[0]
  const list = await loadVendorRequests({ bakery: shop })
  assert.ok(list.result.length > 0); assert.ok(list.result.every((r) => r.deliveryDistrict === 'Quận 1'))
  const request = list.result.find((request) => !store.state.offers.some((o) => o.bakeryId === shop.id && o.cakeRequestId === request.id))
  assert.ok(request)
  const input = { bakeryId: shop.id, cakePrice: 500000, deliveryFee: 30000, estimatedCompletionAt: new Date(Date.now() + 3600000).toISOString(), expiresAt: new Date(Date.now() + 7200000).toISOString(), items: [] }
  const offer = await rfqService.submitOffer(request.id, input)
  assert.equal(offer.status, 'PENDING')
  await assert.rejects(rfqService.submitOffer(request.id, input), { status: 409 })
  assert.equal(store.state.offers.filter((o) => o.cakeRequestId === request.id && o.bakeryId === shop.id).length, 1)
  assert.equal((await loadVendorOffers({ bakeryId: shop.id, page: 1, size: 12 })).result.find((o) => o.id === offer.id).requestTitle, request.title)
  assert.equal(writes, 0)
})
