import React, { useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { cleanPresentationLabel } from '../../services/uiLabels.js'
import './portal-account-menu.css'

export default function PortalAccountMenu({ user, roleLabel, onNavigate }) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const root = useRef(null), trigger = useRef(null), item = useRef(null), inFlight = useRef(false)
  const menuId = useId()
  const name = cleanPresentationLabel(user?.displayName || user?.fullName || user?.name || user?.email, 'Tài khoản')
  useEffect(() => {
    if (!open) return
    item.current?.focus()
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false) }
    const escape = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus()
    }
    document.addEventListener('pointerdown', outside, true)
    root.current?.addEventListener('keydown', escape)
    const element = root.current
    return () => { document.removeEventListener('pointerdown', outside, true); element?.removeEventListener('keydown', escape) }
  }, [open])
  const signOut = async () => {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setOpen(false)
    try { await logout() }
    catch { /* Existing logout flow signs out locally and retains pending server revocation. */ }
    finally { onNavigate('login', null, { replace: true }) }
  }
  return <div ref={root} className="sc-account-menu" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }}>
    <button ref={trigger} type="button" className="sc-identity sc-account-trigger" aria-label={'Tài khoản ' + name} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} disabled={busy} onClick={() => setOpen((value) => !value)} onKeyDown={(event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true) }
    }}><span className="sc-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span><div className="sc-account-trigger-copy"><strong>{name}</strong><span>{roleLabel}</span></div><span className="material-symbols-outlined sc-account-chevron" aria-hidden="true">expand_more</span></button>
    {open && <div id={menuId} className="sc-account-dropdown" role="menu" aria-label="Tài khoản đang đăng nhập"><div className="sc-account-summary" role="presentation"><strong>{name}</strong><span>{roleLabel}</span></div><button ref={item} type="button" role="menuitem" disabled={busy} onClick={signOut}><span className="material-symbols-outlined" aria-hidden="true">logout</span>Đăng xuất</button></div>}
  </div>
}
