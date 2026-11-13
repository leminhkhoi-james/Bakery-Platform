import React from 'react'
import { OrderList, OrderDetail } from '../../../components/orders/OrderViews.jsx'

export default function OrderTrackingPage({ onNavigate, routeSearch = '' }) {
  const orderId = new URLSearchParams(routeSearch).get('orderId')
  return (
    <main className="sc-customer min-h-[60vh] px-4 sm:px-6 py-4 sm:py-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between gap-3">
          {orderId ? (
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 border border-primary/20 text-xs font-bold text-wine shadow-xs hover:bg-white hover:text-secondary hover:shadow transition-all cursor-pointer"
              onClick={() => onNavigate('tracking')}
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Lịch sử đơn hàng</span>
            </button>
          ) : (
            <div className="space-y-0.5">
              <p className="sc-kicker text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">local_shipping</span>
                <span>Hành trình chiếc bánh</span>
              </p>
              <h1 className="font-savoure text-2xl sm:text-3xl font-bold text-wine">
                Đơn hàng &amp; Giao nhận
              </h1>
            </div>
          )}

          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 border border-primary/20 text-xs font-bold text-wine shadow-xs hover:bg-white hover:text-secondary hover:shadow transition-all cursor-pointer"
            onClick={() => onNavigate('explore')}
          >
            <span className="material-symbols-outlined text-sm">cake</span>
            <span>Khám phá thêm bánh</span>
          </button>
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
