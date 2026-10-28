import React, { useState } from 'react'
import { DataTable, DetailDrawer, EmptyPanel, SectionHeading, StatusBadge } from '../common/WorkspaceUI.jsx'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { useAuth } from '../../context/useAuth.js'
import { loadOrders, loadOrder, orderService } from '../../services/orderService.js'
import { allowedOrderActions, ORDER_STATUSES, ORDER_SOURCES, orderStatusLabel } from '../../services/orderModels.js'
import { money, dateTime } from '../../services/managementModels.js'
import { ApiState, ApiErrorMessage, buttonClass, inputClass, panelClass } from '../management/ApiState.jsx'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import OrderReview from './OrderReview.jsx'
import ReviewModeration from './ReviewModeration.jsx'

export function OrderSnapshot({ order }) {
  const address = order.deliveryAddress
  return <div className="sc-order-snapshot space-y-5">
    <div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><p className="sc-kicker">Chi tiết đơn hàng</p><h2 className="break-all font-serif text-2xl font-semibold text-primary">{order.orderNumber || order.id}</h2><p className="mt-1 text-sm text-on-surface-variant">{order.bakeryName || 'Chưa có tên cửa hàng'} · {order.orderSource || 'Chưa có nguồn đơn'}</p></div><StatusBadge status={order.status} label={orderStatusLabel(order.status)} /></div>
    <dl className="sc-toolbar grid gap-3 sm:grid-cols-3">{[['Tiền hàng', order.subtotal], ['Phí giao hàng', order.deliveryFee], ['Tổng tiền', order.totalAmount]].map(([label, value]) => <div key={label}><dt className="text-xs text-on-surface-variant">{label}</dt><dd className="mt-1 font-serif text-lg font-semibold text-primary">{money(value, order.currency)}</dd></div>)}</dl>
    <div className="sc-detail-grid"><section className="rounded-xl border border-outline-variant/30 p-4"><h3 className="mb-3 font-bold text-primary">Khách hàng & giao nhận</h3><dl><div><dt>Khách hàng</dt><dd>{order.customerName || 'Chưa có tên'} · {order.customerPhone || 'Chưa có điện thoại'}</dd></div><div><dt>Hẹn giao</dt><dd>{dateTime(order.neededAt)}</dd></div><div><dt>Ghi chú</dt><dd>{order.customerNote || 'Không có'}</dd></div></dl></section><section className="rounded-xl border border-outline-variant/30 p-4"><h3 className="mb-3 font-bold text-primary">Địa chỉ tại thời điểm đặt</h3>{address ? <div className="space-y-2 text-sm"><p className="font-semibold">{address.recipientName} · {address.recipientPhone}</p><p>{[address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', ')}</p>{address.deliveryNote && <p>{address.deliveryNote}</p>}</div> : <p>Backend chưa trả địa chỉ giao hàng.</p>}</section></div>
    <section><h3 className="mb-3 font-bold text-primary">Sản phẩm trong đơn</h3>{order.items?.length ? <ul className="space-y-2">{order.items.map((item) => <li key={item.id} className="rounded-xl border border-outline-variant/20 p-3"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{item.name || 'Chưa có tên'}</p><p className="mt-1 text-xs text-on-surface-variant">{item.itemType} · {item.quantity ?? '—'} × {money(item.unitPrice, order.currency)}</p></div><strong className="text-primary">{money(item.lineTotal, order.currency)}</strong></div>{item.configuration && <details className="mt-3"><summary className="cursor-pointer text-xs text-on-surface-variant">Cấu hình đã đặt</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-xs">{JSON.stringify(item.configuration, null, 2)}</pre></details>}</li>)}</ul> : <p>Chưa có thông tin sản phẩm.</p>}</section>
    <section><h3 className="mb-4 font-bold text-primary">Lịch sử trạng thái</h3>{order.statusHistory?.length ? <ol className="sc-timeline">{order.statusHistory.map((history, index) => <li key={index}><p className="text-sm font-semibold">{history.fromStatus ? orderStatusLabel(history.fromStatus) + ' → ' : ''}{orderStatusLabel(history.toStatus)}</p><p className="mt-1 text-xs text-on-surface-variant">{dateTime(history.changedAt)}</p>{history.note && <p className="mt-1 text-sm">{history.note}</p>}</li>)}</ol> : <p>Chưa có lịch sử trạng thái.</p>}</section>
    <details className="sc-note"><summary className="cursor-pointer font-semibold">Thông tin thanh toán đơn bánh</summary><p className="mt-2">Order Service không theo dõi thanh toán, escrow hoặc hoàn tiền cho đơn bánh. Tổng tiền đơn không chứng minh đã thanh toán.</p></details>
  </div>
}

export function OrderDetail({ orderId, scope = 'mine', bakeryId, onChanged, onClose }) {
  const { user } = useAuth()
  const resource = useCatalogResource(loadOrder, { orderId })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [targetStatus, setTargetStatus] = useState('')
  const [reason, setReason] = useState('')
  const order = resource.data
  const matches = scope !== 'bakery' || order?.bakeryId === bakeryId
  const actions = order && matches ? allowedOrderActions(order, user, scope) : []
  async function transition(event) {
    event.preventDefault()
    if (busy || !actions.includes(targetStatus)) return
    setBusy(true); setError(null)
    try {
      await orderService.updateOrderStatus(orderId, targetStatus, reason)
      setTargetStatus(''); setReason(''); resource.reload(); onChanged?.()
    } catch (failure) {
      setError(failure)
      // A stale transition or lost response must be reconciled before another action.
      resource.reload(); onChanged?.()
    } finally { setBusy(false) }
  }
  const content = <section className={panelClass}><button disabled={busy} onClick={resource.reload} className="text-sm underline">Tải lại chi tiết đơn</button><ApiState resource={resource}>{order && (matches ? <><OrderSnapshot order={order} />{scope === 'all' && <ReviewModeration key={order.review?.updatedAt || 'no-moderation'} review={order.review} onChanged={() => { resource.reload(); onChanged?.() }} />}<OrderReview key={order.review?.updatedAt || 'no-review'} order={order} onChanged={() => { resource.reload(); onChanged?.() }} />{actions.length > 0 && <form onSubmit={transition} className="space-y-3 border-t border-outline-variant/30 pt-4"><h3 className="font-bold">Cập nhật trạng thái</h3><p className="text-sm">Backend kiểm tra quyền truy cập và trạng thái mới nhất khi xác nhận.</p><label>Thao tác<select id="order-status-select" required value={targetStatus} disabled={busy} onChange={(event) => setTargetStatus(event.target.value)} className={inputClass}><option value="">Chọn trạng thái</option>{actions.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}</select></label><label>Lý do/ghi chú<textarea maxLength={1000} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} className={inputClass} /></label><button id="order-transition-submit-btn" disabled={busy || !actions.includes(targetStatus)} className={buttonClass}>{busy ? 'Đang gửi…' : 'Xác nhận cập nhật'}</button></form>}</> : <ApiErrorMessage error={{ status: 403, message: 'Đơn không thuộc cửa hàng đang xem.' }} />)}</ApiState>{error && <ApiErrorMessage error={error} />}</section>
  return onClose ? <DetailDrawer title="Chi tiết đơn hàng" onClose={onClose} busy={busy}>{content}</DetailDrawer> : content
}

export function OrderList({ scope = 'mine', bakeryId, onNavigate, initialOrderId = '' }) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [orderSource, setSource] = useState('')
  const [sort, setSort] = useState('createdAt,desc')
  const [createdFrom, setFrom] = useState('')
  const [createdTo, setTo] = useState('')
  const [orderId, setOrderId] = useState(initialOrderId)
  const resource = useCatalogResource(loadOrders, { scope, ...(bakeryId ? { bakeryId } : {}), page, size: 10, status, orderSource, sort, ...(createdFrom ? { createdFrom: new Date(createdFrom).toISOString() } : {}), ...(createdTo ? { createdTo: new Date(createdTo).toISOString() } : {}) })
  const update = (setter) => (event) => { setter(event.target.value); setPage(1) }
  return <div className="sc-order-history space-y-5"><section className={panelClass}><SectionHeading title={scope === 'bakery' ? 'Đơn hàng của cửa hàng' : 'Lịch sử đơn hàng'} description="Theo dõi đơn bánh, lịch hẹn giao và chi tiết từng đơn." icon="receipt_long" /><div className="sc-toolbar grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <label>Trạng thái<select value={status} onChange={update(setStatus)} className={inputClass}><option value="">Tất cả</option>{ORDER_STATUSES.map((value) => <option key={value} value={value}>{orderStatusLabel(value)}</option>)}</select></label>
    <label>Nguồn đơn<select value={orderSource} onChange={update(setSource)} className={inputClass}><option value="">Tất cả</option>{ORDER_SOURCES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    <label>Sắp xếp<select value={sort} onChange={update(setSort)} className={inputClass}><option value="createdAt,desc">Mới nhất</option><option value="createdAt,asc">Cũ nhất</option><option value="neededAt,asc">Ngày cần giao tăng dần</option><option value="totalAmount,desc">Tổng tiền giảm dần</option></select></label>
    <label>Tạo từ<input type="datetime-local" value={createdFrom} onChange={update(setFrom)} className={inputClass} /></label><label>Tạo đến<input type="datetime-local" value={createdTo} onChange={update(setTo)} className={inputClass} /></label>
  </div><button className={buttonClass} onClick={resource.reload}>Tải lại danh sách</button><ApiState resource={resource}>{resource.data && <>{resource.data.result.length ? <DataTable label="Danh sách đơn hàng"><thead><tr><th>Đơn hàng / Tiệm bánh</th><th>Trạng thái</th><th>Tổng tiền</th><th>Hẹn giao</th><th>Chi tiết</th></tr></thead><tbody>{resource.data.result.map((order, index) => <tr key={order.id} id={'order-row-' + index} onClick={() => setOrderId(order.id)} style={{ cursor: 'pointer' }}><td><strong className="break-all text-primary">{order.orderNumber || order.id}</strong><small>{order.bakeryName || 'Chưa có tên cửa hàng'}</small></td><td><StatusBadge status={order.status} label={orderStatusLabel(order.status)} /></td><td className="whitespace-nowrap font-semibold tabular-nums">{money(order.totalAmount, order.currency)}</td><td>{dateTime(order.neededAt)}</td><td><button id={'view-order-btn-' + index} onClick={(e) => { e.stopPropagation(); scope === 'mine' && onNavigate ? onNavigate('tracking?orderId=' + order.id) : setOrderId(order.id) }} className="sc-button">Xem đơn</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Chưa có đơn hàng phù hợp." description="Đơn hàng được hiển thị theo bộ lọc và quyền truy cập." icon="shopping_bag" />}<CatalogPagination meta={resource.data.meta} onPage={setPage} /></>}</ApiState></section>
    {orderId && <OrderDetail key={orderId} orderId={orderId} scope={scope} bakeryId={bakeryId} onChanged={resource.reload} onClose={() => setOrderId('')} />}
  </div>
}
