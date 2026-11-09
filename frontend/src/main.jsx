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

const realFetch = window.fetch.bind(window)
installDisplayData(authService.getSnapshot)
installBusinessSimulation(authService.getSnapshot, realFetch).then(() => createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
))
