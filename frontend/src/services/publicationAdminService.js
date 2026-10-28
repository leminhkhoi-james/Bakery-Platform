import { api, ApiError } from './apiClient.js'
import { catalogQuery, isCatalogId } from './catalogModels.js'
import { requireId, requireText, mapPage } from './managementModels.js'
import { mapSubscriptionOrder } from './subscriptionModels.js'

export const BAKERY_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'CLOSED']
export const bakeryTransitions = (status) => ({ DRAFT: ['CLOSED'], PENDING_APPROVAL: ['ACTIVE', 'DRAFT', 'CLOSED'], ACTIVE: ['SUSPENDED', 'CLOSED'], SUSPENDED: ['ACTIVE', 'CLOSED'], CLOSED: [] }[status] || [])
export function mapAdminBakery(dto) {
  if (!dto?.id || !BAKERY_STATUSES.includes(dto.status)) throw new ApiError('BakeryDto quản trị không hợp lệ.', 502)
  requireId(dto.id)
  return { ...dto }
}
export function mapBakeryPayment(dto) {
  if (!dto?.id || !dto.subscriptionOrderId || !['SUBMITTED', 'APPROVED', 'REJECTED'].includes(dto.status)) throw new ApiError('BakeryPaymentDto không hợp lệ.', 502)
  requireId(dto.id); requireId(dto.subscriptionOrderId)
  const amount = dto.amount === null || dto.amount === undefined || String(dto.amount).trim() === '' ? null : Number(dto.amount)
  return { ...dto, amount: Number.isFinite(amount) ? amount : null }
}
export function canReviewPayment(payment, order) {
  return payment?.status === 'SUBMITTED' && order?.id === payment.subscriptionOrderId && order?.status === 'PAYMENT_REVIEW'
}
export function canApprovePayment(payment, order) {
  return canReviewPayment(payment, order) && payment.amount > 0 && payment.amount === order.totalAmount && Boolean(payment.currency) && payment.currency === order.currency
}
export const publicationAdminService = {
  async getBakeries(params = {}, options = {}) {
    return mapPage(await api.get('/admin/bakeries' + catalogQuery(params, ['status', 'query', 'city', 'page', 'size', 'sort']), options), mapAdminBakery)
  },
  async getBakery(id, options = {}) {
    const data = await api.get('/admin/bakeries/' + requireId(id), options)
    const bakery = mapAdminBakery(data?.bakery)
    if (bakery.id.toLowerCase() !== id.toLowerCase()) throw new ApiError('Hồ sơ trả về sai tiệm.', 502)
    return { ...data, bakery }
  },
  async changeBakeryStatus(bakery, status) {
    if (!bakeryTransitions(bakery?.status).includes(status)) throw new ApiError('Chuyển trạng thái tiệm không hợp lệ. Hãy tải lại.', 409)
    const result = mapAdminBakery(await api.patch('/admin/bakeries/' + requireId(bakery.id) + '/status', { status }))
    if (result.id !== bakery.id || result.status !== status) throw new ApiError('Backend chưa xác nhận đúng tiệm/trạng thái yêu cầu.', 502)
    return result
  },
  async getPayments(params = {}, options = {}) {
    if (params.bakeryId) requireId(params.bakeryId, 'Tiệm bánh')
    return mapPage(await api.get('/admin/bakery-payments' + catalogQuery(params, ['status', 'bakeryId', 'submittedFrom', 'submittedTo', 'page', 'size', 'sort']), options), mapBakeryPayment)
  },
  async getOrder(id, options = {}) {
    const order = mapSubscriptionOrder(await api.get('/subscription-orders/' + requireId(id), options))
    if (order.id.toLowerCase() !== id.toLowerCase()) throw new ApiError('Response trả về sai đơn mua gói.', 502)
    return order
  },
  async reviewPayment(payment, order, action, reviewNote, key) {
    if (!['approve', 'reject'].includes(action)) throw new ApiError('Thao tác không hợp lệ.', 400)
    if (!canReviewPayment(payment, order)) throw new ApiError('Chứng từ hoặc đơn mua gói không còn chờ duyệt.', 409)
    if (action === 'approve' && !canApprovePayment(payment, order)) throw new ApiError('Số tiền/tiền tệ chứng từ không khớp đơn mua gói.', 422)
    const note = action === 'reject' ? requireText(reviewNote, 'Lý do từ chối') : (reviewNote?.trim() || null)
    const headers = action === 'approve' ? { 'Idempotency-Key': requireId(key, 'Khóa duyệt thanh toán') } : {}
    const data = await api.post('/admin/bakery-payments/' + requireId(payment.id) + '/' + action, { reviewNote: note }, { headers })
    const result = { payment: mapBakeryPayment(data?.payment), order: mapSubscriptionOrder(data?.order), subscription: data?.subscription ?? null }
    const approved = action === 'approve'
    if (result.payment.id !== payment.id || result.payment.subscriptionOrderId !== order.id || result.order.id !== order.id || result.order.bakeryId !== order.bakeryId ||
        result.payment.status !== (approved ? 'APPROVED' : 'REJECTED') || !(approved ? ['COMPLETED'] : ['PENDING_PAYMENT', 'EXPIRED']).includes(result.order.status) ||
        (approved ? !isCatalogId(result.subscription?.id) || !['ACTIVE', 'SCHEDULED', 'EXPIRED', 'CANCELLED'].includes(result.subscription?.status) : result.subscription !== null)) {
      throw new ApiError('Response duyệt thanh toán chưa xác nhận đúng giao dịch và kỳ dịch vụ.', 502)
    }
    return result
  },
}
export const loadAdminBakeries = (params, options) => publicationAdminService.getBakeries(params, options)
export const loadAdminBakery = ({ id }, options) => publicationAdminService.getBakery(id, options)
export const loadAdminPayments = (params, options) => publicationAdminService.getPayments(params, options)
export const loadAdminOrder = ({ id }, options) => publicationAdminService.getOrder(id, options)
