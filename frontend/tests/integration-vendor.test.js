import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { vendorCatalogService as service, loadProductSnapshot } from '../src/services/vendorCatalogService.js'
import { vendorManagementService } from '../src/services/vendorManagementService.js'
import { catalogEntityPayload, canManageEntity, optionsPayload, mapOptions } from '../src/services/vendorCatalogModels.js'
import { setAuthToken } from '../src/services/apiClient.js'
const bakeryId = randomUUID(), id = randomUUID(), userId = randomUUID(), groupId = randomUUID(), valueId = randomUUID()
const nativeFetch = globalThis.fetch, reply = (data, status = 200) => status === 204 ? new Response(null, { status }) : Response.json({ data, statusCode: status, message: 'HTTP fixture only' }, { status })
let handler, calls
beforeEach(() => { calls = []; setAuthToken('fixture-vendor'); handler = () => reply(null, 500); globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options) } })
after(() => { globalThis.fetch = nativeFetch; setAuthToken(null) })
const category = { id, name: 'Category', slug: 'category', displayOrder: 2, active: true }
const addon = { id, name: 'Add-on', category: 'Candles', price: '12000', description: 'Fixture', active: true }
const member = { id, userId, memberRole: 'OWNER', status: 'ACTIVE' }
const options = { groups: [{ id: groupId, name: 'Flavor', selectionType: 'SINGLE', required: true, minimumSelections: 1, maximumSelections: 1, displayOrder: 0, values: [{ id: valueId, name: 'Vanilla', description: '', priceAdjustment: '-1000', active: true, displayOrder: 0 }] }] }
for (const [kind, dto] of [['categories', category], ['add-ons', addon]]) test('Vendor ' + kind + ' list/create/patch/delete send exact endpoint/DTO and map response', async () => {
  handler = () => reply([dto]); assert.equal((await service.list(bakeryId, kind))[0].id, id)
  handler = () => reply(dto)
  const created = await service.save(bakeryId, kind, null, { ...dto, joinedAt: 'do-not-send', displayNameSnapshot: 'read-only' })
  assert.equal(created.id, id); let call = calls.at(-1)
  assert.equal(call.options.method, 'POST'); assert.equal(call.url, '/api/v1/bakeries/' + bakeryId + '/' + kind)
  const body = JSON.parse(call.options.body); assert.equal(body.id, undefined); assert.equal(body.joinedAt, undefined)
  if (kind === 'add-ons') assert.equal(body.price, 12000)
  await service.save(bakeryId, kind, id, dto); call = calls.at(-1); assert.equal(call.options.method, 'PATCH'); assert.ok(call.url.endsWith('/' + id))
  handler = () => reply(null, 204); await service.remove(bakeryId, kind, id); assert.equal(calls.at(-1).options.method, 'DELETE')
})
test('Add-on image uses file multipart, Bearer and backend MediaResponse', async () => {
  handler = () => reply({ url: 'http://fixture.invalid/addon.png', expiresAt: '2099-01-01T00:00:00Z' }, 201)
  const result = await service.uploadAddOn(bakeryId, id, new File(['fixture'], 'image.png', { type: 'image/png' }))
  assert.match(result.url, /addon.png/); const call = calls[0]
  assert.equal(call.options.headers.get('Authorization'), 'Bearer fixture-vendor'); assert.equal(call.options.headers.has('Content-Type'), false)
  assert.equal(call.options.body.get('file').name, 'image.png'); assert.equal(call.url, '/api/v1/bakeries/' + bakeryId + '/add-ons/' + id + '/image')
})
test('Options PUT preserves real IDs and signed negative adjustment, returns authoritative snapshot', async () => {
  handler = () => reply({ groups: options.groups.map((group) => ({ ...group, values: group.values.map((value) => ({ ...value, priceAdjustment: -1000 })) })) })
  const result = await service.saveOptions(bakeryId, id, options)
  assert.equal(result.groups[0].id, groupId); assert.equal(result.groups[0].values[0].priceAdjustment, -1000)
  assert.equal(calls[0].options.method, 'PUT'); assert.ok(calls[0].url.endsWith('/products/' + id + '/options'))
  assert.deepEqual(JSON.parse(calls[0].options.body), optionsPayload(options))
  await assert.rejects(service.saveOptions(bakeryId, id, null), { status: 400 })
  assert.throws(() => mapOptions({ groups: [{ name: 'missing IDs' }] }), { status: 502 })
})
test('Media upload maps primaryIndex query and JSON displayOrder part; image DELETE uses real ID', async () => {
  handler = () => reply([{ id, primary: true, displayOrder: 4 }], 201)
  await vendorManagementService.uploadProductImages(bakeryId, id, [new File(['fixture'], 'image.png', { type: 'image/png' })], { primaryIndex: 0, displayOrder: [4] })
  const call = calls[0]; assert.equal(call.options.method, 'POST'); assert.ok(call.url.endsWith('/images?primaryIndex=0'))
  assert.equal(call.options.headers.has('Content-Type'), false); assert.deepEqual(JSON.parse(await call.options.body.get('displayOrder').text()), [4])
  handler = () => reply(null, 204); await service.deleteImage(bakeryId, id, valueId)
  assert.ok(calls.at(-1).url.endsWith('/images/' + valueId)); assert.equal(calls.at(-1).options.method, 'DELETE')
  await assert.rejects(vendorManagementService.uploadProductImages(bakeryId, id, [new File(['x'], 'image.png', { type: 'image/png' })], { primaryIndex: 1 }), { status: 400 })
})
test('Snapshot read verifies product/bakery; fresh form never invents a GET/PUT backend response', async () => {
  assert.equal(await loadProductSnapshot({ bakeryId, productId: id, fresh: true }), null); assert.equal(calls.length, 0)
  handler = () => reply({ product: { id }, bakeryId, images: [], options })
  assert.equal((await service.getProductSnapshot(bakeryId, id)).options.groups[0].id, groupId)
  assert.equal(calls[0].options.headers.has('Authorization'), false)
  handler = () => reply({ product: { id }, bakeryId: randomUUID(), images: [], options }); await assert.rejects(service.getProductSnapshot(bakeryId, id), { status: 502 })
})
test('Only active owner can edit catalog; membership is read-only', async () => {
  const owner = { id, memberRole: 'OWNER', status: 'ACTIVE' }, roles = ['BAKERY_OWNER']
  assert.equal(canManageEntity(owner, roles, 'categories'), true)
  assert.equal(canManageEntity(owner, ['CUSTOMER'], 'categories'), false)
  assert.equal(canManageEntity({ ...owner, status: 'INACTIVE' }, roles, 'categories'), false)
  assert.equal(canManageEntity(owner, roles, 'members'), false)
  handler = () => reply([member])
  assert.equal((await service.list(bakeryId, 'members'))[0].memberRole, 'OWNER')
  await assert.rejects(service.save(bakeryId, 'members', null, member), { status: 403 })
  assert.throws(() => service.remove(bakeryId, 'members', id), { status: 403 })
  assert.equal(calls.length, 1)
})
test('Validation strips read-only fields; no OWNER assignment or invalid mutable data before HTTP', () => {
  for (const [kind, input] of [['members', { userId, memberRole: 'OWNER' }], ['add-ons', { ...addon, category: '' }], ['categories', { ...category, displayOrder: -1 }]]) assert.throws(() => catalogEntityPayload(kind, input, true))
  assert.throws(() => optionsPayload({ groups: [{ ...options.groups[0], selectionType: 'SINGLE', maximumSelections: 2 }] }), { status: 422 })
  assert.equal(calls.length, 0)
})
for (const status of [400, 401, 403, 404, 409, 422, 500, 503]) test('Every new Vendor endpoint propagates HTTP ' + status + ' without mutation or empty fallback', async () => {
  handler = () => reply(null, status)
  for (const [kind, dto] of [['categories', category], ['add-ons', addon]]) {
    await assert.rejects(service.list(bakeryId, kind), { status })
    await assert.rejects(service.save(bakeryId, kind, null, dto), { status })
    await assert.rejects(service.save(bakeryId, kind, id, dto), { status })
    await assert.rejects(service.remove(bakeryId, kind, id), { status })
  }
  await assert.rejects(service.saveOptions(bakeryId, id, options), { status })
  await assert.rejects(service.deleteImage(bakeryId, id, valueId), { status })
  await assert.rejects(service.uploadAddOn(bakeryId, id, new File(['x'], 'x.png', { type: 'image/png' })), { status })
  await assert.rejects(vendorManagementService.uploadProductImages(bakeryId, id, [new File(['x'], 'x.png', { type: 'image/png' })], { primaryIndex: 0, displayOrder: [0] }), { status })
})
test('Vendor offline fixture does not resolve reads or writes to mocks', async () => {
  handler = () => { throw new TypeError('offline') }
  await assert.rejects(service.list(bakeryId, 'categories'), { status: 0 })
  await assert.rejects(service.save(bakeryId, 'add-ons', null, addon), { status: 0 })
  await assert.rejects(service.saveOptions(bakeryId, id, options), { status: 0 })
  await assert.rejects(service.deleteImage(bakeryId, id, valueId), { status: 0 })
})


test('New product editor cannot assume an empty initial asset snapshot from an unexpected create status', async () => {
  const { vendorManagementService } = await import('../src/services/vendorManagementService.js')
  handler = () => reply({ id, name: 'Existing', status: 'PUBLISHED' })
  await assert.rejects(vendorManagementService.saveProduct(bakeryId, null, { name: 'New', slug: 'new-product', basePrice: 1 }), { status: 502 })
})
