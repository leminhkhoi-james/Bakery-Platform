import React from 'react'
import { OrderList, OrderDetail } from '../../../components/orders/OrderViews.jsx'

export default function OrderTrackingPage({ onNavigate, routeSearch = '' }) {
  const orderId = new URLSearchParams(routeSearch).get('orderId')
  return <main className="sc-customer striped-candy-bg min-h-[60vh] px-4 py-8"><div className="mx-auto max-w-6xl space-y-5"><div className="sc-customer-heading"><p className="sc-kicker">Hành trình chiếc bánh</p><h1 className="font-serif text-3xl font-semibold text-primary">Đơn hàng & Giao nhận</h1></div>{orderId ? <><button className="underline" onClick={() => onNavigate('tracking')}>← Lịch sử đơn hàng</button><OrderDetail key={orderId} orderId={orderId} /></> : <OrderList onNavigate={onNavigate} />}</div></main>
}
