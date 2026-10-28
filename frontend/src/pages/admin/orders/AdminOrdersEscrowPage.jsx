import React from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { OrderList } from '../../../components/orders/OrderViews.jsx'
export default function AdminOrdersEscrowPage({ onNavigate, routeSearch = '' }) {
  const orderId = new URLSearchParams(routeSearch).get('orderId') || ''
  const status = new URLSearchParams(routeSearch).get('status') || ''
  return <AdminFrame activeTab="admin-orders" onNavigate={onNavigate}><OrderList showHeading={false} key={JSON.stringify([orderId, status])} scope="all" initialOrderId={orderId} initialStatus={status} /></AdminFrame>
}
