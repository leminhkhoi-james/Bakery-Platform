import assert from 'node:assert/strict'
import { test } from 'node:test'
import { planFeatureRows, planMonthlyPrice, planName, planActions, planStatusLabel } from '../src/services/planPresentation.js'

test('Plan presentation translates real and legacy feature codes without mutating their values', () => {
  const features = { products: '20', support: 'Hỗ trợ đối tác', MAX_MONTHLY_OFFERS: '-1', FEATURED_LISTING: 'false', CUSTOM_KEY: 'Quyền lợi riêng' }
  const before = structuredClone(features), rows = planFeatureRows(features)
  assert.deepEqual(rows.map((row) => row.label), ['Số sản phẩm tối đa', 'Hỗ trợ', 'Báo giá mỗi tháng', 'Ưu tiên hiển thị', 'Quyền lợi bổ sung'])
  assert.equal(rows[2].value, 'Không giới hạn'); assert.equal(rows[3].value, 'Không')
  assert.deepEqual(features, before)
})
test('Monthly price is independent of the billing cycle, preserves zero and does not invent missing prices', () => {
  assert.equal(planMonthlyPrice({ monthlyPrice: 199000, currency: 'VND', billingPeriodMonths: 3 }), '199.000 đ')
  assert.equal(planMonthlyPrice({ monthlyPrice: '399000', currency: 'VND' }), '399.000 đ')
  assert.equal(planMonthlyPrice({ monthlyPrice: 0, currency: 'VND' }), '0 đ')
  for (const value of [null, undefined, '', false, NaN, -1]) assert.equal(planMonthlyPrice({ monthlyPrice: value, currency: 'VND' }), 'Chưa có thông tin giá')
  assert.equal(planName({ code: 'DEMO_0', name: 'Nghệ nhân · DEMO' }), 'Nghệ nhân')
})
test('Available plan actions follow the current enum while archived plans can only be restored from the menu', () => {
  assert.deepEqual(planActions('ACTIVE'), ['pause', 'archive'])
  assert.deepEqual(planActions('INACTIVE'), ['activate', 'archive'])
  assert.deepEqual(planActions('ARCHIVED'), ['restore'])
  assert.deepEqual(planActions('UNKNOWN'), [])
  assert.equal(planStatusLabel('INACTIVE'), 'Ngừng cung cấp')
})
