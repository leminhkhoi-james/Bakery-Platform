import { api, setAuthToken } from './apiClient.js'
import { MOCK_USERS } from '../mockData/admin/users.js'

export const authService = {
  /**
   * Log in user with email and password
   * Calls POST /api/v1/auth/login
   */
  async login(email, password) {
    try {
      const result = await api.post('/auth/login', { email, password })
      if (result && result.accessToken) {
        setAuthToken(result.accessToken)
        // Fetch current user details
        const profile = await this.getCurrentUser()
        return profile
      }
      return result
    } catch (error) {
      console.warn('[authService.login] API failed, fallback to mock demo user:', error.message)
      const user = MOCK_USERS.find((u) => u.email === email) || {
        id: 'CUST-DEMO',
        name: 'Khách Hàng Demo',
        email: email || 'demo@sweetcake.vn',
        tier: 'gold',
        roles: ['CUSTOMER'],
      }
      localStorage.setItem('sweetcake_current_user', JSON.stringify(user))
      return user
    }
  },

  /**
   * Register a new user
   * Calls POST /api/v1/auth/register
   */
  async register({ email, password, displayName, phoneNumber }) {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        displayName,
        phoneNumber,
      })
      return response
    } catch (error) {
      console.warn('[authService.register] API failed, fallback to local register:', error.message)
      const newUser = {
        id: `USER-${Date.now().toString().slice(-4)}`,
        displayName: displayName || 'Quý Khách',
        email,
        phoneNumber,
        roles: ['CUSTOMER'],
      }
      localStorage.setItem('sweetcake_current_user', JSON.stringify(newUser))
      return newUser
    }
  },

  /**
   * Get current authenticated user
   * Calls GET /api/v1/auth/me
   */
  async getCurrentUser() {
    try {
      const profile = await api.get('/auth/me')
      if (profile) {
        localStorage.setItem('sweetcake_current_user', JSON.stringify(profile))
        return profile
      }
    } catch {
      // ignore
    }

    // Fallback to cached or mock user
    try {
      const saved = localStorage.getItem('sweetcake_current_user')
      if (saved) return JSON.parse(saved)
    } catch {}

    return MOCK_USERS[0]
  },

  /**
   * Logout user
   * Calls POST /api/v1/auth/logout
   */
  async logout() {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // ignore network errors on logout
    } finally {
      setAuthToken(null)
      localStorage.removeItem('sweetcake_current_user')
      localStorage.removeItem('sweetcake_user_profile')
    }
    return true
  },
}
