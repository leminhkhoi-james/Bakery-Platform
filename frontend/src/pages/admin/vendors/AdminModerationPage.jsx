import React, { useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { isCatalogId } from '../../../services/catalogModels.js'
import { loadOrder } from '../../../services/orderService.js'
import { aiService } from '../../../services/aiService.js'
import { adminManagementService } from '../../../services/adminManagementService.js'
import ReviewModeration from '../../../components/orders/ReviewModeration.jsx'
import { SectionHeading, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from '../../../components/management/ApiState.jsx'
const loadModerationDesign = ({ id }, options) => aiService.getDesign(id, options)
export function DesignModeration({ id }) {
  const { roles } = useAuth(), resource = useCatalogResource(loadModerationDesign, { id })
  const [status, setStatus] = useState(''), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(null)
  const design = resource.data
  return <section className={panelClass}><h2 className="font-bold">Kiểm duyệt thiết kế</h2><button onClick={resource.reload} className="underline" disabled={busy}>Tải lại thiết kế</button><ApiState resource={resource}>{design && <><div className="flex flex-wrap items-center gap-3"><p className="break-all text-xs">{design.id}</p><StatusBadge status={design.moderationStatus} /></div><p>Job: {design.generationJobId} · {design.moderationReason}</p>{design.imageUrl && /^https?:\/\//i.test(design.imageUrl) ? <a href={design.imageUrl} target="_blank" rel="noreferrer" className="underline">Xem ảnh backend</a> : <p>Backend chưa cung cấp URL preview cho thiết kế này. Chỉ xác nhận nếu đã kiểm duyệt nguồn hợp lệ; không dùng ảnh mẫu.</p>}
    {design.moderationStatus === 'PENDING' && roles.includes('ADMIN') ? <form onSubmit={async (event) => { event.preventDefault(); if (busy || !confirmed || !status) return; setBusy(true); setError(null); try { await adminManagementService.moderateDesign(id, status); setStatus(''); setConfirmed(false); resource.reload() } catch (failure) { setError(failure); resource.reload() } finally { setBusy(false) } }} className="space-y-3"><fieldset disabled={busy}><label>Kết quả<select required value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option value="">Chọn kết quả</option><option>APPROVED</option><option>REJECTED</option></select></label><label className="flex gap-2"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Tôi đã kiểm tra đúng thiết kế và xác nhận kết quả.</label><button disabled={!confirmed || !status} className={buttonClass}>Xác nhận kiểm duyệt thiết kế</button></fieldset></form> : <p>Không có thao tác: chỉ thiết kế PENDING được duyệt/từ chối.</p>}</>}</ApiState>{error && <ApiErrorMessage error={error} />}</section>
}
function ReviewLookup({ orderId }) {
  const resource = useCatalogResource(loadOrder, { orderId })
  return <section className={panelClass}><h2 className="font-bold">Đánh giá theo đơn hàng</h2><button onClick={resource.reload} className="underline">Tải lại đánh giá</button><ApiState resource={resource}>{resource.data && <><p className="break-all">{resource.data.orderNumber || resource.data.id}</p>{resource.data.review ? <><p>{resource.data.review.rating}/5 · {resource.data.review.status}</p><p className="whitespace-pre-wrap">{resource.data.review.comment}</p><ReviewModeration key={resource.data.review.updatedAt} review={resource.data.review} onChanged={resource.reload} /></> : <p>Backend chưa có đánh giá cho đơn này.</p>}</>}</ApiState></section>
}
export default function AdminModerationPage({ onNavigate }) {
  const [kind, setKind] = useState('review'), [input, setInput] = useState(''), [selected, setSelected] = useState(null), [error, setError] = useState(null)
  return <AdminFrame title="Kiểm duyệt theo ID" activeTab="admin-moderation" onNavigate={onNavigate}><section className={panelClass}><SectionHeading title="Tra cứu & kiểm duyệt" description="Review đơn hàng và thiết kế AI theo ID hợp lệ." icon="fact_check" /><p className="sc-note">Backend chưa có danh sách chờ duyệt. Nhập Order ID hoặc Design ID thật để đọc và thao tác theo quyền.</p><form onSubmit={(event) => { event.preventDefault(); if (!isCatalogId(input.trim())) return setError({ status: 400, message: 'Nhập UUID hợp lệ từ backend.' }); setError(null); setSelected({ id: input.trim().toLowerCase(), kind }) }} className="grid gap-3 sm:grid-cols-3"><label>Loại<select value={kind} onChange={(event) => setKind(event.target.value)} className={inputClass}><option value="review">Review đơn hàng</option><option value="design">AI Design</option></select></label><label>{kind === 'review' ? 'Order ID' : 'Design ID'}<input required value={input} onChange={(event) => setInput(event.target.value)} className={inputClass} /></label><button className={buttonClass}>Đọc dữ liệu backend</button></form>{error && <ApiErrorMessage error={error} />}</section>{selected && (selected.kind === 'review' ? <ReviewLookup key={selected.id} orderId={selected.id} /> : <DesignModeration key={selected.id} id={selected.id} />)}</AdminFrame>
}

