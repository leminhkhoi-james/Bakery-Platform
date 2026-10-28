import { isMockRecord } from '../../../mockData/runtime.js'
import React, { useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { DataTable, DetailDrawer, EmptyPanel, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from '../../../components/management/ApiState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { paymentDateRange } from '../../../services/adminFilterModels.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadAdminPayments, loadAdminOrder, publicationAdminService, canReviewPayment, canApprovePayment } from '../../../services/publicationAdminService.js'
import { formatSubscriptionMoney, formatSubscriptionDate, subscriptionStatusLabel } from '../../../services/subscriptionModels.js'

export function PaymentReview({ payment, onComplete, onReload, onClose }) {
  const resource = useCatalogResource(loadAdminOrder, { id: payment.subscriptionOrderId })
  const [note, setNote] = useState(''), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(null), [attempt, setAttempt] = useState(null)
  const order = resource.data
  const proof = typeof payment.proofUrl === 'string' && /^https?:\/\//i.test(payment.proofUrl) ? payment.proofUrl : null
  async function review(action) {
    if (busy || !confirmed) return
    setBusy(true); setError(null)
    let current = attempt
    try {
      if (action === 'approve' && !current) { current = { key: crypto.randomUUID(), note }; setAttempt(current) }
      const result = await publicationAdminService.reviewPayment(payment, order, action, current?.note ?? note, current?.key)
      onComplete(result)
    } catch (failure) { setError(failure); resource.reload(); onReload() }
    finally { setBusy(false) }
  }
  return <DetailDrawer title="Đối chiếu chứng từ mua gói" onClose={onClose} busy={busy}><section className={panelClass}><h2 className="sr-only">Đối chiếu chứng từ mua gói</h2>
    <p className="break-all">Payment: {payment.id} · {payment.status}</p><p>{payment.paymentMethod || 'Chưa có phương thức'} · {payment.paymentReference || 'Chưa có mã tham chiếu'}</p><p>{formatSubscriptionMoney(payment.amount, payment.currency)} · {formatSubscriptionDate(payment.submittedAt)}</p>
    {proof ? <a href={proof} target="_blank" rel="noreferrer" className="underline">Mở chứng từ từ backend</a> : <p>{isMockRecord(payment.id) ? 'Chứng từ mẫu; không có giao dịch ngân hàng hoặc chuyển tiền.' : 'Backend chưa trả URL chứng từ. Cần đối chiếu giao dịch thật trước khi duyệt.'}</p>}
    <ApiState resource={resource}>{order && <><p className="break-all">Đơn: {order.orderNumber || order.id} · Tiệm: {order.bakeryId}</p><p>Gói: {order.planNameSnapshot || order.planCodeSnapshot || 'Chưa có thông tin'} · {order.status}</p><p>Tổng đơn: {formatSubscriptionMoney(order.totalAmount, order.currency)}</p>
      {!canReviewPayment(payment, order) && <p>Chứng từ hoặc đơn không còn chờ duyệt. Hãy tải lại danh sách.</p>}
      {canReviewPayment(payment, order) && !canApprovePayment(payment, order) && <p role="alert">Số tiền/tiền tệ chưa khớp; không thể phê duyệt.</p>}
      <label>Ghi chú / lý do từ chối<textarea disabled={busy || Boolean(attempt)} value={note} onChange={(event) => setNote(event.target.value)} className={inputClass} /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={confirmed} disabled={busy} onChange={(event) => setConfirmed(event.target.checked)} />{isMockRecord(payment.id) ? 'Xác nhận đối chiếu chứng từ mẫu, không có giao dịch thật.' : 'Tôi đã đối chiếu đơn, chứng từ và giao dịch thực tế.'}</label>
      <p className="text-sm">Phê duyệt tạo kỳ ACTIVE hoặc SCHEDULED theo backend. Không thực hiện chuyển tiền. Nếu mất phản hồi, tải lại và kiểm tra trạng thái; thử lại giữ cùng khóa và ghi chú.</p>
      <div className="flex flex-wrap gap-3"><button disabled={busy || !confirmed || !canApprovePayment(payment, order)} className={buttonClass} onClick={() => review('approve')}>{busy ? 'Đang gửi…' : 'Phê duyệt thanh toán'}</button><button disabled={busy || Boolean(attempt) || !confirmed || !note.trim() || !canReviewPayment(payment, order)} className="rounded-xl border px-4 py-2 disabled:opacity-40" onClick={() => review('reject')}>Từ chối, yêu cầu bổ sung</button></div>
    </>}</ApiState>{error && <ApiErrorMessage error={error} />}
  </section></DetailDrawer>
}
export default function AdminPaymentsPage({ onNavigate, routeSearch = '' }) {
  const initialBakeryId = (new URLSearchParams(routeSearch).get('bakeryId') || '').trim().toLowerCase()
  const [page, setPage] = useState(1), [status, setStatus] = useState('SUBMITTED'), [bakeryId, setBakeryId] = useState(initialBakeryId), [filter, setFilter] = useState(initialBakeryId), [selected, setSelected] = useState(null), [notice, setNotice] = useState('')
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [dates, setDates] = useState({}), [filterError, setFilterError] = useState(null)
  const resource = useCatalogResource(loadAdminPayments, { page, size: 20, status, bakeryId: filter, ...dates, sort: 'submittedAt,asc' })
  return <AdminFrame title="Duyệt thanh toán Subscription" activeTab="admin-payments" onNavigate={onNavigate}>
    <section className={panelClass}><form onSubmit={(event) => { event.preventDefault(); try { const range = paymentDateRange(from, to); setFilterError(null); setDates(range); setPage(1); setFilter(bakeryId.trim()); setSelected(null) } catch (failure) { setFilterError(failure) } }} className="grid gap-3 sm:grid-cols-3"><label>Mã tiệm (UUID, tùy chọn)<input value={bakeryId} onChange={(event) => setBakeryId(event.target.value)} className={inputClass} /></label><label>Trạng thái<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); setSelected(null) }} className={inputClass}><option value="">Tất cả</option>{['SUBMITTED', 'APPROVED', 'REJECTED'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Gửi từ ngày<input type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} /></label><label>Gửi đến ngày<input type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} /></label><button className={buttonClass}>Lọc chứng từ</button></form>{filterError && <ApiErrorMessage error={filterError} />}
      <button onClick={resource.reload} className="underline">Tải lại chứng từ</button>
      <ApiState resource={resource}>{resource.data && <><p>Tổng theo bộ lọc: {resource.data.meta.total}</p>{resource.data.result.length ? <DataTable label="Chứng từ Subscription"><thead><tr><th>Chứng từ / Đơn mua</th><th>Số tiền</th><th>Ngày gửi</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{resource.data.result.map((payment) => <tr key={payment.id}><td><strong>{payment.paymentReference || payment.id}</strong><small>{payment.subscriptionOrderId}</small></td><td className="whitespace-nowrap font-semibold tabular-nums">{formatSubscriptionMoney(payment.amount, payment.currency)}</td><td className="whitespace-nowrap">{formatSubscriptionDate(payment.submittedAt)}</td><td><StatusBadge status={payment.status} label={subscriptionStatusLabel(payment.status)} /></td><td><button onClick={() => { setSelected(payment); setNotice('') }} className={buttonClass}>Xem / đối chiếu</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Chưa có chứng từ phù hợp từ backend." description="Vendor cần tạo đơn mua gói và gửi chứng từ thực tế." icon="receipt_long" />}<CatalogPagination meta={resource.data.meta} onPage={setPage} /></>}</ApiState>
    </section>{selected && <PaymentReview key={selected.id} payment={selected} onReload={resource.reload} onClose={() => setSelected(null)} onComplete={(result) => { setNotice('Đã cập nhật: ' + subscriptionStatusLabel(result.payment.status) + '. Kỳ dịch vụ: ' + (result.subscription ? subscriptionStatusLabel(result.subscription.status) : 'không tạo kỳ')); setSelected(null); resource.reload() }} />}{notice && <p role="status">{notice}</p>}
  </AdminFrame>
}
