import React from 'react'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import { buttonClass, panelClass } from '../../../components/management/ApiState.jsx'

export default function PaymentGatewayPage({ onNavigate }) {
  return <main className="sc-customer mx-auto max-w-4xl px-4 py-8"><section className={panelClass}><div className="flex items-center gap-3"><span className="sc-empty-icon"><Icon name="account_balance_wallet" /></span><h1 className="font-serif text-2xl font-semibold text-primary">Thanh toán đơn bánh</h1></div><p>Vui lòng thỏa thuận phương thức thanh toán trực tiếp với tiệm qua tin nhắn. Trang này không thu tiền hoặc xác nhận giao dịch.</p><p>Xem tổng tiền và tiến độ giao nhận trong chi tiết đơn hàng. Liên hệ tiệm nếu bạn cần hủy hoặc trao đổi về khoản đã thanh toán.</p><div className="flex flex-wrap gap-3"><button className={buttonClass} onClick={() => onNavigate('tracking')}>Xem đơn hàng</button><button className="rounded-xl border px-4 py-2" onClick={() => onNavigate('cart')}>Về giỏ hàng</button></div></section></main>
}
