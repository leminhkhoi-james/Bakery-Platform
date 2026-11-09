import React, { useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useUserAddresses } from '../../hooks/useUserAddresses.js'
import { browserUserData, loadUserAddresses, isDefaultAddress } from '../../services/userLocalData.js'
import { ApiError } from '../../services/apiClient.js'
import { ApiState } from '../management/ApiState.jsx'
import AccountDetails from '../management/AccountDetails.jsx'

// Identity has only an internal address lookup, so these are local address notes.
// They are never sent to Order Service as Backend address IDs.
export default function UserAddressBook() {
  const { user } = useAuth(), userId = user?.id
  const resource = useUserAddresses()
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), lock = useRef(false)
  async function mutate(change) {
    if (lock.current || !userId) return false
    lock.current = true; setBusy(true); setError(null)
    try {
      const rows = await loadUserAddresses({ userId })
      browserUserData().write(userId, 'addresses', change(rows))
      resource.reload(); return true
    } catch (failure) { setError(failure); return false }
    finally { lock.current = false; setBusy(false) }
  }
  const save = input => mutate(rows => {
    const fields = ['title', 'recipientName', 'recipientPhone', 'addressLine', 'ward', 'district', 'city']
    const row = Object.fromEntries(fields.map(key => [key, String(input[key] || '').trim()]))
    if (['recipientName', 'recipientPhone', 'addressLine', 'district', 'city'].some(key => !row[key] || row[key].length > 255)) throw new ApiError('Vui lòng điền đủ thông tin người nhận và địa chỉ.', 422)
    if (input.id && !rows.some(value => value.id === input.id)) throw new ApiError('Không tìm thấy địa chỉ của tài khoản này.', 404)
    const previous = rows.find(value => value.id === input.id)
    const defaultAddress = typeof input.isDefault === 'boolean' ? input.isDefault : previous ? isDefaultAddress(previous) : rows.length === 0
    const others = rows.filter(value => value.id !== input.id).map(value => defaultAddress ? { ...value, isDefault: false, isPrimary: false, primary: false } : value)
    const next = [...others, { ...row, id: input.id || 'local-address:' + crypto.randomUUID(), customerId: userId, isDefault: defaultAddress }]
    if (next.length && !next.some(isDefaultAddress)) next[0] = { ...next[0], isDefault: true }
    return next
  })
  const remove = id => mutate(rows => {
    if (!rows.some(row => row.id === id)) throw new ApiError('Không tìm thấy địa chỉ của tài khoản này.', 404)
    const next = rows.filter(row => row.id !== id)
    if (next.length && !next.some(isDefaultAddress)) next[0] = { ...next[0], isDefault: true }
    return next
  })
  return <ApiState resource={resource}><AccountDetails kind="addresses" user={user} addresses={resource.data || []} onSave={save} onRemove={remove} busy={busy} error={error} /><p className="mt-3 text-xs text-on-surface-variant">Địa chỉ chỉ được lưu trên trình duyệt này, chưa đồng bộ với tài khoản trên hệ thống.</p></ApiState>
}
