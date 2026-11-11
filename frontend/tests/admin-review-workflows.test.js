import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
import { randomUUID } from 'node:crypto'
let vite, Users, RoleForm, UserDecision, PaymentReview, service
const nativeFetch = globalThis.fetch, actorId = randomUUID(), id = 'de000000-0000-4000-8000-000000060001', orderId = randomUUID(), bakeryId = randomUUID()
const person = { id, displayName: 'Nguyễn Minh', email: 'minh@example.test', roles: ['CUSTOMER'], status: 'ACTIVE' }
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'admin-review-events', enforce: 'pre', load(id) {
    const path = id.replaceAll('\\', '/')
    if (path.endsWith('/src/context/useAuth.js')) return 'export function useAuth(){return globalThis.__adminAuth}'
    if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export function useCatalogResource(load){return globalThis.__adminResources[load.name]||{status:"loading",data:null,reload(){}}}'
  }, transform(code, id) {
    if (['AdminUsersPage.jsx', 'AdminPaymentsPage.jsx'].some((name) => id.replaceAll('\\', '/').endsWith('/' + name))) return code.replace("import React, { useRef, useState } from 'react'", "import React from 'react'\nconst useState=(value)=>globalThis.__adminState(value),useRef=(value)=>globalThis.__adminState(()=>({current:value}))[0]")
  } }] })
  const module = await vite.ssrLoadModule('/src/pages/admin/users/AdminUsersPage.jsx')
  Users = module.UserDirectory; RoleForm = module.RoleForm; UserDecision = module.UserDecision
  PaymentReview = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminPaymentsPage.jsx')).PaymentReview
  service = await vite.ssrLoadModule('/src/services/adminUserService.js')
  ;(await vite.ssrLoadModule('/src/services/apiClient.js')).setAuthToken('fixture')
})
after(async () => { globalThis.fetch = nativeFetch; await vite?.close(); for (const key of ['__adminAuth', '__adminResources', '__adminState']) delete globalThis[key] })
const ready = (data, reload = () => {}) => ({ status: 'ready', data, reload })
const nodes = (tree) => Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children), ...nodes(tree.props.footer)] : []
const text = (tree) => Array.isArray(tree) ? tree.map(text).join('') : tree?.props ? text(tree.props.children) + text(tree.props.footer || '') : String(tree ?? '')
const button = (tree, label) => nodes(tree).find((node) => node.type === 'button' && text(node.props.children).endsWith(label))
function harness(Component, props = {}, resources = {}, roles = ['ADMIN']) {
  let cursor = 0; const state = []
  globalThis.__adminAuth = { user: { id: actorId }, roles }; globalThis.__adminResources = resources
  globalThis.__adminState = (initial) => { const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial; return [state[i], (value) => { state[i] = typeof value === 'function' ? value(state[i]) : value }] }
  return () => { cursor = 0; return Component(props) }
}
test('User delete opens a dialog; cancellation sends nothing; confirmation sends status DELETED and refreshes', async () => {
  const calls = []; let reloads = 0
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ data: { ...person, status: 'DELETED' } }) }
  const render = harness(Users, {}, { loadUsers: ready({ result: [person], meta: { total: 1 } }, () => reloads++) })
  nodes(render()).find(node => node.type?.name === 'UserRowActions').props.remove.onClick()
  let dialog = nodes(render()).find((node) => node.type === UserDecision)
  assert.equal(calls.length, 0); assert.equal(dialog.props.person.email, person.email)
  dialog.props.onClose(); assert.equal(calls.length, 0); assert.ok(!nodes(render()).some((node) => node.type === UserDecision))
  nodes(render()).find(node => node.type?.name === 'UserRowActions').props.remove.onClick(); dialog = nodes(render()).find((node) => node.type === UserDecision)
  await dialog.props.onConfirm()
  assert.equal(calls.length, 1); assert.equal(calls[0].options.method, 'PATCH')
  assert.ok(String(calls[0].url).endsWith('/admin/users/' + id + '/status'))
  assert.deepEqual(JSON.parse(calls[0].options.body), { status: 'DELETED' }); assert.equal(reloads, 1)
  assert.ok(!nodes(render()).some((node) => node.type === UserDecision))
})
test('Failed delete keeps the selected person and dialog; double confirm is suppressed', async () => {
  let finish, calls = 0
  globalThis.fetch = async () => { calls++; return new Promise((resolve) => { finish = () => resolve(Response.json({ message: 'Không thể xóa.' }, { status: 500 })) }) }
  const render = harness(Users, {}, { loadUsers: ready({ result: [person], meta: { total: 1 } }) })
  nodes(render()).find(node => node.type?.name === 'UserRowActions').props.remove.onClick(); const dialog = nodes(render()).find((node) => node.type === UserDecision)
  const pending = dialog.props.onConfirm(); await dialog.props.onConfirm(); assert.equal(calls, 1)
  finish(); await pending
  const retained = nodes(render()).find((node) => node.type === UserDecision)
  assert.equal(retained.props.person.id, id); assert.equal(retained.props.error.status, 500)
})
test('Role form only saves a changed, non-empty role set and cancel does not write', () => {
  const saved = []
  const render = harness(RoleForm, { person, onSave(roles) { saved.push(roles) }, onClose() {} })
  const form = () => nodes(render()).find((node) => node.type === 'form')
  const box = (role) => nodes(render()).find((node) => node.type === 'input' && node.props.value === role)
  form().props.onSubmit({ preventDefault() {} }); assert.equal(saved.length, 0)
  assert.equal(button(render(), 'Lưu vai trò').props.disabled, true)
  box('BAKERY_OWNER').props.onChange()
  assert.equal(button(render(), 'Lưu vai trò').props.disabled, false)
  form().props.onSubmit({ preventDefault() {} }); assert.deepEqual(saved, [['CUSTOMER', 'BAKERY_OWNER']])
  box('CUSTOMER').props.onChange(); box('BAKERY_OWNER').props.onChange()
  assert.equal(button(render(), 'Lưu vai trò').props.disabled, true)
  assert.match(text(render()), /ít nhất một vai trò/)
  form().props.onSubmit({ preventDefault() {} }); assert.equal(saved.length, 1)
  assert.ok(button(render(), 'Hủy').props['data-modal-close'] !== undefined)
})

