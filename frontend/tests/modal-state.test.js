import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createModalDraft, isBackdropPoint, isTopModal, lockPageScroll, registerModal, serializeModalForm } from '../src/components/common/modalState.js'

function fixture(overflow = 'auto') {
  const doc = { body: { style: { overflow } }, activeElement: null }
  const node = (owner = null) => ({ owner, isConnected: true, focus() { doc.activeElement = this }, contains(other) { return other === this || other?.owner === this }, querySelector() { return this.first || null } })
  const trigger = node(), parent = node(), child = node()
  const parentButton = node(parent), childButton = node(child)
  parent.first = parentButton; child.first = childButton; trigger.focus()
  return { doc, trigger, parent, child, parentButton, childButton }
}
test('Nested modal stack closes only its top layer, restores parent focus and releases scroll after the last dialog', () => {
  const f = fixture()
  const parent = registerModal(f.parent, f.doc); f.parentButton.focus()
  const child = registerModal(f.child, f.doc); f.childButton.focus()
  assert.equal(isTopModal(f.parent), false); assert.equal(isTopModal(f.child), true)
  assert.equal(f.doc.body.style.overflow, 'hidden')
  child(); assert.equal(f.doc.activeElement, f.parentButton)
  assert.equal(f.doc.body.style.overflow, 'hidden'); assert.equal(isTopModal(f.parent), true)
  parent(); assert.equal(f.doc.activeElement, f.trigger); assert.equal(f.doc.body.style.overflow, 'auto')
  parent(); assert.equal(f.doc.body.style.overflow, 'auto', 'cleanup is idempotent')
})
test('Out-of-order unmount preserves a child lock and restores the original focus target', () => {
  const f = fixture('hidden')
  const parent = registerModal(f.parent, f.doc); f.parentButton.focus()
  const child = registerModal(f.child, f.doc); f.childButton.focus()
  parent(); f.parentButton.isConnected = false
  assert.equal(f.doc.body.style.overflow, 'hidden'); assert.equal(isTopModal(f.child), true)
  child(); assert.equal(f.doc.activeElement, f.trigger)
  assert.equal(f.doc.body.style.overflow, 'hidden', 'an existing sidebar lock must be preserved')
})
test('Backdrop hit testing excludes content, dialog padding and events from another popup', () => {
  const dialog = { getBoundingClientRect: () => ({ left: 100, right: 500, top: 100, bottom: 400 }) }
  assert.equal(isBackdropPoint({ target: dialog, clientX: 50, clientY: 200 }, dialog), true)
  assert.equal(isBackdropPoint({ target: dialog, clientX: 110, clientY: 110 }, dialog), false)
  assert.equal(isBackdropPoint({ target: {}, clientX: 50, clientY: 200 }, dialog), false)
})

test('Closing a sidebar while a dialog is mounted does not leave a stale scroll lock', () => {
  const f = fixture()
  const sidebar = lockPageScroll(f.doc), modal = registerModal(f.parent, f.doc)
  sidebar(); assert.equal(f.doc.body.style.overflow, 'hidden')
  modal(); assert.equal(f.doc.body.style.overflow, 'auto')
})
test('Draft tracking recognizes text and checkbox changes and becomes clean when values are restored', () => {
  const dialog = { querySelectorAll: () => [text, checkbox] }
  const field = (props) => ({ ...props, isConnected: true, closest: () => dialog, matches: () => true })
  const text = field({ value: 'Ban đầu', type: 'text' }), checkbox = field({ checked: false, type: 'checkbox' })
  const draft = createModalDraft(dialog)
  text.value = 'Đã sửa'; draft.touch(text); assert.equal(draft.changed(), true)
  text.value = 'Ban đầu'; assert.equal(draft.changed(), false)
  checkbox.checked = true; draft.touch(checkbox); assert.equal(draft.changed(), true)
  checkbox.checked = false; assert.equal(draft.changed(), false)
})
test('System refreshes and controls belonging to nested dialogs do not dirty the parent', () => {
  const dialog = { querySelectorAll: () => [field] }
  const field = { type: 'text', value: 'Ban đầu', isConnected: true, closest: () => dialog, matches: () => true }
  const draft = createModalDraft(dialog)
  field.value = 'Thông tin vừa tải'; assert.equal(draft.changed(), false)
  const nested = { ...field, closest: () => ({}) }
  draft.touch(nested); assert.equal(draft.changed(), false)
})

test('Restoring an amount through a number input is clean while removing a form row remains dirty', () => {
  assert.equal(serializeModalForm({ price: 1000, description: null }), serializeModalForm({ price: '1000', description: '' }))
  assert.notEqual(serializeModalForm({ rows: [{ name: 'Nhóm lựa chọn' }] }), serializeModalForm({ rows: [] }))
  assert.notEqual(serializeModalForm({ price: 0 }), serializeModalForm({ price: '' }))
})
