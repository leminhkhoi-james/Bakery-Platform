import { ApiError } from './apiClient.js'
import { publicationAdminService } from './publicationAdminService.js'
import { loadPaymentDirectory } from './adminPaymentPresentation.js'
import { readDashboardPages } from './adminDashboardService.js'
import { orderService } from './orderService.js'

export async function loadRevenueOrders({ bakeryId = '', from = '', to = '' }, options = {}) {
  const filters = {
    scope: 'all', bakeryId,
    ...(from ? { createdFrom: new Date(from + 'T00:00:00+07:00').toISOString() } : {}),
    ...(to ? { createdTo: new Date(to + 'T23:59:59.999+07:00').toISOString() } : {}),
  }
  const collection = await readDashboardPages((paging, request) => orderService.getOrders({ ...filters, ...paging }, request), { ...options, allowMockFallback: false })
  if (collection.rows.some(order => order.currency !== 'VND' || order.totalAmount === null || !Number.isFinite(order.totalAmount) || order.totalAmount < 0)) throw new ApiError('Không thể tổng hợp giá trị đơn hàng không hợp lệ.', 502)
  return { ...collection, fetchedAt: Date.now() }
}

export async function loadAdminPending(_params, options) {
  const [payments, bakeries] = await Promise.all([
    publicationAdminService.getPayments({ status: 'SUBMITTED', page: 1, size: 1, sort: 'submittedAt,desc' }, options),
    publicationAdminService.getBakeries({ status: 'PENDING_APPROVAL', page: 1, size: 1 }, options),
  ])
  return { payments: payments.meta.total, bakeries: bakeries.meta.total, latestPayment: payments.result[0] || null }
}

export async function loadRevenuePayments(filters, options) {
  const collection = await readDashboardPages((paging, request) => loadPaymentDirectory({ ...filters, ...paging, sort: 'submittedAt,desc' }, request), options)
  if (collection.rows.some(payment => payment.amount === null || !Number.isFinite(payment.amount) || payment.amount < 0 || payment.currency !== 'VND')) throw new ApiError('Không thể tổng hợp doanh thu: số tiền hoặc tiền tệ không hợp lệ.', 502)
  return collection.rows
}
