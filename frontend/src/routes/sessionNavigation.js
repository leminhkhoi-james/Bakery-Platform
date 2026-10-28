import { canAccess, requiredRoles } from './routeAccess.js'

export function sessionIdentity(user) {
  return user ? `${user.id || ''}:${[...(user.roles || [])].sort().join(',')}` : null
}

export function roleLandingPage(user) {
  const roles = user?.roles || []
  if (roles.includes('ADMIN')) return 'admin-dashboard'
  if (roles.includes('BAKERY_OWNER')) return 'vendor-dashboard'
  return 'home'
}

// Restoring an existing session keeps valid deep links; a new account starts at its workspace.
export function sessionRedirect({ page, status, user }, previous = {}) {
  if (status === 'anonymous' && requiredRoles(page) !== null) return 'login'
  if (status !== 'authenticated' || !user) return null
  const identity = sessionIdentity(user)
  const accountChanged = previous.identity && previous.identity !== identity
  const signedIn = previous.status === 'anonymous'
  const invalidRestoredRoute = !previous.identity && !canAccess(page, user)
  const target = page === 'login' || accountChanged || signedIn || invalidRestoredRoute ? roleLandingPage(user) : null
  return target
}
