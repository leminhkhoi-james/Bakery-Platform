import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDemoStore } from '../src/mockData/store.js'
import { createSeed, demoId } from '../src/mockData/seed.js'
import { createDemoTransport } from '../src/mockData/transport.js'
import { mapProduct, mapBakery } from '../src/services/catalogModels.js'
import { mapOrder } from '../src/services/orderModels.js'
import { mapRequest, mapOffer } from '../src/services/marketplaceModels.js'
import { mapConversation, mapMessage } from '../src/services/chatModels.js'
import { mapManagedList } from '../src/services/vendorCatalogModels.js'
import { mapSubscriptionPlan, mapSubscriptionOrder } from '../src/services/subscriptionModels.js'

const customer = { id: 'aa000000-0000-4000-8000-000000000001', fullName: 'Khách kiểm thử', roles: ['CUSTOMER'] }
const vendor = { id: 'aa000000-0000-4000-8000-000000000002', roles: ['BAKERY_OWNER'] }
const admin = { id: 'aa000000-0000-4000-8000-000000000003', roles: ['ADMIN'] }
const empty = { result: [], meta: { page: 1, pageSize: 20, pages: 0, total: 0 } }
const response = (data = empty, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { 'Content-Type': 'application/json' } })
function setup(upstream = () => response()) {
  let user = customer
  const calls = [], store = createDemoStore()
  const runtime = createDemoTransport({ store, getUser: () => user, fetch: async (...args) => { calls.push(args); return upstream(...args) } })
  return { ...runtime, calls, as(value) { user = value; store.bind(value) } }
}
const request = (runtime, path, method = 'GET', body) => runtime.fetch('/api/v1' + path, { method, body: body ? JSON.stringify(body) : undefined })
const data = async (res) => (await res.json()).data

test('Plan edits, pause and archive keep purchased snapshots and block new purchases after availability ends', async () => {
  const app = setup(); app.as(vendor)
  const plan = app.store.state.plans[0], bakery = app.store.state.bakeries[0]
  plan.billingPeriodMonths = 3
  const order = await data(await request(app, '/bakeries/' + bakery.id + '/subscription-orders', 'POST', { planId: plan.id }))
  const before = structuredClone(order)
  assert.equal(order.totalAmount, plan.monthlyPrice * 3)
  app.as(admin)
  await request(app, '/admin/subscription-plans/' + plan.id, 'PATCH', { name: 'Tên mới', monthlyPrice: 999999, features: { MAX_PRODUCTS: '999' }, status: 'INACTIVE' })
  const stored = app.store.state.subscriptionOrders.find((item) => item.id === order.id)
  assert.deepEqual(stored.featuresSnapshot, before.featuresSnapshot)
  assert.equal(stored.totalAmount, before.totalAmount); assert.equal(stored.planNameSnapshot, before.planNameSnapshot)
  app.as(vendor)
  assert.equal((await request(app, '/bakeries/' + bakery.id + '/subscription-orders', 'POST', { planId: plan.id })).status, 422)
  app.as(admin)
  assert.equal((await request(app, '/admin/subscription-plans/' + plan.id, 'PATCH', { code: 'DIFFERENT' })).status, 409)
  assert.equal((await request(app, '/admin/subscription-plans/' + plan.id + '/archive', 'POST')).status, 200)
  assert.equal((await request(app, '/admin/subscription-plans/' + plan.id + '/archive', 'POST')).status, 409)
  assert.deepEqual(stored.featuresSnapshot, before.featuresSnapshot)
  assert.equal(app.calls.length, 0, 'local plan writes never reach the real transport')
})

test('An activated subscription retains its purchased benefits after its plan is edited and archived', async () => {
  const app = setup(); app.as(admin)
  const payment = app.store.state.payments[0]
  const bought = app.store.state.subscriptionOrders.find((order) => order.id === payment.subscriptionOrderId)
  const expected = structuredClone(bought.featuresSnapshot)
  const approved = await data(await request(app, '/admin/bakery-payments/' + payment.id + '/approve', 'POST', {}))
  const end = approved.subscription.periodEnd
  await request(app, '/admin/subscription-plans/' + bought.planId, 'PATCH', { monthlyPrice: 123000, features: { MAX_PRODUCTS: '999' }, status: 'INACTIVE' })
  await request(app, '/admin/subscription-plans/' + bought.planId + '/archive', 'POST')
  app.as(vendor)
  const subscription = await data(await request(app, '/bakeries/' + bought.bakeryId + '/subscription'))
  assert.deepEqual(subscription.features, expected)
  assert.equal(subscription.currentSubscription.periodEnd, end)
  assert.deepEqual(app.store.state.subscriptionOrders.find((order) => order.id === bought.id).featuresSnapshot, expected)
  assert.equal(app.calls.length, 0)
})

