import AdminFrame from '../../../components/management/AdminFrame.jsx'
import AdminPlansPage from './AdminPlansPage.jsx'
import AdminPaymentsPage from './AdminPaymentsPage.jsx'

export default function AdminSubscriptionManagementPage({ onNavigate, routeSearch = '', legacyPayments = false }) {
  const review = legacyPayments || new URLSearchParams(routeSearch).get('tab') === 'review'

  return <AdminFrame activeTab={review ? 'admin-payments' : 'admin-plans'} onNavigate={onNavigate}>
    {review ? <AdminPaymentsPage key={routeSearch} routeSearch={routeSearch} /> : <AdminPlansPage />}
  </AdminFrame>
}
