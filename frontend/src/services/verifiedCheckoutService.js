import { ApiError } from './apiClient.js'
import { addressService } from './addressService.js'
import { isRealCheckoutId, revalidateCartItem } from './checkoutService.js'
import { orderService } from './orderService.js'
import { rfqService } from './rfqService.js'
import { verifyDeliveryWithinHours } from './businessHours.js'

export async function createVerifiedDirectOrder(item, { deliveryAddressId, requestedDeliveryAt, customerNote }, key) {
  if (![item.productId, item.bakeryId, deliveryAddressId].every(isRealCheckoutId)) {
    throw new ApiError('Sản phẩm, cửa hàng và địa chỉ phải là dữ liệu API.', 400)
  }
  const [verified] = await Promise.all([revalidateCartItem(item, { allowMockFallback: false }), addressService.verify(deliveryAddressId)])
  const references = [
    ...verified.optionSelections.flatMap(group => [group.optionGroupId, ...group.optionValueIds]),
    ...verified.addOns.map(addOn => addOn.addOnId),
  ]
  if (!references.every(isRealCheckoutId)) throw new ApiError('Tùy chọn và phụ kiện phải thuộc dữ liệu API.', 400)
  await verifyDeliveryWithinHours(item.bakeryId, requestedDeliveryAt, { allowMockFallback: false })
  return orderService.createDirectOrder({
    productId: item.productId, bakeryId: item.bakeryId, deliveryAddressId, requestedDeliveryAt, customerNote,
    quantity: verified.quantity, optionSelections: verified.optionSelections, addOns: verified.addOns,
  }, key, { allowMockFallback: false })
}

export async function acceptVerifiedOffer(offerId, input, key) {
  if (!isRealCheckoutId(offerId) || !isRealCheckoutId(input.deliveryAddressId)) {
    throw new ApiError('Báo giá và địa chỉ phải là dữ liệu API.', 400)
  }
  await addressService.verify(input.deliveryAddressId)
  const offer = await rfqService.getOffer(offerId, { allowMockFallback: false })
  const request = await rfqService.getRfqById(offer.cakeRequestId, { allowMockFallback: false })
  await verifyDeliveryWithinHours(offer.bakeryId, request.neededAt, { allowMockFallback: false })
  return rfqService.acceptOffer(offerId, input, key)
}
