import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bakeryReviewProfile, bakeryReviewText } from '../src/services/bakeryReviewModels.js'

const id = '11111111-1111-4111-8111-111111111111'
const address = { addressLine: '12 Lê Lợi', district: 'Quận 1', city: 'TP. Hồ Chí Minh', isPrimary: true }
const area = { city: 'TP. Hồ Chí Minh', district: 'Quận 3', active: true, deliveryFee: 0, minimumOrder: null }
const detail = (status, operations = {}) => ({ bakery: { id, status, operations }, members: [] })

test('Review hides punctuation, technical identifiers and unknown member names without inventing data', () => {
  for (const value of ['.', '  ', id, 'null', null, undefined]) assert.equal(bakeryReviewText(value), null)
  const profile = bakeryReviewProfile({ ...detail('PENDING_APPROVAL'), members: [{ userId: id, displayNameSnapshot: '.', memberRole: 'OWNER', status: 'ACTIVE' }] })
  assert.equal(profile.members[0].name, 'Chưa cung cấp')
  assert.equal(profile.subscription.state, 'unknown')
  assert.equal(profile.phone, 'Chưa cung cấp')
  assert.equal(profile.addresses.length, 0)
})

test('Main address and delivery area remain separate; approval requires explicit valid configuration', () => {
  const ready = bakeryReviewProfile(detail('PENDING_APPROVAL', { addresses: [address], serviceAreas: [area] }))
  assert.deepEqual(ready.missing, [])
  assert.equal(ready.actions[0].disabled, false)
  assert.match(ready.addresses[0].text, /Quận 1/)
  assert.match(ready.areas[0].text, /Quận 3/)
  assert.match(ready.areas[0].deliveryFee, /0/)
  assert.equal(ready.areas[0].minimumOrder, 'Chưa cung cấp')
  for (const invalid of [{ ...area, active: undefined }, { ...area, active: false }]) {
    const profile = bakeryReviewProfile(detail('PENDING_APPROVAL', { addresses: [address], serviceAreas: [invalid] }))
    assert.equal(profile.actions[0].disabled, true)
    assert.match(profile.actions[0].disabledReason, /khu vực giao hàng/)
  }
  const incomplete = bakeryReviewProfile(detail('PENDING_APPROVAL', { addresses: [{ ...address, addressLine: '.' }], serviceAreas: [area] }))
  assert.equal(incomplete.actions[0].disabled, false, 'Admin approval checks the primary flag; it does not add address-field requirements')
})

test('Only pending approval exposes approve/return; only active exposes close with acknowledgement', () => {
  assert.deepEqual(bakeryReviewProfile(detail('PENDING_APPROVAL')).actions.map((action) => action.key), ['ACTIVE', 'DRAFT'])
  const active = bakeryReviewProfile(detail('ACTIVE')).actions
  assert.deepEqual(active.map((action) => action.key), ['CLOSED'])
  assert.ok(active[0].confirmText)
  for (const status of ['DRAFT', 'SUSPENDED', 'CLOSED']) assert.deepEqual(bakeryReviewProfile(detail(status)).actions, [])
})

test('Explicit legacy primary flag is reused; subscription never becomes an approval prerequisite', () => {
  const { isPrimary, ...legacy } = address
  assert.equal(isPrimary, true)
  const profile = bakeryReviewProfile({ bakery: { id, status: 'PENDING_APPROVAL' }, operations: { addresses: [{ ...legacy, primary: true }], serviceAreas: [area] }, subscription: { active: false } })
  assert.equal(profile.addresses[0].primary, true)
  assert.equal(profile.subscription.state, 'inactive')
  assert.equal(profile.actions[0].disabled, false)
})

