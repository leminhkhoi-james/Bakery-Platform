import { reviewText } from './adminPresentation.js'
import { publicCopy } from './uiLabels.js'

export function paymentSenderName(payment, profile) {
  const member = payment.submittedByUserId && Array.isArray(profile?.members) ? profile.members.find((item) => item?.userId === payment.submittedByUserId) : null
  return reviewText(payment.submittedByName) || reviewText(member?.displayNameSnapshot) || reviewText(member?.displayName)
}

export function paymentReviewFacts(payment, order, profile, profileError) {
  const sender = paymentSenderName(payment, profile)
  const reference = reviewText(publicCopy(payment.paymentReference))
  const proof = typeof payment.proofUrl === 'string' && /^https?:\/\//i.test(payment.proofUrl) ? payment.proofUrl : null
  const missing = []
  const senderVerified = Array.isArray(profile?.members) && !profileError
  if (!sender && senderVerified) missing.push('tên người gửi')
  if (!reference) missing.push('mã giao dịch')
  if (!proof) missing.push('chứng từ đính kèm')
  const senderUnverified = !sender && !senderVerified
  let comparison = 'Chưa xác minh được thông tin đơn mua.'
  if (order) {
    if (payment.amount == null || order.totalAmount == null || !payment.currency || !order.currency) comparison = 'Chưa đủ số tiền hoặc tiền tệ để đối chiếu.'
    else if (!(payment.amount > 0)) comparison = 'Số tiền khai báo chưa hợp lệ.'
    else comparison = payment.amount === order.totalAmount && payment.currency === order.currency ? 'Số tiền và tiền tệ khớp đơn mua.' : 'Số tiền hoặc tiền tệ không khớp đơn mua.'
  }
  const identityMissing = missing.filter((field) => field !== 'chứng từ đính kèm')
  return { sender, reference, proof, comparison, senderUnverified, warning: missing.length ? 'Chưa cung cấp: ' + missing.join(', ') + '.' : null, identityWarning: identityMissing.length ? 'Chưa cung cấp: ' + identityMissing.join(', ') + '.' : null }
}
