import React from 'react'
import { OrderList, OrderDetail } from '../../../components/orders/OrderViews.jsx'

export default function OrderTrackingPage({ onNavigate, routeSearch = '' }) {
  const orderId = new URLSearchParams(routeSearch).get('orderId')
  return <main className="striped-candy-bg min-h-[60vh] px-4 py-8"><div className="mx-auto max-w-6xl space-y-5"><h1 className="text-3xl font-bold text-primary">Đơn hàng & Giao nhận</h1>{orderId ? <><button className="underline" onClick={() => onNavigate('tracking')}>← Lịch sử đơn hàng</button><OrderDetail key={orderId} orderId={orderId} /></> : <OrderList onNavigate={onNavigate} />}</div></main>
}
