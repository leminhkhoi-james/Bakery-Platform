import { useState } from 'react'
import { displayRuntime } from './displayRuntime.js'
import { authService } from '../services/authService.js'
import { useAuth } from '../context/useAuth.js'

export default function DisplayDataNotice({ onNavigate }) {
  return displayRuntime ? <Notice runtime={displayRuntime} onNavigate={onNavigate} /> : null
}
function Notice({ runtime, onNavigate }) {
  const { source } = useAuth()
  const [busy, setBusy] = useState(false)
  if (!runtime.emptyDemo && source !== 'demo') return null
  return <aside aria-label="Chuyển vai trò" className="fixed bottom-3 left-3 z-[100] max-w-[calc(100vw-1.5rem)] rounded-xl border border-outline-variant bg-surface p-2 text-xs text-primary sm:max-w-md">
    <details><summary className="cursor-pointer font-bold">Chuyển vai trò</summary>
      {runtime.emptyDemo && <div className="mt-2 flex flex-wrap gap-2">{[['CUSTOMER', 'Customer'], ['BAKERY_OWNER', 'Vendor'], ['ADMIN', 'Admin']].map(([role, label]) => <button key={role} disabled={busy} className="rounded border border-outline-variant px-2 py-1" onClick={() => { authService.previewDemo(role); onNavigate(role === 'ADMIN' ? 'admin-dashboard' : role === 'BAKERY_OWNER' ? 'vendor-dashboard' : 'home') }}>{label}</button>)}</div>}
      {source === 'demo' && <button disabled={busy} className="mt-2 underline" onClick={async () => { setBusy(true); try { await authService.exitDemoPreview(); onNavigate('login') } finally { setBusy(false) } }}>Đăng nhập</button>}
    </details>
  </aside>
}
