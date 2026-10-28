import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { publicationAdminService as admin, bakeryTransitions, mapAdminBakery, mapBakeryPayment, canApprovePayment } from '../src/services/publicationAdminService.js'
import { vendorManagementService as vendor } from '../src/services/vendorManagementService.js'
import { setAuthToken } from '../src/services/apiClient.js'
import { canAccess } from '../src/routes/routeAccess.js'

const bakeryId = randomUUID(), orderId = randomUUID(), paymentId = randomUUID(), key = randomUUID()
const bakery = { id: bakeryId, name: 'Fixture only', status: 'PENDING_APPROVAL', operations: { addresses: [{ isPrimary: true }], serviceAreas: [{ active: true }], businessHours: [] } }
const order = { id: orderId, bakeryId, status: 'PAYMENT_REVIEW', totalAmount: 199000, currency: 'VND' }
const payment = { id: paymentId, subscriptionOrderId: orderId, amount: 199000, currency: 'VND', status: 'SUBMITTED' }
const page = (result) => ({ result, meta: { page: 1, pageSize: 20, pages: result.length ? 1 : 0, total: result.length } })
const reply = (data, status = 200) => Response.json({ data, statusCode: status, message: 'Isolated HTTP fixture' }, { status })
const nativeFetch = globalThis.fetch
let handler, calls
beforeEach(() => { calls = []; setAuthToken('isolated-test-token'); handler = () => reply(null, 500); globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options) } })
after(() => { globalThis.fetch = nativeFetch; setAuthToken(null) })

