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
import { Icon } from '../components/common/WorkspaceUI.jsx'

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
    <div className="flex items-center gap-1.5 rounded-xl bg-surface-container-high px-3 py-2 text-xs text-on-surface-variant">
      <Icon name="info" className="text-sm text-secondary shrink-0" />
      <span>Dữ liệu mẫu · Đơn hàng được lưu trên trình duyệt, không gửi backend hoặc thu tiền.</span>
    </div>

    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
        <Icon name="location_on" className="text-base text-secondary" /> Địa chỉ nhận bánh
      </span>
      <select id="delivery-address-select" required disabled={busy || !!result} value={selectedAddressId} onChange={(e) => setAddressId(e.target.value)} className={inputClass + ' w-full'}>
        <option value="" disabled>Chọn địa chỉ nhận hàng</option>
        {addresses.map((address) => (
          <option key={address.id} value={address.id}>
            {addressTitle(address)}{address.primary ? ' (Mặc định)' : ''} · {address.addressLine}
          </option>
        ))}
      </select>
    </label>

    {chosenAddress && !addressDraft && (
      <div className="space-y-1.5 rounded-2xl bg-surface-container-low p-3.5 text-xs border border-outline-variant/30">
        <p className="font-bold text-on-surface text-sm flex items-center justify-between">
          <span>{chosenAddress.recipientName}</span>
          <span className="font-mono text-outline font-normal">{chosenAddress.recipientPhone}</span>
        </p>
        <p className="break-words text-on-surface-variant">{formatAddress(chosenAddress)}</p>
        {chosenAddress.deliveryNote && <p className="italic text-outline">Ghi chú: {chosenAddress.deliveryNote}</p>}
        <div className="pt-1">
          <button type="button" className="font-semibold text-primary hover:underline" disabled={busy || !!result} onClick={() => { setAddressDraft({ ...chosenAddress }); setAddressError(null) }}>
            Chỉnh sửa địa chỉ này
          </button>
        </div>
      </div>
    )}

    {!addresses.length && <p className="text-sm text-on-surface-variant">Chưa có địa chỉ nhận bánh. Thêm địa chỉ để tiếp tục.</p>}

    {!addressDraft && (
      <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline" disabled={busy || !!result || !user?.roles?.includes('CUSTOMER')} onClick={() => { setAddressDraft(emptyAddress(user, addresses.length === 0)); setAddressError(null) }}>
        <Icon name="add_location" className="text-sm" /> Thêm địa chỉ nhận hàng mới
      </button>
    )}

    {addressDraft && (
      <section className="space-y-3 rounded-2xl border border-primary/20 bg-surface-container-lowest p-4 shadow-xs">
        <h3 className="font-serif font-bold text-primary text-sm flex items-center gap-1.5">
          <Icon name="edit_location" className="text-base" /> {addressDraft.id ? 'Sửa địa chỉ nhận bánh' : 'Thêm địa chỉ nhận bánh mới'}
        </h3>
        <AddressFields value={addressDraft} onChange={setAddressDraft} disabled={busy || !!result} />
        {addressError && <ApiErrorMessage error={addressError} />}
        <div className="flex flex-wrap gap-2 pt-2">
          <button type="button" disabled={busy} className={buttonClass + ' text-xs py-2 px-4'} onClick={saveAddress}>Lưu địa chỉ</button>
          <button type="button" disabled={busy} className="rounded-xl border px-3 py-2 text-xs" onClick={() => { setAddressDraft(null); setAddressError(null) }}>Hủy</button>
        </div>
      </section>
    )}

    {!offerId && (
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-on-surface">Ngày giờ nhận bánh</span>
        <input required type="datetime-local" min={earliest} disabled={busy || !!result} className={inputClass} value={neededAt} onChange={(e) => setNeededAt(e.target.value)} />
      </label>
    )}

    <label className="block space-y-1">
      <span className="text-sm font-semibold text-on-surface flex items-center gap-1">
        <Icon name="edit_note" className="text-base text-outline" /> Lời nhắn hoặc chỉ dẫn giao hàng
      </span>
      <textarea maxLength={1000} rows={2} placeholder="Ví dụ: Ghi chữ Happy Birthday Mai Hân lên bảng socola..." value={note} onChange={(e) => setNote(e.target.value)} disabled={busy || !!result} className={inputClass + ' w-full'} />
    </label>

    {error && <ApiErrorMessage error={error} />}

    {result ? (
      <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center space-y-3">
        <p className="font-bold text-green-800 flex items-center justify-center gap-1.5">
          <Icon name="check_circle" className="text-xl text-green-600" /> Đã tạo đơn bánh thành công: {result}
        </p>
        <button type="button" className={buttonClass + ' w-full py-3'} onClick={() => onNavigate?.('profile')}>Xem đơn hàng của tôi</button>
      </div>
    ) : (
      <button
        id="accept-offer-btn"
        disabled={disabled || busy || !!addressDraft || !selectedAddressId || !user?.roles?.includes('CUSTOMER') || (!offerId && !items.length)}
        className={buttonClass + ' w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2'}
      >
        <Icon name={offerId ? 'task_alt' : 'shopping_cart_checkout'} className="text-xl" />
        {busy ? 'Đang xử lý…' : offerId ? 'Chấp nhận báo giá' : 'Xác nhận đặt bánh'}
      </button>
    )}
  </form>
}
