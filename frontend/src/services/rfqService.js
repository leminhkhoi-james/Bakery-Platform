import { MOCK_RFQS } from '../mockData/vendor/rfqs.js'

export const rfqService = {
  async getRfqs() {
    return Promise.resolve([...MOCK_RFQS])
  },

  async createRfq(rfqData) {
    const newRfq = {
      id: `#RFQ-${Date.now().toString().slice(-6)}`,
      status: 'OPEN',
      bidsSent: 0,
      maxBids: 5,
      createdAt: new Date().toISOString(),
      ...rfqData,
    }
    MOCK_RFQS.unshift(newRfq)
    return Promise.resolve(newRfq)
  },

  async cancelRfq(rfqId, reason) {
    const rfq = MOCK_RFQS.find((r) => r.id === rfqId)
    if (rfq) {
      rfq.status = 'CANCELLED'
      rfq.cancelReason = reason
    }
    return Promise.resolve(rfq || null)
  },
}
