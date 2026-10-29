import React, { useRef, useState } from 'react'
import { Icon, StatusBadge } from './WorkspaceUI.jsx'
import { uiLabel } from '../../services/uiLabels.js'

export function ChoiceButtons({ label, value, options, onChange, disabled = false }) {
  return <fieldset className="sc-choice-field" disabled={disabled}><legend>{label}</legend><div className="sc-action-row">{options.map((option) => {
    const item = typeof option === 'string' ? { value: option, label: uiLabel(option) } : option
    return <button key={item.value} type="button" aria-pressed={value === item.value} className={'sc-button sc-choice-button' + (value === item.value ? ' is-selected' : '')} onClick={() => onChange(item.value)}><Icon name={value === item.value ? 'radio_button_checked' : 'radio_button_unchecked'} />{item.label}</button>
  })}</div></fieldset>
}

export default function EntityActionButtons({ status, actions, busy = false, refreshing = false, onConfirm, title = 'Thao tác', showHeading = true, showDisabledReasons = true, compactConfirmation = false }) {
  const [pending, setPending] = useState(null), [acknowledged, setAcknowledged] = useState(false), [running, setRunning] = useState(false), [failure, setFailure] = useState('')
  const [reason, setReason] = useState('')
  const inFlight = useRef(false)
  const locked = busy || refreshing || running
  const current = pending && actions.find((action) => action.key === pending.key)
  const stale = pending && (pending.status !== status || !current || current.disabled)
  async function confirm() {
    if (locked || inFlight.current || stale || !current || current.confirmText && !acknowledged || current.reasonRequired && !reason.trim()) return
    inFlight.current = true; setRunning(true); setFailure('')
    try {
      if (await onConfirm(current.key, reason.trim()) !== false) { setPending(null); setAcknowledged(false); setReason('') }
    } catch { setFailure('Chưa thể hoàn tất thao tác. Vui lòng tải lại và thử tiếp.') }
    finally { inFlight.current = false; setRunning(false) }
  }
  return <section className="sc-entity-actions" aria-label={title} aria-busy={locked}>
    {showHeading && <div className="sc-action-heading"><h3>{title}</h3>{status && <div className="sc-current-status"><span>Hiện tại:</span><StatusBadge status={status} /></div>}</div>}
    {!pending ? <div className="sc-action-row">{actions.map((action) => <button key={action.key} type="button" disabled={locked || action.disabled} title={action.disabled ? action.disabledReason : undefined} className={'sc-button sc-action-button sc-action-button--' + (action.tone || 'primary')} onClick={() => { setPending({ key: action.key, status }); setAcknowledged(false); setReason(''); setFailure('') }}><Icon name={action.icon || 'task_alt'} />{action.label}</button>)}{!actions.length && <p>Không còn thao tác phù hợp với trạng thái này.</p>}</div> : <div className="sc-action-confirm" role="group" aria-label="Xác nhận thao tác">
      <h4>{current?.label || 'Xác nhận thao tác'}?</h4>{!(compactConfirmation && current?.reasonRequired) && <p>{current?.description || 'Vui lòng kiểm tra thông tin trước khi xác nhận.'}</p>}
      {stale && <p role="alert">Trạng thái hoặc quyền thao tác đã thay đổi. Vui lòng quay lại và chọn lại.</p>}
      {current?.reasonLabel && <label className="sc-action-reason">{current.reasonLabel}<textarea value={reason} disabled={locked} required={current.reasonRequired} maxLength={1000} rows={3} className="sc-input" onChange={(event) => setReason(event.target.value)} />{current.reasonHelp && <small>{current.reasonHelp}</small>}</label>}
      {current?.confirmText && <label className="sc-action-acknowledgement"><input type="checkbox" disabled={locked} checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />{current.confirmText}</label>}
      {compactConfirmation && current?.reasonRequired && !reason.trim() && <p className="sc-action-required-hint" role="status">Nhập lý do trả hồ sơ để xác nhận.</p>}
      <div className="sc-action-row"><button type="button" title={compactConfirmation && current?.reasonRequired && !reason.trim() ? 'Nhập lý do trả hồ sơ để xác nhận.' : undefined} className={'sc-button sc-action-button sc-action-button--' + (current?.tone || 'primary')} disabled={locked || !!stale || !!current?.confirmText && !acknowledged || !!current?.reasonRequired && !reason.trim()} onClick={confirm}>{locked ? 'Đang xử lý…' : 'Xác nhận ' + (current?.label || 'thao tác').toLocaleLowerCase('vi')}</button><button type="button" className="sc-button sc-action-button sc-action-button--secondary" disabled={locked} onClick={() => { setPending(null); setReason(''); setFailure('') }}>Quay lại</button></div>
      {failure && <p role="alert">{failure}</p>}
    </div>}
    {showDisabledReasons && !pending && actions.some((action) => action.disabled && action.disabledReason) && <p className="sc-note">{[...new Set(actions.filter((action) => action.disabled).map((action) => action.disabledReason).filter(Boolean))].join(' ')}</p>}
  </section>
}
