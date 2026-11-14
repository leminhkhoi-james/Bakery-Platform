import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../common/WorkspaceUI.jsx'

export default function PortalNotificationBell({ resource, onNavigate }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const id = useId()
  const unread = resource.items.filter(item => item.unread).length

  useEffect(() => {
    if (!open) return
    const closeOutside = event => { if (!root.current?.contains(event.target)) setOpen(false) }
    const closeOnEscape = event => {
      if (event.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return <div ref={root} className="relative text-left">
    <button ref={trigger} type="button" aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
      aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-low text-primary hover:bg-primary-fixed">
      <Icon name="notifications" className="text-xl" />
      {unread > 0 && <span aria-hidden="true" className="absolute -top-1 -right-1 min-w-5 rounded-full bg-primary px-1 text-xs font-bold text-on-primary">{unread}</span>}
    </button>
    {open && <section id={id} aria-label="Danh sách thông báo"
      className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-7rem)] rounded-2xl border border-outline-variant bg-surface p-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <h2 className="text-sm font-bold text-primary">Thông báo</h2>
        {unread > 0 && <button type="button" className="text-xs font-semibold text-primary underline"
          onClick={() => resource.markRead(resource.items.map(item => item.id))}>Đánh dấu đã đọc</button>}
      </div>
      {resource.status === 'loading' && <p role="status" className="text-sm">Đang tải thông báo…</p>}
      {(resource.error || resource.data?.incomplete) && <p role="status" className="text-sm">Một số thông báo chưa tải được. <button type="button" className="underline" onClick={resource.reload}>Thử lại</button></p>}
      {resource.status === 'ready' && !resource.items.length && !resource.data?.incomplete && <p className="text-sm">Chưa có thông báo.</p>}
      <ul className="max-h-64 divide-y divide-outline-variant/30 overflow-y-auto">
        {resource.items.map(item => <li key={item.id}>
          <button type="button" className={`w-full break-words rounded-lg px-2 py-2.5 text-left text-sm text-primary hover:bg-primary-fixed ${item.unread ? 'font-bold' : ''}`}
            onClick={() => { resource.markRead([item.id]); setOpen(false); onNavigate?.(item.route) }}>
            {item.title}
            {Number.isFinite(Date.parse(item.date)) && <time dateTime={item.date} className="mt-1 block text-xs font-normal text-on-surface-variant">{new Date(item.date).toLocaleString('vi-VN')}</time>}
          </button>
        </li>)}
      </ul>
    </section>}
  </div>
}
