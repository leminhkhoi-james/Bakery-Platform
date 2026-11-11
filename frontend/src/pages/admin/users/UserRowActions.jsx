import React, { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { userName } from '../../../services/adminUserService.js'
import RecordActionButton from '../../../components/common/RecordActionButton.jsx'

function ActionIcon({ name }) {
  const paths = {
    edit: 'M16 3l5 5-12 12H4v-5L16 3zM14 5l5 5',
    manage_accounts: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M13 7a4 4 0 11-8 0 4 4 0 018 0M20 8v6M17 11h6',
    lock: 'M6 10V7a6 6 0 0112 0v3M4 10h16v12H4zM12 14v4',
    lock_open: 'M6 10V7a6 6 0 0111-3M4 10h16v12H4zM12 14v4',
    delete: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    pause_circle: 'M9 8v8M15 8v8',
    play_circle: 'M10 8l6 4-6 4z',
  }
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {name === 'more_horiz' ? <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></> : <path d={paths[name]} />}
    {['pause_circle', 'play_circle'].includes(name) && <circle cx="12" cy="12" r="10" />}
  </svg>
}

export default function UserRowActions({ person, disabled, edit, roles, status, remove }) {
  const popup = useRef(null)
  const id = useId()
  const primary = roles
  const secondary = [edit !== primary && edit, roles !== primary && roles, status, remove].filter(Boolean)
  const choose = action => { popup.current?.hidePopover(); action.onClick() }
  return <div className="sc-user-row-actions">
    {primary && <button type="button" className="sc-button sc-user-primary-action" disabled={disabled || Boolean(primary.reason)} title={primary.reason || undefined} onClick={primary.onClick}>
      <ActionIcon name={primary.icon} />{primary.label}
    </button>}
    {secondary.length > 0 && <>
      <button type="button" className="sc-button sc-user-more-action" disabled={disabled} aria-label={'Thao tác khác với ' + userName(person)} popoverTarget={id} onClick={event => {
        const rect = event.currentTarget.getBoundingClientRect()
        const element = popup.current
        element.style.left = Math.max(8, Math.min(rect.right - 280, window.innerWidth - 288)) + 'px'
        element.style.top = (rect.bottom + 8) + 'px'
        requestAnimationFrame(() => {
          const height = element.getBoundingClientRect().height
          if (rect.bottom + 8 + height > window.innerHeight - 8) element.style.top = Math.max(8, rect.top - height - 8) + 'px'
        })
      }}><ActionIcon name="more_horiz" /></button>
      {createPortal(<div ref={popup} id={id} popover="auto" className="sc-user-actions-popover" aria-label={'Thao tác với ' + userName(person)}>
        <p className="sc-user-actions-person">{userName(person)}</p>
        {secondary.map(action => <div key={action.label} className={action.danger ? 'sc-user-action-danger' : ''}>
          {['edit', 'delete'].includes(action.icon) ? <RecordActionButton type="button" action={action.icon} label={action.label} disabled={disabled || Boolean(action.reason)} title={action.reason || action.label} onClick={() => choose(action)} /> : <button type="button" disabled={disabled || Boolean(action.reason)} onClick={() => choose(action)}>
            <ActionIcon name={action.icon} /><span>{action.label}</span>
          </button>}
          {action.reason && <small>{action.reason}</small>}
        </div>)}
      </div>, document.body)}
    </>}
  </div>
}
