import React, { useState } from 'react'
import { addressService } from '../../services/addressService.js'
import { emptyAddress, formatAddress } from '../../mockData/addressModels.js'
import { ApiState, ApiErrorMessage, buttonClass, inputClass, panelClass } from '../management/ApiState.jsx'
import AddressFields from './AddressFields.jsx'

export default function AddressPicker({ resource, selected, onSelect, user, disabled }) {
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const addresses = resource.data || []
  async function save(event) {
    event.preventDefault()
    if (busy || disabled || !draft) return
    setBusy(true)
    setError(null)
    try {
      const address = await addressService.create(draft)
      onSelect(address.id)
      setDraft(null)
      resource.reload()
    } catch (failure) { setError(failure) }
    finally { setBusy(false) }
  }
  return <section className={panelClass}>
    <h3 className="font-bold">Địa chỉ giao hàng</h3>
    <ApiState resource={resource}>{resource.status === 'ready' && <>
      {addresses.length ? <label>Địa chỉ nhận bánh
        <select className={inputClass} value={selected?.id || ''} disabled={disabled || busy} onChange={event => onSelect(event.target.value)}>
          {addresses.map(address => <option key={address.id} value={address.id}>{address.title} · {formatAddress(address)}</option>)}
        </select>
      </label> : <p>Chưa có địa chỉ nhận bánh.</p>}
      {selected && <p className="text-sm">{selected.recipientName} · {selected.recipientPhone}</p>}
      {!draft && <button type="button" disabled={disabled || busy} className={buttonClass} onClick={() => setDraft(emptyAddress(user, !addresses.length))}>+ Thêm địa chỉ</button>}
    </>}</ApiState>
    {draft && <form onSubmit={save} className="space-y-3">
      <AddressFields value={draft} onChange={setDraft} disabled={disabled || busy} showDeliveryNote={false} />
      <button className={buttonClass} disabled={disabled || busy}>{busy ? 'Đang lưu…' : 'Lưu địa chỉ'}</button>
      <button type="button" disabled={busy} onClick={() => { setDraft(null); setError(null) }}>Hủy</button>
    </form>}
    {error && <ApiErrorMessage error={error} />}
  </section>
}