test('Admin reads unfiltered bakery statuses, query/city and page from real result/meta contract', async () => {
  handler = () => reply(page([bakery]))
  const result = await admin.getBakeries({ status: 'PENDING_APPROVAL', city: 'City fixture', query: 'Name', page: 1, size: 20, sort: 'name,asc', fake: 99 })
  const request = new URL(calls[0].url, 'http://fixture')
  assert.equal(request.pathname, '/api/v1/admin/bakeries'); assert.equal(request.searchParams.get('city'), 'City fixture')
  assert.equal(request.searchParams.has('fake'), false); assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer isolated-test-token')
  assert.equal(result.result[0].status, 'PENDING_APPROVAL'); assert.equal(result.meta.total, 1)
})
test('Admin detail preserves operations, membership and unknown subscription without inventing inactive', async () => {
  handler = () => reply({ bakery, members: [], subscription: null })
  const result = await admin.getBakery(bakeryId)
  assert.equal(result.subscription, null); assert.equal(result.bakery.operations.addresses[0].isPrimary, true)
})
test('Empty admin lists remain empty and malformed DTO/envelope fails', async () => {
  handler = () => reply(page([])); assert.deepEqual((await admin.getBakeries()).result, [])
  assert.deepEqual((await admin.getPayments()).result, [])
  handler = () => reply({ result: [] }); await assert.rejects(admin.getBakeries(), { status: 502 })
  assert.throws(() => mapAdminBakery({ id: bakeryId, status: 'pending' }), { status: 502 })
  assert.throws(() => mapBakeryPayment({ ...payment, status: 'PAID' }), { status: 502 })
  assert.equal(mapBakeryPayment({ ...payment, amount: null }).amount, null)
})
test('Bakery status transitions match backend entity, not demo statuses', () => {
  assert.deepEqual(bakeryTransitions('DRAFT'), ['CLOSED'])
  assert.deepEqual(bakeryTransitions('PENDING_APPROVAL'), ['ACTIVE', 'DRAFT', 'CLOSED'])
  assert.deepEqual(bakeryTransitions('ACTIVE'), ['SUSPENDED', 'CLOSED'])
  assert.deepEqual(bakeryTransitions('SUSPENDED'), ['ACTIVE', 'CLOSED'])
  assert.deepEqual(bakeryTransitions('CLOSED'), [])
})
test('Real bakery approval sends PATCH with only status and does not fabricate local result', async () => {
  handler = () => reply({ ...bakery, status: 'ACTIVE' })
  assert.equal((await admin.changeBakeryStatus(bakery, 'ACTIVE')).status, 'ACTIVE')
  assert.equal(calls[0].url, '/api/v1/admin/bakeries/' + bakeryId + '/status')
  assert.equal(calls[0].options.method, 'PATCH'); assert.deepEqual(JSON.parse(calls[0].options.body), { status: 'ACTIVE' })
  assert.equal(bakery.status, 'PENDING_APPROVAL')
})
test('Cannot approve DRAFT or reopen CLOSED without backend state transition', async () => {
  for (const status of ['DRAFT', 'CLOSED']) await assert.rejects(admin.changeBakeryStatus({ ...bakery, status }, 'ACTIVE'), { status: 409 })
  assert.equal(calls.length, 0)
})
test('Subscription payments read actual amount/status, order details resolve real bakeryId', async () => {
  handler = (url) => reply(url.includes('/subscription-orders/') ? { ...order, totalAmount: '199000.00' } : page([{ ...payment, amount: '199000.00' }]))
  assert.equal((await admin.getPayments({ bakeryId, status: 'SUBMITTED' })).result[0].amount, 199000)
  assert.equal((await admin.getOrder(orderId)).bakeryId, bakeryId)
})
test('Admin approve uses stable UUID idempotency header and preserves SCHEDULED from backend', async () => {
  handler = () => reply({ payment: { ...payment, status: 'APPROVED' }, order: { ...order, status: 'COMPLETED' }, subscription: { id: randomUUID(), status: 'SCHEDULED' } })
  for (let i = 0; i < 2; i++) {
    const result = await admin.reviewPayment(payment, order, 'approve', ' Matched transfer ', key)
    assert.equal(result.subscription.status, 'SCHEDULED')
  }
  for (const call of calls) { assert.equal(call.options.headers.get('Idempotency-Key'), key); assert.deepEqual(JSON.parse(call.options.body), { reviewNote: 'Matched transfer' }); assert.equal(call.url, '/api/v1/admin/bakery-payments/' + paymentId + '/approve') }
  // A delayed idempotent replay returns the existing period's current state.
  handler = () => reply({ payment: { ...payment, status: 'APPROVED' }, order: { ...order, status: 'COMPLETED' }, subscription: { id: randomUUID(), status: 'EXPIRED' } })
  assert.equal((await admin.reviewPayment(payment, order, 'approve', 'Matched transfer', key)).subscription.status, 'EXPIRED')
})
test('Reject requires reason, does not invent a subscription or send approval key', async () => {
  await assert.rejects(admin.reviewPayment(payment, order, 'reject', '  '), { status: 400 })
  assert.equal(calls.length, 0)
  handler = () => reply({ payment: { ...payment, status: 'REJECTED' }, order: { ...order, status: 'PENDING_PAYMENT' }, subscription: null })
  const result = await admin.reviewPayment(payment, order, 'reject', 'Chứng từ không khớp')
  assert.equal(result.subscription, null); assert.equal(calls[0].options.headers.has('Idempotency-Key'), false)
})
test('Approval blocks mismatched amount/currency, wrong order and duplicate reviewed payments', async () => {
  for (const altered of [{ ...payment, amount: 1 }, { ...payment, currency: 'USD' }, { ...payment, amount: null }]) {
    assert.equal(canApprovePayment(altered, order), false)
    await assert.rejects(admin.reviewPayment(altered, order, 'approve', '', key), { status: 422 })
  }
  for (const altered of [{ ...payment, status: 'APPROVED' }, { ...payment, subscriptionOrderId: randomUUID() }]) await assert.rejects(admin.reviewPayment(altered, order, 'approve', '', key), { status: 409 })
  await assert.rejects(admin.reviewPayment(payment, order, 'approve', '', 'fake-key'), { status: 400 })
  assert.equal(calls.length, 0)
})
test('Category create whitelists request fields and maps only backend-created ID', async () => {
  const id = randomUUID()
  handler = () => reply({ id, name: 'Category fixture', slug: 'fixture', displayOrder: 0, active: true }, 201)
  const result = await vendor.createCategory(bakeryId, { id: 'ignored', name: ' Category fixture ', slug: 'fixture', displayOrder: '0', active: true, status: 'FAKE' })
  assert.equal(result.id, id); assert.equal(calls[0].url, '/api/v1/bakeries/' + bakeryId + '/categories')
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: 'Category fixture', slug: 'fixture', displayOrder: 0, active: true })
})
test('Category validation rejects invalid values before write', async () => {
  const input = { name: 'Category', slug: 'cat', displayOrder: 0, active: true }
  for (const patch of [{ name: ' ' }, { slug: '' }, { name: 'a'.repeat(121) }, { displayOrder: -1 }, { displayOrder: '' }, { active: 'true' }]) await assert.rejects(vendor.createCategory(bakeryId, { ...input, ...patch }), { status: 400 })
  assert.equal(calls.length, 0)
})
test('Admin pages require ADMIN; Vendor roles cannot approve stores or payments', () => {
  for (const page of ['admin-dashboard', 'admin-vendors', 'admin-payments']) {
    assert.equal(canAccess(page, null), false)
    for (const role of ['CUSTOMER', 'BAKERY_OWNER']) assert.equal(canAccess(page, { roles: [role] }), false)
    assert.equal(canAccess(page, { roles: ['ADMIN'] }), true)
  }
})
for (const status of [400, 401, 403, 404, 409, 422, 500, 503]) test('Admin/category HTTP ' + status + ' errors never become success or empty fallback', async () => {
  handler = () => reply(null, status)
  await assert.rejects(admin.getBakeries(), { status })
  await assert.rejects(admin.getPayments(), { status })
  await assert.rejects(admin.changeBakeryStatus(bakery, 'ACTIVE'), { status })
  await assert.rejects(admin.reviewPayment(payment, order, 'approve', '', key), { status })
  await assert.rejects(admin.reviewPayment(payment, order, 'reject', 'Fixture reason'), { status })
  await assert.rejects(vendor.createCategory(bakeryId, { name: 'Fixture', slug: 'fixture', displayOrder: 0, active: true }), { status })
})
test('Network outage is exposed for admin and category writes without mock fallback', async () => {
  handler = () => { throw new TypeError('offline') }
  await assert.rejects(admin.getPayments(), { status: 0 })
  await assert.rejects(admin.reviewPayment(payment, order, 'approve', '', key), { status: 0 })
  await assert.rejects(vendor.createCategory(bakeryId, { name: 'Fixture', slug: 'fixture', displayOrder: 0, active: true }), { status: 0 })
})

