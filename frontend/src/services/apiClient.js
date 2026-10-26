/**
 * apiClient.js - Centralized HTTP client for Bakery Platform Frontend
 * 
 * Handles:
 * - Base URL configuration (via VITE_API_BASE_URL or default /api/v1)
 * - Automatic Authorization header with JWT Bearer token
 * - Standard ApiResponse unwrapping: response.data
 * - Propagate backend/network errors without mock data or fake sessions
 */

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api/v1'

let accessToken = ''
let sessionVersion = 0
let refreshPromise = null
const sessionListeners = new Set()

export const getAuthToken = () => {
  return accessToken
}

export const setAuthToken = (token) => {
  accessToken = token || ''
  // Remove credentials cached by the previous demo client. Never persist new JWTs.
  try {
    localStorage.removeItem('sweetcake_access_token')
  } catch {
    // Ignore localStorage errors
  }
}

export const onSessionExpired = (listener) => {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

export const clearAuthSession = () => {
  sessionVersion += 1
  setAuthToken(null)
  sessionListeners.forEach((listener) => listener())
}

export function refreshAccessToken() {
  if (refreshPromise) return refreshPromise
  const version = sessionVersion
  const refresh = async () => {
    const token = await request('/auth/refresh', {
      method: 'POST', auth: false, retryAuth: false,
    })
    if (version !== sessionVersion) throw new ApiError('Phiên đăng nhập đã kết thúc.', 401)
    if (!token?.accessToken || token.tokenType !== 'Bearer') {
      throw new ApiError('Identity trả về phiên đăng nhập không hợp lệ.', 502)
    }
    setAuthToken(token.accessToken)
    return token.accessToken
  }
  // Cookies are shared by tabs; serialize rotations when Web Locks is available.
  refreshPromise = Promise.resolve().then(() => globalThis.navigator?.locks
    ? navigator.locks.request('sweetcake-auth-refresh', refresh)
    : refresh())
    .catch((error) => {
      if (error.status === 401 && version === sessionVersion) clearAuthSession()
      throw error
    })
    .finally(() => { refreshPromise = null })
  return refreshPromise
}

/**
 * Custom error wrapper containing response status and data
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Execute HTTP request
 * @param {string} endpoint - API endpoint (e.g. '/auth/login', '/products')
 * @param {RequestInit} [options] - fetch options
 * @param {Function} [mockFallback] - optional fallback function if network fails or backend is unreachable
 */
export async function request(endpoint, options = {}, mockFallback = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`

  const { auth = true, retryAuth = true, ...fetchOptions } = options
  const headers = new Headers(fetchOptions.headers || {})

  // Set default Content-Type for JSON if body is provided and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Attach Bearer token if available
  const token = auth ? getAuthToken() : ''
  const explicitAuthorization = headers.has('Authorization')
  const version = sessionVersion
  if (token && !explicitAuthorization) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      credentials: 'include',
      signal: fetchOptions.signal || AbortSignal.timeout(10000),
      headers,
    })

    const isSessionEndpoint = /\/auth\/(login|register|refresh|logout)$/.test(endpoint)
    if (response.status === 401 && auth && retryAuth && !explicitAuthorization && !isSessionEndpoint) {
      // Another request may have rotated the token while this one was in flight.
      if (version !== sessionVersion) throw new ApiError('Phiên đăng nhập đã kết thúc.', 401)
      if (!getAuthToken() || getAuthToken() === token) await refreshAccessToken()
      return request(endpoint, { ...options, retryAuth: false }, mockFallback)
    }
    if (response.status === 401 && auth && !isSessionEndpoint && version === sessionVersion) {
      clearAuthSession()
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null
    }

    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')
    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && (data.message || data.error)) ||
        `Request failed with status ${response.status}`
      throw new ApiError(errorMessage, response.status, data)
    }

    // Backend wraps response in ApiResponse: { statusCode, message, data, timestamp }
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data
    }

    return data
  } catch (error) {
    // If backend is down or network unreachable, and fallback is provided, use fallback
    if (mockFallback && (error.name === 'TypeError' || error.status >= 500)) {
      console.warn(`[API] Fallback to mock for ${endpoint} due to:`, error.message)
      return mockFallback()
    }
    if (error.name === 'TypeError' || error.name === 'TimeoutError') {
      throw new ApiError('Không thể kết nối backend. Vui lòng thử lại.', 0)
    }
    throw error
  }
}

export const api = {
  get: (endpoint, options = {}, fallback = null) =>
    request(endpoint, { method: 'GET', ...options }, fallback),
  post: (endpoint, body, options = {}, fallback = null) =>
    request(
      endpoint,
      {
        method: 'POST',
        body: body instanceof FormData ? body : JSON.stringify(body),
        ...options,
      },
      fallback
    ),
  put: (endpoint, body, options = {}, fallback = null) =>
    request(
      endpoint,
      {
        method: 'PUT',
        body: body instanceof FormData ? body : JSON.stringify(body),
        ...options,
      },
      fallback
    ),
  patch: (endpoint, body, options = {}, fallback = null) =>
    request(
      endpoint,
      {
        method: 'PATCH',
        body: body instanceof FormData ? body : JSON.stringify(body),
        ...options,
      },
      fallback
    ),
  delete: (endpoint, options = {}, fallback = null) =>
    request(endpoint, { method: 'DELETE', ...options }, fallback),
}
