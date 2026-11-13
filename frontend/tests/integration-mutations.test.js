// Tests actual UI mutation callbacks with isolated HTTP responses and resource reload spies.
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { createServer } from 'vite'
let vite, Entity, Assets, Review, Plans, Design, ReviewModeration
const id = randomUUID(), bakeryId = randomUUID(), userId = randomUUID(), jobId = randomUUID(), groupId = randomUUID(), valueId = randomUUID()
const nativeFetch = globalThis.fetch
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'mutation-event-fixture-only', enforce: 'pre', load(id) {
    const path = id.replaceAll('\\', '/')
    if (path.endsWith('/src/context/useAuth.js')) return 'export function useAuth() { return globalThis.__mutationAuth; }'
    if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export function useCatalogResource(load) { return globalThis.__mutationResources[load.name] || { status: "loading", data: null, error: null, reload() {} }; }'
  }, transform(code, id) {
    const path = id.replaceAll('\\', '/').split('?')[0]
    if (['CatalogEntityManager.jsx', 'ProductAssets.jsx', 'OrderReview.jsx', 'AdminPlansPage.jsx', 'AdminModerationPage.jsx', 'ReviewModeration.jsx'].some((name) => path.endsWith('/' + name))) {
      return code.replace("import React, { useRef, useState } from 'react'", "import React from 'react'\nconst useState = (value) => globalThis.__mutationState(value), useRef = (value) => globalThis.__mutationState(() => ({ current: value }))[0]").replace("import React, { useState } from 'react'", "import React from 'react'\nconst useState = (value) => globalThis.__mutationState(value)")
    }
  } }] })
  Entity = (await vite.ssrLoadModule('/src/components/management/CatalogEntityManager.jsx')).default
  Assets = (await vite.ssrLoadModule('/src/components/management/ProductAssets.jsx')).default
  Review = (await vite.ssrLoadModule('/src/components/orders/OrderReview.jsx')).default
  Plans = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminPlansPage.jsx')).default
  Design = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminModerationPage.jsx')).DesignModeration
  ReviewModeration = (await vite.ssrLoadModule('/src/components/orders/ReviewModeration.jsx')).default
  ;(await vite.ssrLoadModule('/src/services/apiClient.js')).setAuthToken('fixture-token')
})
after(async () => { globalThis.fetch = nativeFetch; await vite?.close(); for (const key of ['__mutationAuth', '__mutationResources', '__mutationState']) delete globalThis[key] })
const ready = (data, reload = () => {}) => ({ status: 'ready', error: null, data, reload })
function harness(Component, props, resources, roles) {
  const values = []; let cursor = 0
  globalThis.__mutationAuth = { user: { id: userId, roles }, roles }; globalThis.__mutationResources = resources
  globalThis.__mutationState = (initial) => { const index = cursor++; if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial; return [values[index], (next) => { values[index] = typeof next === 'function' ? next(values[index]) : next }] }
  return () => { cursor = 0; return Component(props) }
}
function nodes(tree) { if (Array.isArray(tree)) return tree.flatMap(nodes); return tree?.props ? [tree, ...nodes(tree.props.children)] : [] }
const text = (tree) => Array.isArray(tree) ? tree.map(text).join('') : tree?.props ? text(tree.props.children) : String(tree ?? '')
const button = (tree, label) => nodes(tree).find((node) => node.type === 'button' && text(node.props.children) === label)
const reply = (data, status = 200) => status === 204 ? new Response(null, { status }) : Response.json({ data, statusCode: status, message: 'Fixture' }, { status })
const flush = () => new Promise((resolve) => setImmediate(resolve))
test('Vendor real edit/delete callbacks issue PATCH/DELETE and reload resources after confirmation', async () => {
  let reloads = 0; const calls = [], row = { id, name: 'Old', slug: 'old', displayOrder: 0, active: true }
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return options.method === 'DELETE' ? reply(null, 204) : reply({ ...row, name: 'Saved by server' }) }
  const render = harness(Entity, { bakeryId, kind: 'categories' }, { loadCatalogEntities: ready([row], () => reloads++), loadVendorMembership: ready({ memberRole: 'OWNER', status: 'ACTIVE' }) }, ['BAKERY_OWNER'])
  nodes(render()).find(node => node.type?.name === 'VendorActionMenu').props.onConfirm('edit')
  const form = nodes(render()).find((node) => node.type?.name === 'CatalogEntityForm')
  await form.props.onSave({ ...row, name: 'Changed' })
  assert.equal(calls[0].options.method, 'PATCH'); assert.equal(reloads, 1)
  assert.equal(calls.length, 1) // Merely rendering the menu never deletes a record.
  await nodes(render()).find(node => node.type?.name === 'VendorActionMenu').props.onConfirm('delete')
  assert.equal(calls[1].options.method, 'DELETE'); assert.equal(reloads, 2)
})
test('Product options handler keeps server-assigned IDs in parent snapshot and refreshes without fake local options', async () => {
  const backend = { groups: [{ id: groupId, name: 'Flavor', selectionType: 'SINGLE', required: false, minimumSelections: 0, maximumSelections: 1, displayOrder: 0, values: [{ id: valueId, name: 'Vanilla', active: true, priceAdjustment: 0, displayOrder: 0 }] }] }
  const snapshots = [], busy = []; let changed = 0
  globalThis.fetch = async (_url, options) => { assert.equal(options.method, 'PUT'); return reply(backend) }
  const render = harness(Assets, { bakeryId, product: { id }, initialSnapshot: { options: { groups: [] }, images: [] }, onSnapshot: (snapshot) => snapshots.push(snapshot), onChanged: () => changed++, onBusy: (value) => busy.push(value) }, { loadProductSnapshot: ready(null) }, ['BAKERY_OWNER'])
  const editor = nodes(render()).find((node) => node.type?.name === 'OptionsEditor')
  const input = { groups: [{ ...backend.groups[0], id: undefined, values: backend.groups[0].values.map((value) => ({ ...value, id: undefined })) }] }
  await editor.props.onSave(input)
  assert.equal(snapshots[0].options.groups[0].id, groupId); assert.equal(changed, 1); assert.deepEqual(busy, [true, false])
})
test('Review UI input/submit sends POST and asks OrderDetail to read back authoritative data', async () => {
  const calls = []; let changed = 0
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return reply({ orderId: id, customerId: userId, rating: 5, comment: 'Fixture review', status: 'PUBLISHED' }) }
  const render = harness(Review, { order: { id, customerId: userId, status: 'COMPLETED' }, onChanged: () => changed++ }, {}, ['CUSTOMER'])
  nodes(render()).find((node) => node.type === 'select').props.onChange({ target: { value: '5' } })
  nodes(render()).find((node) => node.type === 'textarea').props.onChange({ target: { value: 'Fixture review' } })
  nodes(render()).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} }); await flush()
  assert.equal(calls[0].options.method, 'POST'); assert.deepEqual(JSON.parse(calls[0].options.body), { rating: 5, comment: 'Fixture review' }); assert.equal(changed, 1)
})
test('Admin actual create-plan callback POSTs whitelisted form and reloads plans', async () => {
  let reloaded = 0; const calls = []
  const dto = { id, code: 'FIXTURE', name: 'Fixture', description: '', monthlyPrice: 123000, currency: 'VND', billingPeriodMonths: 1, status: 'INACTIVE', features: {} }
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return reply(dto, 201) }
  const render = harness(Plans, { onNavigate() {} }, { loadAdminPlans: ready([], () => reloaded++) }, ['ADMIN'])
  button(render(), 'Tạo gói mới').props.onClick()
  const form = nodes(render()).find((node) => node.type?.name === 'AdminPlanForm')
  await form.props.onSave({ ...dto, featureRows: [] })
  assert.equal(calls[0].url, '/api/v1/admin/subscription-plans'); assert.equal(JSON.parse(calls[0].options.body).id, undefined); assert.equal(reloaded, 1)
})

