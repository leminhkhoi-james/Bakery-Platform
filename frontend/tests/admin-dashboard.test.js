import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildAdminDashboard, dashboardMoney, dashboardDateTime } from '../src/services/adminDashboardModels.js'
import { readDashboardPages, loadAdminDashboard, loadDashboardPayment } from '../src/services/adminDashboardService.js'
import { dashboardSupplement } from '../src/mockData/admin/dashboardSnapshot.js'
import { createDemoStore } from '../src/mockData/store.js'
import { setAuthToken } from '../src/services/apiClient.js'

const ready = (rows, source = 'real') => ({ state: 'ready', rows, source })
const now = Date.parse('2026-10-28T12:00:00Z')
const page = (rows, current = 1, total = rows.length, pages = 1) => ({ result: rows, meta: { page: current, total, pages, pageSize: 100 } })
test('Unique identities, not roles or repeated rows, drive KPI and status distributions', () => {
  const result = buildAdminDashboard({ bakeries: ready([{ id: 'b', status: 'PENDING_APPROVAL' }, { id: 'b', status: 'PENDING_APPROVAL' }]), users: ready([{ id: 'u', status: 'ACTIVE', roles: ['ADMIN', 'CUSTOMER'] }]), products: ready([{ id: 'p' }]), requests: ready([{ id: 'r' }]), offers: ready([{ id: 'q' }]), orders: ready([{ id: 'o', status: 'PENDING', createdAt: '2026-10-28T00:00:00Z' }]) }, { now })
  assert.deepEqual(result.counts, { bakeries: 1, pendingBakeries: 1, users: 1, products: 1, orders: 1, requests: 1, offers: 1, pendingPayments: null, pendingOrders: 1 })
  assert.deepEqual(result.distributions.users, [{ status: 'ACTIVE', label: 'Đang hoạt động', count: 1 }])
  assert.equal(result.series.reduce((sum, point) => sum + point.orders, 0), 1)
})
test('Revenue counts only approved subscription payments once per order and never sums cake sales or currencies', () => {
  const payment = { id: 'a', subscriptionOrderId: 's', status: 'APPROVED', amount: 200000, currency: 'VND', reviewedAt: '2026-10-28T00:00:00Z' }
  const result = buildAdminDashboard({ payments: ready([payment, { ...payment, id: 'duplicate' }, { ...payment, id: 'eur', subscriptionOrderId: 's2', currency: 'EUR', amount: 10 }, { ...payment, id: 'pending', subscriptionOrderId: 's3', status: 'SUBMITTED' }, { ...payment, id: 'pending2', subscriptionOrderId: 's3', status: 'SUBMITTED' }]), orders: ready([{ id: 'cake', totalAmount: 999999999, currency: 'VND', status: 'COMPLETED' }]) }, { now })
  assert.deepEqual(result.revenue, { VND: 200000, EUR: 10 })
  assert.equal(result.counts.pendingPayments, 1)
  assert.equal(result.series.reduce((sum, point) => sum + point.revenue, 0), 200000)
})
test('Missing amounts, conflicting approvals and missing dates never produce invented revenue points', () => {
  for (const amount of [null, undefined, '', ' ', -1, 'bad']) assert.equal(buildAdminDashboard({ payments: ready([{ id: 'p', subscriptionOrderId: 's', status: 'APPROVED', currency: 'VND', amount }]) }, { now }).revenue, null)
  const payment = { id: 'p', subscriptionOrderId: 's', status: 'APPROVED', currency: 'VND', amount: 100, submittedAt: '2026-10-28T00:00:00Z' }
  const result = buildAdminDashboard({ payments: ready([payment]) }, { now })
  assert.equal(result.revenue.VND, 100); assert.equal(result.undatedRevenue, 1)
  assert.equal(result.series.reduce((sum, point) => sum + point.revenue, 0), 0)
  assert.equal(buildAdminDashboard({ payments: ready([payment, { ...payment, id: 'other', amount: 200 }]) }).revenue, null)
  assert.equal(dashboardMoney(100, 'invalid currency'), '—')
})
test('Chart windows use Vietnam calendar days, ignore future dates and distinguish unknown from empty', () => {
  const data = { orders: ready([{ id: 'local-midnight', createdAt: '2026-10-27T18:00:00Z' }, { id: 'future', createdAt: '2026-10-29T00:00:00Z' }, { id: 'old', createdAt: '2026-01-01T00:00:00Z' }]) }
  const result = buildAdminDashboard(data, { now, days: 7 })
  assert.equal(result.series.length, 7); assert.equal(result.series.at(-1).orders, 1)
  assert.equal(result.counts.orders, 3)
  assert.equal(buildAdminDashboard(null).counts.orders, null)
  assert.equal(buildAdminDashboard({ orders: ready([]) }).counts.orders, 0)
})
test('Routine order fulfilment is not an Admin task; moderation and activities retain source data', () => {
  const result = buildAdminDashboard({ orders: ready([{ id: '1', status: 'PENDING', createdAt: '2026-10-28T00:00:00Z' }, { id: '2', status: 'BAKING', neededAt: '2026-10-27T00:00:00Z' }, { id: '3', status: 'COMPLETED', neededAt: '2026-10-27T00:00:00Z' }, { id: '4', status: 'CANCELLED', neededAt: '2026-10-27T00:00:00Z' }]), designs: ready([{ id: 'd', moderationStatus: 'PENDING' }, { id: 'a', moderationStatus: 'APPROVED' }]) }, { now })
  assert.equal(result.attention, undefined)
  assert.equal(result.counts.pendingOrders, 1)
  assert.equal(result.moderation.length, 1)
  assert.equal(result.activities.length, 1); assert.equal(result.activities[0].route, 'admin-orders?orderId=1')
})
test('Pagination reads all pages, rejects source switches, partial data and changing totals', async () => {
  const calls = []
  const result = await readDashboardPages(async (params) => { calls.push(params.page); return page([{ id: String(params.page) }], params.page, 2, 2) })
  assert.deepEqual(calls, [1, 2]); assert.equal(result.rows.length, 2)
  let source = 'real'
  await assert.rejects(readDashboardPages(async ({ page: current }) => { source = current === 1 ? 'real' : 'demo'; return page([{ id: String(current) }], current, 2, 2) }, {}, () => source), { status: 409 })
  await assert.rejects(readDashboardPages(async ({ page: current }) => page([{ id: 'same' }], current, 2, 2)), { status: 409 })
  await assert.rejects(readDashboardPages(async ({ page: current }) => page([{ id: String(current) }], current, current === 1 ? 2 : 3, 2)), { status: 409 })
  const controller = new AbortController(); controller.abort()
  await assert.rejects(readDashboardPages(() => assert.fail('aborted read'), { signal: controller.signal }), { name: 'AbortError' })
})
test('Supplement reuses the current mock graph only for an authorized and fully matching source', () => {
  const store = createDemoStore(), user = { id: 'admin', roles: ['ADMIN'] }, runtime = { store }
  const collections = Object.fromEntries(['bakeries', 'orders', 'users', 'payments'].map((key) => [key, ready([], 'demo')]))
  const result = dashboardSupplement(runtime, user, collections)
  assert.equal(result.products.rows.length, store.state.products.length)
  store.state.products.pop()
  assert.equal(dashboardSupplement(runtime, user, collections).products.rows.length, result.products.rows.length - 1)
  assert.deepEqual(dashboardSupplement(runtime, { ...user, roles: ['CUSTOMER'] }, collections), {})
  assert.deepEqual(dashboardSupplement(runtime, user, { ...collections, orders: ready([], 'real') }), {})
  assert.deepEqual(dashboardSupplement(runtime, user, { ...collections, users: { state: 'error' } }), {})
})
test('Dashboard uses read-only existing endpoints and preserves authorization/server failures without mock replacement', async () => {
  const original = globalThis.fetch, calls = []
  setAuthToken('dashboard-test')
  try {
    for (const status of [401, 403, 500]) {
      globalThis.fetch = async (url, options) => { calls.push({ url, method: options.method }); return new Response(JSON.stringify({ message: 'Unavailable' }), { status }) }
      const data = await loadAdminDashboard({ user: { id: 'admin', roles: ['ADMIN'] } })
      assert.ok(Object.values(data).every((collection) => collection.state === 'error'))
      assert.equal(data.products, undefined)
    }
    assert.ok(calls.filter((call) => !call.url.endsWith('/auth/refresh')).every((call) => call.method === 'GET'))
    await assert.rejects(loadAdminDashboard({ user: { id: 'customer', roles: ['CUSTOMER'] } }), { status: 403 })
  } finally { globalThis.fetch = original; setAuthToken(null) }
})

