import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
import { randomUUID } from 'node:crypto'
let vite, Users, UserForm, UserDecision, PaymentReview, service
const nativeFetch = globalThis.fetch, actorId = randomUUID(), id = 'de000000-0000-4000-8000-000000060001', orderId = randomUUID(), bakeryId = randomUUID()
const person = { id, name: 'Nguyễn Minh', email: 'minh@example.test', roles: ['CUSTOMER'], status: 'ACTIVE' }
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'admin-review-events', enforce: 'pre', load(id) {
    const path = id.replaceAll('\\', '/')
    if (path.endsWith('/src/context/useAuth.js')) return 'export function useAuth(){return globalThis.__adminAuth}'
    if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export function useCatalogResource(load){return globalThis.__adminResources[load.name]||{status:"loading",data:null,reload(){}}}'
    if (path.endsWith('/src/mockData/admin/userManagement.js')) return 'export const localUserDirectory=()=>globalThis.__adminLocal; export const localUserRestriction=()=>null'
  }, transform(code, id) {
    if (['AdminUsersPage.jsx', 'AdminPaymentsPage.jsx'].some((name) => id.replaceAll('\\', '/').endsWith('/' + name))) return code.replace("import React, { useRef, useState } from 'react'", "import React from 'react'\nconst useState=(value)=>globalThis.__adminState(value),useRef=(value)=>globalThis.__adminState(()=>({current:value}))[0]")
  } }] })
  const module = await vite.ssrLoadModule('/src/pages/admin/users/AdminUsersPage.jsx')
  Users = module.UserDirectory; UserForm = module.UserForm; UserDecision = module.UserDecision
  PaymentReview = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminPaymentsPage.jsx')).PaymentReview
  service = await vite.ssrLoadModule('/src/services/adminUserService.js')
  ;(await vite.ssrLoadModule('/src/services/apiClient.js')).setAuthToken('fixture')
})
after(async () => { globalThis.fetch = nativeFetch; await vite?.close(); for (const key of ['__adminAuth', '__adminResources', '__adminLocal', '__adminState']) delete globalThis[key] })
const ready = (data, reload = () => {}) => ({ status: 'ready', data, reload })
const nodes = (tree) => Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children), ...nodes(tree.props.footer)] : []
const text = (tree) => Array.isArray(tree) ? tree.map(text).join('') : tree?.props ? text(tree.props.children) + text(tree.props.footer || '') : String(tree ?? '')
const button = (tree, label) => nodes(tree).find((node) => node.type === 'button' && text(node.props.children).endsWith(label))
function harness(Component, props = {}, resources = {}, roles = ['ADMIN']) {
  let cursor = 0; const state = []
  globalThis.__adminAuth = { user: { id: actorId }, roles }; globalThis.__adminResources = resources; globalThis.__adminLocal = true
  globalThis.__adminState = (initial) => { const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial; return [state[i], (value) => { state[i] = typeof value === 'function' ? value(state[i]) : value }] }
  return () => { cursor = 0; return Component(props) }
}
test('User delete opens a dialog; cancellation sends nothing; explicit confirmation alone deletes and refreshes', async () => {
  const calls = []; let reloads = 0
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ data: null }) }
  const render = harness(Users, {}, { loadUsers: ready({ result: [person], meta: { total: 1 } }, () => reloads++) })
  button(render(), 'Xóa').props.onClick()
  let dialog = nodes(render()).find((node) => node.type === UserDecision)
  assert.equal(calls.length, 0); assert.equal(dialog.props.person.email, person.email)
  dialog.props.onClose(); assert.equal(calls.length, 0); assert.ok(!nodes(render()).some((node) => node.type === UserDecision))
  button(render(), 'Xóa').props.onClick(); dialog = nodes(render()).find((node) => node.type === UserDecision)
  await dialog.props.onConfirm()
  assert.equal(calls.length, 1); assert.equal(calls[0].options.method, 'DELETE'); assert.equal(reloads, 1)
  assert.ok(!nodes(render()).some((node) => node.type === UserDecision))
})
test('Failed delete keeps the selected person and dialog; double confirm is suppressed', async () => {
  let finish, calls = 0
  globalThis.fetch = async () => { calls++; return new Promise((resolve) => { finish = () => resolve(Response.json({ message: 'Không thể xóa.' }, { status: 500 })) }) }
  const render = harness(Users, {}, { loadUsers: ready({ result: [person], meta: { total: 1 } }) })
  button(render(), 'Xóa').props.onClick(); const dialog = nodes(render()).find((node) => node.type === UserDecision)
  const pending = dialog.props.onConfirm(); await dialog.props.onConfirm(); assert.equal(calls, 1)
  finish(); await pending
  const retained = nodes(render()).find((node) => node.type === UserDecision)
  assert.equal(retained.props.person.id, id); assert.equal(retained.props.error.status, 500)
})
test('User create/edit stays in modal; field validation and cancel do not write', async () => {
  let saved = 0
  const render = harness(UserForm, { person, onSave() { saved++ }, onClose() {} })
  nodes(render()).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} }); assert.equal(saved, 0)
  assert.equal(button(render(), 'Lưu thay đổi').props.disabled, true)
  nodes(render()).find((node) => node.type === 'input').props.onChange({ target: { value: 'Nguyễn Minh đã sửa' } })
  nodes(render()).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} }); assert.equal(saved, 1)
  const inputs = nodes(render()).filter((node) => node.type === 'input')
  inputs[0].props.onChange({ target: { value: '' } })
  nodes(render()).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
  assert.equal(saved, 1); assert.ok(text(render()).includes('Vui lòng nhập họ tên.'))
  assert.ok(!nodes(render()).some((node) => node.type === 'select'))
  assert.ok(button(render(), 'Hủy').props['data-modal-close'] !== undefined)
})

