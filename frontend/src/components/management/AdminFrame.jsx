import React, { useState } from 'react'
import AdminSidebar from '../../layouts/admin/AdminSidebar.jsx'
import { useAuth } from '../../context/useAuth.js'
export default function AdminFrame({ title, activeTab, onNavigate, children }) {
  const [mobile, setMobile] = useState(false)
  const { user } = useAuth()
  return <div className="min-h-screen bg-background text-on-surface">
    <AdminSidebar activeTab={activeTab} onNavigate={onNavigate} pendingVendorsCount={0} isMobileOpen={mobile} onCloseMobile={() => setMobile(false)} />
    <header className="fixed top-0 left-0 md:left-64 right-0 z-30 h-16 border-b border-outline-variant/30 bg-surface px-4 flex items-center justify-between gap-3">
      <button className="md:hidden" onClick={() => setMobile(true)} aria-label="Mở menu">☰</button><h1 className="font-bold text-primary">{title}</h1><span className="truncate text-sm">{user?.displayName || 'Admin'}</span>
    </header>
    <main className="md:ml-64 pt-20 p-4 lg:p-6 space-y-5">{children}</main>
  </div>
}
