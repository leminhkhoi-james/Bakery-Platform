const normalizeText = (value) => typeof value === 'string'
  ? value.normalize('NFD').replace(/\p{M}+/gu, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim()
  : ''

const HCM_ALIASES = new Set(['ho chi minh', 'hcm', 'tphcm', 'tp hcm'])

export function cityKey(value) {
  const key = normalizeText(value).replace(/^(?:thanh pho|tp|tinh)\s+/, '').replace(/\s+city$/, '')
  return HCM_ALIASES.has(key) ? 'ho chi minh' : key
}

export function districtKey(value) {
  const key = normalizeText(value)
  if (key === '*' || key === 'toan thanh pho' || key === 'tat ca') return '*'
  const numbered = key.match(/^(?:(?:quan|q|district|d)\s*)?0*([1-9][0-9]*)$/)
  return numbered ? 'quan ' + numbered[1] : key
}

export function requestMatchesBakery(request, bakery) {
  if (request.status !== 'OPEN' || bakery.status && bakery.status !== 'ACTIVE') return false
  if (request.targetBakeryId) return request.targetBakeryId.toLowerCase() === bakery.id.toLowerCase()
  const reqCity = cityKey(request.deliveryCity)
  const reqDistrict = districtKey(request.deliveryDistrict)
  return bakery.operations?.serviceAreas?.some((area) => {
    if (area.active !== true) return false
    if (cityKey(area.city) !== reqCity) return false
    const areaDistrict = districtKey(area.district)
    return areaDistrict === '*' || areaDistrict === reqDistrict
  }) || false
}
export const rfqStatusLabel = (status) => ({ DRAFT: 'Bản nháp', OPEN: 'Đang nhận báo giá', OFFER_SELECTED: 'Đã chọn báo giá', CLOSED: 'Đã đóng', CANCELLED: 'Đã hủy' }[status] || 'Chưa rõ trạng thái')
export const sentOfferStatusLabel = (status, expiresAt) => status === 'PENDING' && Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) <= Date.now() ? 'Đã qua hạn phản hồi' : ({ PENDING: 'Chờ khách hàng phản hồi', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', WITHDRAWN: 'Đã rút', EXPIRED: 'Đã hết hạn' }[status] || 'Chưa rõ trạng thái')
export function vendorRfqError(error) {
  return ({
    401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    403: 'Bạn chưa có quyền xem yêu cầu và báo giá của cửa hàng này.',
    404: 'Cửa hàng chưa sẵn sàng nhận yêu cầu hoặc không còn khả dụng.',
    409: 'Báo giá hoặc yêu cầu đã thay đổi.',
    500: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
    502: 'Không thể kết nối đến dịch vụ yêu cầu báo giá. Vui lòng thử lại.',
    503: 'Dịch vụ đang tạm thời gián đoạn. Vui lòng thử lại sau.',
    0: 'Kết nối đang gián đoạn. Vui lòng thử lại.'
  })[error?.status] || 'Chưa thể tải yêu cầu và báo giá. Vui lòng thử lại.'
}

export function requestTitleWithoutCustomer(title, customerName) {
  if (!title || !customerName) return title
  const separator = title.lastIndexOf(' · ')
  if (separator < 0) return title
  const suffix = title.slice(separator + 3).trim().toLocaleLowerCase('vi')
  const name = customerName.trim().toLocaleLowerCase('vi')
  return suffix === name || suffix === name.split(/\s+/).at(-1) ? title.slice(0, separator) : title
}