test('User edit only enables valid semantic changes and reverts to disabled after restoring the original value', () => {
  const render = harness(UserForm, { person, onSave() {}, onClose() {} })
  const name = () => nodes(render()).find((n) => n.type === 'input' && n.props.name === 'name')
  name().props.onChange({ target: { value: '  ' + person.name + '  ' } })
  assert.equal(button(render(), 'Lưu thay đổi').props.disabled, true)
  name().props.onChange({ target: { value: 'Tên mới' } })
  assert.equal(button(render(), 'Lưu thay đổi').props.disabled, false)
  const email = () => nodes(render()).find((n) => n.type === 'input' && n.props.name === 'email')
  email().props.onChange({ target: { value: 'email-khong-hop-le' } })
  assert.equal(button(render(), 'Lưu thay đổi').props.disabled, true)
  assert.match(text(render()), /Vui lòng nhập email hợp lệ/)
  email().props.onChange({ target: { value: person.email } }); name().props.onChange({ target: { value: person.name } })
  assert.equal(button(render(), 'Lưu thay đổi').props.disabled, true)
})

test('User confirmation labels identify the operation and protected decisions explain disabled state', () => {
  for (const [action, status, label] of [['status', 'ACTIVE', 'Tạm ngưng'], ['status', 'SUSPENDED', 'Kích hoạt lại'], ['delete', 'ACTIVE', 'Xác nhận xóa']]) {
    const tree = UserDecision({ person: { ...person, status }, action, busy: false, disabledReason: 'Hồ sơ được bảo vệ.' })
    const buttons = nodes(tree.props.footer).filter((n) => n.type === 'button')
    assert.equal(text(buttons[0]), 'Hủy'); assert.ok(text(buttons[1]).endsWith(label))
    assert.equal(buttons[1].props.disabled, true); assert.match(text(tree), /Hồ sơ được bảo vệ/)
    if (action === 'delete') assert.match(text(tree), /không xóa tài khoản đăng nhập/)
  }
})

test('Duplicate email feedback is attached to the submitted field and clears when a different valid email is entered', () => {
  const props = { person, onSave() {} }, render = harness(UserForm, props)
  const email = () => nodes(render()).find((n) => n.type === 'input' && n.props.name === 'email')
  email().props.onChange({ target: { value: 'duplicate@example.test' } })
  nodes(render()).find((n) => n.type === 'form').props.onSubmit({ preventDefault() {} })
  props.error = { status: 409, message: 'Email đã được sử dụng.' }
  assert.equal(email().props['aria-invalid'], true)
  assert.equal(button(render(), 'Lưu thay đổi').props.disabled, true)
  assert.match(text(render()), /Vui lòng chọn email khác/)
  email().props.onChange({ target: { value: 'changed@example.test' } })
  assert.equal(email().props['aria-invalid'], false)
  assert.equal(button(render(), 'Lưu thay đổi').props.disabled, false)
})
test('User service blocks live CRUD, self operations and protected administrator before any request', async () => {
  harness(Users); let calls = 0; globalThis.fetch = async () => { calls++; throw Error('Unexpected request') }
  await assert.rejects(service.deleteUser({ ...person, id: actorId }, { id: actorId }), { status: 403 })
  await assert.rejects(service.deleteUser({ ...person, roles: ['ADMIN'] }, { id: actorId }), { status: 403 })
  globalThis.__adminLocal = false
  for (const action of [() => service.saveUser(person, person, { id: actorId }), () => service.deleteUser(person, { id: actorId }), () => service.changeUserStatus(person, { id: actorId })]) await assert.rejects(action, { status: 403 })
  assert.equal(calls, 0)
})
test('User save only sends name/email; state changes require a matching response', async () => {
  harness(Users); const calls = []
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ data: person }) }
  await service.saveUser(person, { ...person, roles: ['ADMIN'] }, { id: actorId })
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: person.name, email: person.email })
  await assert.rejects(service.changeUserStatus(person, { id: actorId }), { status: 502 })
  assert.deepEqual(JSON.parse(calls[1].options.body), { status: 'SUSPENDED' })
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
  for (const label of ['Thêm người dùng', 'Sửa', 'Xóa', 'Tạm ngưng']) assert.equal(button(render(), label).props.disabled, true)
  render = harness(PaymentReview, { payment: { id, subscriptionOrderId: orderId, status: 'SUBMITTED', amount: 199000, currency: 'VND' } }, { loadPaymentContext: ready({ order: { id: orderId, status: 'PAYMENT_REVIEW', totalAmount: 199000, currency: 'VND' } }) }, ['CUSTOMER'])
  assert.ok(!button(render(), 'Phê duyệt thanh toán')); assert.ok(!button(render(), 'Từ chối'))
})
