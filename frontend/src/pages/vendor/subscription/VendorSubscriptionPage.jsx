import React, { useState } from 'react'
import VendorSidebar from '../../../layouts/vendor/VendorSidebar.jsx'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionPlans, loadBakerySubscription, loadSubscriptionOrders, subscriptionService } from '../../../services/subscriptionService.js'
import { canOrderPlan, isSubscriptionId, subscriptionPermissions, formatSubscriptionDate, formatSubscriptionMoney, subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { FeatureList, PlanCards, ResourceState, SubscriptionError } from '../../../components/subscription/SubscriptionView.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { vendorRoute } from '../../../routes/catalogNavigation.js'
import SubscriptionOrderDetail from './SubscriptionOrderDetail.jsx'
import { PortalHeader } from '../../../components/common/WorkspaceUI.jsx'

function Period({ title, period }) {
  return <div className="rounded-xl bg-background p-4"><h3 className="font-bold">{title}</h3>{period ? <><p>{period.planCode || 'Chưa có mã gói'} · {subscriptionStatusLabel(period.status)}</p><p className="text-sm">{formatSubscriptionDate(period.periodStart)} → {formatSubscriptionDate(period.periodEnd)}</p></> : <p>Chưa có kỳ dịch vụ này.</p>}</div>
}

function BakeryWorkspace({ bakeryId, roles, plans, onBusy }) {
  const subscription = useCatalogResource(loadBakerySubscription, { bakeryId })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const history = useCatalogResource(loadSubscriptionOrders, { bakeryId, page, size: 10, sort: 'createdAt,desc', status })
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
    const request = attempt || { bakeryId, planId: selected.id, key: crypto.randomUUID() }
    setAttempt(request); setBusy(true); onBusy(true); setError(null)
    try { const order = await subscriptionService.createOrder(request); setOrderId(order.id); setSelected(null); setAttempt(null); refresh() }
    catch (failure) { setError(failure) }
    finally { setBusy(false); onBusy(false) }
  }
  const locked = busy || detailBusy
  return <div className="space-y-7">
    <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5"><h2 className="mb-4 text-xl font-bold">Trạng thái dịch vụ</h2><ResourceState resource={subscription}>{subscription.data && <><div className="mb-4 grid gap-4 md:grid-cols-2"><Period title="Kỳ hiện tại" period={subscription.data.currentSubscription} /><Period title="Kỳ kế tiếp" period={subscription.data.scheduledSubscription} /></div><FeatureList features={subscription.data.features} /></>}</ResourceState></section>
    <section><h2 className="mb-3 text-xl font-bold">Các gói đang mở bán</h2><p className="mb-4 text-sm">{permissions.canPurchase ? 'Chủ tiệm có thể tạo đơn mua kỳ dịch vụ. Backend kiểm tra quyền chủ của cửa hàng đã chọn. Kỳ tiếp theo được sắp lịch theo backend; không đổi gói tức thì.' : 'Nhân viên có thể xem trạng thái và lịch sử; chỉ chủ tiệm được tạo đơn và gửi chứng từ.'}</p><ResourceState resource={plans}><PlanCards plans={plans.data} canSelect={permissions.canPurchase && subscription.status === 'ready' && !selected} busy={locked} onSelect={(plan) => { if (canOrderPlan(plan)) { setSelected(plan); setError(null) } else setError(new Error('Gói thiếu thông tin hoặc không còn mở bán.')) }} /></ResourceState></section>
    {selected && <section className="rounded-2xl border border-secondary p-5"><h3 className="font-bold">Xác nhận tạo đơn: {selected.name || selected.code}</h3><p>{formatSubscriptionMoney(selected.monthlyPrice, selected.currency)} / tháng · Chu kỳ {selected.billingPeriodMonths} tháng. Tổng tiền chính thức lấy từ đơn backend.</p><p className="my-3 text-sm">Tạo đơn không đồng nghĩa đã thanh toán hoặc kích hoạt dịch vụ.</p><div className="flex flex-wrap gap-3"><button disabled={locked} onClick={purchase} className="rounded-xl bg-primary px-5 py-3 text-on-primary disabled:opacity-40">{busy ? 'Đang tạo…' : attempt ? 'Thử lại cùng yêu cầu' : 'Tạo đơn mua gói'}</button><button disabled={locked} onClick={() => { setSelected(null); setAttempt(null); setError(null) }} className="rounded-xl border px-5 py-3">Đóng</button></div></section>}
    {error && <SubscriptionError error={error} />}
    <section><div className="mb-4 flex flex-wrap items-center gap-3"><h2 className="mr-auto text-xl font-bold">Lịch sử mua gói</h2><label>Trạng thái <select value={status} disabled={locked} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="rounded-xl border p-2"><option value="">Tất cả</option>{['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'].map((value) => <option key={value} value={value}>{subscriptionStatusLabel(value)}</option>)}</select></label><button disabled={locked} onClick={refresh} className="rounded-xl border px-3 py-2">Làm mới</button></div>
      <ResourceState resource={history}>{history.data && <>{history.data.result.length ? <ul className="space-y-3">{history.data.result.map((order) => <li key={order.id}><button disabled={locked} onClick={() => setOrderId(order.id)} className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-left disabled:opacity-40"><span className="block break-all font-bold">{order.orderNumber || order.id} · {order.planNameSnapshot || order.planCodeSnapshot || 'Chưa có tên gói'}</span><span>{formatSubscriptionMoney(order.totalAmount, order.currency)} · {subscriptionStatusLabel(order.status)} · {formatSubscriptionDate(order.createdAt)}</span></button></li>)}</ul> : <p>Chưa có đơn mua gói phù hợp.</p>}<CatalogPagination meta={history.data.meta} onPage={(value) => { if (!locked) setPage(value) }} /></>}</ResourceState>
      {orderId && <SubscriptionOrderDetail key={orderId} orderId={orderId} bakeryId={bakeryId} roles={roles} revision={detailRevision} onChanged={refresh} onBusy={(value) => { setDetailBusy(value); onBusy(value) }} />}
    </section><p className="text-sm text-on-surface-variant">Backend chưa hỗ trợ tự hủy, hoàn tiền, gia hạn tự động hoặc nâng cấp tức thì. Để mua kỳ tiếp theo, tạo đơn mới và chờ xác nhận thanh toán.</p>
  </div>
}

export default function VendorSubscriptionPage({ routeSearch = '', onNavigate }) {
  const { user, roles } = useAuth()
  const initial = (new URLSearchParams(routeSearch).get('bakeryId') || '').toLowerCase()
  const [input, setInput] = useState(initial)
  const [bakeryId, setBakeryId] = useState(isSubscriptionId(initial) ? initial : '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [mobile, setMobile] = useState(false)
  const plans = useCatalogResource(loadSubscriptionPlans)
  function selectBakery(event) {
    event.preventDefault()
    if (busy) return
    const value = input.trim().toLowerCase()
    if (!isSubscriptionId(value)) return setError(new Error('Mã cửa hàng phải là UUID hợp lệ.'))
    setError(null)
    setBakeryId(value)
    onNavigate('vendor-subscription?bakeryId=' + value)
  }
  return <div className="sc-portal sc-portal--vendor"><VendorSidebar activeTab="subscription" showMockBadges={false} onNavigate={(route) => onNavigate(vendorRoute(route, bakeryId))} isMobileOpen={mobile} onCloseMobile={() => setMobile(false)} /><div className="min-w-0"><PortalHeader title="Gói dịch vụ" user={user} portal="Đối tác" onMenu={() => setMobile(true)} /><main id="workspace-content" className="sc-portal-main"><div className="sc-workspace">
    <form onSubmit={selectBakery} className="sc-panel space-y-3"><label className="block font-bold" htmlFor="subscription-bakery">Cửa hàng cần quản lý</label><p className="text-sm">Nhập mã cửa hàng bạn được phân quyền quản lý. Hệ thống hiện chưa có API liệt kê cửa hàng của tài khoản.</p><div className="flex flex-wrap gap-3"><input id="subscription-bakery" value={input} onChange={(event) => setInput(event.target.value)} disabled={busy} placeholder="bakeryId (UUID)" className="min-w-0 flex-1 rounded-xl border p-3" required /><button disabled={busy} className="rounded-xl bg-primary px-5 py-3 text-on-primary disabled:opacity-40">Xem cửa hàng</button></div></form>
    {error && <SubscriptionError error={error} />}{bakeryId ? <><p className="break-all text-sm">Cửa hàng đang xem: {bakeryId}</p><BakeryWorkspace key={bakeryId} bakeryId={bakeryId} roles={roles} plans={plans} onBusy={setBusy} /></> : <><p>Chọn cửa hàng để xem kỳ dịch vụ và lịch sử mua gói.</p><ResourceState resource={plans}><PlanCards plans={plans.data} /></ResourceState></>}
  </div></main></div></div>
}
