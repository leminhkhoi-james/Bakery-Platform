import React, { useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from '../../../components/management/ApiState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
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
  return <section className={panelClass}><div className="flex justify-between gap-3"><h2 className="font-bold">Đối chiếu chứng từ mua gói</h2><button disabled={busy} onClick={onClose}>Đóng hồ sơ</button></div>
    <p className="break-all">Payment: {payment.id} · {payment.status}</p><p>{payment.paymentMethod || 'Chưa có phương thức'} · {payment.paymentReference || 'Chưa có mã tham chiếu'}</p><p>{formatSubscriptionMoney(payment.amount, payment.currency)} · {formatSubscriptionDate(payment.submittedAt)}</p>
    {proof ? <a href={proof} target="_blank" rel="noreferrer" className="underline">Mở chứng từ từ backend</a> : <p>Backend chưa trả URL chứng từ. Cần đối chiếu giao dịch thật trước khi duyệt.</p>}
    <ApiState resource={resource}>{order && <><p className="break-all">Đơn: {order.orderNumber || order.id} · Tiệm: {order.bakeryId}</p><p>Gói: {order.planNameSnapshot || order.planCodeSnapshot || 'Chưa có thông tin'} · {order.status}</p><p>Tổng đơn: {formatSubscriptionMoney(order.totalAmount, order.currency)}</p>
      {!canReviewPayment(payment, order) && <p>Chứng từ hoặc đơn không còn chờ duyệt. Hãy tải lại danh sách.</p>}
      {canReviewPayment(payment, order) && !canApprovePayment(payment, order) && <p role="alert">Số tiền/tiền tệ chưa khớp; không thể phê duyệt.</p>}
      <label>Ghi chú / lý do từ chối<textarea disabled={busy || Boolean(attempt)} value={note} onChange={(event) => setNote(event.target.value)} className={inputClass} /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={confirmed} disabled={busy} onChange={(event) => setConfirmed(event.target.checked)} />Tôi đã đối chiếu đơn, chứng từ và giao dịch thực tế.</label>
      <p className="text-sm">Phê duyệt tạo kỳ ACTIVE hoặc SCHEDULED theo backend. Không thực hiện chuyển tiền. Nếu mất phản hồi, tải lại và kiểm tra trạng thái; thử lại giữ cùng khóa và ghi chú.</p>
      <div className="flex flex-wrap gap-3"><button disabled={busy || !confirmed || !canApprovePayment(payment, order)} className={buttonClass} onClick={() => review('approve')}>{busy ? 'Đang gửi…' : 'Phê duyệt thanh toán'}</button><button disabled={busy || Boolean(attempt) || !confirmed || !note.trim() || !canReviewPayment(payment, order)} className="rounded-xl border px-4 py-2 disabled:opacity-40" onClick={() => review('reject')}>Từ chối, yêu cầu bổ sung</button></div>
    </>}</ApiState>{error && <ApiErrorMessage error={error} />}
  </section>
}
export default function AdminPaymentsPage({ onNavigate, routeSearch = '' }) {
  const initialBakeryId = (new URLSearchParams(routeSearch).get('bakeryId') || '').trim().toLowerCase()
  const [page, setPage] = useState(1), [status, setStatus] = useState('SUBMITTED'), [bakeryId, setBakeryId] = useState(initialBakeryId), [filter, setFilter] = useState(initialBakeryId), [selected, setSelected] = useState(null), [notice, setNotice] = useState('')
  const resource = useCatalogResource(loadAdminPayments, { page, size: 20, status, bakeryId: filter, sort: 'submittedAt,asc' })
  return <AdminFrame title="Duyệt thanh toán Subscription" activeTab="admin-payments" onNavigate={onNavigate}>
    <section className={panelClass}><form onSubmit={(event) => { event.preventDefault(); setPage(1); setFilter(bakeryId.trim()); setSelected(null) }} className="grid gap-3 sm:grid-cols-3"><label>Mã tiệm (UUID, tùy chọn)<input value={bakeryId} onChange={(event) => setBakeryId(event.target.value)} className={inputClass} /></label><label>Trạng thái<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); setSelected(null) }} className={inputClass}><option value="">Tất cả</option>{['SUBMITTED', 'APPROVED', 'REJECTED'].map((value) => <option key={value}>{value}</option>)}</select></label><button className={buttonClass}>Lọc chứng từ</button></form>
      <button onClick={resource.reload} className="underline">Tải lại chứng từ</button>
      <ApiState resource={resource}>{resource.data && <><p>Tổng theo bộ lọc: {resource.data.meta.total}</p>{resource.data.result.length ? resource.data.result.map((payment) => <article key={payment.id} className="flex flex-wrap justify-between items-center gap-3 border-b border-outline-variant/30 py-3"><div><p>{formatSubscriptionMoney(payment.amount, payment.currency)} · {subscriptionStatusLabel(payment.status)}</p><p className="break-all text-xs">{payment.subscriptionOrderId}</p><p>{formatSubscriptionDate(payment.submittedAt)}</p></div><button onClick={() => { setSelected(payment); setNotice('') }} className={buttonClass}>Xem / đối chiếu</button></article>) : <p>Chưa có chứng từ phù hợp từ backend. Vendor cần tạo đơn mua gói và gửi chứng từ thực tế.</p>}<CatalogPagination meta={resource.data.meta} onPage={setPage} /></>}</ApiState>
    </section>{selected && <PaymentReview key={selected.id} payment={selected} onReload={resource.reload} onClose={() => setSelected(null)} onComplete={(result) => { setNotice('Backend xác nhận: ' + subscriptionStatusLabel(result.payment.status) + '. Kỳ dịch vụ: ' + (result.subscription ? subscriptionStatusLabel(result.subscription.status) : 'không tạo kỳ')); setSelected(null); resource.reload() }} />}{notice && <p role="status">{notice}</p>}
  </AdminFrame>
}
