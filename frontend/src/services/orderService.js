import { api, ApiError } from './apiClient.js'
import { catalogQuery } from './catalogModels.js'
import { requireId, mapPage } from './managementModels.js'
import { directOrderPayload, mapOrder, ORDER_STATUSES, mapReview, reviewPayload } from './orderModels.js'

export const orderService = {
  async getOrders(params = {}, options = {}) {
    const bakeryId = params.bakeryId ? requireId(params.bakeryId, 'Cửa hàng') : undefined
    if (params.scope === 'bakery' && !bakeryId) requireId(params.bakeryId, 'Cửa hàng')
    const query = catalogQuery({ ...params, bakeryId }, ['scope', 'bakeryId', 'status', 'orderSource', 'createdFrom', 'createdTo', 'page', 'size', 'sort'])
    const data = mapPage(await api.get('/orders' + query, options), (dto) => mapOrder(dto))
    if (params.scope === 'bakery' && data.result.some((order) => order.bakeryId !== bakeryId)) throw new ApiError('Danh sách đơn trả sai cửa hàng.', 502)
    return data
  },
  async getOrderById(orderId, options = {}) {
    return mapOrder(await api.get('/orders/' + requireId(orderId, 'Đơn hàng'), options), true)
  },
  async createDirectOrder(input, idempotencyKey) {
    const key = requireId(idempotencyKey, 'Idempotency-Key')
    return mapOrder(await api.post('/orders/direct', directOrderPayload(input), { headers: { 'Idempotency-Key': key } }), true)
  },
  async updateOrderStatus(orderId, targetStatus, reason = '') {
    if (!ORDER_STATUSES.includes(targetStatus) || typeof reason !== 'string' || reason.length > 1000) throw new ApiError('Trạng thái hoặc lý do không hợp lệ.', 400)
    return mapOrder(await api.post('/orders/' + requireId(orderId) + '/status-transitions', { targetStatus, reason }), true)
  },
  async saveReview(orderId, input, update = false) {
    const path = '/orders/' + requireId(orderId) + '/review', body = reviewPayload(input)
    const review = mapReview(await (update ? api.patch(path, body) : api.post(path, body)))
    if (review.orderId !== orderId.toLowerCase()) throw new ApiError('Backend trả sai đánh giá.', 502)
    return review
  },
  createReview(orderId, input) { return orderService.saveReview(orderId, input) },
  deleteReview(orderId) { return api.delete('/orders/' + requireId(orderId) + '/review') },
}
export const loadOrders = (params, options) => orderService.getOrders(params, options)
export const loadOrder = ({ orderId }, options) => orderService.getOrderById(orderId, options)
