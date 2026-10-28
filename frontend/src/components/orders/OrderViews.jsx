import { displayReference } from '../../services/displayReference.js'
import RefreshButton from '../common/RefreshButton.jsx'
import OrderTrackingView, { OrderTrackingHeader } from './OrderTrackingView.jsx'
import { uiLabel } from '../../services/uiLabels.js'
import OrderStatusActions from './OrderStatusActions.jsx'
import React, { useRef, useState } from 'react'
import { DataTable, DetailDrawer, EmptyPanel, Icon, SectionHeading, StatusBadge } from '../common/WorkspaceUI.jsx'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { useAuth } from '../../context/useAuth.js'
import { loadOrders, loadOrder, orderService } from '../../services/orderService.js'
import { allowedOrderActions, ORDER_STATUSES, ORDER_SOURCES, orderStatusLabel } from '../../services/orderModels.js'
import { money, dateTime } from '../../services/managementModels.js'
import { ApiState, ApiErrorMessage, buttonClass, inputClass, panelClass } from '../management/ApiState.jsx'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import OrderReview from './OrderReview.jsx'
import ReviewModeration from './ReviewModeration.jsx'

export function OrderSnapshot({ order, showHeader = true, actionsSlot }) {
  return <OrderTrackingView order={order} showHeader={showHeader} actionsSlot={actionsSlot} />
}

