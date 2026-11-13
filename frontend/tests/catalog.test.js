import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { cakeService } from '../src/services/cakeService.js'
import { vendorService } from '../src/services/vendorService.js'
import { catalogMoney, formatCatalogPrice, mapBakery, mapCatalogPage, mapProduct } from '../src/services/catalogModels.js'
import { catalogUrl } from '../src/routes/catalogNavigation.js'
import { catalogCartItem } from '../src/services/catalogCart.js'

const productId = randomUUID(), bakeryId = randomUUID(), categoryId = randomUUID()
const product = { product: { id: productId, name: 'Bánh dâu', basePrice: '0.00', status: 'PUBLISHED', customizable: false, defaultServingSize: 4, minimumNoticeHours: 24 }, bakeryId, bakeryName: 'Tiệm bánh', category: { id: categoryId, name: 'Bánh kem' }, images: [{ id: randomUUID(), url: 'https://storage.example/image', primary: true, displayOrder: 1 }], options: { groups: [] }, addOns: [] }
const bakery = { id: bakeryId, name: 'Tiệm bánh', description: 'Mô tả', primaryAddress: { addressLine: '10 Đường A', ward: 'Phường B', district: 'Quận C', city: 'Thành phố D' }, logoUrl: null, coverUrl: null, operations: { businessHours: [] } }
const page = (result, meta = {}) => ({ result, meta: { page: 1, pageSize: 12, pages: result.length ? 1 : 0, total: result.length, ...meta } })
const reply = (data, status = 200) => Response.json({ data, statusCode: status, message: 'Catalog response' }, { status })
const nativeFetch = globalThis.fetch
let calls, handler
beforeEach(() => {
  calls = []
  handler = () => { throw new Error('Unexpected request') }
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options) }
})
after(() => { globalThis.fetch = nativeFetch })

test('Product mapper uses nested DTO fields and preserves a zero price and false customizable', () => {
  const model = mapProduct(product)
  assert.equal(model.id, productId)
  assert.equal(model.bakeryId, bakeryId)
  assert.equal(model.price, 0)
  assert.equal(model.customizable, false)
  assert.equal(model.image, product.images[0].url)
  assert.equal(model.categoryId, categoryId)
  assert.equal(model.rating, undefined)
  assert.equal(model.sizes, undefined)
})

test('Missing optional fields stay missing instead of becoming invented prices or pictures', () => {
  const model = mapProduct({ product: { id: productId } })
  assert.equal(model.price, null)
  assert.equal(model.image, null)
  assert.equal(model.bakeryId, null)
  assert.equal(model.vendor, null)
  assert.deepEqual(model.optionGroups, [])
  assert.equal(formatCatalogPrice(model.price), 'Chưa có giá')
  assert.equal(catalogMoney(''), null)
  assert.equal(catalogMoney(false), null)
  assert.equal(catalogMoney([]), null)
})

test('Public bakery mapper uses primaryAddress without inventing status, rating, email or chef', () => {
  const model = mapBakery(bakery)
  assert.equal(model.city, 'Thành phố D')
  assert.match(model.location, /10 Đường A/)
  for (const field of ['status', 'rating', 'email', 'phoneNumber', 'chef']) assert.equal(model[field], undefined)
  assert.equal(model.image, null)
})

test('Empty result and server pagination meta are preserved', () => {
  assert.deepEqual(mapCatalogPage(page([], { page: 3, total: 0 }), mapProduct), page([], { page: 3, total: 0 }))
})

test('Malformed results/meta produce an explicit contract error', () => {
  assert.throws(() => mapCatalogPage({ results: [product] }, mapProduct), { status: 502 })
  assert.throws(() => mapProduct({ id: productId }), { status: 502 })
})

