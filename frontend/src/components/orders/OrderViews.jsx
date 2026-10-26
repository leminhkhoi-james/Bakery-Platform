import React, { useState } from 'react'
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
  return <div className="space-y-4">
    <div className="flex flex-wrap justify-between gap-3"><h2 className="break-all text-xl font-bold text-primary">{order.orderNumber || order.id}</h2><span>{orderStatusLabel(order.status)}</span></div>
    <p>{order.bakeryName || 'Chưa có tên cửa hàng'} · {order.orderSource || 'Chưa có nguồn đơn'}</p>
    <p>Khách hàng: {order.customerName || 'Chưa có tên'} · {order.customerPhone || 'Chưa có điện thoại'}</p>
    <p>Hẹn giao: {dateTime(order.neededAt)}</p>
    <dl className="grid gap-3 sm:grid-cols-3"><div><dt>Tiền hàng</dt><dd>{money(order.subtotal, order.currency)}</dd></div><div><dt>Phí giao hàng</dt><dd>{money(order.deliveryFee, order.currency)}</dd></div><div><dt>Tổng tiền backend</dt><dd className="font-bold">{money(order.totalAmount, order.currency)}</dd></div></dl>
    <p>Ghi chú: {order.customerNote || 'Không có'}</p>
    <div><h3 className="font-bold">Địa chỉ tại thời điểm đặt</h3>{address ? <><p>{address.recipientName} · {address.recipientPhone}</p><p>{[address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', ')}</p>{address.deliveryNote && <p>{address.deliveryNote}</p>}</> : <p>Backend chưa trả địa chỉ giao hàng.</p>}</div>
    <h3 className="font-bold">Sản phẩm trong đơn</h3>{order.items?.length ? <ul className="space-y-3">{order.items.map((item) => <li key={item.id} className="rounded-xl bg-background p-4"><p className="font-bold">{item.name || 'Chưa có tên'} · {item.itemType}</p><p>{item.quantity ?? '—'} × {money(item.unitPrice, order.currency)} = {money(item.lineTotal, order.currency)}</p>{item.configuration && <details><summary className="cursor-pointer text-sm">Cấu hình đã đặt</summary><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(item.configuration, null, 2)}</pre></details>}</li>)}</ul> : <p>Chưa có thông tin sản phẩm.</p>}
    <h3 className="font-bold">Lịch sử trạng thái</h3>{order.statusHistory?.length ? <ol className="space-y-2">{order.statusHistory.map((history, index) => <li key={index} className="border-l-2 border-secondary pl-3"><p>{history.fromStatus ? orderStatusLabel(history.fromStatus) + ' → ' : ''}{orderStatusLabel(history.toStatus)} · {dateTime(history.changedAt)}</p>{history.note && <p className="text-sm">{history.note}</p>}</li>)}</ol> : <p>Chưa có lịch sử trạng thái.</p>}
    <p className="text-sm text-on-surface-variant">Order Service không theo dõi thanh toán, escrow hoặc hoàn tiền cho đơn bánh. Tổng tiền đơn không chứng minh đã thanh toán.</p>
  </div>
}

export function OrderDetail({ orderId, scope = 'mine', bakeryId, onChanged }) {
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
  return <section className={panelClass}><button disabled={busy} onClick={resource.reload} className="text-sm underline">Tải lại chi tiết đơn</button><ApiState resource={resource}>{order && (matches ? <><OrderSnapshot order={order} />{scope === 'all' && <ReviewModeration key={order.review?.updatedAt || 'no-moderation'} review={order.review} onChanged={() => { resource.reload(); onChanged?.() }} />}<OrderReview key={order.review?.updatedAt || 'no-review'} order={order} onChanged={() => { resource.reload(); onChanged?.() }} />{actions.length > 0 && <form onSubmit={transition} className="space-y-3 border-t border-outline-variant/30 pt-4"><h3 className="font-bold">Cập nhật trạng thái</h3><p className="text-sm">Backend kiểm tra quyền truy cập và trạng thái mới nhất khi xác nhận.</p><label>Thao tác<select required value={targetStatus} disabled={busy} onChange={(event) => setTargetStatus(event.target.value)} className={inputClass}><option value="">Chọn trạng thái</option>{actions.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}</select></label><label>Lý do/ghi chú<textarea maxLength={1000} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} className={inputClass} /></label><button disabled={busy || !actions.includes(targetStatus)} className={buttonClass}>{busy ? 'Đang gửi…' : 'Xác nhận cập nhật'}</button></form>}</> : <ApiErrorMessage error={{ status: 403, message: 'Đơn không thuộc cửa hàng đang xem.' }} />)}</ApiState>{error && <ApiErrorMessage error={error} />}</section>
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
  return <div className="space-y-5"><section className={panelClass}><h2 className="text-xl font-bold text-primary">{scope === 'bakery' ? 'Đơn hàng của cửa hàng' : 'Lịch sử đơn hàng'}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <label>Trạng thái<select value={status} onChange={update(setStatus)} className={inputClass}><option value="">Tất cả</option>{ORDER_STATUSES.map((value) => <option key={value} value={value}>{orderStatusLabel(value)}</option>)}</select></label>
    <label>Nguồn đơn<select value={orderSource} onChange={update(setSource)} className={inputClass}><option value="">Tất cả</option>{ORDER_SOURCES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    <label>Sắp xếp<select value={sort} onChange={update(setSort)} className={inputClass}><option value="createdAt,desc">Mới nhất</option><option value="createdAt,asc">Cũ nhất</option><option value="neededAt,asc">Ngày cần giao tăng dần</option><option value="totalAmount,desc">Tổng tiền giảm dần</option></select></label>
    <label>Tạo từ<input type="datetime-local" value={createdFrom} onChange={update(setFrom)} className={inputClass} /></label><label>Tạo đến<input type="datetime-local" value={createdTo} onChange={update(setTo)} className={inputClass} /></label>
  </div><button className={buttonClass} onClick={resource.reload}>Tải lại danh sách</button><ApiState resource={resource}>{resource.data && <>{resource.data.result.length ? <ul className="space-y-3">{resource.data.result.map((order) => <li key={order.id}><button onClick={() => scope === 'mine' && onNavigate ? onNavigate('tracking?orderId=' + order.id) : setOrderId(order.id)} className="w-full rounded-xl border border-outline-variant/30 p-4 text-left"><span className="block break-all font-bold">{order.orderNumber || order.id} · {order.bakeryName || 'Chưa có tên cửa hàng'}</span><span>{orderStatusLabel(order.status)} · {money(order.totalAmount, order.currency)} · {dateTime(order.neededAt)}</span></button></li>)}</ul> : <p>Chưa có đơn hàng phù hợp.</p>}<CatalogPagination meta={resource.data.meta} onPage={setPage} /></>}</ApiState></section>
    {orderId && <OrderDetail key={orderId} orderId={orderId} scope={scope} bakeryId={bakeryId} onChanged={resource.reload} />}
  </div>
}
