import { useViewportPageSize } from '../../../hooks/useViewportPageSize.js'
import { vendorMoney } from '../../../services/vendorPresentation.js'
import { displayReference } from '../../../services/displayReference.js'
import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { VendorConfirm } from '../../../components/common/VendorUi.jsx'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import React, { useRef, useState } from 'react'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionPlans, loadBakerySubscription, loadSubscriptionOrders, subscriptionService } from '../../../services/subscriptionService.js'
import { canOrderPlan, subscriptionPermissions, formatSubscriptionDate, formatSubscriptionMoney, subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { PlanCards, ResourceState, SubscriptionError } from '../../../components/subscription/SubscriptionView.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import SubscriptionOrderDetail from './SubscriptionOrderDetail.jsx'

const loadOwnerPlans = (_params, options) => loadSubscriptionPlans(undefined, { ...options, allowMockFallback: false })

function BakeryWorkspace({ bakeryId, roles, plans, onBusy, initialPlanId, initialOrderId }) {
  const subscription = useCatalogResource(loadBakerySubscription, { bakeryId })
  const [page, setPage] = useState(1)
  const { containerRef, pageSize } = useViewportPageSize(() => setPage(1))
  const [status, setStatus] = useState('')
  const history = useCatalogResource(loadSubscriptionOrders, { bakeryId, page, size: pageSize, sort: 'createdAt,desc', status })
  const inFlight = useRef(false)
  const [selection, setSelected] = useState(undefined)
  const selected = selection === undefined ? (initialPlanId && plans.data?.find((plan) => plan.id === initialPlanId && canOrderPlan(plan))) || null : selection
  const [attempt, setAttempt] = useState(null)
  const [busy, setBusy] = useState(false)
  const [detailBusy, setDetailBusy] = useState(false)
  const [error, setError] = useState(null)
  const [orderId, setOrderId] = useState(initialOrderId || null)
  const [detailRevision, setDetailRevision] = useState(0)
  const permissions = subscriptionPermissions(roles)
  const refresh = () => { history.reload(); subscription.reload(); setDetailRevision((value) => value + 1) }
  async function purchase() {
    if (inFlight.current || busy || !selected) return
    inFlight.current = true
    const request = attempt || { bakeryId, planId: selected.id, key: crypto.randomUUID() }
    setAttempt(request); setBusy(true); onBusy(true); setError(null)
    try { const order = await subscriptionService.createOrder(request); setOrderId(order.id); setPage(1); setStatus(''); setSelected(null); setAttempt(null); refresh() }
    catch (failure) { setError(failure) }
    finally { inFlight.current = false; setBusy(false); onBusy(false) }
  }
  const locked = busy || detailBusy
  const currentSub = subscription.error || subscription.status !== 'ready' ? null : subscription.data?.currentSubscription
  const currentPlan = plans.data?.find(p => p.id === currentSub?.planId || p.code === currentSub?.planCode)
  return <div className="space-y-6">
    {subscription.error && <SubscriptionError error={subscription.error} />}

    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="mb-1 text-xl font-bold text-primary">Các gói đang mở bán</h2>

        </div>
      </div>
      <ResourceState resource={plans}>
        <PlanCards showDescription={false}
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
    <section ref={containerRef}><div className="mb-4 flex flex-wrap items-center gap-3"><h2 className="mr-auto text-xl font-bold">Lịch sử mua gói</h2><label>Trạng thái <select value={status} disabled={locked} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="rounded-xl border p-2"><option value="">Tất cả</option>{['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'].map((value) => <option key={value} value={value}>{subscriptionStatusLabel(value)}</option>)}</select></label></div>
      <ResourceState resource={history}>{history.data && <>{history.data.result.length ? <ul className="space-y-3">{history.data.result.map((order) => <li key={order.id}><button disabled={locked} aria-expanded={orderId === order.id} onClick={() => setOrderId(current => current === order.id ? null : order.id)} className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-left disabled:opacity-40"><span className="block break-all font-bold">{displayReference(order.id, 'SUB', order.orderNumber)} · {cleanPresentationLabel(order.planNameSnapshot || order.planCodeSnapshot, 'Chưa có tên gói')}</span><span>{formatSubscriptionMoney(order.totalAmount, order.currency)} · {subscriptionStatusLabel(order.status)} · {formatSubscriptionDate(order.createdAt)}</span></button>{orderId === order.id && <div className="mt-3"><SubscriptionOrderDetail key={orderId} orderId={orderId} bakeryId={bakeryId} roles={roles} revision={detailRevision} onChanged={refresh} onBusy={(value) => { setDetailBusy(value); onBusy(value) }} /></div>}</li>)}</ul> : <p>Chưa có đơn mua gói phù hợp.</p>}{history.data.meta.pages > 1 && <CatalogPagination meta={history.data.meta} onPage={(value) => { if (!locked) setPage(value) }} />}</>}</ResourceState>

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

    {activeBakeryId ? <><BakeryWorkspace key={activeBakeryId} bakeryId={activeBakeryId} roles={roles} plans={plans} onBusy={setBusy} initialPlanId={new URLSearchParams(routeSearch).get("planId") || null} initialOrderId={new URLSearchParams(routeSearch).get('orderId')} /></> : <><p>Chọn cửa hàng để xem kỳ dịch vụ và lịch sử mua gói.</p><ResourceState resource={plans}><PlanCards showDescription={false} plans={plans.data} /></ResourceState></>}
  </VendorFrame>
}
