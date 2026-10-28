import { ApiError } from './apiClient.js'
import { catalogMoney, isCatalogId } from './catalogModels.js'
import { requireId, text } from './managementModels.js'

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED']
export const ORDER_SOURCES = ['DIRECT_CATALOG', 'ACCEPTED_OFFER']
export const REVIEW_STATUSES = ['PUBLISHED', 'HIDDEN', 'DELETED']
export function mapReview(dto) {
  if (!isCatalogId(dto?.orderId) || !isCatalogId(dto?.customerId) || !Number.isInteger(dto.rating) || dto.rating < 1 || dto.rating > 5 || !REVIEW_STATUSES.includes(dto.status)) throw new ApiError('ReviewResponse không hợp lệ.', 502)
  return { orderId: dto.orderId, customerId: dto.customerId, rating: dto.rating, comment: text(dto.comment), status: dto.status, createdAt: text(dto.createdAt), updatedAt: text(dto.updatedAt) }
}
export function reviewPayload(input) {
  const rating = Number(input.rating), comment = input.comment ?? ''
  if (!['number', 'string'].includes(typeof input.rating) || input.rating === '' || !Number.isInteger(rating) || rating < 1 || rating > 5 || typeof comment !== 'string' || comment.length > 5000) throw new ApiError('Chọn 1–5 sao; nhận xét tối đa 5000 ký tự.', 400)
  return { rating, comment }
}
export function reviewPermissions(order, user) {
  const own = user?.roles?.includes('CUSTOMER') && order.customerId === user.id
  return { create: Boolean(own && order.status === 'COMPLETED' && !order.review), edit: Boolean(own && order.review?.status === 'PUBLISHED'), delete: Boolean(own && order.review && order.review.status !== 'DELETED') }
}
export const orderStatusLabel = (value) => ({ PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', BAKING: 'Đang làm bánh', READY: 'Sẵn sàng giao', DELIVERING: 'Đang giao', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy' }[value] || value || 'Chưa rõ trạng thái')
const transitions = { PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['BAKING', 'CANCELLED'], BAKING: ['READY'], READY: ['DELIVERING'], DELIVERING: ['COMPLETED'], COMPLETED: [], CANCELLED: [] }
export function allowedOrderActions(order, user, scope) {
  if (!user || user.roles?.includes('ADMIN')) return []
  const available = transitions[order.status] || []
  // Backend checks own CUSTOMER permissions before bakery roles.
  if (user.roles?.includes('CUSTOMER') && order.customerId === user.id && !user.roles.includes('ADMIN')) return []
  if (scope === 'bakery' && user.roles?.some((role) => ['BAKERY_OWNER'].includes(role))) return available
  return []
}
export function mapOrder(dto, detail = false) {
  if (!isCatalogId(dto?.id) || !isCatalogId(dto?.bakeryId) || !isCatalogId(dto?.customerId)) throw new ApiError('Order DTO thiếu ID hợp lệ.', 502)
  const order = { id: dto.id, bakeryId: dto.bakeryId, customerId: dto.customerId }
  for (const key of ['orderNumber', 'bakeryName', 'customerName', 'customerPhone', 'customerNote', 'status', 'orderSource', 'currency', 'neededAt', 'createdAt', 'acceptedAt', 'completedAt']) order[key] = text(dto[key])
  for (const key of ['subtotal', 'deliveryFee', 'totalAmount']) order[key] = catalogMoney(dto[key])
  if (detail) {
    if (!Array.isArray(dto.items) || !Array.isArray(dto.statusHistory)) throw new ApiError('Order detail thiếu items/statusHistory.', 502)
    order.items = dto.items.map((item) => {
      if (!isCatalogId(item?.id)) throw new ApiError('Order item không hợp lệ.', 502)
      return { id: item.id, sourceProductId: item.sourceProductId, name: text(item.name), itemType: text(item.itemType), configuration: item.configuration ?? null, quantity: Number.isInteger(item.quantity) ? item.quantity : null, unitPrice: catalogMoney(item.unitPrice), lineTotal: catalogMoney(item.lineTotal) }
    })
    order.deliveryAddress = dto.deliveryAddress == null ? null : Object.fromEntries(['recipientName', 'recipientPhone', 'addressLine', 'ward', 'district', 'city', 'deliveryNote'].map((key) => [key, text(dto.deliveryAddress[key])]))
    order.statusHistory = dto.statusHistory.map((history) => ({ fromStatus: text(history?.fromStatus), toStatus: text(history?.toStatus), note: text(history?.note), changedAt: text(history?.changedAt) }))
    order.review = dto.review == null ? null : mapReview(dto.review)
    if (order.review && (order.review.orderId !== order.id || order.review.customerId !== order.customerId)) throw new ApiError('Đánh giá không thuộc đơn/khách hàng.', 502)
  }
  return order
}
export function directOrderPayload(input) {
  const body = {}
  for (const field of ['bakeryId', 'productId', 'deliveryAddressId']) body[field] = requireId(input[field], field)
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 100) throw new ApiError('Số lượng bánh phải từ 1 đến 100.', 422)
  body.quantity = input.quantity
  if (!input.requestedDeliveryAt || !Number.isFinite(Date.parse(input.requestedDeliveryAt)) || Date.parse(input.requestedDeliveryAt) <= Date.now()) throw new ApiError('Thời gian giao hàng phải ở tương lai.', 422)
  body.requestedDeliveryAt = new Date(input.requestedDeliveryAt).toISOString()
  if (input.customerNote !== undefined && input.customerNote !== null) {
    if (typeof input.customerNote !== 'string' || input.customerNote.length > 1000) throw new ApiError('Ghi chú tối đa 1000 ký tự.', 400)
    body.customerNote = input.customerNote
  }
  const groups = input.optionSelections || [], addOns = input.addOns || []
  if (!Array.isArray(groups) || !Array.isArray(addOns) || groups.length > 20 || addOns.length > 20) throw new ApiError('Tối đa 20 nhóm tùy chọn hoặc phụ kiện.', 422)
  const groupIds = new Set(), addOnIds = new Set()
  body.optionSelections = groups.map((group) => {
    const id = requireId(group.optionGroupId)
    if (groupIds.has(id) || !Array.isArray(group.optionValueIds) || !group.optionValueIds.length) throw new ApiError('Nhóm tùy chọn bị trùng hoặc thiếu giá trị.', 422)
    groupIds.add(id)
    const values = group.optionValueIds.map((value) => requireId(value))
    if (new Set(values).size !== values.length) throw new ApiError('Giá trị tùy chọn bị trùng.', 422)
    return { optionGroupId: id, optionValueIds: values }
  })
  body.addOns = addOns.map((item) => {
    const id = requireId(item.addOnId)
    if (addOnIds.has(id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new ApiError('Phụ kiện bị trùng hoặc sai số lượng.', 422)
    addOnIds.add(id)
    return { addOnId: id, quantity: item.quantity }
  })
  return body
}
