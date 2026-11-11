import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthContext } from '../../src/context/useAuth.js'
import AdminPaymentsPage from '../../src/pages/admin/vendors/AdminPaymentsPage.jsx'
import '../../src/index.css'
import '../../src/styles/design-system.css'
import '../../src/components/management/admin-layout.css'
import '../../src/components/management/admin-tables.css'

const bakeryId = '20000000-0000-4000-8000-000000000002'
const userId = '30000000-0000-4000-8000-000000000003'
const paymentId = '40000000-0000-4000-8000-000000000004'
const makeOrder = (suffix, status, name) => ({ id: '10000000-0000-4000-8000-00000000000' + suffix,
  bakeryId, requestedByUserId: userId, orderNumber: 'SUB-' + suffix + '0FE239D', planNameSnapshot: name, planCodeSnapshot: 'PRO',
  totalAmount: '499000', currency: 'VND', billingPeriodMonths: 1, status, createdAt: '2026-11-10T14:12:18Z',
  expiresAt: '2099-01-01T00:00:00Z', featuresSnapshot: {}, payments: [] })
const readyOrder = makeOrder('2', 'PAYMENT_REVIEW', 'Chuyên nghiệp – có chứng từ')
const payment = { id: paymentId, subscriptionOrderId: readyOrder.id, submittedByUserId: userId, paymentMethod: 'BANK_TRANSFER',
  paymentReference: 'FT-TEST-499', amount: '499000', currency: 'VND', status: 'SUBMITTED', submittedAt: '2026-11-10T15:00:00Z' }
const rows = [
  { order: makeOrder('1', 'PENDING_PAYMENT', 'Chuyên nghiệp – chờ thanh toán'), payments: [], eligibleForApproval: false, eligibilityReason: 'WAITING_PAYMENT', reviewPaymentId: null },
  { order: readyOrder, payments: [payment], eligibleForApproval: true, eligibilityReason: 'READY_FOR_REVIEW', reviewPaymentId: paymentId },
  { order: makeOrder('3', 'COMPLETED', 'Chuyên nghiệp – đã hoàn tất'), payments: [], eligibleForApproval: false, eligibilityReason: 'COMPLETED', reviewPaymentId: null },
]
window.__adminOrderRequests = []
window.fetch = async (input, options = {}) => {
  const url = new URL(input, location.origin)
  window.__adminOrderRequests.push({ path: url.pathname, query: url.search, method: options.method || 'GET' })
  let data
  if (url.pathname.endsWith('/admin/subscription-orders')) {
    let result = rows
    if (url.searchParams.get('status')) result = result.filter(row => row.order.status === url.searchParams.get('status'))
    if (url.searchParams.has('eligibleForApproval')) result = result.filter(row => String(row.eligibleForApproval) === url.searchParams.get('eligibleForApproval'))
    data = { result, meta: { page: 1, pageSize: 20, pages: result.length ? 1 : 0, total: result.length } }
  } else if (url.pathname.includes('/admin/bakeries/')) data = { bakery: { id: bakeryId, status: 'ACTIVE', name: 'Tiệm bánh kiểm thử', createdByUserId: userId } }
  else if (url.pathname.includes('/subscription-orders/')) {
    const row = rows.find(item => url.pathname.endsWith(item.order.id))
    data = { ...row.order, payments: row.payments }
  } else return Response.json({ message: 'Unexpected fixture request' }, { status: 500 })
  return Response.json({ data, statusCode: 200, message: 'Success' })
}
createRoot(document.getElementById('root')).render(<AuthContext.Provider value={{ user: { id: userId, roles: ['ADMIN'] }, roles: ['ADMIN'] }}>
  <div className="sc-portal--admin"><main className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-8"><h1 className="text-2xl font-bold text-primary">Đơn mua gói</h1><AdminPaymentsPage /></main></div>
</AuthContext.Provider>)
