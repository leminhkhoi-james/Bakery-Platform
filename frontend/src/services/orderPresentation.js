import { displayReference } from './displayReference.js'
import { cleanPresentationLabel, publicCopy } from './uiLabels.js'

// Sort copies only. Missing timestamps stay visible after dated events; ties retain source order.
export function orderHistoryEntries(history) {
  if (!Array.isArray(history)) return []
  const time = (event) => event?.changedAt && Number.isFinite(Date.parse(event.changedAt)) ? Date.parse(event.changedAt) : Infinity
  return history.toSorted((a, b) => {
    const first = time(a), second = time(b)
    return first === second ? 0 : first < second ? -1 : 1
  })
}
export function orderHistoryNote(value) {
  const note = publicCopy(cleanPresentationLabel(value))
  return note === 'Order created' ? 'Đơn hàng được tạo.' : note
}
export function orderHistoryActor(event) {
  const name = publicCopy(cleanPresentationLabel(event?.changedByName))
  return typeof name === 'string' && /[\p{L}\p{N}]/u.test(name) && !/[0-9a-f]{8}-[0-9a-f-]{27}/i.test(name) ? name : null
}
export function formatOrderDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Chưa có thời gian'
  const parts = Object.fromEntries(new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value)).map((part) => [part.type, part.value]))
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
}
export function formatOrderMoney(value, currency) {
  if (value == null || String(value).trim() === '' || !Number.isFinite(Number(value)) || !/^[A-Z]{3}$/.test(currency || '')) return 'Chưa có thông tin giá'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency, ...(currency === 'VND' ? { maximumFractionDigits: 0 } : {}) }).format(Number(value))
}
export const orderDisplayNumber = (order) => displayReference(order.id, 'ORD', order.orderNumber)

const fieldNames = { options: 'Tùy chọn', optionSelections: 'Tùy chọn', selectedOptions: 'Tùy chọn', addOns: 'Phụ kiện', size: 'Kích thước', sizeSpec: 'Kích thước', flavor: 'Hương vị', tiers: 'Số tầng', message: 'Chữ trên bánh', note: 'Ghi chú', name: 'Tên', title: 'Tên', groupNameSnapshot: 'Nhóm', valueNameSnapshot: 'Lựa chọn', quantity: 'Số lượng', priceAdjustment: 'Điều chỉnh giá', nameSnapshot: 'Tên', unitPrice: 'Đơn giá', servingSize: 'Số người dùng' }
export function configurationEntries(value, path = '') {
  if (value == null) return []
  if (Array.isArray(value)) return value.flatMap((item) => configurationEntries(item, path))
  if (typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => /(^id$|Id$|Ids$|^currency$|^source$|^backend$|^demo$)/i.test(key) ? [] : configurationEntries(item, [path, fieldNames[key] || 'Tùy chọn'].filter(Boolean).join(' · ')))
  if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value)) return []
  return [{ label: path || 'Tùy chọn', value: typeof value === 'boolean' ? value ? 'Có' : 'Không' : String(value) }]
}
