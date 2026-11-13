import { api } from './apiClient.js'
import { catalogDetailPath, catalogQuery, mapCatalogPage, mapProduct } from './catalogModels.js'

const filters = ['query', 'bakeryId', 'categoryId', 'city', 'customizable', 'minPrice', 'maxPrice', 'page', 'size', 'sort']

export const cakeService = {
  async getCakes(params = {}, options = {}) {
    const data = await api.get('/products' + catalogQuery(params, filters), { ...options, auth: false, retryAuth: false })
    return mapCatalogPage(data, mapProduct)
  },

  async getCakeById(id, options = {}) {
    const data = await api.get(catalogDetailPath('products', id), { ...options, auth: false, retryAuth: false })
    return mapProduct(data)
  },

  searchCakes(query, params = {}, options = {}) {
    return cakeService.getCakes({ ...params, query }, options)
  },

  // Management endpoint: membership is required; public browsing never calls this.
  getCategories(bakeryId, options = {}) {
    return api.get(catalogDetailPath('bakeries', bakeryId) + '/categories', options)
  },
}

export const loadProducts = (params, options) => cakeService.getCakes(params, options)
export const loadProduct = ({ id }, options) => cakeService.getCakeById(id, options)
