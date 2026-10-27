import { createDemoTransport } from './transport.js'
import { createDemoStore } from './store.js'
import { DEMO_STORAGE_KEY } from './seed.js'
import { isDemoId } from './seed.js'

export let demoRuntime = null
export const isMockRecord = (id) => Boolean(demoRuntime && isDemoId(id))
export function installDemoFallback(getUser) {
  if (import.meta.env?.VITE_ENABLE_MOCK_FALLBACK !== 'true' || demoRuntime) return demoRuntime
  let storage
  try { storage = window.localStorage } catch { /* Use memory if browser storage is unavailable. */ }
  const store = createDemoStore(storage)
  demoRuntime = createDemoTransport({ fetch: window.fetch.bind(window), getUser, store, origin: window.location.origin, baseUrl: import.meta.env?.VITE_API_BASE_URL || '/api/v1' })
  window.fetch = demoRuntime.fetch
  window.addEventListener('storage', (event) => { if (event.key === DEMO_STORAGE_KEY) store.sync(event.newValue) })
  return demoRuntime
}
