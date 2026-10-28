import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { adminManagementService as service, planPayload } from '../src/services/adminManagementService.js'
import { orderService } from '../src/services/orderService.js'
import { allowedOrderActions } from '../src/services/orderModels.js'
import { canAccess } from '../src/routes/routeAccess.js'
import { setAuthToken } from '../src/services/apiClient.js'
const id = randomUUID(), customerId = randomUUID(), bakeryId = randomUUID(), jobId = randomUUID()
const plan = { id, code: 'FIXTURE', name: 'Fixture plan', description: '', monthlyPrice: '321000', currency: 'VND', billingPeriodMonths: 1, status: 'INACTIVE', features: { MAX_PRODUCTS: '20' } }
const input = { ...plan, featureRows: [{ code: 'MAX_PRODUCTS', value: '20' }] }
const review = { orderId: id, customerId, rating: 5, status: 'HIDDEN', comment: 'Fixture' }
const design = { id, generationJobId: jobId, moderationStatus: 'APPROVED', imageUrl: 'https://fixture.invalid/design.png' }
const nativeFetch = globalThis.fetch
const reply = (data, status = 200) => Response.json({ data, statusCode: status, message: 'Isolated admin HTTP fixture' }, { status })
let handler, calls
beforeEach(() => { calls = []; setAuthToken('fixture-admin'); handler = () => reply(null, 500); globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options) } })
after(() => { globalThis.fetch = nativeFetch; setAuthToken(null) })
test('Admin plan list includes inactive records and maps server prices/features', async () => {
  handler = () => reply([plan])
  const result = await service.getPlans()
  assert.equal(result[0].monthlyPrice, 321000); assert.equal(result[0].status, 'INACTIVE')
  assert.equal(calls[0].url, '/api/v1/admin/subscription-plans'); assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer fixture-admin')
  handler = () => reply([]); assert.deepEqual(await service.getPlans(), [])
})
test('Admin plan POST/PATCH whitelist DTO and archive waits for backend state', async () => {
  handler = () => reply(plan)
  await service.savePlan(null, input); assert.equal(calls[0].options.method, 'POST'); assert.deepEqual(JSON.parse(calls[0].options.body), planPayload(input)); assert.equal(JSON.parse(calls[0].options.body).id, undefined)
  await service.savePlan(id, input); assert.equal(calls[1].options.method, 'PATCH'); assert.equal(calls[1].url, '/api/v1/admin/subscription-plans/' + id)
  handler = () => reply({ ...plan, status: 'ARCHIVED' }); assert.equal((await service.archivePlan(id)).status, 'ARCHIVED')
  assert.equal(calls.at(-1).url, '/api/v1/admin/subscription-plans/' + id + '/archive')
  handler = () => reply(plan); await assert.rejects(service.archivePlan(id), { status: 502 })
})
test('Plan validation covers VND, period, price, duplicated features, limits before HTTP', async () => {
  for (const patch of [{ currency: 'USD' }, { monthlyPrice: -1 }, { monthlyPrice: Infinity }, { billingPeriodMonths: 0 }, { status: 'DRAFT' }, { featureRows: [{ code: 'DUP', value: '1' }, { code: 'DUP', value: '2' }] }, { featureRows: [{ code: '', value: '1' }] }]) await assert.rejects(service.savePlan(null, { ...input, ...patch }))
  assert.equal(calls.length, 0)
})
test('Moderation PATCH sends only actual status fields, response must confirm IDs/status', async () => {
  handler = () => reply(review); assert.equal((await service.moderateReview(id, 'HIDDEN')).status, 'HIDDEN')
  assert.deepEqual(JSON.parse(calls[0].options.body), { status: 'HIDDEN' }); assert.equal(calls[0].url, '/api/v1/admin/reviews/' + id + '/status')
  handler = () => reply(design); assert.equal((await service.moderateDesign(id, 'APPROVED')).id, id)
  assert.equal(calls[1].options.method, 'PATCH'); assert.deepEqual(JSON.parse(calls[1].options.body), { moderationStatus: 'APPROVED' })
  assert.equal(calls[1].url, '/api/v1/admin/generated-designs/' + id + '/moderation')
  await assert.rejects(service.moderateReview(id, 'DELETED'), { status: 400 }); await assert.rejects(service.moderateDesign(id, 'PENDING'), { status: 400 })
  handler = () => reply({ ...review, orderId: randomUUID() }); await assert.rejects(service.moderateReview(id, 'HIDDEN'), { status: 502 })
})
test('Admin Order uses real scope=all and enum transitions while other roles cannot open admin UI', async () => {
  handler = () => reply({ result: [{ id, customerId, bakeryId, status: 'PENDING' }], meta: { page: 1, pageSize: 10, pages: 1, total: 1 } })
  await orderService.getOrders({ scope: 'all', page: 1, size: 10 })
  assert.equal(new URL(calls[0].url, 'http://fixture').searchParams.get('scope'), 'all')
  assert.deepEqual(allowedOrderActions({ status: 'PENDING' }, { roles: ['ADMIN'] }, 'all'), ['CONFIRMED', 'CANCELLED'])
  for (const page of ['admin-plans', 'admin-moderation', 'admin-orders']) {
    assert.equal(canAccess(page, { roles: ['ADMIN'] }), true)
    for (const role of ['CUSTOMER', 'BAKERY_OWNER', 'BAKERY_STAFF']) assert.equal(canAccess(page, { roles: [role] }), false)
  }
})
for (const status of [400, 401, 403, 404, 409, 422, 500, 503]) test('Every new Admin API exposes HTTP ' + status + ' without fake queue or success', async () => {
  handler = () => reply(null, status)
  for (const call of [() => service.getPlans(), () => service.savePlan(null, input), () => service.savePlan(id, input), () => service.archivePlan(id), () => service.moderateReview(id, 'HIDDEN'), () => service.moderateDesign(id, 'APPROVED')]) await assert.rejects(call(), { status })
})
test('Admin offline fixture preserves errors for all mutation categories', async () => {
  handler = () => { throw new TypeError('offline') }
  for (const call of [() => service.getPlans(), () => service.savePlan(null, input), () => service.savePlan(id, input), () => service.archivePlan(id), () => service.moderateReview(id, 'HIDDEN'), () => service.moderateDesign(id, 'APPROVED')]) await assert.rejects(call(), { status: 0 })
})

