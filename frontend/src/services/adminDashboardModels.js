import { displayReference } from './displayReference.js'
import { orderStatusLabel } from './orderModels.js'
import { uiLabel } from './uiLabels.js'

const unique = (rows = []) => [...new Map(rows.filter((row) => row?.id).map((row) => [row.id, row])).values()]
const instant = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null
const dayKey = (value) => new Date(value + 7 * 3600000).toISOString().slice(0, 10)
export const DASHBOARD_PENDING_ORDER_STATUS = 'PENDING'
export function dashboardDateTime(value) {
  const timestamp = instant(value)
  if (timestamp == null) return 'Chưa có thời gian'
  const parts = Object.fromEntries(new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(timestamp)).map((part) => [part.type, part.value]))
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
}
export const dashboardNumber = (value) => value == null ? '—' : value.toLocaleString('vi-VN')
export const dashboardMoney = (value, currency = 'VND') => value == null || !Number.isFinite(Number(value)) || !/^[A-Z]{3}$/.test(currency || '') ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value))
export const dashboardOrderName = (order) => displayReference(order.id, 'ORD', order.orderNumber)

export function buildAdminDashboard(data = {}, { days = 30, now = Date.now(), currency = 'VND' } = {}) {
  data ||= {}
  days = [7, 30, 90].includes(days) ? days : 30
  const rows = (key) => data[key]?.state === 'ready' ? unique(data[key].rows) : null
  const bakeries = rows('bakeries'), orders = rows('orders'), users = rows('users'), payments = rows('payments')
  const products = rows('products'), requests = rows('requests'), offers = rows('offers'), designs = rows('designs')
  const pendingBakeries = bakeries?.filter((row) => row.status === 'PENDING_APPROVAL')
  const pendingPayments = payments && [...new Map(payments.filter((row) => row.status === 'SUBMITTED' && row.subscriptionOrderId).map((row) => [row.subscriptionOrderId, row])).values()]
  const approvedPayments = payments && [...new Map(payments.filter((row) => row.status === 'APPROVED' && row.subscriptionOrderId && row.amount != null && Number.isFinite(Number(row.amount)) && Number(row.amount) >= 0 && /^[A-Z]{3}$/.test(row.currency || '')).map((row) => [row.subscriptionOrderId, row])).values()]
  const invalidPayments = payments?.some((row) => row.status === 'APPROVED' && (!row.subscriptionOrderId || row.amount == null || String(row.amount).trim() === '' || !Number.isFinite(Number(row.amount)) || Number(row.amount) < 0 || !/^[A-Z]{3}$/.test(row.currency || '')))
  const conflictingPayments = payments?.some((row) => row.status === 'APPROVED' && approvedPayments?.some((approved) => approved.subscriptionOrderId === row.subscriptionOrderId && (Number(approved.amount) !== Number(row.amount) || approved.currency !== row.currency)))
  const revenue = approvedPayments && !invalidPayments && !conflictingPayments ? approvedPayments.reduce((sum, row) => ({ ...sum, [row.currency]: (sum[row.currency] || 0) + Number(row.amount) }), {}) : null
  const currencies = Object.keys(revenue || {}).sort()
  currency = currencies.includes(currency) || !currencies.length ? currency : currencies[0]
  const firstDay = Date.parse(dayKey(now) + 'T00:00:00Z') - (days - 1) * 86400000
  const series = Array.from({ length: days }, (_, index) => ({ day: new Date(firstDay + index * 86400000).toISOString().slice(0, 10), orders: 0, revenue: 0 }))
  const byDay = new Map(series.map((point) => [point.day, point]))
  for (const row of orders || []) { const time = instant(row.createdAt); if (time != null && time <= now) { const point = byDay.get(dayKey(time)); if (point) point.orders++ } }
  let undatedRevenue = 0
  for (const row of approvedPayments || []) {
    if (row.currency !== currency) continue
    // Submission is not recognition: a payment must have an actual review timestamp.
    const time = instant(row.reviewedAt || row.approvedAt)
    if (time == null) undatedRevenue++
    else if (time <= now) { const point = byDay.get(dayKey(time)); if (point) point.revenue += Number(row.amount) }
  }
  const reviews = rows('reviews')
  const moderation = designs || reviews ? [
    ...(designs || []).filter((row) => row.moderationStatus === 'PENDING').map((row) => ({ ...row, kind: 'design', label: 'Thiết kế bánh chờ duyệt' })),
    ...(reviews || []).filter((row) => row.status === 'PUBLISHED' && row.rating >= 1 && row.rating <= 2).map((row) => ({ ...row, kind: 'review', label: 'Đánh giá ' + row.rating + ' sao cần xem lại' })),
  ] : null
  const distribution = (items, label) => items == null ? null : Object.entries(items.reduce((sum, row) => { const key = row.status || 'UNKNOWN'; sum[key] = (sum[key] || 0) + 1; return sum }, {})).sort((a, b) => b[1] - a[1]).map(([status, count]) => ({ status, label: status === 'UNKNOWN' ? 'Chưa phân loại' : label(status), count }))
  const bakeryNames = new Map((bakeries || []).map((row) => [row.id, row.name]))
  const activities = []
  const add = (kind, items, date, describe, route, icon) => { for (const row of items || []) { const time = instant(date(row)); if (time != null && time <= now) activities.push({ key: kind + ':' + row.id, time, title: describe(row), route: route(row), icon }) } }
  add('order', orders, (row) => row.createdAt, (row) => 'Đơn hàng mới · ' + (row.bakeryName || bakeryNames.get(row.bakeryId) || 'Tiệm bánh'), (row) => 'admin-orders?orderId=' + row.id, 'shopping_bag')
  add('bakery', bakeries, (row) => row.createdAt, (row) => 'Tiệm mới · ' + (row.name || 'Tiệm bánh'), (row) => 'admin-vendors?bakeryId=' + row.id, 'storefront')
  add('payment', payments, (row) => row.reviewedAt || row.submittedAt, (row) => 'Chứng từ mua gói · ' + uiLabel(row.status).toLocaleLowerCase('vi'), (row) => 'admin-payments?paymentId=' + row.id, 'receipt_long')
  add('user', users, (row) => row.createdAt, (row) => 'Thành viên mới · ' + (row.name || row.displayName || 'Thành viên'), () => 'admin-users', 'person_add')
  return { bakeries, orders, users, payments, currency, currencies, revenue, undatedRevenue, series,
    counts: { bakeries: bakeries?.length ?? null, pendingBakeries: pendingBakeries?.length ?? null, users: users?.length ?? null, products: products?.length ?? null, orders: orders?.length ?? null, requests: requests?.length ?? null, offers: offers?.length ?? null, pendingPayments: pendingPayments?.length ?? null, pendingOrders: orders?.filter((order) => order.status === DASHBOARD_PENDING_ORDER_STATUS).length ?? null },
    pendingBakeries, pendingPayments, moderation,
    distributions: { orders: distribution(orders, orderStatusLabel), bakeries: distribution(bakeries, uiLabel), users: distribution(users, uiLabel) },
    recentOrders: [...(orders || [])].sort((a, b) => ((instant(b.createdAt) ?? -Infinity) - (instant(a.createdAt) ?? -Infinity)) || String(a.id).localeCompare(String(b.id))).slice(0, 5),
    activities: activities.sort((a, b) => b.time - a.time || a.key.localeCompare(b.key)).slice(0, 7),
  }
}
