import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { subscriptionService as service } from '../src/services/subscriptionService.js'
import { setAuthToken } from '../src/services/apiClient.js'
import { mapSubscriptionPlan, mapBakerySubscription, mapSubscriptionOrders, subscriptionPermissions, canOrderPlan, canSubmitSubscriptionPayment } from '../src/services/subscriptionModels.js'
import { requiredRoles } from '../src/routes/routeAccess.js'

const bakeryId = randomUUID(), planId = randomUUID(), orderId = randomUUID(), key = randomUUID()
const plan = { id: planId, code: 'BASIC', name: 'Tên từ API', description: 'Mô tả từ API', monthlyPrice: '123456.00', currency: 'VND', billingPeriodMonths: 2, status: 'ACTIVE', features: { MAX_PRODUCTS: '20', FEATURED_LISTING: 'false' } }
const order = { id: orderId, bakeryId, planId, status: 'PENDING_PAYMENT', totalAmount: '246912.00', currency: 'VND', expiresAt: '2099-01-01T00:00:00Z', featuresSnapshot: {}, payments: [] }
const envelope = (data, status = 200) => Response.json({ data, statusCode: status, message: 'Subscription response' }, { status })
const nativeFetch = globalThis.fetch
let calls, handler
beforeEach(() => { calls = []; setAuthToken('unit-test-token'); handler = () => { throw new Error('Unexpected request') }; globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options) } })
after(() => { globalThis.fetch = nativeFetch; setAuthToken(null) })

