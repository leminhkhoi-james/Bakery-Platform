import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import AdminPlansPage from './AdminPlansPage.jsx'
import AdminPaymentsPage from './AdminPaymentsPage.jsx'

export default function AdminSubscriptionManagementPage({ onNavigate, routeSearch = '', legacyPayments = false }) {
  const review = legacyPayments || new URLSearchParams(routeSearch).get('tab') === 'review'

  return <AdminFrame activeTab="admin-plans" onNavigate={onNavigate}>
    <nav aria-label="Quản lý gói dịch vụ" className="sc-tabs mb-4 flex w-fit max-w-full flex-wrap">
      <button type="button" aria-pressed={!review} className="inline-flex items-center justify-center gap-2 px-3" onClick={() => onNavigate('admin-plans')}>
        <Icon name="workspace_premium" />Gói dịch vụ
      </button>
      <button type="button" aria-pressed={review} className="inline-flex items-center justify-center gap-2 px-3" onClick={() => { if (!review) onNavigate('admin-plans?tab=review') }}>
        <Icon name="receipt_long" />Duyệt gói dịch vụ
      </button>
    </nav>
    {review ? <AdminPaymentsPage key={routeSearch} routeSearch={routeSearch} /> : <AdminPlansPage />}
  </AdminFrame>
}
