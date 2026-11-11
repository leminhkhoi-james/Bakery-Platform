import { userFeedback, cleanPresentationLabel, publicCopy } from '../../services/uiLabels.js'
import React from 'react'
import '../common/vendor-ui.css'
import { Icon, StatusBadge } from '../common/WorkspaceUI.jsx'
import { canOrderPlan, subscriptionStatusLabel, formatSubscriptionMoney } from '../../services/subscriptionModels.js'
import { planFeatureRows, planMonthlyPrice, planName, planTierRank, sortPlansByTier } from '../../services/planPresentation.js'

export function SubscriptionError({ error, retry }) {
  const feedback = userFeedback(error)
  const explanation = error?.message === 'Bakery profile must be approved and active before purchasing a subscription'
    ? 'Hồ sơ tiệm cần được duyệt và ở trạng thái hoạt động trước khi mua hoặc thanh toán gói. Hãy kiểm tra trạng thái hồ sơ.'
    : error?.message === 'A VNPay payment is still in progress'
    ? 'Đang có một lượt thanh toán VNPay cho đơn này. Hãy tiếp tục qua VNPay hoặc chờ liên kết hết hạn trước khi gửi biên lai chuyển khoản.'
    : feedback && feedback !== 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
    ? feedback
    : {
        400: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.',
        401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        403: 'Bạn không có quyền thao tác với cửa hàng này.',
        404: 'Không tìm thấy thông tin được yêu cầu.',
        409: 'Hồ sơ tiệm bánh hoặc gói dịch vụ đang chờ Ban quản trị phê duyệt.',
        422: 'Thông tin gửi lên chưa đáp ứng điều kiện xử lý.',
      }[error?.status] || feedback || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-xs space-y-1">
      <div className="flex items-center gap-2 font-bold">
        <span className="material-symbols-outlined text-sm">info</span>
        <span>Thông báo</span>
      </div>
      <p>{explanation}</p>
      {retry && <button className="mt-2 underline font-semibold cursor-pointer block" onClick={retry}>Thử lại</button>}
    </div>
  )
}

export function ResourceState({ resource, children }) {
  if (resource.status === 'loading') return <p role="status" className="p-5">Đang tải dữ liệu gói dịch vụ…</p>
  if (resource.error) return <SubscriptionError error={resource.error} retry={resource.reload} />
  return <>{children}</>
}

export function FeatureList({ features = {} }) {
  return Object.keys(features).length ? <ul className="space-y-2 text-sm sc-plan-benefits">{planFeatureRows(features).map((row) => <li key={row.code}><Icon name="check_circle" />{row.label}: <strong>{row.value}</strong></li>)}</ul> : <p className="text-sm text-on-surface-variant">Chưa có thông tin quyền lợi.</p>
}

export function formatPeriodDate(dateStr) {
  if (!dateStr || !Number.isFinite(Date.parse(dateStr))) return 'Chưa có thông tin'
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function findMatchingPlan(plans, period) {
  if (!plans?.length || !period) return null
  const planId = period.planId || period.id
  const planCode = period.planCode || period.code
  if (planId) {
    const byId = plans.find((p) => p.id === planId)
    if (byId) return byId
  }
  if (planCode) {
    const byCode = plans.find((p) => p.code && p.code.toLowerCase() === String(planCode).toLowerCase())
    if (byCode) return byCode
  }
  const clean = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '_')
  const periodCode = clean(planCode)
  const codeAliases = {
    demo_0: ['basic', 'co_ban', 'khoi_dau'],
    demo_1: ['pro', 'chuyen_nghiep', 'nghe_nhan'],
    demo_2: ['premium', 'cao_cap'],
    basic: ['demo_0', 'co_ban', 'khoi_dau'],
    pro: ['demo_1', 'chuyen_nghiep', 'nghe_nhan'],
    premium: ['demo_2', 'cao_cap'],
  }
  const byAlias = plans.find((p) => {
    const pCode = clean(p.code)
    if (codeAliases[periodCode]?.includes(pCode) || codeAliases[pCode]?.includes(periodCode)) return true
    return false
  })
  if (byAlias) return byAlias
  if (plans.length === 3) {
    if (/2|premium|cao_cap/i.test(periodCode)) return plans[2]
    if (/1|pro|chuyen_nghiep/i.test(periodCode)) return plans[1]
    if (/0|basic|co_ban/i.test(periodCode)) return plans[0]
  }
  return null
}

