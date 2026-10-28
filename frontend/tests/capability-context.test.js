import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { targetedRequestRoute, requestContextFromSearch, validTargetedSelection } from '../src/services/requestContextModels.js'
import { cakeService } from '../src/services/cakeService.js'
import { rfqService } from '../src/services/rfqService.js'
import { canAccess } from '../src/routes/routeAccess.js'
import { setAuthToken } from '../src/services/apiClient.js'
import * as catalog from './fixtures/vendorOrder.js'
import * as market from './fixtures/marketplace.js'

const nativeFetch = globalThis.fetch
let calls, handler
const reply = (data, status = 200) => Response.json({ data, statusCode: status, message: 'Isolated capability fixture' }, { status })
const dto = { ...catalog.publicProduct, product: { ...catalog.publicProduct.product, customizable: true } }
beforeEach(() => { calls = []; setAuthToken('capability-fixture'); handler = () => reply(null, 500); globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options) } })
after(() => { globalThis.fetch = nativeFetch; setAuthToken(null) })
const values = () => ({ ...market.input, requestType: 'TARGETED_PRODUCT_CUSTOM', targetBakeryId: catalog.bakeryId, baseProductId: catalog.productId, optionSelections: [{ optionGroupId: catalog.groupId, optionValueId: catalog.valueId, quantity: 1 }] })

test('Catalog to RFQ context carries only real product/bakery IDs, never role/user/price from URL', async () => {
  handler = () => reply(dto)
  const product = await cakeService.getCakeById(catalog.productId)
  const route = targetedRequestRoute(product)
  const context = requestContextFromSearch(route.slice(route.indexOf('?')) + '&role=ADMIN&price=1&customerId=bad')
  assert.deepEqual(context, { requestType: 'TARGETED_PRODUCT_CUSTOM', baseProductId: catalog.productId, targetBakeryId: catalog.bakeryId })
  assert.equal(calls[0].url, '/api/v1/products/' + catalog.productId)
  assert.equal(calls[0].options.headers.has('Authorization'), false)
})
test('Context rejects partial/invalid IDs and non-customizable products without sending HTTP', () => {
  assert.deepEqual(requestContextFromSearch(''), {})
  for (const query of ['?baseProductId=bad', '?baseProductId=' + catalog.productId]) assert.throws(() => requestContextFromSearch(query), { status: 400 })
  assert.throws(() => targetedRequestRoute({ id: catalog.productId, bakeryId: catalog.bakeryId, customizable: false }), { status: 422 })
  assert.equal(calls.length, 0)
})
test('Verified product snapshot validates owner bakery, required options, active values and duplicate selections', async () => {
  handler = () => reply(dto)
  const product = await cakeService.getCakeById(catalog.productId)
  assert.equal(validTargetedSelection(product, values()), true)
  assert.equal(validTargetedSelection(null, values()), false)
  assert.equal(validTargetedSelection(product, { ...values(), targetBakeryId: market.bakeryId }), false)
  assert.equal(validTargetedSelection(product, { ...values(), optionSelections: [] }), false)
  assert.equal(validTargetedSelection(product, { ...values(), optionSelections: [...values().optionSelections, ...values().optionSelections] }), false)
  assert.equal(validTargetedSelection({ ...product, optionGroups: product.optionGroups.map((group) => ({ ...group, values: group.values.map((value) => ({ ...value, active: false })) })) }, values()), false)
})
test('Targeted RFQ POST sends exact IDs/options DTO with JWT and only accepts backend DRAFT response', async () => {
  handler = () => reply({ ...market.request, ...values(), status: 'DRAFT' }, 201)
  const result = await rfqService.createRfq({ ...values(), role: 'ADMIN', price: 1 })
  assert.equal(calls[0].url, '/api/v1/cake-requests'); assert.equal(calls[0].options.method, 'POST')
  const body = JSON.parse(calls[0].options.body)
  assert.equal(body.baseProductId, catalog.productId); assert.deepEqual(body.optionSelections, values().optionSelections)
  assert.equal(body.role, undefined); assert.equal(body.price, undefined)
  assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer capability-fixture')
  assert.equal(result.status, 'DRAFT')
})
test('RFQ picker uses scoped API pagination rather than a local array or invented IDs', async () => {
  handler = () => reply(market.page([market.request], { page: 2, pageSize: 6, total: 37, pages: 7 }))
  const result = await rfqService.getRfqs({ scope: 'mine', page: 2, size: 6, sort: 'createdAt,desc' })
  const query = new URL(calls[0].url, 'http://fixture').searchParams
  assert.equal(query.get('scope'), 'mine'); assert.equal(query.get('page'), '2'); assert.equal(query.get('size'), '6')
  assert.equal(result.meta.total, 37); assert.equal(result.result[0].id, market.requestId)
})
test('RFQ creation route preserves CUSTOMER permission and never grants it from context', () => {
  assert.equal(canAccess('rfq-new', { roles: ['CUSTOMER'] }), true)
  for (const role of ['ADMIN', 'BAKERY_OWNER']) assert.equal(canAccess('rfq-new', { roles: [role] }), false)
})
for (const status of [400, 401, 403, 404, 409, 422, 500, 503]) test('Context API HTTP ' + status + ' stays an error without mock or success', async () => {
  handler = () => reply(null, status)
  await assert.rejects(cakeService.getCakeById(catalog.productId), { status })
  await assert.rejects(rfqService.createRfq(values()), { status })
})
test('Offline catalog/request context never produces a fake RFQ', async () => {
  handler = () => { throw new TypeError('fixture offline') }
  await assert.rejects(cakeService.getCakeById(catalog.productId), { status: 0 })
  await assert.rejects(rfqService.createRfq(values()), { status: 0 })
})
