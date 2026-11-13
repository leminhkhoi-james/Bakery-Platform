import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let vite, Form, ActionDialog
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'plan-form-state', enforce: 'pre', transform(code, id) {
    if (id.replaceAll('\\', '/').endsWith('/AdminPlanForm.jsx')) return code.replace("import React, { useId, useState } from 'react'", "import React from 'react'\nconst useId=()=> 'plan-form-test', useState=(initial)=>globalThis.__planFormState(initial)")
  } }] })
  Form = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminPlanForm.jsx')).AdminPlanForm
  ActionDialog = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminPlanActionDialog.jsx')).default
})
after(async () => { await vite?.close(); delete globalThis.__planFormState })
const nodes = (node) => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.props?.children), ...nodes(node.props?.footer)] : []
function harness(props) {
  const states = []; let cursor = 0
  globalThis.__planFormState = (initial) => { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], (next) => { states[i] = typeof next === 'function' ? next(states[i]) : next }] }
  return () => { cursor = 0; return Form(props) }
}
const plan = () => ({ id: 'ab000000-0000-4000-8000-000000000001', code: 'STANDARD', name: 'Tiêu chuẩn · DEMO', description: 'Nội dung · DEMO', monthlyPrice: 199000, currency: 'VND', billingPeriodMonths: 3, status: 'ACTIVE', features: { products: '20' } })

test('Plan form footer submits its own form and preserves unedited source text and raw price', () => {
  const original = plan(), calls = [], render = harness({ plan: original, onSave: (value) => calls.push(value) })
  let tree = render()
  const footer = nodes(tree.props.footer), save = footer.find((n) => n.type === 'button' && n.props.type === 'submit')
  const form = () => nodes(render()).find((n) => n.type === 'form')
  assert.equal(save.props.form, form().props.id)
  assert.ok(!save.props.disabled)
  assert.equal(footer.some((n) => n.type === 'input' && n.props.type === 'checkbox'), false)
  form().props.onSubmit({ preventDefault() {} })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].description, original.description); assert.equal(calls[0].name, original.name)
  assert.equal(calls[0].monthlyPrice, 199000); assert.equal(calls[0].billingPeriodMonths, 3)
  assert.ok(nodes(tree).find((n) => n.type === 'input' && n.props.value === 'VND').props.readOnly)
})

test('Invalid fields focus the first error, duplicate features cannot save, and busy state guards submission', () => {
  const calls = [], props = { plan: plan(), onSave: (value) => calls.push(value) }, render = harness(props)
  const field = (key) => nodes(render()).find((n) => n.type === 'input' && n.props.name === key)
  field('name').props.onChange({ target: { value: ' ' } })
  let focused
  const submit = () => nodes(render()).find((n) => n.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: { elements: { namedItem: (key) => ({ focus: () => { focused = key } }) } } })
  submit(); assert.equal(focused, 'name'); assert.equal(calls.length, 0)
  field('name').props.onChange({ target: { value: 'Tên đã sửa' } })
  const editor = () => nodes(render()).find((n) => n.type?.name === 'FeatureEditor')
  const initial = editor().props.rows
  editor().props.onChange([...initial, { uiKey: 'new', code: 'products', value: '30' }])
  submit(); assert.equal(calls.length, 0)
  editor().props.onChange(initial)
  props.busy = true; submit(); assert.equal(calls.length, 0)
  props.busy = false; submit(); assert.equal(calls.length, 1); assert.equal(calls[0].name, 'Tên đã sửa')
})

test('New plan follows backend ACTIVE default and marks required fields without a redundant confirmation checkbox', () => {
  const calls = [], render = harness({ onSave: (value) => calls.push(value) })
  const status = nodes(render()).find((n) => n.type?.name === 'ChoiceButtons')
  assert.equal(status.props.value, 'ACTIVE')
  for (const key of ['code', 'name', 'monthlyPrice', 'billingPeriodMonths']) {
    assert.equal(nodes(render()).find((n) => n.type === 'input' && n.props.name === key).props.required, true)
  }
  for (const [key, value] of [['code', 'NEW_PLAN'], ['name', 'Gói mới'], ['monthlyPrice', '239.000']]) {
    nodes(render()).find((n) => n.type === 'input' && n.props.name === key).props.onChange({ target: { value } })
  }
  nodes(render()).find((n) => n.type === 'form').props.onSubmit({ preventDefault() {} })
  assert.equal(calls.length, 1); assert.equal(calls[0].status, 'ACTIVE'); assert.equal(Number(calls[0].monthlyPrice), 239000)
})

test('Plan confirmation footer orders Cancel before the action and locks stale or busy writes', () => {
  for (const action of ['pause', 'archive']) {
    let writes = 0
    const props = { plan: plan(), action, busy: false, onConfirm: () => writes++ }
    let tree = ActionDialog(props), buttons = nodes(tree.props.footer).filter((n) => n.type === 'button')
    assert.equal(buttons[0].props.children, 'Hủy')
    assert.equal(buttons[0].props['data-modal-close'], true)
    assert.equal(writes, 0)
    buttons[1].props.onClick(); assert.equal(writes, 1)
    for (const flag of ['busy', 'stale', 'unavailable']) {
      tree = ActionDialog({ ...props, [flag]: true })
      buttons = nodes(tree.props.footer).filter((n) => n.type === 'button')
      assert.ok(buttons[1].props.disabled, flag)
    }
  }
})
