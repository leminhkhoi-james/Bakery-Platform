import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { loadManagedBakeries, loadDashboardAccess } from '../src/services/vendorDashboardService.js'
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

test('Existing local owner works; a different owner account does not inherit mock bakery rights', async () => {
  const owner = { id: userId, roles: ['BAKERY_OWNER'] }, store = createDemoStore()
  let actor = owner
  store.bind(owner)
  const transport = createDemoTransport({ store, getUser: () => actor, fetch: async () => response(page([])) })
  globalThis.fetch = transport.fetch
  const bakeries = await loadManagedBakeries({ userId })
  assert.ok(bakeries.length > 0)
  assert.equal((await loadDashboardAccess({ bakeryId: bakeries[0].id, userId })).memberRole, 'OWNER')
  actor = { id: ids[1], roles: ['BAKERY_OWNER'] }
  await assert.rejects(loadDashboardAccess({ bakeryId: bakeries[0].id, userId: actor.id }), { status: 403 })
  assert.deepEqual(await loadManagedBakeries({ userId: actor.id }), [])
})

test('Dashboard displays actual totals including empty zero; errors show no zero or stale orders and one alert', () => {
  const ready = { status: 'ready', data: page([]), reload() {} }
  const render = (products, orders) => renderToStaticMarkup(React.createElement(Overview, { bakeryId: ids[0], products, orders, onNavigate() {} }))
  const empty = render(ready, ready)
  assert.match(empty, /Chưa có đơn hàng/)
  assert.equal((empty.match(/sc-vendor-kpi-value">0</g) || []).length, 2)
  assert.match(empty, /Chưa có số liệu đã đối soát/)
  const failure = { status: 'error', error: { status: 403 }, data: { result: [{ id: 'STALE' }] }, reload() {} }
  const html = render(failure, failure)
  assert.equal((html.match(/role="alert"/g) || []).length, 1)
  assert.doesNotMatch(html, /STALE|sc-vendor-kpi-value">0</)
  const loading = render({ ...ready, refreshing: true }, { ...ready, status: 'loading' })
  assert.match(loading, /Đang tải đơn hàng/)
  assert.doesNotMatch(loading, /sc-vendor-kpi-value">0</)
})