test('Reject returns PENDING_PAYMENT or EXPIRED order according to backend, never invents REJECTED order', async () => {
  for (const status of ['PENDING_PAYMENT', 'EXPIRED']) {
    handler = () => reply({ payment: { ...payment, status: 'REJECTED' }, order: { ...order, status }, subscription: null })
    assert.equal((await admin.reviewPayment(payment, order, 'reject', 'Fixture reason')).order.status, status)
  }
  handler = () => reply({ payment: { ...payment, status: 'REJECTED' }, order: { ...order, status: 'REJECTED' }, subscription: null })
  await assert.rejects(admin.reviewPayment(payment, order, 'reject', 'Fixture reason'), { status: 502 })
})
test('Wrong resource IDs and unconfirmed approval results fail instead of showing success', async () => {
  handler = () => reply({ ...bakery, status: 'PENDING_APPROVAL' })
  await assert.rejects(admin.changeBakeryStatus(bakery, 'ACTIVE'), { status: 502 })
  handler = () => reply({ bakery: { ...bakery, id: randomUUID() } })
  await assert.rejects(admin.getBakery(bakeryId), { status: 502 })
  handler = () => reply({ ...order, id: randomUUID() })
  await assert.rejects(admin.getOrder(orderId), { status: 502 })
  const success = { payment: { ...payment, status: 'APPROVED' }, order: { ...order, status: 'COMPLETED' }, subscription: { id: randomUUID(), status: 'ACTIVE' } }
  for (const patch of [{ payment: { ...success.payment, id: randomUUID() } }, { order: { ...success.order, bakeryId: randomUUID() } }, { subscription: null }, { payment }, { order }]) {
    handler = () => reply({ ...success, ...patch })
    await assert.rejects(admin.reviewPayment(payment, order, 'approve', '', key), { status: 502 })
  }
})
test('Product lifecycle waits for matching backend ID and PUBLISHED state', async () => {
  const draft = { id: randomUUID(), name: 'Fixture product', status: 'DRAFT' }
  handler = () => reply(draft)
  await assert.rejects(vendor.changeProduct(bakeryId, draft, 'publish'), { status: 502 })
  handler = () => reply({ ...draft, id: randomUUID(), status: 'PUBLISHED' })
  await assert.rejects(vendor.changeProduct(bakeryId, draft, 'publish'), { status: 502 })
})


test('Legacy vendor approval delegates to real Admin endpoints instead of mutating mock vendors', async () => {
  const { vendorService } = await import('../src/services/vendorService.js')
  handler = (url) => reply(url.endsWith('/status') ? { ...bakery, status: 'ACTIVE' } : { bakery })
  assert.equal((await vendorService.approveVendor(bakeryId)).status, 'ACTIVE')
  assert.equal(calls[0].url, '/api/v1/admin/bakeries/' + bakeryId)
  assert.equal(calls[1].options.method, 'PATCH')
  handler = () => reply(null, 403)
  await assert.rejects(vendorService.approveVendor(bakeryId), { status: 403 })
})
test('Vendor submit/update/operations reject mismatched or incomplete successful responses', async () => {
  handler = () => reply({ id: bakeryId, status: 'DRAFT' })
  await assert.rejects(vendor.submitBakery(bakeryId), { status: 502 })
  handler = () => reply({ id: randomUUID(), status: 'PENDING_APPROVAL' })
  await assert.rejects(vendor.updateBakery(bakeryId, { name: 'Fixture' }), { status: 502 })
  handler = () => reply({ addresses: [] })
  await assert.rejects(vendor.saveOperations(bakeryId, { addresses: [], serviceAreas: [], businessHours: [] }), { status: 502 })
})
