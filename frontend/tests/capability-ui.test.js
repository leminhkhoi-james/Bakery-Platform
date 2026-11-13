import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
let vite, Confirm, Review, Payments, Picker, AdminSidebar, VendorSidebar
const id = '11111111-1111-4111-8111-111111111111', nativeFetch = globalThis.fetch
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'capability-ui-only', enforce: 'pre', load(id) {
    const path = id.replaceAll('\\', '/')
    if (path.endsWith('/src/context/useAuth.js')) return 'export function useAuth() { return { user: { id: "11111111-1111-4111-8111-111111111111", roles: ["ADMIN"], displayName: "Capability fixture" }, roles: ["ADMIN"] }; }'
    if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export function useCatalogResource(load, params) { globalThis.__capCalls.push({name:load.name,params});return globalThis.__capResources[load.name] || {status:"loading",data:null,error:null,reload(){}}; }'
  }, transform(code, id) {
    if (['ConfirmAction.jsx', 'AdminVendorsPage.jsx', 'AdminPaymentsPage.jsx'].some((name) => id.replaceAll('\\', '/').endsWith('/' + name))) return code.replace("import React, { useRef, useState } from 'react'", "import React from 'react'\nconst useState=(initial)=>globalThis.__capState(initial), useRef=(initial)=>globalThis.__capState(()=>({current:initial}))[0]").replace("import React, { useState } from 'react'", "import React from 'react'\nconst useState=(initial)=>globalThis.__capState(initial)")
  } }] })
  Confirm = (await vite.ssrLoadModule('/src/components/common/ConfirmAction.jsx')).default
  Review = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminVendorsPage.jsx')).BakeryReview
  Payments = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminPaymentsPage.jsx')).default
  Picker = (await vite.ssrLoadModule('/src/components/marketplace/RequestPicker.jsx')).default
  AdminSidebar = (await vite.ssrLoadModule('/src/layouts/admin/AdminSidebar.jsx')).default
  VendorSidebar = (await vite.ssrLoadModule('/src/layouts/vendor/VendorSidebar.jsx')).default
  ;(await vite.ssrLoadModule('/src/services/apiClient.js')).setAuthToken('capability-ui-fixture')
})
after(async () => { globalThis.fetch = nativeFetch; await vite?.close(); for (const key of ['__capState', '__capCalls', '__capResources']) delete globalThis[key] })
const nodes = (node) => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.props?.children), ...nodes(node.props?.footer)] : []
function setup(Component, props = {}, resources = {}) {
  const values = []; let cursor = 0
  globalThis.__capCalls = []; globalThis.__capResources = resources
  globalThis.__capState = (initial) => { const i = cursor++; if (!(i in values)) values[i] = typeof initial === 'function' ? initial() : initial; return [values[i], (next) => { values[i] = typeof next === 'function' ? next(values[i]) : next }] }
  return () => { cursor = 0; return Component(props) }
}
const ready = (data) => ({ status: 'ready', data, error: null, reload() {} })
test('Confirmation widget does not call mutation before acknowledgement and resets after action', async () => {
  let writes = 0
  const render = setup(Confirm, { label: 'Rút báo giá', onConfirm: async () => { writes++ } })
  let button = nodes(render()).find((node) => node.type === 'button')
  assert.equal(button.props.disabled, true); await button.props.onClick(); assert.equal(writes, 0)
  nodes(render()).find((node) => node.type === 'input').props.onChange({ target: { checked: true } })
  button = nodes(render()).find((node) => node.type === 'button'); assert.equal(button.props.disabled, false)
  await button.props.onClick(); assert.equal(writes, 1); assert.equal(nodes(render()).find((node) => node.type === 'button').props.disabled, true)
})
test('CLOSED bakery transition requires additional acknowledgement and keeps real PATCH/reload contract', async () => {
  let changed = 0; const calls = [], bakery = { id, name: 'Fixture bakery', status: 'ACTIVE', operations: { addresses: [], serviceAreas: [] } }
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ data: { ...bakery, status: 'CLOSED' } }) }
  const render = setup(Review, { id, onChanged: () => changed++, onClose() {}, onNavigate() {} }, { loadAdminBakery: ready({ bakery, members: [], subscription: null }) })
  const actionPanel = nodes(render()).find((node) => node.type?.name === 'EntityActionButtons')
  const close = actionPanel.props.actions.find((action) => action.key === 'CLOSED')
  assert.ok(close.confirmText, 'closing retains explicit irreversible-action acknowledgement')
  assert.equal(calls.length, 0, 'rendering/selecting actions never sends a mutation')
  await actionPanel.props.onConfirm('CLOSED')
  assert.equal(calls[0].url, '/api/v1/admin/bakeries/' + id + '/status'); assert.deepEqual(JSON.parse(calls[0].options.body), { status: 'CLOSED' }); assert.equal(changed, 1)
  const updated = nodes(render()).find((node) => node.type?.name === 'EntityActionButtons')
  assert.equal(updated.props.status, 'CLOSED', 'verified response updates the popup while list reload is pending')
  assert.deepEqual(updated.props.actions, [])
  assert.equal(await updated.props.onConfirm('ACTIVE'), false)
  assert.equal(calls.length, 1, 'unavailable actions never issue another request')
})
test('Bakery approval uses only the backend checklist and updates footer status after a confirmed response', async () => {
  const calls = []; let changed = 0
  const bakery = { id, name: 'Tiệm kiểm thử', status: 'PENDING_APPROVAL', operations: { addresses: [{ isPrimary: true }], serviceAreas: [{ active: true }] } }
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ data: { ...bakery, status: 'ACTIVE' } }) }
  const render = setup(Review, { id, onChanged() { changed++ }, onClose() {}, onNavigate() {} }, { loadAdminBakery: ready({ bakery, members: [], subscription: null }) })
  const actions = nodes(render()).find((node) => node.type?.name === 'EntityActionButtons')
  assert.equal(actions.props.actions.find((action) => action.key === 'ACTIVE').disabled, false)
  assert.equal(calls.length, 0)
  await actions.props.onConfirm('ACTIVE')
  assert.deepEqual(JSON.parse(calls[0].options.body), { status: 'ACTIVE' })
  assert.equal(changed, 1)
  const updated = nodes(render()).find((node) => node.type?.name === 'EntityActionButtons')
  assert.equal(updated.props.status, 'ACTIVE'); assert.deepEqual(updated.props.actions.map((action) => action.key), ['CLOSED'])
})
test('Payment form applies valid date range to GET parameters and rejects reversed dates', () => {
  const render = setup(Payments, { onNavigate() {} })
  const dateInputs = () => nodes(render()).filter((node) => node.type === 'input' && node.props.type === 'datetime-local')
  dateInputs()[0].props.onChange({ target: { value: '2099-01-01T10:00' } }); dateInputs()[1].props.onChange({ target: { value: '2099-02-01T10:00' } })
  nodes(render()).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} }); render()
  const params = globalThis.__capCalls.at(-1).params
  assert.ok(params.submittedFrom.endsWith('Z')); assert.ok(params.submittedTo.endsWith('Z'))
  dateInputs()[0].props.onChange({ target: { value: '2099-03-01T10:00' } })
  nodes(render()).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
  assert.ok(nodes(render()).some((node) => node.type?.name === 'ApiErrorMessage' && node.props.error.status === 400))
  assert.equal(globalThis.__capCalls.at(-1).params.submittedFrom, params.submittedFrom)
})

