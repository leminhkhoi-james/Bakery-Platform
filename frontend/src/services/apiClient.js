/**
 * apiClient.js - Centralized HTTP client for Bakery Platform Frontend
 * 
 * Handles:
 * - Base URL configuration (via VITE_API_BASE_URL or default /api/v1)
 * - Automatic Authorization header with JWT Bearer token
 * - Standard ApiResponse unwrapping: response.data
 * - Graceful fallback to mock data / mock provider when backend is offline
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const getAuthToken = () => {
  try {
    return localStorage.getItem('sweetcake_access_token') || ''
  } catch {
    return ''
  }
}

export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('sweetcake_access_token', token)
    } else {
      localStorage.removeItem('sweetcake_access_token')
    }
  } catch {
    // Ignore localStorage errors
  }
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

  const headers = new Headers(options.headers || {})

  // Set default Content-Type for JSON if body is provided and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Attach Bearer token if available
  const token = getAuthToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

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
