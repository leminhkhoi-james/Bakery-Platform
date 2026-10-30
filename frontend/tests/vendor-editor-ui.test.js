import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { createDemoStore } from '../src/mockData/store.js'
import { createSeed, DEMO_STORAGE_KEY } from '../src/mockData/seed.js'
import { createServer } from 'vite'
import { mapManagedList, canManageEntity } from '../src/services/vendorCatalogModels.js'
import { memberCanEdit, operationsPayload } from '../src/services/managementModels.js'
let vite, Operations, ManageOffer
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'scoped-operation-editor-fixture', enforce: 'pre', load(id) { if (id.replaceAll('\\', '/').endsWith('/useCatalogResource.js')) return 'export function useCatalogResource(load, params) { if (params === null) throw new Error("A resource must never be requested with null parameters"); return globalThis.__vendorEditorResources?.[load.name] || { status: "loading", data: null, error: null, reload() {} }; }' }, transform(code, id) {
    if (id.replaceAll('\\', '/').endsWith('/BakeryOperationsForm.jsx')) return code.replace("import React, { useState } from 'react'", "import React from 'react'; const useState = value => globalThis.__vendorEditorState(value)")
  } }] })
  Operations = (await vite.ssrLoadModule('/src/components/management/BakeryOperationsForm.jsx')).default
  ManageOffer = (await vite.ssrLoadModule('/src/pages/vendor/rfq/VendorBespokeQuoteSubmitPage.jsx')).ManageOffer
})
after(async () => { await vite?.close(); delete globalThis.__vendorEditorState; delete globalThis.__vendorEditorResources })
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children)] : []
const text = tree => Array.isArray(tree) ? tree.map(text).join('') : tree?.props ? text(tree.props.children) : String(tree ?? '')
function editor(props) {
  const slots = []; let cursor = 0
  globalThis.__vendorEditorState = initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value }] }
  return () => { cursor = 0; return Operations(props) }
}
const snapshot = () => ({ addresses: [{ id: randomUUID(), addressLine: '12 Nguyễn Huệ', ward: 'Bến Nghé', district: 'Quận 1', city: 'TP. Hồ Chí Minh', latitude: 10.77, longitude: 106.7, isPrimary: true }], serviceAreas: [{ id: randomUUID(), district: 'Quận 1', city: 'TP. Hồ Chí Minh', deliveryFee: 30000, minimumOrder: 200000, active: true }], businessHours: [{ dayOfWeek: 1, opensAt: '08:00', closesAt: '20:00', closed: false }] })
test('Editing hours alone preserves address IDs, coordinates and service areas in the atomic replacement', () => {
  const original = snapshot(), before = structuredClone(original), saved = []
  const render = editor({ operations: original, sections: ['businessHours'], onSave: value => saved.push(operationsPayload(value)) })
  nodes(render()).find(node => node.type === 'select').props.onChange({ target: { value: '2' } })
  const confirmationLabel = nodes(render()).find(node => node.type === 'label' && text(node.props.children).includes('Tôi xác nhận thay thế'))
  const confirmation = nodes(confirmationLabel).find(node => node.type === 'input')
  confirmation.props.onChange({ target: { checked: true } })
  render().props.onSubmit({ preventDefault() {} })
  assert.equal(saved[0].businessHours[0].dayOfWeek, 2)
  assert.deepEqual(saved[0].addresses, before.addresses)
  assert.deepEqual(saved[0].serviceAreas, before.serviceAreas)
  assert.deepEqual(original, before)
})
test('Deleting an address is staged only after confirmation and never saves before explicit form submission', () => {
  const original = snapshot(), saved = [], render = editor({ operations: original, sections: ['addresses'], onSave: value => saved.push(value) })
  nodes(render()).find(node => node.type === 'button' && text(node.props.children) === 'Xóa dòng').props.onClick()
  assert.equal(nodes(render()).find(node => node.type === 'input' && node.props.value === original.addresses[0].addressLine).props.value, original.addresses[0].addressLine)
  const confirmation = nodes(render()).find(node => node.type?.name === 'VendorConfirm')
  confirmation.props.onConfirm()
  assert.equal(saved.length, 0)
  assert.ok(!nodes(render()).some(node => node.type === 'input' && node.props.value === original.addresses[0].addressLine))
  assert.equal(original.addresses.length, 1)
})
test('Historical Staff memberships are readable without acquiring Owner permissions', () => {
  const row = { id: randomUUID(), userId: randomUUID(), memberRole: 'STAFF', status: 'ACTIVE' }
  assert.deepEqual(mapManagedList([row], 'members'), [row])
  assert.equal(memberCanEdit(row, ['BAKERY_OWNER']), false)
  assert.equal(canManageEntity(row, ['BAKERY_OWNER'], 'categories'), false)
  assert.equal(canManageEntity({ ...row, memberRole: 'OWNER' }, ['BAKERY_OWNER'], 'members'), false)
})

