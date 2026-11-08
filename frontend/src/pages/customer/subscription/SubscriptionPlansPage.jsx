import { displayReference } from '../../../services/displayReference.js'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import React, { useState } from 'react'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionPlans, subscriptionService } from '../../../services/subscriptionService.js'
import { PlanCards, ResourceState } from '../../../components/subscription/SubscriptionView.jsx'
import { formatSubscriptionMoney } from '../../../services/subscriptionModels.js'
import { demoId, createSeed, stamp, future, DEMO_STORAGE_KEY } from '../../../mockData/seed.js'
import { validSave } from '../../../mockData/store.js'
import { getDemoStore, demoRuntime } from '../../../mockData/runtime.js'
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
  const startPlan = activePlans.find((p) => p.code === 'DEMO_0') || activePlans[0]
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


function recordDemoPartnerPayment({ plan, bakeryName, phone, district, city, paymentReference, proofUrl }) {
  try {
    const store = (typeof window !== 'undefined' && window.__SWEETCAKE_DEMO_STORE__) || (typeof getDemoStore === 'function' ? getDemoStore() : null) || demoRuntime?.store
    if (store && typeof store.recordPartnerPayment === 'function') {
      store.reload?.()
      const result = store.recordPartnerPayment({ plan, bakeryName, phone, district, city, paymentReference, proofUrl })
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new StorageEvent('storage', { key: DEMO_STORAGE_KEY, newValue: JSON.stringify(store.state) }))
        } catch { }
        window.dispatchEvent(new CustomEvent('sweetcake_refresh_payments'))
        window.dispatchEvent(new CustomEvent('sweetcake_demo_sync'))
      }
      return result
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_STORAGE_KEY) : null
    let s = null
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (validSave(parsed)) s = parsed
      } catch { }
    }
    if (!s) {
      s = createSeed()
    }

    const nextId = s.nextId || 1000000
    const orderId = demoId(nextId)
    const paymentId = demoId(nextId + 1)
    s.nextId = nextId + 2

    const cleanName = (bakeryName || '').trim() || 'Tiệm Bánh Sweet Home'
    let bakery = s.bakeries.find((b) => b.name.toLowerCase() === cleanName.toLowerCase())
    if (!bakery) {
      const newBakeryId = demoId(s.nextId++)
      const address = {
        id: demoId(s.nextId++),
        recipientName: cleanName,
        recipientPhone: phone || '0901234567',
        addressLine: district ? (district + ', TP. Hồ Chí Minh') : '18 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
        district: district || 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        isPrimary: true
      }
      bakery = {
        id: newBakeryId,
        ownerId: s.users?.[1]?.id || s.users?.[0]?.id,
        name: cleanName,
        slug: 'demo-bakery-' + s.nextId,
        status: 'ACTIVE',
        description: 'Tiệm bánh đối tác đăng ký mới trên nền tảng',
        logoUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
        coverUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
        primaryAddress: address,
        operations: {
          addresses: [address],
          serviceAreas: [{ city: 'TP. Hồ Chí Minh', district: district || 'Quận 1', deliveryFee: 30000, active: true }],
          businessHours: Array.from({ length: 7 }, (_, day) => ({ dayOfWeek: day + 1, opensAt: '08:00', closesAt: '21:00', closed: false }))
        },
        createdAt: stamp()
      }
      s.bakeries.unshift(bakery)
    }
    const bakeryId = bakery.id

    const orderNumber = 'SUB-' + Math.floor(100000 + Math.random() * 900000)
    const subOrder = {
      id: orderId,
      bakeryId,
      planId: plan.id,
      orderNumber,
      planNameSnapshot: plan.name,
      planCodeSnapshot: plan.code,
      featuresSnapshot: structuredClone(plan.features || {}),
      billingPeriodMonths: plan.billingPeriodMonths || 1,
      totalAmount: plan.monthlyPrice,
      currency: plan.currency || 'VND',
      status: 'PAYMENT_REVIEW',
      expiresAt: future(3),
      createdAt: stamp(),
      payments: []
    }
    s.subscriptionOrders.unshift(subOrder)

    const payment = {
      id: paymentId,
      bakeryId,
      subscriptionOrderId: orderId,
      amount: plan.monthlyPrice,
      currency: plan.currency || 'VND',
      status: 'SUBMITTED',
      paymentMethod: 'Chuyển khoản Vietcombank (QR)',
      paymentReference: paymentReference || ('FT' + Date.now().toString().slice(-8)),
      submittedByName: cleanName,
      proofUrl: proofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      submittedAt: stamp()
    }
    s.payments.unshift(payment)

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(s))
    }

    if (store) {
      store.reload?.()
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new StorageEvent('storage', { key: DEMO_STORAGE_KEY, newValue: JSON.stringify(s) }))
      } catch { }
      window.dispatchEvent(new CustomEvent('sweetcake_refresh_payments'))
      window.dispatchEvent(new CustomEvent('sweetcake_demo_sync'))
      try {
        window.fetch('/__sweetcake_demo_sync__', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s),
        }).catch(() => { })
      } catch { }
    }
  } catch (err) {
    console.warn('Demo storage update failed:', err)
  }
}

