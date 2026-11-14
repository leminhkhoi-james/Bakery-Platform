import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { loadManagedBakeries, loadDashboardAccess, loadDashboardCompletedOrders } from '../src/services/vendorDashboardService.js'
import { createDemoStore } from '../src/mockData/store.js'
import { createDemoTransport } from '../src/mockData/transport.js'

const userId = 'aa000000-0000-4000-8000-000000000002'
const ids = [1, 2].map((i) => `bb000000-0000-4000-8000-00000000000${i}`)
const response = (data, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { 'Content-Type': 'application/json' } })
const page = (result) => ({ result, meta: { page: 1, pageSize: 100, total: result.length, pages: result.length ? 1 : 0 } })
const originalFetch = globalThis.fetch
let vite, Overview
before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, logLevel: 'error' })
  ;({ DashboardOverview: Overview } = await vite.ssrLoadModule('/src/pages/vendor/dashboard/VendorDashboardPage.jsx'))
})
after(async () => { globalThis.fetch = originalFetch; await vite?.close() })

test('Completed-order totals include every page and reject mixed currencies', async () => {
  const rows = Array.from({ length: 101 }, (_, i) => ({ id: 'cc000000-0000-4000-8000-' + String(i).padStart(12, '0'),
    bakeryId: ids[0], customerId: userId, status: 'COMPLETED', currency: 'VND', totalAmount: 1000 }))
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    const current = Number(new URL(url, 'http://local').searchParams.get('page'))
    return response({ result: rows.slice((current - 1) * 100, current * 100), meta: { page: current, pageSize: 100, total: 101, pages: 2 } })
  }
  const complete = await loadDashboardCompletedOrders({ bakeryId: ids[0] })
  assert.equal(complete.result.length, 101)
  assert.equal(complete.result.reduce((sum, order) => sum + order.totalAmount, 0), 101000)
  assert.equal(calls.length, 2)
  assert.ok(calls.every(({ url, options }) => new URL(url, 'http://local').searchParams.get('status') === 'COMPLETED' && options.allowMockFallback === false))
  rows[100].currency = 'USD'
  await assert.rejects(loadDashboardCompletedOrders({ bakeryId: ids[0] }), { status: 502 })
})

test('Public bakery choices are verified with current user membership, without granting rights', async () => {
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(url)
    if (!url.includes('/members')) return response(page(ids.map((id, i) => ({ id, name: 'Tiệm ' + i }))))
    return url.includes(ids[0]) ? response(null, 403) : response([{ userId, status: 'ACTIVE', memberRole: 'OWNER' }])
  }
  assert.deepEqual((await loadManagedBakeries({ userId })).map((row) => row.id), [ids[1]])
  assert.equal(calls.length, 3)
  await assert.rejects(loadDashboardAccess({ bakeryId: ids[0], userId }), { status: 403 })
  assert.equal((await loadDashboardAccess({ bakeryId: ids[1], userId })).memberRole, 'OWNER')
})

test('Membership failures remain errors; inactive or another user membership cannot authorize dashboard', async () => {
  for (const status of [401, 500, 503]) {
    globalThis.fetch = async (url) => url.includes('/members') ? response(null, status) : response(page([{ id: ids[0], name: 'Tiệm' }]))
    await assert.rejects(loadManagedBakeries({ userId }, { retryAuth: false }), { status })
  }
  for (const members of [[{ userId, status: 'INACTIVE', memberRole: 'OWNER' }], [{ userId: ids[0], status: 'ACTIVE', memberRole: 'OWNER' }], [{ userId, status: 'ACTIVE', memberRole: 'STAFF' }]]) {
    globalThis.fetch = async () => response(members)
    await assert.rejects(loadDashboardAccess({ bakeryId: ids[0], userId }), { status: 403 })
  }
})

test('Owner discovery bypasses local bakery rights and preserves an empty API response for each account', async () => {
  const owner = { id: userId, roles: ['BAKERY_OWNER'] }, store = createDemoStore()
  let actor = owner
  store.bind(owner)
  let upstreamCalls = 0
  const transport = createDemoTransport({ store, getUser: () => actor, fetch: async (url) => {
    upstreamCalls++
    return url.includes('/members') ? response(null, 403) : response(page([]))
  } })
  globalThis.fetch = transport.fetch
  const bakeries = await loadManagedBakeries({ userId })
  assert.ok(store.state.bakeries.length > 0, 'Local bakery fixtures exist but must not grant API access')
  assert.deepEqual(bakeries, [])
  assert.equal(upstreamCalls, 1)
  actor = { id: ids[1], roles: ['BAKERY_OWNER'] }
  await assert.rejects(loadDashboardAccess({ bakeryId: store.state.bakeries[0].id, userId: actor.id }), { status: 403 })
  assert.deepEqual(await loadManagedBakeries({ userId: actor.id }), [])
  assert.equal(upstreamCalls, 2)
})

test('Dashboard displays actual totals including empty zero; errors show no zero or stale orders and one alert', () => {
  const ready = { status: 'ready', data: page([]), reload() {} }
  const render = (products, orders) => renderToStaticMarkup(React.createElement(Overview, { bakeryId: ids[0], products, orders, onNavigate() {} }))
  const empty = render(ready, ready)
  assert.match(empty, /Chưa có số liệu/)
  assert.equal((empty.match(/sc-activity-total">0</g) || []).length, 2)
  assert.match(empty, /aria-label="Chưa có số liệu">—/); assert.doesNotMatch(empty, /Đã đối soát|Đã thanh toán/)
  const failure = { status: 'error', error: { status: 403 }, data: { result: [{ id: 'STALE' }] }, reload() {} }
  const html = render(failure, failure)
  assert.equal((html.match(/role="alert"/g) || []).length, 1)
  assert.doesNotMatch(html, /STALE|sc-activity-total">0</)
  const loading = render({ ...ready, refreshing: true }, { ...ready, status: 'loading' })
  assert.match(loading, /aria-label="Đang tải số liệu"/)
  assert.doesNotMatch(loading, /sc-activity-total">0</)
})
