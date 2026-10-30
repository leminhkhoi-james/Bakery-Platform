import { userFeedback, cleanPresentationLabel, publicCopy } from '../../services/uiLabels.js'
import React from 'react'
import '../common/vendor-ui.css'
import { Icon, StatusBadge } from '../common/WorkspaceUI.jsx'
import { canOrderPlan, formatSubscriptionMoney, subscriptionStatusLabel } from '../../services/subscriptionModels.js'
import { planFeatureRows } from '../../services/planPresentation.js'

export function SubscriptionError({ error, retry }) {
  const explanation = { 400: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.', 401: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.', 403: 'Bạn không có quyền thao tác với cửa hàng này.', 404: 'Không tìm thấy gói hoặc đơn mua được yêu cầu.', 409: 'Chưa thể tạo hoặc cập nhật đơn. Hãy kiểm tra đơn đang chờ trong lịch sử mua gói và tải lại trước khi thử tiếp.', 422: 'Gói hoặc chứng từ chưa đáp ứng điều kiện xử lý.' }[error?.status]
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><p>{explanation || userFeedback(error)}</p>{retry && <button className="mt-2 underline" onClick={retry}>Thử lại</button>}</div>
}

export function ResourceState({ resource, children }) {
  if (resource.status === 'loading') return <p role="status" className="p-5">Đang tải dữ liệu gói dịch vụ…</p>
  if (resource.error) return <SubscriptionError error={resource.error} retry={resource.reload} />
  return <>{children}</>
}

export function FeatureList({ features = {} }) {
  return Object.keys(features).length ? <ul className="space-y-2 text-sm sc-plan-benefits">{planFeatureRows(features).map((row) => <li key={row.code}><Icon name="check_circle" />{row.label}: <strong>{row.value}</strong></li>)}</ul> : <p className="text-sm text-on-surface-variant">Chưa có thông tin quyền lợi.</p>
}

export function PlanCards({ plans, onSelect, canSelect = false, busy = false }) {
  if (!plans?.length) return <p className="rounded-2xl border border-outline-variant/30 p-6">Chưa có gói dịch vụ được mở bán.</p>
  return <div className="sc-owner-plan-grid">{plans.map((plan) => <article key={plan.id} className={'sc-panel sc-owner-plan-card' + (String(plan.code).toUpperCase() === 'PRO' ? ' is-featured' : '')}>
    <div><h3 className="text-xl font-bold text-primary">{cleanPresentationLabel(plan.name, 'Chưa có tên gói')}</h3></div>
    <p className="font-serif text-3xl font-semibold text-primary">{formatSubscriptionMoney(plan.monthlyPrice, plan.currency)}<span className="text-sm font-normal"> / tháng</span></p>
    <p>{publicCopy(plan.description, 'Xem quyền lợi và mức phí của gói dịch vụ.')}</p><p className="text-sm">Chu kỳ: {plan.billingPeriodMonths ? plan.billingPeriodMonths + ' tháng' : 'Chưa có thông tin'}</p>
    <p><StatusBadge status={plan.status} label={plan.status === 'ACTIVE' ? 'Đang mở bán' : subscriptionStatusLabel(plan.status)} /></p><FeatureList features={plan.features} />
    {onSelect && <button disabled={!canSelect || busy || !canOrderPlan(plan)} onClick={() => onSelect(plan)} className="mt-auto rounded-xl bg-primary px-4 py-3 text-on-primary disabled:opacity-40">Chọn gói</button>}
  </article>)}</div>
}
