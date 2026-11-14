import RefreshButton from '../../../components/common/RefreshButton.jsx'
import React, { useContext, useLayoutEffect, useRef, useState } from 'react'
import { AuthContext } from '../../../context/useAuth.js'
import { isCatalogId } from '../../../services/catalogModels.js'
import { onboardingService } from '../../../services/onboardingService.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionPlans, subscriptionService } from '../../../services/subscriptionService.js'
import { PlanCards, ResourceState } from '../../../components/subscription/SubscriptionView.jsx'
import { StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { canOrderPlan, subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { planFeatureRows, planMonthlyPrice, planName } from '../../../services/planPresentation.js'
import { publicCopy } from '../../../services/uiLabels.js'
import PartnerCheckoutModal from '../../../components/subscription/PartnerCheckoutModal.jsx'
import './subscription-plans.css'

const loadPlan = ({ id }, options) => subscriptionService.getPlan(id, options)
const loadRegistration = ({ enabled }, options) => enabled ? onboardingService.get(null, options) : Promise.resolve(null)

const benefitDescriptions = {
  MAX_PRODUCTS: 'Số mẫu bánh tối đa tiệm có thể đăng trong danh mục.',
  MAX_MONTHLY_OFFERS: 'Số báo giá tối đa tiệm có thể gửi cho các yêu cầu đặt bánh trong một tháng.',
  FEATURED_LISTING: 'Cho biết gói có quyền ưu tiên hiển thị tiệm trên nền tảng hay không.',
}

function PlanDetail({ id, onSelect, reveal }) {
  const resource = useCatalogResource(loadPlan, { id })
  const heading = useRef(null)
  const plan = resource.data
  const benefits = plan ? planFeatureRows(plan.features) : []
  useLayoutEffect(() => {
    if (!reveal) return
    heading.current?.focus({ preventScroll: true })
    heading.current?.scrollIntoView({ block: 'start' })
  }, [id, reveal])
  return (
    <section id="subscription-plan-detail" aria-labelledby="subscription-plan-detail-title"
      className="mt-5 w-full overflow-hidden rounded-2xl border border-primary/20 bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 bg-surface-container-low px-4 py-2 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 ref={heading} tabIndex={-1} id="subscription-plan-detail-title" className="scroll-mt-40 text-lg font-bold text-primary">Chi tiết {plan ? 'gói ' + planName(plan) : 'gói dịch vụ'}</h2>
          {plan && <StatusBadge status={plan.status} label={plan.status === 'ACTIVE' ? 'Đang mở bán' : subscriptionStatusLabel(plan.status)} />}
        </div>
        <RefreshButton className="text-sm font-semibold text-primary" onClick={resource.reload}>
          Tải lại chi tiết gói
        </RefreshButton>
      </div>
      <div className="px-4 py-3 sm:px-6">
        <ResourceState resource={resource}>
          {plan && <>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-xl font-bold text-primary">{planMonthlyPrice(plan)} <span className="text-sm font-normal">/ tháng</span></p>
                  <p className="text-sm text-on-surface-variant">Chu kỳ thanh toán {plan.billingPeriodMonths ? plan.billingPeriodMonths + ' tháng' : 'chưa xác định'}</p>
                </div>
                {publicCopy(plan.description) && <p className="break-words text-sm leading-relaxed text-on-surface-variant">{publicCopy(plan.description)}</p>}
              </div>
              <button type="button" disabled={!canOrderPlan(plan)} onClick={() => onSelect(plan)}
                className="sc-button w-full sm:w-auto">Chọn gói này</button>
            </div>
            <h3 className="mb-2 mt-3 border-t border-primary/10 pt-3 text-sm font-bold text-primary">Quyền lợi của gói</h3>
            {benefits.length ? <dl className="grid gap-2 md:grid-cols-3 md:gap-3">
              {benefits.map(benefit => (
                <div key={benefit.code} className="rounded-xl border border-primary/10 bg-surface-container-low px-3 py-2.5 text-sm">
                  <dt className="break-words font-medium text-on-surface">{benefit.label}</dt>
                  <dd className="mt-0.5 break-words text-base font-bold text-primary">{benefit.value}</dd>
                  {benefitDescriptions[benefit.code] && (
                    <dd className="mt-1 leading-snug text-on-surface-variant">{benefitDescriptions[benefit.code]}</dd>
                  )}
                </div>
              ))}
            </dl> : <p className="py-3 text-sm text-on-surface-variant">Chưa có thông tin quyền lợi.</p>}
          </>}
        </ResourceState>
      </div>
    </section>
  )
}

export default function SubscriptionPlansPage({ onNavigate, routeSearch = '' }) {
  const { user, roles = [] } = useContext(AuthContext) || {}
  const isOwner = roles.includes('BAKERY_OWNER')
  const registration = useCatalogResource(loadRegistration, { enabled: Boolean(user && roles.includes('CUSTOMER') && !isOwner) })
  const plans = useCatalogResource(loadSubscriptionPlans)
  const [selected, setSelected] = useState(null)
  const [revealDetail, setRevealDetail] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState(null)
  const query = new URLSearchParams(routeSearch)
  const trackingOrderId = query.get('orderId')
  const [trackingRegistration, setTrackingRegistration] = useState(query.get('tracking') === '1')
  const selectPlan = plan => {
    setRevealDetail(false)
    setTrackingRegistration(false)
    setSelected(plan.id)
    setCheckoutPlan(plan)
  }

  const activePlans = plans.data?.filter((p) => p.status === 'ACTIVE') || []
  const minPrice = activePlans.length ? Math.min(...activePlans.map((p) => p.monthlyPrice || 0)) : 49000
  const formattedMinPrice = (minPrice || 49000).toLocaleString('vi-VN') + '₫'
  const startPlan = activePlans[0]
  const startPlanPrice = (startPlan?.monthlyPrice || 49000).toLocaleString('vi-VN') + '₫'
  const hasRegistration = registration.status === 'ready' && Boolean(registration.data)
  const openRegistration = () => {
    setTrackingRegistration(true)
    setCheckoutPlan(activePlans.find(plan => plan.id === selected) || activePlans[0])
  }

  return (
    <main className="sc-customer sc-public-plans min-h-screen bg-transparent py-4 px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-4">

        {/* ── COMPACT HEADER: logo + tagline + CTA ── */}
        <div className="scp-hero rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="scp-kicker">🏪 Dành cho tiệm bánh &amp; home baker toàn quốc</p>
            <h1 className="scp-title">Trở thành đối tác SweetCake</h1>
            <p className="scp-sub">
              Từ <strong>{formattedMinPrice}/tháng</strong> · 0% hoa hồng · Tiếp cận hàng nghìn đơn bánh 3D&nbsp;&amp;&nbsp;AI mỗi ngày
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href="#pricing-section" className="scp-btn-outline">Xem gói</a>
            <button
              type="button"
              className="scp-btn-primary"
              onClick={() => {
                if (isOwner) { onNavigate?.('vendor-subscription'); return }
                if (hasRegistration) { openRegistration(); return }
                const el = document.getElementById('pricing-section')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span className="material-symbols-outlined text-base">rocket_launch</span>
              {isOwner ? 'Quản lý gói' : hasRegistration ? 'Theo dõi đăng ký tiệm' : 'Đăng ký ngay'}
            </button>
          </div>
        </div>

        {/* ── VALUE CHIPS ── */}
        <div className="scp-chips">
          {[
            { icon: 'savings', label: '0% phí hoa hồng' },
            { icon: 'view_in_ar', label: 'Nhận đơn bánh 3D & AI' },
            { icon: 'verified', label: 'Hồ sơ tiệm uy tín' },
            { icon: 'campaign', label: 'Hiển thị toàn thành phố' },
          ].map(({ icon, label }) => (
            <span key={icon} className="scp-chip">
              <span className="material-symbols-outlined text-sm">{icon}</span>
              {label}
            </span>
          ))}
        </div>

        {/* ── PLAN CARDS ── */}
        <section id="pricing-section" className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <h2 className="scp-section-title">Gói dịch vụ cho tiệm bánh</h2>
            <RefreshButton disabled={plans.refreshing} onClick={plans.reload} className="scp-refresh-btn">
              Làm mới
            </RefreshButton>
          </div>

          <ResourceState resource={plans}>
            <PlanCards
              plans={plans.data}
              canSelect={true}
              onSelect={selectPlan}
            />

            {/* Detail toggle buttons */}
            {plans.data?.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center pt-1">
                {plans.data.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    aria-expanded={selected === plan.id}
                    aria-controls={selected === plan.id ? 'subscription-plan-detail' : undefined}
                    className={`scp-detail-btn ${selected === plan.id ? 'active' : ''}`}
                    onClick={() => {
                      setRevealDetail(selected !== plan.id)
                      setSelected(selected === plan.id ? null : plan.id)
                    }}
                  >
                    {selected === plan.id
                      ? <><span className="material-symbols-outlined text-sm">expand_less</span> Ẩn chi tiết</>
                      : <><span className="material-symbols-outlined text-sm">info</span> Chi tiết {plan.name || plan.code}</>
                    }
                  </button>
                ))}
              </div>
            )}
          </ResourceState>

          {selected && <PlanDetail key={selected} id={selected} onSelect={selectPlan} reveal={revealDetail} />}
        </section>

        {/* Existing partners manage plans; applicants resume their actual registration. */}
        {(isOwner || hasRegistration) && <div className="scp-action-bar">
          <div>
            <p className="font-bold text-sm" style={{ color: '#5a1a2a' }}>{isOwner ? 'Gói dịch vụ của tiệm' : 'Hồ sơ đăng ký tiệm của bạn'}</p>
            <p className="text-xs" style={{ color: '#7a4555' }}>{isOwner ? 'Xem gói hiện tại, gia hạn hoặc nâng cấp chu kỳ dịch vụ.' : 'Theo dõi hồ sơ, chứng từ và trạng thái xét duyệt.'}</p>
          </div>
          <button
            type="button"
            className="scp-btn-primary shrink-0"
            onClick={() => {
              if (isOwner) { onNavigate?.('vendor-subscription'); return }
              openRegistration()
            }}
          >
            {isOwner ? 'Quản lý gói' : 'Theo dõi đăng ký tiệm'}
          </button>
        </div>}

        {/* ── 3 STEPS (compact inline) ── */}
        <div className="scp-steps">
          {[
            { n: '1', color: '#8b2240', label: 'Gửi hồ sơ tiệm', desc: 'Điền thông tin tiệm, địa chỉ và khu vực giao hàng để admin duyệt.' },
            { n: '2', color: '#c0485e', label: 'Chọn gói & thanh toán VNPay', desc: `Từ ${formattedMinPrice}/tháng. Thanh toán trực tuyến qua VNPay, tự động xác nhận ngay lập tức.` },
            { n: '3', color: '#5a1a2a', label: 'Mở kênh quản lý', desc: 'Quyền chủ tiệm tự cập nhật khi hồ sơ và thanh toán được duyệt, gói có hiệu lực.' },
          ].map(({ n, color, label, desc }) => (
            <div key={n} className="scp-step">
              <span className="scp-step-num" style={{ background: color }}>{n}</span>
              <div>
                <p className="font-bold text-sm" style={{ color: '#5a1a2a' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#7a4555' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FAQ (compact) ── */}
        <div className="scp-faq-wrap">
          <p className="scp-section-title text-center mb-3">Câu hỏi thường gặp</p>
          {[
            {
              q: 'Home Baker tại nhà có tham gia được không?',
              a: `Có! ${startPlan?.name || 'Gói cơ bản'} (${startPlanPrice}/tháng) dành riêng cho home baker – bán pre-order, giao hàng linh hoạt.`
            },
            {
              q: 'Khách đặt bánh 3D & AI như thế nào?',
              a: 'Khách thiết kế bánh qua AI/3D Studio, hệ thống gửi yêu cầu kèm ảnh đến tiệm để báo giá trực tiếp.'
            },
            {
              q: 'Có thể nâng cấp hoặc hủy gói không?',
              a: 'Nâng cấp bất kỳ lúc nào, hủy cuối chu kỳ, không phí phạt.'
            },
          ].map(({ q, a }) => (
            <details key={q} className="scp-faq group">
              <summary className="scp-faq-q">
                <span>{q}</span>
                <span className="material-symbols-outlined text-sm group-open:rotate-180 transition-transform" style={{ color: '#8b2240' }}>expand_more</span>
              </summary>
              <p className="scp-faq-a">{a}</p>
            </details>
          ))}
        </div>

        {(checkoutPlan || trackingRegistration) && (
          <PartnerCheckoutModal
            plan={checkoutPlan || (trackingRegistration ? startPlan : null)}
            tracking={trackingRegistration}
            initialOrderId={trackingRegistration && isCatalogId(trackingOrderId) ? trackingOrderId : null}
            onClose={() => { setCheckoutPlan(null); setTrackingRegistration(false) }}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </main>
  )
}
