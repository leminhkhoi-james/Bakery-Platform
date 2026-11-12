// Presentation only: keys and submitted enum values always remain unchanged.
const labels = {
  DRAFT: 'Bản nháp', PENDING_APPROVAL: 'Chờ duyệt', ACTIVE: 'Đang hoạt động', SUSPENDED: 'Tạm ngưng', CLOSED: 'Đã đóng',
  PUBLISHED: 'Công khai', HIDDEN: 'Đã ẩn', ARCHIVED: 'Đã lưu trữ', INACTIVE: 'Ngừng hoạt động', INVITED: 'Đã mời',
  PENDING: 'Chờ xử lý', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối', SUBMITTED: 'Đã gửi',
  OPEN: 'Đang mở', OFFER_SELECTED: 'Đã chọn báo giá', ORDERED: 'Đã đặt hàng', ACCEPTED: 'Đã chấp nhận', WITHDRAWN: 'Đã rút',
  CANCELLED: 'Đã hủy', EXPIRED: 'Đã hết hạn', DELETED: 'Đã xóa', SCHEDULED: 'Đã lên lịch',
  CONFIRMED: 'Đã xác nhận', BAKING: 'Đang làm bánh', READY: 'Sẵn sàng giao', DELIVERING: 'Đang giao', COMPLETED: 'Hoàn tất',
  PENDING_PAYMENT: 'Chờ thanh toán', PAYMENT_REVIEW: 'Chờ đối chiếu thanh toán',
  PREPARED: 'Đã chuẩn bị', RETRYING: 'Đang thử lại', QUEUED: 'Đang chờ', PROCESSING: 'Đang xử lý', SUCCEEDED: 'Hoàn thành', FAILED: 'Không thành công',
  OWNER: 'Chủ tiệm', BAKERY_OWNER: 'Chủ tiệm', BAKERY_STAFF: 'Nhân viên tiệm', STAFF: 'Nhân viên tiệm', ADMIN: 'Quản trị viên', CUSTOMER: 'Khách hàng', BLOCKED: 'Tạm ngưng',
  OPEN_CUSTOM: 'Đặt bánh theo ý tưởng', TARGETED_PRODUCT_CUSTOM: 'Tùy chỉnh mẫu bánh của tiệm',
  DIRECT_CATALOG: 'Đặt từ mẫu bánh', ACCEPTED_OFFER: 'Đặt theo báo giá', CATALOG_PRODUCT: 'Bánh theo mẫu', CUSTOM_CAKE: 'Bánh thiết kế riêng',
  SINGLE: 'Chọn một', MULTIPLE: 'Chọn nhiều', TEXT: 'Văn bản', IMAGE: 'Ảnh', FILE: 'Tệp đính kèm', SYSTEM: 'Hệ thống', BAKERY: 'Tiệm bánh',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng', CASH: 'Tiền mặt', COD: 'Thanh toán khi nhận hàng',
}

