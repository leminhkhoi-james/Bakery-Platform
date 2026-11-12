import PlanTierBadge from '../../../components/management/PlanTierBadge.jsx'
import RecordActionButton from '../../../components/common/RecordActionButton.jsx'
import { useViewportPageSize } from '../../../hooks/useViewportPageSize.js'
import React, { useState } from 'react'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { DataTable, EmptyPanel, StatusBadge, Icon } from '../../../components/common/WorkspaceUI.jsx'
import { AdminReviewDialog, ReviewSection, ReviewField } from '../../../components/management/AdminReviewUI.jsx'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from '../../../components/management/ApiState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { ADMIN_ORDER_STATUSES, loadAdminSubscriptionOrders, loadAdminSubscriptionOrderDetail, orderApprovalLabel, adminOrderDateRange } from '../../../services/adminSubscriptionOrders.js'
import { loadDashboardPayment } from '../../../services/adminDashboardService.js'
import { subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { reviewMoney } from '../../../services/adminPresentation.js'
import { formatOrderDate } from '../../../services/orderPresentation.js'
import { displayReference } from '../../../services/displayReference.js'
import { planName } from '../../../services/planPresentation.js'

function OrderDetail({ row, onClose }) {
  const resource = useCatalogResource(loadAdminSubscriptionOrderDetail, { orderId: row.order.id })
  const order = resource.data || row.order
  return <AdminReviewDialog title="Chi tiết đơn mua gói" className="sc-subscription-order-detail" onClose={onClose} footer={<button type="button" className={buttonClass} data-modal-close>Đóng</button>}>
    <ReviewSection title="Thông tin đơn mua gói">
      <dl className="sc-review-fields">
        <ReviewField label="Mã đơn" value={displayReference(order.id, 'SUB', order.orderNumber)} />
        <ReviewField label="Tiệm bánh" value={row.profile?.bakery?.name || displayReference(order.bakeryId, 'BAK')} />
        <ReviewField label="Gói dịch vụ" value={planName({ name: order.planNameSnapshot, code: order.planCodeSnapshot })} />
        <ReviewField label="Số tiền" value={reviewMoney(order.totalAmount, order.currency)} />
        <ReviewField label="Trạng thái" value={subscriptionStatusLabel(order.status)} />
        <ReviewField label="Thời gian" value={formatOrderDate(order.createdAt)} />
        <ReviewField label="Hạn thanh toán" value={formatOrderDate(order.expiresAt)} />
      </dl>
    </ReviewSection>
    <ReviewSection title="Chi tiết giao dịch thanh toán">
      <ApiState resource={resource}>{resource.data && <>
        {order.payments.length ? <ul className="space-y-3">{order.payments.map(payment => <li key={payment.id} className="space-y-1 border-b border-outline-variant/30 pb-3">
          <strong>{payment.paymentMethod === 'VNPAY' ? 'VNPay' : 'Chuyển khoản ngân hàng'} · {subscriptionStatusLabel(payment.status)}</strong>
          <p>{reviewMoney(payment.amount, order.currency)} · {formatOrderDate(payment.submittedAt)}</p>
          {payment.paymentReference && <p className="break-all">Mã giao dịch: {payment.paymentReference}</p>}
        </li>)}</ul> : <p>Hệ thống chưa ghi nhận giao dịch thanh toán thành công cho đơn này.</p>}
        {order.period && <p className="sc-review-help">Kỳ dịch vụ: {formatOrderDate(order.period.periodStart)} – {formatOrderDate(order.period.periodEnd)}</p>}
      </>}</ApiState>
    </ReviewSection>
  </AdminReviewDialog>
}

export function AdminOrderTable({ rows, meta, onDetail }) {
  return <DataTable label="Tất cả đơn mua gói" className="sc-admin-record-table sc-admin-subscription-orders-table"><thead><tr>
    <th>STT</th><th>Đơn mua gói</th><th>Tiệm bánh</th><th>Gói dịch vụ</th><th>Thời hạn</th><th>Số tiền</th><th>Mã GD</th><th>Thời gian</th><th>Trạng thái đơn</th><th className="sc-table-actions">Thao tác</th>
  </tr></thead><tbody>{rows.map((row, index) => {
    const order = row.order
    const withReference = (row.payments || []).filter(payment => payment.paymentReference?.trim())
    const transaction = withReference.find(payment => payment.status === 'APPROVED') ||
      withReference.find(payment => payment.id === row.reviewPaymentId) || withReference[0]
    return <tr key={order.id}>
      <td data-label="STT">{(meta.page - 1) * meta.pageSize + index + 1}</td>
      <td data-label="Đơn mua gói"><strong>{displayReference(order.id, 'SUB', order.orderNumber)}</strong></td><td data-label="Tiệm bánh">{row.profile?.bakery?.name || displayReference(order.bakeryId, 'BAK')}</td>
      <td data-label="Gói dịch vụ"><PlanTierBadge name={order.planNameSnapshot} code={order.planCodeSnapshot} /></td>
      <td data-label="Thời hạn">{order.billingPeriodMonths ? order.billingPeriodMonths + ' tháng' : '—'}</td>
      <td data-label="Số tiền" className="text-emerald-700 font-bold">{reviewMoney(order.totalAmount, order.currency)}</td>
      <td data-label="Mã GD" className="break-all">{transaction?.paymentReference || '—'}</td>
      <td data-label="Thời gian">{formatOrderDate(order.createdAt)}</td>
      <td data-label="Trạng thái đơn"><StatusBadge status={order.status} label={subscriptionStatusLabel(order.status)} /></td>
      <td className="sc-table-actions"><div className="flex flex-wrap gap-2">
        <RecordActionButton type="button" className="sc-button sc-action-button--secondary" aria-label="Xem chi tiết đơn mua gói" onClick={() => onDetail(row)} action="view" />
      </div></td>
    </tr>
  })}</tbody></DataTable>
}

export default function AdminSubscriptionOrdersPage({ routeSearch = '', ReviewComponent }) {
  const params = new URLSearchParams(routeSearch)
  const paymentId = params.get('paymentId') || ''
  const shortcut = useCatalogResource(loadDashboardPayment, { id: paymentId })
  const [page, setPage] = useState(1)
  const { containerRef, pageSize } = useViewportPageSize(() => setPage(1))
  const [draft, setDraft] = useState({ status: '', query: '', eligibility: '', from: '', to: '' })
  const [filters, setFilters] = useState({})
  const [detail, setDetail] = useState(null), [payment, setPayment] = useState(null), [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState(null), [notice, setNotice] = useState('')
  const resource = useCatalogResource(loadAdminSubscriptionOrders, { page, size: pageSize, bakeryId: params.get('bakeryId') || '', ...filters })
  const currentPayment = payment || (!dismissed && shortcut.data)
  function apply(event) {
    event.preventDefault()
    try {
      setFilters({ status: draft.status, query: draft.query.trim(), ...adminOrderDateRange(draft.from, draft.to),
        ...(draft.eligibility ? { eligibleForApproval: draft.eligibility === 'ready' } : {}) })
      setPage(1); setError(null)
    } catch (failure) { setError(failure) }
  }
  function review(row) {
    if (!row.eligibleForApproval) return
    const candidate = row.payments.find(item => item.id === row.reviewPaymentId)
    if (!candidate) return
    setDetail(null); setPayment(candidate); setDismissed(true); setNotice('')
  }
  const field = key => ({ value: draft[key], onChange: event => {
    const next = { ...draft, [key]: event.target.value }; setDraft(next)
    try { setFilters({ status: next.status, query: next.query.trim(), ...adminOrderDateRange(next.from, next.to) }); setPage(1); setError(null) }
    catch (failure) { setError(failure) }
  } })
  return <>
    <section ref={containerRef} className={panelClass}>
      <form className="sc-admin-filter" onSubmit={apply}>
        <label>Tìm đơn mua gói<input {...field('query')} placeholder="Mã đơn, tên gói hoặc số tiền…" className={inputClass} /></label>
        <label>Trạng thái đơn<select aria-label="Trạng thái đơn" {...field('status')} className={inputClass}><option value="">Tất cả trạng thái</option>{ADMIN_ORDER_STATUSES.map(status => <option key={status} value={status}>{subscriptionStatusLabel(status)}</option>)}</select></label>
        <label>Tạo từ ngày<input type="datetime-local" {...field('from')} className={inputClass} /></label>
        <label>Tạo đến ngày<input type="datetime-local" {...field('to')} className={inputClass} /></label>
      </form>
      {error && <ApiErrorMessage error={error} />}
      <ApiState resource={resource}>{resource.data && <>
        {resource.data.result.length ? <AdminOrderTable rows={resource.data.result} meta={resource.data.meta} onDetail={setDetail} onReview={review} /> : <EmptyPanel title="Chưa có đơn mua gói phù hợp." icon="receipt_long" />}
        <CatalogPagination meta={resource.data.meta} onPage={setPage} />
      </>}</ApiState>
    </section>
    {detail && <OrderDetail key={detail.order.id} row={detail} onClose={() => setDetail(null)} onReview={review} />}
    {paymentId && !dismissed && shortcut.error && <ApiErrorMessage error={shortcut.error} retry={shortcut.reload} />}
    {paymentId && !dismissed && shortcut.status === 'ready' && !shortcut.data && <p role="status">Không tìm thấy chứng từ đã chọn.</p>}
    {currentPayment && <ReviewComponent key={currentPayment.id} payment={currentPayment} onReload={resource.reload}
      onClose={() => { setPayment(null); setDismissed(true) }} onComplete={result => {
        setPayment({ ...currentPayment, ...result.payment }); setDismissed(true); setNotice('Đã cập nhật đơn và chứng từ thanh toán.'); resource.reload()
      }} />}
    {notice && <p role="status" className="sc-feedback">{notice}</p>}
  </>
}
