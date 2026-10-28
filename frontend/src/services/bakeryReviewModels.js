import { formatOrderDate, formatOrderMoney } from './orderPresentation.js'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function bakeryReviewText(value) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text && /[\p{L}\p{N}]/u.test(text) && !uuid.test(text) && !/^(?:null|undefined|nan)$/i.test(text) ? text : null
}
const addressText = (address) => ['addressLine', 'ward', 'district', 'city'].map((key) => bakeryReviewText(address?.[key])).filter(Boolean).join(', ')
const primaryFlag = (address) => typeof address?.isPrimary === 'boolean' ? address.isPrimary : typeof address?.primary === 'boolean' ? address.primary : null
const amount = (value) => value == null || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0 ? 'Chưa cung cấp' : formatOrderMoney(value, 'VND')

export function bakeryReviewProfile(detail) {
  const bakery = detail?.bakery || {}
  const operations = bakery.operations || detail?.operations
  const addresses = Array.isArray(operations?.addresses) ? operations.addresses : []
  const areas = Array.isArray(operations?.serviceAreas) ? operations.serviceAreas : []
  const primaries = addresses.filter((address) => primaryFlag(address) === true)
  const primaryComplete = primaries.length === 1 && ['addressLine', 'district', 'city'].every((key) => bakeryReviewText(primaries[0][key]))
  const activeArea = areas.some((area) => area.active === true && bakeryReviewText(area.city) && bakeryReviewText(area.district))
  const missing = []
  if (!primaries.length) missing.push('Chưa có địa chỉ chính.')
  else if (primaries.length > 1) missing.push('Cần xác định duy nhất một địa chỉ chính.')
  else if (!primaryComplete) missing.push('Địa chỉ chính cần có số nhà/đường, quận/huyện và tỉnh/thành hợp lệ.')
  if (!activeArea) missing.push('Chưa có khu vực giao hàng đang hoạt động với quận/huyện và tỉnh/thành hợp lệ.')
  return {
    name: bakeryReviewText(bakery.name) || 'Chưa có tên tiệm',
    description: bakeryReviewText(bakery.description),
    phone: bakeryReviewText(bakery.phoneNumber) || 'Chưa cung cấp',
    email: bakeryReviewText(bakery.email) || 'Chưa cung cấp',
    addresses: addresses.map((address, index) => ({ key: address.id || index, text: addressText(address) || 'Chưa cung cấp địa chỉ', primary: primaryFlag(address) })),
    areas: areas.map((area, index) => ({ key: area.id || index, text: [bakeryReviewText(area.district), bakeryReviewText(area.city)].filter(Boolean).join(', ') || 'Chưa cung cấp khu vực', active: typeof area.active === 'boolean' ? area.active : null, deliveryFee: amount(area.deliveryFee), minimumOrder: amount(area.minimumOrder) })),
    members: (Array.isArray(detail?.members) ? detail.members : []).map((member, index) => ({ key: member.id || member.userId || index, name: bakeryReviewText(member.displayNameSnapshot) || bakeryReviewText(member.displayName) || 'Chưa có tên thành viên', role: { OWNER: 'Chủ tiệm', MANAGER: 'Quản lý', STAFF: 'Nhân viên' }[member.memberRole] || 'Chưa xác định vai trò', status: { ACTIVE: 'Đang hoạt động', INVITED: 'Đã mời', INACTIVE: 'Ngừng hoạt động' }[member.status] || 'Chưa xác định trạng thái', joinedAt: member.joinedAt ? formatOrderDate(member.joinedAt) : null })),
    subscription: { state: detail?.subscription?.active === true ? 'active' : detail?.subscription?.active === false ? 'inactive' : 'unknown', plan: bakeryReviewText(detail?.subscription?.planCode) || 'Chưa có thông tin gói', end: detail?.subscription?.periodEnd ? formatOrderDate(detail.subscription.periodEnd) : 'Chưa có thông tin thời hạn' },
    missing,
    // Publication and subscription entitlement remain independent operations.
    actions: ({ PENDING_APPROVAL: ['ACTIVE', 'DRAFT'], ACTIVE: ['CLOSED'] }[bakery.status] || []).map((target) => ({
      key: target,
      label: { ACTIVE: 'Duyệt tiệm', DRAFT: 'Trả hồ sơ', CLOSED: 'Đóng tiệm' }[target],
      icon: { ACTIVE: 'verified', DRAFT: 'assignment_return', CLOSED: 'storefront' }[target],
      tone: target === 'CLOSED' ? 'danger' : target === 'DRAFT' ? 'secondary' : 'primary',
      disabled: target === 'ACTIVE' && missing.length > 0,
      disabledReason: target === 'ACTIVE' ? missing.join(' ') : undefined,
      description: { ACTIVE: 'Xác nhận hồ sơ đủ điều kiện hoạt động. Duyệt tiệm không tự kích hoạt gói dịch vụ.', DRAFT: 'Trả hồ sơ về bản nháp để chủ tiệm bổ sung thông tin và gửi lại.', CLOSED: 'Đóng tiệm sẽ dừng hoạt động. Hiện không thể mở lại tiệm đã đóng.' }[target],
      confirmText: target === 'CLOSED' ? 'Tôi hiểu rằng tiệm đã đóng sẽ không thể mở lại.' : undefined,
    })),
  }
}
