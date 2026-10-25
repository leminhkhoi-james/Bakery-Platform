import { api } from './apiClient.js'
import { MOCK_ORDERS } from '../mockData/admin/orders.js'

export const orderService = {
  /**
   * Get orders list
   * Calls GET /api/v1/orders
   */
  async getOrders(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.set('page', params.page)
    if (params.size) queryParams.set('size', params.size)
    if (params.scope) queryParams.set('scope', params.scope)
    if (params.bakeryId) queryParams.set('bakeryId', params.bakeryId)
    if (params.status) queryParams.set('status', params.status)
    if (params.orderSource) queryParams.set('orderSource', params.orderSource)
    if (params.sort) queryParams.set('sort', params.sort)

    const qs = queryParams.toString()
    const endpoint = `/orders${qs ? `?${qs}` : ''}`

    try {
      const response = await api.get(endpoint)
      if (response && Array.isArray(response.results)) {
        return response.results
      }
      if (Array.isArray(response)) {
        return response
      }
      return [...MOCK_ORDERS]
    } catch {
      return [...MOCK_ORDERS]
    }
  },

  /**
   * Get order detail by ID
   * Calls GET /api/v1/orders/{orderId}
   */
  async getOrderById(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}`)
      if (response) return response
    } catch {
      // Fallback
    }
    const order = MOCK_ORDERS.find((o) => o.id === orderId)
    return order || null
  },

  /**
   * Create direct catalog order
   * Calls POST /api/v1/orders/direct
   */
  async createDirectOrder(orderData, idempotencyKey = null) {
    const idKey = idempotencyKey || crypto.randomUUID()
    try {
      const response = await api.post('/orders/direct', orderData, {
        headers: {
          'Idempotency-Key': idKey,
        },
      })
      return response
    } catch (error) {
      console.warn('[orderService.createDirectOrder] API failed, fallback to mock:', error.message)
      const newOrder = {
        id: `#ORD-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        status: 'NEW',
        ...orderData,
      }
      MOCK_ORDERS.unshift(newOrder)
      return newOrder
    }
  },

  /**
   * Transition order status
   * Calls POST /api/v1/orders/{orderId}/status-transitions
   */
  async updateOrderStatus(orderId, targetStatus, reason = 'Cập nhật từ hệ thống') {
    try {
      const response = await api.post(`/orders/${orderId}/status-transitions`, {
        targetStatus,
        reason,
      })
      return response
    } catch {
      const order = MOCK_ORDERS.find((o) => o.id === orderId)
      if (order) {
        order.status = targetStatus
      }
      return order || null
    }
  },

  /**
   * Create review for completed order
   * Calls POST /api/v1/orders/{orderId}/review
   */
  async createReview(orderId, reviewData) {
    return api.post(`/orders/${orderId}/review`, reviewData)
  },
}
