import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createBusinessSeed, businessId, BUSINESS_STORAGE_KEY, BUSINESS_MODE_KEY } from '../src/mockData/business/seed.js'
import { createBusinessStore, createBusinessTransport } from '../src/mockData/business/runtime.js'
import { businessMetrics } from '../src/mockData/business/metrics.js'
import { businessUserDirectory } from '../src/mockData/business/userDirectory.js'
import { planFeatureRows } from '../src/services/planPresentation.js'

function fixture() {
  const values = new Map([['sweetcake.demo.v2', 'preserve legacy data'], ['sweetcake.saved-addresses', 'preserve addresses']])
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  const sample = createBusinessSeed(), owner = sample.users.find(user => user.roles.includes('BAKERY_OWNER'))
  let actor = owner, upstream = 0
  const transport = createBusinessTransport({ storage, defaultEnabled: true, getSession: () => ({ user: actor }), fetch: async () => { upstream++; return Response.json({ message: 'Real API failure' }, { status: 500 }) } })
  const api = async (method, path, body, headers = {}) => {
    const response = await transport.fetch('/api/v1' + path, { method, headers, ...(body === undefined ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }) })
    return { status: response.status, ...(await response.json()) }
  }
  return { values, storage, transport, api, owner, actor(user) { actor = user }, upstream: () => upstream }
}

test('Business graph is linked, has stable IDs and coherent amounts/status histories', () => {
  const a = createBusinessSeed(), b = createBusinessSeed()
  assert.deepEqual(a.orders.map(row => row.id), b.orders.map(row => row.id))
  assert.equal(a.bakeries.length, 3); assert.equal(a.products.length, 46); assert.equal(a.products.flatMap(p => p.images).length, 45)
  assert.equal(a.orders.length, 54); assert.equal(a.requests.length, 20); assert.equal(a.offers.length, 26); assert.equal(a.conversations.length, 12)
  for (const order of a.orders) {
    assert.ok(a.bakeries.some(shop => shop.id === order.bakeryId))
    assert.ok(a.users.some(user => user.id === order.customerId))
    assert.equal(order.totalAmount, order.subtotal + order.deliveryFee)
    assert.equal(order.subtotal, order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))
    assert.equal(order.statusHistory.at(-1).toStatus, order.status)
  }
  for (const order of a.orders.filter(order => order.offerId)) {
    const offer = a.offers.find(offer => offer.id === order.offerId), request = a.requests.find(request => request.id === order.cakeRequestId)
    assert.equal(request.customerId, order.customerId)
    assert.equal(offer.bakeryId, order.bakeryId)
    assert.equal(offer.cakeRequestId, request.id)
  }
  for (const chat of a.conversations.filter(chat => chat.orderId)) {
    const order = a.orders.find(order => order.id === chat.orderId)
    assert.equal(chat.customerId, order.customerId)
    assert.equal(chat.bakeryId, order.bakeryId)
  }
  for (const period of a.subscriptions) assert.equal(a.subscriptionOrders.find(order => order.id === period.sourceOrderId)?.status, 'COMPLETED')
  for (const product of a.products.filter(product => product.status === 'PUBLISHED')) assert.ok(product.images.some(image => image.primary))
})

test('One metrics function reconciles shops and system; unpaid, cancelled and disputed orders are excluded from sales', () => {
  const state = createBusinessSeed(), all = businessMetrics(state)
  const shops = state.bakeries.map(shop => businessMetrics(state, { bakeryId: shop.id }))
  for (const key of ['orders', 'orderValue', 'salesRevenue', 'subscriptionRevenue', 'offers']) assert.equal(shops.reduce((sum, shop) => sum + shop[key], 0), all[key])
  assert.equal(Object.values(all.byStatus).reduce((sum, value) => sum + value, 0), 54)
  assert.ok(all.overdue > 0); assert.ok(all.scheduled > 0); assert.ok(all.disputed > 0)
  const expected = state.orders.filter(order => order.status === 'COMPLETED' && order.paymentStatus === 'PAID' && order.issueStatus !== 'DISPUTED').reduce((sum, order) => sum + order.totalAmount, 0)
  assert.equal(all.salesRevenue, expected)
  const from = '2026-11-01', to = '2026-11-30'
  assert.equal(state.bakeries.reduce((sum, shop) => sum + businessMetrics(state, { bakeryId: shop.id, from, to }).salesRevenue, 0), businessMetrics(state, { from, to }).salesRevenue)
  assert.throws(() => businessMetrics(state, { from: to, to: from }), /Ngày bắt đầu/)
})

