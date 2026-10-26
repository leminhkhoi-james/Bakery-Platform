// Isolated HTTP fixtures through actual Vite routing. No backend mutations.
import assert from 'node:assert/strict'
import { before, beforeEach, after, test } from 'node:test'
import { createServer as httpServer } from 'node:http'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { createServer, loadConfigFromFile } from 'vite'
import { rfqService } from '../src/services/rfqService.js'
import { aiService } from '../src/services/aiService.js'
import { chatService } from '../src/services/chatService.js'
import { setAuthToken } from '../src/services/apiClient.js'
import { conversation } from './fixtures/chat.js'
import { customerId, bakeryId, requestId, offerId, jobId, designId, addressId, orderId, input, request, offerInput, offer, generation, detail, job, user, page, jobPage, png } from './fixtures/marketplace.js'

let vite, servers, origin, calls, currentRequest, currentOffer, currentJob, failure, empty, keys
const nativeFetch = globalThis.fetch
const respond = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ statusCode: status, message: status >= 400 ? 'Fixture rejected' : 'Fixture success', data })) }
async function fixture(service, req, res) {
  const chunks = []; for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks), url = new URL(req.url, 'http://fixture')
  const call = { service, path: url.pathname, query: url.searchParams, method: req.method, headers: req.headers, raw }
  calls.push(call)
  if (failure) return respond(res, failure, null)
  if (!req.headers.authorization || url.pathname.endsWith('/auth/refresh')) return respond(res, 401, null)
  const vendor = req.headers.authorization.includes('vendor'), json = raw.length && !req.headers['content-type']?.includes('multipart') ? JSON.parse(raw) : null
  call.json = json
  if (service === 'marketplace') {
    if (url.pathname === '/api/v1/cake-requests') {
      if (req.method === 'GET') return respond(res, 200, page(empty ? [] : [currentRequest], { page: Number(url.searchParams.get('page') || 1) }))
      if (vendor) return respond(res, 403, null)
      currentRequest = { ...currentRequest, ...json, status: 'DRAFT' }; return respond(res, 201, currentRequest)
    }
    if (url.pathname === '/api/v1/cake-requests/' + requestId) {
      if (req.method === 'PATCH') { if (currentRequest.status !== 'DRAFT' || vendor) return respond(res, 409, null); currentRequest = { ...currentRequest, ...json } }
      return respond(res, 200, currentRequest)
    }
    if (url.pathname.endsWith('/publish')) { if (currentRequest.status !== 'DRAFT') return respond(res, 409, null); currentRequest.status = 'OPEN'; return respond(res, 200, currentRequest) }
    if (url.pathname.endsWith('/cancel')) { currentRequest.status = 'CANCELLED'; return respond(res, 200, currentRequest) }
    if (url.pathname.endsWith('/images')) {
      call.form = await new Request('http://fixture', { method: 'POST', headers: req.headers, body: raw }).formData()
      currentRequest.images = [{ id: randomUUID(), url: 'https://fixture.invalid/rfq.png', displayOrder: 0 }]; return respond(res, 201, currentRequest.images)
    }
    if (/\/images\/[^/]+$/.test(url.pathname) && req.method === 'DELETE') { currentRequest.images = []; res.writeHead(204); return res.end() }
    if (url.pathname.endsWith('/selected-design')) { currentRequest.selectedDesignId = json.generatedDesignId; return respond(res, 200, currentRequest) }
    if (url.pathname === '/api/v1/offers') return respond(res, 200, page(empty ? [] : [currentOffer]))
    if (url.pathname.endsWith('/cake-requests/' + requestId + '/offers')) {
      if (!vendor) return respond(res, 403, null)
      if (currentRequest.status !== 'OPEN' || Date.parse(currentRequest.offerDeadline) < Date.now()) return respond(res, 409, null)
      currentOffer = { ...currentOffer, ...json, status: 'PENDING' }; return respond(res, 201, currentOffer)
    }
    if (url.pathname === '/api/v1/offers/' + offerId) {
      if (req.method === 'PATCH') { if (!vendor || currentOffer.status !== 'PENDING') return respond(res, 403, null); currentOffer = { ...currentOffer, ...json } }
      return respond(res, 200, currentOffer)
    }
    if (url.pathname.endsWith('/withdraw')) { if (!vendor) return respond(res, 403, null); currentOffer.status = 'WITHDRAWN'; return respond(res, 200, currentOffer) }
    if (url.pathname.endsWith('/accept')) {
      const key = req.headers['idempotency-key'], body = raw.toString(), previous = keys.get(key)
      if (previous && previous !== body) return respond(res, 409, null)
      if (!previous && (currentOffer.status !== 'PENDING' || Date.parse(currentOffer.expiresAt) < Date.now() || currentRequest.status !== 'OPEN')) return respond(res, 409, null)
      keys.set(key, body); currentOffer.status = 'ACCEPTED'; currentRequest.status = 'OFFER_SELECTED'
      return respond(res, 200, { offerId, cakeRequestId: requestId, orderId, orderNumber: 'FIXTURE-ONLY', offerStatus: 'ACCEPTED', requestStatus: 'OFFER_SELECTED' })
    }
  }
  if (service === 'ai') {
    if (url.pathname === '/api/v1/generation-jobs' && req.method === 'GET') return respond(res, 200, { ...jobPage(empty ? [] : [currentJob]), page: Number(url.searchParams.get('page') || 0) })
    if (url.pathname === '/api/v1/generation-jobs' && req.method === 'POST') {
      call.form = await new Request('http://fixture', { method: 'POST', headers: req.headers, body: raw }).formData()
      call.metadata = JSON.parse(await call.form.get('metadata').text())
      currentJob.status = 'SUCCEEDED' // fixture worker has finished; immutable 202 replay summary is still QUEUED
      return respond(res, 202, { ...currentJob, status: 'QUEUED' })
    }
    if (url.pathname.endsWith('/prompt-revisions')) return respond(res, 202, { ...currentJob, status: 'QUEUED' })
    if (url.pathname.endsWith('/cancel')) { currentJob.status = 'CANCELLED'; return respond(res, 200, currentJob) }
    if (url.pathname === '/api/v1/generation-jobs/' + jobId) return respond(res, 200, { ...detail, job: currentJob })
    if (url.pathname === '/api/v1/generated-designs/' + designId) return respond(res, 200, detail.generatedDesigns[0])
  }
  if (service === 'bakery' && url.pathname.endsWith('/add-ons')) return respond(res, 200, [])
  if (service === 'chat' && url.pathname === '/api/v1/conversations') {
    if (vendor || currentRequest.status === 'DRAFT' || json.cakeRequestId !== requestId || json.bakeryId !== bakeryId) return respond(res, 403, null)
    return respond(res, 201, { ...conversation, customerId, cakeRequestId: requestId, bakeryId, participants: [{ userId: customerId, participantType: 'CUSTOMER', joinedAt: '2026-10-26T00:00:00Z' }] })
  }
  return respond(res, 404, null)
}
before(async () => {
  servers = Object.fromEntries(['marketplace', 'ai', 'bakery', 'chat', 'identity'].map((service) => [service, httpServer((req, res) => { void fixture(service, req, res).catch(() => respond(res, 500, null)) })]))
  await Promise.all(Object.values(servers).map(async (server) => { server.listen(0, '127.0.0.1'); await once(server, 'listening') }))
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' })
  const proxy = Object.fromEntries(Object.entries(loaded.config.server.proxy).map(([pattern, options]) => {
    const service = /cake-requests|offers/.test(pattern) ? 'marketplace' : /generation-jobs|generated-designs/.test(pattern) ? 'ai' : /bakeries|products/.test(pattern) && !/subscription/.test(pattern) ? 'bakery' : /conversations/.test(pattern) ? 'chat' : /auth/.test(pattern) ? 'identity' : null
    return [pattern, service ? { ...options, target: 'http://127.0.0.1:' + servers[service].address().port } : options]
  }))
  vite = await createServer({ ...loaded.config, configFile: false, logLevel: 'error', server: { ...loaded.config.server, host: '127.0.0.1', port: 0, hmr: false, ws: false, proxy } })
  await vite.listen(); origin = 'http://127.0.0.1:' + vite.httpServer.address().port
  globalThis.fetch = (url, options) => nativeFetch(new URL(url, origin), options)
})
beforeEach(() => { currentRequest = structuredClone(request); currentOffer = structuredClone(offer); currentJob = structuredClone(job); failure = null; empty = false; calls = []; keys = new Map(); setAuthToken('customer-fixture') })
after(async () => { globalThis.fetch = nativeFetch; setAuthToken(null); await vite?.close(); await Promise.all(Object.values(servers || {}).map((server) => { server.closeAllConnections(); return new Promise((resolve) => server.close(resolve)) })) })

