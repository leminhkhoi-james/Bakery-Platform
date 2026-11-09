import { cleanPresentationLabel } from '../../services/uiLabels.js'
import React, { useState } from 'react'
import VendorSidebar from '../../layouts/vendor/VendorSidebar.jsx'
import { useAuth } from '../../context/useAuth.js'
import { vendorRoute } from '../../routes/catalogNavigation.js'
import { PortalHeader, Icon } from '../common/WorkspaceUI.jsx'
import BackgroundOrnaments from '../common/BackgroundOrnaments.jsx'
import '../common/portal-header.css'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { dashboardErrorMessage } from '../../services/vendorDashboardService.js'
import { moneyVnd } from '../../services/marketplaceModels.js'
import VendorNotificationBell from './VendorNotificationBell.jsx'
import './business-simulation.css'
import { loadVendorRequests } from '../../services/vendorRfqService.js'

const loadNotifications = ({ bakery, enabled }, options) => enabled ? loadVendorRequests({ bakery, status: 'OPEN', page: 1, size: 8 }, options) : Promise.resolve({ result: [] })


export default function VendorFrame({ owner, title, activeTab, bakeryId, onNavigate, children, bakerySelectionDisabled = false }) {
  const { user } = useAuth()
  const [mobile, setMobile] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const navigate = (route) => onNavigate(vendorRoute(route, bakeryId))

  const bakeries = owner.available?.data || []
  const currentBakery = owner.bakery || bakeries.find(bakery => bakery.id === bakeryId)
  const bakeryName = currentBakery ? cleanPresentationLabel(currentBakery.name, 'Tiệm bánh') : null
  const bakeryIdentity = bakeries.length > 1 ? (
    <select id="managed-bakery" className="sc-owner-header-shop" aria-label="Chuyển tiệm đang quản lý"
      value={bakeryId} disabled={bakerySelectionDisabled || owner.available.refreshing} onChange={event => owner.selectBakery(event.target.value)}>
      {bakeries.map(bakery => <option key={bakery.id} value={bakery.id}>{cleanPresentationLabel(bakery.name, 'Tiệm bánh')}</option>)}
    </select>
  ) : bakeryName

  const rfqsResource = useCatalogResource(loadNotifications, { bakery: owner.bakery, enabled: owner.state === 'ACTIVE' })
  const openRfqs = rfqsResource.data?.result || []
  const rfqCount = openRfqs.length
  const latestRfq = openRfqs[0]

  const currentCakeRequestId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('cakeRequestId')
    : null

  const showBanner = owner.state === 'ACTIVE' && !bannerDismissed && rfqCount > 0 && !currentCakeRequestId && activeTab !== 'rfq'

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
        description={bakeryIdentity}
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
          {owner.available?.error && <div className="sc-unified-issue" role="alert">
            <p>{dashboardErrorMessage(owner.available.error)}</p>
            {owner.available.error.status !== 401 && <button type="button" className="sc-button sc-action-button--secondary" onClick={owner.reload}>Thử lại</button>}
          </div>}
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
          {owner?.state === 'ACTIVE' && activeTab === 'rfq' && !owner.bakery?.operations?.serviceAreas?.some(area => area.active) && <section className="sc-panel space-y-2"><p>Tiệm chưa có khu vực giao hàng đang phục vụ. Cấu hình khu vực để nhận yêu cầu báo giá phù hợp.</p><button className={buttonClass} onClick={() => navigate('vendor-settings')}>Cấu hình giao hàng</button></section>}

          {children}
        </div>
      </main>
    </div>
  )
}
