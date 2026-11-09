import { displayReference } from '../../../services/displayReference.js'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import React, { useState } from 'react'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionPlans, subscriptionService } from '../../../services/subscriptionService.js'
import { PlanCards, ResourceState } from '../../../components/subscription/SubscriptionView.jsx'
import { formatSubscriptionMoney } from '../../../services/subscriptionModels.js'
import PartnerCheckoutModal from '../../../components/subscription/PartnerCheckoutModal.jsx'
import './subscription-plans.css'

const loadPlan = ({ id }, options) => subscriptionService.getPlan(id, options)

function PlanDetail({ id }) {
  const resource = useCatalogResource(loadPlan, { id })
  return (
    <section className="mt-8 space-y-4 rounded-3xl border border-primary/20 bg-surface/80 backdrop-blur-md p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-primary">Chi tiết gói dịch vụ</h2>
        <RefreshButton className="text-secondary text-sm font-semibold underline hover:text-secondary-hover cursor-pointer" onClick={resource.reload}>
          Tải lại chi tiết gói
        </RefreshButton>
      </div>
      <ResourceState resource={resource}>
        {resource.data && <PlanCards plans={[resource.data]} />}
      </ResourceState>
    </section>
  )
}

export default function SubscriptionPlansPage({ onNavigate }) {
  const plans = useCatalogResource(loadSubscriptionPlans)
  const [selected, setSelected] = useState(null)
  const [checkoutPlan, setCheckoutPlan] = useState(null)

  const activePlans = plans.data?.filter((p) => p.status === 'ACTIVE') || []
  const minPrice = activePlans.length ? Math.min(...activePlans.map((p) => p.monthlyPrice || 0)) : 49000
  const formattedMinPrice = (minPrice || 49000).toLocaleString('vi-VN') + '₫'
  const startPlan = activePlans[0]
  const startPlanPrice = (startPlan?.monthlyPrice || 49000).toLocaleString('vi-VN') + '₫'

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
                const el = document.getElementById('pricing-section')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span className="material-symbols-outlined text-base">rocket_launch</span>
              Đăng ký ngay
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
              onSelect={(plan) => {
                setSelected(plan.id)
                setCheckoutPlan(plan)
              }}
            />

            {/* Detail toggle buttons */}
            {plans.data?.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center pt-1">
                {plans.data.map((plan) => (
                  <button
                    key={plan.id}
                    className={`scp-detail-btn ${selected === plan.id ? 'active' : ''}`}
                    onClick={() => setSelected(selected === plan.id ? null : plan.id)}
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

          {selected && <PlanDetail key={selected} id={selected} />}
        </section>

        {/* ── ALREADY HAVE ACCOUNT ── */}
        <div className="scp-action-bar">
          <div>
            <p className="font-bold text-sm" style={{ color: '#5a1a2a' }}>Đã có tài khoản tiệm bánh?</p>
            <p className="text-xs" style={{ color: '#7a4555' }}>Xem gói hiện tại, gia hạn hoặc nâng cấp chu kỳ dịch vụ.</p>
          </div>
          <button
            type="button"
            className="scp-btn-primary shrink-0"
            onClick={() => onNavigate && onNavigate('vendor-subscription')}
          >
            Quản lý gói
          </button>
        </div>

        {/* ── 3 STEPS (compact inline) ── */}
        <div className="scp-steps">
          {[
            { n: '1', color: '#8b2240', label: 'Đăng ký tiệm', desc: 'Tạo tài khoản, điền tên tiệm, địa chỉ, ảnh cửa hàng.' },
            { n: '2', color: '#c0485e', label: 'Chọn gói & kích hoạt', desc: `Từ ${formattedMinPrice}/tháng, thanh toán nhanh chóng.` },
            { n: '3', color: '#5a1a2a', label: 'Đăng bánh & nhận đơn', desc: 'Nhận thông báo báo giá 3D/AI từ khách ngay lập tức.' },
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

        {checkoutPlan && (
          <PartnerCheckoutModal
            plan={checkoutPlan}
            onClose={() => setCheckoutPlan(null)}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </main>
  )
}