function PartnerCheckoutModal({ plan, onClose, onNavigate }) {
  const [step, setStep] = useState(1)
  const [bakeryName, setBakeryName] = useState('Tiệm Bánh Sweet Home')
  const [phone, setPhone] = useState('0901234567')
  const [district, setDistrict] = useState('Quận 1')
  const [paymentRef, setPaymentRef] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderCode] = useState(() => 'SUB-' + Math.floor(100000 + Math.random() * 900000))
  const [copied, setCopied] = useState(false)

  const copyText = (text) => {
    try { navigator.clipboard?.writeText(text) } catch (e) { }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirmPayment = () => {
    setSubmitting(true)
    setTimeout(() => {
      recordDemoPartnerPayment({
        plan,
        bakeryName,
        phone,
        district,
        paymentReference: paymentRef || ('FT' + Date.now().toString().slice(-8)),
        proofUrl: receiptUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600'
      })
      setSubmitting(false)
      setStep(3)
    }, 500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-28 sm:pt-32 pb-8 overflow-y-auto bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[calc(100vh-9.5rem)] overflow-y-auto rounded-3xl bg-surface p-6 sm:p-8 shadow-2xl border-2 border-primary/20 space-y-6">
        <div className="flex items-start justify-between border-b border-outline-variant/30 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-secondary">
              <span className="material-symbols-outlined text-sm">storefront</span>
              Đăng ký đối tác tiệm bánh
            </span>
            <h2 className="font-serif text-2xl font-bold text-primary">
              {step === 3 ? 'Đăng Ký Thành Công' : `Đăng ký ${plan.name || 'Gói Dịch Vụ'}`}
            </h2>
            <p className="text-xs text-on-surface-variant">
              Mức phí: <strong className="text-primary font-bold">{formatSubscriptionMoney(plan.monthlyPrice, plan.currency)} / tháng</strong> · Chu kỳ 30 ngày
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex items-center justify-between px-2 text-xs font-bold">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-primary' : 'text-outline'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'}`}>1</span>
            <span>Thông tin tiệm</span>
          </div>
          <div className="h-0.5 flex-1 mx-3 bg-outline-variant/30">
            <div className={`h-full bg-primary transition-all duration-300 ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`}></div>
          </div>
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-primary' : 'text-outline'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'}`}>2</span>
            <span>Chuyển khoản QR</span>
          </div>
          <div className="h-0.5 flex-1 mx-3 bg-outline-variant/30">
            <div className={`h-full bg-primary transition-all duration-300 ${step < 3 ? 'w-0' : 'w-full'}`}></div>
          </div>
          <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-primary' : 'text-outline'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-outline'}`}>3</span>
            <span>Hoàn tất</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/30 space-y-2">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Quyền lợi gói {plan.name}</span>
              <ul className="text-xs space-y-1.5 text-primary/80">
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-green-600">check_circle</span>
                  <span><strong>0% phí hoa hồng</strong> trên mọi đơn bánh nhận qua SweetCake</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-green-600">check_circle</span>
                  <span>Đăng tải menu mẫu bánh, nhận đơn đặt trước từ khách hàng toàn thành phố</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-green-600">check_circle</span>
                  <span>Nhận thông báo và gửi báo giá cho các đơn bánh 3D & AI độc bản</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-primary mb-1">Tên tiệm bánh của bạn *</label>
                <input
                  type="text"
                  value={bakeryName}
                  onChange={(e) => setBakeryName(e.target.value)}
                  placeholder="Ví dụ: Tiệm Bánh Sweet Home, Artisan Cake..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-primary/30 bg-surface text-sm text-primary font-medium focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-primary/30 bg-surface text-sm text-primary font-medium focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">Khu vực / Quận Huyện</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Quận 1, Bình Thạnh..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-primary/30 bg-surface text-sm text-primary font-medium focus:border-primary outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-outline-variant/50 text-sm font-semibold text-primary hover:bg-surface-container transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!bakeryName.trim() || !phone.trim()}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>Tiếp tục thanh toán</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-2xl border-2 border-secondary/30 bg-secondary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
              <div className="shrink-0 text-center">
                <img
                  src={`https://api.vietqr.io/image/970436-1932628888-rFm9g5n.jpg?amount=${plan.monthlyPrice}&addInfo=SWEETCAKE%20${orderCode}&accountName=SWEETCAKE%20PLATFORM`}
                  alt="VietQR Chuyển khoản SweetCake"
                  className="w-36 h-36 rounded-xl border-2 border-primary/20 bg-white object-contain shadow-sm mx-auto"
                />
                <span className="text-[10px] text-secondary font-bold uppercase mt-1 block">Quét mã bằng app ngân hàng</span>
              </div>
              <div className="text-xs space-y-1.5 flex-1 w-full">
                <div className="flex justify-between py-1 border-b border-secondary/15">
                  <span className="text-on-surface-variant">Ngân hàng:</span>
                  <strong className="text-primary font-bold">Vietcombank (Chi nhánh TP.HCM)</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-secondary/15">
                  <span className="text-on-surface-variant">Số tài khoản:</span>
                  <strong className="text-primary font-bold text-sm tracking-wider">1932628888</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-secondary/15">
                  <span className="text-on-surface-variant">Chủ tài khoản:</span>
                  <strong className="text-primary font-bold">SWEETCAKE PLATFORM</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-secondary/15">
                  <span className="text-on-surface-variant">Số tiền thanh toán:</span>
                  <strong className="text-secondary font-bold text-sm">{(plan.monthlyPrice || 0).toLocaleString('vi-VN')}₫</strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-on-surface-variant">Nội dung CK:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="bg-surface px-2 py-0.5 rounded font-mono font-bold text-primary border border-secondary/20">
                      SWEETCAKE {orderCode}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyText(`SWEETCAKE ${orderCode}`)}
                      className="text-secondary hover:text-secondary-hover text-xs font-bold cursor-pointer"
                      title="Sao chép"
                    >
                      {copied ? '✓ Đã chép' : 'Chép'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-primary">
                    Mã giao dịch / Mã tham chiếu ngân hàng *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaymentRef('FT' + Math.floor(10000000 + Math.random() * 90000000))}
                    className="text-[11px] font-bold text-secondary hover:text-secondary-hover underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">auto_fix_high</span>
                    Tự động điền mã mẫu (Thử nghiệm)
                  </button>
                </div>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Ví dụ: FT2611039821 hoặc mã tra cứu từ app ngân hàng"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-primary/30 bg-surface text-sm text-primary font-medium focus:border-primary outline-none"
                />
                <p className="mt-1.5 text-[11px] text-on-surface-variant leading-relaxed">
                  💡 <strong>Lấy ở đâu?</strong> Sau khi quét mã QR và chuyển khoản thành công trên App Ngân hàng (Vietcombank, MB, Momo, Techcombank,...), màn hình biên lai sẽ có dòng <em>"Mã giao dịch"</em> hoặc <em>"Mã tham chiếu"</em> (thường bắt đầu bằng <code>FT...</code> hoặc dãy số). Nếu đang thử nghiệm trên hệ thống, bạn chỉ cần bấm nút <strong>"Tự động điền mã mẫu"</strong> ở trên.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Ảnh biên lai chuyển khoản (Tùy chọn)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setReceiptUrl(URL.createObjectURL(file))
                      }
                    }}
                    className="text-xs text-primary file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-fixed file:text-primary hover:file:bg-primary-fixed-dim cursor-pointer"
                  />
                  {receiptUrl && (
                    <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check</span>
                      Đã chọn ảnh
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-outline-variant/50 text-sm font-semibold text-primary hover:bg-surface-container transition-colors cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Xác nhận đã thanh toán</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-bold text-primary">
                Đã gửi thông tin thanh toán thành công!
              </h3>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                Hệ thống SweetCake đã tiếp nhận đăng ký gói <strong>{plan.name}</strong> cho tiệm <strong>{bakeryName}</strong>. Mã đơn: <strong>{orderCode}</strong>.
              </p>
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary/80 max-w-md mx-auto text-left space-y-1">
                <p>• Trạng thái: <strong className="text-secondary font-bold">Chờ Ban quản trị (Admin) phê duyệt</strong></p>
                <p>• Sau khi duyệt thành công, thời hạn gói sẽ tự động kích hoạt ngay cho tiệm.</p>
                <p>• Bạn có thể tiếp tục duyệt xem trang hoặc quản lý gian hàng bất cứ lúc nào.</p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm hover:scale-[1.02] transition-all cursor-pointer"
              >
                Đóng &amp; Hoàn tất
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
