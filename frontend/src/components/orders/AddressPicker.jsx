import React, { useState } from 'react'
import { addressService, emptyAddress, formatAddress, isAddressMatchingLocation } from '../../services/addressService.js'
import { ApiState, ApiErrorMessage, buttonClass, inputClass, panelClass } from '../management/ApiState.jsx'
import AddressFields from './AddressFields.jsx'

export default function AddressPicker({ resource, selected, onSelect, user, disabled, expectedLocation }) {
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const addresses = resource.data || []

  function openNewDraft(primary = false) {
    const base = emptyAddress(user, primary)
    if (expectedLocation) {
      if (expectedLocation.city) base.city = expectedLocation.city
      if (expectedLocation.district) base.district = expectedLocation.district
    }
    setDraft(base)
  }

  async function save(event) {
    event.preventDefault()
    if (busy || disabled || !draft) return

    // Pre-validation
    const title = (draft.title || '').trim() || 'Địa chỉ nhận bánh'
    const recipientName = (draft.recipientName || '').trim()
    const recipientPhone = (draft.recipientPhone || '').trim()
    const addressLine = (draft.addressLine || '').trim()
    const district = (draft.district || '').trim()
    const city = (draft.city || '').trim()

    if (!recipientName || !recipientPhone || !addressLine || !district || !city) {
      setError(new Error('Vui lòng điền đầy đủ: Người nhận, Số điện thoại, Địa chỉ, Quận/huyện, Tỉnh/thành.'))
      return
    }

    setBusy(true)
    setError(null)
    try {
      const address = await addressService.create({
        ...draft,
        title,
        recipientName,
        recipientPhone,
        addressLine,
        district,
        city,
      })
      onSelect(address.id)
      setDraft(null)
      resource.reload()
    } catch (failure) {
      setError(failure)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={panelClass + ' space-y-3'}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">location_on</span>
          <span>Địa chỉ giao hàng</span>
        </h3>
        {!draft && (
          <button
            type="button"
            disabled={disabled || busy}
            className="text-xs font-bold text-secondary hover:text-secondary-hover underline cursor-pointer disabled:opacity-50"
            onClick={() => openNewDraft(!addresses.length)}
          >
            + Thêm địa chỉ mới
          </button>
        )}
      </div>

      <ApiState resource={resource}>
        {resource.status === 'ready' && !draft && (
          <>
            {addresses.length ? (
              <label className="block text-xs font-medium text-stone-700">
                Chọn địa chỉ nhận bánh:
                <select
                  className={inputClass + ' mt-1 w-full text-xs font-medium'}
                  value={selected?.id || ''}
                  disabled={disabled || busy}
                  onChange={(event) => onSelect(event.target.value)}
                >
                  {addresses.map((address) => {
                    const isMatch = isAddressMatchingLocation(address, expectedLocation)
                    return (
                      <option key={address.id} value={address.id}>
                        {address.title} · {formatAddress(address)}{expectedLocation && isMatch ? ' ✓ (Đúng khu vực)' : ''}
                      </option>
                    )
                  })}
                </select>
              </label>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1.5">
                <p className="font-semibold">Chưa có địa chỉ nhận bánh nào.</p>
                <p>Vui lòng thêm địa chỉ giao hàng để hệ thống tính phí và giao bánh chính xác.</p>
                <button
                  type="button"
                  disabled={disabled || busy}
                  className={buttonClass + ' text-xs py-1.5 px-3'}
                  onClick={() => openNewDraft(true)}
                >
                  + Nhập địa chỉ giao hàng
                </button>
              </div>
            )}

            {selected && (
              <div className="rounded-xl border border-primary/15 bg-surface-container-low p-2.5 text-xs text-stone-800 space-y-0.5">
                <p className="font-bold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span>{selected.recipientName} · {selected.recipientPhone}</span>
                </p>
                <p className="text-stone-600 pl-4">{formatAddress(selected)}</p>
              </div>
            )}
          </>
        )}
      </ApiState>

      {draft && (
        <form onSubmit={save} className="space-y-3 pt-2 border-t border-outline-variant/20">
          <p className="text-xs font-bold text-primary">Thông tin địa chỉ nhận bánh mới:</p>
          <AddressFields value={draft} onChange={setDraft} disabled={disabled || busy} showDeliveryNote={false} />
          <div className="flex items-center gap-2 pt-1">
            <button className={buttonClass + ' text-xs py-2 px-4 shadow-sm'} disabled={disabled || busy}>
              {busy ? 'Đang lưu vào hệ thống…' : 'Lưu địa chỉ'}
            </button>
            <button
              type="button"
              disabled={busy}
              className="text-xs text-stone-600 hover:text-stone-900 underline px-2 py-1 cursor-pointer"
              onClick={() => { setDraft(null); setError(null) }}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {error && <ApiErrorMessage error={error} />}
    </section>
  )
}
