import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { defaultGiftAccessories, giftAccessoriesError, giftAccessoriesLabel, noteLimitWithGift, orderNoteWithGift } from '../src/services/giftAccessories.js'
import { catalogCartItem } from '../src/services/catalogCart.js'
import { createVerifiedDirectOrder } from '../src/services/verifiedCheckoutService.js'

test('Free candle choices distinguish cart configurations without changing price', () => {
  const product = { id: randomUUID(), price: 100000, quantity: 2 }
  const straight = catalogCartItem({ ...product, giftAccessories: defaultGiftAccessories() })
  const numbered = catalogCartItem({ ...product, giftAccessories: { candleType: 'NUMBER', candleNumber: '18' } })
  assert.notEqual(straight.id, numbered.id)
  assert.equal(straight.price, numbered.price)
  assert.deepEqual(numbered.addOns, [])
  assert.deepEqual(JSON.parse(JSON.stringify(numbered)).giftAccessories, { candleType: 'NUMBER', candleNumber: '18' })
  assert.equal(giftAccessoriesLabel(numbered.giftAccessories), 'Nến số 18')
  assert.equal(catalogCartItem({ ...product, giftAccessories: { candleType: 'STRAIGHT', candleNumber: '18' } }).id, straight.id)
})

test('Numeral candles require a valid age; changing to straight candles needs no age', () => {
  for (const candleNumber of ['', '-1', '1.5', '1000', 'mười']) assert.ok(giftAccessoriesError({ candleType: 'NUMBER', candleNumber }))
  for (const candleNumber of ['0', '18', '100']) assert.equal(giftAccessoriesError({ candleType: 'NUMBER', candleNumber }), '')
  assert.equal(giftAccessoriesError(defaultGiftAccessories()), '')
  assert.throws(() => orderNoteWithGift('', { candleType: 'NUMBER', candleNumber: '' }), { status: 422 })
})

test('Gift choice preserves the customer note and stays inside the existing BE note limit', () => {
  const gift = { candleType: 'NUMBER', candleNumber: '18' }
  const limit = noteLimitWithGift([{ giftAccessories: defaultGiftAccessories() }, { giftAccessories: gift }])
  assert.ok(orderNoteWithGift('a'.repeat(limit), gift).length <= 1000)
  assert.throws(() => orderNoteWithGift('a'.repeat(1000), gift), { status: 400 })
  assert.equal(orderNoteWithGift('Giao cổng sau', undefined), 'Giao cổng sau')
  assert.equal(orderNoteWithGift('Giao cổng sau', gift), 'Giao cổng sau\n\nPhụ kiện tặng kèm: bộ dĩa/nĩa và nến số 18.')
})

test('Checkout sends gift selection to the existing BE customerNote without paid add-ons', async () => {
  const original = globalThis.fetch, productId = randomUUID(), bakeryId = randomUUID(), addressId = randomUUID(), key = randomUUID(), calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    if (url.endsWith('/products/' + productId)) return Response.json({ data: { bakeryId, product: { id: productId, basePrice: 100000, status: 'PUBLISHED' }, options: { groups: [] }, addOns: [] } })
    if (url.endsWith('/addresses/' + addressId)) return Response.json({ data: { id: addressId, label: 'Nhà', recipientName: 'Khách', recipientPhone: '0901234567', addressLine: '12 Nguyễn Huệ', district: 'Quận 1', city: 'HCM', isDefault: true } })
    return Response.json({ data: { id: randomUUID(), bakeryId, customerId: randomUUID(), items: [], statusHistory: [] } }, { status: 201 })
  }
  try {
    const item = { productId, bakeryId, quantity: 2, giftAccessories: { candleType: 'NUMBER', candleNumber: '18' } }
    await createVerifiedDirectOrder(item, { deliveryAddressId: addressId, requestedDeliveryAt: '2099-01-01T12:00:00Z', customerNote: 'Giao cổng sau' }, key)
    const request = calls.find(call => call.url.endsWith('/orders/direct')), body = JSON.parse(request.options.body)
    assert.equal(body.customerNote, 'Giao cổng sau\n\nPhụ kiện tặng kèm: bộ dĩa/nĩa và nến số 18.')
    assert.deepEqual(body.addOns, [])
    assert.equal(body.quantity, 2)
    assert.equal(body.giftAccessories, undefined)
    assert.equal(new Headers(request.options.headers).get('Idempotency-Key'), key)
    const before = calls.length
    await assert.rejects(createVerifiedDirectOrder({ ...item, giftAccessories: { candleType: 'NUMBER', candleNumber: '' } }, { deliveryAddressId: addressId }, key), { status: 422 })
    assert.equal(calls.length, before)
  } finally { globalThis.fetch = original }
})