test('Live bakery return keeps the exact status contract and never pretends the reason was saved', async () => {
  const calls = [], bakery = { id, name: 'Tiệm kiểm thử', status: 'PENDING_APPROVAL' }
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ data: { ...bakery, status: 'DRAFT' } }) }
  const render = setup(Review, { id, onChanged() {}, onClose() {}, onNavigate() {} }, { loadAdminBakery: ready({ bakery, members: [] }) })
  const actions = nodes(render()).find((node) => node.type?.name === 'EntityActionButtons')
  assert.equal(await actions.props.onConfirm('DRAFT', '  '), false)
  assert.equal(calls.length, 0)
  assert.match(actions.props.actions.find((action) => action.key === 'DRAFT').reasonHelp, /chưa được lưu/)
  assert.equal(await actions.props.onConfirm('DRAFT', 'Bổ sung địa chỉ.'), true)
  assert.deepEqual(JSON.parse(calls[0].options.body), { status: 'DRAFT' })
  const profile = nodes(render()).find((node) => node.type?.name === 'BakeryReviewProfile').props.profile
  assert.equal(profile.returnReason, null)
})
test('Picker renders API records, pagination, state gates and retry; unavailable modules stay out of navigation', () => {
  globalThis.__capCalls = []; globalThis.__capState = (initial) => [initial, () => {}]
  globalThis.__capResources = { loadRfqs: ready({ result: [{ id, title: 'API picker fixture', status: 'CLOSED' }], meta: { page: 1, pageSize: 6, pages: 1, total: 1 } }) }
  const html = renderToStaticMarkup(React.createElement(Picker, { allowedStatuses: ['DRAFT', 'OPEN'], onSelect() {} }))
  assert.match(html, /API picker fixture/); assert.match(html, /disabled=""/); assert.equal(globalThis.__capCalls[0].params.scope, 'mine')
  globalThis.__capResources = { loadRfqs: { status: 'error', error: { status: 403 }, reload() {} } }
  assert.match(renderToStaticMarkup(React.createElement(Picker)), /Thử lại/)
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(AdminSidebar)), />Người dùng</)
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(VendorSidebar)), />Doanh thu/)
})
