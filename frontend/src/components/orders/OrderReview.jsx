import { uiLabel } from '../../services/uiLabels.js'
import React, { useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { orderService } from '../../services/orderService.js'
import { reviewPermissions } from '../../services/orderModels.js'
import { ApiErrorMessage, inputClass, buttonClass, panelClass } from '../management/ApiState.jsx'
import { Icon } from '../common/WorkspaceUI.jsx'

const RATING_DESCRIPTIONS = {
  1: '1 sao · Rất tệ',
  2: '2 sao · Chưa hài lòng',
  3: '3 sao · Hài lòng / Bình thường',
  4: '4 sao · Rất tốt & Ngon miệng',
  5: '5 sao · Tuyệt vời! 🌟',
}

const SUGGESTION_CHIPS = [
  '🎂 Bánh đẹp chuẩn mẫu 100%',
  '🍰 Vị bánh thanh ngọt vừa ăn',
  '⏱️ Giao đúng giờ, cẩn thận',
  '🎁 Hộp bánh xinh xắn, lịch sự',
  '✨ Chủ tiệm tư vấn rất nhiệt tình',
]

export default function OrderReview({ order, onChanged }) {
  const { user } = useAuth()
  const permissions = reviewPermissions(order, user)
  const isOwner = Boolean(user?.roles?.includes('BAKERY_OWNER'))
  const [rating, setRating] = useState(order.review?.rating ? String(order.review.rating) : '')
  const [comment, setComment] = useState(order.review?.comment || '')
  const [hoverRating, setHoverRating] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  async function mutate(action) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await action()
      setIsEditing(false)
      setShowDelete(false)
      onChanged()
    } catch (failure) {
      setError(failure)
      if (![400, 422].includes(failure.status)) onChanged()
    } finally {
      setBusy(false)
    }
  }

  function handleAddChip(chipText) {
    setComment((prev) => {
      if (!prev || !prev.trim()) return chipText
      if (prev.includes(chipText)) return prev
      return prev.trim() + '. ' + chipText
    })
  }

  return (
    <section className={`${panelClass} sc-order-review-card space-y-4`} data-modal-busy={busy}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500 shadow-2xs">
            <Icon name="star" className="text-lg fill-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-base text-primary leading-tight">
              {isOwner ? 'Đánh giá từ khách hàng' : 'Đánh giá đơn hàng'}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {isOwner ? 'Nhận xét và mức độ hài lòng của khách đối với đơn này' : 'Chia sẻ trải nghiệm bánh và dịch vụ của tiệm'}
            </p>
          </div>
        </div>
        {order.review && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            order.review.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            order.review.status === 'PENDING' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
            order.review.status === 'HIDDEN' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {uiLabel(order.review.status)}
          </span>
        )}
      </div>

      {order.review ? (
        <div className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/60 via-white to-rose-50/30 p-4 space-y-3 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${star <= order.review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm font-bold text-gray-800">
                {order.review.rating}/5 · {uiLabel(order.review.status)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {permissions.edit && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing((prev) => !prev)
                    if (showDelete) setShowDelete(false)
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all shadow-2xs cursor-pointer"
                >
                  <Icon name={isEditing ? 'close' : 'edit'} className="text-sm" />
                  {isEditing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa đánh giá'}
                </button>
              )}
              {permissions.delete && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDelete((prev) => !prev)
                    if (isEditing) setIsEditing(false)
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-all shadow-2xs cursor-pointer"
                >
                  <Icon name={showDelete ? 'close' : 'delete'} className="text-sm" />
                  Xóa đánh giá
                </button>
              )}
            </div>
          </div>

          {order.review.status !== 'DELETED' && (
            <div className="bg-white/90 rounded-lg p-3 border border-amber-100 shadow-2xs">
              <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-normal">
                {order.review.comment || 'Không có nhận xét.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Đơn hàng chưa có đánh giá.</p>
      )}

      {(permissions.create || permissions.edit) && (
        <div className={!permissions.create && !isEditing ? 'hidden' : 'rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-4 shadow-2xs'}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (permissions.create || permissions.edit) {
                void mutate(() => orderService.saveReview(order.id, { rating, comment }, !permissions.create))
              }
            }}
            className="space-y-4"
          >
            <fieldset disabled={busy} className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Icon name={permissions.create ? 'rate_review' : 'edit_note'} className="text-sm text-primary" />
                  {permissions.create ? 'Viết đánh giá của bạn' : 'Chỉnh sửa đánh giá'}
                </h4>
                <span className="text-xs text-gray-400">Đánh giá chỉ công khai sau khi quản trị viên duyệt</span>
              </div>

              {/* Interactive Star Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Số sao <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs" role="radiogroup" aria-label="Chọn số sao">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const current = Number(hoverRating || rating || 0)
                      const isFilled = value <= current
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(String(value))}
                          onMouseEnter={() => setHoverRating(value)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 hover:scale-120 transition-transform cursor-pointer focus:outline-none"
                          aria-label={`${value} sao`}
                        >
                          <svg
                            className={`w-6 h-6 transition-colors ${
                              isFilled
                                ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                : 'text-gray-300 fill-gray-100 hover:text-amber-300'
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      )
                    })}
                  </div>

                  <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg">
                    {RATING_DESCRIPTIONS[hoverRating || rating] || 'Chạm vào sao để đánh giá'}
                  </span>

                  <select
                    required
                    value={rating}
                    onChange={(event) => setRating(event.target.value)}
                    className="sr-only"
                    tabIndex={-1}
                    aria-label="Số sao"
                  >
                    <option value="">Chọn số sao</option>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <option key={value} value={value}>{uiLabel(value)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick recommendation chips */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-500 font-medium">Gợi ý nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleAddChip(chip)}
                      className="text-xs bg-white hover:bg-rose-50 text-gray-700 hover:text-primary border border-gray-200 hover:border-rose-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">Nhận xét</label>
                  <span className="text-[11px] text-gray-400 font-normal">{comment.length} / 5000 ký tự</span>
                </div>
                <textarea
                  maxLength={5000}
                  rows={3}
                  value={comment}
                  placeholder="Chia sẻ trải nghiệm của bạn về độ ngon, hình thức và dịch vụ giao bánh..."
                  onChange={(event) => setComment(event.target.value)}
                  className={`${inputClass} !min-h-[85px] leading-relaxed resize-y bg-white`}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={busy || !rating}
                  className={`${buttonClass} !py-2.5 !px-5 inline-flex items-center gap-2 font-bold shadow-xs cursor-pointer disabled:opacity-50`}
                >
                  <Icon name={permissions.create ? 'send' : 'save'} className="text-base" />
                  {permissions.create ? 'Gửi đánh giá' : 'Lưu đánh giá'}
                </button>
                {!permissions.create && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setRating(order.review?.rating ? String(order.review.rating) : '')
                      setComment(order.review?.comment || '')
                      setIsEditing(false)
                    }}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        </div>
      )}

      {permissions.delete && (
        <div className={showDelete ? 'rounded-xl border border-rose-200/80 bg-rose-50/50 p-3.5 space-y-2.5' : 'hidden'}>
          <div className="flex items-center gap-1.5 text-rose-800">
            <Icon name="warning" className="text-rose-600 text-base" />
            <span className="text-xs font-bold uppercase tracking-wider">Xác nhận xóa đánh giá</span>
          </div>
          <label className="flex items-start gap-2.5 text-xs text-rose-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={busy}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
            />
            <span>Xác nhận xóa đánh giá; không thể tạo lại đánh giá mới cho đơn này.</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              disabled={busy || !confirmed}
              onClick={() => mutate(() => orderService.deleteReview(order.id))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:text-rose-900 transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Icon name="delete" className="text-sm" />
              Xóa đánh giá
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowDelete(false)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {!order.review && !permissions.create && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
          <Icon name="info" className="text-sm text-gray-500 shrink-0" />
          <p className="text-sm">
            {isOwner ? 'Khách hàng chưa để lại đánh giá cho đơn này.' : 'Bạn có thể đánh giá sau khi đơn hàng hoàn tất.'}
          </p>
        </div>
      )}

      {error && <ApiErrorMessage error={error} />}
    </section>
  )
}