export function OrderDetail({ orderId, scope = 'mine', bakeryId, onChanged, onClose }) {
  const { user } = useAuth()
  const resource = useCatalogResource(loadOrder, { orderId })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [confirmedOrder, setConfirmedOrder] = useState(null)
  const inFlight = useRef(false)
  const order = confirmedOrder && resource.data === confirmedOrder.previous ? confirmedOrder.order : resource.data
  const matches = scope !== 'bakery' || order?.bakeryId === bakeryId
  const canManage = matches && scope === 'bakery' && user?.roles?.includes('BAKERY_OWNER') && !user.roles.includes('ADMIN')
  const actions = order && canManage ? allowedOrderActions(order, user, scope) : []
  async function transition(targetStatus, reason, expectedStatus) {
    if (inFlight.current || resource.refreshing) return false
    if (!actions.includes(targetStatus) || order.status !== expectedStatus) {
      setError({ status: 409 }); resource.reload(); return false
    }
    inFlight.current = true
    setBusy(true); setError(null); setNotice(null)
    try {
      const updated = await orderService.updateOrderStatus(orderId, targetStatus, reason)
      if (updated.id !== orderId || updated.status !== targetStatus || updated.bakeryId !== order.bakeryId) throw Object.assign(new Error('Chưa xác nhận được thay đổi của đơn hàng.'), { status: 502 })
      setConfirmedOrder({ previous: resource.data, order: updated })
      setNotice({ status: updated.status, message: 'Đã cập nhật đơn hàng: ' + orderStatusLabel(updated.status) + '.' })
      resource.reload(); onChanged?.(); return true
    } catch (failure) {
      setError(failure)
      resource.reload(); onChanged?.(); return false
    } finally { inFlight.current = false; setBusy(false) }
  }
  const feedback = <>
    {notice && notice.status === order?.status && <p role="status" className="sc-order-action-success">{notice.message}</p>}
    {error && <p role="alert" className="sc-order-action-error">{error.status === 409 ? 'Trạng thái đơn đã thay đổi. Hãy kiểm tra lịch sử và chọn lại thao tác.' : error.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : error.status === 401 ? 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.' : 'Chưa thể cập nhật đơn hàng. Kiểm tra thông tin và thử lại.'}</p>}
  </>
  const actionsSlot = order && canManage ? <div className="sc-order-action-panel"><OrderStatusActions key={orderId} order={order} actions={actions} busy={busy} refreshing={resource.refreshing} onConfirm={transition} />{feedback}</div> : null
  const content = <section className="sc-order-detail space-y-4">
    <RefreshButton disabled={busy || resource.refreshing} onClick={resource.reload}>Tải lại chi tiết đơn</RefreshButton>
    <ApiState resource={resource}>{order && (matches ? <>
      <OrderSnapshot order={order} showHeader={!onClose} actionsSlot={actionsSlot} />
      {scope === 'all' && <ReviewModeration key={'moderation-' + (order.review?.updatedAt || 'none')} review={order.review} onChanged={() => { resource.reload(); onChanged?.() }} />}
      {!user?.roles?.includes('ADMIN') && <OrderReview key={'review-' + (order.review?.updatedAt || 'none')} order={order} onChanged={() => { resource.reload(); onChanged?.() }} />}
    </> : <ApiErrorMessage error={{ status: 403, message: 'Đơn không thuộc cửa hàng đang xem.' }} />)}</ApiState>
  </section>
  return onClose ? <DetailDrawer title="Chi tiết đơn hàng" className="sc-order-dialog" headerContent={order && matches ? <OrderTrackingHeader order={order} /> : <h2>Chi tiết đơn hàng</h2>} onClose={onClose} busy={busy}>{content}</DetailDrawer> : content
}

export function OrderList({ scope = 'mine', bakeryId, onNavigate, initialOrderId = '', initialStatus = '', showHeading = true }) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState(() => ORDER_STATUSES.includes(initialStatus) ? initialStatus : '')
  const [orderSource, setSource] = useState('')
  const [sort, setSort] = useState('createdAt,desc')
  const [createdFrom, setFrom] = useState('')
  const [createdTo, setTo] = useState('')
  const [orderId, setOrderId] = useState(initialOrderId)
  const resource = useCatalogResource(loadOrders, { scope, ...(bakeryId ? { bakeryId } : {}), page, size: 10, status, orderSource, sort, ...(createdFrom ? { createdFrom: new Date(createdFrom).toISOString() } : {}), ...(createdTo ? { createdTo: new Date(createdTo).toISOString() } : {}) })
  const update = (setter) => (event) => { setter(event.target.value); setPage(1) }
  return <div className="sc-order-history space-y-5"><section className={panelClass}>{showHeading && <SectionHeading title={scope === 'bakery' ? 'Đơn hàng của cửa hàng' : 'Lịch sử đơn hàng'} description="Theo dõi đơn bánh, lịch hẹn giao và chi tiết từng đơn." icon="receipt_long" />}<div className="sc-toolbar grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <label>Trạng thái<select value={status} onChange={update(setStatus)} className={inputClass}><option value="">Tất cả</option>{ORDER_STATUSES.map((value) => <option key={value} value={value}>{orderStatusLabel(value)}</option>)}</select></label>
    <label>Nguồn đơn<select value={orderSource} onChange={update(setSource)} className={inputClass}><option value="">Tất cả</option>{ORDER_SOURCES.map((value) => <option key={value} value={value}>{uiLabel(value)}</option>)}</select></label>
    <label>Sắp xếp<select value={sort} onChange={update(setSort)} className={inputClass}><option value="createdAt,desc">Mới nhất</option><option value="createdAt,asc">Cũ nhất</option><option value="neededAt,asc">Ngày cần giao tăng dần</option><option value="totalAmount,desc">Tổng tiền giảm dần</option></select></label>
    <label>Tạo từ<input type="datetime-local" value={createdFrom} onChange={update(setFrom)} className={inputClass} /></label><label>Tạo đến<input type="datetime-local" value={createdTo} onChange={update(setTo)} className={inputClass} /></label>
  </div><RefreshButton className={buttonClass} onClick={resource.reload}>Tải lại danh sách</RefreshButton><ApiState resource={resource}>{resource.data && <>{resource.data.result.length ? <DataTable label="Danh sách đơn hàng"><thead><tr><th>Đơn hàng / Tiệm bánh</th><th>Trạng thái</th><th className="sc-money">Tổng tiền</th><th>Hẹn giao</th><th className="sc-table-actions" scope="col">Chi tiết</th></tr></thead><tbody>{resource.data.result.map((order, index) => <tr key={order.id} id={'order-row-' + index} onClick={() => setOrderId(order.id)} style={{ cursor: 'pointer' }}><td><strong className="break-all text-primary">{displayReference(order.id, 'ORD', order.orderNumber)}</strong><small>{order.bakeryName || 'Chưa có tên cửa hàng'}</small></td><td><StatusBadge status={order.status} label={orderStatusLabel(order.status)} /></td><td className="whitespace-nowrap font-semibold tabular-nums">{money(order.totalAmount, order.currency)}</td><td>{dateTime(order.neededAt)}</td><td className="sc-table-actions"><button id={'view-order-btn-' + index} onClick={(e) => { e.stopPropagation(); scope === 'mine' && onNavigate ? onNavigate('tracking?orderId=' + order.id) : setOrderId(order.id) }} className="sc-button"><Icon name="visibility" />Xem đơn</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Chưa có đơn hàng phù hợp." description="Đơn hàng được hiển thị theo bộ lọc và quyền truy cập." icon="shopping_bag" />}<CatalogPagination meta={resource.data.meta} onPage={setPage} /></>}</ApiState></section>
    {orderId && <OrderDetail key={orderId} orderId={orderId} scope={scope} bakeryId={bakeryId} onChanged={resource.reload} onClose={() => setOrderId('')} />}
  </div>
}
