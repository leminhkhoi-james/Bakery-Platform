import { api, ApiError } from './apiClient.js'
import { catalogQuery } from './catalogModels.js'
import { mapPage, requireId } from './managementModels.js'
import { mapSubscriptionOrder } from './subscriptionModels.js'
import { publicationAdminService, mapBakeryPayment, canApprovePayment } from './publicationAdminService.js'
import { paymentDateRange } from './adminFilterModels.js'

export const ADMIN_ORDER_STATUSES = ['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'REJECTED']
const REASONS = {
  READY_FOR_REVIEW: 'Đủ điều kiện đối chiếu để duyệt',
  WAITING_PAYMENT: 'Chờ khách thanh toán',
  COMPLETED: 'Đã thanh toán, không cần duyệt lại',
  EXPIRED: 'Đơn đã hết hạn thanh toán',
  CANCELLED: 'Đơn đã hủy',
  REJECTED: 'Đơn đã bị từ chối',
  NO_SUBMITTED_PAYMENT: 'Chưa ghi nhận giao dịch thanh toán',
  PAYMENT_MISMATCH: 'Giao dịch chưa khớp số tiền, tiền tệ hoặc phương thức',
}
export const orderApprovalLabel = row => REASONS[row?.eligibilityReason] || 'Chưa xác định được điều kiện duyệt'

export function mapAdminSubscriptionOrder(dto) {
  const order = mapSubscriptionOrder(dto?.order)
  if (!ADMIN_ORDER_STATUSES.includes(order.status) || !Array.isArray(dto.payments)
      || typeof dto.eligibleForApproval !== 'boolean' || !REASONS[dto.eligibilityReason]) {
    throw new ApiError('Danh sách đơn mua gói quản trị không hợp lệ.', 502)
  }
  const payments = dto.payments.map(mapBakeryPayment)
  if (payments.some(payment => payment.subscriptionOrderId !== order.id)) throw new ApiError('Chứng từ trả về sai đơn mua gói.', 502)
  const candidate = payments.find(payment => payment.id === dto.reviewPaymentId)
  if (dto.eligibleForApproval && (!candidate || candidate.paymentMethod?.toUpperCase() === 'VNPAY'
      || dto.eligibilityReason !== 'READY_FOR_REVIEW' || !canApprovePayment(candidate, order))) {
    throw new ApiError('Điều kiện duyệt trả về không khớp chứng từ.', 502)
  }
  if (!dto.eligibleForApproval && (dto.reviewPaymentId || dto.eligibilityReason === 'READY_FOR_REVIEW')) {
    throw new ApiError('Điều kiện duyệt chưa nhất quán.', 502)
  }
  return { order, payments, eligibleForApproval: dto.eligibleForApproval,
    eligibilityReason: dto.eligibilityReason, reviewPaymentId: dto.reviewPaymentId || null }
}

export function adminOrderDateRange(from, to) {
  const dates = paymentDateRange(from, to)
  return { ...(dates.submittedFrom ? { createdFrom: dates.submittedFrom } : {}),
    ...(dates.submittedTo ? { createdTo: dates.submittedTo } : {}) }
}

export async function loadAdminSubscriptionOrders(params = {}, options = {}) {
  if (params.bakeryId) requireId(params.bakeryId)
  const response = await api.get('/admin/subscription-orders' + catalogQuery(params,
    ['page', 'size', 'status', 'query', 'bakeryId', 'createdFrom', 'createdTo', 'eligibleForApproval']),
  { ...options, allowMockFallback: false })
  const data = mapPage(response, mapAdminSubscriptionOrder)
  const profiles = new Map()
  const result = await Promise.all(data.result.map(async row => {
    const bakeryId = row.order.bakeryId
    if (!profiles.has(bakeryId)) profiles.set(bakeryId, publicationAdminService.getBakery(bakeryId, options)
      .then(profile => ({ profile }), error => {
        if (options.signal?.aborted) throw error
        return { profile: null, profileError: error }
      }))
    return { ...row, ...await profiles.get(bakeryId) }
  }))
  return { ...data, result }
}

export const loadAdminSubscriptionOrderDetail = ({ orderId }, options) => publicationAdminService.getOrder(orderId, options)