test('Complete legacy postal addresses do not repeat or append conflicting subdivisions', () => {
  const full = '45 Nguyễn Gia Trí, P. 25, Q. Bình Thạnh, TP. Hồ Chí Minh'
  const profile = bakeryReviewProfile(detail('ACTIVE', { addresses: [{ ...address, addressLine: full, ward: 'Bến Nghé' }] }))
  assert.equal(profile.addresses[0].text, full)
  const abbreviated = 'Bình Thạnh, TP. HCM'
  assert.equal(bakeryReviewProfile(detail('ACTIVE', { addresses: [{ ...address, addressLine: abbreviated }] })).addresses[0].text, abbreviated)
})

test('Subscription states distinguish unavailable, absent information, registration and entitlement', () => {
  const base = detail('PENDING_APPROVAL')
  assert.equal(bakeryReviewProfile(base).subscription.state, 'unknown')
  assert.equal(bakeryReviewProfile({ ...base, subscription: null }).subscription.state, 'error')
  assert.equal(bakeryReviewProfile({ ...base, subscription: { active: false } }).subscription.state, 'inactive')
  assert.equal(bakeryReviewProfile({ ...base, subscription: { active: false, registrationStatus: 'NOT_REGISTERED' } }).subscription.state, 'not_registered')
  assert.equal(bakeryReviewProfile({ ...base, subscription: { active: true, planCode: 'ARTISAN' } }).subscription.state, 'active')
})

test('Draft is not presented as returned without an explicit decision; missing or invalid data remains missing', () => {
  const draft = detail('DRAFT')
  assert.equal(bakeryReviewProfile(draft).returned, false)
  const returned = bakeryReviewProfile({ bakery: { ...draft.bakery, reviewDecision: { status: 'RETURNED', reason: 'Bổ sung địa chỉ.' } } })
  assert.equal(returned.returned, true); assert.equal(returned.returnReason, 'Bổ sung địa chỉ.')
  const invalid = bakeryReviewProfile({ bakery: { status: 'DRAFT', operations: { addresses: [null], serviceAreas: [null] } }, members: [null] })
  assert.deepEqual(invalid.addresses, []); assert.deepEqual(invalid.members, [])
  assert.equal(bakeryReviewText('Thành viên ' + id), null)
  assert.equal(bakeryReviewText('backend API error'), null)
})
test('Approval distinguishes unknown operations from known missing flags and matches only backend checks', () => {
  const unknown = bakeryReviewProfile({ bakery: { id, status: 'PENDING_APPROVAL' } })
  assert.deepEqual(unknown.checks.map((check) => check.passed), [null, null])
  assert.match(unknown.actions[0].disabledReason, /Chưa xác minh/)
  const missing = bakeryReviewProfile(detail('PENDING_APPROVAL', { addresses: [], serviceAreas: [] }))
  assert.deepEqual(missing.checks.map((check) => check.passed), [false, false])
  assert.doesNotMatch(missing.actions[0].disabledReason, /Chưa xác minh/)
  const backendReady = bakeryReviewProfile(detail('PENDING_APPROVAL', { addresses: [{ isPrimary: true }], serviceAreas: [{ active: true }] }))
  assert.equal(backendReady.actions[0].disabled, false)
  assert.equal(backendReady.description, null)
  const unknownFlag = bakeryReviewProfile(detail('PENDING_APPROVAL', { addresses: [address], serviceAreas: [{ city: 'Hà Nội' }] }))
  assert.equal(unknownFlag.checks[1].passed, null)
  assert.match(unknownFlag.actions[0].disabledReason, /Chưa xác minh/)
})
test('Description is mapped only from the supplied description, without substituting shop name or unrelated data', () => {
  const bakery = { id, status: 'DRAFT', name: 'Tiệm An', description: 'Bánh tươi làm theo đơn.', tagline: 'Không dùng làm mô tả thay thế' }
  assert.equal(bakeryReviewProfile({ bakery }).description, bakery.description)
  assert.equal(bakeryReviewProfile({ bakery: { ...bakery, description: '.' } }).description, null)
  assert.equal(bakery.description, 'Bánh tươi làm theo đơn.')
})