test('Plan action dialog defers writes until confirmation, suppresses double submits and shows only verified status', async () => {
  let reloaded = 0, finish
  const calls = [], plan = { id, code: 'FIXTURE', name: 'Gói kiểm thử', monthlyPrice: 199000, currency: 'VND', billingPeriodMonths: 1, status: 'ACTIVE', features: { products: '20' } }
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return new Promise((resolve) => { finish = () => resolve(reply({ ...plan, status: 'INACTIVE' })) }) }
  const render = harness(Plans, { onNavigate() {} }, { loadAdminPlans: ready([plan], () => reloaded++) }, ['ADMIN'])
  const card = () => nodes(render()).find((node) => node.type?.name === 'AdminPlanCard')
  const dialog = () => nodes(render()).find((node) => node.type?.name === 'AdminPlanActionDialog')
  card().props.onAction('archive'); assert.equal(calls.length, 0)
  dialog().props.onClose(); assert.equal(calls.length, 0)
  card().props.onAction('pause')
  const confirm = dialog().props.onConfirm, pending = confirm()
  await confirm(); assert.equal(calls.length, 1)
  assert.equal(card().props.plan.status, 'ACTIVE', 'no optimistic fake success')
  finish(); await pending
  assert.deepEqual(JSON.parse(calls[0].options.body), { status: 'INACTIVE' })
  assert.equal(card().props.plan.status, 'INACTIVE'); assert.equal(reloaded, 1); assert.equal(dialog(), undefined)
})

