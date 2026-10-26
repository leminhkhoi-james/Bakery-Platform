import { api, ApiError } from './apiClient.js'
import { requireId, requireText } from './managementModels.js'
import { mapSubscriptionPlan } from './subscriptionModels.js'
import { mapReview } from './orderModels.js'
import { mapDesign } from './aiModels.js'
export const PLAN_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED']
export function planPayload(input) {
  const monthlyPrice = Number(input.monthlyPrice), billingPeriodMonths = Number(input.billingPeriodMonths)
  if (input.monthlyPrice === '' || !Number.isFinite(monthlyPrice) || monthlyPrice < 0 || !Number.isInteger(billingPeriodMonths) || billingPeriodMonths < 1 || String(input.currency).trim().toUpperCase() !== 'VND' || !PLAN_STATUSES.includes(input.status)) throw new ApiError('Giá/chu kỳ/trạng thái gói không hợp lệ; chỉ hỗ trợ VND.', 422)
  if (!Array.isArray(input.featureRows)) throw new ApiError('Thiếu cấu hình tính năng.', 400)
  const features = {}
  for (const row of input.featureRows) {
    const code = requireText(row.code, 'Mã tính năng', 80), value = requireText(row.value, 'Giá trị tính năng', 255)
    if (Object.hasOwn(features, code)) throw new ApiError('Mã tính năng bị trùng.', 422)
    Object.defineProperty(features, code, { value, enumerable: true, configurable: true, writable: true })
  }
  return { code: requireText(input.code, 'Mã gói', 50).toUpperCase(), name: requireText(input.name, 'Tên gói', 120), description: input.description ?? '', monthlyPrice, currency: 'VND', billingPeriodMonths, status: input.status, features }
}
function planDto(dto) {
  if (!dto?.features || typeof dto.features !== 'object' || Array.isArray(dto.features) || !PLAN_STATUSES.includes(dto.status)) throw new ApiError('Snapshot gói quản trị thiếu dữ liệu.', 502)
  const plan = mapSubscriptionPlan(dto)
  if (plan.monthlyPrice === null || plan.monthlyPrice < 0 || !plan.code || !plan.name || plan.currency !== 'VND' || !plan.billingPeriodMonths) throw new ApiError('Gói quản trị thiếu dữ liệu bắt buộc.', 502)
  return plan
}
export const adminManagementService = {
  async getPlans(options = {}) {
    const data = await api.get('/admin/subscription-plans', options)
    if (!Array.isArray(data)) throw new ApiError('Danh sách gói quản trị không hợp lệ.', 502)
    return data.map(planDto)
  },
  async savePlan(id, input) {
    const body = planPayload(input), root = '/admin/subscription-plans'
    const dto = planDto(id ? await api.patch(root + '/' + requireId(id), body) : await api.post(root, body))
    if (id && dto.id !== id.toLowerCase()) throw new ApiError('Backend trả sai gói.', 502)
    return dto
  },
  async archivePlan(id) {
    const dto = planDto(await api.post('/admin/subscription-plans/' + requireId(id) + '/archive'))
    if (dto.id !== id.toLowerCase() || dto.status !== 'ARCHIVED') throw new ApiError('Backend chưa xác nhận archive.', 502)
    return dto
  },
  async moderateReview(orderId, status) {
    if (!['PUBLISHED', 'HIDDEN'].includes(status)) throw new ApiError('Chỉ cho phép PUBLISHED/HIDDEN.', 400)
    const review = mapReview(await api.patch('/admin/reviews/' + requireId(orderId) + '/status', { status }))
    if (review.orderId !== orderId.toLowerCase() || review.status !== status) throw new ApiError('Backend chưa xác nhận moderation review.', 502)
    return review
  },
  async moderateDesign(id, moderationStatus) {
    if (!['APPROVED', 'REJECTED'].includes(moderationStatus)) throw new ApiError('Chọn APPROVED hoặc REJECTED.', 400)
    const dto = mapDesign(await api.patch('/admin/generated-designs/' + requireId(id) + '/moderation', { moderationStatus }))
    if (dto.id !== id.toLowerCase() || dto.moderationStatus !== moderationStatus) throw new ApiError('Backend chưa xác nhận moderation design.', 502)
    return dto
  },
}
export const loadAdminPlans = (_params, options) => adminManagementService.getPlans(options)

