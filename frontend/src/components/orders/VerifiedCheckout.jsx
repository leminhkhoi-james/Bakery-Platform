import React, { useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { ApiErrorMessage, buttonClass, inputClass } from '../management/ApiState.jsx'
import { loadAddresses, selectedAddress, isAddressMatchingLocation } from '../../services/addressService.js'
import { isRealCheckoutId } from '../../services/checkoutService.js'
import { acceptVerifiedOffer, createVerifiedDirectOrder } from '../../services/verifiedCheckoutService.js'
import { toLocalInput } from '../../services/marketplaceModels.js'
import AddressPicker from './AddressPicker.jsx'

function RealCheckout({ user, offerId, items, disabled, expectedLocation, onConfirmed, onNavigate }) {
  const addresses = useCatalogResource(loadAddresses)
  const [addressId, setAddressId] = useState('')
  const [neededAt, setNeededAt] = useState(() => toLocalInput(new Date(Date.now() + 7 * 86400000).toISOString()))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [complete, setComplete] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const attempt = useRef(null)
  const running = useRef(false)

  // Auto-select address matching expectedLocation if available
  React.useEffect(() => {
    if (expectedLocation && addresses.data?.length && !addressId) {
      const match = addresses.data.find(a => isAddressMatchingLocation(a, expectedLocation))
      if (match) {
        setAddressId(match.id)
      }
    }
  }, [expectedLocation, addresses.data, addressId])

  const address = selectedAddress(addresses.data || [], addressId)
  const isLocationMismatch = Boolean(expectedLocation && address && !isAddressMatchingLocation(address, expectedLocation))
  const addressFailure = error && /address|địa chỉ/i.test(error.message || '')
  const timeFailure = error && /delivery.*time|notice period|thời gian|lịch nhận/i.test(error.message || '')
  const locked = busy || complete || retrying
  const ready = !disabled && !busy && !complete && addresses.status === 'ready' && !addresses.refreshing && address &&
    !isLocationMismatch && (offerId || Number.isFinite(Date.parse(neededAt)))

  async function submit(event) {
    event.preventDefault()
    if (!ready || running.current) return

    if (!address?.id) {
      setError(new Error('Vui lòng chọn địa chỉ giao bánh hợp lệ.'))
      return
    }

    if (isLocationMismatch) {
      setError(new Error(`Địa chỉ giao hàng phải thuộc ${expectedLocation.district}, ${expectedLocation.city} như đã thỏa thuận trong yêu cầu báo giá.`))
      return
    }

    if (!offerId && (!neededAt || Date.parse(neededAt) <= Date.now())) {
      setError(new Error('Thời gian nhận bánh phải ở tương lai.'))
      return
    }

    running.current = true
    setBusy(true)
    setError(null)
    const current = attempt.current || {
      input: { deliveryAddressId: address.id, requestedDeliveryAt: neededAt, customerNote: note },
      jobs: (offerId ? [null] : items).map(item => ({ item, key: crypto.randomUUID() })),
      next: 0,
    }
    attempt.current = current
    try {
      let lastOrderId = null
      for (; current.next < current.jobs.length; current.next++) {
        const { item, key } = current.jobs[current.next]
        if (offerId) {
          const accepted = await acceptVerifiedOffer(offerId, current.input, key)
          lastOrderId = accepted?.orderId
          onConfirmed?.(accepted)
        } else {
          const created = await createVerifiedDirectOrder(item, current.input, key)
          lastOrderId = created?.id
          onConfirmed?.(item.id)
        }
      }
      setComplete(true)
      if (lastOrderId) {
        onNavigate?.('tracking?orderId=' + encodeURIComponent(lastOrderId))
      } else {
        onNavigate?.('tracking')
      }
    } catch (failure) {
      if (current.next === 0 && [400, 403, 404, 422].includes(failure.status)) attempt.current = null
      setRetrying(Boolean(attempt.current))
      setError(failure)
    } finally {
      running.current = false
      setBusy(false)
    }
  }

  return <section className="space-y-4">
    <AddressPicker
      resource={addresses}
      selected={address}
      onSelect={setAddressId}
      user={user}
      disabled={locked || disabled}
      expectedLocation={expectedLocation}
    />
    {addressFailure && <ApiErrorMessage error={error} />}
    {isLocationMismatch && (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-800">
          <span className="material-symbols-outlined text-sm">warning</span>
          <span>Khu vực giao hàng chưa khớp với báo giá</span>
        </div>
        <p>
          Báo giá này dành cho khu vực <strong>{expectedLocation.district}, {expectedLocation.city}</strong>.
          Địa chỉ bạn đang chọn thuộc <strong>{address.district}, {address.city}</strong>.
        </p>
        <p className="text-amber-700">
          Vui lòng chọn địa chỉ đúng khu vực trên hoặc nhấn <strong>"+ Thêm địa chỉ mới"</strong> để đơn hàng được chấp nhận chính xác.
        </p>
      </div>
    )}
    <form onSubmit={submit} className="space-y-3">
      {!offerId && (
        <label className="block text-xs font-bold text-primary">
          Thời gian nhận bánh mong muốn *
          <input
            required
            type="datetime-local"
            className={inputClass + ' mt-1 w-full text-xs font-medium'}
            disabled={locked || disabled}
            value={neededAt}
            onChange={event => setNeededAt(event.target.value)}
          />
          {timeFailure && <ApiErrorMessage error={error} />}
        </label>
      )}
      <label className="block text-xs font-bold text-primary">
        Ghi chú giao hàng cho tiệm bánh
        <textarea
          className={inputClass + ' mt-1 w-full text-xs'}
          maxLength={1000}
          rows={2}
          placeholder="Lưu ý khi vận chuyển bánh, lời chúc ghi trên thiệp..."
          disabled={locked || disabled}
          value={note}
          onChange={event => setNote(event.target.value)}
        />
      </label>

      {!address && addresses.status === 'ready' && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
          Vui lòng chọn hoặc thêm địa chỉ nhận bánh ở trên để hoàn tất đơn hàng.
        </p>
      )}

      <p className="text-xs text-on-surface-variant">
        Thanh toán trực tiếp theo thỏa thuận với tiệm bánh (nền tảng không thu tiền mua bánh).
      </p>

      <button disabled={!ready} className={buttonClass + ' w-full py-3 text-sm font-bold shadow-md cursor-pointer disabled:opacity-50'}>
        {busy ? 'Đang gửi đơn lên hệ thống…' : retrying ? 'Thử lại cùng yêu cầu' : offerId ? 'Xác nhận chấp nhận báo giá' : 'Đặt hàng'}
      </button>

      {complete && (
        <p role="status" className="rounded-xl bg-green-50 border border-green-200 text-green-800 p-3 text-xs font-bold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>Đã xác nhận đơn hàng thành công! Đang chuyển hướng đến chi tiết đơn...</span>
        </p>
      )}
      {error && !addressFailure && (!timeFailure || offerId) && <ApiErrorMessage error={error} />}
    </form>
  </section>
}

export default function VerifiedCheckout({ offerId, items = [], expectedLocation, ...props }) {
  const { user } = useAuth()
  if (!user?.roles?.includes('CUSTOMER')) return <p className="text-xs text-on-surface-variant p-4">Vui lòng đăng nhập tài khoản khách hàng để tiếp tục đặt bánh. <button type="button" className="text-primary underline font-semibold" onClick={() => props.onNavigate?.('login')}>Đăng nhập ngay</button></p>
  const valid = offerId ? isRealCheckoutId(offerId) : items.length > 0 && items.every(item =>
    item.catalogSource === 'backend' && isRealCheckoutId(item.productId) && isRealCheckoutId(item.bakeryId))
  if (!offerId && !items.length && props.disabled) return <><p className="text-sm text-primary">Vui lòng chọn ít nhất một bánh để đặt hàng.</p><button disabled className={buttonClass + ' w-full'}>Đặt hàng</button></>
  if (!valid) return <p className="text-xs text-on-surface-variant p-4">Chưa có sản phẩm hoặc báo giá API hợp lệ để đặt hàng.</p>
  return <RealCheckout key={user.id + ':' + (offerId || 'cart')} {...props} user={user} offerId={offerId} items={items} expectedLocation={expectedLocation} />
}
