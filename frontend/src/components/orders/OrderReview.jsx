import { uiLabel } from '../../services/uiLabels.js'
import React, { useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { orderService } from '../../services/orderService.js'
import { reviewPermissions } from '../../services/orderModels.js'
import { ApiErrorMessage, inputClass, buttonClass, panelClass } from '../management/ApiState.jsx'
export default function OrderReview({ order, onChanged }) {
  const { user } = useAuth(), permissions = reviewPermissions(order, user)
  const [rating, setRating] = useState(order.review?.rating ?? ''), [comment, setComment] = useState(order.review?.comment || ''), [busy, setBusy] = useState(false), [error, setError] = useState(null), [confirmed, setConfirmed] = useState(false)
  async function mutate(action) {
    if (busy) return
    setBusy(true); setError(null)
    try { await action(); onChanged() } catch (failure) { setError(failure); if (![400, 422].includes(failure.status)) onChanged() } finally { setBusy(false) }
  }
  return <section className={panelClass} data-modal-busy={busy}><h3 className="font-bold">Đánh giá đơn hàng</h3>
    {order.review ? <><p>{order.review.rating}/5 · {uiLabel(order.review.status)}</p>{order.review.status !== 'DELETED' && <p className="whitespace-pre-wrap">{order.review.comment || 'Không có nhận xét.'}</p>}</> : <p>Đơn hàng chưa có đánh giá.</p>}
    {(permissions.create || permissions.edit) && <form onSubmit={(event) => { event.preventDefault(); if (permissions.create || permissions.edit) void mutate(() => orderService.saveReview(order.id, { rating, comment }, !permissions.create)) }} className="space-y-3"><fieldset disabled={busy}><label>Số sao<select required value={rating} onChange={(event) => setRating(event.target.value)} className={inputClass}><option value="">Chọn số sao</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{uiLabel(value)}</option>)}</select></label><label>Nhận xét<textarea maxLength={5000} value={comment} onChange={(event) => setComment(event.target.value)} className={inputClass} /></label><button className={buttonClass}>{permissions.create ? 'Gửi đánh giá' : 'Lưu đánh giá'}</button></fieldset></form>}
    {permissions.delete && <div className="space-y-2"><label className="flex gap-2"><input type="checkbox" checked={confirmed} disabled={busy} onChange={(event) => setConfirmed(event.target.checked)} />Xác nhận xóa đánh giá; không thể tạo lại đánh giá mới cho đơn này.</label><button disabled={busy || !confirmed} onClick={() => mutate(() => orderService.deleteReview(order.id))} className="rounded-xl border px-4 py-2 disabled:opacity-40">Xóa đánh giá</button></div>}
    {!order.review && !permissions.create && <p className="text-sm">Bạn có thể đánh giá sau khi đơn hàng hoàn tất.</p>}
    {error && <ApiErrorMessage error={error} />}
  </section>
}