test('Simulation persists separately, enforces Owner scope and never sends mutations upstream', async () => {
  const f = fixture(), shop = businessId(10)
  assert.equal((await f.api('GET', '/bakeries/' + shop + '/products')).status, 200)
  assert.equal((await f.api('GET', '/bakeries/' + businessId(11) + '/products')).status, 403)
  const orderId = businessId(100000)
  assert.equal((await f.api('POST', '/orders/' + orderId + '/status-transitions', { targetStatus: 'COMPLETED' })).status, 409)
  assert.equal((await f.api('POST', '/orders/' + orderId + '/status-transitions', { targetStatus: 'CONFIRMED' })).status, 200)
  assert.equal(createBusinessStore(f.storage).state.orders.find(order => order.id === orderId).status, 'CONFIRMED')
  f.actor({ id: 'a1000000-0000-4000-8000-000000000001', roles: ['ADMIN'], name: 'Administrator' })
  assert.equal((await f.api('GET', '/orders?scope=all')).data.meta.total, 54)
  assert.equal(f.upstream(), 0)
  assert.equal(f.values.get('sweetcake.demo.v2'), 'preserve legacy data')
  assert.equal(f.values.get('sweetcake.saved-addresses'), 'preserve addresses')
})

test('Real mode forwards server errors and rejects simulation IDs instead of falling back or writing them', async () => {
  const f = fixture(); f.storage.setItem(BUSINESS_MODE_KEY, 'off')
  assert.equal((await f.api('GET', '/orders?scope=all')).status, 500)
  assert.equal((await f.api('POST', '/orders/' + businessId(100000) + '/status-transitions', { targetStatus: 'CONFIRMED' })).status, 422)
  assert.equal(f.upstream(), 1)
  f.actor({ id: businessId(100), roles: ['CUSTOMER'] })
  assert.equal((await f.api('GET', '/orders/' + businessId(100000))).status, 422)
  assert.equal(f.upstream(), 1)
})

test('Local payment review is idempotent, amount-checked and activates only the matching simulated bakery', async () => {
  const f = fixture(), order = businessId(600)
  const payload = { amount: 19000, currency: 'VND', paymentMethod: 'BANK_TRANSFER', paymentReference: 'LOCAL-ONLY' }
  const form = () => { const data = new FormData(); data.set('metadata', new Blob([JSON.stringify(payload)], { type: 'application/json' })); return data }
  const path = '/subscription-orders/' + order + '/payments'
  const first = await f.api('POST', path, form(), { 'Idempotency-Key': businessId(999001) })
  assert.equal(first.status, 201)
  const replay = await f.api('POST', path, form(), { 'Idempotency-Key': businessId(999001) })
  assert.equal(replay.data.id, first.data.id)
  assert.equal(f.transport.getStore().state.payments.filter(payment => payment.subscriptionOrderId === order).length, 1)
  f.actor({ id: 'a1000000-0000-4000-8000-000000000001', roles: ['ADMIN'], name: 'Administrator' })
  const payment = businessId(802), approvePath = '/admin/bakery-payments/' + payment + '/approve'
  const approved = await f.api('POST', approvePath, { reviewNote: 'Local review only' }, { 'Idempotency-Key': businessId(999002) })
  assert.equal(approved.status, 200); assert.equal(approved.data.subscription.bakeryId, businessId(12)); assert.equal(approved.data.subscription.status, 'ACTIVE')
  assert.equal((await f.api('POST', approvePath, { reviewNote: 'Local review only' }, { 'Idempotency-Key': businessId(999002) })).data.subscription.id, approved.data.subscription.id)
  assert.equal(f.upstream(), 0)
})

