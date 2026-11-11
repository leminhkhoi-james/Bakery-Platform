import { DemoError } from '../store.js'

export function businessUserDirectory(store) {
  const restriction = (person, actor, action) => {
    if (person?.id === actor?.id || person?.roles?.includes('ADMIN') || person?.roles?.includes('BAKERY_OWNER')) return 'Tài khoản quản trị hoặc chủ tiệm đang được bảo vệ.'
    if (person?.status === 'DELETED') return 'Hồ sơ đã bị xóa.'
    if (action === 'delete' && store.state.orders.some(order => order.customerId === person?.id)) return 'Không thể xóa hồ sơ có đơn liên kết.'
    return null
  }
  return {
    restriction,
    list(params = {}) {
      const search = String(params.email || params.query || '').toLocaleLowerCase('vi')
      const rows = store.state.users.filter(person => person.status !== 'DELETED' && (!search || [person.name, person.email].join(' ').toLocaleLowerCase('vi').includes(search)) && (!params.role || person.roles.includes(params.role)) && (!params.status || person.status === params.status || params.status === 'SUSPENDED' && person.status === 'BLOCKED'))
      rows.sort((a, b) => params.sort === 'displayName,asc' ? String(a.displayName || a.name || '').localeCompare(String(b.displayName || b.name || ''), 'vi') || a.id.localeCompare(b.id) : String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || a.id.localeCompare(b.id))
      const size = Math.max(1, Math.min(100, Number(params.size) || 12)), pages = Math.ceil(rows.length / size), page = Math.min(Math.max(1, Number(params.page) || 1), Math.max(1, pages))
      return { result: structuredClone(rows.slice((page - 1) * size, page * size)), meta: { page, pageSize: size, pages, total: rows.length }, localCrud: true }
    },
    async change(actor, action, id, input = {}) {
      if (store.inTransaction) throw new DemoError('Đang lưu thay đổi khác. Vui lòng thử lại.', 409)
      await store.refresh(); store.requireUser(actor, 'ADMIN')
      const person = id ? store.find('users', id) : null, blocked = person && restriction(person, actor, action)
      if (blocked) throw new DemoError(blocked, 403)
      const before = structuredClone(store.state)
      try {
        let result
        if (action === 'save') {
          if (!input.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email?.trim() || '')) throw new DemoError('Vui lòng kiểm tra họ tên và email.', 422)
          if (store.state.users.some(row => row.id !== id && row.email?.toLowerCase() === input.email.trim().toLowerCase())) throw new DemoError('Email đã được sử dụng.', 409)
          result = person || { id: store.id(), roles: ['CUSTOMER'], status: 'ACTIVE', createdAt: new Date().toISOString() }
          if (!person && input.role) {
            if (!['CUSTOMER', 'BAKERY_OWNER', 'ADMIN'].includes(input.role)) throw new DemoError('Vai trò không hợp lệ.', 422)
            result.roles = input.role === 'BAKERY_OWNER' ? ['CUSTOMER', 'BAKERY_OWNER'] : [input.role]
          }
          Object.assign(result, { name: input.name.trim(), displayName: input.name.trim(), email: input.email.trim() })
          if (!person) store.state.users.push(result)
        } else if (action === 'roles') {
          if (!person || !Array.isArray(input.roles) || !input.roles.length || input.roles.some(role => !['CUSTOMER', 'BAKERY_OWNER', 'ADMIN'].includes(role))) throw new DemoError('Vai trò không hợp lệ.', 422)
          person.roles = [...new Set(input.roles)]; result = person
        } else if (action === 'status') {
          if (input.expectedStatus && input.expectedStatus !== person.status) throw new DemoError('Trạng thái vừa thay đổi. Vui lòng tải lại.', 409)
          person.status = person.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'; result = person
        } else if (action === 'delete') { person.status = 'DELETED'; result = null }
        else throw new DemoError('Thao tác không hợp lệ.', 422)
        await store.save(); return structuredClone(result)
      } catch (error) { Object.assign(store.state, before); throw error }
    },
  }
}
