import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { addOnDisplayName, addOnSelectionError, addOnLimit, addOnUnit, isCustomerAddOn, cartLineSubtotal } from '../src/services/addOnInventory.js'
import { catalogEntityPayload } from '../src/services/vendorCatalogModels.js'
import { revalidateCartItem } from '../src/services/checkoutService.js'
import { mapProduct } from '../src/services/catalogModels.js'
import { userFeedback } from '../src/services/uiLabels.js'

test('Accessory counts are independent of cake count and survive price revalidation', async () => {
  const productId = randomUUID(), bakeryId = randomUUID(), addOnId = randomUUID(), original = globalThis.fetch
  let stock = 5
  globalThis.fetch = async () => Response.json({ data: {
    bakeryId, product: { id: productId, basePrice: 100000, status: 'PUBLISHED' }, options: { groups: [] },
    addOns: [{ id: addOnId, name: 'Nến', price: 20000, stockQuantity: stock }],
  } })
  const item = { productId, bakeryId, price: 100000, quantity: 2, addOnSubtotal: 60000, addOns: [{ addOnId, quantity: 3 }] }
  try {
    assert.equal(cartLineSubtotal(item), 260000)
    assert.equal((await revalidateCartItem(item)).subtotal, 260000)
    stock = 2
    await assert.rejects(revalidateCartItem(item), error => error.status === 409 && /vượt mức/.test(error.message) && !/chỉ còn 2/.test(error.message))
  } finally { globalThis.fetch = original }
})

test('Uninitialized/sold-out stock and invalid quantities are blocked with recovery text', () => {
  assert.equal(addOnLimit({ stockQuantity: 400 }), 100)
  assert.equal(addOnLimit({ stockQuantity: null }), 0)
  assert.match(addOnSelectionError({ name: 'Nến', stockQuantity: 0 }, 1), /chưa khả dụng/)
  assert.match(addOnSelectionError({ name: 'Nến', stockQuantity: null }, 1), /chưa khả dụng/)
  for (const quantity of [0, -1, 1.5, 101, '', NaN]) assert.ok(addOnSelectionError({ name: 'Nến', stockQuantity: 10 }, quantity))
  assert.equal(addOnSelectionError({ name: 'Nến', stockQuantity: 3 }, 3), '')
})

test('Customer catalog sells candles by set and excludes handwritten cards', () => {
  assert.equal(addOnUnit({ name: 'Bộ nến sinh nhật' }), 'bộ')
  assert.equal(addOnUnit({ name: 'Bộ dĩa và nĩa' }), 'bộ')
  assert.equal(addOnUnit({ name: 'Nón sinh nhật' }), 'cái')
  assert.equal(addOnDisplayName({ name: 'Bộ nến sinh nhật' }), 'Bộ nến thẳng')
  assert.equal(addOnUnit({ name: 'Topper sinh nhật' }), 'cái')
  const candle = { name: 'Bộ nến sinh nhật', category: 'DECORATION' }
  for (const card of [{ name: 'Thiệp viết tay' }, { name: 'Thiep chuc mung' }, { name: 'Lời chúc', category: 'CARD' }]) assert.equal(isCustomerAddOn(card), false)
  assert.equal(isCustomerAddOn({ name: 'Nến số 5' }), false)
  assert.equal(isCustomerAddOn({ name: 'Bộ nến thẳng' }), true)
  assert.deepEqual(mapProduct({ product: { id: randomUUID() }, addOns: [candle, { name: 'Thiệp viết tay', category: 'CARD' }] }).addOns, [candle])
})

test('Customer error feedback does not disclose available inventory counts', () => {
  const message = userFeedback({ message: 'Phụ kiện Bộ nến sinh nhật chỉ còn 42 sản phẩm.', status: 409 })
  assert.match(message, /giảm số lượng/)
  assert.doesNotMatch(message, /42|tồn kho/)
})

test('Owner stock updates carry the concurrency version and accept a sold-out value', () => {
  const input = { name: 'Nến', category: 'DECORATION', price: 20000, active: true, stockQuantity: '0', version: 7 }
  const body = catalogEntityPayload('add-ons', input)
  assert.equal(body.stockQuantity, 0)
  assert.equal(body.version, 7)
  for (const stockQuantity of ['', -1, 1.2, 2147483648]) assert.throws(() => catalogEntityPayload('add-ons', { ...input, stockQuantity }))
})
