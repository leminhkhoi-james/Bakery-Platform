import { useCallback, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { isCatalogId } from '../services/catalogModels.js'
import { loadBakeries } from '../services/vendorService.js'
import { useCatalogResource } from './useCatalogResource.js'
import { isDemoId } from '../mockData/seed.js'

export function useVendorBakery(routeSearch = '') {
  const { user, roles } = useAuth()
  const key = 'sweetcake_vendor_bakery:' + user.id
  const [bakeryId, setBakeryId] = useState(() => {
    let value = new URLSearchParams(routeSearch).get('bakeryId')
    try { value ??= sessionStorage.getItem(key) } catch { /* Storage is optional. */ }
    return isCatalogId(value) ? value.toLowerCase() : ''
  })
  const selectBakery = useCallback((value) => {
    const normalized = isCatalogId(value) ? value.toLowerCase() : ''
    setBakeryId(normalized)
    try { if (normalized) sessionStorage.setItem(key, normalized) } catch { /* Storage is optional. */ }
    if (normalized && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('bakeryId', normalized)
      url.searchParams.delete('orderId')
      window.history.replaceState(window.history.state, '', url.pathname + url.search)
    }
  }, [key])
  const loadAvailable = useCallback(async (params, options) => {
    const data = await loadBakeries(params, options)
    options?.signal?.throwIfAborted()
    const sample = data.result.filter((bakery) => isDemoId(bakery.id)).toSorted((a, b) => a.id.localeCompare(b.id))[0]
    if (sample) setBakeryId((current) => current || sample.id)
    return data
  }, [])
  useCatalogResource(loadAvailable, { page: 1, size: 100 })
  return { bakeryId, selectBakery, user, roles }
}
