import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { paymentDateRange } from '../src/services/adminFilterModels.js'
import { publicationAdminService } from '../src/services/publicationAdminService.js'
import { setAuthToken } from '../src/services/apiClient.js'

const nativeFetch = globalThis.fetch
const bakeryId = '11111111-1111-4111-8111-111111111111', paymentId = '22222222-2222-4222-8222-222222222222'
let calls, status, data
beforeEach(() => { calls = []; status = 200; data = { result: [], meta: { page: 1, pageSize: 20, pages: 0, total: 0 } }; setAuthToken('admin-capability-fixture'); globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ data, statusCode: status, message: 'Fixture' }, { status }) } })
after(() => { globalThis.fetch = nativeFetch; setAuthToken(null) })
test('Admin payment dates are optional ISO Instants and reject invalid/reversed ranges before HTTP', () => {
  assert.deepEqual(paymentDateRange('', ''), {})
  assert.deepEqual(paymentDateRange('2099-01-01T00:00:00Z', ''), { submittedFrom: '2099-01-01T00:00:00.000Z' })
  assert.throws(() => paymentDateRange('bad', ''), { status: 400 })
  assert.throws(() => paymentDateRange('2099-02-01', '2099-01-01'), { status: 400 })
  assert.equal(calls.length, 0)
})
test('GET payment filters send actual DTO query names, inclusive timestamps, pagination and JWT', async () => {
  data = { result: [{ id: paymentId, subscriptionOrderId: bakeryId, status: 'SUBMITTED', amount: '321000.00', currency: 'VND' }], meta: { page: 2, pageSize: 20, pages: 3, total: 41 } }
  const range = paymentDateRange('2099-01-01T00:00:00Z', '2099-02-01T00:00:00Z')
  const result = await publicationAdminService.getPayments({ bakeryId, status: 'SUBMITTED', page: 2, size: 20, ...range })
  const url = new URL(calls[0].url, 'http://fixture')
  assert.equal(url.pathname, '/api/v1/admin/bakery-payments'); assert.equal(url.searchParams.get('submittedFrom'), range.submittedFrom); assert.equal(url.searchParams.get('submittedTo'), range.submittedTo)
  assert.equal(url.searchParams.get('page'), '2'); assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer admin-capability-fixture')
  assert.equal(result.result[0].amount, 321000); assert.equal(result.meta.total, 41)
})
for (const code of [400, 401, 403, 404, 409, 422, 500, 503]) test('Admin payment filter HTTP ' + code + ' is not converted to an empty list', async () => {
  status = code; data = null
  await assert.rejects(publicationAdminService.getPayments({ page: 1, ...paymentDateRange('2099-01-01', '') }), { status: code })
})
test('Payment filter network failure is exposed', async () => {
  globalThis.fetch = async () => { throw new TypeError('offline fixture') }
  await assert.rejects(publicationAdminService.getPayments(), { status: 0 })
})