test('Plans read public API array and map prices/features without hardcoded tier defaults', async () => {
  handler = () => envelope([plan])
  const result = await service.getPlans()
  assert.equal(result[0].monthlyPrice, 123456); assert.equal(result[0].billingPeriodMonths, 2)
  assert.deepEqual(result[0].features, plan.features); assert.equal(result[0].description, plan.description)
  assert.equal(calls[0].url, '/api/v1/subscription-plans'); assert.equal(calls[0].options.headers.has('Authorization'), false)
  assert.equal(calls[0].options.credentials, 'include')
})
test('Missing fields disable purchase and never invent price/status/features', () => {
  const missing = mapSubscriptionPlan({ id: planId })
  assert.equal(missing.monthlyPrice, null); assert.equal(missing.status, null); assert.deepEqual(missing.features, {})
  assert.equal(canOrderPlan(missing), false)
  assert.equal(mapSubscriptionPlan({ ...plan, monthlyPrice: 0 }).monthlyPrice, 0)
  assert.throws(() => mapSubscriptionPlan({ ...plan, features: { unknown: true } }), { status: 502 })
})
test('Empty plans return empty and incorrect result envelope is rejected', async () => {
  handler = () => envelope([]); assert.deepEqual(await service.getPlans(), [])
  handler = () => envelope({ result: [plan] }); await assert.rejects(service.getPlans(), { status: 502 })
})
test('Plan detail uses actual UUID endpoint', async () => {
  handler = () => envelope(plan); assert.equal((await service.getPlan(planId)).id, planId)
  assert.equal(calls[0].url, '/api/v1/subscription-plans/' + planId)
})
test('Only owners can purchase; admins can read subscription history', () => {
  assert.deepEqual(subscriptionPermissions(['ADMIN']), { canRead: true, canPurchase: false })
  assert.equal(subscriptionPermissions(['BAKERY_OWNER']).canPurchase, true)
  assert.equal(subscriptionPermissions(['CUSTOMER']).canRead, false)
  assert.deepEqual(requiredRoles('vendor-subscription'), ['BAKERY_OWNER'])
})
test('Subscription uses Bearer JWT and preserves absent current/scheduled periods', async () => {
  handler = () => envelope({ bakeryId, currentSubscription: null, scheduledSubscription: null, features: {} })
  const result = await service.getBakerySubscription(bakeryId)
  assert.equal(result.currentSubscription, null); assert.equal(result.scheduledSubscription, null)
  assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer unit-test-token')
  assert.equal(calls[0].url, '/api/v1/bakeries/' + bakeryId + '/subscription')
  assert.throws(() => mapBakerySubscription({}), { status: 502 })
})
test('Order history forwards only supported pagination/filter/sort fields and validates meta', async () => {
  const data = { result: [order], meta: { page: 2, pageSize: 10, pages: 3, total: 21 } }
  handler = () => envelope(data)
  const result = await service.getOrders(bakeryId, { page: 2, size: 10, sort: 'createdAt,asc', status: 'PAYMENT_REVIEW', unsupported: 'ignore' })
  assert.equal(result.meta.page, 2); assert.equal(result.result[0].totalAmount, 246912)
  const query = new URL(calls[0].url, 'http://test').searchParams
  assert.equal(query.get('status'), 'PAYMENT_REVIEW'); assert.equal(query.get('sort'), 'createdAt,asc'); assert.equal(query.has('unsupported'), false)
  assert.throws(() => mapSubscriptionOrders({ result: [], meta: {} }), { status: 502 })
})
test('Wrong bakery data is rejected for subscription/history/detail', async () => {
  handler = () => envelope({ bakeryId: randomUUID() }); await assert.rejects(service.getBakerySubscription(bakeryId), { status: 502 })
  handler = () => envelope({ result: [{ ...order, bakeryId: randomUUID() }], meta: { page: 1, pageSize: 10, pages: 1, total: 1 } }); await assert.rejects(service.getOrders(bakeryId), { status: 502 })
  handler = () => envelope({ ...order, bakeryId: randomUUID() }); await assert.rejects(service.getOrder(orderId, bakeryId), { status: 403 })
})
test('Create order sends only planId and reuses supplied idempotency key on retry; no local ACTIVE', async () => {
  handler = () => envelope(order, 201)
  const first = await service.createOrder({ bakeryId, planId, key }); await service.createOrder({ bakeryId, planId, key })
  assert.equal(first.status, 'PENDING_PAYMENT'); assert.equal(first.period, null)
  for (const call of calls) { assert.deepEqual(JSON.parse(call.options.body), { planId }); assert.equal(call.options.headers.get('Idempotency-Key'), key) }
})
test('Detailed order carries backend payment history and actual period', async () => {
  handler = () => envelope({ ...order, status: 'COMPLETED', payments: [{ id: randomUUID(), amount: '246912', status: 'APPROVED' }], period: { id: randomUUID(), status: 'SCHEDULED' } })
  const result = await service.getOrder(orderId, bakeryId)
  assert.equal(result.payments[0].status, 'APPROVED'); assert.equal(result.period.status, 'SCHEDULED')
})
test('Only owner with unexpired pending order can submit payment', () => {
  assert.equal(canSubmitSubscriptionPayment(['BAKERY_OWNER'], order), true)
  for (const status of ['PAYMENT_REVIEW', 'COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED']) assert.equal(canSubmitSubscriptionPayment(['BAKERY_OWNER'], { ...order, status }), false)
  assert.equal(canSubmitSubscriptionPayment(['CUSTOMER'], order), false)
  assert.equal(canSubmitSubscriptionPayment(['BAKERY_OWNER'], { ...order, expiresAt: '2000-01-01' }), false)
})
test('Payment multipart contains writable metadata/proof, exact snapshot amount and idempotency key', async () => {
  handler = () => envelope({ id: randomUUID(), subscriptionOrderId: orderId, status: 'SUBMITTED' }, 201)
  const proof = new File(['proof fixture'], 'test.pdf', { type: 'application/pdf' })
  const result = await service.submitPayment({ orderId, key, amount: 246912, currency: 'VND', paymentMethod: 'BANK_TRANSFER', paymentReference: 'fixture-not-a-real-transfer', proof })
  const { options } = calls[0]
  assert.equal(result.status, 'SUBMITTED'); assert.equal(result.period, undefined)
  assert.equal(options.headers.get('Idempotency-Key'), key); assert.equal(options.headers.has('Content-Type'), false)
  assert.deepEqual(JSON.parse(await options.body.get('metadata').text()), { amount: 246912, currency: 'VND', paymentMethod: 'BANK_TRANSFER', paymentReference: 'fixture-not-a-real-transfer' })
  assert.equal(options.body.get('proof').name, 'test.pdf')
})
test('No fabricated payment reference; missing proof/reference and bad file are rejected without fetch', async () => {
  const request = { orderId, key, amount: 1, currency: 'VND', paymentMethod: 'TRANSFER' }
  await assert.rejects(service.submitPayment(request), { status: 422 })
  await assert.rejects(service.submitPayment({ ...request, proof: new File(['x'], 'x.txt', { type: 'text/plain' }) }), { status: 400 })
  assert.equal(calls.length, 0)
})
for (const status of [401, 403, 404, 409, 422, 500]) test('HTTP ' + status + ' propagates without mock subscription fallback', async () => {
  handler = () => envelope(null, status)
  await assert.rejects(service.getBakerySubscription(bakeryId, { retryAuth: false }), { status })
  await assert.rejects(service.getPlans(), { status })
})
test('Offline/abort and malformed UUID propagate without fallback or network writes', async () => {
  handler = () => { throw new TypeError('Network unavailable') }
  await assert.rejects(service.getPlans())
  await assert.rejects(service.getOrders('not-a-uuid'), { status: 400 })
  assert.equal(calls.length, 1)
})
test('Aborted subscription request is not replaced by a mock response', async () => {
  handler = () => { throw new DOMException('Aborted', 'AbortError') }
  await assert.rejects(service.getPlans(), { name: 'AbortError' })
})
test('Payment retry after a lost response keeps identical metadata and idempotency key', async () => {
  const request = { orderId, key, amount: 246912, currency: 'VND', paymentMethod: 'TRANSFER', paymentReference: 'isolated-fixture-reference' }
  handler = () => { throw new TypeError('Lost response') }
  await assert.rejects(service.submitPayment(request))
  handler = () => envelope({ id: randomUUID(), subscriptionOrderId: orderId, status: 'SUBMITTED' }, 201)
  assert.equal((await service.submitPayment(request)).status, 'SUBMITTED')
  assert.equal(calls[0].options.headers.get('Idempotency-Key'), calls[1].options.headers.get('Idempotency-Key'))
  assert.equal(await calls[0].options.body.get('metadata').text(), await calls[1].options.body.get('metadata').text())
})
test('Malformed nested periods and payment items fail as API data errors', async () => {
  assert.throws(() => mapBakerySubscription({ bakeryId, currentSubscription: {} }), { status: 502 })
  handler = () => envelope({ ...order, payments: [null] })
  await assert.rejects(service.getOrder(orderId, bakeryId), { status: 502 })
})

test('Payment rejects non-finite amounts and invalid currency length before multipart write', async () => {
  for (const patch of [{ amount: Infinity }, { amount: 'Infinity' }, { currency: 'VN' }, { currency: 123 }]) {
    await assert.rejects(service.submitPayment({ orderId, amount: 199000, currency: 'VND', paymentMethod: 'Fixture transfer', paymentReference: 'Fixture reference', key, ...patch }), { status: 400 })
  }
  assert.equal(calls.length, 0)
})
