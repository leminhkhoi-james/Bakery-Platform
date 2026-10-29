import { cleanPresentationLabel, publicCopy } from './uiLabels.js'
import { formatOrderDate, formatOrderMoney } from './orderPresentation.js'

const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
export function bakeryReviewText(value) {
  if (typeof value !== 'string') return null
  const text = publicCopy(value.trim())
  return text && /[\p{L}\p{N}]/u.test(text) && !uuid.test(text) && !/^(?:null|undefined|nan)$/i.test(text) ? text : null
}
const addressText = (address) => {
  const parts = ['addressLine', 'ward', 'district', 'city'].map((key) => bakeryReviewText(address?.[key])).filter(Boolean)
  const line = bakeryReviewText(address?.addressLine), city = bakeryReviewText(address?.city)
  // Older records may already contain the complete postal address in addressLine.
  // Keep that supplied address instead of appending conflicting legacy subdivisions.
  const cityKey = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^(thanhpho|tp)/, '').replace(/^hochiminh$/, 'hcm')
  if (line && city && cityKey(line.split(',').at(-1)) === cityKey(city)) return line
  const segments = []
  for (const part of parts) {
    const normalized = part.toLocaleLowerCase('vi')
    if (!segments.some((item) => item.toLocaleLowerCase('vi') === normalized)) segments.push(...part.split(',').map((item) => item.trim()).filter((item) => item && !segments.some((existing) => existing.toLocaleLowerCase('vi') === item.toLocaleLowerCase('vi'))))
  }
  return [...new Set(segments)].join(', ')
}
const primaryFlag = (address) => typeof address?.isPrimary === 'boolean' ? address.isPrimary : typeof address?.primary === 'boolean' ? address.primary : null
const amount = (value) => !['number', 'string'].includes(typeof value) || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0 ? 'Chưa cung cấp' : formatOrderMoney(value, 'VND')

export function bakeryReviewProfile(detail) {
  const bakery = detail?.bakery || {}
  const operations = bakery.operations || detail?.operations
  const addresses = Array.isArray(operations?.addresses) ? operations.addresses.filter((item) => item && typeof item === 'object') : []
  const areas = Array.isArray(operations?.serviceAreas) ? operations.serviceAreas.filter((item) => item && typeof item === 'object') : []
  const primaries = addresses.filter((address) => primaryFlag(address) === true)
  const addressesKnown = Array.isArray(operations?.addresses), areasKnown = Array.isArray(operations?.serviceAreas)
  const hasPrimary = primaries.length > 0
  const activeArea = areas.some((area) => area.active === true)
  const primaryVerified = addressesKnown && (hasPrimary || addresses.every((address) => primaryFlag(address) !== null))
  const areaVerified = areasKnown && (activeArea || areas.every((area) => typeof area.active === 'boolean'))
  const missing = []
  if (!primaryVerified) missing.push('Chưa xác minh được địa chỉ chính. Vui lòng tải lại hồ sơ.')
  else if (!hasPrimary) missing.push('Chưa có địa chỉ chính.')
  if (!areaVerified) missing.push('Chưa xác minh được trạng thái hoạt động của khu vực giao hàng. Vui lòng tải lại hồ sơ.')
  else if (!activeArea) missing.push('Chưa có khu vực giao hàng đang hoạt động.')
  return {
    name: cleanPresentationLabel(bakeryReviewText(bakery.name), 'Chưa cung cấp'),
    description: bakeryReviewText(bakery.description),
    phone: bakeryReviewText(bakery.phoneNumber) || 'Chưa cung cấp',
    email: bakeryReviewText(bakery.email) || 'Chưa cung cấp',
    addresses: addresses.map((address, index) => ({ key: address.id || index, text: addressText(address) || 'Chưa cung cấp địa chỉ', primary: primaryFlag(address) })),
    areas: areas.map((area, index) => ({ key: area.id || index, text: [bakeryReviewText(area.district), bakeryReviewText(area.city)].filter(Boolean).join(', ') || 'Chưa cung cấp khu vực', active: typeof area.active === 'boolean' ? area.active : null, deliveryFee: amount(area.deliveryFee), minimumOrder: amount(area.minimumOrder) })),
    members: (Array.isArray(detail?.members) ? detail.members.filter((item) => item && typeof item === 'object') : []).map((member, index) => ({ key: member.id || member.userId || index, name: cleanPresentationLabel(bakeryReviewText(member.displayNameSnapshot) || bakeryReviewText(member.displayName), 'Chưa cung cấp'), role: { OWNER: 'Chủ tiệm', MANAGER: 'Quản lý', STAFF: 'Nhân viên' }[member.memberRole] || 'Chưa cung cấp', status: { ACTIVE: 'Đang hoạt động', INVITED: 'Đã mời', INACTIVE: 'Ngừng hoạt động' }[member.status] || 'Chưa cung cấp', joinedAt: member.joinedAt ? formatOrderDate(member.joinedAt) : null })),
    subscription: { state: detail?.subscription === null ? 'error' : detail?.subscription?.registrationStatus === 'NOT_REGISTERED' ? 'not_registered' : detail?.subscription?.active === true ? 'active' : detail?.subscription?.active === false ? 'inactive' : 'unknown', plan: cleanPresentationLabel(bakeryReviewText(detail?.subscription?.planCode), 'Chưa có thông tin gói'), end: detail?.subscription?.periodEnd ? formatOrderDate(detail.subscription.periodEnd) : 'Chưa có thông tin thời hạn' },
    operationsKnown: operations != null,
    addressesKnown, areasKnown,
    membersKnown: Array.isArray(detail?.members),
    returned: bakery.status === 'DRAFT' && bakery.reviewDecision?.status === 'RETURNED',
    returnReason: bakery.status === 'DRAFT' && bakery.reviewDecision?.status === 'RETURNED' ? bakeryReviewText(bakery.reviewDecision.reason) : null,
    checks: [{ label: 'Có địa chỉ chính', passed: primaryVerified ? hasPrimary : null }, { label: 'Khu vực giao hàng đang hoạt động', passed: areaVerified ? activeArea : null }],
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
      reasonLabel: target === 'DRAFT' ? 'Lý do trả hồ sơ' : undefined,
      reasonRequired: target === 'DRAFT',
      confirmText: target === 'CLOSED' ? 'Tôi hiểu rằng tiệm đã đóng sẽ không thể mở lại.' : undefined,
    })),
  }
}
