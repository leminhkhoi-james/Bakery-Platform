import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatPlanPrice, parsePlanPrice, planFormErrors, planPriceDescriptionConflict } from '../src/services/planFormPresentation.js'
import { planPayload } from '../src/services/adminManagementService.js'

const values = () => ({ code: 'STANDARD', name: 'Tiêu chuẩn', monthlyPrice: '199000', billingPeriodMonths: 3, currency: 'VND', status: 'ACTIVE', description: '', featureRows: [{ uiKey: 'a', code: 'products', value: '20' }] })

test('Vietnamese price editing preserves monthly amount and decimals in the existing payload', () => {
  for (const [text, amount] of [['199.000', '199000'], ['199000', '199000'], ['199.000,50', '199000.50'], ['0', '0']]) {
    const input = { ...values(), monthlyPrice: parsePlanPrice(text) }
    assert.equal(input.monthlyPrice, amount)
    assert.equal(planPayload(input).monthlyPrice, Number(amount))
    assert.equal(planPayload(input).billingPeriodMonths, 3)
  }
  assert.equal(formatPlanPrice('199000.5'), '199.000,5')
  for (const text of ['1.2', 'abc', '-1', '199,000,00']) assert.ok(Number.isNaN(parsePlanPrice(text)))
  assert.equal(parsePlanPrice(''), '')
})

test('Plan field errors mirror required fields and exact unique feature map keys without inventing value restrictions', () => {
  assert.deepEqual(planFormErrors(values()), {})
  const input = { ...values(), code: ' ', name: '', monthlyPrice: NaN, billingPeriodMonths: 0, featureRows: [{ uiKey: 'a', code: 'products', value: 'nội dung tùy chỉnh' }, { uiKey: 'b', code: ' products ', value: '' }] }
  const errors = planFormErrors(input)
  for (const key of ['code', 'name', 'monthlyPrice', 'billingPeriodMonths', 'b:code', 'b:value']) assert.ok(errors[key], key)
  assert.equal(errors['a:value'], undefined)
  assert.ok(planFormErrors({ ...values(), featureRows: [{ uiKey: 'x', code: '', value: 'x' }] })['x:code'])
})

test('Inconsistent free-price description is reported without modifying its source', () => {
  const input = { ...values(), description: 'Gói minh họa; không thu phí.' }, before = structuredClone(input)
  assert.equal(planPriceDescriptionConflict(input), true)
  assert.deepEqual(input, before)
  assert.equal(planPriceDescriptionConflict({ ...input, monthlyPrice: 0 }), false)
})
