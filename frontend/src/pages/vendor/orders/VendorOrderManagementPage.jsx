import { canonicalBakeryId } from '../../../services/unifiedDataService.js'
import BusinessSimulationReport from '../../../components/management/BusinessSimulationReport.jsx'
import React, { useState } from 'react'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import VendorOrderList, { VendorOrderError } from './VendorOrderList.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadDashboardAccess } from '../../../services/vendorDashboardService.js'
import { DetailDrawer } from '../../../components/common/WorkspaceUI.jsx'
import { QuoteWorkspace } from '../rfq/VendorBespokeQuoteSubmitPage.jsx'
import './vendor-orders.css'

const orderTabs = [
  ['requests', 'Yêu cầu bánh'],
  ['orders', 'Đơn hàng'],
  ['offers', 'Báo giá'],
]

function VerifiedVendorOrders({ bakeryId, bakery, user, roles, initialOrderId, initialTab, onNavigate }) {
  const [tab, setTab] = useState(initialTab)
  const [detail, setDetail] = useState(null)
  const access = useCatalogResource(loadDashboardAccess, { bakeryId, userId: user.id })
  if (access.status === 'loading') return <p role="status" className="sc-panel">Đang xác minh quyền quản lý cửa hàng…</p>
  if (access.error) return <VendorOrderError resource={access} />
  const navigation = <nav className="sc-business-tabs" aria-label="Danh mục quản lý đơn hàng">
      {orderTabs.map(([key, label]) => (
        <button key={key} type="button" className={'sc-button sc-action-button--secondary' + (tab === key ? ' is-selected' : '')}
          aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>
      ))}
  </nav>
  const openRecord = (kind, id) => setDetail(new URLSearchParams({ [kind === 'offers' ? 'offerId' : 'cakeRequestId']: id }))
  const navigateDetail = route => {
    const [path, search] = route.split('?')
    if (path !== 'vendor-quote-submit') { onNavigate(route); return }
    const query = new URLSearchParams(search)
    if (query.has('offerId')) setTab('offers')
    setDetail(query)
  }
  return <section className="sc-panel sc-vendor-order-workspace" aria-label="Danh sách quản lý đơn hàng">
    <div hidden={tab !== 'orders'}>
      <VendorOrderList actor={user} bakeryId={bakeryId} initialOrderId={initialOrderId} embedded navigation={tab === 'orders' ? navigation : null} />
    </div>
    {tab === 'requests' && bakery?.status === 'ACTIVE' && !bakery.operations?.serviceAreas?.some(area => area.active) &&
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <p>Tiệm chưa có khu vực giao hàng để nhận yêu cầu phù hợp.</p>
        <button type="button" className="sc-button sc-action-button--secondary" onClick={() => onNavigate('vendor-settings?bakeryId=' + encodeURIComponent(bakeryId))}>Cấu hình giao hàng</button>
      </div>}
    {tab !== 'orders' && <BusinessSimulationReport key={tab} bakeryId={bakeryId} bakery={bakery} loadHistory showMetrics={false} activeTab={tab} navigation={navigation} onOpenRecord={openRecord} />}
    {detail && <DetailDrawer title={detail.has('offerId') ? 'Chi tiết báo giá' : 'Chi tiết yêu cầu'} className="sc-workspace-detail" onClose={() => setDetail(null)}>
      <QuoteWorkspace bakeryId={bakeryId} user={user} roles={roles} query={detail} onNavigate={navigateDetail} />
    </DetailDrawer>}
  </section>
}

export default function VendorOrderManagementPage({ onNavigate, routeSearch = '', initialTab = 'orders' }) {
  const owner = useVendorBakery(routeSearch)
  const { bakeryId, user, roles, available } = owner
  const query = new URLSearchParams(routeSearch)
  const orderId = !query.get('bakeryId') || canonicalBakeryId(query.get('bakeryId').toLowerCase()) === bakeryId ? query.get('orderId') : null
  const tab = orderId ? 'orders' : orderTabs.some(([key]) => key === query.get('tab')) ? query.get('tab') : initialTab
  return <VendorFrame owner={owner} title="Quản lý đơn hàng" activeTab="orders" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-vendor-orders">{bakeryId ? <VerifiedVendorOrders key={user.id + ':' + bakeryId} bakeryId={bakeryId} bakery={owner.bakery} user={user} roles={roles} initialOrderId={orderId || ''} initialTab={tab} onNavigate={onNavigate} /> : <p role="status">{available.status === 'loading' ? 'Đang tải cửa hàng…' : 'Chọn cửa hàng bạn có quyền quản lý để xem đơn hàng.'}</p>}</div></VendorFrame>
}
