import React from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { OrderList } from '../../../components/orders/OrderViews.jsx'
export default function AdminOrdersEscrowPage({ onNavigate, routeSearch = '' }) {
  const orderId = new URLSearchParams(routeSearch).get('orderId') || ''
  return <AdminFrame title="Quản lý đơn hàng" activeTab="admin-orders" onNavigate={onNavigate}><p className="text-sm">Order Service cung cấp đơn, chi tiết, trạng thái và review. Không có escrow, hoàn tiền hoặc thống kê doanh thu.</p><OrderList key={orderId} scope="all" initialOrderId={orderId} /></AdminFrame>
}
