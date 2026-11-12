import React, { useEffect, useRef, useState } from 'react'
import AdminSidebar from '../../layouts/admin/AdminSidebar.jsx'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadAdminPending } from '../../services/adminSummaryService.js'
import { useAuth } from '../../context/useAuth.js'
import { PortalHeader } from '../common/WorkspaceUI.jsx'
import BackgroundOrnaments from '../common/BackgroundOrnaments.jsx'
import './admin-header.css'
import './admin-layout.css'
import './admin-tables.css'
import { lockPageScroll } from '../common/modalState.js'
import { ManualRefreshContext } from '../../context/ManualRefreshContext.js'
import './business-simulation.css'
import '../../styles/portal-refinements.css'

const ADMIN_PAGE_HEADERS = {
  'admin-dashboard': { title: 'Tổng quan hệ thống', description: 'Theo dõi hoạt động và những việc cần xử lý.' },
  'admin-vendors': { title: 'Quản lý tiệm bánh', description: 'Tra cứu hồ sơ và duyệt hoạt động của tiệm bánh.' },
  'admin-orders': { title: 'Quản lý đơn hàng', description: 'Theo dõi đơn hàng, tiến độ giao nhận và đánh giá của khách.' },
  'admin-plans': { title: 'Quản lý gói dịch vụ', description: 'Quản lý các gói dịch vụ và quyền lợi dành cho tiệm bánh.' },
  'admin-payments': { title: 'Đơn mua gói', description: 'Theo dõi tất cả đơn mua gói dịch vụ và trạng thái thanh toán của đối tác.' },
  'admin-revenue': { title: 'Doanh thu dịch vụ', description: 'Theo dõi doanh thu thực nhận từ các gói dịch vụ đã phê duyệt.' },
  'admin-moderation': { title: 'Kiểm duyệt nội dung', description: 'Nhập mã đơn hàng hoặc mã thiết kế để xem và kiểm duyệt.' },
  'admin-users': { title: 'Quản lý người dùng', description: 'Tra cứu và quản lý thông tin người dùng.' },
}

export default function AdminFrame({ title, activeTab, onNavigate, children, headerAction, headerDescription }) {
  const [mobile, setMobile] = useState(false)
  const { user } = useAuth()
  const heading = ADMIN_PAGE_HEADERS[activeTab] || { title }
  const [newPaymentNotice, setNewPaymentNotice] = useState(null)
  const pending = useCatalogResource(loadAdminPending)
  const lastPayment = useRef(undefined)
  useEffect(() => {
    if (!pending.data) return
    const latest = pending.data.latestPayment
    if (lastPayment.current !== undefined && latest && latest.id !== lastPayment.current) {
      setNewPaymentNotice({ id: latest.id, name: latest.submittedByName || 'Tiệm bánh đối tác' })
    }
    lastPayment.current = latest?.id || null
  }, [pending.data])
  useEffect(() => {
    const timer = setInterval(pending.reload, 30000)
    return () => clearInterval(timer)
  }, [pending.reload])
  useEffect(() => {
    if (!mobile) return
    const releaseScroll = lockPageScroll(document)
    const desktop = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = () => { if (desktop.matches) setMobile(false) }
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMobile(false) }
    desktop.addEventListener('change', closeOnDesktop)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      releaseScroll()
      desktop.removeEventListener('change', closeOnDesktop)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [mobile])
  return <ManualRefreshContext.Provider value={false}><div className="sc-portal sc-portal--admin">
    <AdminSidebar activeTab={activeTab} onNavigate={onNavigate} pendingVendorsCount={0} isMobileOpen={mobile} onCloseMobile={() => setMobile(false)} />
    <PortalHeader title={heading.title} description={headerDescription ?? heading.description} showPortalLabel={false} action={headerAction} user={user} portal="Quản trị" onMenu={() => setMobile(true)} onNavigate={onNavigate} />
    <main id="workspace-content" className="sc-portal-main"><BackgroundOrnaments variant={activeTab} /><div className={'sc-workspace' + (activeTab === 'admin-dashboard' ? '' : ' sc-admin-content')}>{children}</div></main>
    {newPaymentNotice && (
      <aside role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-secondary/30 bg-surface/95 backdrop-blur-md p-4 shadow-xl">
        <span className="material-symbols-outlined text-secondary text-2xl">notifications_active</span>
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">Chứng từ mua gói mới</p>
          <p className="text-sm font-semibold text-primary">{newPaymentNotice.name} vừa nộp chứng từ</p>
        </div>
        <button
          onClick={() => { setNewPaymentNotice(null); onNavigate?.('admin-payments?paymentId=' + newPaymentNotice.id) }}
          className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:scale-105 transition-all cursor-pointer"
        >
          Duyệt ngay
        </button>
        <button
          onClick={() => setNewPaymentNotice(null)}
          aria-label="Đóng thông báo"
          className="p-1 text-outline hover:text-primary rounded-lg cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </aside>
    )}
  </div></ManualRefreshContext.Provider>
}
