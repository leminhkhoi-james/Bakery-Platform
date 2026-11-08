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
import { rfqService } from '../../services/rfqService.js'
import { moneyVnd } from '../../services/marketplaceModels.js'
import VendorNotificationBell from './VendorNotificationBell.jsx'

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
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const navigate = (route) => onNavigate(vendorRoute(route, bakeryId))

  const rfqsResource = useCatalogResource(rfqService.getRfqs, { scope: 'available', status: 'OPEN', page: 1, size: 8 })
  const openRfqs = rfqsResource.data?.result || []
  const rfqCount = openRfqs.length
  const latestRfq = openRfqs[0]

  const currentCakeRequestId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('cakeRequestId')
    : null

  const showBanner = !bannerDismissed && rfqCount > 0 && !currentCakeRequestId && activeTab !== 'rfq'

  const notificationBell = (
    <VendorNotificationBell
      openRfqs={openRfqs}
      onNavigate={navigate}
      bakeryId={bakeryId}
    />
  )

  return (
    <div className="sc-portal sc-portal--vendor">
      <VendorSidebar
        activeTab={activeTab}
        onNavigate={navigate}
        isMobileOpen={mobile}
        onCloseMobile={() => setMobile(false)}
        showMockBadges={false}
        rfqCount={rfqCount}
      />
      <PortalHeader
        title={title}
        showPortalLabel={false}
        user={user}
        portal="Đối tác"
        onMenu={() => setMobile(true)}
        onNavigate={onNavigate}
        action={notificationBell}
      />
      <main id="workspace-content" className="sc-portal-main">
        <BackgroundOrnaments variant={activeTab} />
        <div className="sc-workspace">
          {showBanner && latestRfq && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50/80 px-4 py-3 shadow-xs mb-1">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs animate-pulse">
                  <Icon name="campaign" className="text-xl" />
                </span>
                <div className="min-w-0 text-xs sm:text-sm">
                  <p className="font-bold text-rose-950 flex items-center gap-2">
                    <span>Có {rfqCount} yêu cầu làm bánh mới cần báo giá</span>
                    <span className="rounded-full bg-rose-200/90 px-2 py-0.5 text-[10px] font-bold text-rose-900">Mới nhận</span>
                  </p>
                  <p className="text-stone-700 truncate mt-0.5">
                    <strong>{latestRfq.title}</strong> — <span className="text-primary font-bold">{moneyVnd(latestRfq.budgetMin)} - {moneyVnd(latestRfq.budgetMax)}</span> · {latestRfq.deliveryDistrict || 'TP.HCM'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('vendor-quote-submit?cakeRequestId=' + latestRfq.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-wine-dark px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Icon name="send" className="text-sm" /> Báo giá ngay
                </button>
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                  title="Đóng thông báo"
                >
                  <Icon name="close" className="text-base" />
                </button>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
