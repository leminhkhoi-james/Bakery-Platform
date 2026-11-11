import React, { useState, useRef, useEffect, useId } from 'react'
import { moneyVnd } from '../../services/marketplaceModels.js'
import { Icon } from '../common/WorkspaceUI.jsx'

export default function VendorNotificationBell({ openRfqs = [], onNavigate, bakeryId }) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('sweetcake_dismissed_rfqs') || '[]')
    } catch {
      return []
    }
  })
  const rootRef = useRef(null)
  const menuId = useId()

  const activeRfqs = openRfqs.filter((r) => !dismissed.includes(r.id))
  const unreadCount = activeRfqs.length

  useEffect(() => {
    if (!open) return
    const handleOutside = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handleOutside, true)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleOutside, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handleOpenRfq = (rfqId) => {
    setOpen(false)
    const nextDismissed = [...new Set([...dismissed, rfqId])]
    setDismissed(nextDismissed)
    try {
      sessionStorage.setItem('sweetcake_dismissed_rfqs', JSON.stringify(nextDismissed))
    } catch {}
    if (onNavigate) {
      onNavigate(`vendor-quote-submit?cakeRequestId=${rfqId}${bakeryId ? '&bakeryId=' + bakeryId : ''}`)
    }
  }

  const handleMarkAllRead = () => {
    const allIds = openRfqs.map((r) => r.id)
    setDismissed(allIds)
    try {
      sessionStorage.setItem('sweetcake_dismissed_rfqs', JSON.stringify(allIds))
    } catch {}
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface hover:text-primary hover:border-primary/40 hover:bg-surface-container transition-all cursor-pointer shadow-2xs"
        aria-label={`Thông báo yêu cầu đặt bánh (${unreadCount} mới)`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="notifications" className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10.5px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="dialog"
          aria-label="Danh sách thông báo yêu cầu đặt bánh"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-outline-variant/30 bg-surface p-4 shadow-xl z-50 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <Icon name="campaign" className="text-base" />
              </span>
              <h3 className="font-bold text-sm text-on-surface">Yêu cầu đặt bánh mới</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-outline hover:text-primary cursor-pointer hover:underline"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
            {openRfqs.length > 0 ? (
              openRfqs.slice(0, 6).map((rfq) => {
                const isNew = !dismissed.includes(rfq.id)
                return (
                  <div
                    key={rfq.id}
                    onClick={() => handleOpenRfq(rfq.id)}
                    className={`group relative rounded-xl border p-3 transition-all cursor-pointer ${
                      isNew
                        ? 'border-rose-200 bg-rose-50/60 hover:bg-rose-50'
                        : 'border-outline-variant/20 bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-primary group-hover:underline line-clamp-1">
                        {rfq.title || 'Yêu cầu làm bánh mới'}
                      </h4>
                      {isNew && (
                        <span className="shrink-0 rounded-full bg-rose-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                          Mới
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-serif text-xs font-bold text-rose-900">
                      {moneyVnd(rfq.budgetMin)} — {moneyVnd(rfq.budgetMax)}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="truncate">
                        <Icon name="location_on" className="text-xs align-middle" />{' '}
                        {rfq.deliveryDistrict || 'TP. Hồ Chí Minh'}
                      </span>
                      <span className="font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                        Báo giá ngay <Icon name="arrow_forward" className="text-xs" />
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-6 text-center text-xs text-outline">
                <Icon name="check_circle" className="text-2xl text-emerald-600 mb-1 block mx-auto" />
                Hiện không có yêu cầu nào đang chờ báo giá.
              </div>
            )}
          </div>

          {openRfqs.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-outline-variant/20 text-center">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  if (onNavigate) onNavigate('vendor-rfq' + (bakeryId ? '?bakeryId=' + bakeryId : ''))
                }}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Xem tất cả {openRfqs.length} yêu cầu trên sàn →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

