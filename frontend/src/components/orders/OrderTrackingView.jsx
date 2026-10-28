import React from 'react'
import { Icon, StatusBadge } from '../common/WorkspaceUI.jsx'
import { orderStatusLabel } from '../../services/orderModels.js'
import { uiLabel, cleanPresentationLabel } from '../../services/uiLabels.js'
import { formatOrderDate, formatOrderMoney, orderDisplayNumber, configurationEntries } from '../../services/orderPresentation.js'
import './order-tracking.css'

const stages = [ ['PENDING', 'schedule'], ['CONFIRMED', 'task_alt'], ['BAKING', 'cake'], ['READY', 'inventory_2'], ['DELIVERING', 'local_shipping'], ['COMPLETED', 'check_circle'] ]
export function OrderTrackingHeader({ order }) {
  return <div className="sc-order-tracking-header"><div><h2>{orderDisplayNumber(order)}</h2><p><Icon name="storefront" />{order.bakeryName || 'Chưa có tên cửa hàng'}</p></div><StatusBadge status={order.status} label={orderStatusLabel(order.status)} /></div>
}
export function OrderProgress({ order }) {
  if (order.status === 'CANCELLED') return <section className="sc-order-cancelled" aria-label="Đơn hàng đã hủy"><Icon name="cancel" /><div><strong>Quy trình giao nhận đã dừng</strong><p>{order.statusHistory?.findLast((event) => event.toStatus === 'CANCELLED')?.note || 'Xem lịch sử cập nhật để biết thêm chi tiết.'}</p></div></section>
  const current = stages.findIndex(([status]) => status === order.status)
  if (current < 0) return <p className="sc-order-muted">Chưa có thông tin tiến độ giao nhận.</p>
  return <div className="sc-order-progress-scroll" role="region" aria-label="Tiến trình giao nhận" tabIndex={0}><ol className="sc-order-progress">{stages.map(([status, icon], index) => <li key={status} aria-current={index === current ? 'step' : undefined} className={index < current ? 'is-complete' : index === current ? 'is-current' : ''}><span className="sc-order-step-icon"><Icon name={index < current ? 'check' : icon} /></span><span>{orderStatusLabel(status)}</span></li>)}</ol></div>
}
export default function OrderTrackingView({ order, showHeader = true, actionsSlot }) {
  const address = order.deliveryAddress
  return <div className="sc-order-tracking-view">
    {showHeader && <OrderTrackingHeader order={order} />}
    <OrderProgress order={order} />
    {actionsSlot}
    <div className="sc-order-tracking-columns"><div className="sc-order-tracking-main">
      <section className="sc-order-tracking-card"><h3><Icon name="cake" />Sản phẩm trong đơn</h3>{order.items?.length ? <ul className="sc-order-items">{order.items.map((item) => {
        const options = configurationEntries(item.configuration)
        return <li key={item.id}><div className="sc-order-item-heading"><div><h4>{item.name || 'Chưa có tên sản phẩm'}</h4><p>{uiLabel(item.itemType === 'CAKE' ? 'CATALOG_PRODUCT' : item.itemType)}<span aria-hidden="true"> · </span>{item.quantity ?? '—'} × {formatOrderMoney(item.unitPrice, order.currency)}</p></div><strong>{formatOrderMoney(item.lineTotal, order.currency)}</strong></div>{options.length > 0 && <details className="sc-order-options"><summary>Cấu hình đã đặt</summary><dl>{options.map((option, index) => <div key={index}><dt>{option.label}</dt><dd>{option.value}</dd></div>)}</dl></details>}</li>
      })}</ul> : <p className="sc-order-muted">Chưa có thông tin sản phẩm.</p>}</section>
      <section className="sc-order-tracking-card"><h3><Icon name="person" />Khách hàng & giao nhận</h3><dl className="sc-order-facts"><div><dt>Khách hàng</dt><dd>{cleanPresentationLabel(order.customerName, 'Chưa có tên')}<span className="sc-order-secondary-text">{order.customerPhone || 'Chưa có điện thoại'}</span></dd></div><div><dt>Ngày đặt</dt><dd>{formatOrderDate(order.createdAt)}</dd></div><div><dt>Hẹn giao</dt><dd>{formatOrderDate(order.neededAt)}</dd></div>{order.customerNote && <div><dt>Ghi chú</dt><dd className="sc-order-note">{order.customerNote}</dd></div>}</dl></section>
      <section className="sc-order-tracking-card"><h3><Icon name="location_on" />Địa chỉ nhận bánh</h3>{address ? <div className="sc-order-address"><strong>{cleanPresentationLabel(address.recipientName || order.customerName, 'Người nhận')}</strong>{address.recipientPhone && <p>{address.recipientPhone}</p>}<p>{[address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', ') || 'Chưa có thông tin địa chỉ giao hàng.'}</p>{address.deliveryNote && <p className="sc-order-note">{address.deliveryNote}</p>}</div> : <p className="sc-order-muted">Chưa có thông tin địa chỉ giao hàng.</p>}</section>
    </div><aside className="sc-order-tracking-summary"><section className="sc-order-tracking-card sc-order-totals"><h3><Icon name="receipt_long" />Tổng tiền đơn hàng</h3><dl><div><dt>Tiền hàng</dt><dd>{formatOrderMoney(order.subtotal, order.currency)}</dd></div><div><dt>Phí giao hàng</dt><dd>{formatOrderMoney(order.deliveryFee, order.currency)}</dd></div><div className="sc-order-grand-total"><dt>Tổng cộng</dt><dd>{formatOrderMoney(order.totalAmount, order.currency)}</dd></div></dl></section><section className="sc-order-tracking-card"><h3><Icon name="account_balance_wallet" />Thanh toán</h3><p className="sc-order-payment-note">Thanh toán trực tiếp theo thỏa thuận với tiệm.</p><p className="sc-order-muted">Tổng tiền đơn hàng không phải là xác nhận đã thanh toán. Liên hệ tiệm để đối chiếu khoản đã thanh toán hoặc trao đổi khi hủy đơn.</p><div className="sc-order-source"><span>Nguồn đơn</span><strong>{uiLabel(order.orderSource, 'Chưa có thông tin')}</strong></div></section></aside></div>
    <details className="sc-order-history"><summary><Icon name="history" /><span>Lịch sử trạng thái</span><small>{order.statusHistory?.length || 0} lần cập nhật</small><Icon name="expand_more" /></summary>{order.statusHistory?.length ? <ol>{order.statusHistory.map((event, index) => <li key={index}><div><strong>{event.fromStatus ? orderStatusLabel(event.fromStatus) + ' → ' : ''}{orderStatusLabel(event.toStatus)}</strong><time dateTime={event.changedAt || undefined}>{formatOrderDate(event.changedAt)}</time></div>{event.note && <p>{event.note}</p>}</li>)}</ol> : <p className="sc-order-muted">Chưa có lịch sử trạng thái.</p>}</details>
  </div>
}
