import React, { useState } from 'react'
import AdminSidebar from '../../layouts/admin/AdminSidebar.jsx'
import { useAuth } from '../../context/useAuth.js'
import { PortalHeader } from '../common/WorkspaceUI.jsx'
import BackgroundOrnaments from '../common/BackgroundOrnaments.jsx'
export default function AdminFrame({ title, activeTab, onNavigate, children }) {
  const [mobile, setMobile] = useState(false)
  const { user } = useAuth()
  return <div className="sc-portal sc-portal--admin">
    <AdminSidebar activeTab={activeTab} onNavigate={onNavigate} pendingVendorsCount={0} isMobileOpen={mobile} onCloseMobile={() => setMobile(false)} />
    <PortalHeader title={title} user={user} portal="Quản trị" onMenu={() => setMobile(true)} />
    <main id="workspace-content" className="sc-portal-main"><BackgroundOrnaments variant={activeTab} /><div className="sc-workspace">{children}</div></main>
  </div>
}
