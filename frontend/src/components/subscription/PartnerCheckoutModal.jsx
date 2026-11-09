import React, { useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { onboardingService } from '../../services/onboardingService.js'
import { subscriptionService, loadSubscriptionOrders } from '../../services/subscriptionService.js'
import { formatSubscriptionMoney, subscriptionStatusLabel } from '../../services/subscriptionModels.js'
import { planName } from '../../services/planPresentation.js'
import { ResourceState, SubscriptionError } from './SubscriptionView.jsx'
import { buttonClass, inputClass } from '../management/ApiState.jsx'
import ModalSurface from '../common/ModalSurface.jsx'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import SubscriptionOrderDetail from '../../pages/vendor/subscription/SubscriptionOrderDetail.jsx'

const loadOnboarding = ({ enabled }, options) => enabled ? onboardingService.get(null, options) : Promise.resolve(null)

function PartnerOrders({ bakery, plan, roles, onBusy, onNavigate }) {
  const [page, setPage] = useState(1)
  const history = useCatalogResource(loadSubscriptionOrders, { bakeryId: bakery.id, page, size: 10, sort: 'createdAt,desc' })
  const [orderId, setOrderId] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(null), [revision, setRevision] = useState(0)
  const inFlight = useRef(false)
  async function run(action) {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); onBusy(true); setError(null)
    try { await action() } catch (failure) { setError(failure) }
    finally { inFlight.current = false; setBusy(false); onBusy(false) }
  }
  const refresh = () => { history.reload(); setRevision((value) => value + 1) }
  return <div className="space-y-4">
    <p>Hồ sơ tiệm: <strong>{bakery.name}</strong> · {bakery.status === 'ACTIVE' ? 'Đã được duyệt' : bakery.status === 'DRAFT' ? 'Cần cập nhật hồ sơ' : 'Đang chờ quản trị viên duyệt'}</p>
    <p>Gói được kích hoạt sau khi chứng từ được phê duyệt. Quyền chủ tiệm yêu cầu cả hồ sơ được duyệt và kỳ dịch vụ có hiệu lực.</p>
    <button className={buttonClass} disabled={busy || history.status !== 'ready'} onClick={() => run(async () => {
      const request = attempt || { bakeryId: bakery.id, planId: plan.id, key: crypto.randomUUID() }
      setAttempt(request)
      const order = await subscriptionService.createOrder(request)
      setOrderId(order.id); setAttempt(null); refresh()
    })}>{busy ? 'Đang xử lý…' : attempt ? 'Thử lại tạo đơn' : 'Tạo đơn mua ' + planName(plan)}</button>
    <ResourceState resource={history}>
      <label className="block">Đơn mua gói gần đây<select className={inputClass} disabled={busy} value={orderId || ''} onChange={(event) => setOrderId(event.target.value || null)}><option value="">Chọn đơn để xem / gửi chứng từ</option>{history.data?.result.map((order) => <option key={order.id} value={order.id}>{order.orderNumber || order.id} · {subscriptionStatusLabel(order.status)}</option>)}</select></label>
      {history.data?.result.length === 0 && <p>Chưa có đơn mua gói.</p>}
      {history.data?.meta.pages > 1 && <CatalogPagination meta={history.data.meta} onPage={(value) => { if (!busy) setPage(value) }} />}
    </ResourceState>
    {orderId && <SubscriptionOrderDetail key={orderId} orderId={orderId} bakeryId={bakery.id} roles={roles} revision={revision} onChanged={refresh} onBusy={(value) => { setBusy(value); onBusy(value) }} />}
    <button className={buttonClass} disabled={busy} onClick={() => run(async () => {
      await onboardingService.complete(bakery.id)
      onNavigate?.('vendor-dashboard?bakeryId=' + bakery.id)
    })}>Kiểm tra phê duyệt và vào cổng đối tác</button>
    {error && <SubscriptionError error={error} />}
  </div>
}

export default function PartnerCheckoutModal({ plan, onClose, onNavigate }) {
  const { user, roles } = useAuth()
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [submitted, setSubmitted] = useState(null)
  const resource = useCatalogResource(loadOnboarding, { enabled: roles.includes('CUSTOMER') && !roles.includes('BAKERY_OWNER') })
  const inFlight = useRef(false)
  const bakery = submitted || resource.data
  async function submit(event) {
    event.preventDefault()
    if (inFlight.current) return
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    const address = { addressLine: fields.addressLine, ward: fields.ward, district: fields.district, city: fields.city, isPrimary: true }
    const defaultServiceArea = { city: fields.city, district: fields.district, deliveryFee: 0, minimumOrder: 0, active: true }
    const defaultBusinessHours = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
      dayOfWeek: day,
      closed: false,
      opensAt: '08:00',
      closesAt: '20:00',
    }))
    inFlight.current = true; setBusy(true); setError(null)
    try {
      setSubmitted(await onboardingService.submit({
        name: fields.name,
        phoneNumber: fields.phoneNumber,
        email: fields.email,
        operations: { addresses: [address], serviceAreas: [defaultServiceArea], businessHours: defaultBusinessHours },
      }))
    } catch (failure) { setError(failure) }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <ModalSurface label="Đăng ký đối tác tiệm bánh" busy={busy} onClose={onClose} className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-surface p-6 sm:p-8 shadow-2xl border border-primary/20">
    <header className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold text-primary">Đăng ký {planName(plan)}</h2><button type="button" disabled={busy} data-modal-close aria-label="Đóng">×</button></header>
    <p className="my-4">{formatSubscriptionMoney(plan.monthlyPrice, plan.currency)} / tháng · Chu kỳ {plan.billingPeriodMonths} tháng</p>
    {!user ? <><p>Vui lòng đăng nhập tài khoản khách hàng để đăng ký tiệm bánh.</p><button className={buttonClass} onClick={() => onNavigate?.('login')}>Đăng nhập</button></>
      : roles.includes('BAKERY_OWNER') ? <button className={buttonClass} onClick={() => onNavigate?.('vendor-subscription?planId=' + plan.id)}>Quản lý và mua gói cho tiệm</button>
        : !roles.includes('CUSTOMER') ? <p>Tài khoản khách hàng mới có thể đăng ký đối tác.</p>
          : <ResourceState resource={resource}>{bakery && bakery.status !== 'DRAFT' ? <PartnerOrders bakery={bakery} plan={plan} roles={roles} onBusy={setBusy} onNavigate={onNavigate} /> : <form onSubmit={submit} className="space-y-3">
            <fieldset disabled={busy} className="grid gap-3">{[['name', 'Tên tiệm bánh', 180], ['phoneNumber', 'Số điện thoại', 30], ['email', 'Email', 320], ['addressLine', 'Địa chỉ bếp / xưởng', 255], ['ward', 'Phường / xã', 120], ['district', 'Quận / huyện', 120], ['city', 'Tỉnh / thành phố', 120]].map(([name, label, maxLength]) => <label key={name}>{label}<input className={inputClass} name={name} maxLength={maxLength} required={!['email', 'ward'].includes(name)} type={name === 'email' ? 'email' : name === 'phoneNumber' ? 'tel' : 'text'} defaultValue={bakery?.[name] || (name === 'email' ? user.email : '')} /></label>)}</fieldset>
            <button className={buttonClass} disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi hồ sơ tiệm bánh'}</button>
          </form>}</ResourceState>}
    {error && <SubscriptionError error={error} />}
  </ModalSurface>
}