test('Bakery return reason synchronizes through the existing local graph and never reaches the upstream', async () => {
  const app = setup(); app.as(vendor)
  const bakery = app.store.state.bakeries[0]
  bakery.status = 'PENDING_APPROVAL'
  app.as(admin)
  const returned = await data(await request(app, '/admin/bakeries/' + bakery.id + '/status', 'PATCH', { status: 'DRAFT', reviewNote: 'Bổ sung số nhà và đường.' }))
  assert.equal(returned.status, 'DRAFT')
  assert.equal(returned.reviewDecision.reason, 'Bổ sung số nhà và đường.')
  const review = await data(await request(app, '/admin/bakeries/' + bakery.id))
  assert.equal(review.bakery.reviewDecision.status, 'RETURNED')
  app.as(vendor)
  const owner = await data(await request(app, '/bakeries/' + bakery.id))
  assert.equal(owner.reviewDecision.reason, 'Bổ sung số nhà và đường.')
  assert.equal(owner.status, 'DRAFT'); assert.equal(app.calls.length, 0)
})

test('empty real lists fall back to contract-valid DEMO data; real data immediately takes priority without merging', async () => {
  let live = empty
  const app = setup(() => response(live))
  const list = await data(await request(app, '/products?page=1&size=2'))
  assert.equal(list.result.length, 2); assert.equal(list.meta.total, createSeed().products.filter((p) => p.status === 'PUBLISHED').length)
  assert.ok(createSeed().products.some((p) => p.name === mapProduct(list.result[0]).title))
  live = { result: [{ id: 'real-product' }], meta: { ...empty.meta, total: 1, pages: 1 } }
  assert.deepEqual(await data(await request(app, '/products')), live)
  live = empty
  assert.deepEqual(await data(await request(app, '/products?query=not-found')), empty)
  assert.deepEqual(await data(await request(app, '/products')), empty)
})
test('filtered empty results and later pages do not fabricate a demo collection', async () => {
  const app = setup((url) => String(url).includes('query=') || String(url).includes('status=') || String(url).includes('page=2') ? response() : response({ result: [{ id: 'real' }], meta: { ...empty.meta, total: 1, pages: 1 } }))
  for (const path of ['/products?query=nothing', '/products?page=2', '/orders?scope=mine&status=COMPLETED']) assert.deepEqual(await data(await request(app, path)), empty)
})
test('never hides 401/403/5xx, network failure, malformed payload, auth or real mutation errors', async () => {
  for (const status of [400, 401, 403, 409, 422, 429, 500, 501, 502, 503]) {
    const app = setup(() => response(null, status))
    assert.equal((await request(app, '/products')).status, status)
    assert.equal(app.sources.size, 0)
  }
  const network = setup(() => { throw new TypeError('offline') })
  await assert.rejects(request(network, '/products'), /offline/)
  const malformed = setup(() => response({ result: [] }))
  assert.deepEqual(await data(await request(malformed, '/products')), { result: [] })
  const auth = setup(() => response(null, 404))
  assert.equal((await request(auth, '/auth/me')).status, 404)
  assert.equal((await request(auth, '/orders/direct', 'POST', { productId: customer.id })).status, 404)
})
test('only known unsupported collection endpoints fall back, never arbitrary real details', async () => {
  for (const status of [404, 405]) {
    const app = setup(() => response(null, status))
    const bakery = mapBakery((await data(await request(app, '/bakeries'))).result[0])
    assert.ok(createSeed().bakeries.some((b) => b.name === bakery.name))
    assert.equal((await request(app, '/products/' + customer.id)).status, status)
    assert.equal((await request(app, '/something-new')).status, status)
  }
})
test('reserved DEMO IDs never reach backend, unauthenticated writes and foreign ownership are rejected', async () => {
  const app = setup(); app.as(null)
  assert.equal((await request(app, '/orders/' + demoId(400))).status, 401)
  app.as(customer)
  const body = await data(await request(app, '/orders/' + demoId(400)))
  assert.equal(mapOrder(body, true).customerId, customer.id)
  app.as({ ...customer, id: 'bb000000-0000-4000-8000-000000000001' })
  assert.equal((await request(app, '/orders/' + demoId(400))).status, 403)
  assert.equal(app.calls.length, 0)
  assert.equal((await request(app, '/orders/direct', 'POST', { productId: demoId(100), bakeryId: customer.id, deliveryAddressId: vendor.id })).status, 422)
  assert.equal(app.calls.length, 0)
})
test('Customer → Vendor → Admin: RFQ, quote, chat, order, review, subscription approval stay consistent through existing services', async () => {
  const app = setup(); app.as(customer); app.as(vendor); app.as(admin)
  const original = globalThis.fetch; globalThis.fetch = app.fetch
  try {
    const { rfqService } = await import('../src/services/rfqService.js')
    const { orderService } = await import('../src/services/orderService.js')
    const { chatService } = await import('../src/services/chatService.js')
    const { subscriptionService } = await import('../src/services/subscriptionService.js')
    const { publicationAdminService } = await import('../src/services/publicationAdminService.js')
    const { vendorManagementService } = await import('../src/services/vendorManagementService.js')
    const { vendorCatalogService } = await import('../src/services/vendorCatalogService.js')
    const { adminManagementService } = await import('../src/services/adminManagementService.js')
    app.as(customer)
    await rfqService.getRfqs({ scope: 'mine' })
    const rfq = await rfqService.createRfq({ requestType: 'OPEN_CUSTOM', title: 'Kỷ niệm DEMO', description: 'Bánh kem hoa hồng', neededAt: new Date(Date.now() + 9 * 86400000).toISOString(), deliveryDistrict: 'Quận 1', deliveryCity: 'TP. Hồ Chí Minh' })
    assert.equal(mapRequest(rfq, true).status, 'DRAFT')
    await rfqService.publishRfq(rfq.id)
    app.as(vendor)
    assert.equal((await vendorManagementService.getMembership(demoId(10), vendor.id)).memberRole, 'OWNER')
    assert.ok(mapManagedList(await vendorCatalogService.list(demoId(10), 'members'), 'members').length)
    const offer = await rfqService.submitOffer(rfq.id, { bakeryId: demoId(10), cakePrice: 800000, deliveryFee: 30000, estimatedCompletionAt: new Date(Date.now() + 8 * 86400000).toISOString(), expiresAt: new Date(Date.now() + 2 * 86400000).toISOString() })
    assert.equal(mapOffer(offer, true).totalPrice, 830000)
    app.as(customer)
    const viewer = { userId: customer.id, roles: customer.roles }
    const chat = await chatService.createConversation({ cakeRequestId: rfq.id, bakeryId: demoId(10) }, viewer)
    assert.equal(mapConversation(chat, true).customerId, customer.id)
    const msg = await chatService.sendMessage(chat.id, { clientMessageId: crypto.randomUUID(), messageType: 'TEXT', content: 'Cho mình ít ngọt nhé!' })
    assert.equal(mapMessage(msg).senderId, customer.id)
    const receipt = await chatService.markRead(chat.id, msg.id)
    assert.equal((await chatService.getConversation(chat.id, viewer)).currentUserLastReadAt, receipt.lastReadAt)
    const accepted = await rfqService.acceptOffer(offer.id, { deliveryAddressId: demoId(90000) }, crypto.randomUUID())
    assert.equal((await orderService.getOrderById(accepted.orderId)).totalAmount, 830000)
    app.as(vendor)
    for (const target of ['CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED']) await orderService.updateOrderStatus(accepted.orderId, target)
    app.as(customer)
    await orderService.saveReview(accepted.orderId, { rating: 5, comment: 'DEMO: bánh đúng yêu cầu.' })
    app.as(admin)
    const detail = await orderService.getOrderById(accepted.orderId)
    assert.equal(detail.status, 'COMPLETED'); assert.equal(detail.review.rating, 5)
    const payment = app.store.state.payments[0], subscriptionOrder = await publicationAdminService.getOrder(payment.subscriptionOrderId)
    const approved = await publicationAdminService.reviewPayment(payment, subscriptionOrder, 'approve', '', crypto.randomUUID())
    assert.equal(approved.order.status, 'COMPLETED'); assert.equal(approved.subscription.bakeryId, demoId(10))
    app.as(vendor)
    assert.equal((await subscriptionService.getBakerySubscription(demoId(10))).currentSubscription.id, approved.subscription.id)
    app.as(admin)
    assert.ok((await adminManagementService.getPlans()).every((p) => mapSubscriptionPlan(p)))
    assert.equal(app.calls.filter(([, opts]) => opts.method !== 'GET').length, 0, 'no DEMO write reaches real transport')
  } finally { globalThis.fetch = original }
})
test('DEMO store persistence and reset do not touch real auth/storage keys', () => {
  const values = new Map([['auth-session', 'untouched']])
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) }
  const app = createDemoStore(storage); app.bind(customer)
  app.createOrder(customer, { productId: demoId(100) }); app.save()
  const restored = createDemoStore(storage)
  assert.equal(restored.state.orders.length, createSeed().orders.length + 1)
  restored.reset(); assert.equal(restored.state.orders.length, createSeed().orders.length)
  assert.equal(values.get('auth-session'), 'untouched')
  assert.equal(mapSubscriptionOrder(restored.state.subscriptionOrders[0]).bakeryId, demoId(10))
})

