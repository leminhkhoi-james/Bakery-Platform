import { canonicalBakeryId } from '../services/unifiedDataService.js'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { isCatalogId } from '../services/catalogModels.js'
import { loadManagedBakeries, loadOwnerBakery } from '../services/vendorDashboardService.js'
import { useCatalogResource } from './useCatalogResource.js'

function restoredSelection(key, search, useUrl = true) {
  let value = useUrl ? new URLSearchParams(search).get('bakeryId') : null
  try { value ??= sessionStorage.getItem(key) } catch { /* Storage is optional. */ }
  return { key, search, id: isCatalogId(value) ? canonicalBakeryId(value.toLowerCase()) : '', invalid: Boolean(value && !isCatalogId(value)) }
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
  const requestedBakeryId = current.id
  const selectBakery = useCallback((value) => {
    const normalized = isCatalogId(value) ? canonicalBakeryId(value.toLowerCase()) : ''
    setSelection({ key, search: routeSearch, id: normalized })
    try { if (normalized) sessionStorage.setItem(key, normalized); else sessionStorage.removeItem(key) } catch { /* Storage is optional. */ }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (normalized) url.searchParams.set('bakeryId', normalized)
      else url.searchParams.delete('bakeryId')
      for (const param of ['orderId', 'conversationId', 'cakeRequestId', 'offerId']) url.searchParams.delete(param)
      window.history.replaceState(window.history.state, '', url.pathname + url.search)
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
    }
  }, [key, routeSearch])
  const available = useCatalogResource(loadManagedBakeries, { userId: user.id, includeOnboarding: roles.includes('CUSTOMER') })
  const hasMatchingRequested = Boolean(
    requestedBakeryId && available.data?.some((b) => b.id.toLowerCase() === requestedBakeryId.toLowerCase())
  )
  const candidateId = (available.status === 'ready' && !hasMatchingRequested)
    ? (available.data?.[0]?.id || '')
    : (requestedBakeryId || (available.status === 'ready' ? available.data?.[0]?.id || '' : ''))

  useEffect(() => {
    if (available.status === 'ready' && available.data?.length) {
      const nextId = candidateId || available.data[0]?.id
      const urlHasBakery = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('bakeryId')
      if (nextId && (!urlHasBakery || !hasMatchingRequested)) {
        selectBakery(nextId)
      }
    }
  }, [available.status, available.data, candidateId, hasMatchingRequested, selectBakery])

  const access = useCatalogResource(loadOwnerBakery, { bakeryId: available.status === 'ready' ? candidateId : '', userId: user.id, includeOnboarding: roles.includes('CUSTOMER') })
  const error = current.invalid ? { status: 400 } : available.error || access.error
  let state = 'LOADING'
  if (error) state = error.status === 403 ? 'FORBIDDEN' : 'ERROR'
  else if (available.status === 'ready') {
    if (!candidateId) state = 'NO_BAKERY'
    else if (access.status === 'ready' && access.data) state = access.data.status === 'ACTIVE' ? 'ACTIVE' : ['DRAFT', 'PENDING_APPROVAL'].includes(access.data.status) ? 'PENDING' : 'FORBIDDEN'
  }
  const bakery = ['ACTIVE', 'PENDING'].includes(state) ? access.data : null
  const reload = useCallback(() => { available.reload(); access.reload() }, [available.reload, access.reload])
  return { bakeryId: candidateId || current.id || bakery?.id || '', requestedBakeryId: candidateId, bakery, state, error, reload, selectBakery, user, roles, available }
}
