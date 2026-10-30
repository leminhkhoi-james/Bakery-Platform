import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
import { loadVendorOrders, vendorOrderDateRange } from '../src/services/vendorOrderPresentation.js'
import { setAuthToken } from '../src/services/apiClient.js'
import { createDemoStore } from '../src/mockData/store.js'
import { createDemoTransport } from '../src/mockData/transport.js'

const nativeFetch = globalThis.fetch
let vite, List, useVendorBakery
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'vendor-order-events', enforce: 'pre', load(id) {
    const path = id.replaceAll('\\', '/')
    if (path.endsWith('/src/context/useAuth.js')) return 'export function useAuth(){return globalThis.__vendorAuth}'
    if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export function useCatalogResource(load,params){globalThis.__vendorQuery=params;return globalThis.__vendorResource}'
  }, transform(code, id) {
    if (id.replaceAll('\\', '/').endsWith('/VendorOrderList.jsx')) return code.replace("import React, { useState } from 'react'", "import React from 'react';const useState=(v)=>globalThis.__vendorState(v)")
    if (id.replaceAll('\\', '/').endsWith('/useVendorBakery.js')) return code.replace("import { useCallback, useState } from 'react'", "const useState=(v)=>globalThis.__vendorState(v),useCallback=(fn)=>fn")
  } }] })
  List = (await vite.ssrLoadModule('/src/pages/vendor/orders/VendorOrderList.jsx')).default
  ;({ useVendorBakery } = await vite.ssrLoadModule('/src/hooks/useVendorBakery.js'))
})
after(async () => { globalThis.fetch = nativeFetch; setAuthToken(''); await vite?.close(); for (const key of ['__vendorAuth', '__vendorResource', '__vendorQuery', '__vendorState']) delete globalThis[key] })
const nodes = (tree) => Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children), ...nodes(tree.props.action)] : []
const text = (tree) => Array.isArray(tree) ? tree.map(text).join('') : tree?.props ? text(tree.props.children) : String(tree ?? '')
function harness(render) {
  let cursor = 0; const state = []
  globalThis.__vendorState = (initial) => { const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial; return [state[i], (value) => { state[i] = typeof value === 'function' ? value(state[i]) : value }] }
  return () => { cursor = 0; return render() }
}

test('Calendar dates cover complete Vietnamese days, and invalid ranges never reach API', async () => {
  assert.deepEqual(vendorOrderDateRange('2026-10-30', '2026-10-30'), { createdFrom: '2026-10-30T00:00:00+07:00', createdTo: '2026-10-30T23:59:59.999999999+07:00' })
  assert.equal(Date.parse(vendorOrderDateRange('2026-10-30').createdFrom), Date.parse('2026-10-29T17:00:00Z'))
  let calls = 0; globalThis.fetch = async () => { calls++; throw new Error('unexpected fetch') }
  for (const [from, to] of [['2026-10-31', '2026-10-30'], ['2026-02-30', ''], ['invalid', '']]) await assert.rejects(loadVendorOrders({ bakeryId: 'x', from, to }), { status: 400 })
  assert.equal(calls, 0)
})

test('Owner order request retains token, correct bakery scope, filters and sorting; denial is never empty success', async () => {
  const id = 'aa000000-0000-4000-8000-000000000001'
  let captured
  setAuthToken('owner-test-token')
  globalThis.fetch = async (url, options) => { captured = { query: new URL(url, 'http://local').searchParams, options }; return Response.json({ data: { result: [], meta: { page: 1, pageSize: 10, pages: 0, total: 0 } } }) }
  const params = { bakeryId: id, page: 1, size: 10, status: 'BAKING', orderSource: 'DIRECT_CATALOG', sort: 'neededAt,asc', from: '2026-10-30' }
  assert.equal((await loadVendorOrders(params)).meta.total, 0)
  for (const key of ['bakeryId', 'status', 'orderSource', 'sort']) assert.equal(captured.query.get(key), params[key])
  assert.equal(captured.query.get('scope'), 'bakery'); assert.equal(captured.options.headers.get('Authorization'), 'Bearer owner-test-token')
  for (const status of [401, 403, 500]) {
    globalThis.fetch = async () => Response.json({ message: 'Denied' }, { status })
    await assert.rejects(loadVendorOrders(params, { retryAuth: false }), { status })
  }
})

