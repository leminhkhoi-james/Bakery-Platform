import { displayReference } from '../../../services/displayReference.js'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import { loadDashboardPayment } from '../../../services/adminDashboardService.js'
import { uiLabel, cleanPresentationLabel } from '../../../services/uiLabels.js'
import { isMockRecord } from '../../../mockData/runtime.js'
import React, { useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { DataTable, DetailDrawer, EmptyPanel, StatusBadge, Icon } from '../../../components/common/WorkspaceUI.jsx'
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
    <p className="break-all">Chứng từ: {displayReference(payment.id, 'PAY')} · {uiLabel(payment.status)}</p><p>{uiLabel(payment.paymentMethod, 'Chưa có phương thức')} · {cleanPresentationLabel(payment.paymentReference, 'Chưa có mã tham chiếu')}</p><p>{formatSubscriptionMoney(payment.amount, payment.currency)} · {formatSubscriptionDate(payment.submittedAt)}</p>
    {proof ? <a href={proof} target="_blank" rel="noreferrer" className="underline">Mở chứng từ</a> : <p>{isMockRecord(payment.id) ? 'Chưa có tệp chứng từ đính kèm. Thao tác phê duyệt không thực hiện chuyển tiền.' : 'Chưa có tệp chứng từ. Cần đối chiếu giao dịch thực tế trước khi duyệt.'}</p>}
    <ApiState resource={resource}>{order && <><p className="break-all">Đơn: {displayReference(order.id, 'SUB', order.orderNumber)} · Tiệm: {displayReference(order.bakeryId, 'SHOP')}</p><p>Gói: {order.planNameSnapshot || order.planCodeSnapshot || 'Chưa có thông tin'} · {uiLabel(order.status)}</p><p>Tổng đơn: {formatSubscriptionMoney(order.totalAmount, order.currency)}</p>
      {!canReviewPayment(payment, order) && <p>Chứng từ hoặc đơn không còn chờ duyệt. Hãy tải lại danh sách.</p>}
      {canReviewPayment(payment, order) && !canApprovePayment(payment, order) && <p role="alert">Số tiền/tiền tệ chưa khớp; không thể phê duyệt.</p>}
      <label>Ghi chú / lý do từ chối<textarea disabled={busy || Boolean(attempt)} value={note} onChange={(event) => setNote(event.target.value)} className={inputClass} /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={confirmed} disabled={busy} onChange={(event) => setConfirmed(event.target.checked)} />{isMockRecord(payment.id) ? 'Xác nhận đã kiểm tra thông tin đơn và chứng từ. Thao tác này không chuyển tiền.' : 'Tôi đã đối chiếu đơn, chứng từ và giao dịch thực tế.'}</label>
      <p className="text-sm">Phê duyệt sẽ kích hoạt hoặc lên lịch kỳ dịch vụ. Thao tác này không chuyển tiền. Hãy kiểm tra chứng từ trước khi xác nhận.</p>
      <div className="flex flex-wrap gap-3"><button disabled={busy || !confirmed || !canApprovePayment(payment, order)} className={buttonClass} onClick={() => review('approve')}><Icon name="check_circle" />{busy ? 'Đang xử lý…' : 'Phê duyệt thanh toán'}</button><button disabled={busy || Boolean(attempt) || !confirmed || !note.trim() || !canReviewPayment(payment, order)} className="sc-button sc-action-button sc-action-button--danger" onClick={() => review('reject')}><Icon name="cancel" />Từ chối, yêu cầu bổ sung</button></div>
    </>}</ApiState>{error && <ApiErrorMessage error={error} />}
  </section></DetailDrawer>
}
export default function AdminPaymentsPage({ onNavigate, routeSearch = '' }) {
  const paymentId = new URLSearchParams(routeSearch).get('paymentId') || ''
  const shortcut = useCatalogResource(loadDashboardPayment, { id: paymentId })
  const [shortcutDismissed, setShortcutDismissed] = useState(false)
  const initialBakeryId = (new URLSearchParams(routeSearch).get('bakeryId') || '').trim().toLowerCase()
  const [page, setPage] = useState(1), [status, setStatus] = useState('SUBMITTED'), [bakeryId, setBakeryId] = useState(initialBakeryId), [filter, setFilter] = useState(initialBakeryId), [selected, setSelected] = useState(null), [notice, setNotice] = useState('')
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [dates, setDates] = useState({}), [filterError, setFilterError] = useState(null)
  const resource = useCatalogResource(loadAdminPayments, { page, size: 20, status, bakeryId: filter, ...dates, sort: 'submittedAt,asc' })
  const currentPayment = selected || (!shortcutDismissed && shortcut.data)
  return <AdminFrame activeTab="admin-payments" onNavigate={onNavigate}>
    <section className={panelClass}><form onSubmit={(event) => { event.preventDefault(); try { const range = paymentDateRange(from, to); setFilterError(null); setDates(range); setPage(1); setFilter(bakeryId.trim()); setSelected(null) } catch (failure) { setFilterError(failure) } }} className="grid gap-3 sm:grid-cols-3"><label>Mã tiệm (tùy chọn)<input value={bakeryId} onChange={(event) => setBakeryId(event.target.value)} className={inputClass} /></label><label>Trạng thái<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); setSelected(null) }} className={inputClass}><option value="">Tất cả</option>{['SUBMITTED', 'APPROVED', 'REJECTED'].map((value) => <option key={value} value={value}>{uiLabel(value)}</option>)}</select></label><label>Gửi từ ngày<input type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} /></label><label>Gửi đến ngày<input type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} /></label><button className={buttonClass}>Lọc chứng từ</button></form>{filterError && <ApiErrorMessage error={filterError} />}
      <RefreshButton onClick={resource.reload} className="underline">Tải lại chứng từ</RefreshButton>
      <ApiState resource={resource}>{resource.data && <><p>Tổng theo bộ lọc: {resource.data.meta.total}</p>{resource.data.result.length ? <DataTable label="Chứng từ mua gói"><thead><tr><th>Chứng từ / Đơn mua</th><th className="sc-money">Số tiền</th><th>Ngày gửi</th><th>Trạng thái</th><th className="sc-table-actions" scope="col">Thao tác</th></tr></thead><tbody>{resource.data.result.map((payment) => <tr key={payment.id}><td><strong>{displayReference(payment.id, 'PAY', payment.paymentReference)}</strong><small>{displayReference(payment.subscriptionOrderId, 'SUB')}</small></td><td className="whitespace-nowrap font-semibold tabular-nums">{formatSubscriptionMoney(payment.amount, payment.currency)}</td><td className="whitespace-nowrap">{formatSubscriptionDate(payment.submittedAt)}</td><td><StatusBadge status={payment.status} label={subscriptionStatusLabel(payment.status)} /></td><td className="sc-table-actions"><button onClick={() => { setSelected(payment); setShortcutDismissed(true); setNotice('') }} className={buttonClass}><Icon name="receipt_long" />Xem / đối chiếu</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Chưa có chứng từ phù hợp." description="Chủ tiệm cần tạo đơn mua gói và gửi chứng từ thực tế." icon="receipt_long" />}<CatalogPagination meta={resource.data.meta} onPage={setPage} /></>}</ApiState>
    </section>{paymentId && !shortcutDismissed && shortcut.error && <ApiErrorMessage error={shortcut.error} retry={shortcut.reload} />}{paymentId && !shortcutDismissed && shortcut.status === 'ready' && !shortcut.data && <p role="status">Không tìm thấy chứng từ đã chọn.</p>}{currentPayment && <PaymentReview key={currentPayment.id} payment={currentPayment} onReload={resource.reload} onClose={() => { setSelected(null); setShortcutDismissed(true) }} onComplete={(result) => { setNotice('Đã cập nhật: ' + subscriptionStatusLabel(result.payment.status) + '. Kỳ dịch vụ: ' + (result.subscription ? subscriptionStatusLabel(result.subscription.status) : 'không tạo kỳ')); setSelected(null); setShortcutDismissed(true); resource.reload() }} />}{notice && <p role="status">{notice}</p>}
  </AdminFrame>
}
