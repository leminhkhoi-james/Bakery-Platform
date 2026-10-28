import { displayReference } from '../../services/displayReference.js'
import React, { useState } from 'react'
import VendorSidebar from '../../layouts/vendor/VendorSidebar.jsx'
import { useAuth } from '../../context/useAuth.js'
import { isCatalogId } from '../../services/catalogModels.js'
import { vendorRoute } from '../../routes/catalogNavigation.js'
import { inputClass, buttonClass } from './ApiState.jsx'
import { PortalHeader, Icon } from '../common/WorkspaceUI.jsx'
import BackgroundOrnaments from '../common/BackgroundOrnaments.jsx'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadBakeries } from '../../services/vendorService.js'
import { ApiErrorMessage } from './ApiState.jsx'

export function BakerySelector({ bakeryId, onSelect, disabled = false }) {
  const [input, setInput] = useState(bakeryId)
  const [error, setError] = useState('')
  const available = useCatalogResource(loadBakeries, { page: 1, size: 100 })
  if (available.data?.result.length) return <section className="sc-panel sc-bakery-selector"><label className="font-bold text-primary" htmlFor="managed-bakery">Cửa hàng cần quản lý</label><select id="managed-bakery" className={inputClass} disabled={disabled} value={bakeryId || ''} onChange={(e) => onSelect(e.target.value)}><option value="">Chọn cửa hàng</option>{bakeryId && !available.data.result.some((bakery) => bakery.id === bakeryId) && <option value={bakeryId}>Cửa hàng đã chọn</option>}{available.data.result.map((bakery) => <option key={bakery.id} value={bakery.id}>{bakery.name}</option>)}</select><details><summary className="cursor-pointer text-xs">Nhập mã cửa hàng khác</summary><input className={inputClass} value={input} onChange={(e) => setInput(e.target.value)} aria-label="Mã cửa hàng khác" /><button disabled={disabled || !isCatalogId(input)} className={buttonClass} onClick={() => onSelect(input)}>Xem cửa hàng</button></details></section>
  if (available.error) return <ApiErrorMessage error={available.error} retry={available.reload} />
  return <form className="sc-panel sc-bakery-selector" onSubmit={(event) => {
    event.preventDefault()
    if (disabled) return
    if (!isCatalogId(input.trim())) return setError('Mã cửa hàng không hợp lệ. Vui lòng kiểm tra lại.')
    setError(''); onSelect(input.trim().toLowerCase())
  }}><div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,1fr)]"><div><label className="font-bold text-primary" htmlFor="managed-bakery"><Icon name="storefront" /> Cửa hàng cần quản lý</label><p className="mt-1 text-xs text-on-surface-variant">Chọn cửa hàng bạn đang quản lý.</p></div><div className="flex min-w-0 flex-wrap items-end gap-2"><input id="managed-bakery" disabled={disabled} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập mã cửa hàng" className={inputClass + ' min-w-0 flex-1'} required /><button disabled={disabled} className={buttonClass}>Xem cửa hàng</button></div></div>{error && <p role="alert" className="mt-2 text-red-700">{error}</p>}{bakeryId && <p className="mt-2 break-all text-xs text-on-surface-variant">Cửa hàng đang xem: {displayReference(bakeryId, 'SHOP')}</p>}<details className="mt-2 text-xs text-on-surface-variant"><summary className="cursor-pointer">Vì sao cần mã cửa hàng?</summary><p className="mt-2">Nhập mã được cấp khi tạo tiệm hoặc tham gia quản lý tiệm. Bạn chỉ được truy cập các tiệm có quyền quản lý.</p></details></form>
}

export default function VendorFrame({ title, activeTab, bakeryId, onNavigate, children }) {
  const { user } = useAuth()
  const [mobile, setMobile] = useState(false)
  const navigate = (route) => onNavigate(vendorRoute(route, bakeryId))
  return <div className="sc-portal sc-portal--vendor"><VendorSidebar activeTab={activeTab} onNavigate={navigate} isMobileOpen={mobile} onCloseMobile={() => setMobile(false)} showMockBadges={false} /><PortalHeader title={title} user={user} portal="Đối tác" onMenu={() => setMobile(true)} /><main id="workspace-content" className="sc-portal-main"><BackgroundOrnaments variant={activeTab} /><div className="sc-workspace">{children}</div></main></div>
}
