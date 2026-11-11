import { phoneError } from './contactValidation.js'
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
    const body = { isDefault: input.primary === true || input.isDefault === true }
    for (const [key, max] of Object.entries(fields)) {
      const value = typeof input[key] === 'string' ? input[key].trim() : ''
      if (value.length > max || !value && key !== 'ward') throw new ApiError('Vui lòng kiểm tra các trường địa chỉ bắt buộc.', 422)
      body[key === 'title' ? 'label' : key] = value || null
    }
    if (phoneError(body.recipientPhone)) throw new ApiError(phoneError(body.recipientPhone), 422)
    return mapAddress(await api.post(path, body, real))
  },
  async update(id, input) {
    if (!isRealCheckoutId(id)) throw new ApiError('Địa chỉ không hợp lệ.', 400)
    const body = {}
    if (typeof input.primary === 'boolean') body.isDefault = input.primary
    if (typeof input.isDefault === 'boolean') body.isDefault = input.isDefault
    for (const [key, max] of Object.entries(fields)) {
      if (input[key] !== undefined) {
        const value = typeof input[key] === 'string' ? input[key].trim() : ''
        if (value.length > max || (!value && key !== 'ward')) throw new ApiError('Vui lòng kiểm tra các trường địa chỉ bắt buộc.', 422)
        body[key === 'title' ? 'label' : key] = value || null
      }
    }
    if (body.recipientPhone !== undefined && phoneError(body.recipientPhone)) throw new ApiError(phoneError(body.recipientPhone), 422)
    return mapAddress(await api.patch(path + '/' + id, body, real))
  },
  async delete(id) {
    if (!isRealCheckoutId(id)) throw new ApiError('Địa chỉ không hợp lệ.', 400)
    await api.delete(path + '/' + id, real)
    return true
  },
  async setDefault(id) {
    if (!isRealCheckoutId(id)) throw new ApiError('Địa chỉ không hợp lệ.', 400)
    return mapAddress(await api.put(path + '/' + id + '/default', null, real))
  },
  async verify(id) {
    if (!isRealCheckoutId(id)) throw new ApiError('Vui lòng chọn địa chỉ đã lưu trên hệ thống.', 400)
    const address = mapAddress(await api.get(path + '/' + id, real))
    if (address.id !== id) throw new ApiError('Địa chỉ API trả về không khớp.', 502)
    return address
  },
}
export const emptyAddress = (user, primary = false) => ({
  title: '',
  recipientName: user?.displayName || user?.fullName || user?.name || '',
  recipientPhone: '',
  addressLine: '',
  ward: '',
  district: '',
  city: '',
  deliveryNote: '',
  primary,
})

export const selectedAddress = (addresses, id) =>
  addresses.find((address) => address.id === id) ||
  addresses.find((address) => address.primary) ||
  addresses[0] ||
  null

export const addressTitle = (address) =>
  (address?.title || 'Địa chỉ nhận bánh').replace(/\s*\(mặc định\)/gi, '').trim()

export function formatAddress(address) {
  if (!address) return ''
  const normalize = (value) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\btp hcm\b|\btp ho chi minh\b|\bho chi minh\b/g, 'hochiminh')
  const parts = []
  for (const value of [address.addressLine, address.ward, address.district, address.city]) {
    if (value?.trim() && !(' ' + normalize(parts.join(' ')) + ' ').includes(' ' + normalize(value) + ' ')) parts.push(value.trim())
  }
  return parts.join(', ')
}

export function normalizeLocationText(text) {
  if (!text) return ''
  let s = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]/g, ' ').trim()
  s = s.replace(/^(?:thanh pho|tp|tinh|quan|huyen|thi xa|tx|district|d)\s+/, '')
  s = s.replace(/^q(?=\d)/, '')
  s = s.replace(/\s+/g, ' ').trim()
  if (['hcm', 'ho chi minh', 'sai gon'].includes(s)) return 'hcm'
  return s
}

export function isAddressMatchingLocation(address, expectedLocation) {
  if (!expectedLocation || (!expectedLocation.city && !expectedLocation.district)) return true
  if (!address) return false
  const expCity = normalizeLocationText(expectedLocation.city)
  const addrCity = normalizeLocationText(address.city)
  const expDist = normalizeLocationText(expectedLocation.district)
  const addrDist = normalizeLocationText(address.district)

  const cityMatches = !expCity || !addrCity || expCity === addrCity || expCity.includes(addrCity) || addrCity.includes(expCity)
  const distMatches = !expDist || !addrDist || expDist === addrDist || expDist.includes(addrDist) || addrDist.includes(expDist)
  return cityMatches && distMatches
}

export const loadAddresses = (_params, options) => addressService.list(options)