test('filtered initial pages verify root emptiness and propagate probe authentication/server errors', async () => {
  const app = setup()
  const page = await data(await request(app, '/admin/bakery-payments?status=SUBMITTED'))
  assert.equal(page, undefined, 'customer must not gain admin access through fallback')
  app.as(admin)
  assert.equal((await data(await request(app, '/admin/bakery-payments?status=SUBMITTED'))).meta.total, 1)
  assert.ok(app.calls.some(([url]) => String(url).includes('size=1')))
  for (const status of [401, 403, 500, 503]) {
    const failed = setup((url) => String(url).includes('status=') ? response() : response(null, status))
    assert.equal((await request(failed, '/orders?status=PENDING')).status, status)
  }
})
test('catalog CRUD/options, pricing and ownership checks use the same DEMO graph', async () => {
  const app = setup(); app.as(vendor)
  const bakery = demoId(10)
  const category = await data(await request(app, `/bakeries/${bakery}/categories`, 'POST', { name: 'Bánh cưới', slug: 'banh-cuoi', active: true, displayOrder: 2 }))
  const product = await data(await request(app, `/bakeries/${bakery}/products`, 'POST', { name: 'Bánh cưới · DEMO', categoryId: category.id, basePrice: 500000 }))
  assert.equal(product.status, 'DRAFT')
  const options = await data(await request(app, `/bakeries/${bakery}/products/${product.id}/options`, 'PUT', { groups: [{ name: 'Size', required: false, minimumSelections: 0, maximumSelections: 1, selectionType: 'SINGLE', values: [{ name: 'Lớn', priceAdjustment: 100000, active: true }] }] }))
  assert.ok(options.groups[0].id); assert.ok(options.groups[0].values[0].id)
  await request(app, `/bakeries/${bakery}/products/${product.id}/publish`, 'POST')
  app.as(customer)
  const order = await data(await request(app, '/orders/direct', 'POST', { bakeryId: bakery, productId: product.id, quantity: 2, optionSelections: [{ optionGroupId: options.groups[0].id, optionValueIds: [options.groups[0].values[0].id] }], addOns: [{ addOnId: demoId(70000), quantity: 1 }] }))
  assert.equal(order.subtotal, 1200000 + createSeed().addOns[0].price)
  app.as({ id: 'aa000000-0000-4000-8000-000000000004', roles: ['BAKERY_OWNER'] })
  assert.equal((await request(app, `/bakeries/${bakery}/products/${product.id}`, 'PATCH', { basePrice: 1 })).status, 403)
  assert.equal((await request(app, `/bakeries/${bakery}/products`)).status, 403)
  app.as(vendor)
  const disposable = await data(await request(app, `/bakeries/${bakery}/categories`, 'POST', { name: 'Tạm', slug: 'tam', active: true, displayOrder: 3 }))
  assert.equal((await request(app, `/bakeries/${bakery}/categories/${disposable.id}`, 'DELETE')).status, 200)
  assert.equal(app.store.state.categories.some((c) => c.id === disposable.id), false)
  assert.equal(app.calls.length, 0)
})
test('DEMO idempotency replays reject changed payloads and do not duplicate writes', async () => {
  const app = setup(); app.as(customer)
  const options = { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ productId: demoId(100) }) }
  const first = await data(await app.fetch('/api/v1/orders/direct', options))
  const second = await data(await app.fetch('/api/v1/orders/direct', options))
  assert.equal(first.id, second.id); assert.equal(app.store.state.orders.length, createSeed().orders.length + 1)
  assert.equal((await app.fetch('/api/v1/orders/direct', { ...options, body: JSON.stringify({ productId: demoId(102) }) })).status, 409)
  assert.equal(app.calls.length, 0)
})
test('mock fallback is disabled by default and does not replace fetch outside explicit opt-in', async () => {
  const original = globalThis.fetch
  const { installDemoFallback } = await import('../src/mockData/runtime.js')
  assert.equal(installDemoFallback(() => customer), null)
  assert.equal(globalThis.fetch, original)
})


