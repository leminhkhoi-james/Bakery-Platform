import React from 'react'
import { Icon, StatusBadge } from '../common/WorkspaceUI.jsx'
import { orderStatusLabel } from '../../services/orderModels.js'
import { uiLabel, cleanPresentationLabel } from '../../services/uiLabels.js'
import { formatOrderDate, formatOrderMoney, orderDisplayNumber, configurationEntries, orderHistoryEntries, orderHistoryNote, orderHistoryActor } from '../../services/orderPresentation.js'
import './order-tracking.css'

const stages = [ ['PENDING', 'schedule'], ['CONFIRMED', 'task_alt'], ['BAKING', 'cake'], ['READY', 'inventory_2'], ['DELIVERING', 'local_shipping'], ['COMPLETED', 'check_circle'] ]

export function OrderTrackingHeader({ order }) {
  return (
    <div className="sc-order-tracking-header">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-primary-fixed/50 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
          <Icon name="receipt_long" className="text-2xl" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary block truncate">
            {order.bakeryName ? `Tiệm: ${order.bakeryName}` : 'SweetCake Bakery'}
          </span>
          <p className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium mt-0.5">
            <Icon name="storefront" className="text-sm text-secondary shrink-0" />
            <span>Tiệm làm bánh đối tác</span>
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-outline block">
          Đơn hàng
        </span>
        <h2>{orderDisplayNumber(order)}</h2>
        <div className="mt-1 flex justify-end">
          <StatusBadge status={order.status} label={orderStatusLabel(order.status)} />
        </div>
      </div>
    </div>
  )
}

export function OrderProgress({ order }) {
  if (order.status === 'CANCELLED') return <section className="sc-order-cancelled" aria-label="Đơn hàng đã hủy"><Icon name="cancel" /><div><strong>Quy trình giao nhận đã dừng</strong><p>{orderHistoryNote(orderHistoryEntries(order.statusHistory).findLast((event) => event.toStatus === 'CANCELLED')?.note) || 'Xem lịch sử cập nhật để biết thêm chi tiết.'}</p></div></section>
  const current = stages.findIndex(([status]) => status === order.status)
  if (current < 0) return <p className="sc-order-muted">Chưa có thông tin tiến độ giao nhận.</p>
  return <div className="sc-order-progress-scroll" role="region" aria-label="Tiến trình giao nhận" tabIndex={0}><ol className="sc-order-progress">{stages.map(([status, icon], index) => <li key={status} aria-current={index === current ? 'step' : undefined} className={index < current ? 'is-complete' : index === current ? 'is-current' : ''}><span className="sc-order-step-icon"><Icon name={index < current ? 'check' : icon} /></span><span>{orderStatusLabel(status)}</span></li>)}</ol></div>
}

