import { cleanPresentationLabel, publicCopy } from './uiLabels.js'

export const PLAN_FEATURES = [
  { code: 'MAX_PRODUCTS', aliases: ['products'], label: 'Số sản phẩm tối đa', limit: true },
  { code: 'MAX_MONTHLY_OFFERS', aliases: ['offers'], label: 'Báo giá mỗi tháng', limit: true },
  { code: 'FEATURED_LISTING', aliases: ['featured'], label: 'Ưu tiên hiển thị' },
  { code: 'support', aliases: [], label: 'Hỗ trợ' },
]
export const planFeature = (code) => PLAN_FEATURES.find((feature) => [feature.code, ...feature.aliases].some((key) => key.toLowerCase() === String(code).toLowerCase()))
export const planFeatureLabel = (code) => planFeature(code)?.label || 'Quyền lợi bổ sung'
export const PLAN_DISPLAY_TIERS = {
  BASIC: { code: 'BASIC', name: 'Cơ bản' },
  PRO: { code: 'PRO', name: 'Chuyên nghiệp' },
  PREMIUM: { code: 'PREMIUM', name: 'Cao cấp' },
}

export const PLAN_TIER_ORDER = {
  BASIC: 1,
  DEMO_0: 1,
  PRO: 2,
  DEMO_1: 2,
  PREMIUM: 3,
  DEMO_2: 3,
}

export function planTierRank(plan) {
  if (!plan) return 99
  const code = String(plan?.code || '').trim().toUpperCase()
  if (PLAN_TIER_ORDER[code]) return PLAN_TIER_ORDER[code]
  const name = String(typeof plan === 'string' ? plan : plan?.name || '').trim().toLowerCase()
  if (name.includes('cơ bản') || name === 'basic' || name === 'gói basic') return 1
  if (name.includes('chuyên nghiệp') || name === 'pro' || name === 'gói pro') return 2
  if (name.includes('cao cấp') || name === 'premium' || name === 'gói premium') return 3
  return 99
}

export function sortPlansByTier(plans) {
  if (!Array.isArray(plans)) return plans
  return [...plans].sort((a, b) => planTierRank(a) - planTierRank(b))
}

export function resolvePlanTier(plan) {
  if (!plan) return null
  const code = String(plan.code || '').trim().toUpperCase()
  const name = String(plan.name || '').trim().toUpperCase()
  if (code === 'BASIC' || code === 'DEMO_0' || name === 'BASIC' || name === 'GÓI BASIC' || name === 'CƠ BẢN' || name === 'GÓI CƠ BẢN') return PLAN_DISPLAY_TIERS.BASIC
  if (code === 'PRO' || code === 'DEMO_1' || name === 'PRO' || name === 'GÓI PRO' || name === 'CHUYÊN NGHIỆP' || name === 'GÓI CHUYÊN NGHIỆP') return PLAN_DISPLAY_TIERS.PRO
  if (code === 'PREMIUM' || code === 'DEMO_2' || name === 'PREMIUM' || name === 'GÓI PREMIUM' || name === 'CAO CẤP' || name === 'GÓI CAO CẤP') return PLAN_DISPLAY_TIERS.PREMIUM
  return null
}

export function planFeatureRows(features = {}) {
  const canonical = new Map()
  for (const [code, value] of Object.entries(features)) {
    const key = planFeature(code)?.code || code
    if (!canonical.has(key) || code.toLowerCase() === key.toLowerCase()) canonical.set(key, value)
  }
  const sourceFeatures = Object.fromEntries(canonical)
  return Object.entries(sourceFeatures).map(([code, value]) => ({
    code, label: planFeatureLabel(code),
    value: planFeature(code)?.limit && String(value).trim() === '-1' ? 'Không giới hạn' : String(value) === 'true' ? 'Có' : String(value) === 'false' ? 'Không' : publicCopy(String(value ?? '').trim(), 'Chưa có mô tả') || 'Chưa có mô tả',
  }))
}

export const planCodeLabel = (code) => {
  const upper = String(code || '').trim().toUpperCase()
  if (upper === 'BASIC' || upper === 'DEMO_0') return 'Cơ bản'
  if (upper === 'PRO' || upper === 'DEMO_1') return 'Chuyên nghiệp'
  if (upper === 'PREMIUM' || upper === 'DEMO_2') return 'Cao cấp'
  return cleanPresentationLabel(code, 'Gói dịch vụ')
}

export const planName = (plan) => {
  if (!plan) return 'Gói dịch vụ'
  if (typeof plan === 'string') {
    const raw = plan.trim()
    const upper = raw.toUpperCase()
    if (upper === 'BASIC' || upper === 'DEMO_0' || upper === 'GÓI BASIC' || upper === 'CƠ BẢN' || upper === 'GÓI CƠ BẢN') return 'Cơ bản'
    if (upper === 'PRO' || upper === 'DEMO_1' || upper === 'GÓI PRO' || upper === 'CHUYÊN NGHIỆP' || upper === 'GÓI CHUYÊN NGHIỆP') return 'Chuyên nghiệp'
    if (upper === 'PREMIUM' || upper === 'DEMO_2' || upper === 'GÓI PREMIUM' || upper === 'CAO CẤP' || upper === 'GÓI CAO CẤP') return 'Cao cấp'
    return cleanPresentationLabel(raw, 'Gói dịch vụ')
  }
  const code = String(plan?.code || '').trim().toUpperCase()
  const nameRaw = String(plan?.name || '').trim()
  const nameUpper = nameRaw.toUpperCase()

  // Prioritize canonical Vietnamese tier names when code or name matches BASIC / PRO / PREMIUM
  if (code === 'BASIC' || nameUpper === 'BASIC' || nameUpper === 'GÓI BASIC' || nameUpper === 'CƠ BẢN' || nameUpper === 'GÓI CƠ BẢN') return 'Cơ bản'
  if (code === 'PRO' || nameUpper === 'PRO' || nameUpper === 'GÓI PRO' || nameUpper === 'CHUYÊN NGHIỆP' || nameUpper === 'GÓI CHUYÊN NGHIỆP') return 'Chuyên nghiệp'
  if (code === 'PREMIUM' || nameUpper === 'PREMIUM' || nameUpper === 'GÓI PREMIUM' || nameUpper === 'CAO CẤP' || nameUpper === 'GÓI CAO CẤP') return 'Cao cấp'

  if (plan?.name) return cleanPresentationLabel(plan.name, 'Gói dịch vụ')
  const tier = resolvePlanTier(plan)
  return tier?.name || cleanPresentationLabel(plan?.code, 'Gói dịch vụ')
}
export const planStatusLabel = (status) => ({ ACTIVE: 'Đang cung cấp', INACTIVE: 'Ngừng cung cấp', ARCHIVED: 'Đã lưu trữ' }[status] || 'Chưa có trạng thái')
export function planMonthlyPrice(plan) {
  const price = plan?.monthlyPrice
  if (!['number', 'string'].includes(typeof price) || String(price).trim() === '' || !Number.isFinite(Number(price)) || Number(price) < 0 || !plan?.currency) return 'Chưa có thông tin giá'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(price)) + (plan?.currency === 'VND' ? ' đ' : ' ' + plan?.currency)
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
