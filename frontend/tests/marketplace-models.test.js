import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { rfqPayload, offerPayload, mapRequest, mapOffer, mapMarketplacePage, editableRequest, requestAcceptsOffers, acceptableOffer, pendingOffer, decimalMoney } from '../src/services/marketplaceModels.js'
import { generationPayload, generationKey, mapJobPage, mapJobDetail, mapDesign, runningJob } from '../src/services/aiModels.js'
import { validateReferenceImages } from '../src/services/marketplaceFiles.js'
import { canAccess } from '../src/routes/routeAccess.js'
import { memberCanEdit } from '../src/services/managementModels.js'
import { input, request, offerInput, offer, user, detail, design, jobPage, page, png, generation } from './fixtures/marketplace.js'

test('RFQ create whitelist never sends status, totals, selected design or customer identity', () => {
  const body = rfqPayload({ ...input, status: 'OPEN', customerId: randomUUID(), totalPrice: 1, selectedDesignId: randomUUID() })
  assert.equal(body.title, input.title); assert.equal(body.budgetMin, 100000)
  for (const key of ['status', 'customerId', 'totalPrice', 'selectedDesignId']) assert.equal(body[key], undefined)
})
for (const change of [{ title: '' }, { description: '' }, { budgetMin: -1 }, { budgetMin: 600000 }, { budgetMax: '0.001' }, { neededAt: '2020-01-01' }, { offerDeadline: '2099-04-01' }, { servingSize: 1.2 }, { requestType: 'DEMO' }, { optionSelections: {} }, { targetBakeryId: randomUUID() }, { requestType: 'TARGETED_PRODUCT_CUSTOM' }]) test('RFQ validation rejects ' + JSON.stringify(change), () => assert.throws(() => rfqPayload({ ...input, ...change })))
test('Targeted request requires real option IDs; quantities and preference lengths validated', () => {
  const body = rfqPayload({ ...input, requestType: 'TARGETED_PRODUCT_CUSTOM', targetBakeryId: randomUUID(), baseProductId: randomUUID(), optionSelections: [{ optionGroupId: randomUUID(), optionValueId: randomUUID(), quantity: 1 }] })
  assert.equal(body.optionSelections.length, 1)
  assert.throws(() => rfqPayload({ ...input, preference: { flavor: 'x'.repeat(121) } }))
  assert.throws(() => decimalMoney('10000000000', 'Price'))
})
test('Offer payload uses backend-computed add-on totals and PATCH omits bakeryId', () => {
  const body = offerPayload({ ...offerInput, totalPrice: 1, status: 'ACCEPTED', items: [{ ...offerInput.items[0], unitPrice: 1 }] })
  assert.deepEqual(body.items, offerInput.items); assert.equal(body.totalPrice, undefined); assert.equal(body.status, undefined)
  assert.equal(offerPayload(offerInput, false).bakeryId, undefined)
  assert.throws(() => offerPayload({ ...offerInput, items: {} })); assert.throws(() => offerPayload({ ...offerInput, expiresAt: '2000-01-01' }))
})
test('RFQ/Offer exact DTO, nullable data and one-based pagination; no display fields invented', () => {
  assert.equal(mapRequest({ id: request.id }).customerId, null)
  assert.equal(mapRequest(request, true).preference.allergyNotes, input.preference.allergyNotes)
  assert.equal(mapOffer(offer, true).totalPrice, 220000); assert.equal(mapOffer(offer).rating, undefined)
  assert.equal(mapOffer({ id: offer.id, bakeryId: offer.bakeryId, cakeRequestId: request.id }).totalPrice, null)
  assert.deepEqual(mapMarketplacePage(page([]), mapRequest).result, [])
  assert.equal(mapMarketplacePage(page([request], { page: 2, pages: 3, total: 30 }), mapRequest).meta.page, 2)
  assert.throws(() => mapRequest({ ...request, images: null }, true)); assert.throws(() => mapOffer({ ...offer, items: null }, true))
  assert.throws(() => mapMarketplacePage({ result: [], meta: { page: 0 } }, mapRequest))
})
test('Ownership/roles, closed/expired submission and accept rules match backend', () => {
  assert.ok(editableRequest(request, user)); assert.ok(!editableRequest({ ...request, status: 'OPEN' }, user))
  assert.ok(!editableRequest(request, { ...user, id: randomUUID() }))
  const open = { ...request, status: 'OPEN', offerDeadline: '2000-01-01' }
  assert.ok(!requestAcceptsOffers(open)); assert.ok(acceptableOffer(offer, open, user))
  assert.ok(!acceptableOffer({ ...offer, expiresAt: '2000-01-01' }, open, user))
  assert.ok(!acceptableOffer(offer, { ...open, status: 'CLOSED' }, user)); assert.ok(!pendingOffer({ ...offer, status: 'ACCEPTED' }))
  for (const route of ['rfqs', 'rfq-new', 'request-detail', 'bidding', 'baker-quote', 'ai-studio']) { assert.ok(canAccess(route, user)); assert.ok(!canAccess(route, null)); assert.ok(!canAccess(route, { ...user, roles: ['BAKERY_OWNER'] })) }
  assert.ok(memberCanEdit({ memberRole: 'OWNER', status: 'ACTIVE' }, ['BAKERY_OWNER']))
  assert.ok(!memberCanEdit({ memberRole: 'INVALID', status: 'ACTIVE' }, ['BAKERY_OWNER']))
})
test('AI uses zero-based JobPage and nested JobDetail with ownership checks', () => {
  assert.equal(mapJobPage(jobPage([])).meta.page, 1); assert.equal(mapJobPage({ ...jobPage([]), page: 2 }).meta.page, 3)
  assert.equal(mapJobDetail(detail, user).job.status, 'SUCCEEDED')
  assert.throws(() => mapJobDetail(detail, { ...user, id: randomUUID() }), (error) => error.status === 403)
  assert.throws(() => mapJobDetail(detail.job)); assert.throws(() => mapJobPage(page([])))
  assert.deepEqual(generationPayload(generation), generation)
  assert.throws(() => generationPayload({ ...generation, generationParameters: { numberOfDesigns: 5 } }))
  assert.throws(() => generationKey('')); assert.ok(runningJob('QUEUED')); assert.ok(!runningJob('SUCCEEDED'))
})
test('Only APPROVED designs expose safe signed URLs; SUCCEEDED alone never grants moderation', () => {
  assert.equal(mapDesign(design).imageUrl, design.imageUrl)
  for (const moderationStatus of ['PENDING', 'REJECTED', null]) assert.equal(mapDesign({ ...design, moderationStatus }).imageUrl, null)
  assert.equal(mapDesign({ ...design, imageUrl: 'javascript:alert(1)' }).imageUrl, null)
})
test('Reference images validate count/size/type/magic for RFQ and AI', async () => {
  await validateReferenceImages([png()], 10); await validateReferenceImages([], 5, true)
  for (const files of [[], Array(11).fill(png()), [new File(['fake'], 'fake.png', { type: 'image/png' })], [new File(['x'], 'x.pdf', { type: 'application/pdf' })], [new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })]]) await assert.rejects(() => validateReferenceImages(files, 10))
})
