export function addOnLimit(addOn) {
  return Number.isInteger(addOn.stockQuantity) && addOn.stockQuantity > 0 ? Math.min(100, addOn.stockQuantity) : 0
}

const normalizedName = addOn => String(addOn.name || '').normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()

export function isCustomerAddOn(addOn) {
  const name = normalizedName(addOn)
  return String(addOn.category || '').toUpperCase() !== 'CARD' && !/^thiep(?:\s|$)/.test(name) && !/(?:^|\s)nen so(?:\s|$)/.test(name)
}

export const addOnUnit = addOn => /(?:^bo\s|(?:^|\s)nen(?:\s|$))/.test(normalizedName(addOn)) ? 'bộ' : 'cái'

export const addOnDisplayName = addOn => ['bo nen sinh nhat', 'nen sinh nhat demo'].includes(normalizedName(addOn)) ? 'Bộ nến thẳng' : addOn.name

export function addOnSelectionError(addOn, quantity) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) return 'Số lượng ' + addOn.name + ' phải từ 1 đến 100.'
  if (!Number.isInteger(addOn.stockQuantity) || addOn.stockQuantity === 0) return addOn.name + ' hiện chưa khả dụng. Vui lòng bỏ chọn phụ kiện này.'
  if (quantity > addOn.stockQuantity) return 'Số lượng ' + addOn.name + ' vượt mức có thể đặt. Vui lòng giảm số lượng hoặc bỏ chọn.'
  return ''
}

export const cartLineSubtotal = item => (Math.round(Number(item.price) * 100) * Number(item.quantity) + Math.round(Number(item.addOnSubtotal || 0) * 100)) / 100
