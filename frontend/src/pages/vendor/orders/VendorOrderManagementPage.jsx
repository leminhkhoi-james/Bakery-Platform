import React from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import { OrderList } from '../../../components/orders/OrderViews.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'

export default function VendorOrderManagementPage({ onNavigate, routeSearch = '' }) {
  const { bakeryId, selectBakery } = useVendorBakery(routeSearch)
  const query = new URLSearchParams(routeSearch)
  const orderId = !query.get('bakeryId') || query.get('bakeryId').toLowerCase() === bakeryId ? query.get('orderId') : null
  return <VendorFrame title="Quản lý đơn hàng" activeTab="orders" bakeryId={bakeryId} onNavigate={onNavigate}><BakerySelector bakeryId={bakeryId} onSelect={selectBakery} />{bakeryId ? <OrderList key={bakeryId} scope="bakery" bakeryId={bakeryId} initialOrderId={orderId || ''} /> : <p>Chọn cửa hàng để tải đơn hàng theo quyền thành viên.</p>}</VendorFrame>
}
