import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthContext } from '../../src/context/useAuth.js'
import { UserDirectory } from '../../src/pages/admin/users/AdminUsersPage.jsx'
import '../../src/index.css'
import '../../src/styles/artisan-workspace.css'
import '../../src/styles/design-system.css'
import '../../src/components/management/admin-tables.css'

const actor = { id: '10000000-0000-4000-8000-000000000001', displayName: 'SweetCake Admin', roles: ['ADMIN'], status: 'ACTIVE', email: 'admin@example.test' }
const person = { ...actor, id: '20000000-0000-4000-8000-000000000002', displayName: 'Nguyễn Minh Anh', roles: ['CUSTOMER'], email: 'minhanh@example.test' }
window.__userWrites = []
window.fetch = async (url, options = {}) => {
  if ((options.method || 'GET') !== 'GET') { window.__userWrites.push(url); return Response.json({ message: 'Fixture write disabled' }, { status: 503 }) }
  return Response.json({ data: { result: [actor, person], meta: { page: 1, pageSize: 12, total: 2, pages: 1 } } })
}
createRoot(document.getElementById('root')).render(<AuthContext.Provider value={{ user: actor, roles: actor.roles }}>
  <main className="sc-portal sc-portal--admin" style={{ padding: '24px' }}><h1>Quản lý người dùng</h1><UserDirectory /></main>
</AuthContext.Provider>)
