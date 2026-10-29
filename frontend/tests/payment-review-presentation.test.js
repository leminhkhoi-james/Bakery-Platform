import assert from 'node:assert/strict'
import { test } from 'node:test'
import { paymentReviewFacts, paymentSenderName } from '../src/services/paymentReviewPresentation.js'
import { canApprovePayment } from '../src/services/publicationAdminService.js'

const payment = { id: 'a', subscriptionOrderId: 'order', status: 'SUBMITTED', amount: 399000, currency: 'VND' }
const order = { id: 'order', status: 'PAYMENT_REVIEW', totalAmount: 399000, currency: 'VND' }
test('Missing sender, reference and proof remain warnings, without adding new approval requirements', () => {
  const before = structuredClone(payment), facts = paymentReviewFacts(payment, order, { members: [] })
  assert.equal(facts.proof, null); assert.equal(facts.sender, null)
  assert.match(facts.warning, /tên người gửi, mã giao dịch, chứng từ đính kèm/)
  assert.doesNotMatch(facts.identityWarning, /chứng từ/)
  assert.equal(canApprovePayment(payment, order), true)
  assert.deepEqual(payment, before)
})
test('Unverified profiles are distinct from known missing information and invalid proof URLs never become links', () => {
  const unknown = paymentReviewFacts(payment, null, null, new Error('Unavailable'))
  assert.equal(unknown.senderUnverified, true); assert.doesNotMatch(unknown.warning, /tên người gửi/)
  assert.match(unknown.comparison, /Chưa xác minh/)
  for (const proofUrl of ['javascript:alert(1)', '.', '', null]) assert.equal(paymentReviewFacts({ ...payment, proofUrl }, order).proof, null)
  const complete = paymentReviewFacts({ ...payment, submittedByName: 'Nguyễn An', paymentReference: 'CK-123', proofUrl: 'https://example.test/proof' }, order)
  assert.equal(complete.sender, 'Nguyễn An'); assert.equal(complete.warning, null); assert.ok(complete.proof)
})
test('Money comparison reports missing or mismatched values without claiming a bank transfer is verified', () => {
  assert.match(paymentReviewFacts(payment, order).comparison, /khớp đơn mua/)
  assert.match(paymentReviewFacts({ ...payment, amount: null }, order).comparison, /Chưa đủ/)
  assert.match(paymentReviewFacts({ ...payment, amount: 200000 }, order).comparison, /không khớp/)
  assert.equal(canApprovePayment({ ...payment, amount: 200000 }, order), false)
})

test('Sender mapping requires an actual matching user reference and never guesses the shop owner', () => {
  const profile = { members: [{ displayName: 'Không được đoán tên' }, { userId: 'owner', displayName: 'Nguyễn An' }] }
  assert.equal(paymentSenderName(payment, profile), null)
  assert.equal(paymentSenderName({ ...payment, submittedByUserId: 'owner' }, profile), 'Nguyễn An')
})
