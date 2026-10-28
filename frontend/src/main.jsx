import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/artisan-workspace.css'
import './styles/legacy-backgrounds.css'
import './styles/design-system.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { authService } from './services/authService.js'
import { installDemoFallback } from './mockData/runtime.js'

installDemoFallback(() => {
  const session = authService.getSnapshot()
  if (session.status === 'authenticated') return session.user
  try {
    const saved = JSON.parse(window?.sessionStorage?.getItem('sweetcake_demo_auth_user') || 'null')
    if (saved?.id) return saved
  } catch {}
  return null
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
