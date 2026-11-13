import { ApiError } from './apiClient.js'
import { isCatalogId } from './catalogModels.js'

export function targetedRequestRoute(product) {
  if (!isCatalogId(product?.id) || !isCatalogId(product.bakeryId) || product.customizable !== true) throw new ApiError('Sản phẩm chưa hỗ trợ yêu cầu tùy chỉnh.', 422)
  return 'rfq-new?' + new URLSearchParams({ baseProductId: product.id, targetBakeryId: product.bakeryId })
}

export function requestContextFromSearch(search = '') {
  const query = new URLSearchParams(search)
  const baseProductId = query.get('baseProductId'), targetBakeryId = query.get('targetBakeryId')
  if (!baseProductId && !targetBakeryId) return {}
  if (!isCatalogId(baseProductId) || !isCatalogId(targetBakeryId)) throw new ApiError('Ngữ cảnh sản phẩm/cửa hàng trong URL không hợp lệ.', 400)
  return { requestType: 'TARGETED_PRODUCT_CUSTOM', baseProductId: baseProductId.toLowerCase(), targetBakeryId: targetBakeryId.toLowerCase() }
}

export function validTargetedSelection(product, values) {
  if (product?.id !== values.baseProductId || product.bakeryId !== values.targetBakeryId || product.customizable !== true) return false
  const selections = values.optionSelections || [], groups = product.optionGroups || []
  if (new Set(selections.map((row) => row.optionValueId)).size !== selections.length) return false
  if (selections.some((row) => !groups.some((group) => group.id === row.optionGroupId && group.values?.some((value) => value.id === row.optionValueId && value.active !== false)))) return false
  return groups.every((group) => {
    const count = selections.filter((row) => row.optionGroupId === group.id).length
    return count >= (group.minimumSelections ?? (group.required ? 1 : 0)) && count <= (group.maximumSelections ?? (group.selectionType === 'SINGLE' ? 1 : Infinity))
  })
}
