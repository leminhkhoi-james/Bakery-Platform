import { useEffect, useState } from 'react'
import { useCatalogResource } from './useCatalogResource.js'
import { loadCustomerNotifications } from '../services/customerNotifications.js'

function readSeen(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]')
    return new Set(Array.isArray(saved) ? saved : [])
  } catch {
    return new Set()
  }
}

export function useCustomerNotifications(user) {
  return useNotifications(loadCustomerNotifications, { enabled: Boolean(user?.id && user.roles?.includes('CUSTOMER')) },
    'customer-notifications.' + (user?.id || ''))
}

export function useNotifications(load, params, scope) {
  const key = 'sweetcake.' + scope
  const [readState, setReadState] = useState(null)
  const seen = readState?.key === key ? readState.seen : readSeen(key)
  const { enabled } = params
  const resource = useCatalogResource(load, params)
  const { reload, status, refreshing } = resource

  useEffect(() => {
    if (!enabled || status === 'loading' || refreshing) return
    const timer = setTimeout(() => { if (!document.hidden) reload() }, 10000)
    return () => clearTimeout(timer)
  }, [enabled, reload, status, refreshing, resource.data, resource.error])

  function markRead(ids) {
    const next = new Set([...seen, ...ids].slice(-200))
    setReadState({ key, seen: next })
    try { localStorage.setItem(key, JSON.stringify([...next])) } catch { /* Keep read state for this session. */ }
  }

  return { ...resource, markRead, items: (resource.data?.items || []).map(item => ({ ...item, unread: !seen.has(item.id) })) }
}
