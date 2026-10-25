import { MOCK_USERS } from '../mockData/admin/users.js'

export const authService = {
  async login(email, password) {
    const user = MOCK_USERS.find((u) => u.email === email) || {
      id: 'CUST-DEMO',
      name: 'Khách Hàng Demo',
      email: email || 'demo@sweetcake.vn',
      tier: 'gold',
    }
    localStorage.setItem('sweetcake_current_user', JSON.stringify(user))
    return Promise.resolve(user)
  },

  async getCurrentUser() {
    try {
      const saved = localStorage.getItem('sweetcake_current_user')
      if (saved) return Promise.resolve(JSON.parse(saved))
    } catch {}
    return Promise.resolve(MOCK_USERS[0])
  },

  async logout() {
    localStorage.removeItem('sweetcake_current_user')
    return Promise.resolve(true)
  },
}
