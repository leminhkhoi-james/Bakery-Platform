import React, { useRef, useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import { ModalFormState } from '../../../components/common/ModalSurface.jsx'
import { DataTable, EmptyPanel, StatusBadge, Icon } from '../../../components/common/WorkspaceUI.jsx'
import { AdminReviewDialog, ReviewSection, ReviewField } from '../../../components/management/AdminReviewUI.jsx'
import { reviewText, reviewMoney, reviewError } from '../../../services/adminPresentation.js'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from '../../../components/management/ApiState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { paymentDateRange } from '../../../services/adminFilterModels.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { useAuth } from '../../../context/useAuth.js'
import { loadDashboardPayment } from '../../../services/adminDashboardService.js'
import { loadPaymentContext, loadPaymentDirectory } from '../../../services/adminPaymentPresentation.js'
import { publicationAdminService, canReviewPayment, canApprovePayment } from '../../../services/publicationAdminService.js'
import { subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { formatOrderDate } from '../../../services/orderPresentation.js'
import { displayReference } from '../../../services/displayReference.js'
import { uiLabel } from '../../../services/uiLabels.js'

import { paymentReviewFacts, paymentSenderName } from '../../../services/paymentReviewPresentation.js'
import './admin-payments.css'

const senderName = paymentSenderName
export function PaymentReview({ payment: initialPayment, onComplete, onReload, onClose }) {
  const { roles } = useAuth(), resource = useCatalogResource(loadPaymentContext, { payment: initialPayment })
  const [confirmed, setConfirmed] = useState(null)
  const [decision, setDecision] = useState(null), [note, setNote] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(null), [attempt, setAttempt] = useState(null)
  const inFlight = useRef(false), payment = confirmed?.payment || initialPayment, order = confirmed?.order || resource.data?.order, profile = resource.data?.profile
  const facts = paymentReviewFacts(payment, order, profile, resource.data?.profileError)
  const allowed = roles.includes('ADMIN') && resource.status === 'ready' && !resource.refreshing && canReviewPayment(payment, order), approval = allowed && canApprovePayment(payment, order)
  const blockReason = !roles.includes('ADMIN') ? 'Bạn không có quyền xử lý chứng từ.' : resource.status !== 'ready' || resource.refreshing ? 'Cần tải đầy đủ đơn mua gói trước khi đối chiếu.' : !canReviewPayment(payment, order) ? 'Chứng từ hoặc đơn không còn chờ duyệt.' : !approval ? facts.comparison + ' Không thể phê duyệt.' : null
  const formId = 'review-payment-' + payment.id, reasonMissing = decision === 'reject' && !note.trim()
  const bakeryName = reviewText(profile?.bakery?.name), due = reviewMoney(order?.totalAmount, order?.currency), declared = reviewMoney(payment.amount, payment.currency)
  async function review(event) {
    event.preventDefault()
    if (inFlight.current || busy || !allowed || decision === 'approve' && !approval || decision === 'reject' && (!note.trim() || attempt)) return
    inFlight.current = true; setBusy(true); setError(null)
    let current = attempt
    try {
      if (decision === 'approve' && !current) { current = { key: crypto.randomUUID(), note }; setAttempt(current) }
      const result = await publicationAdminService.reviewPayment(payment, order, decision, current?.note ?? note, current?.key)
      setConfirmed({ ...result, payment: { ...payment, ...result.payment, proofUrl: result.payment.proofUrl || payment.proofUrl } })
      setDecision(null); setNote(''); setAttempt(null); onComplete(result)
    } catch (failure) { setError(reviewError(failure)); resource.reload(); onReload?.() }
    finally { inFlight.current = false; setBusy(false) }
  }
  const footer = <div className="sc-payment-review-footer"><div><strong>{subscriptionStatusLabel(payment.status)}</strong><p className="sc-review-help">{confirmed ? 'Đã cập nhật chứng từ và đơn mua gói.' : blockReason || 'Đối chiếu giao dịch thực tế trước khi phê duyệt.'}</p>{attempt && <p className="sc-payment-warning">Lần duyệt trước chưa được xác nhận. Thử lại cùng nội dung để tránh xử lý trùng.</p>}</div>{allowed && <div className="sc-action-row"><button type="button" className="sc-button sc-action-button--danger" disabled={busy || Boolean(attempt)} onClick={() => { setDecision('reject'); setError(null) }}><Icon name="cancel" />Từ chối</button><button type="button" className={buttonClass} disabled={busy || !approval} onClick={() => { setDecision('approve'); setError(null) }}><Icon name="check_circle" />Phê duyệt thanh toán</button></div>}</div>
  const decisionFooter = <div className="sc-action-row"><button type="button" className="sc-button sc-action-button--secondary" disabled={busy} data-modal-close>Hủy</button><button type="submit" form={formId} className={buttonClass} disabled={busy || !allowed || decision === 'approve' && !approval || reasonMissing}>{busy ? 'Đang xử lý…' : decision === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}</button></div>
  return <AdminReviewDialog className="sc-payment-review-dialog" title="Đối chiếu chứng từ mua gói" footer={footer} onClose={onClose} busy={busy}>
    <div className="sc-payment-cards">
      <ReviewSection title="Thông tin đơn mua" description="Thông tin ghi nhận khi đăng ký gói."><ApiState resource={resource}>{order && <><p className="sc-payment-amount"><span>Số tiền phải trả</span><strong>{due}</strong></p><dl className="sc-review-fields">
        <ReviewField label="Tiệm bánh" value={bakeryName} fallback={resource.data?.profileError ? 'Chưa xác minh tên tiệm' : 'Chưa cung cấp'} /><ReviewField label="Gói dịch vụ" value={reviewText(order.planNameSnapshot)} /><ReviewField label="Mã đơn mua" value={displayReference(order.id, 'SUB', order.orderNumber)} /><ReviewField label="Kỳ đăng ký" value={Number.isInteger(order.billingPeriodMonths) && order.billingPeriodMonths > 0 ? order.billingPeriodMonths + ' tháng' : null} /><ReviewField label="Ngày tạo đơn" value={formatOrderDate(order.createdAt)} /><ReviewField label="Hạn thanh toán" value={formatOrderDate(order.expiresAt)} /><ReviewField label="Tình trạng đơn" value={subscriptionStatusLabel(order.status)} />
      </dl></>}</ApiState></ReviewSection>
      <ReviewSection title="Thông tin thanh toán" description="Người gửi khai báo; Admin đối chiếu."><p className="sc-payment-amount"><span>Số tiền khai báo</span><strong>{declared}</strong></p><dl className="sc-review-fields"><ReviewField label="Phương thức" value={reviewText(uiLabel(payment.paymentMethod))} /><ReviewField label="Người gửi" value={facts.sender} fallback={facts.senderUnverified ? 'Chưa xác minh' : 'Chưa cung cấp'} /><ReviewField label="Mã giao dịch" value={facts.reference} /><ReviewField label="Ngày gửi" value={formatOrderDate(payment.submittedAt)} /></dl><p className="sc-payment-comparison">{facts.comparison}</p>{facts.identityWarning && <p className="sc-payment-warning">{facts.identityWarning}</p>}{facts.senderUnverified && <p className="sc-payment-warning">Chưa xác minh được tên người gửi.</p>}
        {payment.status !== 'SUBMITTED' && <div className="sc-payment-audit"><h4>Kết quả xử lý</h4><dl className="sc-review-fields"><ReviewField label="Quyết định" value={subscriptionStatusLabel(payment.status)} /><ReviewField label="Thời gian" value={payment.reviewedAt ? formatOrderDate(payment.reviewedAt) : null} fallback="Chưa có thời gian xử lý" />{payment.reviewNote && <ReviewField label="Ghi chú xử lý" value={reviewText(payment.reviewNote)} />}</dl></div>}
      </ReviewSection>
      <ReviewSection title="Chứng từ đính kèm"><div className="sc-payment-proof">{facts.proof ? <><p className="sc-review-help">Mở tệp để đối chiếu giao dịch.</p><a className="sc-button sc-action-button--secondary" href={facts.proof} target="_blank" rel="noreferrer"><Icon name="open_in_new" />Xem chứng từ</a></> : <p className="sc-review-help"><Icon name="description" />Chưa có chứng từ đính kèm.</p>}</div></ReviewSection>
    </div>
    {decision && <AdminReviewDialog compact className="sc-payment-decision-dialog" title={decision === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'} footer={decisionFooter} busy={busy} onClose={() => { setDecision(null); setError(null); if (!attempt) setNote('') }}><form id={formId} noValidate className="sc-payment-confirm" onSubmit={review}><ModalFormState value={note} busy={busy} /><dl className="sc-review-fields"><ReviewField label="Tiệm bánh" value={bakeryName} fallback="Chưa xác minh tên tiệm" /><ReviewField label="Số tiền khai báo" value={declared} /></dl>
      {decision === 'approve' && <><p className="sc-payment-comparison">{facts.comparison}</p>{facts.warning && <p className="sc-payment-warning">{facts.warning}</p>}{facts.senderUnverified && <p className="sc-payment-warning">Chưa xác minh được tên người gửi.</p>}<p className="sc-review-help">Xác nhận sau khi kiểm tra giao dịch thực tế. Kỳ dịch vụ được tạo hoặc lên lịch theo kết quả xử lý.</p></>}
      <label><span>{decision === 'reject' ? <>Lý do từ chối <span aria-hidden="true" className="sc-field-error">*</span></> : 'Ghi chú đối chiếu (tùy chọn)'}</span><textarea aria-label={decision === 'reject' ? 'Lý do từ chối' : 'Ghi chú đối chiếu'} aria-invalid={reasonMissing} aria-describedby={reasonMissing ? formId + '-reason-error' : undefined} placeholder={decision === 'reject' ? 'Ví dụ: Số tiền hoặc thông tin giao dịch không khớp. Vui lòng nêu nội dung cần bổ sung.' : 'Ghi nhận kết quả đối chiếu nếu cần.'} className={inputClass} required={decision === 'reject'} maxLength={2000} disabled={busy || Boolean(attempt)} value={note} onChange={(event) => setNote(event.target.value)} />{reasonMissing && <small id={formId + '-reason-error'} className="sc-field-error">Nhập lý do từ chối để xác nhận.</small>}</label>
      {(!allowed || decision === 'approve' && !approval) && <p role="alert" className="sc-payment-warning">{blockReason}</p>}{attempt && !busy && <p className="sc-review-help">Thử lại cùng ghi chú và yêu cầu duyệt trước để tránh xử lý trùng.</p>}{decision === 'reject' && <p className="sc-review-help">Chủ tiệm có thể bổ sung và gửi lại khi đơn còn hạn.</p>}{error && <ApiErrorMessage error={error} />}</form></AdminReviewDialog>}
  </AdminReviewDialog>
}

export default function AdminPaymentsPage({ onNavigate, routeSearch = '' }) {
  const params = new URLSearchParams(routeSearch), paymentId = params.get('paymentId') || '', initialBakeryId = params.get('bakeryId') || ''
  const shortcut = useCatalogResource(loadDashboardPayment, { id: paymentId })
  const [dismissed, setDismissed] = useState(false), [selected, setSelected] = useState(null), [page, setPage] = useState(1), [notice, setNotice] = useState('')
  const [draft, setDraft] = useState({ query: '', status: 'SUBMITTED', from: '', to: '' }), [filters, setFilters] = useState({ status: 'SUBMITTED' }), [error, setError] = useState(null)
  const { query: search = '', ...serverFilters } = filters
  const resource = useCatalogResource(loadPaymentDirectory, { page, size: 20, bakeryId: initialBakeryId, ...serverFilters, sort: 'submittedAt,asc' })
  const rows = resource.data?.result.filter((payment) => !search || [payment.context?.profile?.bakery?.name, senderName(payment, payment.context?.profile), payment.context?.order?.planNameSnapshot].join(' ').toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')))
  const field = (key) => ({ value: draft[key], onChange: (event) => setDraft({ ...draft, [key]: event.target.value }) }), current = selected || (!dismissed && shortcut.data)
  return <AdminFrame activeTab="admin-payments" onNavigate={onNavigate}><section className={panelClass}>
    <form className="sc-admin-filter" onSubmit={(event) => { event.preventDefault(); try { setFilters({ status: draft.status, query: draft.query.trim(), ...paymentDateRange(draft.from, draft.to) }); setPage(1); setError(null) } catch (failure) { setError(failure) } }}><label>Tìm trong trang<input {...field('query')} placeholder="Tên tiệm, người gửi, gói dịch vụ" className={inputClass} /></label><label>Trạng thái<select {...field('status')} className={inputClass}><option value="">Tất cả</option>{['SUBMITTED', 'APPROVED', 'REJECTED'].map((status) => <option key={status} value={status}>{subscriptionStatusLabel(status)}</option>)}</select></label><label>Từ ngày<input type="datetime-local" {...field('from')} className={inputClass} /></label><label>Đến ngày<input type="datetime-local" {...field('to')} className={inputClass} /></label><div className="sc-action-row"><button className={buttonClass} disabled={resource.refreshing}><Icon name="filter_alt" />Lọc</button><RefreshButton disabled={resource.refreshing} onClick={resource.reload}>Làm mới</RefreshButton></div></form>
    <p className="sc-review-help">Tìm tên trong trang đang xem. Trạng thái và khoảng thời gian áp dụng cho toàn bộ danh sách.</p>{error && <ApiErrorMessage error={error} />}
    <ApiState resource={resource}>{resource.data && <><p className="sc-review-help">{resource.data.meta.total} chứng từ theo bộ lọc{search ? ' · ' + rows.length + ' kết quả trong trang này' : ''}</p>{rows.length ? <DataTable label="Chứng từ mua gói" className="sc-admin-record-table"><thead><tr><th>Tiệm / người gửi</th><th>Gói dịch vụ</th><th>Số tiền</th><th>Ngày gửi</th><th>Trạng thái</th><th className="sc-table-actions">Thao tác</th></tr></thead><tbody>{rows.map((payment) => <tr key={payment.id}><td data-label="Tiệm / người gửi"><strong>{reviewText(payment.context?.profile?.bakery?.name) || 'Chưa tải được tên tiệm'}</strong><small>{senderName(payment, payment.context?.profile) || 'Chưa có tên người gửi'}</small></td><td data-label="Gói dịch vụ">{reviewText(payment.context?.order?.planNameSnapshot) || 'Chưa tải được tên gói'}</td><td data-label="Số tiền">{reviewMoney(payment.amount, payment.currency)}</td><td data-label="Ngày gửi">{formatOrderDate(payment.submittedAt)}</td><td data-label="Trạng thái"><StatusBadge status={payment.status} label={subscriptionStatusLabel(payment.status)} /></td><td className="sc-table-actions"><button className={buttonClass} onClick={() => { setSelected(payment); setDismissed(true); setNotice('') }}><Icon name="receipt_long" />Đối chiếu</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Chưa có chứng từ phù hợp." icon="receipt_long" />}<CatalogPagination meta={resource.data.meta} onPage={setPage} /></>}</ApiState>
    </section>{paymentId && !dismissed && shortcut.error && <ApiErrorMessage error={shortcut.error} retry={shortcut.reload} />}{paymentId && !dismissed && shortcut.status === 'ready' && !shortcut.data && <p role="status">Không tìm thấy chứng từ đã chọn.</p>}{current && <PaymentReview key={current.id} payment={current} onReload={resource.reload} onClose={() => { setSelected(null); setDismissed(true) }} onComplete={(result) => { setSelected({ ...current, ...result.payment, proofUrl: result.payment.proofUrl || current.proofUrl }); setDismissed(true); setNotice('Đã cập nhật chứng từ: ' + subscriptionStatusLabel(result.payment.status).toLocaleLowerCase('vi') + '.'); resource.reload() }} />}{notice && <p role="status" className="sc-feedback">{notice}</p>}</AdminFrame>
}
