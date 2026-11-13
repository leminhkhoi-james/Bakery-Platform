import { ApiError } from './apiClient.js'

export const defaultGiftAccessories = () => ({ candleType: 'STRAIGHT', candleNumber: '' })

export function giftAccessoriesError(value) {
  if (!['STRAIGHT', 'NUMBER'].includes(value?.candleType)) return 'Vui lòng chọn loại nến tặng kèm.'
  if (value.candleType === 'NUMBER' && !/^\d{1,3}$/.test(String(value.candleNumber ?? '').trim())) return 'Vui lòng nhập số tuổi từ 0 đến 999 cho nến số.'
  return ''
}

export function giftAccessoriesLabel(value) {
  if (value?.candleType === 'STRAIGHT') return 'Nến thẳng'
  if (value?.candleType === 'NUMBER') return giftAccessoriesError(value) ? 'Nến số (chưa nhập tuổi)' : 'Nến số ' + String(value.candleNumber).trim()
  return 'Chưa chọn nến'
}

function giftNote(value) {
  return value && !giftAccessoriesError(value) ? 'Phụ kiện tặng kèm: bộ dĩa/nĩa và ' + giftAccessoriesLabel(value).toLowerCase() + '.' : ''
}

export function noteLimitWithGift(items) {
  return 1000 - Math.max(0, ...items.map(item => { const footer = giftNote(item.giftAccessories); return footer ? footer.length + 2 : 0 }))
}

export function orderNoteWithGift(customerNote, giftAccessories) {
  if (giftAccessories == null) return customerNote
  const error = giftAccessoriesError(giftAccessories)
  if (error) throw new ApiError(error, 422)
  if (customerNote != null && typeof customerNote !== 'string') throw new ApiError('Ghi chú phải là văn bản.', 400)
  const note = [customerNote?.trim(), giftNote(giftAccessories)].filter(Boolean).join('\n\n')
  if (note.length > 1000) throw new ApiError('Ghi chú quá dài. Vui lòng rút gọn để lưu cả lựa chọn nến tặng kèm.', 400)
  return note
}
