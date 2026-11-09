import React, { useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { ApiErrorMessage, buttonClass, inputClass } from '../management/ApiState.jsx'
import { loadAddresses } from '../../services/addressService.js'
import { isRealCheckoutId } from '../../services/checkoutService.js'
import { acceptVerifiedOffer, createVerifiedDirectOrder } from '../../services/verifiedCheckoutService.js'
import { toLocalInput } from '../../services/marketplaceModels.js'
import { selectedAddress } from '../../mockData/addressModels.js'
import AddressPicker from './AddressPicker.jsx'
import { demoRuntime } from '../../mockData/runtime.js'
import { isDemoId } from '../../mockData/seed.js'
import MockCheckout from '../../mockData/MockCheckout.jsx'

function RealCheckout({ user, offerId, items, disabled, onConfirmed, onNavigate }) {
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
  const address = selectedAddress(addresses.data || [], addressId)
  const locked = busy || complete || retrying
  const ready = !disabled && !busy && !complete && addresses.status === 'ready' && !addresses.refreshing && address &&
    (offerId || Number.isFinite(Date.parse(neededAt)))

  async function submit(event) {
    event.preventDefault()
    if (!ready || running.current) return
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
      for (; current.next < current.jobs.length; current.next++) {
        const { item, key } = current.jobs[current.next]
        if (offerId) onConfirmed?.(await acceptVerifiedOffer(offerId, current.input, key))
        else {
          await createVerifiedDirectOrder(item, current.input, key)
          onConfirmed?.(item.id)
        }
      }
      setComplete(true)
      onNavigate?.('profile')
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
    <AddressPicker resource={addresses} selected={address} onSelect={setAddressId} user={user} disabled={locked || disabled} />
    <form onSubmit={submit} className="space-y-3">
      {!offerId && <label>Thời gian nhận bánh<input required type="datetime-local" className={inputClass} disabled={locked || disabled} value={neededAt} onChange={event => setNeededAt(event.target.value)} /></label>}
      <label>Ghi chú<textarea className={inputClass} maxLength={1000} disabled={locked || disabled} value={note} onChange={event => setNote(event.target.value)} /></label>
      <p className="text-xs">Đặt hàng không thu tiền tại đây.</p>
      <button disabled={!ready} className={buttonClass}>{busy ? 'Đang gửi…' : retrying ? 'Thử lại cùng yêu cầu' : offerId ? 'Chấp nhận báo giá' : 'Đặt hàng'}</button>
      {complete && <p role="status">Đã xác nhận đơn hàng.</p>}
      {error && <ApiErrorMessage error={error} />}
    </form>
  </section>
}

export default function VerifiedCheckout({ offerId, items = [], ...props }) {
  const { user } = useAuth()
  if (demoRuntime && (isDemoId(offerId) || items.length > 0 && items.every(item => isDemoId(item.productId) && isDemoId(item.bakeryId)))) {
    return <MockCheckout key={user?.id || 'anonymous'} {...props} offerId={offerId} items={items} />
  }
  if (!user?.roles?.includes('CUSTOMER')) return <p>Vui lòng đăng nhập tài khoản khách hàng để tiếp tục.</p>
  const valid = offerId ? isRealCheckoutId(offerId) : items.length > 0 && items.every(item =>
    item.catalogSource === 'backend' && isRealCheckoutId(item.productId) && isRealCheckoutId(item.bakeryId))
  if (!valid) return <p>Chưa có sản phẩm hoặc báo giá API hợp lệ để đặt hàng.</p>
  return <RealCheckout key={user.id + ':' + (offerId || 'cart')} {...props} user={user} offerId={offerId} items={items} />
}
