import { orderService } from './orderService.js'
import { publicationAdminService } from './publicationAdminService.js'
import { loadVendorRequests } from './vendorRfqService.js'
import { displayReference } from './displayReference.js'

async function loadSources(enabled, options, getSources) {
  if (!enabled) return { items: [], incomplete: false }
  const timeout = AbortSignal.timeout(10000)
  const request = { ...options, allowMockFallback: false,
    signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout }
  const sources = await Promise.allSettled(getSources(request))
  if (sources.every(source => source.status === 'rejected')) throw sources[0].reason
  const data = sources.flatMap(source => source.status === 'fulfilled' ? [source.value] : [])
  const items = data.flatMap(source => source.items)
    .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
  return { ...Object.assign({}, ...data), items, incomplete: data.length !== sources.length }
}

export function loadAdminNotifications({ enabled }, options = {}) {
  return loadSources(enabled, options, request => [
    publicationAdminService.getBakeries({ status: 'PENDING_APPROVAL', page: 1, size: 10, sort: 'createdAt,desc' }, request)
      .then(page => ({
        pendingBakeries: page.meta.total,
        items: page.result.map(bakery => ({
          id: 'bakery:' + bakery.id,
          title: (bakery.name || 'Tiệm bánh') + ' đang chờ duyệt hồ sơ',
          date: bakery.createdAt, route: 'admin-vendors?bakeryId=' + bakery.id,
        })),
      })),
    publicationAdminService.getPayments({ status: 'SUBMITTED', page: 1, size: 10, sort: 'submittedAt,desc' }, request)
      .then(page => ({ items: page.result.map(payment => ({
        id: 'payment:' + payment.id,
        title: 'Chứng từ mua gói đang chờ duyệt',
        date: payment.submittedAt, route: 'admin-payments?paymentId=' + payment.id,
      })) })),
  ])
}

export function loadVendorNotifications({ bakery, bakeryId, enabled }, options = {}) {
  return loadSources(enabled && Boolean(bakeryId), options, request => [
    loadVendorRequests({ bakery: bakery || { id: bakeryId }, status: 'OPEN', page: 1, size: 10,
      sort: 'createdAt,desc', excludeQuoted: true }, request)
      .then(page => ({
        pendingRequests: page.meta.total,
        items: page.result.map(rfq => ({
          id: 'rfq:' + rfq.id, title: rfq.title || 'Yêu cầu đặt bánh mới',
          date: rfq.createdAt, route: 'vendor-quote-submit?' + new URLSearchParams({ bakeryId, cakeRequestId: rfq.id }),
        })),
      })),
    orderService.getOrders({ bakeryId, scope: 'bakery', status: 'PENDING', page: 1, size: 10, sort: 'createdAt,desc' }, request)
      .then(page => ({
        pendingOrders: page.meta.total,
        items: page.result.map(order => ({
          id: 'order:' + order.id, title: 'Đơn chờ xác nhận · ' + displayReference(order.id, 'ORD', order.orderNumber),
          date: order.createdAt, route: 'vendor-orders?' + new URLSearchParams({ bakeryId, orderId: order.id }),
        })),
      })),
  ])
}
