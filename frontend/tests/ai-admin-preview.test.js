import test from 'node:test'
import assert from 'node:assert/strict'
import { mapDesign, mapJobDetail } from '../src/services/aiModels.js'

const id = '8ea3b7ba-2373-4081-b04a-fb0bae68a36a'
const job = 'c23461c8-96ac-4121-8494-5cf2c361fc72'
const owner = 'a1100001-0000-4000-8000-000000000011'
const rfq = '9aebe2f8-4869-4575-81fa-bf0a97f1195d'
const design = { id, generationJobId: job, moderationStatus: 'PENDING',
  imageUrl: 'https://storage.example.invalid/private-preview', thumbnailUrl: null }

test('Admin preview retains a server-authorized PENDING URL; default/customer and rejected media stay hidden', () => {
  assert.equal(mapDesign(design, { adminPreview: true }).imageUrl, design.imageUrl)
  assert.equal(mapDesign(design).imageUrl, null)
  assert.equal(mapDesign({ ...design, moderationStatus: 'REJECTED' }, { adminPreview: true }).imageUrl, null)
  assert.equal(mapDesign({ ...design, imageUrl: null }, { adminPreview: true }).imageUrl, null)
  assert.equal(mapDesign({ ...design, imageUrl: 'javascript:alert(1)' }, { adminPreview: true }).imageUrl, null)
})

test('Job detail allows pending preview only in the Admin view', () => {
  const detail = { job: { id: job, customerId: owner, cakeRequestId: rfq },
    promptRevisions: [], sourceImages: [], generatedDesigns: [design] }
  assert.equal(mapJobDetail(detail, { id: owner, roles: ['CUSTOMER'] }).generatedDesigns[0].imageUrl, null)
  assert.equal(mapJobDetail(detail, { id: owner, roles: ['ADMIN'] }).generatedDesigns[0].imageUrl, design.imageUrl)
})
