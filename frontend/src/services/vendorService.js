import { api } from './apiClient.js'
import { MOCK_VENDORS } from '../mockData/admin/vendors.js'

export const vendorService = {
  /**
   * Get bakeries list
   * Calls GET /api/v1/bakeries
   */
  async getVendors(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.query) queryParams.set('query', params.query)
    if (params.city) queryParams.set('city', params.city)
    if (params.district) queryParams.set('district', params.district)
    if (params.page) queryParams.set('page', params.page)
    if (params.size) queryParams.set('size', params.size)
    if (params.sort) queryParams.set('sort', params.sort)

    const qs = queryParams.toString()
    const endpoint = `/bakeries${qs ? `?${qs}` : ''}`

    try {
      const response = await api.get(endpoint)
      if (response && Array.isArray(response.results)) {
        return response.results
      }
      if (Array.isArray(response)) {
        return response
      }
      return [...MOCK_VENDORS]
    } catch {
      return [...MOCK_VENDORS]
    }
  },

  /**
   * Get bakery detail by ID
   * Calls GET /api/v1/bakeries/{bakeryId}
   */
  async getVendorById(bakeryId) {
    try {
      const response = await api.get(`/bakeries/${bakeryId}`)
      if (response) return response
    } catch {}
    const vendor = MOCK_VENDORS.find((v) => v.id === bakeryId)
    return vendor || null
  },

  /**
   * Approve a vendor (Admin only)
   */
  async approveVendor(vendorId) {
    const vendor = MOCK_VENDORS.find((v) => v.id === vendorId)
    if (vendor) {
      vendor.status = 'active'
      vendor.statusLabel = 'Đang mở lò'
      vendor.verified = true
    }
    return Promise.resolve(vendor || null)
  },

  /**
   * Get public subscription plans for bakeries
   * Calls GET /api/v1/subscription-plans
   */
  async getSubscriptionPlans() {
    try {
      return await api.get('/subscription-plans')
    } catch {
      return []
    }
  },
}