test('User confirmation labels identify the operation and protected decisions explain disabled state', () => {
  for (const [action, status, label] of [['status', 'ACTIVE', 'Khóa tài khoản'], ['status', 'BLOCKED', 'Mở khóa'], ['delete', 'ACTIVE', 'Xác nhận xóa']]) {
    const tree = UserDecision({ person: { ...person, status }, action, busy: false, disabledReason: 'Hồ sơ được bảo vệ.' })
    const buttons = nodes(tree.props.footer).filter((n) => n.type === 'button')
    assert.equal(text(buttons[0]), 'Hủy'); assert.ok(text(buttons[1]).endsWith(label))
    assert.equal(buttons[1].props.disabled, true); assert.match(text(tree), /Hồ sơ được bảo vệ/)
    if (action === 'delete') assert.match(text(tree), /thu hồi/)
  }
})

test('User service rejects self operations and invalid contract values before any request', async () => {
  let calls = 0; globalThis.fetch = async () => { calls++; throw Error('Unexpected request') }
  const self = { ...person, id: actorId }
  await assert.rejects(service.deleteUser(self, { id: actorId }), { status: 403 })
  await assert.rejects(service.changeUserStatus(self, { id: actorId }, 'BLOCKED'), { status: 403 })
  await assert.rejects(service.updateUserRoles(self, ['CUSTOMER'], { id: actorId }), { status: 403 })
  await assert.rejects(service.changeUserStatus(person, { id: actorId }, 'SUSPENDED'), { status: 400 })
  await assert.rejects(service.changeUserStatus(person, { id: actorId }, 'ACTIVE'), { status: 409 })
  await assert.rejects(service.updateUserRoles(person, [], { id: actorId }), { status: 422 })
  await assert.rejects(service.updateUserRoles(person, ['BAKERY_STAFF'], { id: actorId }), { status: 422 })
  assert.equal(calls, 0)
})
test('User service follows the admin user contract and verifies responses', async () => {
  const calls = []; let reply = person
  globalThis.fetch = async (url, options) => { calls.push({ url: String(url), options }); return Response.json({ data: reply }) }
  reply = { result: [person], meta: { page: 1, pageSize: 12, pages: 1, total: 1 } }
  await service.loadUsers({ page: 1, size: 12, email: 'minh', status: '', role: 'CUSTOMER', name: 'ignored' })
  assert.ok(calls[0].url.endsWith('/admin/users?page=1&size=12&email=minh&role=CUSTOMER'))
  reply = { ...person, roles: ['CUSTOMER', 'BAKERY_OWNER'] }
  await service.updateUserRoles(person, ['CUSTOMER', 'BAKERY_OWNER', 'CUSTOMER'], { id: actorId })
  assert.equal(calls[1].options.method, 'PUT'); assert.ok(calls[1].url.endsWith('/admin/users/' + id + '/roles'))
  assert.deepEqual(JSON.parse(calls[1].options.body), { roles: ['CUSTOMER', 'BAKERY_OWNER'] })
  reply = person
  await assert.rejects(service.changeUserStatus(person, { id: actorId }, 'BLOCKED'), { status: 502 })
  assert.equal(calls[2].options.method, 'PATCH'); assert.deepEqual(JSON.parse(calls[2].options.body), { status: 'BLOCKED' })
})
test('Payment review only writes after confirmation and requires a reason only for rejection', async () => {
  let calls = 0, completed = 0
  globalThis.fetch = async () => { calls++; return Response.json({ message: 'Hệ thống bận' }, { status: 500 }) }
  const payment = { id: randomUUID(), subscriptionOrderId: orderId, amount: 199000, currency: 'VND', status: 'SUBMITTED' }
  const order = { id: orderId, bakeryId, status: 'PAYMENT_REVIEW', totalAmount: 199000, currency: 'VND' }
  const render = harness(PaymentReview, { payment, onClose() {}, onReload() {}, onComplete() { completed++ } }, { loadPaymentContext: ready({ order }) })
  button(render(), 'Từ chối').props.onClick(); assert.equal(calls, 0)
  let form = nodes(render()).find((node) => node.type === 'form')
  await form.props.onSubmit({ preventDefault() {} }); assert.equal(calls, 0)
  nodes(render()).find((node) => node.type === 'textarea').props.onChange({ target: { value: 'Chứng từ không khớp giao dịch.' } })
  form = nodes(render()).find((node) => node.type === 'form')
  await form.props.onSubmit({ preventDefault() {} }); assert.equal(calls, 1); assert.equal(completed, 0)
  assert.ok(nodes(render()).some((node) => node.type?.name === 'ApiErrorMessage'))
})

