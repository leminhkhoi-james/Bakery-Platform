import React from 'react'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import { buttonClass, panelClass } from '../../../components/management/ApiState.jsx'

export default function PaymentGatewayPage({ onNavigate }) {
  return <main className="sc-customer mx-auto max-w-4xl px-4 py-8"><section className={panelClass}><div className="flex items-center gap-3"><span className="sc-empty-icon"><Icon name="account_balance_wallet" /></span><h1 className="font-serif text-2xl font-semibold text-primary">Thanh toán đơn bánh</h1></div><p>Backend chưa hỗ trợ cổng thanh toán, escrow hoặc hoàn tiền cho đơn bánh. Trang này không xác nhận thanh toán và không tạo đơn.</p><p>Xem tổng tiền và trạng thái giao nhận do Order Service xác nhận trong chi tiết đơn. Thanh toán gói Subscription là luồng riêng.</p><div className="flex flex-wrap gap-3"><button className={buttonClass} onClick={() => onNavigate('tracking')}>Xem đơn hàng</button><button className="rounded-xl border px-4 py-2" onClick={() => onNavigate('cart')}>Về giỏ hàng</button></div></section></main>
}
