import { api } from './apiClient.js'
import { MOCK_RFQS } from '../mockData/vendor/rfqs.js'

export const rfqService = {
  /**
   * Get cake requests (RFQs)
   * Calls GET /api/v1/cake-requests
   */
  async getRfqs(filters = {}) {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        queryParams.set(k, v)
      }
    })
    const qs = queryParams.toString()
    const endpoint = `/cake-requests${qs ? `?${qs}` : ''}`

    try {
      const response = await api.get(endpoint)
      if (response && Array.isArray(response.items)) {
        return response.items
      }
      if (response && Array.isArray(response.results)) {
        return response.results
      }
      if (Array.isArray(response)) {
        return response
      }
      return [...MOCK_RFQS]
    } catch {
      return [...MOCK_RFQS]
    }
  },

  /**
   * Get cake request detail by ID
   * Calls GET /api/v1/cake-requests/{id}
   */
  async getRfqById(id) {
    try {
      const response = await api.get(`/cake-requests/${id}`)
      if (response) return response
    } catch {}
    const rfq = MOCK_RFQS.find((r) => r.id === id)
    return rfq || null
  },

  /**
   * Create a new cake request (RFQ)
   * Calls POST /api/v1/cake-requests
   */
  async createRfq(rfqData) {
    try {
      const response = await api.post('/cake-requests', rfqData)
      return response
    } catch (error) {
      console.warn('[rfqService.createRfq] API failed, fallback to mock:', error.message)
      const newRfq = {
        id: `#RFQ-${Date.now().toString().slice(-6)}`,
        status: 'OPEN',
        bidsSent: 0,
        maxBids: 5,
        createdAt: new Date().toISOString(),
        ...rfqData,
      }
      MOCK_RFQS.unshift(newRfq)
      return newRfq
    }
  },

  /**
   * Publish a draft cake request to marketplace
   * Calls POST /api/v1/cake-requests/{id}/publish
   */
  async publishRfq(id) {
    return api.post(`/cake-requests/${id}/publish`, {})
  },

  /**
   * Cancel cake request
   * Calls POST /api/v1/cake-requests/{id}/cancel
   */
  async cancelRfq(rfqId, reason = 'Người dùng hủy yêu cầu') {
    try {
      const response = await api.post(`/cake-requests/${rfqId}/cancel`, { reason })
      return response
    } catch {
      const rfq = MOCK_RFQS.find((r) => r.id === rfqId)
      if (rfq) {
        rfq.status = 'CANCELLED'
        rfq.cancelReason = reason
      }
      return rfq || null
    }
  },

  /**
   * Get offers for cake requests
   * Calls GET /api/v1/offers
   */
  async getOffers(filters = {}) {
    const queryParams = new URLSearchParams(filters)
    const qs = queryParams.toString()
    return api.get(`/offers${qs ? `?${qs}` : ''}`)
  },

  /**
   * Submit an offer/bid for a cake request
   * Calls POST /api/v1/cake-requests/{id}/offers
   */
  async submitOffer(cakeRequestId, offerData) {
    return api.post(`/cake-requests/${cakeRequestId}/offers`, offerData)
  },

  /**
   * Accept an offer
   * Calls POST /api/v1/offers/{id}/accept
   */
  async acceptOffer(offerId, acceptData = {}) {
    return api.post(`/offers/${offerId}/accept`, acceptData)
  },
}
