import { api } from './apiClient.js'
import { MOCK_CAKES } from '../mockData/customer/cakes.js'

export const cakeService = {
  /**
   * Get products list from backend with query, pagination, filters
   * Calls GET /api/v1/products
   */
  async getCakes(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.query) queryParams.set('query', params.query)
    if (params.bakeryId) queryParams.set('bakeryId', params.bakeryId)
    if (params.categoryId) queryParams.set('categoryId', params.categoryId)
    if (params.city) queryParams.set('city', params.city)
    if (params.customizable !== undefined) queryParams.set('customizable', params.customizable)
    if (params.minPrice) queryParams.set('minPrice', params.minPrice)
    if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice)
    if (params.page) queryParams.set('page', params.page)
    if (params.size) queryParams.set('size', params.size)
    if (params.sort) queryParams.set('sort', params.sort)

    const qs = queryParams.toString()
    const endpoint = `/products${qs ? `?${qs}` : ''}`

    try {
      const response = await api.get(endpoint)
      // Check if page result returned: { meta, results }
      if (response && Array.isArray(response.results)) {
        return response.results
      }
      if (Array.isArray(response)) {
        return response
      }
      return [...MOCK_CAKES]
    } catch {
      return [...MOCK_CAKES]
    }
  },

  /**
   * Get product detail by ID
   * Calls GET /api/v1/products/{id}
   */
  async getCakeById(id) {
    try {
      const response = await api.get(`/products/${id}`)
      if (response) return response
    } catch {
      // Fallback to mock cakes
    }
    const cake = MOCK_CAKES.find((c) => c.id === id)
    return cake || null
  },

  /**
   * Search cakes by search text
   */
  async searchCakes(query) {
    if (!query) return this.getCakes()
    try {
      const response = await api.get(`/products?query=${encodeURIComponent(query)}`)
      if (response && Array.isArray(response.results) && response.results.length > 0) {
        return response.results
      }
    } catch {
      // Fallback
    }

    const q = query.toLowerCase()
    const filtered = MOCK_CAKES.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.flavor?.toLowerCase().includes(q) ||
        c.categoryName?.toLowerCase().includes(q)
    )
    return filtered
  },

  /**
   * Get categories for a bakery
   * Calls GET /api/v1/bakeries/{bakeryId}/categories
   */
  async getCategories(bakeryId) {
    try {
      const response = await api.get(`/bakeries/${bakeryId}/categories`)
      return response || []
    } catch {
      return []
    }
  },
}
