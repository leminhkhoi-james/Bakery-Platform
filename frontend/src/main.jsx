import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/artisan-workspace.css'
import './styles/legacy-backgrounds.css'
import './styles/design-system.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { authService } from './services/authService.js'
import { installDisplayData } from './mockData/displayRuntime.js'
import { installBusinessSimulation } from './mockData/business/runtime.js'

if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_BUSINESS_SIMULATION === 'true') {
  await installBusinessSimulation(authService.getSnapshot, window.fetch.bind(window))
} else if (import.meta.env.DEV && import.meta.env.VITE_DEMO_EMPTY_DATA === 'true') {
  installDisplayData(authService.getSnapshot)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