test('Legacy operation field names are migrated without replacing configured hours or primary choices', () => {
  const saved = createSeed(), shop = saved.bakeries[0]
  shop.operations.addresses[0] = { ...shop.operations.addresses[0], primary: true }
  delete shop.operations.addresses[0].isPrimary
  shop.operations.businessHours = [{ dayOfWeek: 1, openTime: '07:30', closeTime: '19:30', closed: false }, { dayOfWeek: 2, opensAt: '09:00', closesAt: '17:00', openTime: '01:00', closeTime: '23:00', closed: false }]
  const store = createDemoStore({ getItem: key => key === DEMO_STORAGE_KEY ? JSON.stringify(saved) : null, setItem() {} })
  const actual = store.state.bakeries[0].operations
  assert.equal(actual.addresses[0].isPrimary, true)
  assert.equal(actual.businessHours[0].opensAt, '07:30')
  assert.equal(actual.businessHours[0].closesAt, '19:30')
  assert.equal(actual.businessHours[1].opensAt, '09:00')
  assert.equal(actual.businessHours[1].closesAt, '17:00')
  assert.equal(actual.serviceAreas[0].minimumOrder, undefined, 'missing business values are never invented')
})

test('Offer detail survives initial loading with verified membership and never requests a missing request ID', () => {
  const bakeryId = randomUUID(), user = { id: randomUUID() }
  globalThis.__vendorEditorResources = { loadVendorMembership: { status: 'ready', data: { memberRole: 'OWNER', status: 'ACTIVE' } } }
  const html = renderToStaticMarkup(React.createElement(ManageOffer, { id: randomUUID(), bakeryId, user, roles: ['BAKERY_OWNER'] }))
  assert.match(html, /Đang tải/)
  assert.doesNotMatch(html, /Sửa báo giá|Rút báo giá/)
})
test('Only an authorized pending unexpired offer exposes edit/withdraw actions without contradictory advice', () => {
  const bakeryId = randomUUID(), id = randomUUID(), user = { id: randomUUID() }
  const make = (status, expiresAt, memberRole = 'OWNER') => {
    globalThis.__vendorEditorResources = { loadVendorMembership: { status: 'ready', data: { memberRole, status: 'ACTIVE' } }, loadOffer: { status: 'ready', data: { id, bakeryId, cakeRequestId: randomUUID(), status, expiresAt, items: [] } } }
    return renderToStaticMarkup(React.createElement(ManageOffer, { id, bakeryId, user, roles: ['BAKERY_OWNER'] }))
  }
  const html = make('PENDING', '2099-01-01T00:00:00Z')
  assert.match(html, /Sửa báo giá/); assert.match(html, /Rút báo giá/)
  assert.doesNotMatch(html, /Không có quyền|không thể sửa hoặc rút/)
  for (const status of ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED']) assert.doesNotMatch(make(status, '2099-01-01T00:00:00Z'), />Sửa báo giá<|>Rút báo giá</)
  assert.doesNotMatch(make('PENDING', '2000-01-01T00:00:00Z'), />Sửa báo giá<|>Rút báo giá</)
  assert.doesNotMatch(make('PENDING', '2099-01-01T00:00:00Z', 'STAFF'), />Sửa báo giá<|>Rút báo giá</)
})
