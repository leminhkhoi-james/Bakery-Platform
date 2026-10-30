import { vendorMoney } from '../../../services/vendorPresentation.js'
import { displayReference } from '../../../services/displayReference.js'
import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { VendorConfirm } from '../../../components/common/VendorUi.jsx'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import React, { useRef, useState } from 'react'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionPlans, loadBakerySubscription, loadSubscriptionOrders, subscriptionService } from '../../../services/subscriptionService.js'
import { canOrderPlan, subscriptionPermissions, formatSubscriptionDate, formatSubscriptionMoney, subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { FeatureList, PlanCards, ResourceState, SubscriptionError } from '../../../components/subscription/SubscriptionView.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import SubscriptionOrderDetail from './SubscriptionOrderDetail.jsx'

function Period({ title, period, plans }) {
  return <div className="rounded-xl bg-background p-4"><h3 className="font-bold">{title}</h3>{period ? <><p>{cleanPresentationLabel(plans?.find(plan => plan.id === period.planId)?.name, 'Gói dịch vụ đã đăng ký')} · {subscriptionStatusLabel(period.status)}</p><p className="text-sm">{formatSubscriptionDate(period.periodStart)} → {formatSubscriptionDate(period.periodEnd)}</p></> : <p>{title === 'Kỳ hiện tại' ? 'Tiệm chưa đăng ký gói dịch vụ' : 'Chưa có kỳ dịch vụ kế tiếp'}</p>}</div>
}

function BakeryWorkspace({ bakeryId, roles, plans, onBusy }) {
  const subscription = useCatalogResource(loadBakerySubscription, { bakeryId })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const history = useCatalogResource(loadSubscriptionOrders, { bakeryId, page, size: 10, sort: 'createdAt,desc', status })
  const inFlight = useRef(false)
  const [selected, setSelected] = useState(null)
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
  return <div className="space-y-4">
    <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5"><h2 className="mb-4 text-xl font-bold">Trạng thái dịch vụ</h2><ResourceState resource={subscription}>{subscription.data && <><div className="mb-4 grid gap-4 md:grid-cols-2"><Period title="Kỳ hiện tại" period={subscription.data.currentSubscription} plans={plans.data} /><Period title="Kỳ kế tiếp" period={subscription.data.scheduledSubscription} plans={plans.data} /></div><FeatureList features={subscription.data.features} /></>}</ResourceState></section>
    <section><h2 className="mb-3 text-xl font-bold">Các gói đang mở bán</h2><ResourceState resource={plans}><PlanCards plans={plans.data} canSelect={permissions.canPurchase && subscription.status === 'ready' && !selected} busy={locked} onSelect={(plan) => { if (canOrderPlan(plan)) { setSelected(plan); setError(null) } else setError(new Error('Gói thiếu thông tin hoặc không còn mở bán.')) }} /></ResourceState></section>
    {selected && <VendorConfirm title="Xác nhận mua gói dịch vụ" label={attempt ? 'Thử lại yêu cầu' : 'Xác nhận tạo đơn'} busy={locked} onClose={() => { setSelected(null); setAttempt(null); setError(null) }} onConfirm={purchase} error={error && <SubscriptionError error={error} />}><dl className="sc-vendor-summary-grid"><div><dt>Gói dịch vụ</dt><dd>{cleanPresentationLabel(selected.name, 'Chưa có tên gói')}</dd></div><div><dt>Giá mỗi tháng</dt><dd>{formatSubscriptionMoney(selected.monthlyPrice, selected.currency)}</dd></div><div><dt>Chu kỳ đăng ký</dt><dd>{selected.billingPeriodMonths} tháng</dd></div><div><dt>Tổng tiền dự kiến</dt><dd>{selected.currency === 'VND' ? vendorMoney(selected.monthlyPrice * selected.billingPeriodMonths) : formatSubscriptionMoney(selected.monthlyPrice * selected.billingPeriodMonths, selected.currency)}</dd></div></dl><p className="text-sm">Tạo đơn chưa đồng nghĩa đã thanh toán hoặc kích hoạt. Số tiền chính thức được chốt trong đơn mua gói.</p></VendorConfirm>}
    {error && !selected && <SubscriptionError error={error} />}
    <section><div className="mb-4 flex flex-wrap items-center gap-3"><h2 className="mr-auto text-xl font-bold">Lịch sử mua gói</h2><label>Trạng thái <select value={status} disabled={locked} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="rounded-xl border p-2"><option value="">Tất cả</option>{['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'].map((value) => <option key={value} value={value}>{subscriptionStatusLabel(value)}</option>)}</select></label><RefreshButton disabled={locked} onClick={refresh} className="rounded-xl border px-3 py-2">Làm mới</RefreshButton></div>
      <ResourceState resource={history}>{history.data && <>{history.data.result.length ? <ul className="space-y-3">{history.data.result.map((order) => <li key={order.id}><button disabled={locked} onClick={() => setOrderId(order.id)} className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-left disabled:opacity-40"><span className="block break-all font-bold">{displayReference(order.id, 'SUB', order.orderNumber)} · {cleanPresentationLabel(order.planNameSnapshot || order.planCodeSnapshot, 'Chưa có tên gói')}</span><span>{formatSubscriptionMoney(order.totalAmount, order.currency)} · {subscriptionStatusLabel(order.status)} · {formatSubscriptionDate(order.createdAt)}</span></button></li>)}</ul> : <p>Chưa có đơn mua gói phù hợp.</p>}{history.data.meta.pages > 1 && <CatalogPagination meta={history.data.meta} onPage={(value) => { if (!locked) setPage(value) }} />}</>}</ResourceState>
      {orderId && <SubscriptionOrderDetail key={orderId} orderId={orderId} bakeryId={bakeryId} roles={roles} revision={detailRevision} onChanged={refresh} onBusy={(value) => { setDetailBusy(value); onBusy(value) }} />}
    </section><p className="text-sm text-on-surface-variant">Để mua kỳ dịch vụ tiếp theo, tạo đơn mới và chờ xác nhận thanh toán. Liên hệ quản trị viên nếu cần điều chỉnh gói.</p>
  </div>
}

export default function VendorSubscriptionPage({ routeSearch = '', onNavigate }) {
  const { roles } = useAuth()
  const { bakeryId, selectBakery: setBakeryId } = useVendorBakery(routeSearch)
  const [busy, setBusy] = useState(false)
  const plans = useCatalogResource(loadSubscriptionPlans)
  return <VendorFrame title="Gói dịch vụ" activeTab="subscription" bakeryId={bakeryId} onNavigate={onNavigate}>
    <BakerySelector key={bakeryId} bakeryId={bakeryId} onSelect={(value) => { setBakeryId(value); onNavigate('vendor-subscription?bakeryId=' + value) }} disabled={busy} />
    {bakeryId ? <><BakeryWorkspace key={bakeryId} bakeryId={bakeryId} roles={roles} plans={plans} onBusy={setBusy} /></> : <><p>Chọn cửa hàng để xem kỳ dịch vụ và lịch sử mua gói.</p><ResourceState resource={plans}><PlanCards plans={plans.data} /></ResourceState></>}
  </VendorFrame>
}
