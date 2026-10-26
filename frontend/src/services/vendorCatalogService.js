import { api, ApiError } from './apiClient.js'
import { requireId, validateImage } from './managementModels.js'
import { mapManagedList, catalogEntityPayload, optionsPayload, mapOptions } from './vendorCatalogModels.js'
const root = (bakeryId) => '/bakeries/' + requireId(bakeryId)
const path = (bakeryId, kind) => {
  if (!['categories', 'add-ons', 'members'].includes(kind)) throw new ApiError('Loại quản lý không hợp lệ.', 400)
  return root(bakeryId) + '/' + kind
}
export const vendorCatalogService = {
  async list(bakeryId, kind, options = {}) { return mapManagedList(await api.get(path(bakeryId, kind), options), kind) },
  async save(bakeryId, kind, id, input) {
    const body = catalogEntityPayload(kind, input, !id), endpoint = path(bakeryId, kind)
    const data = id ? await api.patch(endpoint + '/' + requireId(id), body) : await api.post(endpoint, body)
    mapManagedList([data], kind); if (id && data.id !== id.toLowerCase()) throw new ApiError('Backend trả sai bản ghi quản lý.', 502)
    return data
  },
  remove(bakeryId, kind, id) { return api.delete(path(bakeryId, kind) + '/' + requireId(id)) },
  async uploadAddOn(bakeryId, id, file) {
    const form = new FormData(); form.append('file', validateImage(file))
    const data = await api.post(path(bakeryId, 'add-ons') + '/' + requireId(id) + '/image', form)
    if (typeof data?.url !== 'string') throw new ApiError('Backend chưa trả URL ảnh phụ kiện.', 502)
    return data
  },
  async getProductSnapshot(bakeryId, productId, options = {}) {
    const dto = await api.get('/products/' + requireId(productId), { ...options, auth: false, retryAuth: false })
    if (dto?.product?.id !== productId || dto.bakeryId !== bakeryId || !Array.isArray(dto.images) || !Array.isArray(dto.options?.groups)) throw new ApiError('Snapshot ảnh/options không khớp sản phẩm.', 502)
    return { images: mapManagedList(dto.images), options: mapOptions(dto.options) }
  },
  async saveOptions(bakeryId, productId, input) {
    const data = await api.put(root(bakeryId) + '/products/' + requireId(productId) + '/options', optionsPayload(input))
    return mapOptions(data)
  },
  deleteImage(bakeryId, productId, imageId) { return api.delete(root(bakeryId) + '/products/' + requireId(productId) + '/images/' + requireId(imageId)) },
}
export const loadCatalogEntities = ({ bakeryId, kind }, options) => vendorCatalogService.list(bakeryId, kind, options)
export const loadProductSnapshot = ({ bakeryId, productId, fresh }, options) => fresh ? Promise.resolve(null) : vendorCatalogService.getProductSnapshot(bakeryId, productId, options)