const businessErrorMessages = {
  'Product, options or delivery area are unavailable for this order': 'Địa chỉ giao hàng (Quận/Huyện) không nằm trong khu vực phục vụ của tiệm bánh, hoặc tùy chọn sản phẩm không còn khả dụng.',
  'Product or bakery is no longer available for ordering': 'Sản phẩm hoặc tiệm bánh hiện không còn mở nhận đơn.',
  'Delivery area is not served': 'Khu vực giao hàng (Quận/Huyện) này không nằm trong phạm vi phục vụ của tiệm bánh.',
  'Option selection count is invalid': 'Số lượng tùy chọn sản phẩm đã chọn không hợp lệ hoặc thiếu tùy chọn bắt buộc.',
  'Duplicate or invalid option group': 'Nhóm tùy chọn bị trùng lặp hoặc không hợp lệ.',
  'Duplicate option value': 'Giá trị tùy chọn bị trùng lặp.',
  'Option value is unavailable': 'Tùy chọn đã chọn hiện không khả dụng.',
  'Invalid product option selection': 'Tùy chọn sản phẩm đã chọn không hợp lệ.',
  'Order is below delivery minimum': 'Giá trị đơn hàng chưa đạt mức giao hàng tối thiểu của tiệm bánh tại khu vực này.',
  'Requested delivery time must be in the future': 'Thời gian nhận bánh mong muốn phải ở tương lai.',
  'Requested delivery time does not meet the minimum notice period': 'Thời gian nhận bánh chưa đáp ứng thời gian chuẩn bị tối thiểu của tiệm bánh.',
  'Delivery address is missing or incomplete': 'Địa chỉ giao hàng bị thiếu hoặc chưa đầy đủ thông tin.',
  'Bakery quote is invalid or expired': 'Báo giá của tiệm bánh đã hết hạn hoặc không hợp lệ. Vui lòng tải lại trang.',
  'Bakery approval and an active subscription are required': 'Hồ sơ tiệm bánh đang chờ duyệt hoặc gói dịch vụ chưa được kích hoạt. Vui lòng đợi Ban quản trị phê duyệt hồ sơ và xác nhận thanh toán.',
  'Active bakery owner membership is required': 'Bạn chưa phải là chủ sở hữu của tiệm bánh này.',
  'Bakery name already exists': 'Tên tiệm bánh này đã được đăng ký. Vui lòng chọn một tên khác.',
  'Image storage is unavailable': 'Kho lưu ảnh đang gián đoạn. Ảnh chưa được cập nhật.',
  'Only draft or hidden products can be published': 'Chỉ có thể mở bán bánh ở trạng thái bản nháp hoặc tạm ẩn. Bánh đã lưu trữ cần tạo bản nháp mới.',
  'Product requires an active bakery, valid price and primary image': 'Để mở bán, tiệm phải đang hoạt động, bánh có giá hợp lệ và ít nhất một ảnh chính. Hãy kiểm tra ảnh trong Chỉnh sửa.',
  'Required product options are incomplete': 'Tùy chọn bắt buộc của bánh chưa đầy đủ. Hãy kiểm tra kích thước, hương vị và số lựa chọn tối thiểu.',
  'Bakery subscription is inactive': 'Tiệm chưa có gói dịch vụ đang hiệu lực. Vui lòng kiểm tra gói trước khi mở bán.',
  'Unsupported image or content type mismatch': 'Tệp ảnh không đúng định dạng. Hãy chọn ảnh PNG, JPEG hoặc WebP.',
  'Subscription plan is not active': 'Gói dịch vụ này hiện không còn mở bán hoặc đã hết hạn đăng ký.',
  'Payment evidence is already submitted': 'Biên lai thanh toán đã được gửi và đang chờ Ban quản trị xác nhận.',
  'Only pending orders can be paid': 'Đơn mua gói này đã được xác nhận thanh toán hoặc không ở trạng thái chờ.',
  'Onboarding profile already submitted': 'Hồ sơ tiệm bánh của bạn đã được gửi và đang chờ Ban quản trị xét duyệt.',
  'User already has an onboarding bakery': 'Bạn đã gửi hồ sơ đăng ký tiệm bánh rồi. Ban quản trị đang xử lý hồ sơ của bạn.',
  'Bakery already has an open subscription order': 'Tiệm bánh đã có một đơn mua gói đang chờ xử lý bên dưới. Vui lòng thanh toán hoặc hoàn tất đơn này trước khi tạo đơn mới.',
  'Idempotency-Key was used with different order data': 'Thông tin tạo đơn không trùng khớp. Vui lòng làm mới trang và thử lại.',
  'Plan not found': 'Không tìm thấy gói dịch vụ yêu cầu.',
  'Plan is not active': 'Gói dịch vụ này hiện không còn mở bán.',
  'Invalid offer dates': 'Thời gian hoàn thành dự kiến hoặc hạn hiệu lực báo giá không hợp lệ. Cả hai thời điểm đều phải trước ngày giờ khách cần nhận bánh.',
  'Request no longer accepting offers': 'Yêu cầu đặt bánh này đã hết hạn nhận báo giá hoặc đã đóng.',
  'Active subscription required': 'Tiệm bánh cần có gói dịch vụ đang hoạt động để gửi báo giá.',
  'Wrong target bakery': 'Yêu cầu đặt bánh này được gửi riêng cho tiệm bánh khác.',
  'Invalid offer fields': 'Vui lòng kiểm tra lại các trường thông tin trong báo giá.',
  'Remote validation failed': 'Địa chỉ giao hàng đã chọn không khớp với khu vực bạn đã yêu cầu báo giá (Quận/Huyện, Tỉnh/Thành). Vui lòng chọn hoặc thêm đúng địa chỉ nhận bánh.',
  'Customer phone/address invalid': 'Địa chỉ giao hàng hoặc số điện thoại không khớp với khu vực bạn đã yêu cầu báo giá. Vui lòng chọn hoặc thêm địa chỉ nhận bánh đúng khu vực đã thỏa thuận.',
  'Acceptance validation failed': 'Không thể hoàn tất chấp nhận báo giá. Vui lòng kiểm tra lại địa chỉ giao hàng và thử lại.',
  'Offer snapshot mismatch': 'Thông tin báo giá không trùng khớp với yêu cầu đặt bánh gốc.',
  'Invalid delivery address': 'Địa chỉ giao hàng không hợp lệ hoặc không tìm thấy trên hệ thống.',
}

