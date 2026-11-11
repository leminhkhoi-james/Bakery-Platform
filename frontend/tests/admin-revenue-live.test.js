import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { loadRevenueOrders } from '../src/services/adminSummaryService.js'
import { loadOrder } from '../src/services/orderService.js'
import { approvedPayments } from '../src/services/revenueModels.js'

const originalFetch = globalThis.fetch
after(() => { globalThis.fetch = originalFetch })
const bakeryId = randomUUID(), customerId = randomUUID()
const order = { id: randomUUID(), bakeryId, customerId, currency: 'VND', totalAmount: 250000, status: 'COMPLETED' }

test('Revenue order report reads all API pages with bakery and Vietnam date filters', async () => {
  const calls = []
  globalThis.fetch = async (url, options) => {
    const query = new URL(url, 'http://localhost').searchParams
    calls.push({ query, options })
    return Response.json({ data: { result: [{ ...order, id: query.get('page') === '1' ? order.id : randomUUID() }], meta: { page: Number(query.get('page')), pageSize: 100, total: 2, pages: 2 } } })
  }
  const report = await loadRevenueOrders({ bakeryId, from: '2026-11-01', to: '2026-11-11' })
  assert.equal(report.rows.length, 2)
  assert.equal(calls.length, 2)
  for (const { query, options } of calls) {
    assert.equal(options.allowMockFallback, false)
    assert.equal(query.get('scope'), 'all')
    assert.equal(query.get('bakeryId'), bakeryId)
    assert.equal(query.get('createdFrom'), '2026-10-31T17:00:00.000Z')
    assert.equal(query.get('createdTo'), '2026-11-11T16:59:59.999Z')
  }
})

test('Empty backend reports zero records; backend errors remain errors', async () => {
  globalThis.fetch = async () => Response.json({ data: { result: [], meta: { page: 1, pageSize: 100, total: 0, pages: 0 } } })
  assert.deepEqual((await loadRevenueOrders({})).rows, [])
  globalThis.fetch = async () => Response.json({ message: 'Unavailable' }, { status: 503 })
  await assert.rejects(loadRevenueOrders({}), error => error.status === 503)
})

test('Admin order detail bypasses local simulation even when the API fails', async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.allowMockFallback, false)
    return Response.json({ message: 'Unavailable' }, { status: 503 })
  }
  await assert.rejects(loadOrder({ orderId: order.id, apiOnly: true }), error => error.status === 503)
})

test('Revenue includes approved manual and VNPay payments once per subscription order', () => {
  const rows = approvedPayments([
    { id: 'a', subscriptionOrderId: 'one', status: 'APPROVED', reviewedAt: '2026-11-01', amount: 100, paymentMethod: 'VNPAY' },
    { id: 'b', subscriptionOrderId: 'two', status: 'APPROVED', reviewedAt: '2026-11-02', amount: 200, paymentMethod: 'BANK_TRANSFER' },
    { id: 'c', subscriptionOrderId: 'one', status: 'APPROVED', reviewedAt: '2026-11-03', amount: 100 },
    { id: 'd', subscriptionOrderId: 'three', status: 'SUBMITTED', amount: 999 },
  ])
  assert.equal(rows.length, 2)
  assert.equal(rows.reduce((sum, row) => sum + row.amount, 0), 300)
})
