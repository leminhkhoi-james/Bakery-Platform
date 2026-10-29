import { cleanPresentationLabel, publicCopy } from './uiLabels.js'

export const PLAN_FEATURES = [
  { code: 'MAX_PRODUCTS', aliases: ['products'], label: 'Số sản phẩm tối đa', limit: true },
  { code: 'MAX_MONTHLY_OFFERS', aliases: ['offers'], label: 'Báo giá mỗi tháng', limit: true },
  { code: 'FEATURED_LISTING', aliases: ['featured'], label: 'Ưu tiên hiển thị' },
  { code: 'support', aliases: [], label: 'Hỗ trợ' },
]
export const planFeature = (code) => PLAN_FEATURES.find((feature) => [feature.code, ...feature.aliases].some((key) => key.toLowerCase() === String(code).toLowerCase()))
export const planFeatureLabel = (code) => planFeature(code)?.label || 'Quyền lợi bổ sung'
export function planFeatureRows(features = {}) {
  return Object.entries(features).map(([code, value]) => ({
    code, label: planFeatureLabel(code),
    value: planFeature(code)?.limit && String(value).trim() === '-1' ? 'Không giới hạn' : String(value) === 'true' ? 'Có' : String(value) === 'false' ? 'Không' : publicCopy(String(value ?? '').trim(), 'Chưa có mô tả') || 'Chưa có mô tả',
  }))
}
export const planName = (plan) => cleanPresentationLabel(plan?.name, 'Gói dịch vụ')
export const planStatusLabel = (status) => ({ ACTIVE: 'Đang cung cấp', INACTIVE: 'Ngừng cung cấp', ARCHIVED: 'Đã lưu trữ' }[status] || 'Chưa có trạng thái')
export function planMonthlyPrice(plan) {
  if (!['number', 'string'].includes(typeof plan?.monthlyPrice) || String(plan.monthlyPrice).trim() === '' || !Number.isFinite(Number(plan.monthlyPrice)) || Number(plan.monthlyPrice) < 0 || !plan.currency) return 'Chưa có thông tin giá'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(plan.monthlyPrice)) + (plan.currency === 'VND' ? ' đ' : ' ' + plan.currency)
}
export const planActions = (status) => ({ ACTIVE: ['pause', 'archive'], INACTIVE: ['activate', 'archive'], ARCHIVED: ['restore'] }[status] || [])
export const PLAN_ACTIONS = {
  pause: { label: 'Ngừng cung cấp', icon: 'pause_circle', target: 'INACTIVE', message: 'Ngừng nhận đăng ký mới. Các kỳ đã mua giữ nguyên giá, thời hạn và quyền lợi.' },
  activate: { label: 'Mở cung cấp', icon: 'play_circle', target: 'ACTIVE', message: 'Cho phép tiệm bánh đăng ký gói này. Các kỳ đã mua không thay đổi.' },
  archive: { label: 'Lưu trữ gói', icon: 'archive', target: 'ARCHIVED', message: 'Đưa gói vào lưu trữ và ngừng nhận đăng ký mới. Có thể khôi phục ở trạng thái ngừng cung cấp. Các kỳ đã mua không thay đổi.' },
  restore: { label: 'Khôi phục gói', icon: 'unarchive', target: 'INACTIVE', message: 'Khôi phục ở trạng thái ngừng cung cấp. Hãy kiểm tra nội dung gói trước khi mở cung cấp lại.' },
}
export function planFeedbackError(error) {
  if (!error) return error
  const message = String(error.message || '')
  const translated = /code.*cannot change.*order/i.test(message) ? 'Không thể đổi mã gói đã có đơn mua. Hãy giữ mã hiện tại.'
    : /code already exists/i.test(message) ? 'Mã gói đã tồn tại. Vui lòng chọn mã khác.'
      : /already archived/i.test(message) ? 'Gói đã được lưu trữ. Vui lòng tải lại danh sách.' : message
  return { ...error, status: error.status, message: translated }
}
