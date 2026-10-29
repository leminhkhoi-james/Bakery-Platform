import React from 'react'
import { DetailDrawer, Icon } from '../../../components/common/WorkspaceUI.jsx'
import { ApiErrorMessage } from '../../../components/management/ApiState.jsx'
import { PLAN_ACTIONS, planName, planFeedbackError } from '../../../services/planPresentation.js'

export default function AdminPlanActionDialog({ plan, action, busy, stale, unavailable, error, onClose, onConfirm }) {
  const item = PLAN_ACTIONS[action]
  const footer = <div className="sc-action-row"><button type="button" className="sc-button sc-action-button--secondary" disabled={busy} data-modal-close onClick={onClose}>Hủy</button><button type="button" className="sc-button sc-action-button--primary" disabled={busy || stale || unavailable} onClick={onConfirm}><Icon name={item.icon} />{busy ? 'Đang xử lý…' : item.label}</button></div>
  return <DetailDrawer title={item.label} headerContent={<h2>{item.label}</h2>} className="sc-plan-action-dialog" footer={footer} busy={busy} onClose={onClose}>
    <p className="sc-plan-action-name">{planName(plan)}</p><p>{item.message}</p>
    {stale && <p role="alert" className="sc-note">Trạng thái gói đã thay đổi. Vui lòng đóng cửa sổ và kiểm tra lại.</p>}
    {unavailable && !busy && <p role="status" className="sc-note">Chưa thể xác nhận trạng thái hiện tại. Vui lòng chờ tải lại thông tin gói.</p>}
    {error && <ApiErrorMessage error={planFeedbackError(error)} />}
  </DetailDrawer>
}
