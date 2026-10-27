import AddressFields from '../components/orders/AddressFields.jsx'
import { emptyAddress, selectedAddress as resolveAddress, formatAddress, addressTitle } from './addressModels.js'
import { toLocalInput } from '../services/marketplaceModels.js'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useAuth } from '../context/useAuth.js'
import { demoRuntime } from './runtime.js'
import { orderService } from '../services/orderService.js'
import { rfqService } from '../services/rfqService.js'
import { revalidateCartItem } from '../services/checkoutService.js'
import { ApiErrorMessage, buttonClass, inputClass } from '../components/management/ApiState.jsx'

// Rendered inside the normal checkout only for records from the local mock graph.
export default function MockCheckout({ offerId, items = [], onConfirmed, onNavigate, disabled = false }) {
  const { user } = useAuth()
  useSyncExternalStore(demoRuntime.subscribe, demoRuntime.getSnapshot, demoRuntime.getSnapshot)
  useEffect(() => { demoRuntime.store.bind(user) }, [user])
  const addresses = demoRuntime.store.state.addresses.filter((address) => address.customerId === user?.id)
  const [addressId, setAddressId] = useState(addresses.find((address) => address.primary)?.id || addresses[0]?.id || '')
  const chosenAddress = resolveAddress(addresses, addressId)
  const selectedAddressId = chosenAddress?.id || ''
  const [addressDraft, setAddressDraft] = useState(null), [addressError, setAddressError] = useState(null)
  const [neededAt, setNeededAt] = useState(() => toLocalInput(new Date(Date.now() + 7 * 86400000).toISOString()))
  const [earliest] = useState(() => toLocalInput(new Date().toISOString()))
  const [note, setNote] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(null), [result, setResult] = useState(null)
  const [keys] = useState(() => new Map([...items.map((item) => [item.id, crypto.randomUUID()]), ['offer', crypto.randomUUID()]]))
  function saveAddress() {
    try {
      const address = demoRuntime.runLocal('/sample-addresses' + (addressDraft.id ? '/' + addressDraft.id : ''), addressDraft.id ? 'PATCH' : 'POST', addressDraft)
      setAddressId(address.id); setAddressDraft(null); setAddressError(null)
    } catch (failure) { setAddressError(failure) }
  }
  async function submit(event) {
    event.preventDefault()
    if (disabled || busy || result || addressDraft || !selectedAddressId || !user?.roles?.includes('CUSTOMER')) return
    setBusy(true); setError(null)
    try {
      if (offerId) { const accepted = await rfqService.acceptOffer(offerId, { deliveryAddressId: selectedAddressId, customerNote: note }, keys.get('offer')); setResult(accepted.orderNumber); onConfirmed?.(accepted) }
      else {
        const numbers = []
        for (const item of items) {
          const verified = await revalidateCartItem(item)
          const order = await orderService.createDirectOrder({ bakeryId: item.bakeryId, productId: item.productId, deliveryAddressId: selectedAddressId, quantity: verified.quantity, optionSelections: verified.optionSelections, addOns: verified.addOns, requestedDeliveryAt: neededAt, customerNote: note }, keys.get(item.id))
          numbers.push(order.orderNumber); onConfirmed?.(item.id)
        }
        setResult(numbers.join(', '))
      }
      onNavigate?.('profile')
    } catch (failure) { setError(failure) } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="space-y-4">
    <p className="text-xs text-on-surface-variant">Dữ liệu mẫu · Đơn hàng được lưu trên trình duyệt, không gửi backend hoặc thu tiền.</p>
    <label className="block">Địa chỉ nhận bánh<select required disabled={busy || !!result} value={selectedAddressId} onChange={(e) => setAddressId(e.target.value)} className={inputClass}><option value="" disabled>Chọn địa chỉ</option>{addresses.map((address) => <option key={address.id} value={address.id}>{addressTitle(address)}{address.primary ? ' (Mặc định)' : ''} · {address.addressLine}</option>)}</select></label>
    {chosenAddress && !addressDraft && <div className="space-y-2 rounded-xl bg-surface-container-low p-3 text-sm"><p className="font-semibold">{chosenAddress.recipientName} · {chosenAddress.recipientPhone}</p><p className="break-words">{formatAddress(chosenAddress)}</p>{chosenAddress.deliveryNote && <p className="text-on-surface-variant">{chosenAddress.deliveryNote}</p>}<button type="button" className="font-semibold text-primary underline" disabled={busy || !!result} onClick={() => { setAddressDraft({ ...chosenAddress }); setAddressError(null) }}>Sửa địa chỉ đã chọn</button></div>}
    {!addresses.length && <p className="text-sm text-on-surface-variant">Chưa có địa chỉ nhận bánh. Thêm địa chỉ để tiếp tục.</p>}
    {!addressDraft && <button type="button" className="text-sm font-semibold text-primary underline" disabled={busy || !!result || !user?.roles?.includes('CUSTOMER')} onClick={() => { setAddressDraft(emptyAddress(user, addresses.length === 0)); setAddressError(null) }}>Thêm địa chỉ mới</button>}
    {addressDraft && <section className="space-y-3 rounded-xl border border-outline-variant/30 p-3"><h3 className="font-bold text-primary">{addressDraft.id ? 'Sửa địa chỉ nhận bánh' : 'Thêm địa chỉ nhận bánh'}</h3><AddressFields value={addressDraft} onChange={setAddressDraft} disabled={busy || !!result} />{addressError && <ApiErrorMessage error={addressError} />}<div className="flex flex-wrap gap-3"><button type="button" disabled={busy} className={buttonClass} onClick={saveAddress}>Lưu địa chỉ</button><button type="button" disabled={busy} onClick={() => { setAddressDraft(null); setAddressError(null) }}>Hủy</button></div></section>}
    {!offerId && <label className="block">Ngày giờ nhận bánh<input required type="datetime-local" min={earliest} disabled={busy || !!result} className={inputClass} value={neededAt} onChange={(e) => setNeededAt(e.target.value)} /></label>}
    <label className="block">Ghi chú<textarea maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} disabled={busy || !!result} className={inputClass} /></label>
    {error && <ApiErrorMessage error={error} />}
    {result ? <div role="status"><p>Đã tạo đơn mẫu: {result}</p><button type="button" className={buttonClass} onClick={() => onNavigate?.('profile')}>Xem đơn hàng</button></div> : <button disabled={disabled || busy || !!addressDraft || !selectedAddressId || !user?.roles?.includes('CUSTOMER') || !offerId && !items.length} className={buttonClass}>{busy ? 'Đang xử lý…' : offerId ? 'Chấp nhận báo giá' : 'Xác nhận đặt bánh'}</button>}
  </form>
}