test('Existing mock orders stay scoped to the authorized bakery and cannot pass to another owner', async () => {
  const owner = { id: 'aa000000-0000-4000-8000-000000000002', roles: ['BAKERY_OWNER'] }, store = createDemoStore()
  let actor = owner; store.bind(owner)
  const transport = createDemoTransport({ store, getUser: () => actor, fetch: async () => { throw new Error('Local records must not reach backend') } })
  globalThis.fetch = transport.fetch
  const bakeryId = store.state.bakeries[0].id
  const data = await loadVendorOrders({ bakeryId, page: 1, size: 10, sort: 'totalAmount,desc' })
  assert.ok(data.result.length); assert.ok(data.result.every((row) => row.bakeryId === bakeryId))
  assert.ok(data.result.every((row, index) => !index || data.result[index - 1].totalAmount >= row.totalAmount))
  assert.equal((await loadVendorOrders({ bakeryId: store.state.bakeries[1].id })).meta.total, 0)
  actor = { id: 'aa000000-0000-4000-8000-000000000003', roles: ['BAKERY_OWNER'] }
  await assert.rejects(loadVendorOrders({ bakeryId }), { status: 403 })
})

test('An empty real bakery order list stays empty without an unscoped probe or foreign mock fallback', async () => {
  const bakeryId = 'ab000000-0000-4000-8000-000000000010', calls = []
  const transport = createDemoTransport({ getUser: () => ({ id: 'ab000000-0000-4000-8000-000000000002', roles: ['BAKERY_OWNER'] }), fetch: async (url) => {
    calls.push(url)
    return Response.json({ data: { result: [], meta: { page: 1, pageSize: 10, pages: 0, total: 0 } } })
  } })
  globalThis.fetch = transport.fetch
  const result = await loadVendorOrders({ bakeryId, page: 1, size: 10 })
  assert.equal(result.meta.total, 0); assert.deepEqual(result.result, [])
  assert.equal(calls.length, 1, 'No probe may remove the mandatory bakeryId')
})

test('List has six columns; filters reset pagination and details retain selected order', () => {
  globalThis.__vendorResource = { status: 'ready', data: { result: [{ id: 'order-a', customerName: 'Khách kiểm thử', status: 'PENDING' }], meta: { page: 1, pages: 3, total: 21 } }, reload() {} }
  const render = harness(() => List({ bakeryId: 'shop-a' }))
  assert.deepEqual(nodes(render()).filter((node) => node.type === 'th').map(text), ['Mã đơn', 'Khách hàng', 'Trạng thái', 'Tổng tiền', 'Hẹn giao', 'Thao tác'])
  assert.equal(nodes(render()).filter((node) => node.type === 'input' && node.props.type === 'date').length, 2)
  nodes(render()).find((node) => typeof node.props.onPage === 'function').props.onPage(3)
  render(); assert.equal(globalThis.__vendorQuery.page, 3)
  nodes(render()).find((node) => node.type === 'select').props.onChange({ target: { value: 'BAKING' } })
  render(); assert.equal(globalThis.__vendorQuery.page, 1); assert.equal(globalThis.__vendorQuery.status, 'BAKING')
  nodes(render()).find((node) => node.type === 'button' && text(node).includes('Xem chi tiết')).props.onClick()
  assert.ok(nodes(render()).some((node) => node.props.orderId === 'order-a' && node.props.bakeryId === 'shop-a'))
})

test('Bakery selection synchronizes changed URL and clears previous account selection', () => {
  const a = 'aa000000-0000-4000-8000-000000000001', b = 'aa000000-0000-4000-8000-000000000002'
  let search = '?bakeryId=' + a
  globalThis.__vendorAuth = { user: { id: 'owner-a' }, roles: ['BAKERY_OWNER'] }
  const render = harness(() => useVendorBakery(search))
  assert.equal(render().bakeryId, a)
  search = '?bakeryId=' + b
  assert.equal(render().bakeryId, b)
  assert.equal(render().bakeryId, b)
  globalThis.__vendorAuth = { user: { id: 'owner-b' }, roles: ['BAKERY_OWNER'] }
  assert.equal(render().bakeryId, '')
})
