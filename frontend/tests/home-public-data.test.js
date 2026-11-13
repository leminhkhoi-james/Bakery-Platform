// Component fixtures only. Production components still use their real API loaders.
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { mapProduct, mapBakery } from '../src/services/catalogModels.js'

let vite, sections
before(async () => {
  vite = await createServer({
    logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [{
      name: 'home-resource-fixture-only', enforce: 'pre',
      load(id) {
        if (id.replaceAll('\\', '/').endsWith('/src/hooks/useCatalogResource.js')) {
          return 'export function useCatalogResource(load, params) { globalThis.__homePublicTestCalls.push({ load, params }); return globalThis.__homePublicTestResource; }'
        }
      },
    }],
  })
  sections = []
  for (const [name, file, emptyText, size, sort] of [
    ['categories', 'CategoryBentoSection', 'Chưa có danh mục trong các mẫu bánh mới.', 12, 'createdAt,desc'],
    ['products', 'BestSellersSection', 'Chưa có mẫu bánh công khai.', 4, 'createdAt,desc'],
    ['bakeries', 'PartnerBakeriesSection', 'Chưa có tiệm bánh công khai.', 3, 'name,asc'],
  ]) {
    const { default: Component } = await vite.ssrLoadModule('/src/components/features/home/' + file + '.jsx')
    sections.push({ name, Component, emptyText, size, sort })
  }
})
after(async () => { await vite?.close(); delete globalThis.__homePublicTestResource; delete globalThis.__homePublicTestCalls })
const ready = (result) => ({ status: 'ready', error: null, data: { result, meta: { page: 1, pageSize: 12, pages: result.length ? 1 : 0, total: result.length } }, reload() {} })
function render(section, resource) {
  globalThis.__homePublicTestResource = resource
  globalThis.__homePublicTestCalls = []
  return renderToStaticMarkup(React.createElement(section.Component, { onNavigate() {} }))
}
const productDto = () => ({ product: { id: randomUUID(), name: 'Product fixture from nested DTO', basePrice: '123000.00', status: 'PUBLISHED' }, bakeryId: randomUUID(), bakeryName: 'Bakery fixture', category: { id: randomUUID(), name: 'Category fixture from DTO' }, images: [], options: { groups: [] }, addOns: [] })

test('All three home sections keep genuine empty states for 200 result[] and request page one without hidden filters', () => {
  for (const section of sections) {
    const html = render(section, ready([]))
    assert.ok(html.includes(section.emptyText), section.name)
    assert.doesNotMatch(html, /role="alert"|Thử lại|Product fixture|Category fixture|Bakery fixture/)
    assert.deepEqual(globalThis.__homePublicTestCalls[0].params, { page: 1, size: section.size, sort: section.sort })
  }
})
test('Nested product/category DTO and public bakery DTO render in the actual home sections', () => {
  const product = mapProduct(productDto())
  const categories = render(sections[0], ready([product, product]))
  assert.match(categories, /Category fixture from DTO/)
  assert.equal((categories.match(/Khám phá danh mục này/g) || []).length, 1, 'deduplicate actual category UUID')
  assert.ok(!categories.includes(sections[0].emptyText))
  const products = render(sections[1], ready([product]))
  assert.match(products, /Product fixture from nested DTO/); assert.match(products, /123\.000₫/)
  assert.ok(!products.includes(sections[1].emptyText))
  const bakery = mapBakery({ id: randomUUID(), name: 'Public bakery fixture from DTO', primaryAddress: { addressLine: 'Fixture address', district: 'Fixture district', city: 'Fixture city' } })
  const bakeries = render(sections[2], ready([bakery]))
  assert.match(bakeries, /Public bakery fixture from DTO/); assert.match(bakeries, /Fixture city/)
  assert.ok(!bakeries.includes(sections[2].emptyText))
})
test('A product without a category is not assigned an invented category', () => {
  const dto = productDto(); dto.category = null
  const html = render(sections[0], ready([mapProduct(dto)]))
  assert.ok(html.includes(sections[0].emptyText)); assert.doesNotMatch(html, /Category fixture from DTO|Khám phá danh mục này/)
})
test('Loading does not masquerade as empty in any home section', () => {
  for (const section of sections) {
    const html = render(section, { status: 'loading', data: null, error: null })
    assert.match(html, /Đang tải dữ liệu/); assert.ok(!html.includes(section.emptyText))
  }
})
for (const status of [400, 401, 403, 404, 500, 502, 0]) test('All three home sections show error/retry, never empty, for HTTP/network ' + status, () => {
  for (const section of sections) {
    const resource = { status: 'error', data: null, error: { status, message: 'Catalog fixture failure' }, reload() {} }
    const html = render(section, resource)
    assert.match(html, /role="alert"/); assert.match(html, /Thử lại/)
    assert.ok(!html.includes(section.emptyText), section.name + ' must not claim empty on failure')
  }
})
