import { displayReference } from '../../../services/displayReference.js'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import EntityActionButtons from '../../../components/common/EntityActionButtons.jsx'
import { uiLabel, publicCopy } from '../../../services/uiLabels.js'
import React, { useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { isCatalogId } from '../../../services/catalogModels.js'
import { loadOrder } from '../../../services/orderService.js'
import { aiService } from '../../../services/aiService.js'
import { adminManagementService } from '../../../services/adminManagementService.js'
import ReviewModeration from '../../../components/orders/ReviewModeration.jsx'
import { StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { EmptyPanel, Icon } from '../../../components/common/WorkspaceUI.jsx'
import { AdminReviewDialog, ReviewSection, ReviewField } from '../../../components/management/AdminReviewUI.jsx'
import { reviewText } from '../../../services/adminPresentation.js'
import { formatOrderDate } from '../../../services/orderPresentation.js'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from '../../../components/management/ApiState.jsx'
const loadModerationDesign = ({ id }, options) => aiService.getDesign(id, options)
export function DesignModeration({ id }) {
  const { roles } = useAuth(), resource = useCatalogResource(loadModerationDesign, { id })
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState('')
  const design = resource.data
  return <div data-modal-busy={busy}><RefreshButton onClick={resource.reload} disabled={busy}>Tải lại thiết kế</RefreshButton><ApiState resource={resource}>{resource.status === 'ready' && !design && <EmptyPanel title="Chưa có nội dung cần kiểm duyệt" icon="fact_check" />}{design && <><ReviewSection title="Người gửi"><dl className="sc-review-fields"><ReviewField label="Tên người gửi" value={reviewText(design.createdByName)} fallback="Chưa có tên người gửi" /><ReviewField label="Ngày tạo" value={formatOrderDate(design.createdAt)} /></dl></ReviewSection><ReviewSection title="Nội dung cần kiểm duyệt"><dl className="sc-review-fields"><ReviewField label="Mã thiết kế" value={displayReference(design.id, 'ART')} /><ReviewField label="Trạng thái" value={<StatusBadge status={design.moderationStatus} />} /></dl>{publicCopy(design.moderationReason) && <p className="sc-review-help">{publicCopy(design.moderationReason)}</p>}{design.imageUrl && /^https?:\/\//i.test(design.imageUrl) ? <a href={design.imageUrl} target="_blank" rel="noreferrer"><img src={design.imageUrl} alt="Thiết kế cần kiểm duyệt" className="sc-review-image" /><span className="sc-button sc-action-button--secondary">Xem ảnh</span></a> : <p className="sc-review-help">Chưa có ảnh xem trước. Vui lòng kiểm tra thiết kế trước khi duyệt.</p>}</ReviewSection><ReviewSection title="Xử lý của Admin" action>
    {design.moderationStatus === 'PENDING' && roles.includes('ADMIN') ? <EntityActionButtons title="Kiểm duyệt thiết kế" status={design.moderationStatus} busy={busy} refreshing={resource.refreshing} actions={[
      { key: 'APPROVED', label: 'Duyệt thiết kế', icon: 'check_circle', description: 'Xác nhận thiết kế phù hợp và có thể sử dụng.' },
      { key: 'REJECTED', label: 'Từ chối thiết kế', icon: 'cancel', tone: 'danger', description: 'Thiết kế bị từ chối sẽ không thể chọn cho yêu cầu bánh.' },
    ]} onConfirm={async (status) => { if (busy) return false; setBusy(true); setError(null); setNotice(''); try { await adminManagementService.moderateDesign(id, status); setNotice('Đã cập nhật kiểm duyệt: ' + uiLabel(status) + '.'); resource.reload(); return true } catch (failure) { setError(failure); resource.reload(); return false } finally { setBusy(false) } }} /> : <p className="sc-review-help">Chỉ quản trị viên được duyệt hoặc từ chối thiết kế đang chờ.</p>}</ReviewSection></>}</ApiState>{notice && <p role="status" className="sc-feedback">{notice}</p>}{error && <ApiErrorMessage error={error} />}</div>
}
function ReviewLookup({ orderId }) {
  const resource = useCatalogResource(loadOrder, { orderId })
  const order = resource.data
  return <div><RefreshButton onClick={resource.reload}>Tải lại đánh giá</RefreshButton><ApiState resource={resource}>{order && <><ReviewSection title="Người gửi"><dl className="sc-review-fields"><ReviewField label="Khách hàng" value={reviewText(order.customerName)} fallback="Chưa có tên người gửi" /><ReviewField label="Ngày đánh giá" value={formatOrderDate(order.review?.createdAt)} /></dl></ReviewSection><ReviewSection title="Nội dung cần kiểm duyệt"><dl className="sc-review-fields"><ReviewField label="Đơn hàng" value={displayReference(order.id, 'ORD', order.orderNumber)} /><ReviewField label="Tiệm bánh" value={reviewText(order.bakeryName)} /></dl>{order.review ? <><p className="sc-review-help">{order.review.rating}/5 · {uiLabel(order.review.status)}</p><p className="whitespace-pre-wrap">{reviewText(order.review.comment) || 'Không có nhận xét bằng văn bản.'}</p></> : <EmptyPanel title="Chưa có nội dung cần kiểm duyệt" description="Đơn hàng này chưa có đánh giá." icon="rate_review" />}</ReviewSection>{order.review && <ReviewSection title="Xử lý của Admin" action><ReviewModeration key={order.review.updatedAt} review={order.review} onChanged={resource.reload} /></ReviewSection>}</>}{resource.status === 'ready' && !order && <EmptyPanel title="Chưa có nội dung cần kiểm duyệt" icon="fact_check" />}</ApiState></div>
}
export default function AdminModerationPage({ onNavigate, routeSearch = '' }) {
  const query = new URLSearchParams(routeSearch), initialKind = query.get('kind') === 'design' ? 'design' : 'review', initialId = query.get('id') || ''
  const [kind, setKind] = useState(initialKind), [input, setInput] = useState(initialId), [selected, setSelected] = useState(() => isCatalogId(initialId) ? { id: initialId, kind: initialKind } : null), [error, setError] = useState(null)
  return <AdminFrame activeTab="admin-moderation" onNavigate={onNavigate}><section className={panelClass}><h2 className="font-bold">Tra cứu nội dung</h2><p className="sc-review-help">Nhập mã đơn hàng hoặc mã thiết kế từ nội dung cần kiểm tra. Bạn có thể xem và xử lý từng nội dung sau khi tra cứu.</p><form onSubmit={(event) => { event.preventDefault(); if (!isCatalogId(input.trim())) return setError({ status: 400, message: 'Mã tra cứu không hợp lệ. Vui lòng sao chép đầy đủ mã từ nội dung cần kiểm tra.' }); setError(null); setSelected({ id: input.trim().toLowerCase(), kind }) }} className="sc-moderation-lookup"><label>Loại nội dung<select value={kind} onChange={(event) => setKind(event.target.value)} className={inputClass}><option value="review">Đánh giá đơn hàng</option><option value="design">Thiết kế AI</option></select></label><label>{kind === 'review' ? 'Mã đơn hàng' : 'Mã thiết kế'}<input required spellCheck={false} placeholder={kind === 'review' ? 'Dán đầy đủ mã đơn hàng cần kiểm tra' : 'Dán đầy đủ mã thiết kế cần kiểm tra'} value={input} onChange={(event) => setInput(event.target.value)} className={inputClass} /></label><button className={buttonClass}><Icon name="search" />Xem chi tiết</button></form>{error && <ApiErrorMessage error={error} />}{!selected && <EmptyPanel title="Nhập mã để tra cứu nội dung" description="Chọn đánh giá đơn hàng hoặc thiết kế AI để xem thông tin và các thao tác kiểm duyệt phù hợp." icon="manage_search" />}</section>{selected && <AdminReviewDialog title={selected.kind === 'review' ? 'Kiểm duyệt đánh giá' : 'Kiểm duyệt thiết kế'} onClose={() => setSelected(null)}>{selected.kind === 'review' ? <ReviewLookup key={selected.id} orderId={selected.id} /> : <DesignModeration key={selected.id} id={selected.id} />}</AdminReviewDialog>}</AdminFrame>
}

