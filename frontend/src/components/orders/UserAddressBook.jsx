import React, { useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useUserAddresses } from '../../hooks/useUserAddresses.js'
import { addressService } from '../../services/addressService.js'
import { ApiState } from '../management/ApiState.jsx'
import AccountDetails from '../management/AccountDetails.jsx'

export default function UserAddressBook() {
  const { user } = useAuth(), userId = user?.id
  const resource = useUserAddresses()
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), lock = useRef(false)

  async function mutate(action) {
    if (lock.current || !userId) return false
    lock.current = true
    setBusy(true)
    setError(null)
    try {
      await action()
      resource.reload()
      return true
    } catch (failure) {
      setError(failure)
      return false
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  const save = input => mutate(async () => {
    if (input.id) {
      await addressService.update(input.id, input)
    } else {
      await addressService.create(input)
    }
  })

  const remove = id => mutate(async () => {
    await addressService.delete(id)
  })

  return (
    <ApiState resource={resource}>
      <AccountDetails
        kind="addresses"
        user={user}
        addresses={resource.data || []}
        onSave={save}
        onRemove={remove}
        busy={busy}
        error={error}
      />
    </ApiState>
  )
}