test('existing catalog/bakery assets are adapted once with globally unique mock IDs', async () => {
  const { INITIAL_CAKES } = await import('../src/mockData/customer/cakes.js')
  const { STORES } = await import('../src/mockData/customer/stores.js')
  const seed = createSeed()
  const seen = new Set()
  for (const source of INITIAL_CAKES) {
    const key = source.title.toLocaleLowerCase('vi')
    if (seen.has(key)) continue
    seen.add(key)
    const product = seed.products.find((p) => p.name === source.title)
    assert.ok(product); assert.equal(product.images[0].url, source.image)
  }
  for (const source of STORES) assert.ok(seed.bakeries.some((bakery) => bakery.name === source.name && bakery.logoUrl === source.image))
  const ids = ['users', 'bakeries', 'categories', 'products', 'requests', 'offers', 'orders', 'plans', 'subscriptionOrders', 'payments', 'conversations', 'messages', 'addresses', 'jobs', 'designs', 'addOns'].flatMap((key) => seed[key].map((row) => row.id))
  assert.equal(new Set(ids).size, ids.length)
})

test('known mock lists paginate fully and still yield to new real data', async () => {
  let live = empty
  const app = setup(() => response(live))
  const first = await data(await request(app, '/products?page=1&size=12'))
  const second = await data(await request(app, '/products?page=2&size=12'))
  assert.equal(second.result.length, 12); assert.equal(second.meta.total, first.meta.total)
  assert.equal(second.result.some((row) => first.result.some((other) => other.product.id === row.product.id)), false)
  live = { result: [{ id: 'real' }], meta: { ...empty.meta, total: 1, pages: 1 } }
  assert.deepEqual(await data(await request(app, '/products')), live)
})

