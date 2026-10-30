import React, { useEffect, useRef, useState } from 'react'
import ModalSurface from './ModalSurface.jsx'
import { Icon } from './WorkspaceUI.jsx'
import './vendor-ui.css'

export function VendorImage({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(null)
  return src && failed !== src ? <img className={'sc-vendor-image ' + className} src={src} alt={alt} loading="lazy" onError={() => setFailed(src)} /> : <div className={'sc-vendor-image sc-vendor-image-empty ' + className} role="img" aria-label="Chưa có hình ảnh"><Icon name="cake" /></div>
}
export function VendorConfirm({ title, children, label = 'Xác nhận', busy, error, onClose, onConfirm, danger = false, disabled = false, guardChanges = false }) {
  const lock = useRef(false)
  return <ModalSurface label={title} className="sc-vendor-confirm" guardChanges={guardChanges} busy={busy} onClose={onClose}>{({ requestClose }) => <><header><h2>{title}</h2><button className="sc-icon-button" type="button" disabled={busy} onClick={requestClose} aria-label="Đóng xác nhận"><Icon name="close" /></button></header><div className="sc-vendor-confirm-body">{children}{error}</div><footer><button type="button" className="sc-button sc-action-button--secondary" disabled={busy} onClick={requestClose}>Hủy</button><button type="button" className={'sc-button' + (danger ? ' sc-action-button--danger' : '')} disabled={busy || disabled} onClick={async () => { if (lock.current || busy || disabled) return; lock.current = true; try { await onConfirm() } finally { lock.current = false } }}>{busy ? 'Đang xử lý…' : label}</button></footer></>}</ModalSurface>
}
export function VendorActionMenu({ actions, busy = false, onConfirm, error }) {
  const menu = useRef(null), [pending, setPending] = useState(null), [running, setRunning] = useState(false), [position, setPosition] = useState({})
  useEffect(() => {
    const close = (event) => { if (event.key === 'Escape' || event.type === 'pointerdown' && !menu.current?.contains(event.target)) menu.current?.removeAttribute('open') }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close) }
  }, [])
  if (!actions.length) return null
  return <><details ref={menu} className="sc-vendor-action-menu"><summary aria-label="Thao tác khác" onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); setPosition({ position: 'fixed', left: Math.max(8, Math.min(rect.right - 208, window.innerWidth - 216)), top: Math.max(8, rect.top - actions.length * 48 - 14), right: 'auto', bottom: 'auto', width: 208, zIndex: 50 }) }}><Icon name="more_horiz" /></summary><div style={position}>{actions.map(action => <button type="button" className="sc-button sc-action-button--secondary" key={action.key} disabled={busy || running || action.disabled} title={action.disabledReason} onClick={() => { menu.current.removeAttribute('open'); if (action.direct) onConfirm(action.key); else setPending(action) }}><Icon name={action.icon || 'edit'} />{action.label}</button>)}</div></details>{pending && <VendorConfirm title={pending.label} label={pending.label} disabled={!actions.some(action => action.key === pending.key && !action.disabled)} error={error} danger={pending.tone === 'danger'} busy={busy || running} onClose={() => setPending(null)} onConfirm={async () => { if (!actions.some(action => action.key === pending.key && !action.disabled)) return; setRunning(true); try { if (await onConfirm(pending.key) !== false) setPending(null) } finally { setRunning(false) } }}><p>{pending.description || 'Xác nhận thực hiện thao tác với mục đã chọn?'}</p></VendorConfirm>}</>
}
