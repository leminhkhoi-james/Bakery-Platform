import { phoneError, emailError } from '../../services/contactValidation.js'
import { loadAddresses, selectedAddress } from '../../services/addressService.js'
import React, { useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { onboardingService } from '../../services/onboardingService.js'
import { subscriptionService, loadSubscriptionOrders } from '../../services/subscriptionService.js'
import { formatSubscriptionMoney, subscriptionStatusLabel } from '../../services/subscriptionModels.js'
import { displayReference } from '../../services/displayReference.js'
import { planName } from '../../services/planPresentation.js'
import { ResourceState, SubscriptionError } from './SubscriptionView.jsx'
import { buttonClass, inputClass } from '../management/ApiState.jsx'
import ModalSurface from '../common/ModalSurface.jsx'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import SubscriptionOrderDetail from '../../pages/vendor/subscription/SubscriptionOrderDetail.jsx'
import { usePartnerActivation } from '../../hooks/usePartnerActivation.js'

const loadOnboarding = ({ enabled }, options) => enabled ? onboardingService.get(null, options) : Promise.resolve(null)

function getBakeryStatusBadge(status) {
  switch (status) {
    case 'PENDING_APPROVAL':
    case 'PENDING':
      return {
        label: 'Đang chờ duyệt',
        text: 'Hồ sơ đang chờ duyệt',
        classes: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: 'hourglass_top',
        description: 'Hồ sơ tiệm đang được Ban quản trị xem xét. Trong thời gian này, bạn không cần gửi lại hồ sơ.',
      }
    case 'ACTIVE':
    case 'APPROVED':
      return {
        label: 'Đã duyệt',
        text: 'Đã phê duyệt',
        classes: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        icon: 'verified',
        description: 'Hồ sơ tiệm đã được duyệt. Khi gói dịch vụ có hiệu lực, quyền chủ tiệm sẽ tự cập nhật.',
      }
    case 'REJECTED':
      return {
        label: 'Cần bổ sung',
        text: 'Cần cập nhật lại',
        classes: 'bg-rose-100 text-rose-900 border-rose-300',
        icon: 'cancel',
        description: 'Hồ sơ tiệm chưa đạt yêu cầu. Vui lòng kiểm tra lại thông tin và bổ sung hồ sơ theo hướng dẫn.',
      }
    case 'DRAFT':
    default:
      return {
        label: 'Bản nháp',
        text: 'Chưa gửi duyệt',
        classes: 'bg-stone-100 text-stone-900 border-stone-300',
        icon: 'edit_note',
        description: 'Thông tin tiệm đang ở dạng bản nháp. Vui lòng hoàn tất thông tin và gửi đăng ký.',
      }
  }
}

function PartnerOrders({ bakery, plan, roles, onBusy, onCheckApproval, checkingApproval, subscription, checkedAt }) {
  const [page, setPage] = useState(1)
  const history = useCatalogResource(loadSubscriptionOrders, { bakeryId: bakery.id, page, size: 10, sort: 'createdAt,desc' })
  const [selectedOrderId, setOrderId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [revision, setRevision] = useState(0)
  const [successNotice, setSuccessNotice] = useState(null)
  const inFlight = useRef(false)

  const orders = history.data?.result || []
  const openOrder = orders.find((o) => ['PENDING_PAYMENT', 'PAYMENT_REVIEW'].includes(o.status))
  const orderId = selectedOrderId || openOrder?.id || orders[0]?.id || null

  async function run(action) {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    onBusy(true)
    setError(null)
    setSuccessNotice(null)
    try {
      await action()
    } catch (failure) {
      setError(failure)
    } finally {
      inFlight.current = false
      setBusy(false)
      onBusy(false)
    }
  }

  const refresh = () => {
    history.reload()
    setRevision((value) => value + 1)
  }

  const statusInfo = getBakeryStatusBadge(bakery.status)
  const planActive = subscription?.currentSubscription?.status === 'ACTIVE'
  const bakeryApproved = bakery.status === 'ACTIVE'
  const paymentSubmitted = Boolean(orders[0] && ['PAYMENT_REVIEW', 'PAID', 'COMPLETED'].includes(orders[0].status)) || planActive
  const paymentStatus = !bakeryApproved ? 'Chờ hồ sơ được duyệt' : planActive ? 'Gói đang có hiệu lực'
    : subscription?.scheduledSubscription ? 'Đã duyệt, chờ kỳ dịch vụ bắt đầu'
    : history.status === 'loading' ? 'Đang tải trạng thái thanh toán…'
    : history.status === 'error' ? 'Chưa tải được trạng thái thanh toán'
    : orders[0] ? subscriptionStatusLabel(orders[0].status) : 'Chưa tạo đơn mua gói'
  const nextStep = !bakeryApproved ? 'Hồ sơ tiệm đang được Ban quản trị thẩm định.'
    : !planActive ? 'Hồ sơ đã được duyệt. Vui lòng hoàn tất thanh toán gói dịch vụ để kích hoạt cửa hàng.'
    : 'Hồ sơ và gói dịch vụ đã hợp lệ. Đang kích hoạt Kênh Quản Lý Tiệm Bánh.'

  return (
    <div className="space-y-4">
      {/* Bakery Info + 3-Step Stepper Card */}
      <div className={`rounded-2xl border p-4 space-y-3 ${statusInfo.classes}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">{statusInfo.icon}</span>
            <span className="font-bold text-sm">Trạng thái hồ sơ: {statusInfo.label}</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/80 border border-current">
            {statusInfo.label}
          </span>
        </div>
        <p className="text-xs leading-relaxed opacity-90">{statusInfo.description}</p>
        <div className="pt-2 text-xs border-t border-current/20 flex flex-wrap gap-x-5 gap-y-1">
          <span>Tên tiệm: <strong>{bakery.name}</strong></span>
          {bakery.phoneNumber && <span>Hotline: <strong>{bakery.phoneNumber}</strong></span>}
          {bakery.email && <span>Email: <strong>{bakery.email}</strong></span>}
        </div>
      </div>

      {/* Visual 3-Step Progress Stepper */}
      <section aria-label="Tiến độ đăng ký tiệm" className="rounded-2xl border border-primary/15 bg-surface-container-low/60 p-3.5 space-y-2.5">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-primary/15 shadow-2xs">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${bakeryApproved ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
              {bakeryApproved ? '✓' : '1'}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-primary truncate">Hồ sơ đối tác</p>
              <p className="text-[11px] text-on-surface-variant truncate">{statusInfo.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-primary/15 shadow-2xs">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${!bakeryApproved ? 'bg-stone-200 text-stone-600' : planActive ? 'bg-emerald-600 text-white' : paymentSubmitted ? 'bg-amber-500 text-white' : 'bg-primary text-white'}`}>
              {planActive ? '✓' : '2'}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-primary truncate">Thanh toán gói</p>
              <p className="text-[11px] text-on-surface-variant truncate">{paymentStatus}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-primary/15 shadow-2xs">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${bakeryApproved && planActive ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'}`}>
              {bakeryApproved && planActive ? '✓' : '3'}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-primary truncate">Mở cửa hàng</p>
              <p className="text-[11px] text-on-surface-variant truncate">{bakeryApproved && planActive ? 'Sẵn sàng' : 'Chờ kích hoạt'}</p>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-on-surface-variant px-1">{nextStep}</p>
      </section>

      {/* Plan Order CTA */}
      {plan && <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-primary">Gói dịch vụ đã chọn: {planName(plan)}</h3>
            <p className="text-xs text-on-surface-variant">
              {formatSubscriptionMoney(plan.monthlyPrice, plan.currency)} / tháng · Chu kỳ thanh toán {plan.billingPeriodMonths} tháng
            </p>
          </div>
          <button
            className={buttonClass + ' text-xs py-2 px-4 shadow-sm font-bold'}
            disabled={!bakeryApproved || busy || history.status !== 'ready' || Boolean(openOrder)}
            onClick={() => run(async () => {
              if (!bakeryApproved) return
              if (openOrder) {
                setOrderId(openOrder.id)
                return
              }
              const request = attempt || { bakeryId: bakery.id, planId: plan.id, key: crypto.randomUUID() }
              setAttempt(request)
              try {
                const order = await subscriptionService.createOrder(request)
                setOrderId(order.id)
                setAttempt(null)
                const refCode = displayReference(order.id, 'SUB', order.orderNumber)
                setSuccessNotice(`Đã khởi tạo hóa đơn #${refCode}. Vui lòng thanh toán trực tuyến qua cổng VNPay bên dưới để kích hoạt gói.`)
                refresh()
              } catch (failure) {
                if ([400, 403, 404, 409, 422].includes(failure?.status)) {
                  setAttempt(null)
                  refresh()
                }
                throw failure
              }
            })}
          >
            {busy ? 'Đang khởi tạo…' : openOrder ? 'Đang có hóa đơn chờ thanh toán' : attempt ? 'Thử lại tạo đơn' : 'Tạo đơn đăng ký gói'}
          </button>
        </div>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          {bakeryApproved ? 'Hồ sơ đã được duyệt. Bạn có thể tạo đơn và thanh toán qua VNPay. Gói có hiệu lực khi hệ thống xác nhận thanh toán thành công.' : 'Bạn có thể mua gói sau khi hồ sơ được duyệt. Trong thời gian chờ, bạn chưa cần tạo đơn hoặc thanh toán.'}
        </p>
      </div>}

      {bakeryApproved && openOrder && !successNotice && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-amber-700">receipt_long</span>
          <span>Hoá đơn <strong>#{displayReference(openOrder.id, 'SUB', openOrder.orderNumber)}</strong> đang ở trạng thái <strong>{subscriptionStatusLabel(openOrder.status)}</strong>. Vui lòng bấm nút Thanh toán qua VNPay bên dưới để hoàn tất.</span>
        </div>
      )}

      {successNotice && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-800 font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{successNotice}</span>
        </div>
      )}

      {/* Subscription Order History */}
      <ResourceState resource={history}>
        {history.data?.result.length > 1 && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-primary">
              Hóa đơn dịch vụ của tiệm:
              <select
                className={inputClass + ' mt-1 text-xs'}
                disabled={busy}
                value={orderId || ''}
                onChange={(event) => setOrderId(event.target.value || null)}
              >
                {history.data.result.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{displayReference(order.id, 'SUB', order.orderNumber)} · {formatSubscriptionMoney(order.totalAmount, order.currency)} · {subscriptionStatusLabel(order.status)}
                  </option>
                ))}
              </select>
            </label>
            {history.data?.meta.pages > 1 && (
              <CatalogPagination
                meta={history.data.meta}
                onPage={(value) => { if (!busy) { setOrderId(null); setPage(value) } }}
              />
            )}
          </div>
        )}
        {!history.data?.result.length && (
          <p className="text-xs text-on-surface-variant">Chưa có hóa đơn đăng ký gói nào cho tiệm này.</p>
        )}
      </ResourceState>

      {/* Subscription Order Detail & Payment Evidence Form */}
      {orderId && (
        <SubscriptionOrderDetail
          key={orderId}
          orderId={orderId}
          bakeryId={bakery.id}
          roles={roles}
          paymentAllowed={bakeryApproved}
          revision={revision}
          onChanged={refresh}
          onBusy={(value) => { setBusy(value); onBusy(value) }}
        />
      )}

      {/* Complete Onboarding Button (if bakery is approved and plan is active) */}
      <div className="pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-on-surface-variant max-w-sm">
          Kênh quản lý tiệm bánh tự mở sau khi hồ sơ được duyệt và gói dịch vụ có hiệu lực.
        </p>
        <button
          type="button"
          className={buttonClass + ' text-xs py-2.5 px-4'}
          disabled={busy || checkingApproval}
          onClick={() => { refresh(); onCheckApproval() }}
        >
          {checkingApproval ? 'Đang kiểm tra…' : 'Kiểm tra trạng thái duyệt'}
        </button>
        {checkedAt && <p role="status" className="basis-full text-xs text-on-surface-variant">Đã cập nhật lúc {new Date(checkedAt).toLocaleTimeString('vi-VN')}. {nextStep}</p>}
      </div>

      {error && <SubscriptionError error={error} />}
    </div>
  )
}

