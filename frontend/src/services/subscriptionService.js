import { api, ApiError } from './apiClient.js'
import { requireSubscriptionId, mapSubscriptionPlan, mapSubscriptionOrders, mapSubscriptionOrder, mapBakerySubscription } from './subscriptionModels.js'

export const subscriptionService = {
  async getPlans(options = {}) {
    const data = await api.get('/subscription-plans', { ...options, auth: false, retryAuth: false })
    if (!Array.isArray(data)) throw new ApiError('Danh sách gói phải là một mảng.', 502)
    return data.map(mapSubscriptionPlan)
  },
  async getPlan(planId, options = {}) {
    return mapSubscriptionPlan(await api.get('/subscription-plans/' + requireSubscriptionId(planId, 'Mã gói'), { ...options, auth: false, retryAuth: false }))
  },
  async getBakerySubscription(bakeryId, options = {}) {
    const data = mapBakerySubscription(await api.get('/bakeries/' + requireSubscriptionId(bakeryId, 'Mã cửa hàng') + '/subscription', options))
    if (data.bakeryId !== bakeryId) throw new ApiError('Subscription trả về sai cửa hàng.', 502)
    return data
  },
  async getOrders(bakeryId, params = {}, options = {}) {
    const query = new URLSearchParams()
    for (const key of ['page', 'size', 'sort', 'status']) if (params[key] !== undefined && params[key] !== '') query.set(key, String(params[key]))
    const data = mapSubscriptionOrders(await api.get('/bakeries/' + requireSubscriptionId(bakeryId, 'Mã cửa hàng') + '/subscription-orders?' + query, options))
    if (data.result.some((order) => order.bakeryId !== bakeryId)) throw new ApiError('Lịch sử trả về sai cửa hàng.', 502)
    return data
  },
  async getOrder(orderId, bakeryId, options = {}) {
    const order = mapSubscriptionOrder(await api.get('/subscription-orders/' + requireSubscriptionId(orderId, 'Mã đơn'), options))
    if (order.id.toLowerCase() !== orderId.toLowerCase()) throw new ApiError('Response trả về sai đơn mua gói.', 502)
    if (order.bakeryId !== bakeryId) throw new ApiError('Đơn mua gói không thuộc cửa hàng đã chọn.', 403)
    return order
  },
  async createOrder({ bakeryId, planId, key }) {
    requireSubscriptionId(key, 'Idempotency-Key')
    const order = mapSubscriptionOrder(await api.post('/bakeries/' + requireSubscriptionId(bakeryId, 'Mã cửa hàng') + '/subscription-orders', {
      planId: requireSubscriptionId(planId, 'Mã gói'),
    }, { headers: { 'Idempotency-Key': key } }))
    if (order.bakeryId !== bakeryId || order.planId !== planId) throw new ApiError('Đơn mua gói trả về không khớp yêu cầu.', 502)
    return order
  },
  async submitPayment({ orderId, amount, currency, paymentMethod, paymentReference, proof, key }) {
    requireSubscriptionId(key, 'Idempotency-Key')
    requireSubscriptionId(orderId, 'Mã đơn')
    if (!paymentMethod?.trim() || paymentMethod.trim().length > 50 || !Number.isFinite(Number(amount)) || !(Number(amount) > 0) || typeof currency !== 'string' || currency.length !== 3) throw new ApiError('Thiếu phương thức hoặc số tiền/thông tin tiền tệ của đơn.', 400)
    if (!paymentReference?.trim() && !proof) throw new ApiError('Cần mã giao dịch thực tế hoặc chứng từ thanh toán.', 422)
    if (paymentReference?.trim().length > 120) throw new ApiError('Mã giao dịch tối đa 120 ký tự.', 400)
    if (proof && (proof.size < 1 || proof.size > 10 * 1024 * 1024 || !['image/png', 'image/jpeg', 'application/pdf'].includes(proof.type))) throw new ApiError('Chứng từ phải là PNG, JPEG hoặc PDF, tối đa 10 MB.', 400)
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify({ amount, currency, paymentMethod: paymentMethod.trim(), paymentReference: paymentReference?.trim() || null })], { type: 'application/json' }))
    if (proof) form.append('proof', proof)
    const data = await api.post('/subscription-orders/' + orderId + '/payments', form, { headers: { 'Idempotency-Key': key } })
    if (data?.subscriptionOrderId !== orderId || !data.id || !data.status) throw new ApiError('Response chứng từ thanh toán không hợp lệ.', 502)
    return data
  },
}

export const loadSubscriptionPlans = (_params, options) => subscriptionService.getPlans(options)
export const loadBakerySubscription = ({ bakeryId }, options) => subscriptionService.getBakerySubscription(bakeryId, options)
export const loadSubscriptionOrders = ({ bakeryId, ...params }, options) => subscriptionService.getOrders(bakeryId, params, options)
export const loadSubscriptionOrder = ({ orderId, bakeryId }, options) => subscriptionService.getOrder(orderId, bakeryId, options)
