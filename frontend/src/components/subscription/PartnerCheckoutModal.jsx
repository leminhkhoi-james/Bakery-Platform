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
        description: 'Hồ sơ tiệm đã được phê duyệt thành công. Bạn có thể mở bán và quản lý tiệm bánh.',
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

function PartnerOrders({ bakery, plan, roles, onBusy, onNavigate }) {
  const [page, setPage] = useState(1)
  const history = useCatalogResource(loadSubscriptionOrders, { bakeryId: bakery.id, page, size: 10, sort: 'createdAt,desc' })
  const [orderId, setOrderId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [revision, setRevision] = useState(0)
  const [successNotice, setSuccessNotice] = useState(null)
  const inFlight = useRef(false)

  const orders = history.data?.result || []
  const openOrder = orders.find((o) => ['PENDING_PAYMENT', 'PAYMENT_REVIEW'].includes(o.status))

  // Auto-select open order or latest order so user can immediately view/pay
  React.useEffect(() => {
    if (!orderId && orders.length > 0) {
      const active = openOrder || orders[0]
      if (active?.id) setOrderId(active.id)
    }
  }, [orders, orderId, openOrder])

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

  return (
    <div className="space-y-5">
      {/* Bakery Status Banner */}
      <div className={`rounded-2xl border p-4 space-y-2 ${statusInfo.classes}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">{statusInfo.icon}</span>
            <span className="font-bold text-sm">Trạng thái hồ sơ: {statusInfo.label}</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/70 border border-current">
            {statusInfo.label}
          </span>
        </div>
        <p className="text-xs leading-relaxed opacity-90">{statusInfo.description}</p>
        <div className="pt-1 text-xs border-t border-current/20 flex flex-wrap gap-x-4 gap-y-1">
          <span>Tên tiệm: <strong>{bakery.name}</strong></span>
          {bakery.phoneNumber && <span>Hotline: <strong>{bakery.phoneNumber}</strong></span>}
          {bakery.email && <span>Email: <strong>{bakery.email}</strong></span>}
        </div>
      </div>

      {/* Plan Order CTA */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-primary">Mua gói: {planName(plan)}</h3>
            <p className="text-xs text-on-surface-variant">
              {formatSubscriptionMoney(plan.monthlyPrice, plan.currency)} / tháng · Chu kỳ {plan.billingPeriodMonths} tháng
            </p>
          </div>
          <button
            className={buttonClass + ' text-xs py-2 px-4 shadow-sm font-bold'}
            disabled={busy || history.status !== 'ready' || Boolean(openOrder)}
            onClick={() => run(async () => {
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
                setSuccessNotice(`Đã tạo yêu cầu mua gói #${order.orderNumber || order.id} thành công! Vui lòng chuyển khoản theo hướng dẫn và gửi ảnh biên lai bên dưới.`)
                refresh()
              } catch (failure) {
                if (failure?.status === 409 || /already has an open subscription order/i.test(failure?.message)) {
                  setAttempt(null)
                  refresh()
                }
                throw failure
              }
            })}
          >
            {busy ? 'Đang tạo đơn…' : openOrder ? 'Đang có đơn chờ thanh toán' : attempt ? 'Thử lại tạo đơn' : 'Tạo đơn mua gói ngay'}
          </button>
        </div>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          💡 <strong>Hướng dẫn thanh toán:</strong> Sau khi tạo yêu cầu mua gói, bạn chuyển khoản theo thông tin tài khoản và tải lên ảnh biên lai thanh toán. Đội ngũ kiểm soát sẽ xác thực chuyển khoản và kích hoạt gói cho tiệm bánh trong thời gian sớm nhất.
        </p>
      </div>

      {openOrder && !successNotice && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-amber-700">info</span>
          <span>Tiệm bánh đang có đơn mua gói #{openOrder.orderNumber || openOrder.id} ({subscriptionStatusLabel(openOrder.status)}). Vui lòng gửi chứng từ chuyển khoản bên dưới để hoàn tất.</span>
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
              Chọn đơn mua gói khác:
              <select
                className={inputClass + ' mt-1 text-xs'}
                disabled={busy}
                value={orderId || ''}
                onChange={(event) => setOrderId(event.target.value || null)}
              >
                {history.data.result.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{order.orderNumber || order.id} · {formatSubscriptionMoney(order.totalAmount, order.currency)} · {subscriptionStatusLabel(order.status)}
                  </option>
                ))}
              </select>
            </label>
            {history.data?.meta.pages > 1 && (
              <CatalogPagination
                meta={history.data.meta}
                onPage={(value) => { if (!busy) setPage(value) }}
              />
            )}
          </div>
        )}
        {!history.data?.result.length && (
          <p className="text-xs text-on-surface-variant">Chưa có đơn mua gói nào cho tiệm này.</p>
        )}
      </ResourceState>

      {/* Subscription Order Detail & Payment Evidence Form */}
      {orderId && (
        <SubscriptionOrderDetail
          key={orderId}
          orderId={orderId}
          bakeryId={bakery.id}
          roles={roles}
          revision={revision}
          onChanged={refresh}
          onBusy={(value) => { setBusy(value); onBusy(value) }}
        />
      )}

      {/* Complete Onboarding Button (if bakery is approved and plan is active) */}
      <div className="pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-on-surface-variant max-w-sm">
          Khi hồ sơ cửa hàng và thanh toán gói đã được duyệt hoàn tất, bạn có thể truy cập Kênh quản lý tiệm bánh.
        </p>
        <button
          className={buttonClass + ' text-xs py-2.5 px-4'}
          disabled={busy}
          onClick={() => run(async () => {
            await onboardingService.complete(bakery.id)
            onNavigate?.('vendor-dashboard?bakeryId=' + bakery.id)
          })}
        >
          {busy ? 'Đang kiểm tra…' : 'Vào Kênh quản lý tiệm bánh'}
        </button>
      </div>

      {error && <SubscriptionError error={error} />}
    </div>
  )
}

