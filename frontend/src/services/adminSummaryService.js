import { ApiError } from './apiClient.js'
import { publicationAdminService } from './publicationAdminService.js'
import { loadPaymentDirectory } from './adminPaymentPresentation.js'
import { readDashboardPages } from './adminDashboardService.js'

export async function loadAdminPending(_params, options) {
  const [payments, bakeries] = await Promise.all([
    publicationAdminService.getPayments({ status: 'SUBMITTED', page: 1, size: 1, sort: 'submittedAt,desc' }, options),
    publicationAdminService.getBakeries({ status: 'PENDING_APPROVAL', page: 1, size: 1 }, options),
  ])
  return { payments: payments.meta.total, bakeries: bakeries.meta.total, latestPayment: payments.result[0] || null }
}

export async function loadApprovedRevenue(params, options) {
  const { submittedFrom, submittedTo, ...filters } = params
  const collection = await readDashboardPages((paging, request) => loadPaymentDirectory({ ...filters, ...paging, status: 'APPROVED', sort: 'submittedAt,desc' }, request), options)
  if (collection.rows.some((payment) => payment.amount === null || !Number.isFinite(payment.amount) || payment.currency !== 'VND')) throw new ApiError('Không thể tổng hợp doanh thu: số tiền hoặc tiền tệ không hợp lệ.', 502)
  if (!submittedFrom && !submittedTo) return collection.rows
  if (collection.rows.some((payment) => !Number.isFinite(Date.parse(payment.reviewedAt)))) throw new ApiError('Thiếu ngày phê duyệt để lọc doanh thu.', 502)
  return collection.rows.filter((payment) => (!submittedFrom || Date.parse(payment.reviewedAt) >= Date.parse(submittedFrom)) && (!submittedTo || Date.parse(payment.reviewedAt) <= Date.parse(submittedTo)))
}
