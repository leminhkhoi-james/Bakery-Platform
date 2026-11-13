import { useRef, useState } from 'react'

export function useMarketplaceAction(reload) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(null)
  const inFlight = useRef(false)
  return { busy, error, run: async (action) => { if (inFlight.current) return; inFlight.current = true; setBusy(true); setError(null); try { await action(); reload?.() } catch (cause) { setError(cause) } finally { inFlight.current = false; setBusy(false) } } }
}