test('Confirmed payment rejection keeps the detail and actual review result synchronized without old actions', async () => {
  const payment = { id: randomUUID(), subscriptionOrderId: orderId, amount: 199000, currency: 'VND', status: 'SUBMITTED' }
  const order = { id: orderId, bakeryId, status: 'PAYMENT_REVIEW', totalAmount: 199000, currency: 'VND', featuresSnapshot: {} }
  const reviewedAt = '2026-10-29T10:00:00Z'; let completed = 0
  globalThis.fetch = async () => Response.json({ data: { payment: { ...payment, status: 'REJECTED', reviewedAt, reviewNote: 'Cần bổ sung chứng từ.' }, order: { ...order, status: 'PENDING_PAYMENT' }, subscription: null } })
  const render = harness(PaymentReview, { payment, onComplete() { completed++ } }, { loadPaymentContext: ready({ order }) })
  button(render(), 'Từ chối').props.onClick()
  nodes(render()).find((n) => n.type === 'textarea').props.onChange({ target: { value: 'Cần bổ sung chứng từ.' } })
  await nodes(render()).find((n) => n.type === 'form').props.onSubmit({ preventDefault() {} })
  assert.equal(completed, 1)
  assert.equal(button(render(), 'Từ chối'), undefined); assert.equal(button(render(), 'Phê duyệt thanh toán'), undefined)
  assert.ok(nodes(render()).some((n) => n.type?.name === 'ReviewField' && n.props.label === 'Ghi chú xử lý' && n.props.value === 'Cần bổ sung chứng từ.'))
  assert.match(text(render()), /Đã cập nhật chứng từ/)
})

