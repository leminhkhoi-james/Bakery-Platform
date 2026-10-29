import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDemoStore } from '../src/mockData/store.js'
import { createDemoTransport } from '../src/mockData/transport.js'
import { mapOrder } from '../src/services/orderModels.js'

function fixture() {
  const saved = new Map(), storage = { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) }
  const store = createDemoStore(storage)
  let actor, upstream = 0
  const runtime = createDemoTransport({ store, getUser: () => actor, fetch: async () => { upstream++; throw Error('Unexpected upstream request') } })
  const request = async (path, method = 'GET', body) => {
    const response = await runtime.fetch('/api/v1' + path, { method, ...(body ? { body: JSON.stringify(body) } : {}) })
    assert.equal(response.status, 200)
    return (await response.json()).data
  }
  return { store, storage, request, as(user) { actor = user; store.bind(user) }, writes: () => upstream }
}
const customer = { id: 'aa000000-0000-4000-8000-000000000001', roles: ['CUSTOMER'], displayName: 'Nguyễn An' }
const owner = { id: 'aa000000-0000-4000-8000-000000000002', roles: ['BAKERY_OWNER'], displayName: 'Trần Bình' }
const admin = { id: 'aa000000-0000-4000-8000-000000000003', roles: ['ADMIN'] }
test('New mock order records creation and appends all legitimate transitions; history survives reload across roles', async () => {
  const app = fixture(); app.as(owner); app.as(customer)
  const product = app.store.state.products.find((row) => row.status === 'PUBLISHED'), address = app.store.state.addresses.find((row) => row.customerId === customer.id)
  const order = await app.request('/orders/direct', 'POST', { bakeryId: product.bakeryId, productId: product.id, deliveryAddressId: address.id, quantity: 1, requestedDeliveryAt: new Date(Date.now() + 86400000).toISOString(), optionSelections: [], addOns: [] })
  assert.equal(order.statusHistory.length, 1); assert.equal(order.statusHistory[0].changedAt, order.createdAt)
  assert.equal(order.statusHistory[0].changedByName, 'Nguyễn An')
  const initial = structuredClone(order.statusHistory[0]); let previous = 'PENDING'
  for (const [index, status] of ['CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED'].entries()) {
    app.as(owner)
    const changed = await app.request('/orders/' + order.id + '/status-transitions', 'POST', { targetStatus: status, reason: 'Ghi chú ' + status })
    assert.equal(changed.statusHistory.length, index + 2); assert.deepEqual(changed.statusHistory[0], initial)
    assert.equal(changed.statusHistory.at(-1).fromStatus, previous); assert.equal(changed.statusHistory.at(-1).changedByName, 'Trần Bình')
    app.as(admin); const read = mapOrder(await app.request('/orders/' + order.id), true)
    assert.equal(read.statusHistory.length, index + 2); assert.equal(read.statusHistory.at(-1).note, 'Ghi chú ' + status)
    previous = status
  }
  const restored = createDemoStore(app.storage), persisted = restored.state.orders.find((row) => row.id === order.id)
  assert.equal(persisted.statusHistory.length, 6); assert.deepEqual(persisted.statusHistory[0], initial)
  assert.equal(persisted.completedAt, persisted.statusHistory.at(-1).changedAt); assert.equal(app.writes(), 0)
})
test('Legacy baking order with one initial event gains only actual new transitions, never invented earlier history', async () => {
  const app = fixture(); app.as(owner)
  const order = app.store.state.orders.find((row) => row.status === 'BAKING'), initial = structuredClone(order.statusHistory)
  assert.equal(initial.length, 1)
  assert.throws(() => app.store.transitionOrder(owner, order.id, 'COMPLETED'), { status: 409 })
  assert.deepEqual(order.statusHistory, initial)
  await app.request('/orders/' + order.id + '/status-transitions', 'POST', { targetStatus: 'READY', reason: 'Bánh đã sẵn sàng' })
  const persisted = createDemoStore(app.storage).state.orders.find((row) => row.id === order.id)
  assert.equal(persisted.statusHistory.length, 2); assert.deepEqual(persisted.statusHistory.slice(0, 1), initial)
  assert.equal(persisted.statusHistory[1].fromStatus, 'BAKING'); assert.equal(persisted.statusHistory[1].toStatus, 'READY')
  assert.equal(app.writes(), 0)
})