test('Payment detail shortcuts find the requested record beyond the first page using existing GET endpoints', async () => {
  const original = globalThis.fetch, calls = []
  const ids = ['10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002']
  try {
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options })
      const current = Number(new URL(url, 'http://localhost').searchParams.get('page'))
      return Response.json({ data: page([{ id: ids[current - 1], subscriptionOrderId: '20000000-0000-4000-8000-000000000001', status: 'SUBMITTED', amount: 100, currency: 'VND' }], current, 2, 2) })
    }
    assert.equal((await loadDashboardPayment({ id: ids[1] })).id, ids[1])
    assert.equal(calls.length, 2)
    assert.ok(calls.every((call) => call.options.method === 'GET' && call.url.startsWith('/api/v1/admin/bakery-payments?')))
    const before = calls.length
    assert.equal(await loadDashboardPayment({ id: '' }), null)
    await assert.rejects(loadDashboardPayment({ id: 'bad-id' }), { status: 400 })
    assert.equal(calls.length, before)
  } finally { globalThis.fetch = original }
})

test('Pending-order KPI counts only distinct orders awaiting confirmation; missing data is not zero', () => {
  const result = buildAdminDashboard({ orders: ready([
    { id: 'waiting', status: 'PENDING' }, { id: 'waiting', status: 'PENDING' },
    ...['CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED', 'UNKNOWN'].map((status) => ({ id: status, status })),
  ]) })
  assert.equal(result.counts.pendingOrders, 1)
  assert.equal(buildAdminDashboard({ orders: ready([]) }).counts.pendingOrders, 0)
  assert.equal(buildAdminDashboard({ orders: { state: 'error', rows: [] } }).counts.pendingOrders, null)
})

test('Recent orders use actual creation times, return five unique newest records and format Vietnam time exactly', () => {
  const orders = Array.from({ length: 8 }, (_, i) => ({ id: String(i), createdAt: new Date(Date.UTC(2026, 9, 20 + i, 3, 5)).toISOString() })).reverse()
  const result = buildAdminDashboard({ orders: ready([...orders, orders[0], { id: 'missing-date' }]) })
  assert.deepEqual(result.recentOrders.map((row) => row.id), ['7', '6', '5', '4', '3'])
  assert.equal(dashboardDateTime('2026-10-28T03:05:00Z'), '28/10/2026 10:05')
  assert.equal(dashboardDateTime('2026-10-27T17:00:00Z'), '28/10/2026 00:00')
  assert.equal(dashboardDateTime('invalid'), 'Chưa có thời gian')
})
