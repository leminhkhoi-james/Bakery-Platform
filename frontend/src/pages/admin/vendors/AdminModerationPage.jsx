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
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from '../../../components/management/ApiState.jsx'
const loadModerationDesign = ({ id }, options) => aiService.getDesign(id, options)
export function DesignModeration({ id }) {
  const { roles } = useAuth(), resource = useCatalogResource(loadModerationDesign, { id })
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState('')
  const design = resource.data
  return <section className={panelClass}><h2 className="font-bold">Kiểm duyệt thiết kế</h2><RefreshButton onClick={resource.reload} className="underline" disabled={busy}>Tải lại thiết kế</RefreshButton><ApiState resource={resource}>{design && <><div className="flex flex-wrap items-center gap-3"><p className="break-all text-xs">{displayReference(design.id, 'ART')}</p><StatusBadge status={design.moderationStatus} /></div><p>Lượt thiết kế: {displayReference(design.generationJobId, 'AI')}{publicCopy(design.moderationReason) && <> · {publicCopy(design.moderationReason)}</>}</p>{design.imageUrl && /^https?:\/\//i.test(design.imageUrl) ? <a href={design.imageUrl} target="_blank" rel="noreferrer" className="underline">Xem ảnh</a> : <p>Chưa có ảnh xem trước. Vui lòng kiểm tra thiết kế trước khi duyệt.</p>}
    {design.moderationStatus === 'PENDING' && roles.includes('ADMIN') ? <EntityActionButtons title="Kiểm duyệt thiết kế" status={design.moderationStatus} busy={busy} refreshing={resource.refreshing} actions={[
      { key: 'APPROVED', label: 'Duyệt thiết kế', icon: 'check_circle', description: 'Xác nhận thiết kế phù hợp và có thể sử dụng.' },
      { key: 'REJECTED', label: 'Từ chối thiết kế', icon: 'cancel', tone: 'danger', description: 'Thiết kế bị từ chối sẽ không thể chọn cho yêu cầu bánh.' },
    ]} onConfirm={async (status) => { if (busy) return false; setBusy(true); setError(null); setNotice(''); try { await adminManagementService.moderateDesign(id, status); setNotice('Đã cập nhật kiểm duyệt: ' + uiLabel(status) + '.'); resource.reload(); return true } catch (failure) { setError(failure); resource.reload(); return false } finally { setBusy(false) } }} /> : <p>Chỉ thiết kế đang chờ mới có thể được duyệt hoặc từ chối.</p>}</>}</ApiState>{notice && <p role="status" className="sc-feedback">{notice}</p>}{error && <ApiErrorMessage error={error} />}</section>
}
function ReviewLookup({ orderId }) {
  const resource = useCatalogResource(loadOrder, { orderId })
  return <section className={panelClass}><h2 className="font-bold">Đánh giá theo đơn hàng</h2><RefreshButton onClick={resource.reload} className="underline">Tải lại đánh giá</RefreshButton><ApiState resource={resource}>{resource.data && <><p className="break-all">{displayReference(resource.data.id, 'ORD', resource.data.orderNumber)}</p>{resource.data.review ? <><p>{resource.data.review.rating}/5 · {uiLabel(resource.data.review.status)}</p><p className="whitespace-pre-wrap">{resource.data.review.comment}</p><ReviewModeration key={resource.data.review.updatedAt} review={resource.data.review} onChanged={resource.reload} /></> : <p>Đơn hàng này chưa có đánh giá.</p>}</>}</ApiState></section>
}
export default function AdminModerationPage({ onNavigate, routeSearch = '' }) {
  const query = new URLSearchParams(routeSearch), initialKind = query.get('kind') === 'design' ? 'design' : 'review', initialId = query.get('id') || ''
  const [kind, setKind] = useState(initialKind), [input, setInput] = useState(initialId), [selected, setSelected] = useState(() => isCatalogId(initialId) ? { id: initialId, kind: initialKind } : null), [error, setError] = useState(null)
  return <AdminFrame activeTab="admin-moderation" onNavigate={onNavigate}><section className={panelClass}><form onSubmit={(event) => { event.preventDefault(); if (!isCatalogId(input.trim())) return setError({ status: 400, message: 'Mã tra cứu không hợp lệ. Vui lòng kiểm tra lại.' }); setError(null); setSelected({ id: input.trim().toLowerCase(), kind }) }} className="grid gap-3 sm:grid-cols-3"><label>Loại<select value={kind} onChange={(event) => setKind(event.target.value)} className={inputClass}><option value="review">Đánh giá đơn hàng</option><option value="design">Thiết kế AI</option></select></label><label>{kind === 'review' ? 'Mã đơn hàng' : 'Mã thiết kế'}<input required value={input} onChange={(event) => setInput(event.target.value)} className={inputClass} /></label><button className={buttonClass}>Xem chi tiết</button></form>{error && <ApiErrorMessage error={error} />}</section>{selected && (selected.kind === 'review' ? <ReviewLookup key={selected.id} orderId={selected.id} /> : <DesignModeration key={selected.id} id={selected.id} />)}</AdminFrame>
}

