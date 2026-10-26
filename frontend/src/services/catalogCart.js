// Preserve authoritative catalog identifiers/configuration when handing data to
// the existing local cart. This does not place an order or call Order Service.
export function catalogCartItem(product) {
  const optionSelections = (product.optionSelections || []).map((group) => ({
    optionGroupId: group.optionGroupId,
    optionValueIds: [...group.optionValueIds].sort(),
  })).sort((a, b) => a.optionGroupId.localeCompare(b.optionGroupId))
  const addOns = [...(product.addOns || [])].sort((a, b) => a.addOnId.localeCompare(b.addOnId))
  return {
    ...product,
    productId: product.productId || product.id,
    id: product.id + ':' + JSON.stringify({ optionSelections, addOns }),
    optionSelections, addOns,
    bakery: product.vendor || '',
    quantity: product.quantity || 1,
    sizeSpec: product.sizeSpec || '',
    flavor: '',
  }
}
