import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { userFeedback, publicCopy, cleanPresentationLabel, uiLabel } from '../src/services/uiLabels.js'

let vite, ApiState, ResourceState, ProductCard, RefreshButton, CatalogState
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } })
  ;({ ApiState } = await vite.ssrLoadModule('/src/components/management/ApiState.jsx'))
  ;({ ResourceState } = await vite.ssrLoadModule('/src/components/subscription/SubscriptionView.jsx'))
  ProductCard = (await vite.ssrLoadModule('/src/components/catalog/ProductCard.jsx')).default
  RefreshButton = (await vite.ssrLoadModule('/src/components/common/RefreshButton.jsx')).default
  CatalogState = (await vite.ssrLoadModule('/src/components/catalog/CatalogState.jsx')).default
})
after(async () => { await vite?.close() })
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
test('Existing mock records render through shared states and product cards without technical source badges', () => {
  const record = { id: 'de000000-0000-4000-8000-000000000100', title: 'Bánh dâu', price: 200000 }
  for (const Component of [ApiState, ResourceState]) {
    const html = render(Component, { resource: { status: 'ready', data: { result: [record] } }, children: 'Nội dung sản phẩm' })
    assert.match(html, /Nội dung sản phẩm/)
    assert.doesNotMatch(html, /Dữ liệu mẫu|DEMO|mockData|backend|API/)
  }
  assert.doesNotMatch(render(ProductCard, { product: record }), /Dữ liệu mẫu|DEMO|mockData|backend|API/)
  assert.equal(record.id, 'de000000-0000-4000-8000-000000000100')
})
test('Errors remain errors, use natural copy and retain retry instead of revealing diagnostics', () => {
  for (const message of ['API failed', 'mockData missing', 'backend unavailable', 'DEMO not supported', 'debug TypeError stack trace']) {
    assert.doesNotMatch(userFeedback({ status: 400, message }), /API|mockData|backend|DEMO|debug|TypeError/)
    const html = render(CatalogState, { status: 'error', error: { status: 400, message }, onRetry() {} })
    assert.match(html, /role="alert"/)
    assert.match(html, /Thử lại/)
    assert.doesNotMatch(html, /API|mockData|backend|DEMO|debug|TypeError/)
  }
  assert.equal(userFeedback({ status: 422, message: 'Ngày nhận bánh phải ở tương lai.' }), 'Ngày nhận bánh phải ở tương lai.')
})
test('Refresh controls preserve their callback, accessible icon, label and disabled state', () => {
  let calls = 0
  const props = { onClick: () => calls++, children: 'Tải lại danh sách' }
  const tree = RefreshButton(props)
  tree.props.onClick(); assert.equal(calls, 1)
  const html = render(RefreshButton, { ...props, disabled: true })
  assert.match(html, /type="button"/)
  assert.match(html, /disabled=""/)
  assert.match(html, /aria-hidden="true"[^>]*>refresh/)
  assert.match(html, /Tải lại danh sách/)
  assert.match(html, /sc-refresh-button/)
})
test('Source markers are removed only from presentation, while meaningful names and business data remain intact', () => {
  const record = { id: 'original', name: 'Tiệm Hoa · DEMO', reference: 'DEMO-SUB-101' }
  assert.equal(cleanPresentationLabel(record.name), 'Tiệm Hoa')
  assert.equal(cleanPresentationLabel(record.reference), 'SUB-101')
  assert.equal(cleanPresentationLabel('Demolition Cakes'), 'Demolition Cakes')
  assert.equal(publicCopy('Ảnh mockData có sẵn', 'Phác thảo tham khảo'), 'Phác thảo tham khảo')
  assert.equal(publicCopy('Kem tươi và dâu Đà Lạt'), 'Kem tươi và dâu Đà Lạt')
  assert.deepEqual(record, { id: 'original', name: 'Tiệm Hoa · DEMO', reference: 'DEMO-SUB-101' })
})

test('Legacy marker variants never leak into labels, status badges or explanatory copy', () => {
  for (const value of ['Tiệm Hoa [DEMO]', 'Tiệm Hoa (Dữ liệu mẫu)', 'Tiệm Hoa • mockData', 'DEMO: Tiệm Hoa']) assert.equal(cleanPresentationLabel(value), 'Tiệm Hoa')
  for (const value of ['DEMO', 'API', 'mock data', 'Dữ liệu mẫu']) {
    assert.equal(cleanPresentationLabel(value, 'Chưa có thông tin'), 'Chưa có thông tin')
    assert.equal(uiLabel(value, 'Chưa có trạng thái'), 'Chưa có trạng thái')
    assert.equal(publicCopy(value, 'Vui lòng thử lại.'), 'Vui lòng thử lại.')
  }
  assert.equal(publicCopy('DEMO_1', 'Gói dịch vụ'), 'Gói dịch vụ')
  assert.equal(uiLabel('ACTIVE'), 'Đang hoạt động')
  assert.equal(cleanPresentationLabel('La Crème Pâtisserie'), 'La Crème Pâtisserie')
})

test('Product cards hide legacy source annotations without changing the navigation record', () => {
  const product = { id: 'original', title: 'Bánh dâu [DEMO]', vendor: 'Tiệm Hoa · DEMO', description: 'Dữ liệu mẫu lấy từ backend API', price: 200000 }
  const html = render(ProductCard, { product })
  assert.doesNotMatch(html, /DEMO|Dữ liệu mẫu|backend|API/)
  assert.match(html, /Bánh dâu/); assert.match(html, /Tiệm Hoa/)
  let selected
  ProductCard({ product, onNavigate: (route, record) => { selected = { route, record } } }).props.children[0].props.onClick()
  assert.equal(selected.route, 'product-detail'); assert.equal(selected.record, product)
  assert.equal(product.title, 'Bánh dâu [DEMO]')
})
