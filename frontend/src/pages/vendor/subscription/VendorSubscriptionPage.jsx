import { localSubscriptionFor, recordSource, unifiedEnabled } from '../../../services/unifiedDataService.js'
import { vendorMoney } from '../../../services/vendorPresentation.js'
import { displayReference } from '../../../services/displayReference.js'
import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { VendorConfirm } from '../../../components/common/VendorUi.jsx'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import { DetailDrawer, Icon } from '../../../components/common/WorkspaceUI.jsx'
import React, { useRef, useState } from 'react'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionPlans, loadBakerySubscription, loadSubscriptionOrders, subscriptionService } from '../../../services/subscriptionService.js'
import { canOrderPlan, subscriptionPermissions, formatSubscriptionDate, formatSubscriptionMoney, subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { FeatureList, PlanCards, ResourceState, SubscriptionError, formatPeriodDate } from '../../../components/subscription/SubscriptionView.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import SubscriptionOrderDetail from './SubscriptionOrderDetail.jsx'

function Period({ title, period, plans, currentPlan }) {
  const isCurrent = title === 'Kỳ hiện tại'
  const plan = currentPlan || plans?.find(p => p.id === period?.planId || period?.planCode && p.code === period.planCode)
  const daysRemaining = period?.periodEnd ? Math.max(0, Math.ceil((Date.parse(period.periodEnd) - Date.now()) / 86400000)) : 0

  return (
    <div className={'rounded-2xl border p-5 flex flex-col justify-between transition-all ' + (isCurrent && period ? 'border-primary/20 bg-gradient-to-br from-white to-rose-50/30 shadow-2xs' : 'border-outline-variant/30 bg-surface-container-lowest')}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isCurrent ? '⭐' : '📅'}</span>
            <h3 className="font-bold text-base text-primary">{title}</h3>
          </div>
          {period ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {subscriptionStatusLabel(period.status)}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-outline-variant/10 text-on-surface-variant">
              Trống
            </span>
          )}
        </div>

        {period ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-primary">
                {cleanPresentationLabel(plan?.name, 'Gói dịch vụ đã đăng ký')}
              </span>
              {plan?.monthlyPrice && (
                <span className="text-xs text-on-surface-variant font-medium">
                  ({formatSubscriptionMoney(plan.monthlyPrice, plan.currency)}/tháng)
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-medium text-on-surface/80 bg-surface px-2.5 py-1 rounded-lg border border-outline-variant/20">
                <span>Hiệu lực:</span>
                <strong className="text-primary">{formatPeriodDate(period.periodStart)}</strong>
                <span>→</span>
                <strong className="text-primary">{formatPeriodDate(period.periodEnd)}</strong>
              </span>
              {isCurrent && daysRemaining > 0 && (
                <span className="inline-flex items-center font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  ⏳ Còn {daysRemaining} ngày
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm font-medium text-on-surface-variant">
              {isCurrent ? 'Tiệm chưa đăng ký gói dịch vụ' : 'Chưa có kỳ dịch vụ kế tiếp'}
            </p>
            <p className="text-xs text-on-surface-variant/70 mt-1">
              {isCurrent ? 'Chọn một gói bên dưới để mở bán trên Marketplace.' : 'Kỳ tiếp theo sẽ được tạo khi bạn gia hạn hoặc đổi gói.'}
            </p>
          </div>
        )}
      </div>
      {!period && isCurrent && (
        <div className="text-xs text-amber-800 bg-amber-50/80 rounded-xl p-3 mt-4 border border-amber-200/80 flex items-center gap-2">
          <span>💡</span>
          <span>Chọn một gói bên dưới để kích hoạt gian hàng và nhận yêu cầu từ khách.</span>
        </div>
      )}
    </div>
  )
}

const loadOwnerPlans = (_params, options) => loadSubscriptionPlans(undefined, { ...options, allowMockFallback: false })

function BakeryWorkspace({ bakeryId, roles, plans, onBusy, initialPlanId }) {
  const subscription = useCatalogResource(loadBakerySubscription, { bakeryId })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const history = useCatalogResource(loadSubscriptionOrders, { bakeryId, page, size: 10, sort: 'createdAt,desc', status })
  const inFlight = useRef(false)
  const [selection, setSelected] = useState(undefined)
  const selected = selection === undefined ? (initialPlanId && plans.data?.find((plan) => plan.id === initialPlanId && canOrderPlan(plan))) || null : selection
  const [attempt, setAttempt] = useState(null)
  const [busy, setBusy] = useState(false)
  const [detailBusy, setDetailBusy] = useState(false)
  const [error, setError] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [detailRevision, setDetailRevision] = useState(0)
  const permissions = subscriptionPermissions(roles)
  const refresh = () => { history.reload(); subscription.reload(); setDetailRevision((value) => value + 1) }
  async function purchase() {
    if (inFlight.current || busy || !selected) return
    inFlight.current = true
    const request = attempt || { bakeryId, planId: selected.id, key: crypto.randomUUID() }
    setAttempt(request); setBusy(true); onBusy(true); setError(null)
    try { const order = await subscriptionService.createOrder(request); setOrderId(order.id); setSelected(null); setAttempt(null); refresh() }
    catch (failure) { setError(failure) }
    finally { inFlight.current = false; setBusy(false); onBusy(false) }
  }
  const locked = busy || detailBusy
  const localPeriod = localSubscriptionFor(bakeryId)
  const currentSub = subscription.error || subscription.status !== 'ready' ? null : subscription.data?.currentSubscription
  const currentPlan = plans.data?.find(p => p.id === currentSub?.planId || p.code === currentSub?.planCode)
  return <div className="space-y-6">
    <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-white via-surface to-rose-50/20 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-primary">Trạng thái dịch vụ</h2>
            {currentSub ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                👑 Đối tác đang hoạt động
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {subscription.status === 'loading' || subscription.refreshing ? 'Đang tải trạng thái…' : subscription.error ? 'Chưa xác minh được gói' : 'Chưa kích hoạt gói'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            {currentSub
              ? 'Tiệm bánh của bạn đang được kết nối với khách hàng trên Marketplace và nhận yêu cầu báo giá.'
              : 'Tiệm cần kích hoạt gói dịch vụ để xuất hiện trên Marketplace và gửi báo giá cho khách.'}
          </p>
        </div>
      </div>
      <ResourceState resource={subscription}>
        {subscription.data && <>
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <Period title="Kỳ hiện tại" period={subscription.data.currentSubscription} plans={plans.data} currentPlan={currentPlan} />
            <Period title="Kỳ kế tiếp" period={subscription.data.scheduledSubscription} plans={plans.data} />
          </div>
          {currentSub && <div className="border-t border-outline-variant/20 pt-4">
            <h3 className="text-sm font-bold text-primary mb-3">Quyền lợi đang áp dụng cho tiệm</h3>
            <FeatureList features={subscription.data.features} />
          </div>}
        </>}
      </ResourceState>
    </section>

    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="mb-1 text-xl font-bold text-primary">Các gói đang mở bán</h2>
          <p className="text-sm text-on-surface-variant">
            {permissions.canPurchase
              ? 'Tài khoản khách hàng hoặc chủ tiệm có thể tạo đơn mua kỳ dịch vụ khi có quyền chủ của cửa hàng đã chọn. Kỳ tiếp theo được sắp lịch theo hệ thống; không đổi gói tức thì.'
              : 'Tài khoản cần quyền khách hàng hoặc chủ tiệm để tạo đơn và gửi chứng từ.'}
          </p>
        </div>
      </div>
      {currentSub && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-xs sm:text-sm text-primary flex items-center gap-2">
          <span>💡</span>
          <span>
            Tiệm của bạn đang sử dụng <strong>{cleanPresentationLabel(currentPlan?.name, 'Gói dịch vụ')}</strong>. Bạn có thể chọn <strong>Gia hạn kỳ tiếp theo</strong> hoặc <strong>Nâng cấp lên gói cao hơn</strong>. Kỳ mới sẽ được tự động kích hoạt nối tiếp sau kỳ hiện tại.
          </span>
        </div>
      )}
      <ResourceState resource={plans}>
        <PlanCards
          plans={plans.data}
          canSelect={permissions.canPurchase && subscription.status === 'ready' && !selected}
          busy={locked}
          currentPlan={currentPlan}
          currentPlanId={currentSub?.planId}
          currentPlanCode={currentSub?.planCode}
          scheduledPlanId={subscription.data?.scheduledSubscription?.planId}
          onSelect={(plan) => {
            if (canOrderPlan(plan)) {
              setSelected(plan)
              setError(null)
            } else {
              setError(new Error('Gói thiếu thông tin hoặc không còn mở bán.'))
            }
          }}
        />
      </ResourceState>
    </section>

    {selected && (
      <VendorConfirm
        title={
          (currentSub && (currentSub.planId === selected.id || currentSub.planCode && currentSub.planCode === selected.code))
            ? 'Xác nhận gia hạn gói dịch vụ'
            : (currentPlan && Number(selected.monthlyPrice) > Number(currentPlan.monthlyPrice || 0))
              ? 'Xác nhận nâng cấp gói dịch vụ'
              : 'Xác nhận mua gói dịch vụ'
        }
        label={attempt ? 'Thử lại yêu cầu' : 'Xác nhận tạo đơn'}
        busy={locked}
        onClose={() => { setSelected(null); setAttempt(null); setError(null) }}
        onConfirm={purchase}
        error={error && <SubscriptionError error={error} />}
      >
        <dl className="sc-vendor-summary-grid">
          <div><dt>Gói dịch vụ</dt><dd>{cleanPresentationLabel(selected.name, 'Chưa có tên gói')}</dd></div>
          <div><dt>Giá mỗi tháng</dt><dd>{formatSubscriptionMoney(selected.monthlyPrice, selected.currency)}</dd></div>
          <div><dt>Chu kỳ đăng ký</dt><dd>{selected.billingPeriodMonths} tháng</dd></div>
          <div><dt>Tổng tiền dự kiến</dt><dd>{selected.currency === 'VND' ? vendorMoney(selected.monthlyPrice * selected.billingPeriodMonths) : formatSubscriptionMoney(selected.monthlyPrice * selected.billingPeriodMonths, selected.currency)}</dd></div>
        </dl>
        <p className="text-sm text-on-surface-variant">
          {currentSub
            ? 'Đơn mua mới sẽ được lên lịch tự động cho kỳ tiếp theo ngay sau khi kỳ hiện tại kết thúc.'
            : 'Tạo đơn chưa đồng nghĩa đã thanh toán hoặc kích hoạt. Số tiền chính thức được chốt trong đơn mua gói.'}
        </p>
      </VendorConfirm>
    )}
    {error && !selected && <SubscriptionError error={error} />}
    <section><div className="mb-4 flex flex-wrap items-center gap-3"><h2 className="mr-auto text-xl font-bold">Lịch sử mua gói</h2><label>Trạng thái <select value={status} disabled={locked} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="rounded-xl border p-2"><option value="">Tất cả</option>{['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'].map((value) => <option key={value} value={value}>{subscriptionStatusLabel(value)}</option>)}</select></label><RefreshButton disabled={locked} onClick={refresh} className="rounded-xl border px-3 py-2">Làm mới</RefreshButton></div>
      <ResourceState resource={history}>{history.data && <>{history.data.result.length ? <ul className="space-y-3">{history.data.result.map((order) => <li key={order.id}><button disabled={locked} onClick={() => setOrderId(order.id)} className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-left disabled:opacity-40"><span className="block break-all font-bold">{displayReference(order.id, 'SUB', order.orderNumber)} · {cleanPresentationLabel(order.planNameSnapshot || order.planCodeSnapshot, 'Chưa có tên gói')}</span><span>{formatSubscriptionMoney(order.totalAmount, order.currency)} · {subscriptionStatusLabel(order.status)} · {formatSubscriptionDate(order.createdAt)}</span></button></li>)}</ul> : <p>Chưa có đơn mua gói phù hợp.</p>}{history.data.meta.pages > 1 && <CatalogPagination meta={history.data.meta} onPage={(value) => { if (!locked) setPage(value) }} />}</>}</ResourceState>
      {orderId && <SubscriptionOrderDetail key={orderId} orderId={orderId} bakeryId={bakeryId} roles={roles} revision={detailRevision} onChanged={refresh} onBusy={(value) => { setDetailBusy(value); onBusy(value) }} />}
    </section><p className="text-sm text-on-surface-variant">Để mua kỳ dịch vụ tiếp theo, tạo đơn mới và chờ xác nhận thanh toán. Liên hệ quản trị viên nếu cần điều chỉnh gói.</p>
  </div>
}

export default function VendorSubscriptionPage({ routeSearch = '', onNavigate }) {
  const { roles } = useAuth()
  const owner = useVendorBakery(routeSearch)
  const { bakeryId } = owner
  const [busy, setBusy] = useState(false)
  const activeBakeryId = bakeryId || new URLSearchParams(routeSearch).get('bakeryId') || ''
  const plans = useCatalogResource(loadOwnerPlans)
  return <VendorFrame owner={owner} title="Gói dịch vụ" activeTab="subscription" bakeryId={activeBakeryId} onNavigate={onNavigate} bakerySelectionDisabled={busy}>

    {activeBakeryId ? <><BakeryWorkspace key={activeBakeryId} bakeryId={activeBakeryId} roles={roles} plans={plans} onBusy={setBusy} initialPlanId={new URLSearchParams(routeSearch).get("planId") || null} /></> : <><p>Chọn cửa hàng để xem kỳ dịch vụ và lịch sử mua gói.</p><ResourceState resource={plans}><PlanCards plans={plans.data} /></ResourceState></>}
  </VendorFrame>
}
