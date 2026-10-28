import { Icon } from './WorkspaceUI.jsx'
import React, { useState } from 'react'
import { buttonClass } from '../management/ApiState.jsx'

export default function ConfirmAction({ label, description, busy, disabled, onConfirm }) {
  const [confirmed, setConfirmed] = useState(false)
  return <div className="space-y-2 rounded-xl border border-outline-variant/30 p-3"><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={busy || disabled} onChange={(event) => setConfirmed(event.target.checked)} /><span>{description || 'Xác nhận ' + label.toLowerCase()}</span></label><button type="button" className={buttonClass} disabled={busy || disabled || !confirmed} onClick={async () => { if (busy || disabled || !confirmed) return; try { await onConfirm() } finally { setConfirmed(false) } }}><Icon name={/Hủy|Rút|Xóa|Từ chối/i.test(label) ? 'cancel' : 'task_alt'} />{busy ? 'Đang xử lý…' : label}</button></div>
}
