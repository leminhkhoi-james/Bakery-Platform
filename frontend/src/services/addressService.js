import { api, ApiError } from './apiClient.js'
import { isRealCheckoutId } from './checkoutService.js'

const path = '/users/me/addresses'
const real = { allowMockFallback: false }
const fields = { title: 80, recipientName: 120, recipientPhone: 30, addressLine: 255, ward: 120, district: 120, city: 120 }

function mapAddress(dto) {
  if (!isRealCheckoutId(dto?.id) || typeof dto.isDefault !== 'boolean' ||
      typeof dto.label !== 'string' || Object.keys(fields).some(key => !['title', 'ward'].includes(key) && typeof dto[key] !== 'string')) {
    throw new ApiError('Địa chỉ API trả về không hợp lệ.', 502)
  }
  return { ...dto, title: dto.label, primary: dto.isDefault }
}

export const addressService = {
  async list(options = {}) {
    const rows = await api.get(path, { ...options, ...real })
    if (!Array.isArray(rows)) throw new ApiError('Danh sách địa chỉ không hợp lệ.', 502)
    return rows.map(mapAddress)
  },
  async create(input) {
    const body = { isDefault: input.primary === true }
    for (const [key, max] of Object.entries(fields)) {
      const value = typeof input[key] === 'string' ? input[key].trim() : ''
      if (value.length > max || !value && key !== 'ward') throw new ApiError('Vui lòng kiểm tra các trường địa chỉ bắt buộc.', 422)
      body[key === 'title' ? 'label' : key] = value || null
    }
    return mapAddress(await api.post(path, body, real))
  },
  async verify(id) {
    if (!isRealCheckoutId(id)) throw new ApiError('Vui lòng chọn địa chỉ đã lưu trên hệ thống.', 400)
    const address = mapAddress(await api.get(path + '/' + id, real))
    if (address.id !== id) throw new ApiError('Địa chỉ API trả về không khớp.', 502)
    return address
  },
}
export const loadAddresses = (_params, options) => addressService.list(options)