const loadPartnerAddress = ({ enabled }, options) => enabled ? loadAddresses({}, options) : Promise.resolve([])

export default function PartnerCheckoutModal({ plan, tracking = false, onClose, onNavigate }) {
  const { user, roles } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState(null)
  const [submitted, setSubmitted] = useState(null)
  const resource = useCatalogResource(loadOnboarding, { enabled: roles.includes('CUSTOMER') && !roles.includes('BAKERY_OWNER') })
  const addresses = useCatalogResource(loadPartnerAddress, { enabled: Boolean(user && roles.includes('CUSTOMER') && !roles.includes('BAKERY_OWNER')) })
  const inFlight = useRef(false)

  const savedBakery = submitted || resource.data
  const activation = usePartnerActivation({
    bakeryId: savedBakery?.id,
    enabled: Boolean(savedBakery && savedBakery.status !== 'DRAFT' && !roles.includes('BAKERY_OWNER')),
    paused: busy,
    onActivated: (activeBakery) => onNavigate?.('vendor-dashboard?bakeryId=' + activeBakery.id),
  })
  const bakery = activation.bakery || savedBakery
  const addressRows = bakery?.operations?.addresses || []
  const defaultAddress = addressRows.find(row => row.isPrimary) || addressRows[0] || selectedAddress(addresses.data || [], '')
  const fieldError = name => fieldErrors[name] && <span role="alert" className="sc-field-error block text-red-700">{fieldErrors[name]}</span>

  async function submit(event) {
    event.preventDefault()
    if (inFlight.current || busy) return

    const formElement = event.currentTarget
    const fields = Object.fromEntries(new FormData(formElement))

    // Validation
    const name = (fields.name || '').trim()
    const phoneNumber = (fields.phoneNumber || '').trim()
    const addressLine = (fields.addressLine || '').trim()
    const district = (fields.district || '').trim()
    const city = (fields.city || '').trim()
    const email = (fields.email || '').trim()
    const ward = (fields.ward || '').trim()

    const invalid = {}
    for (const key of ['name', 'addressLine', 'district', 'city']) {
      if (!fields[key]?.trim()) invalid[key] = 'Vui lòng điền thông tin này.'
    }
    const phoneMessage = phoneError(phoneNumber), emailMessage = emailError(email)
    if (phoneMessage) invalid.phoneNumber = phoneMessage
    if (emailMessage) invalid.email = emailMessage
    setFieldErrors(invalid)
    if (Object.keys(invalid).length) {
      formElement.elements.namedItem(Object.keys(invalid)[0])?.focus()
      return
    }

    const address = {
      addressLine,
      ward: ward || null,
      district,
      city,
      isPrimary: true,
    }
    const defaultServiceArea = {
      city,
      district,
      deliveryFee: 0,
      minimumOrder: 0,
      active: true,
    }
    const defaultBusinessHours = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
      dayOfWeek: day,
      closed: false,
      opensAt: '08:00',
      closesAt: '20:00',
    }))

    inFlight.current = true
    setBusy(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const result = await onboardingService.submit({
        name,
        phoneNumber,
        email: email || undefined,
        operations: {
          addresses: [address],
          serviceAreas: [defaultServiceArea],
          businessHours: defaultBusinessHours,
        },
      })
      setSubmitted(result)
      setSuccessMsg('Gửi hồ sơ đăng ký tiệm bánh thành công! Đội ngũ SweetCake sẽ xem xét và phản hồi trong thời gian sớm nhất.')
    } catch (failure) {
      setError(failure)
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  return (
    <ModalSurface
      label="Đăng ký đối tác tiệm bánh"
      busy={busy}
      onClose={onClose}
      className="sc-partner-modal space-y-5"
    >
      <header className="flex items-start justify-between gap-3 border-b border-outline-variant/30 pb-3">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-secondary">
            <span className="material-symbols-outlined text-sm">storefront</span>
            Trở thành đối tác tiệm bánh
          </span>
          <h2 className="font-serif text-2xl font-bold text-primary">
            {tracking || bakery?.status === 'PENDING_APPROVAL' ? 'Theo dõi đăng ký tiệm' : <>Đăng ký gói {planName(plan)}</>}
          </h2>
          {!tracking && <p className="text-xs text-on-surface-variant">
            Mức phí: <strong className="text-primary font-bold">{formatSubscriptionMoney(plan.monthlyPrice, plan.currency)} / tháng</strong> · Chu kỳ {plan.billingPeriodMonths} tháng
          </p>}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="rounded-full p-1.5 text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </header>

      {/* Role & Auth Handling */}
      {!user ? (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-2xl">account_circle</span>
          </div>
          <p className="text-sm text-stone-700">Vui lòng đăng nhập tài khoản khách hàng để đăng ký tiệm bánh và mua gói dịch vụ.</p>
          <button className={buttonClass + ' mx-auto'} onClick={() => onNavigate?.('login')}>
            Đăng nhập ngay
          </button>
        </div>
      ) : roles.includes('BAKERY_OWNER') ? (
        <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-secondary font-bold text-sm">
            <span className="material-symbols-outlined">storefront</span>
            <span>Bạn hiện đã là Chủ tiệm bánh</span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Bạn có thể quản lý tiệm, nâng cấp hoặc gia hạn gói dịch vụ trực tiếp trong Kênh quản lý tiệm bánh.
          </p>
          <label className="block text-sm">Bạn muốn thực hiện
            <select className={inputClass} defaultValue="" onChange={event => { if (event.target.value) onNavigate?.(event.target.value) }}>
              <option value="">Chọn chức năng</option>
              <option value="vendor-settings?create=1">Mở thêm tiệm / chi nhánh</option>
              <option value="vendor-subscription">Quản lý gói của tiệm</option>
            </select>
          </label>
          <button
            className={buttonClass}
            onClick={() => onNavigate?.('vendor-subscription' + (plan?.id ? '?planId=' + plan.id : ''))}
          >
            Vào Kênh quản lý gói tiệm bánh
          </button>
        </div>
      ) : !roles.includes('CUSTOMER') ? (
        <p className="text-sm text-stone-600">Tài khoản hiện tại không hỗ trợ đăng ký đối tác (vui lòng sử dụng tài khoản Khách hàng).</p>
      ) : (
        <ResourceState resource={resource}>
          {/* If bakery exists and status is PENDING_APPROVAL or ACTIVE */}
          {bakery && bakery.status !== 'DRAFT' ? (
            <PartnerOrders
              bakery={bakery}
              plan={plan}
              roles={roles}
              onBusy={setBusy}
              onCheckApproval={activation.check}
              checkingApproval={activation.checking}
              subscription={activation.subscription}
              checkedAt={activation.checkedAt}
            />
          ) : (
            /* Registration Form for new partner or DRAFT */
            <div className="space-y-4">
              {successMsg && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-800 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
                <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">storefront</span>
                  <span>Bước 1: Thông tin tiệm bánh đăng ký</span>
                </p>
                <p className="text-xs text-stone-600">
                  Vui lòng cung cấp chính xác thông tin cửa hàng để Ban quản trị xét duyệt và kích hoạt quyền kinh doanh cho bạn.
                </p>
              </div>

              <form noValidate onSubmit={submit} onChange={event => {
                const key = event.target.name
                if (key) setFieldErrors(previous => ({ ...previous, [key]: '' }))
              }} className="space-y-4">
                <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <label className="sm:col-span-2 block text-xs font-bold text-primary">
                    Tên tiệm bánh của bạn *
                    <input
                      name="name" aria-invalid={Boolean(fieldErrors.name)}
                      maxLength={180}
                      required
                      placeholder="Ví dụ: Tiệm Bánh Sweet Home, Artisan Bakery..."
                      className={inputClass + ' mt-1 w-full text-xs font-medium'}
                      defaultValue={bakery?.name || ''}
                    />
                    {fieldError('name')}
                  </label>

                  <label className="block text-xs font-bold text-primary">
                    Số điện thoại liên hệ *
                    <input
                      name="phoneNumber" aria-invalid={Boolean(fieldErrors.phoneNumber)}
                      maxLength={30}
                      type="tel"
                      required
                      placeholder="0901234567"
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={bakery?.phoneNumber || user.phoneNumber || user.phone || ''}
                    />
                    {fieldError('phoneNumber')}
                  </label>

                  <label className="block text-xs font-bold text-primary">
                    Email liên hệ (Tùy chọn)
                    <input
                      name="email" aria-invalid={Boolean(fieldErrors.email)}
                      maxLength={320}
                      type="email"
                      placeholder="contact@tiembanh.vn"
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={bakery?.email || user.email || ''}
                    />
                    {fieldError('email')}
                  </label>

                  <label className="sm:col-span-2 block text-xs font-bold text-primary">
                    Địa chỉ bếp / xưởng làm bánh *
                    <input
                      name="addressLine" aria-invalid={Boolean(fieldErrors.addressLine)}
                      maxLength={255}
                      required
                      placeholder="Số nhà, tên đường (Ví dụ: 12 Lê Lợi)"
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={defaultAddress?.addressLine || ''}
                    />
                    {fieldError('addressLine')}
                  </label>

                  <label className="block text-xs font-bold text-primary">
                    Phường / Xã (Tùy chọn)
                    <input
                      name="ward" aria-invalid={Boolean(fieldErrors.ward)}
                      maxLength={120}
                      placeholder="Phường Bến Nghé"
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={defaultAddress?.ward || ''}
                    />
                    {fieldError('ward')}
                  </label>

                  <label className="block text-xs font-bold text-primary">
                    Quận / Huyện *
                    <input
                      name="district" aria-invalid={Boolean(fieldErrors.district)}
                      maxLength={120}
                      required
                      placeholder="Quận 1, Bình Thạnh..."
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={defaultAddress?.district || ''}
                    />
                    {fieldError('district')}
                  </label>

                  <label className="sm:col-span-2 block text-xs font-bold text-primary">
                    Tỉnh / Thành phố *
                    <input
                      name="city" aria-invalid={Boolean(fieldErrors.city)}
                      maxLength={120}
                      required
                      placeholder="TP. Hồ Chí Minh, Hà Nội..."
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={defaultAddress?.city || ''}
                    />
                    {fieldError('city')}
                  </label>
                </fieldset>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-outline-variant/30">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-outline-variant/50 text-xs font-semibold text-primary hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {busy ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Đang gửi hồ sơ đăng ký…</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">send</span>
                        <span>Gửi đăng ký tiệm bánh</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </ResourceState>
      )}

      {error && <SubscriptionError error={error} />}
      {activation.error && <SubscriptionError error={activation.error} />}
    </ModalSurface>
  )
}
