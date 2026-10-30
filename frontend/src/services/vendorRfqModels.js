const locationKey = (value) => typeof value === 'string' ? value.trim().toLocaleLowerCase('vi') : ''
export function requestMatchesBakery(request, bakery) {
  if (request.status !== 'OPEN' || bakery.status && bakery.status !== 'ACTIVE') return false
  if (request.targetBakeryId) return request.targetBakeryId === bakery.id
  return bakery.operations?.serviceAreas?.some((area) => area.active === true && locationKey(area.city) === locationKey(request.deliveryCity) && locationKey(area.district) === locationKey(request.deliveryDistrict)) || false
}
export const rfqStatusLabel = (status) => ({ DRAFT: 'Bản nháp', OPEN: 'Đang nhận báo giá', OFFER_SELECTED: 'Đã chọn báo giá', CLOSED: 'Đã đóng', CANCELLED: 'Đã hủy' }[status] || 'Chưa rõ trạng thái')
export const sentOfferStatusLabel = (status, expiresAt) => status === 'PENDING' && Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) <= Date.now() ? 'Đã qua hạn phản hồi' : ({ PENDING: 'Chờ khách hàng phản hồi', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', WITHDRAWN: 'Đã rút', EXPIRED: 'Đã hết hạn' }[status] || 'Chưa rõ trạng thái')
export function vendorRfqError(error) {
  return ({ 401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 403: 'Bạn chưa có quyền xem yêu cầu và báo giá của cửa hàng này.', 404: 'Cửa hàng chưa sẵn sàng nhận yêu cầu hoặc không còn khả dụng.', 409: 'Báo giá hoặc yêu cầu đã thay đổi. Hãy tải lại để kiểm tra.', 0: 'Kết nối đang gián đoạn. Vui lòng thử lại.' })[error?.status] || 'Chưa thể tải yêu cầu và báo giá. Vui lòng thử lại.'
}
