// Presentation only: keys and submitted enum values always remain unchanged.
const labels = {
  DRAFT: 'Bản nháp', PENDING_APPROVAL: 'Chờ duyệt', ACTIVE: 'Đang hoạt động', SUSPENDED: 'Tạm ngưng', CLOSED: 'Đã đóng',
  PUBLISHED: 'Công khai', HIDDEN: 'Đã ẩn', ARCHIVED: 'Đã lưu trữ', INACTIVE: 'Ngừng hoạt động', INVITED: 'Đã mời',
  PENDING: 'Chờ xử lý', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối', SUBMITTED: 'Đã gửi',
  OPEN: 'Đang mở', OFFER_SELECTED: 'Đã chọn báo giá', ORDERED: 'Đã đặt hàng', ACCEPTED: 'Đã chấp nhận', WITHDRAWN: 'Đã rút',
  CANCELLED: 'Đã hủy', EXPIRED: 'Đã hết hạn', DELETED: 'Đã xóa', SCHEDULED: 'Đã lên lịch',
  CONFIRMED: 'Đã xác nhận', BAKING: 'Đang làm bánh', READY: 'Sẵn sàng giao', DELIVERING: 'Đang giao', COMPLETED: 'Hoàn tất',
  PENDING_PAYMENT: 'Chờ thanh toán', PAYMENT_REVIEW: 'Chờ đối chiếu thanh toán',
  QUEUED: 'Đang chờ', PROCESSING: 'Đang xử lý', SUCCEEDED: 'Hoàn thành', FAILED: 'Không thành công',
  OWNER: 'Chủ tiệm', BAKERY_OWNER: 'Chủ tiệm', ADMIN: 'Quản trị viên', CUSTOMER: 'Khách hàng',
  OPEN_CUSTOM: 'Đặt bánh theo ý tưởng', TARGETED_PRODUCT_CUSTOM: 'Tùy chỉnh mẫu bánh của tiệm',
  DIRECT_CATALOG: 'Đặt từ mẫu bánh', ACCEPTED_OFFER: 'Đặt theo báo giá', CATALOG_PRODUCT: 'Bánh theo mẫu', CUSTOM_CAKE: 'Bánh thiết kế riêng',
  SINGLE: 'Chọn một', MULTIPLE: 'Chọn nhiều', TEXT: 'Văn bản', IMAGE: 'Ảnh', FILE: 'Tệp đính kèm', SYSTEM: 'Hệ thống', BAKERY: 'Tiệm bánh',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng', CASH: 'Tiền mặt', COD: 'Thanh toán khi nhận hàng',
}
export const uiLabel = (value, fallback = 'Chưa có thông tin') => labels[value] || value || fallback
export function userFeedback(error) {
  const message = String(error?.message || '')
  if (error?.status >= 500 || error?.status === 0) return 'Kết nối đang gián đoạn. Vui lòng thử lại sau.'
  if (/\b(?:backend|API|DTO|JWT|UUID|BLOCKED|DEMO|mockData|debug|snapshot|Response|Idempotency)\b|dữ liệu mẫu|stack trace|TypeError|ReferenceError/i.test(message)) return 'Chưa thể thực hiện thao tác này. Vui lòng kiểm tra thông tin và thử lại.'
  return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

// Presentation only: source IDs, records and authentication values are never modified.
export const cleanPresentationLabel = (value, fallback = '') => typeof value === 'string' ? value.replace(/\s*[·|]\s*DEMO\b/gi, '').replace(/\s*\(DEMO\)/gi, '').replace(/^(?:DEMO|MẪU)[-_]/i, '').trim() || fallback : value || fallback
export const publicCopy = (value, fallback = '') => /\b(?:mockData|backend|API|DEMO)\b|dữ liệu mẫu|Gói minh họa/i.test(String(value || '')) ? fallback : value || fallback
