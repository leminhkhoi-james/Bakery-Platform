import { useCallback, useEffect, useState } from 'react'

export function useCatalogResource(load, params = {}) {
  const paramsKey = JSON.stringify(params)
  const [revision, setRevision] = useState(0)
  const key = paramsKey + ':' + revision
  const [resource, setResource] = useState({ key: null, data: null, error: null, status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    let current = true
    load(JSON.parse(paramsKey), { signal: controller.signal }).then(
      (data) => { if (current) setResource({ key, data, error: null, status: 'ready' }) },
      (error) => { if (current && !controller.signal.aborted) setResource({ key, data: null, error, status: 'error' }) },
    )
    return () => { current = false; controller.abort() }
  }, [load, paramsKey, key])
  const reload = useCallback(() => setRevision((value) => value + 1), [])
  return { ...(resource.key === key ? resource : { data: null, error: null, status: 'loading' }), reload }
}
