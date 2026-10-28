import { useState } from 'react'

export function useMarketplaceAction(reload) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(null)
  return { busy, error, run: async (action) => { if (busy) return; setBusy(true); setError(null); try { await action(); reload?.() } catch (cause) { setError(cause) } finally { setBusy(false) } } }
}
