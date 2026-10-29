import { publicationAdminService } from './publicationAdminService.js'
import { isMockRecord } from '../mockData/runtime.js'
import { ApiError } from './apiClient.js'

export async function paymentContext(payment, options = {}) {
  const order = await publicationAdminService.getOrder(payment.subscriptionOrderId, options)
  if (isMockRecord(payment.id) !== isMockRecord(order.id)) throw new ApiError('Chưa thể đối chiếu đúng đơn mua gói.', 502)
  let profile = null, profileError = null
  try { profile = await publicationAdminService.getBakery(order.bakeryId, options) } catch (error) { if (options.signal?.aborted) throw error; profileError = error }
  return { order, profile, profileError }
}
export async function loadPaymentContext({ payment }, options) { return paymentContext(payment, options) }
export async function loadPaymentDirectory(params = {}, options = {}) {
  const data = await publicationAdminService.getPayments(params, options)
  const cache = new Map()
  const result = await Promise.all(data.result.map(async (payment) => {
    if (!cache.has(payment.subscriptionOrderId)) cache.set(payment.subscriptionOrderId, paymentContext(payment, options))
    try { return { ...payment, context: await cache.get(payment.subscriptionOrderId) } }
    catch (contextError) { if (options.signal?.aborted) throw contextError; return { ...payment, contextError } }
  }))
  return { ...data, result }
}