test('Unknown Owners do not inherit a default bakery and expired subscription cannot publish or quote', async () => {
  const f = fixture()
  f.actor({ id: 'a1000000-0000-4000-8000-000000000009', roles: ['BAKERY_OWNER'] })
  assert.equal((await f.api('GET', '/bakeries/' + businessId(10) + '/members')).status, 403)
  f.actor(createBusinessSeed().users.filter(user => user.roles.includes('BAKERY_OWNER'))[2])
  const product = createBusinessSeed().products.find(product => product.bakeryId === businessId(12) && product.status === 'DRAFT')
  assert.equal((await f.api('POST', '/bakeries/' + businessId(12) + '/products/' + product.id + '/publish')).status, 422)
  assert.equal(f.upstream(), 0)
})

test('Malformed saved simulation is preserved and storage failures never report success', async () => {
  const f = fixture(); f.storage.setItem(BUSINESS_STORAGE_KEY, '{incomplete')
  assert.equal((await f.api('GET', '/orders?scope=all')).status, 500)
  assert.equal(f.storage.getItem(BUSINESS_STORAGE_KEY), '{incomplete')
  assert.equal(f.upstream(), 0)
  const g = fixture(); await g.api('GET', '/bakeries/' + businessId(10) + '/products')
  const before = g.storage.getItem(BUSINESS_STORAGE_KEY)
  g.storage.setItem = () => { throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' }) }
  const result = await g.api('POST', '/orders/' + businessId(100000) + '/status-transitions', { targetStatus: 'CONFIRMED' })
  assert.equal(result.status, 500); assert.match(result.message, /dung lượng/)
  assert.equal(g.storage.getItem(BUSINESS_STORAGE_KEY), before)
})

test('User CRUD operates on the same graph and protects logged-in Admin and linked contacts', async () => {
  const f = fixture(), store = createBusinessStore(f.storage), directory = businessUserDirectory(store), admin = { id: 'a1000000-0000-4000-8000-000000000001', roles: ['ADMIN'] }
  const added = await directory.change(admin, 'save', null, { name: 'Hạ Vy', email: 'ha.vy@example.invalid' })
  assert.equal(createBusinessStore(f.storage).state.users.find(user => user.id === added.id).name, 'Hạ Vy')
  await directory.change(admin, 'status', added.id, { expectedStatus: 'ACTIVE' })
  assert.equal(directory.list({ status: 'SUSPENDED' }).result.some(user => user.id === added.id), true)
  await assert.rejects(() => directory.change(admin, 'delete', businessId(100)), /đơn liên kết/)
  await directory.change(admin, 'delete', added.id)
  assert.equal(directory.list().result.some(user => user.id === added.id), false)
})

test('Plan features render canonical limits once when older saves contain aliases', () => {
  const rows = planFeatureRows({ products: '20', MAX_PRODUCTS: '50', offers: '10', MAX_MONTHLY_OFFERS: '100' })
  assert.equal(rows.length, 2)
  assert.equal(rows.find(row => row.code === 'MAX_PRODUCTS').value, '50')
})

test('IndexedDB-style storage is not rewritten on reads and failed asynchronous commits roll back', async () => {
  const f = fixture()
  const original = JSON.stringify(createBusinessSeed())
  f.values.set(BUSINESS_STORAGE_KEY, original)
  f.storage.initialized = true
  let writes = 0
  f.storage.setItem = async () => { writes++; throw Object.assign(new Error('disk full'), { name: 'QuotaExceededError' }) }
  assert.equal((await f.api('GET', '/orders?scope=bakery&bakeryId=' + businessId(10))).status, 200)
  assert.equal(writes, 0)
  const result = await f.api('POST', '/orders/' + businessId(100000) + '/status-transitions', { targetStatus: 'CONFIRMED' })
  assert.equal(result.status, 500)
  assert.match(result.message, /dung lượng/)
  assert.equal(writes, 1)
  assert.equal(f.values.get(BUSINESS_STORAGE_KEY), original)
  assert.equal(f.transport.getStore().state.orders[0].status, 'PENDING')
  assert.equal(f.upstream(), 0)
})
