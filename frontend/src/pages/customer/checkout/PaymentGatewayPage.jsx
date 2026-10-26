import React from 'react'
import { buttonClass, panelClass } from '../../../components/management/ApiState.jsx'

export default function PaymentGatewayPage({ onNavigate }) {
  return <main className="mx-auto max-w-4xl px-4 py-12"><section className={panelClass}><h1 className="text-2xl font-bold text-primary">Thanh toán đơn bánh</h1><p>Backend chưa hỗ trợ cổng thanh toán, escrow hoặc hoàn tiền cho đơn bánh. Trang này không xác nhận thanh toán và không tạo đơn.</p><p>Xem tổng tiền và trạng thái giao nhận do Order Service xác nhận trong chi tiết đơn. Thanh toán gói Subscription là luồng riêng.</p><div className="flex flex-wrap gap-3"><button className={buttonClass} onClick={() => onNavigate('tracking')}>Xem đơn hàng</button><button className="rounded-xl border px-4 py-2" onClick={() => onNavigate('cart')}>Về giỏ hàng</button></div></section></main>
}
