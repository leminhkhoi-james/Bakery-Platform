import React, { useEffect, useId, useRef } from 'react'
import { uiLabel, cleanPresentationLabel } from '../../services/uiLabels.js'

export function Icon({ name, className = '' }) {
  return <span aria-hidden="true" className={'material-symbols-outlined sc-icon ' + className}>{name}</span>
}

export function SectionHeading({ title, description, action, icon }) {
  return <div className="sc-section-heading"><div className="min-w-0">{icon && <Icon name={icon} />}<h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <div className="sc-actions">{action}</div>}</div>
}

const tones = {
  ACTIVE: 'green', PUBLISHED: 'green', APPROVED: 'green', COMPLETED: 'green',
  PENDING: 'amber', PENDING_APPROVAL: 'amber', SUBMITTED: 'amber', PAYMENT_REVIEW: 'amber',
  CONFIRMED: 'blue', BAKING: 'amber', READY: 'blue', DELIVERING: 'blue', SCHEDULED: 'blue',
  REJECTED: 'red', CANCELLED: 'red', CLOSED: 'red', SUSPENDED: 'red', EXPIRED: 'red',
}
export function StatusBadge({ status, label }) {
  return <span className={'sc-status sc-status--' + (tones[status] || 'neutral')}><span aria-hidden="true" />{label || uiLabel(status, 'Chưa có trạng thái')}</span>
}

export function DataTable({ label, children }) {
  return <div className="sc-table-wrap" role="region" aria-label={label} tabIndex={0}><table className="sc-table"><caption className="sr-only">{label}</caption>{children}</table></div>
}

export function EmptyPanel({ title, description, icon = 'inbox', action }) {
  return <div className="sc-empty" role="status"><span className="sc-empty-icon"><Icon name={icon} /></span><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>
}

// Native dialog provides focus containment, Escape and focus restoration.
// Used only as a presentation wrapper; mutations remain in the existing children.
export function DetailDrawer({ title, onClose, busy = false, children, headerContent, className = '' }) {
  const dialog = useRef(null), heading = useId()
  useEffect(() => {
    const element = dialog.current
    const overflow = document.body.style.overflow
    const previousFocus = document.activeElement
    element.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = overflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])
  return <dialog ref={dialog} aria-labelledby={heading} className={'sc-drawer' + (className ? ' ' + className : '')} onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <header className="sc-drawer-heading"><div id={headerContent ? heading : undefined}>{headerContent || <><p className="sc-kicker">SweetCake · Chi tiết</p><h2 id={heading}>{title}</h2></>}</div><button type="button" disabled={busy} onClick={onClose} className="sc-icon-button" aria-label="Đóng bảng chi tiết"><Icon name="close" /></button></header>
    <div className="sc-drawer-body">{children}</div>
  </dialog>
}

export function PortalHeader({ title, user, portal, onMenu, description, showPortalLabel = true, action }) {
  const name = cleanPresentationLabel(user?.displayName || user?.email || portal)
  const identity = <div className="sc-identity" aria-label={'Tài khoản ' + name}><span className="sc-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span><div className="hidden min-w-0 sm:block"><strong className="block truncate">{name}</strong><span>{portal}</span></div></div>
  return <><a href="#workspace-content" className="sc-skip">Đến nội dung chính</a><header className="sc-portal-header">
    <div className="sc-portal-heading flex min-w-0 items-center gap-3"><button type="button" onClick={onMenu} className="sc-icon-button sc-menu-button md:hidden" aria-label="Mở menu"><Icon name="menu" /></button><div className="min-w-0">{showPortalLabel && <p className="sc-kicker">SweetCake / {portal}</p>}<h1 className="truncate">{title}</h1>{description && <p className="sc-portal-description">{description}</p>}</div></div>
    {action ? <div className="sc-portal-header-tools"><div className="sc-admin-header-action">{action}</div>{identity}</div> : identity}
  </header></>
}
