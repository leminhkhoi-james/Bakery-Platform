import React from 'react'
import { Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { publicCopy } from '../../../services/uiLabels.js'
import { PLAN_ACTIONS, planActions, planFeatureRows, planMonthlyPrice, planName, planStatusLabel } from '../../../services/planPresentation.js'

export default function AdminPlanCard({ plan, disabled, onEdit, onAction }) {
  const features = planFeatureRows(plan.features, plan)
  return <article className="sc-admin-plan-card" aria-label={'Gói ' + planName(plan)}>
    <div className="sc-admin-plan-heading"><h2>{planName(plan)}</h2><StatusBadge status={plan.status} label={planStatusLabel(plan.status)} /></div>
    <p className="sc-admin-plan-price"><strong>{planMonthlyPrice(plan)}</strong><span>/tháng</span></p>
    <p className="sc-admin-plan-cycle">Chu kỳ thanh toán: <strong>{Number.isInteger(plan.billingPeriodMonths) && plan.billingPeriodMonths > 0 ? plan.billingPeriodMonths + ' tháng' : 'Chưa có thông tin'}</strong></p>
    {publicCopy(plan.description) && <p className="sc-admin-plan-description" title={publicCopy(plan.description)}>{publicCopy(plan.description)}</p>}
    <div className="sc-admin-plan-benefits"><h3>Quyền lợi</h3>{features.length ? <dl>{features.map((feature) => <div key={feature.code}><dt>{feature.label}</dt><dd>{feature.value}</dd></div>)}</dl> : <p className="sc-admin-plan-muted">Chưa có quyền lợi được cấu hình.</p>}</div>
    <div className="sc-admin-plan-actions">
      <button type="button" className="sc-button sc-action-button--secondary" disabled={disabled} onClick={onEdit}>Sửa gói</button>
      {planActions(plan.status).map((key) => <button key={key} type="button" disabled={disabled} className={'sc-button sc-action-button--secondary' + (key === 'archive' ? ' sc-plan-archive-action' : '')} onClick={() => onAction(key)}><Icon name={PLAN_ACTIONS[key].icon} /><span>{key === 'activate' ? 'Kích hoạt lại' : PLAN_ACTIONS[key].label}</span></button>)}
    </div>
  </article>
}