export default function PartnerCheckoutModal({ plan, onClose, onNavigate }) {
  const { user, roles } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [submitted, setSubmitted] = useState(null)
  const resource = useCatalogResource(loadOnboarding, { enabled: roles.includes('CUSTOMER') && !roles.includes('BAKERY_OWNER') })
  const inFlight = useRef(false)

  const bakery = submitted || resource.data

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

    if (!name || !phoneNumber || !addressLine || !district || !city) {
      setError(new Error('Vui lòng điền đầy đủ các trường bắt buộc (Tên tiệm, Số điện thoại, Địa chỉ, Quận/huyện, Tỉnh/thành).'))
      return
    }

    if (phoneNumber.length < 8 || phoneNumber.length > 30) {
      setError(new Error('Số điện thoại không hợp lệ (từ 8 đến 30 ký tự).'))
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
            Đăng ký gói {planName(plan)}
          </h2>
          <p className="text-xs text-on-surface-variant">
            Mức phí: <strong className="text-primary font-bold">{formatSubscriptionMoney(plan.monthlyPrice, plan.currency)} / tháng</strong> · Chu kỳ {plan.billingPeriodMonths} tháng
          </p>
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
          <button
            className={buttonClass}
            onClick={() => onNavigate?.('vendor-subscription?planId=' + plan.id)}
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
              onNavigate={onNavigate}
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

              <form onSubmit={submit} className="space-y-4">
                <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <label className="sm:col-span-2 block text-xs font-bold text-primary">
                    Tên tiệm bánh của bạn *
                    <input
                      name="name"
                      maxLength={180}
                      required
                      placeholder="Ví dụ: Tiệm Bánh Sweet Home, Artisan Bakery..."
                      className={inputClass + ' mt-1 w-full text-xs font-medium'}
                      defaultValue={bakery?.name || ''}
                    />
                  </label>

                  <label className="block text-xs font-bold text-primary">
                    Số điện thoại liên hệ *
                    <input
                      name="phoneNumber"
                      maxLength={30}
                      type="tel"
                      required
                      placeholder="0901234567"
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={bakery?.phoneNumber || ''}
                    />
                  </label>

                  <label className="block text-xs font-bold text-primary">
                    Email liên hệ (Tùy chọn)
                    <input
                      name="email"
                      maxLength={320}
                      type="email"
                      placeholder="contact@tiembanh.vn"
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={bakery?.email || user.email || ''}
                    />
                  </label>

                  <label className="sm:col-span-2 block text-xs font-bold text-primary">
                    Địa chỉ bếp / xưởng làm bánh *
                    <input
                      name="addressLine"
                      maxLength={255}
                      required
                      placeholder="Số nhà, tên đường (Ví dụ: 12 Lê Lợi)"
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={bakery?.operations?.addresses?.[0]?.addressLine || ''}
                    />
                  </label>

                  <label className="block text-xs font-bold text-primary">
                    Phường / Xã (Tùy chọn)
                    <input
                      name="ward"
                      maxLength={120}
                      placeholder="Phường Bến Nghé"
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={bakery?.operations?.addresses?.[0]?.ward || ''}
                    />
                  </label>

                  <label className="block text-xs font-bold text-primary">
                    Quận / Huyện *
                    <input
                      name="district"
                      maxLength={120}
                      required
                      placeholder="Quận 1, Bình Thạnh..."
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={bakery?.operations?.addresses?.[0]?.district || ''}
                    />
                  </label>

                  <label className="sm:col-span-2 block text-xs font-bold text-primary">
                    Tỉnh / Thành phố *
                    <input
                      name="city"
                      maxLength={120}
                      required
                      placeholder="TP. Hồ Chí Minh, Hà Nội..."
                      className={inputClass + ' mt-1 w-full text-xs'}
                      defaultValue={bakery?.operations?.addresses?.[0]?.city || ''}
                    />
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
    </ModalSurface>
  )
}
