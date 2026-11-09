import { canonicalBakeryId } from '../../../services/unifiedDataService.js'
import BusinessSimulationReport from '../../../components/management/BusinessSimulationReport.jsx'
import React, { useState } from 'react'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import VendorOrderList, { VendorOrderError } from './VendorOrderList.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadDashboardAccess } from '../../../services/vendorDashboardService.js'
import './vendor-orders.css'

const orderTabs = [
  ['orders', 'Đơn hàng'],
  ['requests', 'Yêu cầu bánh'],
  ['offers', 'Báo giá'],
  ['customers', 'Khách hàng'],
  ['transactions', 'Thu & hoàn'],
]

function VerifiedVendorOrders({ bakeryId, bakery, userId, initialOrderId }) {
  const [tab, setTab] = useState('orders')
  const access = useCatalogResource(loadDashboardAccess, { bakeryId, userId })
  if (access.status === 'loading') return <p role="status" className="sc-panel">Đang xác minh quyền quản lý cửa hàng…</p>
  if (access.error) return <VendorOrderError resource={access} />
  const navigation = <nav className="sc-business-tabs" aria-label="Danh mục quản lý đơn hàng">
      {orderTabs.map(([key, label]) => (
        <button key={key} type="button" className={'sc-button sc-action-button--secondary' + (tab === key ? ' is-selected' : '')}
          aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>
      ))}
  </nav>
  return <section className="sc-panel">
    <div hidden={tab !== 'orders'}>
      <VendorOrderList bakeryId={bakeryId} initialOrderId={initialOrderId} embedded navigation={tab === 'orders' ? navigation : null} />
    </div>
    {tab !== 'orders' && <BusinessSimulationReport key={tab} bakeryId={bakeryId} bakery={bakery} loadHistory showMetrics={false} activeTab={tab} navigation={navigation} />}
  </section>
}

export default function VendorOrderManagementPage({ onNavigate, routeSearch = '' }) {
  const owner = useVendorBakery(routeSearch)
  const { bakeryId, user, available } = owner
  const query = new URLSearchParams(routeSearch)
  const orderId = !query.get('bakeryId') || canonicalBakeryId(query.get('bakeryId').toLowerCase()) === bakeryId ? query.get('orderId') : null
  return <VendorFrame owner={owner} title="Quản lý đơn hàng" activeTab="orders" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-vendor-orders">{bakeryId ? <VerifiedVendorOrders key={user.id + ':' + bakeryId} bakeryId={bakeryId} bakery={owner.bakery} userId={user.id} initialOrderId={orderId || ''} /> : <p role="status">{available.status === 'loading' ? 'Đang tải cửa hàng…' : 'Chọn cửa hàng bạn có quyền quản lý để xem đơn hàng.'}</p>}</div></VendorFrame>
}
