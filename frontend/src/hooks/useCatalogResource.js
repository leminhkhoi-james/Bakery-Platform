import { AuthContext } from '../context/useAuth.js'
import { sessionIdentity } from '../routes/sessionNavigation.js'
import { useCallback, useContext, useEffect, useState } from 'react'
import { demoRuntime } from '../mockData/runtime.js'

export function useCatalogResource(load, params = {}) {
  const actor = sessionIdentity(useContext(AuthContext)?.user)
  const paramsKey = JSON.stringify(params)
  const [revision, setRevision] = useState(0)
  const key = actor + ':' + paramsKey + ':' + revision
  const [resource, setResource] = useState({ key: null, paramsKey: null, actor: null, data: null, error: null, status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    let current = true
    load(JSON.parse(paramsKey), { signal: controller.signal }).then(
      (data) => { if (current) setResource({ key, paramsKey, actor, data, error: null, status: 'ready' }) },
      (error) => { if (current && !controller.signal.aborted) setResource({ key, paramsKey, actor, data: null, error, status: 'error' }) },
    )
    return () => { current = false; controller.abort() }
  }, [load, paramsKey, key, actor])
  const reload = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => demoRuntime?.store.subscribe(reload), [reload])
  const sameQuery = resource.actor === actor && resource.paramsKey === paramsKey && resource.status === 'ready'
  const currentResource = resource.key === key ? resource : sameQuery ? { ...resource, refreshing: true } : { data: null, error: null, status: 'loading' }
  return { data: currentResource.data, error: currentResource.error, status: currentResource.status, refreshing: Boolean(currentResource.refreshing), reload }
}