export default function OrderTrackingView({ order, showHeader = true, actionsSlot }) {
  const address = order.deliveryAddress
  const history = orderHistoryEntries(order.statusHistory)
  return <div className="sc-order-tracking-view">
    {showHeader && <OrderTrackingHeader order={order} />}
    
    {/* Haravan-Style Order Greeting Banner */}
    <div className="sc-order-greeting-banner">
      <h3 className="font-savoure text-lg sm:text-xl font-bold text-wine">
        Cảm ơn bạn đã đặt bánh!
      </h3>
      <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
        {order.status === 'CANCELLED'
          ? 'Đơn hàng này hiện đã dừng xử lý theo yêu cầu.'
          : `Xin chào ${cleanPresentationLabel(order.customerName, 'Quý khách')}, chúng tôi đã nhận được đặt hàng của bạn và tiệm bánh đã sẵn sàng để chuẩn bị đơn.`}
      </p>
    </div>

    <OrderProgress order={order} />
    {actionsSlot}

    <div className="sc-order-tracking-columns"><div className="sc-order-tracking-main">
      <section className="sc-order-tracking-card"><h3><Icon name="cake" />Sản phẩm trong đơn</h3>{order.items?.length ? <ul className="sc-order-items">{order.items.map((item) => {
        const options = configurationEntries(item.configuration)
        return <li key={item.id}><div className="sc-order-item-heading"><div><h4>{item.name || 'Chưa có tên sản phẩm'}</h4><p>{uiLabel(item.itemType === 'CAKE' ? 'CATALOG_PRODUCT' : item.itemType)}<span aria-hidden="true"> · </span>{item.quantity ?? '—'} × {formatOrderMoney(item.unitPrice, order.currency)}</p></div><strong>{formatOrderMoney(item.lineTotal, order.currency)}</strong></div>{options.length > 0 && <details className="sc-order-options"><summary><Icon name="tune" className="text-xs mr-0.5" />{item.itemType === 'CUSTOM_CAKE' || order.orderSource === 'ACCEPTED_OFFER' ? 'Chi tiết yêu cầu làm bánh' : 'Chi tiết tùy chọn bánh'}</summary><dl>{options.map((option, index) => <div key={index}><dt>{option.label}</dt><dd>{option.value}</dd></div>)}</dl></details>}</li>
      })}</ul> : <p className="sc-order-muted">Chưa có thông tin sản phẩm.</p>}</section>
      {['DELIVERING', 'COMPLETED'].includes(order.status) && (
        <section className="sc-order-tracking-card sc-order-delivery-card border-2 border-secondary/30 bg-surface-container-lowest shadow-sm" aria-label="Thông tin giao hàng hiện tại">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="text-secondary font-bold flex items-center gap-2"><Icon name="local_shipping" />{order.status === 'DELIVERING' ? 'Bánh đang trên đường giao' : 'Giao hàng thành công'}</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-secondary/15 text-secondary">{order.status === 'DELIVERING' ? 'Đang vận chuyển' : 'Đã giao tới khách'}</span>
          </div>
          <p className="text-sm text-on-surface-variant mb-3">
            {order.status === 'DELIVERING' ? 'Tiệm bánh đã bàn giao cho nhân viên giao hàng. Bánh đang được bảo quản và vận chuyển cẩn thận.' : 'Đơn hàng đã được giao an toàn đến địa chỉ người nhận.'}
          </p>
          <dl className="sc-order-facts text-sm">
            {history.findLast((e) => e.toStatus === 'DELIVERING')?.note && (
              <div><dt>Ghi chú vận chuyển</dt><dd className="font-semibold text-primary">{history.findLast((e) => e.toStatus === 'DELIVERING').note}</dd></div>
            )}
            <div><dt>Thời gian hẹn</dt><dd>{formatOrderDate(order.neededAt)}</dd></div>
            {address?.recipientPhone && <div><dt>SĐT nhận bánh</dt><dd className="font-medium text-primary">{address.recipientPhone}</dd></div>}
          </dl>
        </section>
      )}
      <section className="sc-order-tracking-card"><h3><Icon name="person" />Khách hàng & giao nhận</h3><dl className="sc-order-facts"><div><dt>Khách hàng</dt><dd>{cleanPresentationLabel(order.customerName, 'Chưa có tên')}<span className="sc-order-secondary-text">{order.customerPhone || 'Chưa có điện thoại'}</span></dd></div><div><dt>Ngày đặt</dt><dd>{formatOrderDate(order.createdAt)}</dd></div><div><dt>Hẹn giao</dt><dd>{formatOrderDate(order.neededAt)}</dd></div>{order.customerNote && <div><dt>Ghi chú</dt><dd className="sc-order-note">{order.customerNote}</dd></div>}</dl></section>
      <section className="sc-order-tracking-card"><h3><Icon name="location_on" />Địa chỉ nhận bánh</h3>{address ? <div className="sc-order-address"><strong>{cleanPresentationLabel(address.recipientName || order.customerName, 'Người nhận')}</strong>{address.recipientPhone && <p>{address.recipientPhone}</p>}<p>{[address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', ') || 'Chưa có thông tin địa chỉ giao hàng.'}</p>{address.deliveryNote && <p className="sc-order-note">{address.deliveryNote}</p>}</div> : <p className="sc-order-muted">Chưa có thông tin địa chỉ giao hàng.</p>}</section>
    </div><aside className="sc-order-tracking-summary"><section className="sc-order-tracking-card sc-order-totals"><h3><Icon name="receipt_long" />Tổng tiền đơn hàng</h3><dl><div><dt>Tiền hàng</dt><dd>{formatOrderMoney(order.subtotal, order.currency)}</dd></div><div><dt>Phí giao hàng</dt><dd>{formatOrderMoney(order.deliveryFee, order.currency)}</dd></div><div className="sc-order-grand-total"><dt>Tổng cộng</dt><dd>{formatOrderMoney(order.totalAmount, order.currency)}</dd></div></dl></section><section className="sc-order-tracking-card"><h3><Icon name="account_balance_wallet" />Thanh toán</h3><p className="sc-order-payment-note">Thanh toán trực tiếp theo thỏa thuận với tiệm.</p><p className="sc-order-muted">Tổng tiền đơn hàng không phải là xác nhận đã thanh toán. Liên hệ tiệm để đối chiếu khoản đã thanh toán hoặc trao đổi khi hủy đơn.</p><div className="sc-order-source"><span>Nguồn đơn</span><strong>{uiLabel(order.orderSource, 'Chưa có thông tin')}</strong></div></section></aside></div>
    <details className="sc-order-history"><summary><Icon name="history" /><span>Lịch sử trạng thái</span><small>{history.length} lần cập nhật</small><Icon name="expand_more" /></summary>{history.length ? <>{history.length === 1 && <p className="sc-order-history-help">Đơn này hiện chỉ có 1 bản ghi lịch sử được lưu.</p>}<ol>{history.map((event, index) => {
      const note = orderHistoryNote(event.note), actor = orderHistoryActor(event)
      return <li key={index}><div><strong>{event.fromStatus ? orderStatusLabel(event.fromStatus) + ' → ' : ''}{orderStatusLabel(event.toStatus)}</strong><time dateTime={event.changedAt && Number.isFinite(Date.parse(event.changedAt)) ? event.changedAt : undefined}>{formatOrderDate(event.changedAt)}</time></div>{actor && <p className="sc-order-history-actor">Người thực hiện: <span>{actor}</span></p>}{!actor && event.changedBy && <p className="sc-order-history-actor">Chưa có tên người thực hiện.</p>}{note && <p>{note}</p>}</li>
    })}</ol></> : <p className="sc-order-muted">Chưa có lịch sử trạng thái.</p>}</details>
  </div>
}