test('AI Studio history, prompt creation/revision/cancel and RFQ selection work through unchanged API services', async () => {
  const app = setup(); app.as(customer)
  const original = globalThis.fetch; globalThis.fetch = app.fetch
  try {
    const { aiService } = await import('../src/services/aiService.js')
    const { rfqService } = await import('../src/services/rfqService.js')
    const history = await aiService.getJobs({ page: 0, size: 1 })
    assert.equal(history.result.length, 1)
    const seeded = await aiService.getGenerationJob(history.result[0].id, customer)
    assert.ok(seeded.generatedDesigns.length); assert.match(seeded.job.modelName, /không gọi AI/)
    await rfqService.selectDesign(seeded.job.cakeRequestId, seeded.generatedDesigns[0].id)
    assert.equal((await rfqService.getRfqById(seeded.job.cakeRequestId)).selectedDesignId, seeded.generatedDesigns[0].id)
    const created = await aiService.createGenerationJob({ cakeRequestId: seeded.job.cakeRequestId, prompt: 'Bánh hoa hồng ít ngọt', generationParameters: { numberOfDesigns: 2 } }, [], crypto.randomUUID())
    assert.equal(created.status, 'QUEUED')
    await aiService.cancelJob(created.id)
    assert.equal((await aiService.getGenerationJob(created.id, customer)).job.status, 'CANCELLED')
    const revised = await aiService.reviseJob(seeded.job.id, { prompt: 'Đổi sang màu xanh pastel' }, crypto.randomUUID())
    app.store.find('jobs', revised.id).startedAt = new Date(Date.now() - 5000).toISOString()
    const finished = await aiService.getGenerationJob(revised.id, customer)
    assert.equal(finished.job.status, 'SUCCEEDED'); assert.equal(finished.currentRevision, 2)
    assert.equal(app.calls.some(([, options]) => options.method !== 'GET'), false)
  } finally { globalThis.fetch = original }
})

