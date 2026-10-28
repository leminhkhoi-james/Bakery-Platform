import { DemoError } from './store.js'

export const emptyAddress = (user, primary = false) => ({ title: '', recipientName: user?.displayName || user?.fullName || user?.name || '', recipientPhone: '', addressLine: '', ward: '', district: '', city: '', deliveryNote: '', primary })

export const selectedAddress = (addresses, id) => addresses.find((address) => address.id === id) || addresses.find((address) => address.primary) || addresses[0] || null
export const addressTitle = (address) => (address?.title || 'Địa chỉ nhận bánh').replace(/\s*\(mặc định\)/gi, '').trim()
export function formatAddress(address) {
  const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\btp hcm\b|\btp ho chi minh\b|\bho chi minh\b/g, 'hochiminh')
  const parts = []
  for (const value of [address?.addressLine, address?.ward, address?.district, address?.city]) {
    if (value?.trim() && !(' ' + normalize(parts.join(' ')) + ' ').includes(' ' + normalize(value) + ' ')) parts.push(value.trim())
  }
  return parts.join(', ')
}

export function normalizeAddressDefault(addresses, customerId, preferredId) {
  const own = addresses.filter((address) => address.customerId === customerId)
  const chosen = selectedAddress(own, preferredId)
  for (const address of own) address.primary = address.id === chosen?.id
}

export function addressPayload(input) {
  const payload = {}
  for (const [field, label] of [['title', 'Tên địa chỉ'], ['recipientName', 'Người nhận'], ['recipientPhone', 'Số điện thoại'], ['addressLine', 'Địa chỉ'], ['ward', 'Phường/xã'], ['district', 'Quận/huyện'], ['city', 'Tỉnh/thành']]) {
    const value = typeof input[field] === 'string' ? input[field].trim() : ''
    if ((field !== 'ward' && !value) || value.length > 255) throw new DemoError(label + ' không được trống và tối đa 255 ký tự.')
    payload[field] = value
  }
  if (!/^\+?\d{9,15}$/.test(payload.recipientPhone.replace(/[\s().-]/g, ''))) throw new DemoError('Số điện thoại cần từ 9–15 chữ số.')
  const note = input.deliveryNote ?? ''
  if (typeof note !== 'string' || note.trim().length > 500) throw new DemoError('Ghi chú giao hàng tối đa 500 ký tự.')
  payload.deliveryNote = note.trim()
  payload.primary = input.primary === true
  return payload
}