export function PlanCards({ plans, onSelect, canSelect = false, busy = false, currentPlanId = null, currentPlanCode = null, currentPlan = null, scheduledPlanId = null }) {
  if (!plans?.length) return <p className="rounded-2xl border border-outline-variant/30 p-6">Chưa có gói dịch vụ được mở bán.</p>
  const activeCurrentPlan = currentPlan || findMatchingPlan(plans, { planId: currentPlanId, planCode: currentPlanCode })
  // Featured: prefer plan whose code contains PRO/PROFESSIONAL, else middle card in a 3-plan list
  const featuredId = (() => {
    const proMatch = plans.find((p) => /PRO/i.test(String(p.code)))
    if (proMatch) return proMatch.id
    if (plans.length === 3) return plans[1].id
    return null
  })()
  return <div className="sc-owner-plan-grid">{sortPlansByTier(plans).map((plan) => {
    const isCurrent = Boolean(activeCurrentPlan && (plan.id === activeCurrentPlan.id || plan.code === activeCurrentPlan.code))
    const isScheduled = Boolean(scheduledPlanId && plan.id === scheduledPlanId)
    const isUpgrade = Boolean(activeCurrentPlan && !isCurrent && Number(plan.monthlyPrice) > Number(activeCurrentPlan.monthlyPrice || 0))

    let buttonLabel = 'Chọn gói'
    if (isCurrent) buttonLabel = 'Gia hạn kỳ tiếp theo'
    else if (isScheduled) buttonLabel = 'Đã lên lịch kỳ này'
    else if (isUpgrade) buttonLabel = 'Nâng cấp lên gói này'
    else if (activeCurrentPlan) buttonLabel = 'Đổi sang gói này (Kỳ tới)'

    return (
      <article key={plan.id} className={'sc-panel sc-owner-plan-card' + (isCurrent ? ' is-current-plan' : plan.id === featuredId ? ' is-featured' : '')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-bold text-primary">{cleanPresentationLabel(planName(plan), 'Chưa có tên gói')}</h3>
          {isCurrent && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-xs">
              <Icon name="check_circle" className="text-sm" /> Gói đang sử dụng
            </span>
          )}
          {!isCurrent && isUpgrade && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
              ⭐ Nâng cấp
            </span>
          )}
          {!isCurrent && isScheduled && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300">
              🕒 Đã lên lịch
            </span>
          )}
        </div>
        <p className="font-serif text-3xl font-semibold text-primary">{planMonthlyPrice(plan)}<span className="text-sm font-normal"> / tháng</span></p>
        <p className="text-sm text-on-surface-variant leading-relaxed">{publicCopy(plan.description, 'Xem quyền lợi và mức phí của gói dịch vụ.')}</p>
        <p className="text-sm font-medium">Chu kỳ: {plan.billingPeriodMonths ? plan.billingPeriodMonths + ' tháng' : 'Chưa có thông tin'}</p>
        <p><StatusBadge status={plan.status} label={plan.status === 'ACTIVE' ? 'Đang mở bán' : subscriptionStatusLabel(plan.status)} /></p>
        <FeatureList features={plan.features} />
        {onSelect && (
          <button
            disabled={!canSelect || busy || !canOrderPlan(plan)}
            onClick={() => onSelect(plan)}
            className={'mt-auto rounded-xl px-4 py-3 font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ' + (isCurrent ? 'bg-primary text-on-primary hover:bg-primary-hover shadow-xs' : isUpgrade ? 'bg-amber-700 text-white hover:bg-amber-800 shadow-xs' : 'bg-primary text-on-primary hover:bg-primary-hover')}
          >
            {buttonLabel}
          </button>
        )}
      </article>
    )
  })}</div>
}
