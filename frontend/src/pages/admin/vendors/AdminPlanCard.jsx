import React, { useEffect, useId, useRef, useState } from 'react'
import { Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { publicCopy } from '../../../services/uiLabels.js'
import { PLAN_ACTIONS, planActions, planFeatureRows, planMonthlyPrice, planName, planStatusLabel } from '../../../services/planPresentation.js'

function PlanActionMenu({ plan, disabled, onAction }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null), trigger = useRef(null), menu = useRef(null), id = useId()
  useEffect(() => {
    if (!open) return
    menu.current?.querySelector('button')?.focus()
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  const close = () => { setOpen(false); trigger.current?.focus() }
  return <div ref={root} className="sc-plan-menu" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <button ref={trigger} type="button" disabled={disabled} className="sc-button sc-action-button--secondary" aria-label={'Thao tác gói ' + planName(plan)} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen((value) => !value)} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true) } }}><Icon name="more_horiz" /><span>Thao tác</span></button>
    {open && <div ref={menu} id={id} className="sc-plan-menu-items" role="menu" aria-label={'Thao tác ' + planName(plan)} onKeyDown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
      const buttons = [...menu.current.querySelectorAll('button')], index = buttons.indexOf(document.activeElement)
      const next = { ArrowDown: (index + 1) % buttons.length, ArrowUp: (index - 1 + buttons.length) % buttons.length, Home: 0, End: buttons.length - 1 }[event.key]
      if (next != null) { event.preventDefault(); buttons[next]?.focus() }
    }}>{planActions(plan.status).map((key) => <button key={key} type="button" role="menuitem" disabled={disabled} className={key === 'archive' ? 'is-danger' : undefined} onClick={() => { close(); onAction(key) }}><Icon name={PLAN_ACTIONS[key].icon} />{PLAN_ACTIONS[key].label}</button>)}</div>}
  </div>
}

export default function AdminPlanCard({ plan, disabled, onEdit, onAction }) {
  const features = planFeatureRows(plan.features)
  return <article className="sc-admin-plan-card" aria-label={'Gói ' + planName(plan)}>
    <div className="sc-admin-plan-heading"><h2>{planName(plan)}</h2><StatusBadge status={plan.status} label={planStatusLabel(plan.status)} /></div>
    <p className="sc-admin-plan-price"><strong>{planMonthlyPrice(plan)}</strong><span>/tháng</span></p>
    <p className="sc-admin-plan-cycle">Chu kỳ thanh toán: <strong>{Number.isInteger(plan.billingPeriodMonths) && plan.billingPeriodMonths > 0 ? plan.billingPeriodMonths + ' tháng' : 'Chưa có thông tin'}</strong></p>
    {publicCopy(plan.description) && <p className="sc-admin-plan-description" title={publicCopy(plan.description)}>{publicCopy(plan.description)}</p>}
    <div className="sc-admin-plan-benefits"><h3>Quyền lợi</h3>{features.length ? <dl>{features.map((feature) => <div key={feature.code}><dt>{feature.label}</dt><dd>{feature.value}</dd></div>)}</dl> : <p className="sc-admin-plan-muted">Chưa có quyền lợi được cấu hình.</p>}</div>
    <div className="sc-admin-plan-actions"><button type="button" className="sc-button sc-action-button--secondary" disabled={disabled} onClick={onEdit}><Icon name="edit" />Sửa gói</button><PlanActionMenu plan={plan} disabled={disabled} onAction={onAction} /></div>
  </article>
}
