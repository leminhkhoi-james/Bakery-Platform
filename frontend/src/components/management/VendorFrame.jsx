import { uiLabel, cleanPresentationLabel } from '../../services/uiLabels.js'
import { ManualRefreshContext } from '../../context/ManualRefreshContext.js'
import '../../styles/portal-refinements.css'
import React, { useState } from 'react'
import VendorSidebar from '../../layouts/vendor/VendorSidebar.jsx'
import { useAuth } from '../../context/useAuth.js'
import { vendorRoute } from '../../routes/catalogNavigation.js'
import { PortalHeader } from '../common/WorkspaceUI.jsx'
import BackgroundOrnaments from '../common/BackgroundOrnaments.jsx'
import '../common/portal-header.css'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { dashboardErrorMessage } from '../../services/vendorDashboardService.js'
import './business-simulation.css'
import { buttonClass } from './ApiState.jsx'
import { loadVendorRequests } from '../../services/vendorRfqService.js'
import { loadOrders } from '../../services/orderService.js'

const loadNotifications = ({ bakery, enabled }, options) => enabled ? loadVendorRequests({ bakery, status: 'OPEN', all: true, excludeQuoted: true }, options) : Promise.resolve({ result: [] })
const loadPendingOrders = ({ bakeryId, enabled }, options) => enabled && bakeryId
  ? loadOrders({ bakeryId, scope: 'bakery', status: 'PENDING', page: 1, size: 1 }, options)
  : Promise.resolve(null)


export default function VendorFrame({ owner, title, activeTab, bakeryId, onNavigate, children, bakerySelectionDisabled = false }) {
  const { user } = useAuth()
  const [mobile, setMobile] = useState(false)
  const navigate = (route) => onNavigate(vendorRoute(route, bakeryId))

  const bakeries = owner.available?.data || []
  const currentBakery = owner.bakery || bakeries.find(bakery => bakery.id === bakeryId)
  const bakeryName = currentBakery ? cleanPresentationLabel(currentBakery.name, 'Tiệm bánh') : null
  const bakeryIdentity = bakeries.length > 1 ? (
    <select id="managed-bakery" className="sc-owner-header-shop" aria-label="Chuyển tiệm đang quản lý"
      value={bakeryId} disabled={bakerySelectionDisabled || owner.available.refreshing} onChange={event => owner.selectBakery(event.target.value)}>
      {bakeries.map(bakery => <option key={bakery.id} value={bakery.id}>{cleanPresentationLabel(bakery.name, 'Tiệm bánh')}{bakery.status && bakery.status !== 'ACTIVE' ? ' · ' + uiLabel(bakery.status) : ''}</option>)}
    </select>
  ) : bakeryName

  const rfqsResource = useCatalogResource(loadNotifications, { bakery: owner.bakery, enabled: owner.state === 'ACTIVE' })
  const openRfqs = rfqsResource.data?.result || []
  const pendingOrders = useCatalogResource(loadPendingOrders, { bakeryId, enabled: owner.state === 'ACTIVE' })
  const pendingOrderCount = pendingOrders.status === 'ready' ? pendingOrders.data?.meta.total : null
  const rfqCount = openRfqs.length

  return (
    <ManualRefreshContext.Provider value={false}><div className="sc-portal sc-portal--vendor">
      <VendorSidebar
        activeTab={activeTab}
        onNavigate={navigate}
        isMobileOpen={mobile}
        onCloseMobile={() => setMobile(false)}
        showMockBadges={false}
        rfqCount={rfqCount}
        pendingOrderCount={pendingOrderCount}
      />
      <PortalHeader
        title={title}
        description={bakeryIdentity}
        showPortalLabel={false}
        user={user}
        portal="Đối tác"
        onMenu={() => setMobile(true)}
        onNavigate={onNavigate}
      />
      <main id="workspace-content" className="sc-portal-main">
        <BackgroundOrnaments variant={activeTab} />
        <div className="sc-workspace">
          {owner.available?.error && <div className="sc-unified-issue" role="alert">
            <p>{dashboardErrorMessage(owner.available.error)}</p>
          </div>}
          {owner?.state === 'ACTIVE' && activeTab === 'rfq' && !owner.bakery?.operations?.serviceAreas?.some(area => area.active) && <section className="sc-panel space-y-2"><p>Tiệm chưa có khu vực giao hàng đang phục vụ. Cấu hình khu vực để nhận yêu cầu báo giá phù hợp.</p><button className={buttonClass} onClick={() => navigate('vendor-settings')}>Cấu hình giao hàng</button></section>}

          {children}
        </div>
      </main>
    </div></ManualRefreshContext.Provider>
  )
}
