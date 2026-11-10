import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import AdminPlansPage from './AdminPlansPage.jsx'
import AdminPaymentsPage from './AdminPaymentsPage.jsx'

export default function AdminSubscriptionManagementPage({ onNavigate, routeSearch = '', legacyPayments = false }) {
  const review = legacyPayments || new URLSearchParams(routeSearch).get('tab') === 'review'

  return <AdminFrame activeTab={review ? 'admin-payments' : 'admin-plans'} onNavigate={onNavigate}>
    <nav aria-label="Quản lý gói dịch vụ" className="sc-tabs mb-4 flex w-fit max-w-full flex-wrap gap-2">
      <button
        type="button"
        aria-pressed={review}
        className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer"
        onClick={() => onNavigate('admin-payments')}
      >
        <Icon name="receipt_long" />Duyệt mua gói
      </button>
      <button
        type="button"
        aria-pressed={!review}
        className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer"
        onClick={() => onNavigate('admin-plans')}
      >
        <Icon name="workspace_premium" />Cấu hình gói dịch vụ
      </button>
    </nav>
    {review ? <AdminPaymentsPage key={routeSearch} routeSearch={routeSearch} /> : <AdminPlansPage />}
  </AdminFrame>
}
