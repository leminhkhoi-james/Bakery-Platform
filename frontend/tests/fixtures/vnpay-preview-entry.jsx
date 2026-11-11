import React from 'react'
import { createRoot } from 'react-dom/client'
import SubscriptionOrderDetail from '../../src/pages/vendor/subscription/SubscriptionOrderDetail.jsx'
import VnpayReturnPage from '../../src/pages/customer/subscription/VnpayReturnPage.jsx'
import '../../src/index.css'
import '../../src/styles/design-system.css'

const orderId = '10000000-0000-4000-8000-000000000001'
const bakeryId = '20000000-0000-4000-8000-000000000002'
const attemptId = '30000000-0000-4000-8000-000000000003'
const scenario = new URLSearchParams(location.search).get('scenario') || 'checkout'
let checks = 0
window.__vnpayRequests = []
window.fetch = async (url, options) => {
  window.__vnpayRequests.push({ url, method: options?.method, body: options?.body })
  let data
  if (url.includes('/vnpay/checkout')) {
    if (scenario === 'unconfigured') return Response.json({ message: 'VNPay is not configured' }, { status: 503 })
    data = { orderId, attemptId, expiresAt: '2099-01-01T00:00:00Z', paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=fixture' }
  } else if (url.includes('/payments/vnpay/return')) {
    if (scenario === 'invalid') return Response.json({ message: 'Invalid VNPay signature' }, { status: 400 })
    checks += 1
    const status = scenario === 'poll' ? (checks === 1 ? 'PENDING' : 'SUCCEEDED')
      : ({ success: 'SUCCEEDED', cancelled: 'FAILED', review: 'REVIEW_REQUIRED' }[scenario] || 'PENDING')
    data = { orderId, attemptId, status, responseCode: scenario === 'cancelled' ? '24' : '00' }
  } else if (url.includes('/payment-options')) data = { sandboxEnabled: false }
  else data = { id: orderId, bakeryId, planId: '40000000-0000-4000-8000-000000000004', planNameSnapshot: 'Gói Chuyên nghiệp',
    planCodeSnapshot: 'PRO', status: 'PENDING_PAYMENT', totalAmount: '200000', currency: 'VND',
    expiresAt: '2099-01-01T00:00:00Z', featuresSnapshot: {}, payments: [] }
  return Response.json({ statusCode: 200, message: 'Success', data })
}
const navigate = (route) => { window.__vnpayNavigation = route }
createRoot(document.getElementById('root')).render(
  ['checkout', 'unconfigured'].includes(scenario)
    ? <main className="mx-auto max-w-3xl px-4 py-10"><SubscriptionOrderDetail orderId={orderId} bakeryId={bakeryId} roles={['CUSTOMER']} onBusy={() => {}} onChanged={() => {}} /></main>
    : <VnpayReturnPage routeSearch="?vnp_TxnRef=fixture&vnp_SecureHash=fixture" onNavigate={navigate} />,
)