test('Product request forwards only supported filters including zero/false and uses public access', async () => {
  handler = () => reply(page([product], { page: 2, pages: 3, total: 25 }))
  const response = await cakeService.getCakes({ query: 'Bánh & kem', bakeryId, categoryId, minPrice: 0, maxPrice: 500000, customizable: false, page: 2, size: 12, sort: 'basePrice,asc', rating: 5, deliveryTime: 'fast' })
  const url = new URL(calls[0].url, 'http://test.local')
  assert.equal(url.pathname, '/api/v1/products')
  assert.equal(url.searchParams.get('query'), 'Bánh & kem')
  assert.equal(url.searchParams.get('minPrice'), '0')
  assert.equal(url.searchParams.get('customizable'), 'false')
  assert.equal(url.searchParams.has('rating'), false)
  assert.equal(url.searchParams.has('deliveryTime'), false)
  assert.equal(calls[0].options.headers.has('Authorization'), false)
  assert.equal(response.meta.page, 2)
  assert.equal(response.meta.total, 25)
  assert.equal(response.result.length, 1)
})

test('200 with an empty list never falls back to mock cakes or bakeries', async () => {
  handler = () => reply(page([]))
  assert.deepEqual((await cakeService.getCakes()).result, [])
  assert.deepEqual((await vendorService.getVendors()).result, [])
})

test('Bakery request forwards name search, city, district, sort and page to the backend', async () => {
  handler = () => reply(page([bakery]))
  const response = await vendorService.getVendors({ query: 'Tiệm', city: 'Thành phố D', district: 'Quận C', page: 2, size: 6, sort: 'name,desc' })
  const url = new URL(calls[0].url, 'http://test.local')
  assert.equal(url.pathname, '/api/v1/bakeries')
  assert.equal(url.searchParams.get('district'), 'Quận C')
  assert.equal(url.searchParams.get('page'), '2')
  assert.equal(response.result[0].id, bakeryId)
})

test('Existing product and bakery detail calls use UUIDs and actual detail DTOs', async () => {
  handler = (url) => reply(url.includes('/products/') ? product : bakery)
  assert.equal((await cakeService.getCakeById(productId)).id, productId)
  assert.equal((await vendorService.getVendorById(bakeryId)).id, bakeryId)
  assert.equal(calls[0].url, '/api/v1/products/' + productId)
})

test('Nonexistent detail returns 404; invalid demo ID never becomes a mock product', async () => {
  handler = () => reply(null, 404)
  await assert.rejects(cakeService.getCakeById(productId), { status: 404 })
  await assert.rejects(vendorService.getVendorById(bakeryId), { status: 404 })
  const before = calls.length
  await assert.rejects(cakeService.getCakeById('demo-cake'), { status: 404 })
  assert.equal(calls.length, before)
})

for (const status of [401, 403, 500]) test('Catalog HTTP ' + status + ' stays an error without refresh/mock fallback', async () => {
  handler = () => reply(null, status)
  await assert.rejects(cakeService.getCakes(), { status })
  await assert.rejects(vendorService.getVendors(), { status })
  assert.equal(calls.length, 2)
})

test('Network failure stays an explicit error', async () => {
  handler = () => { throw new TypeError('offline') }
  await assert.rejects(cakeService.getCakes(), { status: 0 })
  await assert.rejects(vendorService.getVendorById(bakeryId), { status: 0 })
})

test('List-to-detail URLs preserve identifiers for reload and bakery/category filtering', () => {
  assert.equal(catalogUrl('product-detail', { id: productId }), '/product-detail?id=' + productId)
  assert.equal(catalogUrl('bakery-detail', { id: bakeryId }), '/bakery-detail?id=' + bakeryId)
  const search = new URL(catalogUrl('explore', { bakeryId, categoryId, query: 'Dâu & kem' }), 'http://test.local').searchParams
  assert.equal(search.get('bakeryId'), bakeryId)
  assert.equal(search.get('categoryId'), categoryId)
  assert.equal(search.get('query'), 'Dâu & kem')
})

test('Catalog-to-local-cart handoff keeps zero price, UUIDs and exact configuration', () => {
  const mapped = mapProduct(product)
  const item = catalogCartItem({ ...mapped, optionSelections: [{ optionGroupId: randomUUID(), optionValueIds: [randomUUID()] }], addOns: [], quantity: 2 })
  assert.equal(item.price, 0)
  assert.equal(item.productId, productId)
  assert.equal(item.bakeryId, bakeryId)
  assert.equal(item.quantity, 2)
  assert.equal(catalogUrl('product-detail', item), '/product-detail?id=' + productId)
})
