import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthContext } from '../../src/context/useAuth.js'
import PartnerCheckoutModal from '../../src/components/subscription/PartnerCheckoutModal.jsx'
import '../../src/index.css'
import '../../src/styles/artisan-workspace.css'
import '../../src/styles/design-system.css'

const bakeryId = '20000000-0000-4000-8000-000000000002'
const user = { id: '10000000-0000-4000-8000-000000000001', roles: ['CUSTOMER'] }
const plan = { id: '30000000-0000-4000-8000-000000000003', code: 'PRO', name: 'Chuyên nghiệp', monthlyPrice: 499000, currency: 'VND', billingPeriodMonths: 1 }
window.__profileStatus = 'PENDING_APPROVAL'
window.__writes = []
window.fetch = async (input, options = {}) => {
  const url = String(input)
  if ((options.method || 'GET') !== 'GET') {
    window.__writes.push(url)
    return Response.json({ message: 'Fixture stops before order creation' }, { status: 503 })
  }
  let data
  if (url.includes('/bakeries/onboarding')) data = { id: bakeryId, name: 'HANA Bakery', status: window.__profileStatus }
  else if (url.includes('/subscription-orders')) data = { result: [], meta: { page: 1, pageSize: 10, total: 0, pages: 0 } }
  else if (url.includes('/subscription')) data = { bakeryId, currentSubscription: null, scheduledSubscription: null, features: {} }
  else if (url.includes('/auth/me')) data = user
  else return Response.json({ message: 'Unexpected fixture request' }, { status: 500 })
  return Response.json({ data })
}
createRoot(document.getElementById('root')).render(<AuthContext.Provider value={{ user, roles: user.roles }}>
  <PartnerCheckoutModal plan={plan} onClose={() => {}} onNavigate={() => {}} />
</AuthContext.Provider>)
