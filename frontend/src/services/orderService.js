import { MOCK_ORDERS } from '../mockData/admin/orders.js'

export const orderService = {
  async getOrders() {
    return Promise.resolve([...MOCK_ORDERS])
  },

  async updateOrderStatus(orderId, nextStatus) {
    const order = MOCK_ORDERS.find((o) => o.id === orderId)
    if (order) {
      order.status = nextStatus
    }
    return Promise.resolve(order || null)
  },

  async createOrder(orderData) {
    const newOrder = {
      id: `#ORD-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      status: 'NEW',
      ...orderData,
    }
    MOCK_ORDERS.unshift(newOrder)
    return Promise.resolve(newOrder)
  },
}
