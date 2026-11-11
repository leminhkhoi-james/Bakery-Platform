import { ApiError } from './apiClient.js'
import { requireSubscriptionId } from './subscriptionModels.js'

export function mapVnpayCheckout(data, orderId) {
  requireSubscriptionId(data?.attemptId, 'Mã thanh toán')
  if (data.orderId !== orderId || !Number.isFinite(Date.parse(data.expiresAt)) || Date.parse(data.expiresAt) <= Date.now()) {
    throw new ApiError('Liên kết thanh toán không khớp đơn hoặc đã hết hạn. Vui lòng tải lại đơn.', 502)
  }
  let url
  try { url = new URL(data.paymentUrl) } catch { throw new ApiError('Liên kết VNPay không hợp lệ.', 502) }
  if (url.origin !== 'https://sandbox.vnpayment.vn' || url.pathname !== '/paymentv2/vpcpay.html'
      || url.username || url.password || url.hash) throw new ApiError('Liên kết thanh toán không thuộc VNPay Sandbox.', 502)
  return { ...data, paymentUrl: url.href }
}

export function vnpayReturnQuery(search) {
  const params = new URLSearchParams(search)
  const query = new URLSearchParams()
  for (const [key, value] of params) {
    if (!key.startsWith('vnp_')) continue
    if (query.has(key)) throw new ApiError('Thông tin trả về từ VNPay bị trùng. Vui lòng kiểm tra đơn mua gói.', 400)
    query.set(key, value)
  }
  if (!query.get('vnp_TxnRef') || !query.get('vnp_SecureHash')) {
    throw new ApiError('Thiếu thông tin xác minh từ VNPay. Vui lòng mở lại đơn mua gói.', 400)
  }
  return query.toString()
}

export function mapVnpayResult(data) {
  requireSubscriptionId(data?.attemptId, 'Mã thanh toán')
  requireSubscriptionId(data?.orderId, 'Mã đơn')
  if (!['PENDING', 'SUCCEEDED', 'FAILED', 'REVIEW_REQUIRED'].includes(data.status)
      || !/^\d{2}$/.test(data.responseCode)) throw new ApiError('Chưa xác định được kết quả thanh toán.', 502)
  return data
}

export function vnpayResultCopy(result) {
  if (result?.status === 'SUCCEEDED') return {
    title: 'Thanh toán thành công', icon: 'check_circle',
    description: 'Đã ghi nhận thanh toán cho đơn mua gói. Bạn có thể xem thời gian hiệu lực trong mục Gói dịch vụ.',
  }
  if (result?.status === 'REVIEW_REQUIRED') return {
    title: 'Giao dịch cần được đối soát', icon: 'support_agent',
    description: 'Đã ghi nhận giao dịch từ VNPay. Bộ phận hỗ trợ cần đối soát đơn trước khi hoàn tất. Vui lòng không thanh toán thêm.',
  }
  if (result?.status === 'FAILED') return {
    title: result.responseCode === '24' ? 'Bạn đã hủy thanh toán' : 'Thanh toán chưa thành công', icon: 'info',
    description: 'Đơn mua gói chưa được thanh toán qua giao dịch này. Bạn có thể mở lại đơn để thử lại hoặc chọn chuyển khoản thủ công.',
  }
  return {
    title: 'Đang chờ xác nhận thanh toán', icon: 'schedule',
    description: 'VNPay đang gửi kết quả về hệ thống. Vui lòng không thanh toán thêm trong lúc chờ xác nhận.',
  }
}

export function vnpayCheckoutError(error) {
  if (error?.status === 503) return 'VNPay hiện chưa sẵn sàng. Bạn có thể thử lại sau hoặc chọn chuyển khoản thủ công bên dưới.'
  if (error?.status === 409) return 'Đơn không còn ở trạng thái chờ thanh toán. Vui lòng tải lại chi tiết đơn trước khi tiếp tục.'
  if (error?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để thanh toán.'
  if (error?.status === 403) return 'Bạn không có quyền thanh toán đơn mua gói của tiệm này.'
  return 'Chưa mở được trang thanh toán VNPay. Vui lòng thử lại hoặc tải lại chi tiết đơn.'
}

export function rememberVnpayCheckout(checkout, bakeryId, storage) {
  try { (storage ?? globalThis.sessionStorage)?.setItem('bakery-vnpay-' + checkout.attemptId, JSON.stringify({ orderId: checkout.orderId, bakeryId })) } catch { /* Navigation works without storage. */ }
}

export function vnpayOrderRoute(result, storage) {
  try {
    const context = JSON.parse((storage ?? globalThis.sessionStorage)?.getItem('bakery-vnpay-' + result.attemptId) || 'null')
    if (context?.orderId === result.orderId) {
      requireSubscriptionId(context.bakeryId, 'Mã cửa hàng')
      return 'vendor-subscription?' + new URLSearchParams({ bakeryId: context.bakeryId, orderId: result.orderId })
    }
  } catch { /* Use the existing bakery selector when this browser has no checkout context. */ }
  return 'vendor-subscription'
}
