import { ApiError } from './apiClient.js'

export const isSubscriptionId = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
export function requireSubscriptionId(value, label = 'Mã dữ liệu') {
  if (!isSubscriptionId(value)) throw new ApiError(label + ' phải là UUID hợp lệ.', 400)
  return value
}
const record = (value) => value && typeof value === 'object' && !Array.isArray(value)
const amount = (value) => ['number', 'string'].includes(typeof value) && String(value).trim() && Number.isFinite(Number(value)) ? Number(value) : null
const text = (value) => typeof value === 'string' && value.trim() ? value : null
const period = (value) => {
  if (value === null || value === undefined) return null
  if (!record(value) || !isSubscriptionId(value.id)) throw new ApiError('Dữ liệu kỳ dịch vụ không hợp lệ.', 502)
  return { id: value.id, planId: text(value.planId), planCode: text(value.planCode), status: text(value.status), periodStart: text(value.periodStart), periodEnd: text(value.periodEnd) }
}
const features = (value) => {
  if (value === null || value === undefined) return {}
  if (!record(value) || Object.values(value).some((item) => typeof item !== 'string')) throw new ApiError('Dữ liệu tính năng gói không hợp lệ.', 502)
  return { ...value }
}

export function mapSubscriptionPlan(dto) {
  if (!record(dto) || !isSubscriptionId(dto.id)) throw new ApiError('Dữ liệu gói dịch vụ không hợp lệ.', 502)
  return {
    id: dto.id, code: text(dto.code), name: text(dto.name), description: text(dto.description),
    monthlyPrice: amount(dto.monthlyPrice), currency: text(dto.currency),
    billingPeriodMonths: Number.isInteger(dto.billingPeriodMonths) && dto.billingPeriodMonths > 0 ? dto.billingPeriodMonths : null,
    status: text(dto.status), features: features(dto.features),
  }
}

export function mapSubscriptionOrder(dto) {
  if (!record(dto) || !isSubscriptionId(dto.id) || !isSubscriptionId(dto.bakeryId)) throw new ApiError('Dữ liệu đơn mua gói không hợp lệ.', 502)
  return {
    id: dto.id, bakeryId: dto.bakeryId, planId: dto.planId || null,
    orderNumber: dto.orderNumber || null, planNameSnapshot: dto.planNameSnapshot || null,
    planCodeSnapshot: dto.planCodeSnapshot || null, featuresSnapshot: features(dto.featuresSnapshot),
    billingPeriodMonths: dto.billingPeriodMonths ?? null, totalAmount: amount(dto.totalAmount),
    currency: dto.currency || null, status: dto.status || null, expiresAt: dto.expiresAt || null,
    createdAt: dto.createdAt || null, completedAt: dto.completedAt || null,
    payments: Array.isArray(dto.payments) ? dto.payments.map((payment) => {
      if (!record(payment) || !isSubscriptionId(payment.id)) throw new ApiError('Dữ liệu chứng từ thanh toán không hợp lệ.', 502)
      return { id: payment.id, paymentMethod: text(payment.paymentMethod), paymentReference: text(payment.paymentReference), status: text(payment.status), submittedAt: text(payment.submittedAt), proofUrl: text(payment.proofUrl), amount: amount(payment.amount) }
    }) : [],
    period: period(dto.period),
  }
}

export function mapBakerySubscription(dto) {
  if (!record(dto) || !isSubscriptionId(dto.bakeryId)) throw new ApiError('Dữ liệu subscription không hợp lệ.', 502)
  return {
    bakeryId: dto.bakeryId, currentSubscription: period(dto.currentSubscription),
    scheduledSubscription: period(dto.scheduledSubscription), features: features(dto.features),
  }
}

export function mapSubscriptionOrders(data) {
  if (!Array.isArray(data?.result) || !record(data.meta) ||
      !['page', 'pageSize', 'pages', 'total'].every((key) => Number.isInteger(data.meta[key])) ||
      data.meta.page < 1 || data.meta.pageSize < 1 || data.meta.pages < 0 || data.meta.total < 0) {
    throw new ApiError('Danh sách đơn mua gói không đúng định dạng result/meta.', 502)
  }
  return { result: data.result.map(mapSubscriptionOrder), meta: { ...data.meta } }
}

export function formatSubscriptionMoney(value, currency) {
  if (value === null || value === undefined || !currency) return 'Chưa có thông tin giá'
  return Number(value).toLocaleString('vi-VN') + ' ' + (currency === 'VND' ? 'đ' : currency)
}
export function formatSubscriptionDate(value) {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('vi-VN') : 'Chưa có thông tin'
}

export function subscriptionPermissions(roles = []) {
  return { canRead: roles.some((role) => ['BAKERY_OWNER', 'ADMIN'].includes(role)), canPurchase: roles.includes('BAKERY_OWNER') }
}

export function canOrderPlan(plan) {
  return plan.status === 'ACTIVE' && isSubscriptionId(plan.id) && plan.monthlyPrice !== null && plan.monthlyPrice >= 0 && Boolean(plan.currency) && plan.billingPeriodMonths !== null
}

export function canSubmitSubscriptionPayment(roles, order, now = Date.now()) {
  return subscriptionPermissions(roles).canPurchase && order?.status === 'PENDING_PAYMENT' &&
    isSubscriptionId(order?.id) && order.totalAmount > 0 && Boolean(order.currency) && Date.parse(order.expiresAt) > now
}

export const subscriptionStatusLabel = (status) => ({
  ACTIVE: 'Đang hiệu lực', SCHEDULED: 'Đã lên lịch', EXPIRED: 'Đã hết hạn', CANCELLED: 'Đã hủy',
  PENDING_PAYMENT: 'Chờ thanh toán', PAYMENT_REVIEW: 'Chờ duyệt thanh toán', COMPLETED: 'Đã hoàn tất',
  REJECTED: 'Đã từ chối', SUBMITTED: 'Đã gửi, chờ duyệt', APPROVED: 'Đã duyệt',
}[status] || status || 'Chưa rõ trạng thái')
