// Isolated HTTP fixtures only: this file never opens a socket or calls a live backend.
import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { authService } from '../src/services/authService.js'
import { vendorManagementService as vendor } from '../src/services/vendorManagementService.js'
import { subscriptionService as subscription } from '../src/services/subscriptionService.js'
import { publicationAdminService as admin } from '../src/services/publicationAdminService.js'
import { cakeService } from '../src/services/cakeService.js'
import { vendorService } from '../src/services/vendorService.js'
import { clearAuthSession } from '../src/services/apiClient.js'

const nativeFetch = globalThis.fetch
after(() => { globalThis.fetch = nativeFetch; clearAuthSession() })
beforeEach(() => clearAuthSession())
const reply = (data, status = 200) => Response.json({ statusCode: status, data, message: 'HTTP fixture only' }, { status })
const page = (result) => ({ result, meta: { page: 1, pageSize: 20, pages: result.length ? 1 : 0, total: result.length } })
test('Entire publication chain sends actual frontend DTOs across Vendor/Admin sessions, then reads public mapped data (HTTP fixture)', async () => {
  const ownerId = randomUUID(), adminId = randomUUID(), bakeryId = randomUUID(), productId = randomUUID(), categoryId = randomUUID(), orderId = randomUUID(), paymentId = randomUUID()
  const bakery = { id: bakeryId, name: 'Bakery fixture only', phoneNumber: 'fixture contact', status: 'DRAFT', operations: { addresses: [], serviceAreas: [], businessHours: [] } }
  const product = { id: productId, name: 'Product fixture only', slug: 'fixture-product', basePrice: 150000, status: 'DRAFT', categoryId }
  const category = { id: categoryId, name: 'Fixture category', slug: 'fixture-category', displayOrder: 0, active: true }
  const plan = { id: randomUUID(), name: 'Plan fixture', code: 'FIXTURE', monthlyPrice: 199000, currency: 'VND', billingPeriodMonths: 1, status: 'ACTIVE', features: {} }
  let role = 'BAKERY_OWNER', order, payment, period = null, hasImage = false
  const issued = new Map(), calls = []
  globalThis.fetch = async (raw, options) => {
    const url = new URL(raw, 'http://fixture.invalid'), path = url.pathname.replace('/api/v1', '')
    calls.push({ path, method: options.method })
    assert.equal(options.credentials, 'include')
    if (path === '/auth/login') {
      const input = JSON.parse(options.body); assert.deepEqual(Object.keys(input).sort(), ['email', 'password'])
      role = input.email.startsWith('owner') ? 'BAKERY_OWNER' : 'ADMIN'
      const accessToken = randomUUID(); issued.set(accessToken, role)
      return reply({ accessToken, tokenType: 'Bearer' })
    }
    const tokenRole = issued.get(options.headers.get('Authorization')?.replace('Bearer ', ''))
    if (!['/products', '/bakeries', '/subscription-plans'].includes(path)) assert.equal(tokenRole, role, path)
    if (path === '/auth/me') return reply({ id: role === 'ADMIN' ? adminId : ownerId, displayName: role, roles: [role] })
    if (path.startsWith('/admin/')) assert.equal(role, 'ADMIN')
    if (path === '/bakeries' && options.method === 'POST') {
      assert.equal(role, 'BAKERY_OWNER'); assert.deepEqual(JSON.parse(options.body), { name: bakery.name, phoneNumber: bakery.phoneNumber })
      return reply(bakery, 201)
    }
    if (path === '/bakeries/' + bakeryId + '/members') return reply([{ userId: ownerId, memberRole: 'OWNER', status: 'ACTIVE' }])
    if (path.endsWith('/operations')) { bakery.operations = JSON.parse(options.body); return reply(bakery.operations) }
    if (path.endsWith('/submit-for-approval')) {
      assert.ok(bakery.operations.addresses.some((row) => row.isPrimary)); assert.ok(bakery.operations.serviceAreas.some((row) => row.active))
      bakery.status = 'PENDING_APPROVAL'; return reply(bakery)
    }
    if (path === '/admin/bakeries') return reply(page([bakery]))
    if (path === '/admin/bakeries/' + bakeryId) return reply({ bakery, members: [], subscription: { active: Boolean(period) } })
    if (path.endsWith('/status') && options.method === 'PATCH') { assert.deepEqual(JSON.parse(options.body), { status: 'ACTIVE' }); bakery.status = 'ACTIVE'; return reply(bakery) }
    if (path === '/subscription-plans') return reply([plan])
    if (path.endsWith('/subscription')) return reply({ bakeryId, currentSubscription: period, scheduledSubscription: null, features: {} })
    if (path.endsWith('/subscription-orders') && options.method === 'POST') {
      assert.equal(role, 'BAKERY_OWNER'); assert.deepEqual(JSON.parse(options.body), { planId: plan.id }); assert.ok(options.headers.get('Idempotency-Key'))
      order = { id: orderId, bakeryId, planId: plan.id, totalAmount: plan.monthlyPrice, currency: 'VND', status: 'PENDING_PAYMENT', expiresAt: '2099-01-01T00:00:00Z', payments: [] }
      return reply(order, 201)
    }
    if (path === '/subscription-orders/' + orderId + '/payments') {
      assert.ok(options.body instanceof FormData); assert.equal(options.headers.has('Content-Type'), false)
      const metadata = JSON.parse(await options.body.get('metadata').text())
      assert.equal(metadata.amount, order.totalAmount); assert.equal(metadata.currency, order.currency); assert.equal(metadata.paymentReference, 'fixture-reference')
      payment = { id: paymentId, subscriptionOrderId: orderId, ...metadata, status: 'SUBMITTED' }
      order.status = 'PAYMENT_REVIEW'; order.payments = [payment]; return reply(payment, 201)
    }
    if (path === '/admin/bakery-payments') return reply(page([payment]))
    if (path === '/subscription-orders/' + orderId) return reply(order)
    if (path === '/admin/bakery-payments/' + paymentId + '/approve') {
      assert.ok(options.headers.get('Idempotency-Key')); assert.equal(JSON.parse(options.body).reviewNote, 'Fixture verified')
      payment.status = 'APPROVED'; order.status = 'COMPLETED'
      period = { id: randomUUID(), status: 'ACTIVE', planCode: plan.code, periodStart: '2026-01-01T00:00:00Z', periodEnd: '2099-01-01T00:00:00Z' }
      return reply({ payment, order, subscription: period })
    }
    if (path.endsWith('/categories') && options.method === 'POST') { assert.deepEqual(JSON.parse(options.body), { name: category.name, slug: category.slug, displayOrder: 0, active: true }); return reply(category, 201) }
    if (path.endsWith('/products') && options.method === 'POST') { const input = JSON.parse(options.body); assert.equal(input.categoryId, categoryId); assert.equal(input.status, undefined); return reply(product, 201) }
    if (path.endsWith('/images')) { assert.equal(options.body.getAll('files').length, 1); hasImage = true; return reply([{ id: randomUUID(), primary: true }], 201) }
    if (path.endsWith('/publish')) { assert.equal(bakery.status, 'ACTIVE'); assert.equal(period.status, 'ACTIVE'); assert.ok(hasImage); product.status = 'PUBLISHED'; return reply(product) }
    if (path === '/products') return reply(page(product.status === 'PUBLISHED' && period ? [{ product, bakeryId, bakeryName: bakery.name, category, images: [], options: { groups: [] }, addOns: [] }] : []))
    if (path === '/bakeries') return reply(page(bakery.status === 'ACTIVE' && period ? [{ id: bakeryId, name: bakery.name, operations: bakery.operations }] : []))
    assert.fail('Unexpected fixture request: ' + path)
  }
  const signIn = (prefix) => authService.login(prefix + '@example.invalid', randomUUID())
  assert.equal((await signIn('owner')).roles[0], 'BAKERY_OWNER')
  const created = await vendor.createBakery({ name: bakery.name, phoneNumber: bakery.phoneNumber })
  assert.equal(created.status, 'DRAFT')
  assert.equal((await vendor.getMembership(bakeryId, ownerId)).memberRole, 'OWNER')
  await vendor.saveOperations(bakeryId, { addresses: [{ addressLine: 'Fixture address', district: 'Fixture district', city: 'Fixture city', isPrimary: true }], serviceAreas: [{ city: 'Fixture city', district: 'Fixture district', deliveryFee: 0, minimumOrder: 0, active: true }], businessHours: [] })
  assert.equal((await vendor.submitBakery(bakeryId)).status, 'PENDING_APPROVAL')
  await signIn('admin')
  assert.equal((await admin.getBakeries()).meta.total, 1)
  await admin.changeBakeryStatus((await admin.getBakery(bakeryId)).bakery, 'ACTIVE')
  await signIn('owner')
  assert.equal((await subscription.getBakerySubscription(bakeryId)).currentSubscription, null)
  const plans = await subscription.getPlans()
  const purchased = await subscription.createOrder({ bakeryId, planId: plans[0].id, key: randomUUID() })
  await subscription.submitPayment({ orderId: purchased.id, amount: purchased.totalAmount, currency: purchased.currency, paymentMethod: 'Fixture transfer', paymentReference: 'fixture-reference', key: randomUUID() })
  await signIn('admin')
  const review = (await admin.getPayments()).result[0]
  const reviewed = await admin.reviewPayment(review, await admin.getOrder(orderId), 'approve', 'Fixture verified', randomUUID())
  assert.equal(reviewed.subscription.status, 'ACTIVE')
  await signIn('owner')
  assert.equal((await subscription.getBakerySubscription(bakeryId)).currentSubscription.status, 'ACTIVE')
  await vendor.createCategory(bakeryId, category)
  const draft = await vendor.saveProduct(bakeryId, null, product)
  await vendor.uploadProductImages(bakeryId, draft.id, [new File(['fixture'], 'fixture.png', { type: 'image/png' })])
  assert.equal((await vendor.changeProduct(bakeryId, draft, 'publish')).status, 'PUBLISHED')
  const publicProducts = await cakeService.getCakes({ page: 1, size: 4 })
  assert.equal(publicProducts.meta.total, 1); assert.equal(publicProducts.result[0].category, category.name)
  assert.equal((await vendorService.getVendors({ page: 1, size: 3 })).meta.total, 1)
  assert.ok(calls.some((call) => call.path.endsWith('/publish')))
})
