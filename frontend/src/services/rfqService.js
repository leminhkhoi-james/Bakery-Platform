import { api, ApiError } from './apiClient.js'
import { catalogQuery } from './catalogModels.js'
import { requireId } from './managementModels.js'
import { rfqPayload, offerPayload, mapRequest, mapOffer, mapMarketplacePage } from './marketplaceModels.js'
import { validateReferenceImages } from './marketplaceFiles.js'

const requestPath = (id) => '/cake-requests/' + requireId(id, 'RFQ')
const offerPath = (id) => '/offers/' + requireId(id, 'Báo giá')
export const rfqService = {
  async getRfqs(params = {}, options = {}) { return mapMarketplacePage(await api.get('/cake-requests' + catalogQuery(params, ['scope', 'status', 'requestType', 'city', 'district', 'neededFrom', 'neededTo', 'page', 'size', 'sort']), options), (dto) => mapRequest(dto)) },
  async getRfqById(id, options = {}) { const data = mapRequest(await api.get(requestPath(id), options), true); if (data.id !== id.toLowerCase()) throw new ApiError('RFQ trả về sai ID.', 502); return data },
  async createRfq(input) { return mapRequest(await api.post('/cake-requests', rfqPayload(input)), true) },
  async updateRfq(id, input) { return mapRequest(await api.patch(requestPath(id), rfqPayload(input)), true) },
  async publishRfq(id) { return mapRequest(await api.post(requestPath(id) + '/publish'), true) },
  async cancelRfq(id, reason = '') { if (typeof reason !== 'string' || reason.length > 2000) throw new ApiError('Lý do tối đa 2000 ký tự.', 400); return mapRequest(await api.post(requestPath(id) + '/cancel', { reason }), true) },
  async selectDesign(id, generatedDesignId) { return mapRequest(await api.put(requestPath(id) + '/selected-design', { generatedDesignId: requireId(generatedDesignId) }), true) },
  async uploadImages(id, files) { await validateReferenceImages(files, 10); const form = new FormData(); files.forEach((file) => form.append('files', file)); const data = await api.post(requestPath(id) + '/images', form); if (!Array.isArray(data)) throw new ApiError('Image response không hợp lệ.', 502); return data },
  deleteImage(id, imageId) { return api.delete(requestPath(id) + '/images/' + requireId(imageId)) },
  async getOffers(params = {}, options = {}) { return mapMarketplacePage(await api.get('/offers' + catalogQuery(params, ['scope', 'cakeRequestId', 'bakeryId', 'status', 'page', 'size', 'sort']), options), (dto) => mapOffer(dto)) },
  async getOffer(id, options = {}) { const data = mapOffer(await api.get(offerPath(id), options), true); if (data.id !== id.toLowerCase()) throw new ApiError('Offer trả về sai ID.', 502); return data },
  async submitOffer(id, input) { return mapOffer(await api.post(requestPath(id) + '/offers', offerPayload(input)), true) },
  async updateOffer(id, input) { return mapOffer(await api.patch(offerPath(id), offerPayload(input, false)), true) },
  async withdrawOffer(id, reason = '') { if (typeof reason !== 'string' || reason.length > 2000) throw new ApiError('Lý do tối đa 2000 ký tự.', 400); return mapOffer(await api.post(offerPath(id) + '/withdraw', { reason }), true) },
  async acceptOffer(id, input, key) {
    if (typeof key !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(key)) throw new ApiError('Idempotency-Key không hợp lệ.', 400)
    const body = { deliveryAddressId: requireId(input.deliveryAddressId, 'Địa chỉ giao hàng') }
    if (input.customerNote != null) { if (typeof input.customerNote !== 'string' || input.customerNote.length > 2000) throw new ApiError('Ghi chú tối đa 2000 ký tự.', 400); body.customerNote = input.customerNote }
    const data = await api.post(offerPath(id) + '/accept', body, { headers: { 'Idempotency-Key': key } })
    if (data?.offerId !== id || !data.orderId || !data.orderNumber || data.offerStatus !== 'ACCEPTED') throw new ApiError('Backend chưa xác nhận kết quả Order hợp lệ. Kiểm tra lại trước khi thử tiếp.', 502)
    requireId(data.orderId); return data
  },
  async getAddOns(bakeryId, options = {}) { const data = await api.get('/bakeries/' + requireId(bakeryId) + '/add-ons', options); if (!Array.isArray(data)) throw new ApiError('Add-ons không phải danh sách.', 502); return data },
}
export const loadRfqs = (params, options) => rfqService.getRfqs(params, options)
export const loadRfq = ({ id }, options) => rfqService.getRfqById(id, options)
export const loadOffers = (params, options) => rfqService.getOffers(params, options)
export const loadOffer = ({ id }, options) => rfqService.getOffer(id, options)
export const loadRfqAddOns = ({ bakeryId }, options) => rfqService.getAddOns(bakeryId, options)
