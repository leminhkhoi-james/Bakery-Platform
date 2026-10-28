import { ApiError } from './apiClient.js'
import { catalogMoney, isCatalogId, mapCatalogPage } from './catalogModels.js'
import { requireId, requireText, text } from './managementModels.js'

export const REQUEST_STATUSES = ['DRAFT', 'OPEN', 'OFFER_SELECTED', 'CLOSED', 'CANCELLED']
export const OFFER_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED']
export const REQUEST_TYPES = ['OPEN_CUSTOM', 'TARGETED_PRODUCT_CUSTOM']
export const moneyVnd = (value) => value == null ? 'Chưa có giá' : Number(value).toLocaleString('vi-VN') + ' VND'
export const toLocalInput = (value) => value && Number.isFinite(Date.parse(value)) ? new Date(Date.parse(value) - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
export function futureDate(value, label) {
  if (!value || !Number.isFinite(Date.parse(value)) || Date.parse(value) <= Date.now()) throw new ApiError(label + ' phải ở tương lai.', 422)
  return new Date(value).toISOString()
}
export function decimalMoney(value, label, optional = false) {
  if (optional && (value === '' || value == null)) return null
  if (!['number', 'string'].includes(typeof value) || !/^\d{1,10}(\.\d{1,2})?$/.test(String(value))) throw new ApiError(label + ' cần số không âm, tối đa 10 chữ số nguyên và 2 số lẻ.', 422)
  return Number(value)
}
const optionalId = (value) => value ? requireId(value) : null
const safeUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null
export function rfqPayload(input) {
  if (!REQUEST_TYPES.includes(input.requestType)) throw new ApiError('Loại RFQ không hợp lệ.', 422)
  const body = { requestType: input.requestType, title: requireText(input.title, 'Tiêu đề', 180), description: requireText(input.description, 'Mô tả', 10000), neededAt: futureDate(input.neededAt, 'Ngày cần bánh'), deliveryDistrict: requireText(input.deliveryDistrict, 'Quận/huyện', 120), deliveryCity: requireText(input.deliveryCity, 'Tỉnh/thành', 120) }
  body.budgetMin = decimalMoney(input.budgetMin, 'Ngân sách tối thiểu', true); body.budgetMax = decimalMoney(input.budgetMax, 'Ngân sách tối đa', true)
  if (body.budgetMin != null && body.budgetMax != null && body.budgetMin > body.budgetMax) throw new ApiError('Ngân sách tối thiểu không được vượt tối đa.', 422)
  body.offerDeadline = input.offerDeadline ? futureDate(input.offerDeadline, 'Hạn nhận báo giá') : null
  if (body.offerDeadline && Date.parse(body.offerDeadline) >= Date.parse(body.neededAt)) throw new ApiError('Hạn nhận báo giá phải trước ngày cần bánh.', 422)
  body.occasion = input.occasion ? requireText(input.occasion, 'Dịp', 100) : null
  body.servingSize = input.servingSize === '' || input.servingSize == null ? null : Number(input.servingSize)
  if (body.servingSize != null && (!Number.isInteger(body.servingSize) || body.servingSize < 1)) throw new ApiError('Khẩu phần phải là số nguyên dương.', 422)
  body.targetBakeryId = optionalId(input.targetBakeryId); body.baseProductId = optionalId(input.baseProductId)
  if (input.optionSelections != null && !Array.isArray(input.optionSelections)) throw new ApiError('Tùy chọn phải là danh sách.', 422)
  body.optionSelections = (input.optionSelections || []).map((option) => ({ optionGroupId: requireId(option?.optionGroupId), optionValueId: requireId(option?.optionValueId), quantity: Number(option?.quantity) }))
  if (body.optionSelections.length > 100 || body.optionSelections.some((option) => !Number.isInteger(option.quantity) || option.quantity < 1)) throw new ApiError('Tùy chọn không hợp lệ.', 422)
  if (body.requestType === 'OPEN_CUSTOM' && (body.targetBakeryId || body.baseProductId || body.optionSelections.length)) throw new ApiError('OPEN_CUSTOM không có bakery/product/options đích.', 422)
  if (body.requestType === 'TARGETED_PRODUCT_CUSTOM' && (!body.targetBakeryId || !body.baseProductId)) throw new ApiError('RFQ theo sản phẩm cần bakeryId và productId thật.', 422)
  if (input.preference) {
    const preference = {}
    for (const [key, max] of Object.entries({ cakeSize: 80, cakeShape: 80, flavor: 120, filling: 120, frosting: 120, colorPalette: 255, decorationNotes: 4000, allergyNotes: 4000 })) {
      const value = input.preference[key]
      if (value != null && (typeof value !== 'string' || value.length > max)) throw new ApiError('Preference ' + key + ' không hợp lệ.', 422)
      if (value != null) preference[key] = value
    }
    preference.extraOptions = input.preference.extraOptions || {}
    body.preference = preference
  }
  return body
}
export function offerPayload(input, create = true) {
  const body = { cakePrice: decimalMoney(input.cakePrice, 'Giá bánh'), deliveryFee: decimalMoney(input.deliveryFee, 'Phí giao hàng'), estimatedCompletionAt: futureDate(input.estimatedCompletionAt, 'Thời gian hoàn thành'), expiresAt: futureDate(input.expiresAt, 'Hạn báo giá'), message: input.message || '' }
  if (typeof body.message !== 'string' || body.message.length > 4000) throw new ApiError('Mô tả báo giá tối đa 4000 ký tự.', 422)
  if (create) body.bakeryId = requireId(input.bakeryId, 'Cửa hàng')
  if (input.items != null && !Array.isArray(input.items)) throw new ApiError('Phụ kiện phải là danh sách.', 422)
  body.items = (input.items || []).map((item) => ({ addOnId: requireId(item?.addOnId), quantity: Number(item?.quantity) }))
  if (body.items.length > 100 || body.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) throw new ApiError('Phụ kiện báo giá không hợp lệ.', 422)
  return body
}
export function mapRequest(dto, detail = false) {
  if (!isCatalogId(dto?.id) || (detail && !isCatalogId(dto.customerId))) throw new ApiError('CakeRequest DTO không hợp lệ.', 502)
  const result = { id: dto.id }
  for (const key of ['customerId', 'targetBakeryId', 'baseProductId', 'selectedDesignId']) result[key] = isCatalogId(dto[key]) ? dto[key] : null
  for (const key of ['requestType', 'title', 'description', 'occasion', 'neededAt', 'deliveryDistrict', 'deliveryCity', 'status', 'offerDeadline', 'createdAt', 'updatedAt']) result[key] = text(dto[key])
  for (const key of ['budgetMin', 'budgetMax']) result[key] = catalogMoney(dto[key])
  result.servingSize = Number.isInteger(dto.servingSize) ? dto.servingSize : null
  if (detail) {
    if (!['images', 'statusHistory', 'optionSelections', 'offers'].every((key) => Array.isArray(dto[key]))) throw new ApiError('RFQ detail thiếu danh sách theo DTO.', 502)
    result.preference = dto.preference ?? null; result.optionSelections = dto.optionSelections; result.offers = dto.offers
    result.images = dto.images.map((image) => ({ ...image, url: safeUrl(image.url) })); result.statusHistory = dto.statusHistory
  }
  return result
}
export function mapOffer(dto, detail = false) {
  if (!['id', 'bakeryId', 'cakeRequestId'].every((key) => isCatalogId(dto?.[key]))) throw new ApiError('Offer DTO không hợp lệ.', 502)
  const result = { id: dto.id, bakeryId: dto.bakeryId, cakeRequestId: dto.cakeRequestId }
  for (const key of ['message', 'estimatedCompletionAt', 'expiresAt', 'status', 'createdAt', 'updatedAt']) result[key] = text(dto[key])
  for (const key of ['cakePrice', 'deliveryFee', 'addOnTotal', 'totalPrice']) result[key] = catalogMoney(dto[key])
  if (detail) {
    if (!Array.isArray(dto.items) || !Array.isArray(dto.statusHistory)) throw new ApiError('Offer detail thiếu items/statusHistory.', 502)
    result.items = dto.items.map((item) => ({ ...item, unitPrice: catalogMoney(item.unitPrice), lineTotal: catalogMoney(item.lineTotal) })); result.statusHistory = dto.statusHistory
  }
  return result
}
export const mapMarketplacePage = mapCatalogPage
export const ownsRequest = (request, user) => user?.roles?.includes('CUSTOMER') && request.customerId === user.id
export const editableRequest = (request, user) => ownsRequest(request, user) && request.status === 'DRAFT'
export const requestAcceptsOffers = (request, now = Date.now()) => request.status === 'OPEN' && Date.parse(request.neededAt) > now && (!request.offerDeadline || Date.parse(request.offerDeadline) > now)
export const pendingOffer = (offer, now = Date.now()) => offer.status === 'PENDING' && Date.parse(offer.expiresAt) > now
export const acceptableOffer = (offer, request, user, now = Date.now()) => ownsRequest(request, user) && request.status === 'OPEN' && Date.parse(request.neededAt) > now && pendingOffer(offer, now)
