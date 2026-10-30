import { cleanPresentationLabel } from '../../services/uiLabels.js'
import React, { useState } from 'react'
import VendorSidebar from '../../layouts/vendor/VendorSidebar.jsx'
import { useAuth } from '../../context/useAuth.js'
import { isCatalogId } from '../../services/catalogModels.js'
import { vendorRoute } from '../../routes/catalogNavigation.js'
import { inputClass, buttonClass } from './ApiState.jsx'
import { PortalHeader, Icon } from '../common/WorkspaceUI.jsx'
import BackgroundOrnaments from '../common/BackgroundOrnaments.jsx'
import './vendor-selector.css'
import '../common/portal-header.css'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadManagedBakeries, dashboardErrorMessage } from '../../services/vendorDashboardService.js'

export function BakerySelector(props) {
  return props.available ? <BakeryChoice {...props} /> : <LoadedBakerySelector {...props} />
}

function LoadedBakerySelector(props) {
  const { user } = useAuth()
  const available = useCatalogResource(loadManagedBakeries, { userId: user.id })
  return <BakeryChoice {...props} available={available} />
}

function BakeryChoice({ bakeryId, onSelect, disabled = false, available, showError = true }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  return <section className="sc-panel sc-bakery-selector sc-managed-bakery-choice">
    <div className="sc-managed-bakery-row"><label htmlFor="managed-bakery"><Icon name="storefront" /> Cửa hàng đang quản lý</label>
      <select id="managed-bakery" className={inputClass} disabled={disabled || available.status === 'loading'} value={bakeryId || ''} onChange={(event) => onSelect(event.target.value)}>
        <option value="">{available.status === 'loading' ? 'Đang tải cửa hàng…' : 'Chọn cửa hàng'}</option>
        {bakeryId && !available.data?.some((bakery) => bakery.id === bakeryId) && <option value={bakeryId}>Cửa hàng đã chọn</option>}
        {available.data?.map((bakery) => <option key={bakery.id} value={bakery.id}>{cleanPresentationLabel(bakery.name, 'Tiệm bánh')}</option>)}
      </select>
    </div>
    {available.error && showError && <div role="alert" className="sc-managed-bakery-feedback">{dashboardErrorMessage(available.error)} {available.error.status !== 401 && <button className="sc-button sc-button--secondary" onClick={available.reload}>Thử lại</button>}</div>}
    {available.status === 'ready' && !available.data?.length && <p className="sc-managed-bakery-feedback">Chưa tìm thấy cửa hàng bạn có quyền quản lý trong danh sách.</p>}
    <details><summary>Nhập mã cửa hàng khác</summary><form onSubmit={(event) => {
      event.preventDefault()
      if (disabled) return
      if (!isCatalogId(input.trim())) return setError('Mã cửa hàng không hợp lệ. Vui lòng kiểm tra lại.')
      setError(''); onSelect(input.trim())
    }}><label htmlFor="managed-bakery-code">Mã cửa hàng</label><div className="flex min-w-0 gap-2"><input id="managed-bakery-code" className={inputClass} disabled={disabled} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập mã được cấp khi tạo cửa hàng" required /><button className={buttonClass} disabled={disabled}>Chọn</button></div>{error && <p role="alert">{error}</p>}</form></details>
  </section>
}

export default function VendorFrame({ title, activeTab, bakeryId, onNavigate, children }) {
  const { user } = useAuth()
  const [mobile, setMobile] = useState(false)
  const navigate = (route) => onNavigate(vendorRoute(route, bakeryId))
  return <div className="sc-portal sc-portal--vendor"><VendorSidebar activeTab={activeTab} onNavigate={navigate} isMobileOpen={mobile} onCloseMobile={() => setMobile(false)} showMockBadges={false} /><PortalHeader title={title} showPortalLabel={false} user={user} portal="Đối tác" onMenu={() => setMobile(true)} onNavigate={onNavigate} /><main id="workspace-content" className="sc-portal-main"><BackgroundOrnaments variant={activeTab} /><div className="sc-workspace">{children}</div></main></div>
}