const technicalCopy = /\b(?:backend|API|DEMO|mock\s*data|debug)(?:\b|_)|dữ\s+liệu\s+mẫu|Gói minh họa/i
export const uiLabel = (value, fallback = 'Chưa có thông tin') => labels[value] || (technicalCopy.test(String(value || '')) ? fallback : value || fallback)
export function userFeedback(error) {
  const message = String(error?.message || error?.data?.message || '')
  if (businessErrorMessages[message]) return businessErrorMessages[message]
  for (const [key, translated] of Object.entries(businessErrorMessages)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return translated
  }
  if (error?.status >= 500 || error?.status === 0) return 'Kết nối đang gián đoạn. Vui lòng thử lại sau.'
  if (technicalCopy.test(message) || /\b(?:DTO|JWT|UUID|BLOCKED|snapshot|Response|Idempotency)\b|stack trace|TypeError|ReferenceError/i.test(message)) return 'Chưa thể thực hiện thao tác này. Vui lòng kiểm tra thông tin và thử lại.'
  return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

// Presentation only: source IDs, records and authentication values are never modified.
export function cleanPresentationLabel(value, fallback = '') {
  if (typeof value !== 'string') return value || fallback
  const marker = '(?:DEMO|dữ\\s+liệu\\s+mẫu|mock\\s*data|backend|API)'
  const text = value
    .replace(new RegExp('\\s*[·|•]\\s*' + marker + '\\s*$', 'gi'), '')
    .replace(new RegExp('\\s*[([]\\s*' + marker + '\\s*[)\\]]', 'gi'), '')
    .replace(new RegExp('^' + marker + '\\s*[·|•:]\\s*', 'i'), '')
    .replace(/^(?:DEMO|MẪU)[-_]/i, '')
    .replace(/\s*\((?:CUSTOMER|Customer)\)/gi, ' (Khách hàng)')
    .replace(/\s*\((?:ADMIN|Admin)\)/gi, ' (Quản trị viên)')
    .replace(/\s*\((?:BAKERY_OWNER|Bakery Owner|Vendor|Owner)\)/gi, ' (Chủ tiệm)')
    .trim()
  return new RegExp('^' + marker + '$', 'i').test(text) ? fallback : text || fallback
}
export const publicCopy = (value, fallback = '') => technicalCopy.test(String(value || '')) ? fallback : value || fallback
