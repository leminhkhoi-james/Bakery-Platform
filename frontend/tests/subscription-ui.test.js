import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { mapSubscriptionPlan } from '../src/services/subscriptionModels.js'

let vite, view, VendorPage, AuthContext, PublicPage
before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, logLevel: 'error' })
  view = await vite.ssrLoadModule('/src/components/subscription/SubscriptionView.jsx')
  ;({ default: VendorPage } = await vite.ssrLoadModule('/src/pages/vendor/subscription/VendorSubscriptionPage.jsx'))
  ;({ AuthContext } = await vite.ssrLoadModule('/src/context/useAuth.js'))
  ;({ default: PublicPage } = await vite.ssrLoadModule('/src/pages/customer/subscription/SubscriptionPlansPage.jsx'))
})
after(async () => { await vite?.close() })
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
const plan = () => mapSubscriptionPlan({ id: randomUUID(), code: 'DYNAMIC', name: 'Tên gói từ DTO', description: 'Mô tả từ DTO', monthlyPrice: 321987, currency: 'VND', billingPeriodMonths: 3, status: 'ACTIVE', features: { UNKNOWN_FEATURE: 'custom-value', FEATURED_LISTING: 'false', MAX_PRODUCTS: '-1' } })

test('Plan UI uses DTO name/description/price/period/status/arbitrary feature values', () => {
  const record = plan(), before = JSON.stringify(record)
  const html = render(view.PlanCards, { plans: [record] })
  for (const text of ['Tên gói từ DTO', 'Mô tả từ DTO', '321.987 đ', '3 tháng', 'Đang mở bán', 'Quyền lợi bổ sung', 'custom-value', 'Không giới hạn', 'Không']) assert.ok(html.includes(text), text)
  assert.doesNotMatch(html, /199\.000|499\.000|999\.000|Đang hiệu lực|UNKNOWN_FEATURE/)
  assert.equal(JSON.stringify(record), before)
})
test('Empty and missing DTO render explicit messages with disabled purchase', () => {
  assert.match(render(view.PlanCards, { plans: [] }), /Chưa có gói dịch vụ/)
  const html = render(view.PlanCards, { plans: [mapSubscriptionPlan({ id: randomUUID() })], canSelect: true, onSelect: () => {} })
  assert.match(html, /Chưa có thông tin giá/); assert.match(html, /Xem quyền lợi và mức phí/); assert.match(html, /disabled=""/)
  assert.doesNotMatch(html, /199\.000|ACTIVE/)
})
test('Read-only viewer and mutation busy states disable plan buttons', () => {
  for (const props of [{ canSelect: false }, { canSelect: true, busy: true }]) assert.match(render(view.PlanCards, { plans: [plan()], onSelect: () => {}, ...props }), /disabled=""/)
  assert.doesNotMatch(render(view.PlanCards, { plans: [plan()], canSelect: true, onSelect: () => {} }), /disabled=""/)
})
test('Loading and HTTP/network error states suppress stale/mock plan content', () => {
  assert.match(render(view.ResourceState, { resource: { status: 'loading' }, children: 'STALE_PLAN' }), /Đang tải/)
  for (const status of [401, 403, 404, 500, 0]) {
    const html = render(view.ResourceState, { resource: { status: 'error', error: { status, message: 'API failure' }, reload: () => {} }, children: 'STALE_PLAN' })
    assert.match(html, /role="alert"/); assert.match(html, status >= 500 || status === 0 ? /Kết nối đang gián đoạn/ : ({ 401: /đăng nhập lại/, 403: /không có quyền/, 404: /Không tìm thấy/ }[status])); assert.match(html, /Thử lại/); assert.doesNotMatch(html, /STALE_PLAN/)
  }
})
test('Vendor page has real identity/manual bakery selector and no invented active subscription', () => {
  const html = renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user: { displayName: 'Người dùng thật' }, roles: ['BAKERY_OWNER'] } }, React.createElement(VendorPage, { onNavigate: () => {} })))
  assert.match(html, /Người dùng thật/); assert.match(html, /Nhập mã cửa hàng/); assert.match(html, /Chọn cửa hàng/)
  assert.doesNotMatch(html, /199\.000|499\.000|999\.000|Đang hiệu lực|La Crème/)
})
test('Vendor with UUID and owner role renders backend loading instead of demo periods/orders', () => {
  const html = renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user: { email: 'test@example.invalid' }, roles: ['BAKERY_OWNER'] } }, React.createElement(VendorPage, { routeSearch: '?bakeryId=' + randomUUID(), onNavigate: () => {} })))
  assert.match(html, /<h1[^>]*>Gói dịch vụ<\/h1>/); assert.match(html, /Các gói đang mở bán/); assert.match(html, /Đang tải/)
  assert.doesNotMatch(html.replace(/<option[^>]*>.*?<\/option>/g, ''), /Đang hiệu lực|Đã hoàn tất/)
})
test('Public plan page is accessible without auth context and starts in loading state', () => {
  const html = render(PublicPage, { onNavigate: () => {} })
  assert.match(html, /Gói dịch vụ cho tiệm bánh/); assert.match(html, /Đang tải/)
})
