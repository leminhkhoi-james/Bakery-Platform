import { api, ApiError } from './apiClient.js'
import { catalogMoney, isCatalogId, mapProduct } from './catalogModels.js'
import { requireId } from './managementModels.js'

export const ADDRESS_BLOCKER = 'BLOCKED — Backend Identity gốc chưa có API địa chỉ Customer public. Chưa thể chọn/lưu địa chỉ, đặt hàng hoặc chấp nhận báo giá. Cần nhóm backend bổ sung API trả deliveryAddressId thuộc tài khoản; không dùng địa chỉ demo hay UUID tự tạo.'

export async function revalidateCartItem(item, options = {}) {
  const id = requireId(item.productId, 'Sản phẩm trong giỏ')
  requireId(item.bakeryId, 'Cửa hàng trong giỏ')
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new ApiError('Số lượng bánh phải từ 1 đến 100.', 422)
  // Detail completeness matters here: absent configuration is not an empty configuration.
  const dto = await api.get('/products/' + id, { ...options, auth: false, retryAuth: false })
  if (!Array.isArray(dto?.options?.groups) || !Array.isArray(dto?.addOns)) throw new ApiError('Chi tiết sản phẩm thiếu options/addOns để xác minh checkout.', 502)
  if (dto.options.groups.some((group) => !isCatalogId(group?.id) || !Array.isArray(group.values) || !Number.isInteger(group.minimumSelections) || !Number.isInteger(group.maximumSelections) || typeof group.required !== 'boolean' || !['SINGLE', 'MULTIPLE'].includes(group.selectionType))) throw new ApiError('Cấu hình tùy chọn từ backend chưa đầy đủ.', 502)
  const product = mapProduct(dto)
  if (product.id !== id || product.bakeryId !== item.bakeryId || product.status !== 'PUBLISHED') throw new ApiError('Sản phẩm không còn hợp lệ hoặc thuộc cửa hàng khác.', 409)
  const unitPrice = catalogMoney(product.price)
  if (unitPrice === null || unitPrice < 0) throw new ApiError('Sản phẩm chưa có giá hợp lệ.', 422)
  let unitCents = Math.round(unitPrice * 100)
  const selections = item.optionSelections || [], addOns = item.addOns || []
  if (!Array.isArray(selections) || !Array.isArray(addOns) || selections.length > 20 || addOns.length > 20) throw new ApiError('Cấu hình sản phẩm không hợp lệ.', 422)
  const groups = new Map()
  for (const selection of selections) {
    if (groups.has(selection.optionGroupId) || !Array.isArray(selection.optionValueIds) || new Set(selection.optionValueIds).size !== selection.optionValueIds.length) throw new ApiError('Nhóm/giá trị tùy chọn bị trùng.', 422)
    groups.set(selection.optionGroupId, selection.optionValueIds)
  }
  for (const group of product.optionGroups) {
    const selected = groups.get(group.id) || []
    if (selected.length < Math.max(group.minimumSelections ?? 0, group.required ? 1 : 0) || selected.length > (group.maximumSelections ?? (group.selectionType === 'SINGLE' ? 1 : Infinity))) throw new ApiError('Cấu hình bánh đã thay đổi. Vui lòng chọn lại tùy chọn tại chi tiết sản phẩm.', 422)
    for (const valueId of selected) {
      const value = group.values?.find((value) => value.id === valueId && value.active !== false)
      const price = catalogMoney(value?.priceAdjustment)
      if (!value || price === null) throw new ApiError('Tùy chọn không còn khả dụng.', 422)
      unitCents += Math.round(price * 100)
    }
    groups.delete(group.id)
  }
  if (groups.size || unitCents < 0) throw new ApiError('Cấu hình bánh không hợp lệ.', 422)
  let subtotal = unitCents * item.quantity
  const addOnIds = new Set()
  for (const selection of addOns) {
    const addOn = product.addOns.find((addOn) => addOn.id === selection.addOnId)
    const price = catalogMoney(addOn?.price)
    if (!addOn || price === null || price < 0 || addOnIds.has(selection.addOnId) || !Number.isInteger(selection.quantity) || selection.quantity < 1 || selection.quantity > 100) throw new ApiError('Phụ kiện không còn hợp lệ.', 422)
    addOnIds.add(selection.addOnId)
    subtotal += Math.round(price * 100) * selection.quantity
  }
  return { product, subtotal: subtotal / 100, quantity: item.quantity, optionSelections: selections, addOns }
}
