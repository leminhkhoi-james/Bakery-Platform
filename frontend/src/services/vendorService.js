import { api } from './apiClient.js'
import { publicationAdminService } from './publicationAdminService.js'
import { catalogDetailPath, catalogQuery, mapBakery, mapCatalogPage } from './catalogModels.js'
import { subscriptionService } from './subscriptionService.js'

export const vendorService = {
  /**
   * Get bakeries list
   * Calls GET /api/v1/bakeries
   */
  async getVendors(params = {}, options = {}) {
    const query = catalogQuery(params, ['query', 'city', 'district', 'page', 'size', 'sort'])
    const data = await api.get('/bakeries' + query, { ...options, auth: false, retryAuth: false })
    return mapCatalogPage(data, mapBakery)
  },

  /**
   * Get bakery detail by ID
   * Calls GET /api/v1/bakeries/{bakeryId}
   */
  async getVendorById(bakeryId, options = {}) {
    const data = await api.get(catalogDetailPath('bakeries', bakeryId), { ...options, auth: false, retryAuth: false })
    return mapBakery(data)
  },

  /**
   * Approve a vendor (Admin only)
   */
  async approveVendor(vendorId) {
    const { bakery } = await publicationAdminService.getBakery(vendorId)
    return publicationAdminService.changeBakeryStatus(bakery, 'ACTIVE')
  },

  /**
   * Get public subscription plans for bakeries
   * Calls GET /api/v1/subscription-plans
   */
  getSubscriptionPlans(options) {
    return subscriptionService.getPlans(options)
  },
}

export const loadBakeries = (params, options) => vendorService.getVendors(params, options)
export const loadBakery = ({ id }, options) => vendorService.getVendorById(id, options)
