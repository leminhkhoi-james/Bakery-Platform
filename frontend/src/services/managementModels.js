import { ApiError } from './apiClient.js'
import { isCatalogId, catalogMoney, mapCatalogPage } from './catalogModels.js'

export const requireId = (value, label = 'ID') => {
  if (!isCatalogId(value)) throw new ApiError(label + ' phải là UUID hợp lệ.', 400)
  return value.toLowerCase()
}
export const text = (value) => typeof value === 'string' ? value : null
export const requireText = (value, label, max = Infinity) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new ApiError(label + ' không hợp lệ.', 400)
  return value.trim()
}
export const mapPage = mapCatalogPage
export const money = (value, currency) => value === null || value === undefined || !currency ? 'Chưa có thông tin giá' : Number(value).toLocaleString('vi-VN') + ' ' + currency
export const dateTime = (value) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('vi-VN') : 'Chưa có thông tin'

export function mapManagedProduct(dto) {
  if (!isCatalogId(dto?.id)) throw new ApiError('ProductDto không hợp lệ.', 502)
  return {
    id: dto.id, categoryId: dto.categoryId ?? null, name: text(dto.name), slug: text(dto.slug),
    description: text(dto.description), basePrice: catalogMoney(dto.basePrice), status: text(dto.status),
    customizable: typeof dto.customizable === 'boolean' ? dto.customizable : null,
    defaultServingSize: dto.defaultServingSize ?? null, minimumNoticeHours: dto.minimumNoticeHours ?? null,
  }
}
export function productPayload(input, create = false) {
  const body = {}
  for (const key of ['name', 'slug', 'description', 'basePrice', 'categoryId', 'customizable', 'defaultServingSize', 'minimumNoticeHours']) {
    if (input[key] !== undefined && input[key] !== null && (input[key] !== '' || key === 'description')) body[key] = input[key]
  }
  if (create || body.name !== undefined) body.name = requireText(body.name, 'Tên sản phẩm', 180)
  if (create || body.slug !== undefined) body.slug = requireText(body.slug, 'Slug', 200)
  if (create || body.basePrice !== undefined) {
    const price = catalogMoney(body.basePrice)
    if (price === null || price < 0) throw new ApiError('Giá sản phẩm phải lớn hơn hoặc bằng 0.', 400)
    body.basePrice = price
  }
  if (body.categoryId !== undefined) body.categoryId = requireId(body.categoryId, 'Danh mục')
  if (body.customizable !== undefined && typeof body.customizable !== 'boolean') throw new ApiError('customizable phải là boolean.', 400)
  for (const field of ['defaultServingSize', 'minimumNoticeHours']) if (body[field] !== undefined) {
    body[field] = Number(body[field])
    if (!Number.isInteger(body[field]) || body[field] < (field === 'defaultServingSize' ? 1 : 0)) throw new ApiError(field + ' không hợp lệ.', 400)
  }
  if (!Object.keys(body).length) throw new ApiError('Chưa có thay đổi sản phẩm.', 400)
  return body
}
export function bakeryPayload(input, create = false) {
  const body = {}
  for (const key of ['name', 'description', 'phoneNumber', 'email']) if (input[key] !== undefined) body[key] = input[key]
  if (create || body.name !== undefined) body.name = requireText(body.name, 'Tên cửa hàng', 180)
  if (create || body.phoneNumber !== undefined) body.phoneNumber = requireText(body.phoneNumber, 'Số điện thoại', 30)
  if (body.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 320)) throw new ApiError('Email không hợp lệ.', 400)
  if (!Object.keys(body).length) throw new ApiError('Chưa có thay đổi hồ sơ.', 400)
  return body
}
export const memberCanEdit = (member, roles = []) => member?.status === 'ACTIVE' && member.memberRole === 'OWNER' && roles.some((role) => ['BAKERY_OWNER'].includes(role))
export const productActions = (status) => ({ DRAFT: ['publish', 'archive'], HIDDEN: ['publish', 'archive'], PUBLISHED: ['hide', 'archive'], ARCHIVED: [] }[status] || [])
export function validateImage(file) {
  if (!file || file.size < 1 || file.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new ApiError('Ảnh phải là PNG/JPEG/WebP, từ 1 byte đến 5 MB.', 400)
  return file
}

export function operationsPayload(input) {
  if (!['addresses', 'serviceAreas', 'businessHours'].every((key) => Array.isArray(input?.[key]))) throw new ApiError('Cần đủ ba danh sách cấu hình vận hành.', 400)
  const optionalId = (row) => row.id ? { id: requireId(row.id) } : {}
  const nonNegative = (value, label) => { const result = catalogMoney(value); if (result === null || result < 0) throw new ApiError(label + ' phải lớn hơn hoặc bằng 0.', 400); return result }
  const boolean = (value) => { if (typeof value !== 'boolean') throw new ApiError('Trường trạng thái phải là boolean.', 400); return value }
  const addresses = input.addresses.map((row) => ({ ...optionalId(row), addressLine: requireText(row.addressLine, 'Địa chỉ', 255), ward: row.ward || null, district: requireText(row.district, 'Quận/huyện', 120), city: requireText(row.city, 'Tỉnh/thành', 120), ...(row.latitude != null ? { latitude: row.latitude } : {}), ...(row.longitude != null ? { longitude: row.longitude } : {}), isPrimary: boolean(row.isPrimary) }))
  if (addresses.filter((row) => row.isPrimary).length > 1) throw new ApiError('Chỉ được chọn một địa chỉ chính.', 422)
  const areaKeys = new Set()
  const serviceAreas = input.serviceAreas.map((row) => {
    const city = requireText(row.city, 'Tỉnh/thành', 120), district = requireText(row.district, 'Quận/huyện', 120)
    const key = city.toLowerCase() + ':' + district.toLowerCase()
    if (areaKeys.has(key)) throw new ApiError('Khu vực giao hàng bị trùng.', 422)
    areaKeys.add(key)
    return { ...optionalId(row), city, district, deliveryFee: nonNegative(row.deliveryFee, 'Phí giao'), minimumOrder: nonNegative(row.minimumOrder, 'Đơn tối thiểu'), active: boolean(row.active) }
  })
  const days = new Set()
  const businessHours = input.businessHours.map((row) => {
    const day = Number(row.dayOfWeek), closed = boolean(row.closed)
    if (!Number.isInteger(day) || day < 1 || day > 7 || days.has(day)) throw new ApiError('Ngày mở cửa phải duy nhất, từ 1 đến 7.', 422)
    days.add(day)
    if (!closed && (!/^\d{2}:\d{2}(:\d{2})?$/.test(row.opensAt || '') || !/^\d{2}:\d{2}(:\d{2})?$/.test(row.closesAt || '') || row.opensAt >= row.closesAt)) throw new ApiError('Giờ mở cửa phải trước giờ đóng cửa.', 422)
    return { dayOfWeek: day, closed, opensAt: row.opensAt || null, closesAt: row.closesAt || null }
  })
  return { addresses, serviceAreas, businessHours }
}