test('normal admin user CRUD and customer addresses stay local and cannot alter login identities', async () => {
  const app = setup(); app.as(admin); app.as(customer)
  app.as(admin)
  const { api } = await import('../src/services/apiClient.js')
  const original = globalThis.fetch; globalThis.fetch = app.fetch
  try {
    await api.get('/admin/users')
    const person = await api.post('/admin/users', { name: 'Khách mới', email: 'new@sample.invalid', roles: ['ADMIN'] })
    assert.deepEqual(person.roles, ['CUSTOMER'])
    assert.equal((await api.patch('/admin/users/' + person.id, { name: 'Tên cập nhật', status: 'SUSPENDED' })).status, 'SUSPENDED')
    await api.delete('/admin/users/' + person.id)
    assert.equal(app.store.state.users.some((u) => u.id === person.id), false)
    await assert.rejects(api.patch('/admin/users/' + admin.id, { name: 'Forbidden' }), { status: 403 })
    app.as(customer)
    const added = app.runLocal('/sample-addresses', 'POST', { title: 'Văn phòng', addressLine: 'Địa chỉ mẫu', recipientName: 'Khách', recipientPhone: '0900000000', city: 'TP. Hồ Chí Minh', district: 'Quận 1' })
    assert.equal(added.customerId, customer.id)
    app.runLocal('/sample-addresses/' + added.id, 'PATCH', { title: 'Tên mới' })
    app.runLocal('/sample-addresses/' + added.id, 'DELETE')
    assert.equal(app.store.state.addresses.some((a) => a.id === added.id), false)
    assert.equal(app.calls.some(([, options]) => options.method !== 'GET'), false)
  } finally { globalThis.fetch = original }
})


test('mock file uploads fail explicitly without claiming storage success or reaching backend', async () => {
  const app = setup(); app.as(customer)
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify({ cakeRequestId: demoId(200), prompt: 'Ảnh tham khảo' })], { type: 'application/json' }))
  form.append('sourceImages', new Blob(['fixture'], { type: 'image/png' }), 'sample.png')
  const result = await app.fetch('/api/v1/generation-jobs', { method: 'POST', body: form })
  assert.equal(result.status, 422); assert.match((await result.json()).message, /chưa hỗ trợ lưu tệp/)
  assert.equal(app.calls.length, 0)
})


test('each Customer gets their own sample addresses without rebinding another customer graph', () => {
  const app = setup(); app.as(customer)
  const first = app.store.state.addresses.filter((a) => a.customerId === customer.id)
  const other = { ...customer, id: 'aa000000-0000-4000-8000-000000000099', displayName: 'Khách thứ hai' }
  app.as(other)
  const second = app.store.state.addresses.filter((a) => a.customerId === other.id)
  assert.equal(second.length, first.length); assert.equal(second[0].recipientName, other.displayName)
  assert.equal(second.some((a) => first.some((b) => b.id === a.id)), false)
  assert.equal(app.store.state.orders[0].customerId, customer.id)
  assert.equal(app.store.state.actors.customer, customer.id)
  const next = app.store.state.nextId
  app.store.bind(other); assert.equal(app.store.state.nextId, next)
  for (const address of second) app.runLocal('/sample-addresses/' + address.id, 'DELETE')
  app.store.bind(other)
  assert.equal(app.store.state.addresses.some((a) => a.customerId === other.id), false, 'deleted addresses must not reappear')
  assert.equal(app.store.state.addresses.filter((a) => a.customerId === customer.id).length, first.length)
})

test('address validation, default selection and ownership apply before checkout', () => {
  const app = setup(); app.as(customer)
  const next = app.store.state.nextId
  assert.throws(() => app.runLocal('/sample-addresses', 'POST', { title: 'Chưa đầy đủ' }), { status: 422 })
  assert.equal(app.store.state.nextId, next)
  const added = app.runLocal('/sample-addresses', 'POST', { title: 'Địa chỉ mới', recipientName: 'Khách', recipientPhone: '0901234567', addressLine: '12 Đường Mẫu', district: 'Quận 1', city: 'TP. Hồ Chí Minh', primary: true })
  assert.equal(app.store.state.addresses.filter((a) => a.customerId === customer.id && a.primary).length, 1)
  assert.equal(app.store.state.addresses.find((a) => a.primary && a.customerId === customer.id).id, added.id)
  const order = app.store.createOrder(customer, { productId: demoId(100), deliveryAddressId: added.id })
  assert.equal(order.deliveryAddress.addressLine, added.addressLine)
  app.as({ ...customer, id: 'aa000000-0000-4000-8000-000000000098' })
  assert.throws(() => app.store.createOrder({ ...customer, id: 'aa000000-0000-4000-8000-000000000098' }, { productId: demoId(100), deliveryAddressId: added.id }), { status: 403 })
  assert.equal(app.calls.length, 0)
})


