import React from 'react'
import { Icon, StatusBadge } from '../common/WorkspaceUI.jsx'
import { orderStatusLabel } from '../../services/orderModels.js'
import { uiLabel, cleanPresentationLabel } from '../../services/uiLabels.js'
import { formatOrderDate, formatOrderMoney, orderDisplayNumber, configurationEntries, orderHistoryEntries, orderHistoryNote } from '../../services/orderPresentation.js'
import './order-tracking.css'

const stages = [ ['PENDING', 'schedule'], ['CONFIRMED', 'task_alt'], ['BAKING', 'cake'], ['READY', 'inventory_2'], ['DELIVERING', 'local_shipping'], ['COMPLETED', 'check_circle'] ]

export function OrderTrackingHeader({ order }) {
  return (
    <div className="sc-order-tracking-header">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-outline block">Cửa hàng</span>
        <strong className="sc-order-bakery-name">{order.bakeryName || 'Chưa có tên tiệm'}</strong>
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
  if (order.status === 'CANCELLED') return <section className="sc-order-cancelled" aria-label="Đơn hàng đã hủy"><Icon name="cancel" /><div><strong>Quy trình giao nhận đã dừng</strong><p>{orderHistoryNote(orderHistoryEntries(order.statusHistory).findLast((event) => event.toStatus === 'CANCELLED')?.note) || 'Liên hệ tiệm để biết thêm chi tiết.'}</p></div></section>
  const current = stages.findIndex(([status]) => status === order.status)
  if (current < 0) return <p className="sc-order-muted">Chưa có thông tin tiến độ giao nhận.</p>
  const history = orderHistoryEntries(order.statusHistory)
  return <div className="sc-order-progress-scroll" role="region" aria-label="Tiến trình giao nhận" tabIndex={0}>
    <ol className="sc-order-progress">{stages.map(([status, icon], index) => {
      const event = history.findLast(entry => entry.toStatus === status)
      return <li key={status} aria-current={index === current ? 'step' : undefined} className={index < current ? 'is-complete' : index === current ? 'is-current' : ''}>
        <span className="sc-order-step-icon"><Icon name={index < current ? 'check' : icon} /></span>
        <span>{orderStatusLabel(status)}</span>
        {event?.changedAt && <time className="sc-order-step-time" dateTime={event.changedAt}>{formatOrderDate(event.changedAt)}</time>}
      </li>
    })}</ol>
  </div>
}

export default function OrderTrackingView({ order, showHeader = true, actionsSlot, showSource = true }) {
  const address = order.deliveryAddress
  const history = orderHistoryEntries(order.statusHistory)
  const quantity = order.items?.reduce((total, item) => total + (Number(item.quantity) || 0), 0) ?? 0
  const deliveryNote = history.findLast(event => event.toStatus === 'DELIVERING')?.note
  const deliveryArea = [address?.addressLine, address?.ward, address?.district, address?.city].filter(Boolean).join(', ')
    || [order.items?.[0]?.configuration?.deliveryDistrict, order.items?.[0]?.configuration?.deliveryCity].filter(Boolean).join(', ')
  return <div className="sc-order-tracking-view">
    {showHeader && <OrderTrackingHeader order={order} />}
    <OrderProgress order={order} />
    {actionsSlot}
    <div className="sc-order-tracking-columns">
      <div className="sc-order-tracking-main">
        <section className="sc-order-tracking-card">
          <h3><Icon name="receipt_long" />Thông tin đơn</h3>
          {order.items?.length ? <ul className="sc-order-items">{order.items.map(item => {
            const config = item.configuration || {}
            const preference = config.preference || {}
            const options = configurationEntries({
              size: config.size || config.sizeSpec || preference.cakeSize,
              flavor: config.flavor || preference.flavor,
              tiers: config.tiers,
              message: config.message,
              options: config.options || config.selectedOptions || config.optionSelections,
              addOns: config.addOns,
            }).map(option => ({
              ...option,
              label: option.label.split(' · ').filter(part => part !== 'Tùy chọn').join(' · ') || 'Lựa chọn',
            }))
            return <li key={item.id}>
              <div className="sc-order-item-heading">
                <div><h4>{item.quantity ?? '—'} × {item.name || 'Chưa có tên sản phẩm'}</h4>
                  {showSource && <p>Nguồn đơn: {uiLabel(order.orderSource, 'Chưa có thông tin')}</p>}
                </div>
                <strong>{formatOrderMoney(item.lineTotal, order.currency)}</strong>
              </div>
              <dl className="sc-order-facts sc-order-item-options">
                {config.occasion && <div><dt>Dịp</dt><dd>{config.occasion}</dd></div>}
                {config.servingSize != null && <div><dt>Khẩu phần</dt><dd>{config.servingSize} người</dd></div>}
                {config.requestType && <div><dt>Loại yêu cầu</dt><dd>{uiLabel(config.requestType)}</dd></div>}
                {(config.budgetMin != null || config.budgetMax != null) && <div><dt>Ngân sách</dt><dd>{[config.budgetMin, config.budgetMax].filter(value => value != null).map(value => formatOrderMoney(value, order.currency)).join(' – ')}</dd></div>}
                {options.map((option, index) => <div key={index}><dt>{option.label}</dt><dd>{option.value}</dd></div>)}
              </dl>
            </li>
          })}</ul> : <p className="sc-order-muted">Chưa có thông tin sản phẩm.</p>}
          <h3 className="sc-order-customer-heading"><Icon name="person" />Thông tin khách</h3>
          <dl className="sc-order-facts sc-order-item-options">
            <div><dt>Khách hàng</dt><dd>{cleanPresentationLabel(order.customerName, 'Chưa có tên')}</dd></div>
            <div><dt>SĐT khách hàng</dt><dd>{order.customerPhone || 'Chưa có điện thoại'}</dd></div>
            <div><dt>Người nhận</dt><dd>{cleanPresentationLabel(address?.recipientName || order.customerName, 'Chưa có tên')}</dd></div>
            <div><dt>SĐT nhận bánh</dt><dd>{address?.recipientPhone || 'Chưa có điện thoại'}</dd></div>
          </dl>
          <dl className="sc-order-facts sc-order-item-options">
            <div><dt>Ngày đặt</dt><dd>{formatOrderDate(order.createdAt)}</dd></div>
            <div><dt>Hẹn giao</dt><dd>{formatOrderDate(order.neededAt)}</dd></div>
            <div><dt>Khu vực giao</dt><dd>{deliveryArea || 'Chưa có thông tin địa chỉ giao hàng.'}</dd></div>
            {deliveryNote && <div><dt>Ghi chú vận chuyển</dt><dd>{orderHistoryNote(deliveryNote)}</dd></div>}
            {address?.deliveryNote && <div><dt>Lưu ý giao nhận</dt><dd>{address.deliveryNote}</dd></div>}
          </dl>
        </section>
      </div>
      <aside className="sc-order-tracking-summary">
        <section className="sc-order-tracking-card sc-order-totals">
          <h3><Icon name="receipt_long" />Tổng tiền đơn hàng</h3>
          <dl>
            <div><dt>Số lượng</dt><dd>{quantity}</dd></div>
            <div><dt>Tiền hàng</dt><dd>{formatOrderMoney(order.subtotal, order.currency)}</dd></div>
            <div><dt>Phí giao hàng</dt><dd>{formatOrderMoney(order.deliveryFee, order.currency)}</dd></div>
            <div className="sc-order-grand-total"><dt>Tổng cộng</dt><dd>{formatOrderMoney(order.totalAmount, order.currency)}</dd></div>
          </dl>
        </section>
        <section className="sc-order-tracking-card">
          <h3><Icon name="account_balance_wallet" />Thanh toán</h3>
          <p className="sc-order-payment-note">Thanh toán trực tiếp theo thỏa thuận với tiệm.</p>
        </section>
      </aside>
    </div>
  </div>
}