test('Approval note is optional and concurrent confirmation cannot send a second request', async () => {
  const payment = { id: randomUUID(), subscriptionOrderId: orderId, amount: 199000, currency: 'VND', status: 'SUBMITTED' }
  const order = { id: orderId, bakeryId, status: 'PAYMENT_REVIEW', totalAmount: 199000, currency: 'VND', featuresSnapshot: {} }
  let calls = 0, finish, saved
  globalThis.fetch = async (_url, options) => { calls++; saved = options; return new Promise((resolve) => { finish = () => resolve(Response.json({ data: { payment: { ...payment, status: 'APPROVED' }, order: { ...order, status: 'COMPLETED' }, subscription: { id: randomUUID(), status: 'ACTIVE' } } })) }) }
  const render = harness(PaymentReview, { payment, onComplete() {} }, { loadPaymentContext: ready({ order }) })
  button(render(), 'Phê duyệt thanh toán').props.onClick()
  const submit = () => nodes(render()).find((n) => n.type === 'form').props.onSubmit({ preventDefault() {} })
  const pending = submit(); await submit(); assert.equal(calls, 1)
  assert.deepEqual(JSON.parse(saved.body), { reviewNote: null })
  assert.ok(new Headers(saved.headers).get('Idempotency-Key'))
  finish(); await pending
  assert.equal(button(render(), 'Phê duyệt thanh toán'), undefined)
})
test('Payment directory enriches from existing order/bakery routes and preserves list errors', async () => {
  const { loadPaymentDirectory } = await vite.ssrLoadModule('/src/services/adminPaymentPresentation.js')
  const calls = [], payment = { id: randomUUID(), subscriptionOrderId: orderId, status: 'SUBMITTED', amount: 199000, currency: 'VND' }
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return Response.json({ data: String(url).includes('/admin/bakery-payments') ? { result: [payment, { ...payment, id: randomUUID() }], meta: { page: 1, pageSize: 20, pages: 1, total: 2 } } : String(url).includes('/subscription-orders/') ? { id: orderId, bakeryId, status: 'PAYMENT_REVIEW', planNameSnapshot: 'Nghệ nhân', totalAmount: 199000, currency: 'VND' } : { bakery: { id: bakeryId, name: 'Tiệm Hoa', status: 'ACTIVE' }, members: [] } })
  }
  const result = await loadPaymentDirectory({ page: 1 }, {})
  assert.equal(result.result[0].context.profile.bakery.name, 'Tiệm Hoa')
  assert.equal(result.result[0].context.order.planNameSnapshot, 'Nghệ nhân')
  assert.equal(calls.length, 3); assert.ok(calls.every((call) => call.options.method === 'GET'))
  globalThis.fetch = async () => Response.json({ message: 'Hệ thống bận' }, { status: 500 })
  await assert.rejects(loadPaymentDirectory({ page: 1 }, {}), { status: 500 })
})
test('Customer cannot open user mutations or payment review decisions', () => {
  let render = harness(Users, {}, { loadUsers: ready({ result: [person], meta: { total: 1 } }) }, ['CUSTOMER'])
  assert.equal(nodes(render()).find(node => node.type?.name === 'UserRowActions').props.disabled, true)
  render = harness(PaymentReview, { payment: { id, subscriptionOrderId: orderId, status: 'SUBMITTED', amount: 199000, currency: 'VND' } }, { loadPaymentContext: ready({ order: { id: orderId, status: 'PAYMENT_REVIEW', totalAmount: 199000, currency: 'VND' } }) }, ['CUSTOMER'])
  assert.ok(!button(render(), 'Phê duyệt thanh toán')); assert.ok(!button(render(), 'Từ chối'))
})
