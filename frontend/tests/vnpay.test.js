import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { subscriptionService } from '../src/services/subscriptionService.js'
import { setAuthToken } from '../src/services/apiClient.js'
import { mapVnpayCheckout, vnpayReturnQuery, vnpayResultCopy, rememberVnpayCheckout, vnpayOrderRoute } from '../src/services/vnpayModels.js'
import { requiredRoles } from '../src/routes/routeAccess.js'

const nativeFetch = globalThis.fetch
const orderId = randomUUID(), attemptId = randomUUID(), bakeryId = randomUUID()
const checkout = () => ({ orderId, attemptId, expiresAt: '2099-01-01T00:00:00Z', paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000&vnp_SecureHash=test' })
let calls, handler
beforeEach(() => {
  calls = []
  setAuthToken('test-token')
  handler = () => Response.json({ data: checkout() })
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options) }
})
after(() => { globalThis.fetch = nativeFetch; setAuthToken(null) })

test('Checkout posts to the real order endpoint with JWT and no client-supplied amount', async () => {
  const data = await subscriptionService.createVnpayCheckout(orderId)
  assert.equal(data.attemptId, attemptId)
  assert.equal(calls[0].url, '/api/v1/subscription-orders/' + orderId + '/vnpay/checkout')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.body, undefined)
  assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer test-token')
  assert.equal(calls[0].options.allowMockFallback, false)
})

test('Redirect rejects foreign hosts, credentials, expired links and wrong orders', () => {
  for (const paymentUrl of ['javascript:alert(1)', 'https://sandbox.vnpayment.vn.evil.test/paymentv2/vpcpay.html', 'https://evil.test', 'https://user@sandbox.vnpayment.vn/paymentv2/vpcpay.html']) {
    assert.throws(() => mapVnpayCheckout({ ...checkout(), paymentUrl }, orderId))
  }
  assert.throws(() => mapVnpayCheckout({ ...checkout(), orderId: randomUUID() }, orderId))
  assert.throws(() => mapVnpayCheckout({ ...checkout(), expiresAt: '2000-01-01T00:00:00Z' }, orderId))
})

test('Return verifies via backend without bearer token and never calls IPN or payment mutation', async () => {
  handler = () => Response.json({ data: { orderId, attemptId, status: 'PENDING', responseCode: '00' } })
  const result = await subscriptionService.getVnpayResult('?vnp_TxnRef=123&vnp_SecureHash=abc&vnp_OrderInfo=hello+world&status=SUCCEEDED')
  assert.equal(result.status, 'PENDING')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].options.method, 'GET')
  assert.equal(calls[0].options.headers.has('Authorization'), false)
  assert.match(calls[0].url, /^\/api\/v1\/payments\/vnpay\/return\?/)
  assert.equal(new URL(calls[0].url, 'http://test').searchParams.has('status'), false)
})

test('Return rejects duplicate or missing signature fields before sending a request', async () => {
  assert.throws(() => vnpayReturnQuery('?vnp_TxnRef=a&vnp_TxnRef=b&vnp_SecureHash=c'))
  await assert.rejects(subscriptionService.getVnpayResult('?vnp_ResponseCode=00'))
  assert.equal(calls.length, 0)
})

test('Verified browser success code alone never displays a successful subscription payment', () => {
  assert.match(vnpayResultCopy({ status: 'PENDING', responseCode: '00' }).title, /chờ xác nhận/)
  assert.match(vnpayResultCopy({ status: 'SUCCEEDED', responseCode: '00' }).title, /thành công/)
  assert.match(vnpayResultCopy({ status: 'FAILED', responseCode: '24' }).title, /hủy/)
  assert.match(vnpayResultCopy({ status: 'REVIEW_REQUIRED', responseCode: '00' }).description, /không thanh toán thêm/)
  assert.equal(requiredRoles('subscription-vnpay-return'), null)
})

test('Return restores the original bakery/order only when stored context matches verified result', () => {
  const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }
  rememberVnpayCheckout(checkout(), bakeryId, storage)
  const route = vnpayOrderRoute({ orderId, attemptId }, storage)
  assert.match(route, new RegExp(bakeryId))
  assert.match(route, new RegExp(orderId))
  assert.equal(vnpayOrderRoute({ orderId: randomUUID(), attemptId }, storage), 'vendor-subscription')
  assert.doesNotThrow(() => rememberVnpayCheckout(checkout(), bakeryId, { setItem: () => { throw new Error('Blocked storage') } }))
})

test('Unconfigured VNPay and unrecognized callback state remain errors without mock success', async () => {
  handler = () => Response.json({ message: 'VNPay is not configured' }, { status: 503 })
  await assert.rejects(subscriptionService.createVnpayCheckout(orderId), { status: 503 })
  handler = () => Response.json({ data: { orderId, attemptId, status: 'PAID', responseCode: '00' } })
  await assert.rejects(subscriptionService.getVnpayResult('?vnp_TxnRef=a&vnp_SecureHash=b'), { status: 502 })
})
