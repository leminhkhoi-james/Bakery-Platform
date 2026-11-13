import { ApiError } from './apiClient.js'
import { addressService } from './addressService.js'
import { isRealCheckoutId, revalidateCartItem } from './checkoutService.js'
import { orderService } from './orderService.js'
import { rfqService } from './rfqService.js'
import { orderNoteWithGift } from './giftAccessories.js'
import { verifyDeliveryWithinHours } from './businessHours.js'

export async function createVerifiedDirectOrder(item, { deliveryAddressId, requestedDeliveryAt, customerNote }, key) {
  const note = orderNoteWithGift(customerNote, item.giftAccessories)
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
    productId: item.productId, bakeryId: item.bakeryId, deliveryAddressId, requestedDeliveryAt, customerNote: note,
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
  let uncertain = false
  for (let retry = 0; ; retry++) {
    try { return await rfqService.acceptOffer(offerId, input, key) }
    catch (error) {
      // An upstream timeout can occur after Order committed. Replay the same
      // payload/key so Marketplace can return its recovered workflow result.
      const transient = [0, 500, 502, 503, 504].includes(error.status) || uncertain && error.status === 409
      if (!transient || retry >= 4) throw error
      uncertain = true
      await new Promise(resolve => setTimeout(resolve, Math.min((retry + 1) * 1500, 5000)))
    }
  }
}

export async function loadAcceptedOfferOrder({ offerId, bakeryId, customerId }, options = {}) {
  if (!offerId) return null
  const request = { ...options, allowMockFallback: false }
  const seen = new Set()
  for (let page = 1; ; page++) {
    const data = await orderService.getOrders({ scope: 'mine', orderSource: 'ACCEPTED_OFFER', page, size: 100 }, request)
    if (data.meta.page !== page || data.meta.pages > 200) throw new ApiError('Chưa thể đối chiếu danh sách đơn hàng.', 502)
    for (const row of data.result) {
      if (row.customerId !== customerId) throw new ApiError('Danh sách đơn hàng không đúng tài khoản.', 403)
      if (seen.has(row.id)) throw new ApiError('Danh sách đơn hàng bị lặp trang.', 502)
      seen.add(row.id)
      if (row.bakeryId !== bakeryId) continue
      const order = await orderService.getOrderById(row.id, request)
      if (order.customerId !== customerId) throw new ApiError('Đơn hàng không đúng tài khoản.', 403)
      if (order.offerId === offerId) return order
    }
    if (page >= data.meta.pages) return null
    if (!data.result.length) throw new ApiError('Chưa tải đủ đơn hàng để đối chiếu.', 502)
  }
}
