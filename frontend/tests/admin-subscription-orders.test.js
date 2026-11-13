import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { setAuthToken } from '../src/services/apiClient.js'
import { mapAdminSubscriptionOrder, loadAdminSubscriptionOrders, orderApprovalLabel, adminOrderDateRange } from '../src/services/adminSubscriptionOrders.js'
import { publicationAdminService } from '../src/services/publicationAdminService.js'

const orderId = randomUUID(), bakeryId = randomUUID(), paymentId = randomUUID()
const order = (status = 'PENDING_PAYMENT') => ({ id: orderId, bakeryId, orderNumber: 'SUB-50FE239D', planNameSnapshot: 'Chuyên nghiệp',
  planCodeSnapshot: 'PRO', billingPeriodMonths: 1, totalAmount: '499000.00', currency: 'VND', status,
  createdAt: '2026-11-10T14:12:18Z', expiresAt: '2099-01-01T00:00:00Z', featuresSnapshot: {}, payments: [] })
const pending = () => ({ order: order(), payments: [], eligibleForApproval: false, eligibilityReason: 'WAITING_PAYMENT', reviewPaymentId: null })
const ready = () => ({ order: order('PAYMENT_REVIEW'), payments: [{ id: paymentId, subscriptionOrderId: orderId, amount: '499000',
  currency: 'VND', paymentMethod: 'BANK_TRANSFER', paymentReference: 'TEST-1', status: 'SUBMITTED' }],
eligibleForApproval: true, eligibilityReason: 'READY_FOR_REVIEW', reviewPaymentId: paymentId })
const nativeFetch = globalThis.fetch
let calls = [], vite, table
before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, logLevel: 'error' })
  ;({ AdminOrderTable: table } = await vite.ssrLoadModule('/src/pages/admin/vendors/AdminSubscriptionOrdersPage.jsx'))
})
beforeEach(() => { calls = []; setAuthToken('admin-test-token') })
after(async () => { await vite?.close(); globalThis.fetch = nativeFetch; setAuthToken(null) })

test('Unpaid 499k order remains visible with a reason and a disabled review action', () => {
  const row = mapAdminSubscriptionOrder(pending())
  assert.equal(row.order.totalAmount, 499000)
  const html = renderToStaticMarkup(React.createElement(table, { rows: [row], meta: { page: 1, pageSize: 20 }, onDetail() {}, onReview() {} }))
  assert.match(html, /499\.000/)
  assert.match(html, /SUB-50FE239D/)
  assert.match(html, /Chờ khách thanh toán/)
  assert.match(html, /Xem đơn/)
  assert.match(html, /disabled=""/)
})

test('Matching manual submitted payment enables review while inconsistent eligibility fails closed', () => {
  const row = mapAdminSubscriptionOrder(ready())
  const html = renderToStaticMarkup(React.createElement(table, { rows: [row], meta: { page: 1, pageSize: 20 }, onDetail() {}, onReview() {} }))
  assert.doesNotMatch(html, /disabled=""/)
  assert.match(html, /Đủ điều kiện đối chiếu để duyệt/)
  for (const bad of [
    { ...ready(), order: order() },
    { ...ready(), reviewPaymentId: randomUUID() },
    { ...ready(), payments: [{ ...ready().payments[0], amount: '498000' }] },
    { ...ready(), payments: [{ ...ready().payments[0], currency: 'USD' }] },
    { ...ready(), payments: [{ ...ready().payments[0], paymentMethod: 'VNPAY' }] },
  ]) assert.throws(() => mapAdminSubscriptionOrder(bad), { status: 502 })
})

test('Directory defaults to all orders, forwards server filters and retains rows when bakery lookup fails', async () => {
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    if (url.includes('/admin/subscription-orders')) return Response.json({ data: { result: [pending()], meta: { page: 1, pageSize: 20, pages: 1, total: 1 } } })
    return Response.json({ message: 'Bakery unavailable' }, { status: 503 })
  }
  const data = await loadAdminSubscriptionOrders({ page: 1, size: 20 })
  assert.equal(data.result.length, 1)
  assert.equal(data.result[0].profile, null)
  assert.equal(new URL(calls[0].url, 'http://test').searchParams.has('status'), false)
  assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer admin-test-token')
  assert.equal(calls[0].options.allowMockFallback, false)
  calls = []
  await loadAdminSubscriptionOrders({ status: 'PENDING_PAYMENT', eligibleForApproval: false, query: '499000', createdFrom: '2026-11-01T00:00:00Z' })
  const query = new URL(calls[0].url, 'http://test').searchParams
  assert.equal(query.get('status'), 'PENDING_PAYMENT')
  assert.equal(query.get('eligibleForApproval'), 'false')
  assert.equal(query.get('query'), '499000')
  assert.equal(query.get('createdFrom'), '2026-11-01T00:00:00Z')
})

test('Viewing an unpaid order cannot invoke payment approval and terminal orders explain their state', async () => {
  globalThis.fetch = async (...args) => { calls.push(args); throw new Error('Unexpected mutation') }
  await assert.rejects(publicationAdminService.reviewPayment({ ...ready().payments[0] }, mapAdminSubscriptionOrder(pending()).order,
    'approve', null, randomUUID()), { status: 409 })
  assert.equal(calls.length, 0)
  assert.match(orderApprovalLabel({ eligibilityReason: 'COMPLETED' }), /không cần duyệt lại/)
  assert.match(orderApprovalLabel({ eligibilityReason: 'PAYMENT_MISMATCH' }), /chưa khớp/)
  assert.throws(() => adminOrderDateRange('2026-11-12T12:00', '2026-11-11T12:00'), { status: 400 })
})
