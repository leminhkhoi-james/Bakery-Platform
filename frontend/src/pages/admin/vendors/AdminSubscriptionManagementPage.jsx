import { useEffect, useRef } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import AdminPlansPage from './AdminPlansPage.jsx'
import AdminPaymentsPage from './AdminPaymentsPage.jsx'

export default function AdminSubscriptionManagementPage({ onNavigate, routeSearch = '', legacyPayments = false }) {
  const reviewSection = useRef(null)
  const params = new URLSearchParams(routeSearch)
  const openReview = legacyPayments || params.get('tab') === 'review' || params.has('paymentId')

  useEffect(() => {
    if (!openReview) return
    const frame = requestAnimationFrame(() => reviewSection.current?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [openReview, routeSearch])

  return <AdminFrame activeTab="admin-plans" onNavigate={onNavigate}>
    <div className="space-y-6">
      <AdminPlansPage />
      <section ref={reviewSection} aria-labelledby="admin-payment-review-heading" className="scroll-mt-[var(--sc-portal-content-top)]">
        <h2 id="admin-payment-review-heading" className="mb-3 text-lg font-bold text-primary">Duyệt gói dịch vụ</h2>
        <AdminPaymentsPage key={routeSearch} routeSearch={routeSearch} />
      </section>
    </div>
  </AdminFrame>
}
