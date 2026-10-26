import { api, ApiError, clearAuthSession, onSessionExpired, refreshAccessToken, setAuthToken } from './apiClient.js'

let snapshot = { user: null, status: 'loading', error: null }
let restorePromise = null
let operation = 0
const listeners = new Set()
const publish = (value) => {
  snapshot = value
  listeners.forEach((listener) => listener())
}
const anonymous = (error = null) => publish({ user: null, status: 'anonymous', error })
onSessionExpired(() => anonymous())

function logoutPending(value) {
  try {
    if (value !== undefined) {
      if (value) sessionStorage.setItem('sweetcake_logout_pending', 'true')
      else sessionStorage.removeItem('sweetcake_logout_pending')
    }
    return sessionStorage.getItem('sweetcake_logout_pending') === 'true'
  } catch { return false }
}

function removeDemoSession() {
  try {
    for (const key of ['sweetcake_access_token', 'sweetcake_current_user', 'sweetcake_user_profile']) {
      localStorage.removeItem(key)
    }
  } catch { /* Storage can be disabled by the browser. */ }
}

async function profile() {
  const user = await api.get('/auth/me', { retryAuth: false })
  if (!user?.id || !Array.isArray(user.roles)) {
    throw new ApiError('Identity trả về thông tin tài khoản không hợp lệ.', 502)
  }
  return user
}

async function revokeSession() {
  // Identity requires an authenticated user even though revocation uses a cookie.
  await refreshAccessToken()
  return api.post('/auth/logout', {}, { retryAuth: false })
}

export const authService = {
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot: () => snapshot,

  restoreSession() {
    if (restorePromise) return restorePromise
    if (snapshot.status === 'authenticated') return Promise.resolve(snapshot.user)
    const current = ++operation
    publish({ user: null, status: 'loading', error: null })
    removeDemoSession()
    restorePromise = (async () => {
      try {
        if (logoutPending()) {
          await revokeSession()
          logoutPending(false)
          clearAuthSession()
          return null
        }
        await refreshAccessToken()
        const user = await profile()
        if (current === operation) publish({ user, status: 'authenticated', error: null })
        return user
      } catch (error) {
        if (current === operation) {
          clearAuthSession()
          if (error.status === 401) {
            logoutPending(false)
            anonymous()
          } else publish({ user: null, status: 'error', error })
        }
        return null
      } finally {
        if (current === operation && snapshot.status === 'loading') anonymous()
      }
    })().finally(() => { restorePromise = null })
    return restorePromise
  },

  async login(email, password) {
    await restorePromise
    const current = ++operation
    clearAuthSession()
    removeDemoSession()
    try {
      const token = await api.post('/auth/login', { email, password }, { auth: false, retryAuth: false })
      if (!token?.accessToken || token.tokenType !== 'Bearer') {
        throw new ApiError('Identity trả về phiên đăng nhập không hợp lệ.', 502)
      }
      if (current !== operation) throw new ApiError('Phiên đăng nhập đã thay đổi.', 401)
      setAuthToken(token.accessToken)
      const user = await profile()
      if (current !== operation) throw new ApiError('Phiên đăng nhập đã thay đổi.', 401)
      logoutPending(false)
      publish({ user, status: 'authenticated', error: null })
      return user
    } catch (error) {
      if (current === operation) {
        clearAuthSession()
        anonymous(error)
      }
      throw error
    }
  },

  register({ email, password, displayName, phoneNumber }) {
    return api.post('/auth/register', { email, password, displayName, phoneNumber }, {
      auth: false, retryAuth: false,
    })
  },

  getCurrentUser: () => api.get('/auth/me'),

  async logout() {
    ++operation
    logoutPending(true)
    anonymous()
    let failure = null
    try {
      await restorePromise
      await revokeSession()
      logoutPending(false)
    } catch (error) {
      if (error.status === 401) logoutPending(false)
      else failure = error
    } finally {
      clearAuthSession()
      removeDemoSession()
      anonymous(failure)
    }
    if (failure) throw failure
  },
}
