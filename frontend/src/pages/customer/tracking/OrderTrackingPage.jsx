import React from 'react'
import { OrderList, OrderDetail } from '../../../components/orders/OrderViews.jsx'

export default function OrderTrackingPage({ onNavigate, routeSearch = '' }) {
  const orderId = new URLSearchParams(routeSearch).get('orderId')
  return (
    <main className="sc-customer min-h-[60vh] px-4 sm:px-6 py-4 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Top Header Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-primary/15 shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="sc-kicker text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">local_shipping</span>
              <span>Hành trình chiếc bánh</span>
            </p>
            <h1 className="font-savoure text-2xl sm:text-3xl font-bold text-wine">
              Đơn hàng &amp; Giao nhận
            </h1>
          </div>
          {orderId ? (
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-primary/20 text-xs font-bold text-wine shadow-2xs hover:bg-primary-fixed-dim transition-all cursor-pointer"
              onClick={() => onNavigate('tracking')}
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>← Lịch sử đơn hàng</span>
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-primary/20 text-xs font-bold text-wine shadow-2xs hover:bg-primary-fixed-dim transition-all cursor-pointer"
              onClick={() => onNavigate('explore')}
            >
              <span className="material-symbols-outlined text-sm">cake</span>
              <span>Khám phá mẫu bánh</span>
            </button>
          )}
        </div>

        {orderId ? (
          <OrderDetail key={orderId} orderId={orderId} onNavigate={onNavigate} />
        ) : (
          <OrderList onNavigate={onNavigate} />
        )}
      </div>
    </main>
  )
}
