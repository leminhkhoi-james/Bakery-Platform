import { onboardingService } from './onboardingService.js'
import { orderService } from './orderService.js'
import { rfqService } from './rfqService.js'
import { displayReference } from './displayReference.js'
import { uiLabel } from './uiLabels.js'

export async function loadCustomerNotifications({ enabled }, options = {}) {
  if (!enabled) return { items: [], incomplete: false }
  const timeout = AbortSignal.timeout(10000)
  const request = { ...options, allowMockFallback: false, signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout }
  const params = { page: 1, size: 12, sort: 'createdAt,desc' }
  const sources = await Promise.allSettled([
    rfqService.getOffers({ ...params, scope: 'received', status: 'PENDING' }, request),
    orderService.getOrders({ ...params, scope: 'mine' }, request),
    onboardingService.get(null, request),
  ])
  const items = []
  const [offers, orders, profile] = sources
  if (offers.status === 'fulfilled') for (const offer of offers.value.result) {
    if (Date.parse(offer.expiresAt) <= Date.now()) continue
    items.push({ id: 'offer:' + offer.id, title: 'Có báo giá cho yêu cầu bánh', date: offer.createdAt, route: 'baker-quote?id=' + offer.id })
  }
  if (orders.status === 'fulfilled') for (const order of orders.value.result) {
    items.push({
      id: ['order', order.id, order.status].join(':'),
      title: displayReference(order.id, 'ORD', order.orderNumber) + ' · ' + uiLabel(order.status),
      date: order.updatedAt || order.createdAt, route: 'tracking?orderId=' + order.id,
    })
  }
  if (profile.status === 'fulfilled' && profile.value?.status === 'ACTIVE') {
    const bakery = profile.value
    items.push({
      id: ['profile', bakery.id, bakery.status].join(':'),
      title: 'Hồ sơ tiệm đã được duyệt',
      date: bakery.updatedAt || bakery.createdAt, route: 'subscription-plans?tracking=1',
    })
  }
  if (sources.every(source => source.status === 'rejected')) throw sources[0].reason
  return { items: items.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)).slice(0, 20),
    incomplete: sources.some(source => source.status === 'rejected') }
}
