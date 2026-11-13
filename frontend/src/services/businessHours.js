import { vendorService } from './vendorService.js'
import { ApiError } from './apiClient.js'

// dayOfWeek follows the backend contract: 1 = Thứ Hai … 7 = Chủ Nhật.
export const DAY_LABELS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
const hhmm = (value) => typeof value === 'string' ? value.slice(0, 5) : ''

export function businessHoursOf(bakery) {
  const hours = bakery?.operations?.businessHours
  return Array.isArray(hours) ? hours : []
}

export function formatBusinessHours(hours) {
  return DAY_LABELS.map((label, index) => {
    const row = hours.find(item => Number(item.dayOfWeek) === index + 1)
    return label + ': ' + (!row || row.closed ? 'Nghỉ' : hhmm(row.opensAt) + '–' + hhmm(row.closesAt))
  }).join(' · ')
}

// Delivery times and weekly opening hours use Vietnam time, including when the
// customer's browser runs in another timezone.
export function checkDeliveryWithinHours(value, hours, bakeryName = 'Tiệm bánh') {
  if (!Array.isArray(hours) || !hours.length) return `${bakeryName} chưa thiết lập giờ nhận bánh. Vui lòng liên hệ tiệm trước khi đặt hàng.`
  const local = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(value)
  const date = value instanceof Date ? value : new Date(local ? value + '+07:00' : value)
  if (!Number.isFinite(date.getTime())) return 'Thời gian nhận bánh không hợp lệ.'
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(part => [part.type, part.value]))
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday) + 1
  const row = hours.find(item => Number(item.dayOfWeek) === day)
  const label = DAY_LABELS[day - 1]
  if (!row || row.closed || !row.opensAt || !row.closesAt) return `${bakeryName} nghỉ vào ${label}. Vui lòng chọn ngày tiệm hoạt động.`
  const time = parts.hour + ':' + parts.minute + ':' + parts.second
  const opens = hhmm(row.opensAt), closes = hhmm(row.closesAt)
  const seconds = value => value.length === 5 ? value + ':00' : value.slice(0, 8)
  if (time < seconds(row.opensAt) || time > seconds(row.closesAt)) return `${bakeryName} chỉ giao bánh trong giờ hoạt động ${label} (${opens}–${closes}).`
  return null
}

export async function verifyDeliveryWithinHours(bakeryId, value, options = {}) {
  const bakeries = await loadBakeriesHours({ ids: [bakeryId] }, options)
  const bakery = bakeries[bakeryId]
  const error = checkDeliveryWithinHours(value, bakery.hours, bakery.name)
  if (error) throw new ApiError(error, 422)
}

export async function loadBakeriesHours({ ids }, options) {
  const result = {}
  for (const id of ids) {
    const bakery = await vendorService.getVendorById(id, options)
    result[id] = { name: bakery.name, hours: businessHoursOf(bakery) }
  }
  return result
}