test('Proxy dispatch, JWT, real RFQ filters/page and empty lists have no fallback', async () => {
  const result = await rfqService.getRfqs({ scope: 'available', city: 'Fixture', district: 'District', page: 2, size: 12, sort: 'neededAt,asc', bakeryId })
  assert.equal(result.meta.page, 2); assert.equal(calls[0].service, 'marketplace'); assert.equal(calls[0].query.get('city'), 'Fixture'); assert.equal(calls[0].query.get('bakeryId'), null)
  assert.equal(calls[0].headers.authorization, 'Bearer customer-fixture')
  empty = true; assert.deepEqual((await rfqService.getRfqs()).result, []); assert.deepEqual((await rfqService.getOffers()).result, [])
  await rfqService.getAddOns(bakeryId); assert.equal(calls.at(-1).service, 'bakery')
})
test('RFQ DRAFT create, flat PATCH, publish conflicts, cancel and refreshed authoritative state', async () => {
  assert.equal((await rfqService.createRfq(input)).status, 'DRAFT')
  await rfqService.updateRfq(requestId, { ...input, title: 'Đã sửa fixture' }); assert.equal(calls.at(-1).json.changes, undefined)
  assert.equal((await rfqService.getRfqById(requestId)).title, 'Đã sửa fixture')
  await rfqService.publishRfq(requestId); assert.equal((await rfqService.getRfqById(requestId)).status, 'OPEN')
  await assert.rejects(() => rfqService.publishRfq(requestId), { status: 409 })
  await rfqService.cancelRfq(requestId, 'Fixture cancel'); assert.equal((await rfqService.getRfqById(requestId)).status, 'CANCELLED')
})
test('RFQ multipart files and delete are separate actions; selected design sends actual ID', async () => {
  await rfqService.uploadImages(requestId, [png()]); const call = calls.at(-1)
  assert.equal(call.form.getAll('files').length, 1); assert.equal(call.form.get('files').type, 'image/png')
  await rfqService.deleteImage(requestId, currentRequest.images[0].id); assert.equal((await rfqService.getRfqById(requestId)).images.length, 0)
  await rfqService.selectDesign(requestId, designId); assert.equal(calls.at(-1).json.generatedDesignId, designId)
})
test('Vendor submit/edit/withdraw uses exact offer fields; Customer cannot submit and expired RFQ conflicts', async () => {
  currentRequest.status = 'OPEN'
  await assert.rejects(() => rfqService.submitOffer(requestId, offerInput), { status: 403 })
  setAuthToken('vendor-fixture'); await rfqService.submitOffer(requestId, offerInput)
  await rfqService.updateOffer(offerId, { ...offerInput, message: 'Updated fixture', items: [] })
  assert.equal(calls.at(-1).json.bakeryId, undefined); assert.equal(calls.at(-1).json.changes, undefined)
  assert.equal((await rfqService.getOffer(offerId)).message, 'Updated fixture')
  await rfqService.withdrawOffer(offerId); assert.equal((await rfqService.getOffer(offerId)).status, 'WITHDRAWN')
  currentRequest.offerDeadline = '2000-01-01'; await assert.rejects(() => rfqService.submitOffer(requestId, offerInput), { status: 409 })
})
test('Accept missing address prevents HTTP; valid fixture workflow supports same-key replay/conflict without direct Order POST', async () => {
  currentRequest.status = 'OPEN'; const key = randomUUID()
  await assert.rejects(() => rfqService.acceptOffer(offerId, {}, key)); assert.equal(calls.length, 0)
  assert.equal((await rfqService.acceptOffer(offerId, { deliveryAddressId: addressId }, key)).orderId, orderId)
  assert.equal((await rfqService.acceptOffer(offerId, { deliveryAddressId: addressId }, key)).orderId, orderId)
  await assert.rejects(() => rfqService.acceptOffer(offerId, { deliveryAddressId: addressId, customerNote: 'Changed' }, key), { status: 409 })
  await assert.rejects(() => rfqService.acceptOffer(offerId, { deliveryAddressId: addressId }, randomUUID()), { status: 409 })
  assert.ok(calls.every((call) => !call.path.includes('/orders')))
})
test('Expired quote and closed RFQ refuse acceptance; no fabricated confirmed order', async () => {
  currentRequest.status = 'OPEN'; currentOffer.expiresAt = '2000-01-01'
  await assert.rejects(() => rfqService.acceptOffer(offerId, { deliveryAddressId: addressId }, randomUUID()), { status: 409 })
  currentOffer = structuredClone(offer); currentRequest.status = 'CLOSED'
  await assert.rejects(() => rfqService.acceptOffer(offerId, { deliveryAddressId: addressId }, randomUUID()), { status: 409 })
})
test('AI history is zero-based; multipart metadata/sourceImages and 202 require authoritative GET', async () => {
  assert.equal((await aiService.getJobs({ page: 1, cakeRequestId: requestId })).meta.page, 2); assert.equal(calls.at(-1).service, 'ai')
  const key = randomUUID(), accepted = await aiService.createGenerationJob(generation, [png()], key), call = calls.at(-1)
  assert.equal(accepted.status, 'QUEUED'); assert.equal(call.headers['idempotency-key'], key)
  assert.deepEqual(call.metadata, generation); assert.equal(call.form.get('metadata').type, 'application/json'); assert.equal(call.form.getAll('sourceImages').length, 1)
  assert.equal((await aiService.getGenerationJob(jobId, user)).job.status, 'SUCCEEDED')
  await aiService.reviseJob(jobId, generation, key); assert.equal(calls.at(-1).json.cakeRequestId, undefined)
  await aiService.cancelJob(jobId); assert.equal((await aiService.getGenerationJob(jobId, user)).job.status, 'CANCELLED')
  assert.equal((await aiService.getDesign(designId)).moderationStatus, 'APPROVED')
  empty = true; assert.deepEqual((await aiService.getJobs()).result, [])
})
test('Real Chat context uses RFQ/bakery IDs, refuses DRAFT, then returns actual conversation ID', async () => {
  const viewer = { userId: customerId, roles: ['CUSTOMER'] }
  await assert.rejects(() => chatService.createConversation({ cakeRequestId: requestId, bakeryId }, viewer), { status: 403 })
  currentRequest.status = 'OPEN'
  const result = await chatService.createConversation({ cakeRequestId: requestId, bakeryId }, viewer)
  assert.equal(result.id, conversation.id); assert.equal(calls.at(-1).service, 'chat')
  assert.deepEqual(calls.at(-1).json, { cakeRequestId: requestId, bakeryId })
})
for (const status of [400, 401, 403, 404, 409, 500]) test('RFQ/Offer/AI HTTP ' + status + ' propagates without mock fallback', async () => {
  failure = status
  await assert.rejects(() => rfqService.getRfqs(), { status }); setAuthToken('customer-fixture')
  await assert.rejects(() => rfqService.getOffer(offerId), { status }); setAuthToken('customer-fixture')
  await assert.rejects(() => aiService.getJobs(), { status })
})
test('Network loss never creates RFQ, quote, Order or generated images locally', async () => {
  globalThis.fetch = async () => { throw new TypeError('Fixture network disconnected') }
  try { await assert.rejects(() => rfqService.createRfq(input), { status: 0 }); await assert.rejects(() => aiService.createGenerationJob(generation, [], randomUUID()), { status: 0 }) } finally { globalThis.fetch = (url, options) => nativeFetch(new URL(url, origin), options) }
  assert.equal(calls.length, 0)
})