test('address defaults recover after edits/deletion and historical order snapshots stay unchanged', () => {
  const app = setup(); app.as(customer)
  const own = () => app.store.state.addresses.filter((a) => a.customerId === customer.id)
  const first = own().find((a) => a.primary), second = own().find((a) => !a.primary)
  const order = app.store.createOrder(customer, { productId: demoId(100), deliveryAddressId: first.id })
  const originalLine = order.deliveryAddress.addressLine
  app.runLocal('/sample-addresses/' + first.id, 'PATCH', { addressLine: 'Địa chỉ cập nhật', deliveryNote: 'Gọi trước khi giao', primary: false })
  assert.equal(own().find((a) => a.primary).id, second.id)
  assert.equal(order.deliveryAddress.addressLine, originalLine)
  app.runLocal('/sample-addresses/' + second.id, 'DELETE')
  assert.equal(own().filter((a) => a.primary).length, 1)
  assert.equal(own()[0].id, first.id)
  const next = app.store.createOrder(customer, { productId: demoId(100), deliveryAddressId: first.id })
  assert.equal(next.deliveryAddress.deliveryNote, 'Gọi trước khi giao')
  assert.equal(next.customerPhone, first.recipientPhone)
  app.runLocal('/sample-addresses/' + first.id, 'DELETE')
  assert.equal(own().length, 0); assert.equal(order.deliveryAddress.addressLine, originalLine)
  const newAddress = app.runLocal('/sample-addresses', 'POST', { title: 'Nhà mới', recipientName: 'Khách', recipientPhone: '0901234567', addressLine: '123 Đường Mẫu', city: 'TP. Hồ Chí Minh', district: 'Quận 1', primary: false })
  assert.equal(newAddress.primary, true)
})

test('address selection tolerates late loading and deleted selection without exposing another account', async () => {
  const { selectedAddress } = await import('../src/mockData/addressModels.js')
  const app = setup(); app.as(customer)
  assert.equal(selectedAddress([], ''), null)
  const own = app.store.state.addresses.filter((a) => a.customerId === customer.id)
  assert.equal(selectedAddress(own, '').id, own.find((a) => a.primary).id)
  assert.equal(selectedAddress(own, own[1].id).id, own[1].id)
  const remaining = own.filter((a) => a.id !== own[1].id)
  assert.equal(selectedAddress(remaining, own[1].id).id, remaining[0].id)
  const other = { ...customer, id: 'aa000000-0000-4000-8000-000000000097' }
  app.as(other)
  const otherAddresses = app.store.state.addresses.filter((a) => a.customerId === other.id)
  assert.equal(selectedAddress(otherAddresses, own[0].id).customerId, other.id)
})

test('invalid phone/note never modifies an address or clears the current default', () => {
  const app = setup(); app.as(customer)
  const original = structuredClone(app.store.state.addresses)
  const id = original.find((a) => a.customerId === customer.id).id
  for (const body of [{ recipientPhone: 'abc', primary: true }, { deliveryNote: 'x'.repeat(501) }, { addressLine: '   ' }]) assert.throws(() => app.runLocal('/sample-addresses/' + id, 'PATCH', body), { status: 422 })
  assert.deepEqual(app.store.state.addresses, original)
})


