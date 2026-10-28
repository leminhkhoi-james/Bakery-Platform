import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { orderService } from '../src/services/orderService.js'
import { mapOrder, mapReview, reviewPermissions } from '../src/services/orderModels.js'
import { chatService } from '../src/services/chatService.js'
import { aiService } from '../src/services/aiService.js'
import { subscriptionService } from '../src/services/subscriptionService.js'
import { setAuthToken } from '../src/services/apiClient.js'
const id = randomUUID(), customerId = randomUUID(), bakeryId = randomUUID(), jobId = randomUUID()
const review = { orderId: id, customerId, rating: 4, comment: 'Fixture', status: 'PUBLISHED' }
const conversation = { id, customerId, bakeryId, cakeRequestId: randomUUID(), status: 'CLOSED', participants: [{ userId: customerId }] }
const nativeFetch = globalThis.fetch
let calls, handler
const reply = (data, status = 200) => status === 204 ? new Response(null, { status }) : Response.json({ data, statusCode: status, message: 'Isolated fixture' }, { status })
beforeEach(() => { calls = []; setAuthToken('fixture-user'); handler = () => reply(null, 500); globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options) } })
after(() => { globalThis.fetch = nativeFetch; setAuthToken(null) })
test('Review create/patch whitelist rating/comment, map response, DELETE accepts 204', async () => {
  handler = () => reply(review)
  for (const update of [false, true]) {
    const result = await orderService.saveReview(id, { rating: '4', comment: 'Fixture', customerId: 'ignored', status: 'ignored' }, update)
    assert.equal(result.orderId, id)
    const call = calls.at(-1); assert.equal(call.url, '/api/v1/orders/' + id + '/review')
    assert.equal(call.options.method, update ? 'PATCH' : 'POST'); assert.deepEqual(JSON.parse(call.options.body), { rating: 4, comment: 'Fixture' })
    assert.equal(call.options.headers.get('Authorization'), 'Bearer fixture-user')
  }
  handler = () => reply(null, 204)
  await orderService.deleteReview(id); assert.equal(calls.at(-1).options.method, 'DELETE')
})
test('Review validation and permission match COMPLETED owner, PUBLISHED edit, HIDDEN delete, DELETED terminal', async () => {
  for (const rating of ['', 0, 6, 1.5]) await assert.rejects(orderService.createReview(id, { rating }), { status: 400 })
  await assert.rejects(orderService.createReview(id, { rating: 5, comment: 'x'.repeat(5001) }), { status: 400 })
  assert.equal(calls.length, 0)
  const order = { id, customerId, status: 'COMPLETED' }, owner = { id: customerId, roles: ['CUSTOMER'] }
  assert.equal(reviewPermissions(order, owner).create, true)
  assert.equal(reviewPermissions(order, { id: randomUUID(), roles: ['CUSTOMER'] }).create, false)
  assert.equal(reviewPermissions(order, { id: customerId, roles: ['ADMIN'] }).create, false)
  assert.deepEqual(reviewPermissions({ ...order, review: { ...review, status: 'HIDDEN' } }, owner), { create: false, edit: false, delete: true })
  assert.deepEqual(reviewPermissions({ ...order, review: { ...review, status: 'DELETED' } }, owner), { create: false, edit: false, delete: false })
})
test('Order detail maps server review and rejects review belonging to another order/customer', () => {
  const order = { id, customerId, bakeryId, items: [], statusHistory: [], review }
  assert.equal(mapOrder(order, true).review.rating, 4)
  assert.throws(() => mapOrder({ ...order, review: { ...review, customerId: randomUUID() } }, true), { status: 502 })
  assert.throws(() => mapReview({ ...review, rating: 99 }), { status: 502 })
})
test('Close conversation POST has reason only and requires matching CLOSED response', async () => {
  handler = () => reply(conversation)
  assert.equal((await chatService.closeConversation(id, 'Fixture closure')).status, 'CLOSED')
  assert.deepEqual(JSON.parse(calls[0].options.body), { reason: 'Fixture closure' })
  assert.equal(calls[0].url, '/api/v1/conversations/' + id + '/close')
  assert.equal(calls[0].options.method, 'POST')
  handler = () => reply({ ...conversation, status: 'OPEN' }); await assert.rejects(chatService.closeConversation(id), { status: 502 })
  await assert.rejects(chatService.closeConversation(id, 'x'.repeat(501)), { status: 400 })
})
test('Design detail and plan detail GET real endpoints, preserve moderation and server pricing', async () => {
  handler = () => reply({ id, generationJobId: jobId, moderationStatus: 'PENDING', imageUrl: 'https://fixture.invalid/private.png' })
  assert.equal((await aiService.getDesign(id)).imageUrl, null); assert.equal(calls[0].url, '/api/v1/generated-designs/' + id)
  handler = () => reply({ id, status: 'ACTIVE', code: 'FIXTURE', monthlyPrice: '321000', currency: 'VND', billingPeriodMonths: 1 })
  assert.equal((await subscriptionService.getPlan(id)).monthlyPrice, 321000)
  assert.equal(calls.at(-1).options.headers.has('Authorization'), false)
  handler = () => reply({ id: randomUUID(), generationJobId: jobId }); await assert.rejects(aiService.getDesign(id), { status: 502 })
})
for (const status of [400, 401, 403, 404, 409, 422, 500, 503]) test('New Customer HTTP fixture ' + status + ' errors never become fake success', async () => {
  handler = () => reply(null, status)
  await assert.rejects(orderService.createReview(id, { rating: 4 }), { status })
  await assert.rejects(orderService.saveReview(id, { rating: 4 }, true), { status })
  await assert.rejects(orderService.deleteReview(id), { status })
  await assert.rejects(chatService.closeConversation(id), { status })
  await assert.rejects(aiService.getDesign(id), { status })
  await assert.rejects(subscriptionService.getPlan(id), { status })
})
test('Customer offline fixture propagates failure on reads and mutations', async () => {
  handler = () => { throw new TypeError('offline') }
  for (const call of [() => orderService.createReview(id, { rating: 5 }), () => orderService.saveReview(id, { rating: 5 }, true), () => orderService.deleteReview(id), () => chatService.closeConversation(id), () => aiService.getDesign(id), () => subscriptionService.getPlan(id)]) await assert.rejects(call(), { status: 0 })
})

