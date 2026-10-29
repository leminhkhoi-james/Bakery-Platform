import React, { useRef, useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import { EmptyPanel, Icon } from '../../../components/common/WorkspaceUI.jsx'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { useAuth } from '../../../context/useAuth.js'
import { adminManagementService, loadAdminPlans } from '../../../services/adminManagementService.js'
import { ApiState, ApiErrorMessage, panelClass } from '../../../components/management/ApiState.jsx'
import { PLAN_ACTIONS, planActions, planFeedbackError } from '../../../services/planPresentation.js'
import { AdminPlanForm } from './AdminPlanForm.jsx'
import AdminPlanCard from './AdminPlanCard.jsx'
import AdminPlanActionDialog from './AdminPlanActionDialog.jsx'
import './admin-plans.css'

export { AdminPlanForm }
export default function AdminPlansPage({ onNavigate }) {
  const { roles } = useAuth(), resource = useCatalogResource(loadAdminPlans)
  const [selected, setSelected] = useState(null), [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState('')
  const [confirmation, setConfirmation] = useState(null), [confirmed, setConfirmed] = useState(null)
  const inFlight = useRef(false)
  const canManage = roles.includes('ADMIN'), locked = busy || resource.refreshing
  let plans = resource.data
  if (confirmed && confirmed.previous === resource.data) {
    plans = (resource.data || []).some((plan) => plan.id === confirmed.plan.id)
      ? resource.data.map((plan) => plan.id === confirmed.plan.id ? confirmed.plan : plan)
      : [...(resource.data || []), confirmed.plan]
  }
  const currentPlan = confirmation && plans?.find((plan) => plan.id === confirmation.plan.id)
  const unavailable = resource.status !== 'ready' || Boolean(resource.refreshing)
  const stale = !!confirmation && !unavailable && (!currentPlan || currentPlan.status !== confirmation.plan.status || !planActions(currentPlan.status).includes(confirmation.action))
  async function mutate(action, message = 'Đã lưu gói dịch vụ.') {
    if (inFlight.current || busy || !canManage) return false
    inFlight.current = true; setBusy(true); setError(null); setNotice('')
    try {
      const plan = await action()
      setConfirmed({ previous: resource.data, plan })
      setSelected(null); setAdding(false); setConfirmation(null); setNotice(message); resource.reload()
      return true
    } catch (failure) { setError(failure); if (![400, 422].includes(failure.status)) resource.reload(); return false }
    finally { inFlight.current = false; setBusy(false) }
  }
  function chooseAction(plan, action) {
    if (locked || !canManage || !planActions(plan.status).includes(action)) return
    setError(null); setNotice(''); setConfirmation({ plan, action })
  }
  return <AdminFrame activeTab="admin-plans" onNavigate={onNavigate}>
    <section className={panelClass + ' sc-admin-plans'}>
      <div className="sc-admin-plans-toolbar"><p>{plans ? plans.length + ' gói dịch vụ' : 'Danh mục gói dịch vụ'}</p><div><RefreshButton disabled={locked} onClick={resource.reload}>Tải lại</RefreshButton><button type="button" disabled={busy || !canManage} className="sc-button" onClick={() => { setError(null); setNotice(''); setAdding(true); setSelected(null) }}><Icon name="add" />Tạo gói mới</button></div></div>
      <ApiState resource={resource}>{plans && (plans.length ? <div className="sc-admin-plans-grid">{plans.map((plan) => <AdminPlanCard key={plan.id} plan={plan} disabled={locked || !canManage} onEdit={() => { if (!locked && canManage) { setError(null); setNotice(''); setSelected(plan); setAdding(false) } }} onAction={(action) => chooseAction(plan, action)} />)}</div> : <EmptyPanel title="Chưa có gói dịch vụ." description="Tạo gói mới để cấu hình quyền lợi cho tiệm bánh." icon="layers" />)}</ApiState>
      {error && !adding && !selected && !confirmation && <ApiErrorMessage error={planFeedbackError(error)} />}
      {notice && <p role="status" className="sc-feedback">{notice}</p>}
    </section>
    {(adding || selected) && canManage && <AdminPlanForm key={selected?.id || 'new'} plan={selected} busy={busy} error={error} onClose={() => { setAdding(false); setSelected(null); setError(null) }} onSave={(input) => mutate(() => adminManagementService.savePlan(selected?.id, input))} />}
    {confirmation && canManage && <AdminPlanActionDialog plan={confirmation.plan} action={confirmation.action} busy={busy} stale={stale} unavailable={unavailable} error={error} onClose={() => { setConfirmation(null); setError(null) }} onConfirm={() => {
      if (stale || unavailable || locked || !currentPlan) return false
      const { action } = confirmation
      return mutate(() => action === 'archive' ? adminManagementService.archivePlan(currentPlan.id) : adminManagementService.changePlanStatus(currentPlan.id, PLAN_ACTIONS[action].target), 'Đã cập nhật gói dịch vụ: ' + PLAN_ACTIONS[action].label.toLocaleLowerCase('vi') + '.')
    }} />}
  </AdminFrame>
}
