import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { addressService, loadAddresses } from '../src/services/addressService.js'
import { createVerifiedDirectOrder, acceptVerifiedOffer } from '../src/services/verifiedCheckoutService.js'

test('Direct checkout validates API address and product before creating an order', async () => {
  const original = globalThis.fetch, calls = []
  const [id, bakeryId, productId, key] = Array.from({ length: 4 }, () => randomUUID())
  const address = { id, label: 'Nhà', recipientName: 'Fixture', recipientPhone: '0901234567', addressLine: 'Fixture', district: 'Quận 1', city: 'HCM', isDefault: true }
  const item = { bakeryId, productId, quantity: 1 }
  const input = { deliveryAddressId: id, requestedDeliveryAt: '2099-01-01T12:00:00Z' }
  let addressStatus = 200
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    if (url.endsWith('/bakeries/' + bakeryId)) return Response.json({ data: { id: bakeryId, name: 'Tiệm', operations: { businessHours: Array.from({ length: 7 }, (_, index) => ({ dayOfWeek: index + 1, opensAt: '00:00', closesAt: '23:59', closed: false })) } } })
    if (url.endsWith('/addresses/' + id)) return Response.json({ data: address }, { status: addressStatus })
    if (url.endsWith('/addresses')) return Response.json({ data: options.method === 'POST' ? address : [address] })
    if (url.endsWith('/products/' + productId)) return Response.json({ data: {
      bakeryId, product: { id: productId, basePrice: 100000, status: 'PUBLISHED' }, options: { groups: [] }, addOns: [],
    } })
    return Response.json({ data: { id: randomUUID(), bakeryId, customerId: randomUUID(), items: [], statusHistory: [] } }, { status: 201 })
  }
  try {
    assert.equal((await loadAddresses())[0].primary, true)
    await addressService.create({ ...address, title: address.label, primary: true, deliveryNote: 'unsupported' })
    const saved = JSON.parse(calls.at(-1).options.body)
    assert.equal(saved.label, address.label)
    assert.equal(saved.isDefault, true)
    assert.equal(saved.deliveryNote, undefined)
    await createVerifiedDirectOrder(item, input, key)
    const order = calls.at(-1)
    assert.match(order.url, /\/orders\/direct$/)
    assert.equal(order.options.headers.get('Idempotency-Key'), key)
    assert.equal(JSON.parse(order.options.body).deliveryAddressId, id)
    assert.equal(order.options.allowMockFallback, false)
    addressStatus = 404
    await assert.rejects(createVerifiedDirectOrder(item, input, key), { status: 404 })
    assert.equal(calls.filter(call => call.url.endsWith('/orders/direct')).length, 1)
    const before = calls.length
    await assert.rejects(createVerifiedDirectOrder(item, { ...input, deliveryAddressId: '5c000000-0000-4000-8000-000000000001' }, key), { status: 400 })
    await assert.rejects(acceptVerifiedOffer('de000000-0000-4000-8000-000000000001', input, key), { status: 400 })
    assert.equal(calls.length, before)
  } finally { globalThis.fetch = original }
})
