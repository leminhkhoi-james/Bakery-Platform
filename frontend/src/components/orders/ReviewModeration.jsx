import React, { useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { adminManagementService } from '../../services/adminManagementService.js'
import { ApiErrorMessage, buttonClass } from '../management/ApiState.jsx'
export default function ReviewModeration({ review, onChanged }) {
  const { roles } = useAuth()
  const [busy, setBusy] = useState(false), [confirmed, setConfirmed] = useState(false), [error, setError] = useState(null)
  if (!roles.includes('ADMIN') || !review || !['PUBLISHED', 'HIDDEN'].includes(review.status)) return null
  const target = review.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED'
  return <section className="space-y-3 rounded-xl border p-4"><h3 className="font-bold">Kiểm duyệt đánh giá</h3><p>Trạng thái hiện tại: {review.status}</p><label className="flex gap-2"><input type="checkbox" disabled={busy} checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Tôi đã kiểm tra đánh giá và xác nhận chuyển sang {target}.</label><button disabled={busy || !confirmed} className={buttonClass} onClick={async () => { if (busy || !confirmed) return; setBusy(true); setError(null); try { await adminManagementService.moderateReview(review.orderId, target); setConfirmed(false); onChanged() } catch (failure) { setError(failure); onChanged() } finally { setBusy(false) } }}>{target === 'HIDDEN' ? 'Ẩn đánh giá' : 'Công khai đánh giá'}</button>{error && <ApiErrorMessage error={error} />}</section>
}

