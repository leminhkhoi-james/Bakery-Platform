import { userFeedback, cleanPresentationLabel, publicCopy } from '../../services/uiLabels.js'
import React from 'react'
import { StatusBadge } from '../common/WorkspaceUI.jsx'
import { canOrderPlan, formatSubscriptionMoney, subscriptionStatusLabel } from '../../services/subscriptionModels.js'

export function SubscriptionError({ error, retry }) {
  const explanation = { 401: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.', 403: 'Bạn không có quyền thao tác với cửa hàng này.', 404: 'Không tìm thấy dữ liệu được yêu cầu.' }[error?.status]
  return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"><p>{explanation || 'Không thể tải hoặc xử lý dữ liệu.'}</p><p className="text-sm break-words">{userFeedback(error)}</p>{retry && <button className="mt-3 underline" onClick={retry}>Thử lại</button>}</div>
}

export function ResourceState({ resource, children }) {
  if (resource.status === 'loading') return <p role="status" className="p-5">Đang tải dữ liệu gói dịch vụ…</p>
  if (resource.error) return <SubscriptionError error={resource.error} retry={resource.reload} />
  return <>{children}</>
}

export function FeatureList({ features = {} }) {
  const labels = { MAX_PRODUCTS: 'Số sản phẩm tối đa', MAX_MONTHLY_OFFERS: 'Số báo giá mỗi tháng', FEATURED_LISTING: 'Hiển thị nổi bật' }
  return Object.keys(features).length ? <ul className="space-y-2 text-sm">{Object.entries(features).map(([key, value]) => <li key={key}>{labels[key] || key}: <strong>{value === 'true' ? 'Có' : value === 'false' ? 'Không' : value}</strong></li>)}</ul> : <p className="text-sm text-on-surface-variant">Chưa có thông tin tính năng.</p>
}

export function PlanCards({ plans, onSelect, canSelect = false, busy = false }) {
  if (!plans?.length) return <p className="rounded-2xl border border-outline-variant/30 p-6">Chưa có gói dịch vụ được mở bán.</p>
  return <div className="grid gap-5 md:grid-cols-3">{plans.map((plan) => <article key={plan.id} className="sc-panel flex flex-col gap-4">
    <div><p className="text-sm text-secondary">{cleanPresentationLabel(plan.code, 'Gói dịch vụ')}</p><h3 className="text-xl font-bold text-primary">{plan.name || 'Chưa có tên gói'}</h3></div>
    <p className="font-serif text-3xl font-semibold text-primary">{formatSubscriptionMoney(plan.monthlyPrice, plan.currency)}<span className="text-sm font-normal"> / tháng</span></p>
    <p>{publicCopy(plan.description, 'Xem quyền lợi và mức phí của gói dịch vụ.')}</p><p className="text-sm">Chu kỳ: {plan.billingPeriodMonths ? plan.billingPeriodMonths + ' tháng' : 'Chưa có thông tin'}</p>
    <p><StatusBadge status={plan.status} label={plan.status === 'ACTIVE' ? 'Đang mở bán' : subscriptionStatusLabel(plan.status)} /></p><FeatureList features={plan.features} />
    {onSelect && <button disabled={!canSelect || busy || !canOrderPlan(plan)} onClick={() => onSelect(plan)} className="mt-auto rounded-xl bg-primary px-4 py-3 text-on-primary disabled:opacity-40">Chọn gói</button>}
  </article>)}</div>
}
