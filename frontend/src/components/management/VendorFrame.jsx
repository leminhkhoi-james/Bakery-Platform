import React, { useState } from 'react'
import VendorSidebar from '../../layouts/vendor/VendorSidebar.jsx'
import { useAuth } from '../../context/useAuth.js'
import { isCatalogId } from '../../services/catalogModels.js'
import { vendorRoute } from '../../routes/catalogNavigation.js'
import { inputClass, buttonClass } from './ApiState.jsx'

export function BakerySelector({ bakeryId, onSelect, disabled = false }) {
  const [input, setInput] = useState(bakeryId)
  const [error, setError] = useState('')
  return <form className="mb-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5" onSubmit={(event) => {
    event.preventDefault()
    if (disabled) return
    if (!isCatalogId(input.trim())) return setError('Mã cửa hàng phải là UUID hợp lệ.')
    setError(''); onSelect(input.trim().toLowerCase())
  }}><label className="font-bold" htmlFor="managed-bakery">Cửa hàng cần quản lý</label><p className="mt-1 text-sm text-on-surface-variant">Nhập bakeryId thật. Backend kiểm tra membership; hiện chưa có API liệt kê cửa hàng của tài khoản.</p><div className="mt-3 flex flex-wrap gap-3"><input id="managed-bakery" disabled={disabled} value={input} onChange={(event) => setInput(event.target.value)} placeholder="bakeryId (UUID)" className={inputClass + ' min-w-0 flex-1'} required /><button disabled={disabled} className={buttonClass}>Xem cửa hàng</button></div>{error && <p role="alert" className="mt-2 text-red-700">{error}</p>}{bakeryId && <p className="mt-3 break-all text-sm">Cửa hàng đang xem: {bakeryId}</p>}</form>
}

export default function VendorFrame({ title, activeTab, bakeryId, onNavigate, children }) {
  const { user } = useAuth()
  const [mobile, setMobile] = useState(false)
  const navigate = (route) => onNavigate(vendorRoute(route, bakeryId))
  return <div className="min-h-screen bg-background font-body-md text-on-surface"><VendorSidebar activeTab={activeTab} onNavigate={navigate} isMobileOpen={mobile} onCloseMobile={() => setMobile(false)} showMockBadges={false} /><div className="md:ml-72"><header className="flex items-center gap-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5"><button className="md:hidden" aria-label="Mở menu" onClick={() => setMobile(true)}>☰</button><div><h1 className="text-2xl font-bold text-primary">{title}</h1><p className="text-sm">{user?.displayName || user?.email}</p></div></header><main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">{children}</main></div></div>
}
