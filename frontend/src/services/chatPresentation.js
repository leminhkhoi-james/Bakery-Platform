import { cleanPresentationLabel } from './uiLabels.js'
export function chatCustomerLabel(conversation) {
  const name = cleanPresentationLabel(conversation?.customerName)
  return name && !/[0-9a-f]{8}-[0-9a-f-]{27}/i.test(name) ? name : 'Khách hàng'
}
export const chatRequestLabel = (conversation) => cleanPresentationLabel(conversation?.requestTitle, 'Yêu cầu đặt bánh')
export function chatErrorText(error) {
  return ({ 400: 'Thông tin hội thoại không hợp lệ.', 401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 403: 'Bạn chưa có quyền truy cập hội thoại này.', 404: 'Không tìm thấy hội thoại.', 409: 'Hội thoại đã thay đổi. Vui lòng tải lại.', 422: 'Kiểm tra nội dung và tệp đính kèm trước khi gửi.', 0: 'Kết nối đang gián đoạn. Vui lòng thử lại.', 500: 'Hệ thống tin nhắn đang bận. Vui lòng thử lại.', 502: 'Dịch vụ tin nhắn chưa sẵn sàng. Vui lòng thử lại.', 503: 'Dịch vụ tin nhắn chưa sẵn sàng. Vui lòng thử lại.' })[error?.status] || 'Chưa thể tải tin nhắn. Vui lòng thử lại.'
}
export function searchConversations(rows, query) {
  const key = query.trim().toLocaleLowerCase('vi')
  return rows.filter((row) => !key || [row.customerName, row.requestTitle, row.lastMessagePreview].some((value) => value?.toLocaleLowerCase('vi').includes(key)))
}
