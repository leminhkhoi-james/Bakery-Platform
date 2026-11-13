import { useEffect } from 'react'
import { useAuth } from '../context/useAuth.js'
import { useCatalogResource } from './useCatalogResource.js'
import { addressService } from '../services/addressService.js'

export function useUserAddresses() {
  const { user } = useAuth(), userId = user?.id
  const resource = useCatalogResource(() => (userId ? addressService.list() : Promise.resolve([])), [userId])
  const reload = resource.reload
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return
    const mutateListener = () => reload()
    window.addEventListener('sweetcake:api-mutated', mutateListener)
    return () => {
      window.removeEventListener('sweetcake:api-mutated', mutateListener)
    }
  }, [userId, reload])
  return resource
}
