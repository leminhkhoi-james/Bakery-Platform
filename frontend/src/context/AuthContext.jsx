import { useEffect, useSyncExternalStore } from 'react'
import { authService } from '../services/authService.js'
import { AuthContext } from './useAuth.js'

export function AuthProvider({ children }) {
  const session = useSyncExternalStore(authService.subscribe, authService.getSnapshot, authService.getSnapshot)
  useEffect(() => { void authService.restoreSession() }, [])

  return (
    <AuthContext.Provider value={{
      ...session,
      roles: session.user?.roles || [],
      isAuthenticated: session.status === 'authenticated',
      login: authService.login,
      register: authService.register,
      logout: authService.logout,
      restoreSession: authService.restoreSession,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

