import React, { useState } from 'react'
import VendorSidebar from '../../layouts/vendor/VendorSidebar.jsx'
import { useAuth } from '../../context/useAuth.js'
import { isCatalogId } from '../../services/catalogModels.js'
import { vendorRoute } from '../../routes/catalogNavigation.js'
import { inputClass, buttonClass } from './ApiState.jsx'
import { PortalHeader, Icon } from '../common/WorkspaceUI.jsx'

export function BakerySelector({ bakeryId, onSelect, disabled = false }) {
  const [input, setInput] = useState(bakeryId)
  const [error, setError] = useState('')
  return <form className="sc-panel sc-bakery-selector" onSubmit={(event) => {
    event.preventDefault()
    if (disabled) return
    if (!isCatalogId(input.trim())) return setError('Mã cửa hàng phải là UUID hợp lệ.')
    setError(''); onSelect(input.trim().toLowerCase())
  }}><div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,1fr)]"><div><label className="font-bold text-primary" htmlFor="managed-bakery"><Icon name="storefront" /> Cửa hàng cần quản lý</label><p className="mt-1 text-xs text-on-surface-variant">Nhập bakeryId thật. Backend kiểm tra membership.</p></div><div className="flex min-w-0 flex-wrap items-end gap-2"><input id="managed-bakery" disabled={disabled} value={input} onChange={(event) => setInput(event.target.value)} placeholder="bakeryId (UUID)" className={inputClass + ' min-w-0 flex-1'} required /><button disabled={disabled} className={buttonClass}>Xem cửa hàng</button></div></div>{error && <p role="alert" className="mt-2 text-red-700">{error}</p>}{bakeryId && <p className="mt-2 break-all text-xs text-on-surface-variant">Cửa hàng đang xem: {bakeryId}</p>}<details className="mt-2 text-xs text-on-surface-variant"><summary className="cursor-pointer">Vì sao cần mã cửa hàng?</summary><p className="mt-2">Hiện chưa có API liệt kê cửa hàng của tài khoản. Mã cửa hàng không thay thế quyền truy cập.</p></details></form>
}

export default function VendorFrame({ title, activeTab, bakeryId, onNavigate, children }) {
  const { user } = useAuth()
  const [mobile, setMobile] = useState(false)
  const navigate = (route) => onNavigate(vendorRoute(route, bakeryId))
  return <div className="sc-portal sc-portal--vendor"><VendorSidebar activeTab={activeTab} onNavigate={navigate} isMobileOpen={mobile} onCloseMobile={() => setMobile(false)} showMockBadges={false} /><PortalHeader title={title} user={user} portal="Đối tác" onMenu={() => setMobile(true)} /><main id="workspace-content" className="sc-portal-main"><div className="sc-workspace">{children}</div></main></div>
}