test('address labels avoid duplicate legacy defaults/locality and preserve Unicode input', async () => {
  const { addressTitle, formatAddress } = await import('../src/mockData/addressModels.js')
  assert.equal(addressTitle({ title: 'Nhà riêng (Mặc định)' }), 'Nhà riêng')
  assert.equal(formatAddress({ addressLine: '123 Đường Mẫu, Bình Thạnh, TP.HCM', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh' }), '123 Đường Mẫu, Bình Thạnh, TP.HCM')
  assert.match(formatAddress({ addressLine: 'Quận 10', district: 'Quận 1' }), /Quận 10, Quận 1/)
  assert.equal(formatAddress({ addressLine: '東京', city: '大阪' }), '東京, 大阪')
})

test('Complete standardized mock flow: thêm địa chỉ → checkout → Order → Vendor → Admin', async () => {
  const app = setup(); app.as(customer)
  const original = globalThis.fetch; globalThis.fetch = app.fetch
  try {
    const { orderService } = await import('../src/services/orderService.js')

    // 1. Customer thêm địa chỉ mới vào mock data
    const newAddress = app.runLocal('/sample-addresses', 'POST', {
      title: 'Địa chỉ nhận bánh E2E',
      recipientName: 'Nguyễn Văn A',
      recipientPhone: '0987654321',
      addressLine: '456 Đường Hoa Hồng',
      ward: 'Bến Nghé',
      district: 'Quận 1',
      city: 'TP. Hồ Chí Minh',
      deliveryNote: 'Giao giờ hành chính',
      primary: true,
    })
    assert.ok(newAddress.id)
    assert.equal(newAddress.recipientName, 'Nguyễn Văn A')
    assert.equal(newAddress.primary, true)

    // 2. Customer checkout direct order với địa chỉ vừa tạo
    const product = createSeed().products.find((p) => p.status === 'PUBLISHED')
    const createdOrder = await orderService.createDirectOrder({
      bakeryId: product.bakeryId,
      productId: product.id,
      deliveryAddressId: newAddress.id,
      quantity: 1,
      optionSelections: [],
      addOns: [],
      requestedDeliveryAt: new Date(Date.now() + 5 * 86400000).toISOString(),
      customerNote: 'Bánh tươi ngon nhé',
    }, crypto.randomUUID())

    assert.ok(createdOrder.id)
    assert.equal(createdOrder.status, 'PENDING')
    assert.equal(createdOrder.deliveryAddress.addressLine, '456 Đường Hoa Hồng')
    assert.equal(createdOrder.deliveryAddress.recipientName, 'Nguyễn Văn A')
    assert.equal(createdOrder.deliveryAddress.deliveryNote, 'Giao giờ hành chính')

    // 3. Customer xem đơn trong danh sách cá nhân (Order list scope: mine)
    const customerOrders = await orderService.getOrders({ scope: 'mine', page: 1, size: 10 })
    assert.ok(customerOrders.result.some((o) => o.id === createdOrder.id))

    // 4. Vendor nhận đơn và cập nhật trạng thái (CONFIRMED -> BAKING -> READY -> DELIVERING -> COMPLETED)
    app.as(vendor)
    const vendorOrders = await orderService.getOrders({ scope: 'bakery', bakeryId: product.bakeryId, page: 1, size: 10 })
    assert.ok(vendorOrders.result.some((o) => o.id === createdOrder.id))

    for (const status of ['CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED']) {
      const updated = await orderService.updateOrderStatus(createdOrder.id, status)
      assert.equal(updated.status, status)
    }

    // 5. Customer để lại đánh giá
    app.as(customer)
    const review = await orderService.saveReview(createdOrder.id, { rating: 5, comment: 'Bánh rất đẹp và ngon!' })
    assert.equal(review.rating, 5)

    // 6. Admin kiểm tra đơn hàng toàn sàn (scope: all)
    app.as(admin)
    const adminOrders = await orderService.getOrders({ scope: 'all', page: 1, size: 10 })
    assert.ok(adminOrders.result.some((o) => o.id === createdOrder.id))

    const adminDetail = await orderService.getOrderById(createdOrder.id)
    assert.equal(adminDetail.status, 'COMPLETED')
    assert.equal(adminDetail.deliveryAddress.recipientName, 'Nguyễn Văn A')
    assert.equal(adminDetail.review.rating, 5)
  } finally {
    globalThis.fetch = original
  }
})



test('Owner status buttons use the existing service, retain notes/history and sync all roles without backend writes', async () => {
  const app = setup(); app.as(customer); app.as(vendor)
  const id = app.store.state.orders.find((order) => order.status === 'PENDING').id
  const original = globalThis.fetch; globalThis.fetch = app.fetch
  try {
    const { orderService } = await import('../src/services/orderService.js')
    for (const target of ['CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED']) {
      app.as(vendor)
      const order = await orderService.updateOrderStatus(id, target, 'Ghi chú ' + target)
      assert.equal(order.statusHistory.at(-1).note, 'Ghi chú ' + target)
      app.as(customer); assert.equal((await orderService.getOrderById(id)).status, target)
      app.as(admin); assert.equal((await orderService.getOrderById(id)).status, target)
    }
    assert.equal(app.calls.length, 0)
  } finally { globalThis.fetch = original }
})
