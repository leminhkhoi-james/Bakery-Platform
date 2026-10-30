import { ApiError } from './apiClient.js'
import { loadOrders } from './orderService.js'

export function vendorOrderDateRange(from = '', to = '') {
  for (const value of [from, to]) {
    if (!value) continue
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new ApiError('Ngày lọc không hợp lệ.', 400)
  }
  if (from && to && from > to) throw new ApiError('Ngày bắt đầu phải trước hoặc cùng ngày kết thúc.', 400)
  // The API accepts instants with inclusive bounds. A selected day covers the
  // entire Vietnamese calendar day, independent of the browser's timezone.
  return {
    ...(from ? { createdFrom: from + 'T00:00:00+07:00' } : {}),
    ...(to ? { createdTo: to + 'T23:59:59.999999999+07:00' } : {}),
  }
}

export const loadVendorOrders = async ({ from, to, ...params }, options) => loadOrders({ ...params, scope: 'bakery', ...vendorOrderDateRange(from, to) }, options)

export function vendorOrderError(error) {
  if (error?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (error?.status === 403) return 'Bạn chưa có quyền xem đơn hàng của cửa hàng này. Vui lòng kiểm tra lại cửa hàng đang chọn.'
  if (error?.status === 404) return 'Không tìm thấy cửa hàng hoặc đơn hàng.'
  if (error?.status === 400) return 'Khoảng ngày lọc không hợp lệ. Ngày bắt đầu phải trước hoặc cùng ngày kết thúc.'
  if (error?.status === 0) return 'Kết nối đang gián đoạn. Vui lòng thử lại.'
  return 'Chưa thể tải đơn hàng. Vui lòng thử lại sau.'
}
