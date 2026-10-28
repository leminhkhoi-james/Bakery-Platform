import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
import { uiLabel } from '../src/services/uiLabels.js'

let vite, Actions, Choices
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'entity-actions-state-fixture', enforce: 'pre', transform(code, id) {
    if (id.replaceAll('\\', '/').endsWith('/common/EntityActionButtons.jsx')) return code.replace("import React, { useRef, useState } from 'react'", "import React from 'react'\nconst useState=(initial)=>globalThis.__entityState(initial), useRef=(initial)=>globalThis.__entityRef(initial)")
  } }] })
  const module = await vite.ssrLoadModule('/src/components/common/EntityActionButtons.jsx')
  Actions = module.default; Choices = module.ChoiceButtons
})
after(async () => { await vite?.close(); delete globalThis.__entityState; delete globalThis.__entityRef })
const nodes = (node) => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : []
const text = (node) => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : ''
const button = (tree, label) => nodes(tree).find((node) => node.type === 'button' && text(node) === label)
function setup(props) {
  const states = [], refs = []; let cursor = 0, refCursor = 0
  globalThis.__entityState = (initial) => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], (next) => { states[i] = typeof next === 'function' ? next(states[i]) : next }] }
  globalThis.__entityRef = (initial) => refs[refCursor++] ||= { current: initial }
  return () => { cursor = 0; refCursor = 0; return Actions(props) }
}
const close = { key: 'CLOSED', label: 'Đóng tiệm', confirmText: 'Tôi hiểu tiệm không thể mở lại.' }

test('Closing requires explicit confirmation, acknowledgement and never changes the backend enum', async () => {
  const calls = [], props = { status: 'ACTIVE', actions: [close], onConfirm: async (key) => calls.push(key) }
  const render = setup(props)
  button(render(), 'Đóng tiệm').props.onClick(); assert.equal(calls.length, 0)
  let confirm = button(render(), 'Xác nhận đóng tiệm')
  assert.equal(confirm.props.disabled, true); await confirm.props.onClick(); assert.equal(calls.length, 0)
  nodes(render()).find((node) => node.type === 'input').props.onChange({ target: { checked: true } })
  confirm = button(render(), 'Xác nhận đóng tiệm'); assert.equal(confirm.props.disabled, false)
  await confirm.props.onClick(); assert.deepEqual(calls, ['CLOSED']); assert.ok(button(render(), 'Đóng tiệm'))
})
test('Cancel, stale state and revoked permissions cannot execute a previously selected action', async () => {
  let calls = 0
  const props = { status: 'ACTIVE', actions: [{ key: 'SUSPENDED', label: 'Tạm ngưng' }], onConfirm: async () => calls++ }
  const render = setup(props)
  button(render(), 'Tạm ngưng').props.onClick(); button(render(), 'Quay lại').props.onClick(); assert.equal(calls, 0)
  button(render(), 'Tạm ngưng').props.onClick(); props.status = 'CLOSED'
  const confirm = button(render(), 'Xác nhận tạm ngưng'); assert.equal(confirm.props.disabled, true); await confirm.props.onClick(); assert.equal(calls, 0)
  props.status = 'ACTIVE'; props.actions[0].disabled = true
  await button(render(), 'Xác nhận tạm ngưng').props.onClick(); assert.equal(calls, 0)
})
test('Pending requests lock actions, suppress double submits and retain failed confirmations for retry', async () => {
  let finish, calls = 0
  const props = { status: 'PENDING', actions: [{ key: 'APPROVED', label: 'Duyệt thiết kế' }], onConfirm: () => { calls++; return new Promise((resolve) => { finish = resolve }) } }
  const render = setup(props)
  button(render(), 'Duyệt thiết kế').props.onClick()
  const confirm = button(render(), 'Xác nhận duyệt thiết kế'), pending = confirm.props.onClick()
  await confirm.props.onClick(); assert.equal(calls, 1)
  assert.equal(button(render(), 'Đang xử lý…').props.disabled, true)
  finish(false); await pending; assert.ok(button(render(), 'Xác nhận duyệt thiết kế'))
  props.refreshing = true; assert.equal(button(render(), 'Đang xử lý…').props.disabled, true)
})
test('Choice controls show Vietnamese labels while emitting the original enum and respecting fieldset lock', () => {
  let selected
  const tree = Choices({ label: 'Trạng thái', value: 'DRAFT', options: ['DRAFT', 'ACTIVE'], onChange: (value) => { selected = value }, disabled: true })
  assert.equal(tree.props.disabled, true)
  assert.equal(button(tree, 'Bản nháp').props['aria-pressed'], true)
  button(tree, 'Đang hoạt động').props.onClick(); assert.equal(selected, 'ACTIVE')
  for (const status of ['ACTIVE', 'DRAFT', 'CLOSED', 'SUSPENDED', 'PUBLISHED', 'ARCHIVED']) assert.notEqual(uiLabel(status), status)
})
