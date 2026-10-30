import React from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import VendorOrderList, { VendorOrderError } from './VendorOrderList.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadDashboardAccess } from '../../../services/vendorDashboardService.js'
import './vendor-orders.css'

function VerifiedVendorOrders({ bakeryId, userId, initialOrderId }) {
  const access = useCatalogResource(loadDashboardAccess, { bakeryId, userId })
  if (access.status === 'loading') return <p role="status" className="sc-panel">Đang xác minh quyền quản lý cửa hàng…</p>
  if (access.error) return <VendorOrderError resource={access} />
  return <VendorOrderList bakeryId={bakeryId} initialOrderId={initialOrderId} />
}

export default function VendorOrderManagementPage({ onNavigate, routeSearch = '' }) {
  const { bakeryId, selectBakery, user, available } = useVendorBakery(routeSearch)
  const query = new URLSearchParams(routeSearch)
  const orderId = !query.get('bakeryId') || query.get('bakeryId').toLowerCase() === bakeryId ? query.get('orderId') : null
  return <VendorFrame title="Quản lý đơn hàng" activeTab="orders" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-vendor-orders"><BakerySelector bakeryId={bakeryId} onSelect={selectBakery} available={available} />{bakeryId ? <VerifiedVendorOrders key={user.id + ':' + bakeryId} bakeryId={bakeryId} userId={user.id} initialOrderId={orderId || ''} /> : <p role="status">{available.status === 'loading' ? 'Đang tải cửa hàng…' : 'Chọn cửa hàng bạn có quyền quản lý để xem đơn hàng.'}</p>}</div></VendorFrame>
}
