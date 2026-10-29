// Isolated browser fixture: existing app and mock graph, no authentication implementation.
import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import App from '../../src/App.jsx'
import { AuthContext } from '../../src/context/useAuth.js'
import { installDemoFallback, demoRuntime } from '../../src/mockData/runtime.js'
import '../../src/index.css'
import '../../src/styles/artisan-workspace.css'
import '../../src/styles/legacy-backgrounds.css'
import '../../src/styles/design-system.css'
const actors = ['CUSTOMER', 'BAKERY_OWNER', 'ADMIN'].map((role, i) => ({ id: `fa000000-0000-4000-8000-00000000000${i === 2 ? 4 : i + 1}`, displayName: ['Khách kiểm thử', 'Chủ tiệm kiểm thử', 'Quản trị kiểm thử'][i], email: `role${i}@example.invalid`, roles: [role] }))
const saved = sessionStorage.getItem('sweetcake.role-actions.qa')
let currentUser = saved ? actors.find(actor => actor.id === saved) || null : null
installDemoFallback(() => currentUser)
for (const actor of actors) demoRuntime.store.bind(actor)
function persistActor(actor) { currentUser = actor; if (actor) sessionStorage.setItem('sweetcake.role-actions.qa', actor.id); else sessionStorage.removeItem('sweetcake.role-actions.qa') }
export default function Preview() {
 const [user, setUser] = useState(currentUser), [status, setStatus] = useState('loading')
 useEffect(() => { queueMicrotask(() => setStatus(currentUser ? 'authenticated' : 'anonymous')) }, [])
 const choose = actor => { persistActor(actor); setUser(actor); setStatus(actor ? 'authenticated' : 'anonymous') }
 return <AuthContext.Provider value={{ user, status, roles: user?.roles || [], isAuthenticated: !!user, logout: async () => choose(null), restoreSession: async () => {} }}>
 <div aria-label="Vai trò kiểm thử" style={{ position:'fixed', bottom:0, right:0, zIndex:100, padding:4, display:'flex', gap:8, flexWrap:'wrap', background:'#fff' }}>{actors.map((actor, i) => <button className="sc-button" key={actor.id} onClick={() => choose(actor)}>{['Khách hàng', 'Chủ tiệm', 'Quản trị viên'][i]}</button>)}<button className="sc-button" onClick={() => choose(null)}>Đăng xuất kiểm thử</button></div>
 <App />
 </AuthContext.Provider>
}
createRoot(document.getElementById('root')).render(<Preview />)
