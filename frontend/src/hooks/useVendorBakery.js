import { useCallback, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { isCatalogId } from '../services/catalogModels.js'
import { loadManagedBakeries } from '../services/vendorDashboardService.js'
import { useCatalogResource } from './useCatalogResource.js'

function restoredSelection(key, search, useUrl = true) {
  let value = useUrl ? new URLSearchParams(search).get('bakeryId') : null
  try { value ??= sessionStorage.getItem(key) } catch { /* Storage is optional. */ }
  return { key, search, id: isCatalogId(value) ? value.toLowerCase() : '' }
}

export function useVendorBakery(routeSearch = '') {
  const { user, roles } = useAuth()
  const key = 'sweetcake_vendor_bakery:' + user.id
  const [selection, setSelection] = useState(() => restoredSelection(key, routeSearch))
  let current = selection
  if (selection.key !== key || selection.search !== routeSearch) {
    // Synchronize URL changes before child resources can request the old shop.
    // A changed account restores its own selection, never the previous actor's URL.
    current = restoredSelection(key, routeSearch, selection.key === key)
    setSelection(current)
  }
  const bakeryId = current.id
  const selectBakery = useCallback((value) => {
    const normalized = isCatalogId(value) ? value.toLowerCase() : ''
    setSelection({ key, search: routeSearch, id: normalized })
    try { if (normalized) sessionStorage.setItem(key, normalized); else sessionStorage.removeItem(key) } catch { /* Storage is optional. */ }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (normalized) url.searchParams.set('bakeryId', normalized)
      else url.searchParams.delete('bakeryId')
      url.searchParams.delete('orderId')
      window.history.replaceState(window.history.state, '', url.pathname + url.search)
    }
  }, [key, routeSearch])
  const loadAvailable = useCallback(async (params, options) => {
    const data = await loadManagedBakeries(params, options)
    options?.signal?.throwIfAborted()
    if (data.length) setSelection((current) => current.key === key && current.id ? current : { key, search: routeSearch, id: data[0].id })
    return data
  }, [key, routeSearch])
  const available = useCatalogResource(loadAvailable, { userId: user.id })
  return { bakeryId, selectBakery, user, roles, available }
}
