import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { mapProduct, mapBakery } from '../src/services/catalogModels.js'

let vite, ProductCard, ProductDetails, BakeryDetails, CatalogState, CatalogImage, CatalogPagination
before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, logLevel: 'error' })
  ;({ default: ProductCard } = await vite.ssrLoadModule('/src/components/catalog/ProductCard.jsx'))
  ;({ ProductDetails } = await vite.ssrLoadModule('/src/pages/customer/catalog/ProductDetailPage.jsx'))
  ;({ BakeryDetails } = await vite.ssrLoadModule('/src/pages/customer/stores/BakeryDetailPage.jsx'))
  ;({ default: CatalogState } = await vite.ssrLoadModule('/src/components/catalog/CatalogState.jsx'))
  ;({ default: CatalogImage } = await vite.ssrLoadModule('/src/components/catalog/CatalogImage.jsx'))
  ;({ default: CatalogPagination } = await vite.ssrLoadModule('/src/components/catalog/CatalogPagination.jsx'))
})
after(async () => { await vite?.close() })
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))

test('Populated product card renders mapped backend fields with detail navigation', () => {
  const product = mapProduct({ product: { id: randomUUID(), name: 'Bánh thật từ DTO', basePrice: '125000.00' }, bakeryId: randomUUID(), bakeryName: 'Tiệm từ DTO' })
  const html = render(ProductCard, { product })
  assert.match(html, /Bánh thật từ DTO/)
  assert.match(html, /Tiệm từ DTO/)
  assert.match(html, /125\.000₫/)
  assert.match(html, /Xem chi tiết/)
  assert.match(html, /chưa có ảnh/)
  assert.doesNotMatch(html, />5\.0<|Bán chạy|480\.000/)
})

test('Product card detail action passes the backend UUID to navigation', () => {
  const product = mapProduct({ product: { id: randomUUID(), name: 'Bánh từ DTO' }, bakeryId: randomUUID() })
  let navigated
  const card = ProductCard({ product, onNavigate: (...args) => { navigated = args } })
  const imageButton = card.props.children.find((child) => child?.type === 'button')
  imageButton.props.onClick()
  assert.equal(navigated[0], 'product-detail')
  assert.equal(navigated[1].id, product.id)
})

test('Detail renders only backend options/add-ons and disables incomplete required configuration', () => {
  const product = mapProduct({ product: { id: randomUUID(), name: 'Bánh từ DTO', basePrice: 100000, minimumNoticeHours: 0 }, bakeryId: randomUUID(), options: { groups: [{ id: randomUUID(), name: 'Vị bánh từ DTO', selectionType: 'SINGLE', required: true, minimumSelections: 1, maximumSelections: 1, values: [{ id: randomUUID(), name: 'Vani từ DTO', active: true, priceAdjustment: 0 }] }] }, addOns: [{ id: randomUUID(), name: 'Nến từ DTO', price: 5000 }] })
  const html = render(ProductDetails, { product })
  assert.match(html, /Vị bánh từ DTO/)
  assert.match(html, /Vani từ DTO/)
  assert.match(html, /Nến từ DTO/)
  assert.match(html, /0 giờ/)
  assert.match(html, /Vui lòng chọn đủ/)
  assert.match(html, /disabled=""/)
  assert.doesNotMatch(html, /14cm|480\.000|Bán chạy nhất|Valrhona/)
})

test('Missing product price and bakery identifier cannot enable cart actions', () => {
  const html = render(ProductDetails, { product: mapProduct({ product: { id: randomUUID(), name: 'Thiếu dữ liệu' } }) })
  assert.match(html, /Chưa có giá/)
  assert.match(html, /disabled=""/)
})

test('Bakery details render available fields and explicit missing-data messages', () => {
  const html = render(BakeryDetails, { bakery: mapBakery({ id: randomUUID(), name: 'Tiệm từ DTO' }) })
  assert.match(html, /Tiệm từ DTO/)
  assert.match(html, /chưa cung cấp địa chỉ/)
  assert.doesNotMatch(html, /5\.0|Bếp trưởng|Đang mở lò/)
})

test('Empty and loading states are explicit and do not insert product cards', () => {
  assert.match(render(CatalogState, { status: 'loading' }), /Đang tải dữ liệu/)
  const html = render(CatalogState, { status: 'ready', empty: true, emptyText: 'Chưa có mẫu bánh công khai.' })
  assert.match(html, /Chưa có mẫu bánh công khai/)
  assert.doesNotMatch(html, /article|mock|Pikachu/)
})

for (const [status, text] of [[401, 'đăng nhập'], [403, 'không có quyền'], [404, 'Không tìm thấy'], [500, 'Backend unavailable'], [0, 'Backend unavailable']]) {
  test('Catalog UI exposes HTTP/network error ' + status, () => {
    const html = render(CatalogState, { status: 'error', error: { status, message: 'Backend unavailable' }, onRetry() {}, onNavigate() {} })
    assert.match(html, /role="alert"/)
    assert.ok(html.includes(text))
    assert.match(html, /Thử lại/)
  })
}

test('Missing images use a neutral placeholder instead of an unrelated photo', () => {
  const html = render(CatalogImage, { src: null, alt: 'Sản phẩm' })
  assert.match(html, /image_not_supported/)
  assert.doesNotMatch(html, /<img|unsplash|googleusercontent/)
})

test('Pagination displays server totals and prevents moving beyond the last page', () => {
  const html = render(CatalogPagination, { meta: { page: 2, pageSize: 12, pages: 2, total: 15 } })
  assert.match(html, /Trang 2 \/ 2/)
  assert.match(html, /15 kết quả/)
  assert.match(html, /disabled=""/)
})
