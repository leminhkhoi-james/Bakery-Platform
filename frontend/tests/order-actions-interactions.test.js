import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
import { order as fixture } from './fixtures/vendorOrder.js'

let vite, Detail, Actions, service, originalUpdate
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'order-action-state-fixture', enforce: 'pre', load(id) {
    const path = id.replaceAll('\\', '/')
    if (path.endsWith('/src/context/useAuth.js')) return 'export const useAuth = () => globalThis.__orderActionAuth'
    if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export const useCatalogResource = () => globalThis.__orderActionResource'
  }, transform(code, id) {
    if (['OrderViews.jsx', 'OrderStatusActions.jsx'].some((file) => id.replaceAll('\\', '/').endsWith('/' + file))) return code.replace(/import React, \{ (?:useRef, useState|useState) \} from 'react'/, "import React from 'react'\nconst useState=(initial)=>globalThis.__orderActionState(initial), useRef=(initial)=>globalThis.__orderActionRef(initial)")
  } }] })
  Detail = (await vite.ssrLoadModule('/src/components/orders/OrderViews.jsx')).OrderDetail
  Actions = (await vite.ssrLoadModule('/src/components/orders/OrderStatusActions.jsx')).default
  service = (await vite.ssrLoadModule('/src/services/orderService.js')).orderService
  originalUpdate = service.updateOrderStatus
})
after(async () => { service.updateOrderStatus = originalUpdate; await vite?.close(); for (const key of ['__orderActionState', '__orderActionRef', '__orderActionAuth', '__orderActionResource']) delete globalThis[key] })
const nodes = (node) => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : []
const text = (node) => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : ''
const button = (tree, label) => nodes(tree).find((node) => node.type === 'button' && text(node) === label)
function harness(Component, props) {
  const values = [], refs = []; let cursor = 0, refCursor = 0
  globalThis.__orderActionState = (initial) => { const i = cursor++; if (!(i in values)) values[i] = typeof initial === 'function' ? initial() : initial; return [values[i], (next) => { values[i] = typeof next === 'function' ? next(values[i]) : next }] }
  globalThis.__orderActionRef = (initial) => refs[refCursor++] ||= { current: initial }
  return () => { cursor = 0; refCursor = 0; return Component(props) }
}
test('Confirmation, required rejection note and stale status prevent accidental writes', async () => {
  const calls = [], props = { order: { ...fixture, status: 'PENDING' }, actions: ['CONFIRMED', 'CANCELLED'], onConfirm: async (...args) => { calls.push(args); return true } }
  const render = harness(Actions, props)
  button(render(), 'Từ chối đơn hàng').props.onClick()
  assert.equal(calls.length, 0)
  let tree = render(), form = nodes(tree).find((node) => node.type === 'form')
  assert.equal(nodes(tree).find((node) => node.type === 'textarea').props.required, true)
  await form.props.onSubmit({ preventDefault() {} }); assert.equal(calls.length, 0)
  nodes(render()).find((node) => node.type === 'textarea').props.onChange({ target: { value: 'Không kịp lịch khách cần' } })
  await nodes(render()).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
  assert.deepEqual(calls, [['CANCELLED', 'Không kịp lịch khách cần', 'PENDING']])
  button(render(), 'Xác nhận đơn hàng').props.onClick()
  props.order = { ...props.order, status: 'BAKING' }; props.actions = ['READY']
  await nodes(render()).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
  assert.equal(calls.length, 1)
  assert.equal(button(render(), 'Xác nhận cập nhật').props.disabled, true)
})
test('Confirmed API result immediately updates the popup/history, locks double submits and refreshes the list', async () => {
  let resolve, changed = 0, reloads = 0
  const calls = [], initial = { ...fixture, status: 'PENDING' }
  globalThis.__orderActionAuth = { user: { id: 'owner', roles: ['BAKERY_OWNER'] } }
  const resource = { status: 'ready', data: initial, reload: () => { reloads++ } }
  globalThis.__orderActionResource = resource
  service.updateOrderStatus = (...args) => { calls.push(args); return new Promise((done) => { resolve = done }) }
  const render = harness(Detail, { orderId: fixture.id, scope: 'bakery', bakeryId: fixture.bakeryId, onChanged: () => changed++ })
  const snapshot = () => nodes(render()).find((node) => node.type?.name === 'OrderSnapshot')
  const control = () => nodes(snapshot().props.actionsSlot).find((node) => node.type === Actions)
  const confirm = control().props.onConfirm
  const pending = confirm('CONFIRMED', 'Đã kiểm tra lịch giao', 'PENDING')
  assert.equal(control().props.busy, true)
  await confirm('CONFIRMED', '', 'PENDING'); assert.equal(calls.length, 1)
  const updated = { ...initial, status: 'CONFIRMED', statusHistory: [...initial.statusHistory, { fromStatus: 'PENDING', toStatus: 'CONFIRMED', changedAt: '2026-10-28T03:00:00Z', note: 'Đã kiểm tra lịch giao' }] }
  resolve(updated); assert.equal(await pending, true)
  assert.deepEqual(calls[0], [fixture.id, 'CONFIRMED', 'Đã kiểm tra lịch giao'])
  assert.equal(snapshot().props.order.status, 'CONFIRMED')
  assert.equal(snapshot().props.order.statusHistory.at(-1).note, 'Đã kiểm tra lịch giao')
  assert.deepEqual(control().props.actions, ['BAKING', 'CANCELLED'])
  assert.equal(changed, 1); assert.equal(reloads, 1)
  resource.data = { ...updated, status: 'BAKING' }
  assert.equal(snapshot().props.order.status, 'BAKING', 'fresh shared state replaces the local confirmation')
  service.updateOrderStatus = originalUpdate
})
test('Failures keep the last known order and the confirmation available for retry', async () => {
  globalThis.__orderActionAuth = { user: { id: 'owner', roles: ['BAKERY_OWNER'] } }
  globalThis.__orderActionResource = { status: 'ready', data: fixture, reload() {} }
  service.updateOrderStatus = async () => { throw Object.assign(new Error('Unavailable'), { status: 500 }) }
  const render = harness(Detail, { orderId: fixture.id, scope: 'bakery', bakeryId: fixture.bakeryId })
  const snapshot = () => nodes(render()).find((node) => node.type?.name === 'OrderSnapshot')
  const actions = nodes(snapshot().props.actionsSlot).find((node) => node.type === Actions)
  assert.equal(await actions.props.onConfirm('CONFIRMED', '', 'PENDING'), false)
  assert.equal(snapshot().props.order.status, 'PENDING')
  assert.match(text(snapshot().props.actionsSlot), /Chưa thể cập nhật đơn hàng/)
  service.updateOrderStatus = originalUpdate
})

test('A mismatched response never advances the popup or reports successful confirmation', async () => {
  globalThis.__orderActionAuth = { user: { id: 'owner', roles: ['BAKERY_OWNER'] } }
  globalThis.__orderActionResource = { status: 'ready', data: fixture, reload() {} }
  service.updateOrderStatus = async () => ({ ...fixture, status: 'PENDING' })
  const render = harness(Detail, { orderId: fixture.id, scope: 'bakery', bakeryId: fixture.bakeryId })
  const snapshot = () => nodes(render()).find((node) => node.type?.name === 'OrderSnapshot')
  const actions = nodes(snapshot().props.actionsSlot).find((node) => node.type === Actions)
  assert.equal(await actions.props.onConfirm('CONFIRMED', '', 'PENDING'), false)
  assert.equal(snapshot().props.order.status, 'PENDING')
  assert.doesNotMatch(text(snapshot().props.actionsSlot), /Đã cập nhật đơn hàng/)
  service.updateOrderStatus = originalUpdate
})