test('Failed plan actions keep the confirmation open and cannot fabricate a successful status', async () => {
  const plan = { id, code: 'FIXTURE', name: 'Gói kiểm thử', status: 'ACTIVE', monthlyPrice: 199000, currency: 'VND', billingPeriodMonths: 1, features: {} }
  globalThis.fetch = async () => reply(null, 503)
  const render = harness(Plans, { onNavigate() {} }, { loadAdminPlans: ready([plan]) }, ['ADMIN'])
  nodes(render()).find((node) => node.type?.name === 'AdminPlanCard').props.onAction('archive')
  await nodes(render()).find((node) => node.type?.name === 'AdminPlanActionDialog').props.onConfirm()
  assert.equal(nodes(render()).find((node) => node.type?.name === 'AdminPlanActionDialog').props.error.status, 503)
  assert.equal(nodes(render()).find((node) => node.type?.name === 'AdminPlanCard').props.plan.status, 'ACTIVE')
  assert.doesNotMatch(text(render()), /Đã cập nhật gói dịch vụ/)
})
test('Design moderation actual UI requires selection and acknowledgement, PATCHs then reloads', async () => {
  let reloaded = 0; const calls = []
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return reply({ id, generationJobId: jobId, moderationStatus: 'APPROVED' }) }
  const render = harness(Design, { id }, { loadModerationDesign: ready({ id, generationJobId: jobId, moderationStatus: 'PENDING' }, () => reloaded++) }, ['ADMIN'])
  const actions = nodes(render()).find((node) => node.type?.name === 'EntityActionButtons')
  assert.deepEqual(actions.props.actions.map((action) => action.key), ['APPROVED', 'REJECTED'])
  assert.equal(calls.length, 0)
  await actions.props.onConfirm('APPROVED')
  assert.equal(calls[0].options.method, 'PATCH'); assert.deepEqual(JSON.parse(calls[0].options.body), { moderationStatus: 'APPROVED' }); assert.equal(reloaded, 1)
})
test('Review moderation UI PATCHs HIDDEN only after confirmation and triggers resource read', async () => {
  let changed = 0; const calls = []
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return reply({ orderId: id, customerId: userId, rating: 5, status: 'HIDDEN' }) }
  const render = harness(ReviewModeration, { review: { orderId: id, status: 'PUBLISHED' }, onChanged: () => changed++ }, {}, ['ADMIN'])
  nodes(render()).find((node) => node.type === 'input').props.onChange({ target: { checked: true } })
  await button(render(), 'Ẩn đánh giá').props.onClick()
  assert.deepEqual(JSON.parse(calls[0].options.body), { status: 'HIDDEN' }); assert.equal(changed, 1)
})
test('Failed Vendor mutation exposes backend error, never emits success, and refreshes on conflict', async () => {
  let reloads = 0; globalThis.fetch = async () => reply(null, 409)
  const row = { id, name: 'Category', slug: 'category', displayOrder: 0, active: true }
  const render = harness(Entity, { bakeryId, kind: 'categories' }, { loadCatalogEntities: ready([row], () => reloads++), loadVendorMembership: ready({ memberRole: 'OWNER', status: 'ACTIVE' }) }, ['BAKERY_OWNER'])
  nodes(render()).find(node => node.type?.name === 'VendorActionMenu').props.onConfirm('edit')
  await nodes(render()).find((node) => node.type?.name === 'CatalogEntityForm').props.onSave(row)
  const tree = render()
  // The conflict must reach the still-open form, rather than the inert page behind its dialog.
  const failedForm = nodes(tree).find((node) => node.type?.name === 'CatalogEntityForm')
  assert.equal(failedForm.props.error.status, 409)
  assert.doesNotMatch(text(tree), /Backend đã xác nhận/); assert.equal(reloads, 1)
})

