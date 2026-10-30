import React, { useEffect, useState } from 'react'
import AdminSidebar from '../../layouts/admin/AdminSidebar.jsx'
import { useAuth } from '../../context/useAuth.js'
import { PortalHeader } from '../common/WorkspaceUI.jsx'
import BackgroundOrnaments from '../common/BackgroundOrnaments.jsx'
import './admin-header.css'
import './admin-layout.css'
import './admin-tables.css'
import { lockPageScroll } from '../common/modalState.js'

const ADMIN_PAGE_HEADERS = {
  'admin-dashboard': { title: 'Tổng quan hệ thống', description: 'Theo dõi hoạt động và những việc cần xử lý.' },
  'admin-vendors': { title: 'Quản lý tiệm bánh', description: 'Tra cứu hồ sơ và duyệt hoạt động của tiệm bánh.' },
  'admin-orders': { title: 'Quản lý đơn hàng', description: 'Theo dõi đơn hàng, tiến độ giao nhận và đánh giá của khách.' },
  'admin-plans': { title: 'Quản lý gói dịch vụ', description: 'Quản lý các gói dịch vụ và quyền lợi dành cho tiệm bánh.' },
  'admin-payments': { title: 'Duyệt chứng từ', description: 'Đối chiếu và duyệt chứng từ mua gói dịch vụ.' },
  'admin-moderation': { title: 'Kiểm duyệt nội dung', description: 'Nhập mã đơn hàng hoặc mã thiết kế để xem và kiểm duyệt.' },
  'admin-users': { title: 'Quản lý người dùng', description: 'Tra cứu và quản lý thông tin người dùng.' },
}

export default function AdminFrame({ title, activeTab, onNavigate, children, headerAction }) {
  const [mobile, setMobile] = useState(false)
  const { user } = useAuth()
  const heading = ADMIN_PAGE_HEADERS[activeTab] || { title }
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
  return <div className="sc-portal sc-portal--admin">
    <AdminSidebar activeTab={activeTab} onNavigate={onNavigate} pendingVendorsCount={0} isMobileOpen={mobile} onCloseMobile={() => setMobile(false)} />
    <PortalHeader title={heading.title} description={heading.description} showPortalLabel={false} action={headerAction} user={user} portal="Quản trị" onMenu={() => setMobile(true)} onNavigate={onNavigate} />
    <main id="workspace-content" className="sc-portal-main"><BackgroundOrnaments variant={activeTab} /><div className={'sc-workspace' + (activeTab === 'admin-dashboard' ? '' : ' sc-admin-content')}>{children}</div></main>
  </div>
}
