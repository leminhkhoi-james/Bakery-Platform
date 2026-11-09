export const businessDateSelected = (value, from, to) => (!from || Date.parse(value) >= Date.parse(from + 'T00:00:00+07:00')) && (!to || Date.parse(value) <= Date.parse(to + 'T23:59:59.999+07:00'))
export function businessDay(value) {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? new Date(timestamp + 7 * 3600000).toISOString().slice(0, 10) : ''
}

export function settledBusinessSales(state, { bakeryId = '', from = '', to = '' } = {}) {
  const paymentsByOrder = Map.groupBy(state.salesPayments, payment => payment.orderId)
  return state.orders.flatMap(order => {
    if (bakeryId && order.bakeryId !== bakeryId || order.status !== 'COMPLETED' ||
        order.paymentStatus !== 'PAID' || order.issueStatus === 'DISPUTED') return []
    const payments = paymentsByOrder.get(order.id) || []
    const matching = payments.filter(payment => payment.bakeryId === order.bakeryId && payment.currency === order.currency)
    if (matching.some(payment => payment.status === 'REFUNDED')) return []
    const collected = matching.filter(payment => payment.status === 'COMPLETED' &&
      payment.amount === order.totalAmount && Number.isFinite(Date.parse(payment.createdAt)))
    if (!collected.length || !Number.isFinite(order.totalAmount) || order.totalAmount < 0) return []
    const firstReceipt = Math.min(...collected.map(payment => Date.parse(payment.createdAt)))
    const completed = Date.parse(order.completedAt)
    const recognizedAt = new Date(Number.isFinite(completed) ? Math.max(completed, firstReceipt) : firstReceipt).toISOString()
    return businessDateSelected(recognizedAt, from, to) ? [{ order, recognizedAt }] : []
  })
}

export const settledBusinessOrder = (state, order) =>
  settledBusinessSales({ ...state, orders: [order] }).length > 0

export const approvalDate = row => row.reviewedAt || row.approvedAt

export function approvedPayments(rows) {
  const byOrder = new Map()
  for (const row of rows) {
    const key = row.subscriptionOrderId || row.id
    if (row.status !== 'APPROVED' || !key) continue
    const previous = byOrder.get(key)
    const time = payment => Date.parse(approvalDate(payment)) || 0
    if (!previous || time(row) > time(previous)) byOrder.set(key, row)
  }
  return [...byOrder.values()]
}
const selected = businessDateSelected
export function businessMetrics(state, { bakeryId = '', from = '', to = '' } = {}) {
  if (from && to && from > to) throw new Error('Ngày bắt đầu phải trước ngày kết thúc.')
  const scope = (row) => !bakeryId || row.bakeryId === bakeryId
  const orders = state.orders.filter(row => scope(row) && selected(row.createdAt, from, to))
  const byStatus = Object.fromEntries(['PENDING', 'CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED'].map(key => [key, orders.filter(row => row.status === key).length]))
  const settled = settledBusinessSales(state, { bakeryId, from, to })
  const payments = state.payments.filter(row => scope(row) && selected(row.reviewedAt || row.submittedAt, from, to))
  const timeline = new Map()
  for (const order of orders) {
    const date = businessDay(order.createdAt)
    if (!date) continue
    const point = timeline.get(date) || { date, orders: 0, sales: 0 }
    point.orders++
    timeline.set(date, point)
  }
  for (const { order, recognizedAt } of settled) {
    const date = businessDay(recognizedAt)
    const point = timeline.get(date) || { date, orders: 0, sales: 0 }
    point.sales += order.totalAmount
    timeline.set(date, point)
  }
  const offers = state.offers.filter(row => scope(row) && selected(row.createdAt, from, to))
  const requestIds = new Set(state.offers.filter(scope).map(row => row.cakeRequestId))
  return { pendingCollections: orders.filter(order => order.status !== 'CANCELLED' && order.paymentStatus === 'UNPAID').length, orders: orders.length, settledCount: settled.length, byStatus, orderValue: orders.reduce((sum, row) => sum + row.totalAmount, 0), salesRevenue: settled.reduce((sum, { order }) => sum + order.totalAmount, 0), subscriptionRevenue: approvedPayments(state.payments.filter(scope)).filter(row => selected(approvalDate(row), from, to)).reduce((sum, row) => sum + row.amount, 0), pendingPayments: payments.filter(row => row.status === 'SUBMITTED').length, customers: new Set(orders.map(row => row.customerId)).size, reviews: orders.filter(row => row.review?.status === 'PUBLISHED').length, offers: offers.length, rfqs: state.requests.filter(row => (!bakeryId || requestIds.has(row.id) || row.status === 'OPEN') && selected(row.createdAt, from, to)).length, overdue: orders.filter(row => !['COMPLETED', 'CANCELLED'].includes(row.status) && Date.parse(row.neededAt) < Date.now()).length, disputed: orders.filter(row => row.issueStatus === 'DISPUTED').length, scheduled: orders.filter(row => row.status === 'CONFIRMED' && Date.parse(row.neededAt) > Date.now()).length, timeline: [...timeline.values()].sort((a, b) => a.date.localeCompare(b.date)) }
}
