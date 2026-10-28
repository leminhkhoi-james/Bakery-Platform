import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
import { displayReference } from '../src/services/displayReference.js'

const id = 'de000000-0000-4000-8000-000000000010'
test('Short references are stable across pages/casing and use the whole UUID, not the repeated prefix', () => {
  assert.equal(displayReference(id, 'SHOP'), displayReference(id.toUpperCase(), 'SHOP'))
  assert.match(displayReference(id, 'SHOP'), /^SHOP-[A-Z0-9]{10}$/)
  const labels = Array.from({ length: 1000 }, (_, index) => displayReference('de000000-0000-4000-8000-' + String(index).padStart(12, '0'), 'SHOP'))
  assert.equal(new Set(labels).size, labels.length)
  assert.equal(displayReference(null, 'ORD'), '—')
})
test('Official business codes take priority without replacing any stored ID', () => {
  const row = { id, orderNumber: 'ORD-2026-007' }, before = structuredClone(row)
  assert.equal(displayReference(row.id, 'ORD', row.orderNumber), 'ORD-2026-007')
  assert.equal(displayReference(row.id, 'ORD', row.id), displayReference(row.id, 'ORD'))
  assert.equal(displayReference('legacy-order', 'ORD'), 'legacy-order')
  assert.deepEqual(row, before)
})

let vite, Vendors
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'display-reference-interaction-fixture', enforce: 'pre', load(path) {
    path = path.replaceAll('\\', '/')
    if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export const useCatalogResource = () => ({ status: "ready", data: { result: [{ id: "de000000-0000-4000-8000-000000000010", name: "Tiệm cần duyệt", status: "PENDING_APPROVAL" }], meta: { page: 1, pageSize: 20, pages: 1, total: 1 } }, reload() {} })'
    if (path.endsWith('/src/context/useAuth.js')) return 'export const useAuth = () => ({ user: { id: "admin", roles: ["ADMIN"] }, roles: ["ADMIN"] })'
  }, transform(code, path) {
    if (path.replaceAll('\\', '/').endsWith('/AdminVendorsPage.jsx')) return code.replace("import React, { useState } from 'react'", "import React from 'react'\nconst useState=(initial)=>globalThis.__referenceState(initial)")
  } }] })
  Vendors = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminVendorsPage.jsx')).default
})
after(async () => { await vite?.close(); delete globalThis.__referenceState })
const nodes = (node) => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : []
const text = (node) => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : ''
test('Bakery tables show a short code while row identity and detail lookup keep the original UUID', () => {
  const states = []; let cursor = 0
  globalThis.__referenceState = (initial) => { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], (next) => { states[i] = next }] }
  const render = () => { cursor = 0; return Vendors({ onNavigate() {} }) }
  const tree = render()
  assert.ok(nodes(tree).some((node) => node.type === 'tr' && node.key === id))
  assert.ok(text(tree).includes(displayReference(id, 'SHOP')))
  assert.ok(!text(tree).includes(id))
  nodes(tree).find((node) => node.type === 'button' && text(node) === 'Xem / duyệt hồ sơ').props.onClick()
  const detail = nodes(render()).find((node) => node.type?.name === 'BakeryReview')
  assert.equal(detail.props.id, id)
  assert.equal(detail.key, id)
})
