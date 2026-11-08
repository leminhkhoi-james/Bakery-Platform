import { useEffect } from 'react'
import { useAuth } from '../context/useAuth.js'
import { useCatalogResource } from './useCatalogResource.js'
import { loadUserAddresses, userDataKey } from '../services/userLocalData.js'

export function useUserAddresses() {
  const { user } = useAuth(), userId = user?.id
  const resource = useCatalogResource(loadUserAddresses, { userId })
  const reload = resource.reload
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return
    const local = event => { if (event.detail?.userId === userId && event.detail.feature === 'addresses') reload() }
    const stored = event => { if (event.key === userDataKey(userId, 'addresses')) reload() }
    window.addEventListener('sweetcake:user-data-changed', local)
    window.addEventListener('storage', stored)
    return () => {
      window.removeEventListener('sweetcake:user-data-changed', local)
      window.removeEventListener('storage', stored)
    }
  }, [userId, reload])
  return resource
}
