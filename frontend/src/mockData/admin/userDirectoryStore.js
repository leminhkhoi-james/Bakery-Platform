import { demoId } from '../seed.js'

export const USER_DIRECTORY_KEY = 'sweetcake.demo.users.v1'
const fail = (message, status = 422) => { const error = new Error('DEMO: ' + message); error.status = status; throw error }
const valid = (value) => value?.version === 1 && Number.isSafeInteger(value.nextId) && Array.isArray(value.users) && value.users.every((row) => row?.id && Array.isArray(row.roles))
export function createUserDirectory({ storage, seedUsers, protectedIds = [], linkedIds = [], onChange = () => {} }) {
  let state = { version: 1, nextId: 2000000, users: structuredClone(seedUsers) }, lastSaved = null
  function reload() {
    let raw
    try { raw = storage?.getItem(USER_DIRECTORY_KEY) } catch { return }
    if (!raw || raw === lastSaved) return
    let saved
    try { saved = JSON.parse(raw) } catch { fail('Dữ liệu người dùng đã lưu không đọc được; dữ liệu cũ được giữ nguyên.') }
    if (!valid(saved)) fail('Định dạng danh sách đã lưu không hợp lệ; không ghi đè dữ liệu cũ.')
    state = saved; lastSaved = raw
  }
  const authorize = (actor) => { if (!actor?.id || !actor.roles?.includes('ADMIN')) fail('Cần quyền Admin để quản lý hồ sơ mẫu.', 403) }
  function restriction(person, actor, action = 'delete') {
    if (person?.id === actor?.id || protectedIds.includes(person?.id) || person?.roles?.includes('ADMIN') || person?.protected) return 'Tài khoản đang đăng nhập hoặc tài khoản quản trị được bảo vệ.'
    if (person?.status === 'DELETED') return 'Hồ sơ đã bị xóa.'
    if (action === 'delete' && linkedIds.includes(person?.id)) return 'Người dùng có đơn hàng hoặc tiệm bánh liên kết, không thể xóa.'
    return null
  }
  function commit(next) {
    if (!storage?.setItem) fail('Trình duyệt không cho lưu localStorage. Chưa có thay đổi nào được lưu.', 503)
    const raw = JSON.stringify(next)
    try { storage.setItem(USER_DIRECTORY_KEY, raw) } catch { fail('Không thể lưu trên trình duyệt. Chưa có thay đổi nào được lưu.', 503) }
    state = next; lastSaved = raw; onChange()
  }
  function change(actor, action, id, input = {}) {
    authorize(actor); reload()
    const next = structuredClone(state), person = id ? next.users.find((row) => row.id === id) : null
    if (id && !person) fail('Hồ sơ không còn tồn tại. Vui lòng tải lại danh sách.', 404)
    const reason = person && restriction(person, actor, action)
    if (reason) fail(reason, 403)
    let result
    if (action === 'save') {
      const name = input.name?.trim(), email = input.email?.trim()
      if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || email.length > 254) fail('Vui lòng kiểm tra họ tên và email.')
      if (next.users.some((row) => row.id !== id && row.email?.toLowerCase() === email.toLowerCase())) fail('Email đã được sử dụng.', 409)
      if (person) { Object.assign(person, { name, email, updatedAt: new Date().toISOString() }); if (Object.hasOwn(person, 'displayName')) person.displayName = name; if (Object.hasOwn(person, 'fullName')) person.fullName = name; result = person }
      else {
        let allocated
        do { allocated = demoId(next.nextId++) } while (next.users.some((row) => row.id === allocated))
        const role = input.role || 'CUSTOMER'
        if (!['CUSTOMER', 'BAKERY_OWNER', 'ADMIN'].includes(role)) fail('Vai trò không hợp lệ.')
        result = { id: allocated, name, email, roles: role === 'BAKERY_OWNER' ? ['CUSTOMER', role] : [role], status: 'ACTIVE', createdAt: new Date().toISOString() }
        next.users.unshift(result)
      }
    } else if (action === 'roles') {
      if (!person || !Array.isArray(input.roles) || !input.roles.length ||
          input.roles.some(role => !['CUSTOMER', 'BAKERY_OWNER', 'ADMIN'].includes(role))) fail('Vai trò không hợp lệ.')
      person.roles = [...new Set(input.roles)]
      result = person
    } else if (action === 'status') {
      if (!['ACTIVE', 'SUSPENDED', 'BLOCKED'].includes(person.status)) fail('Trạng thái không cho phép thao tác.', 409)
      if (input.expectedStatus && input.expectedStatus !== person.status) fail('Trạng thái vừa thay đổi. Vui lòng tải lại và xác nhận.', 409)
      person.status = person.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'; person.updatedAt = new Date().toISOString(); result = person
    } else if (action === 'delete') { next.users = next.users.filter((row) => row.id !== id); result = null }
    else fail('Thao tác chưa được hỗ trợ.')
    commit(next)
    return structuredClone(result)
  }
  return {
    restriction, change,
    list(params = {}) {
      reload()
      const search = String(params.email || params.query || '').trim().toLocaleLowerCase('vi')
      const rows = state.users.filter((person) => (!search || [person.name, person.displayName, person.fullName, person.email].filter(Boolean).join(' ').toLocaleLowerCase('vi').includes(search)) && (!params.role || person.roles.includes(params.role)) && (!params.status || person.status === params.status || params.status === 'SUSPENDED' && person.status === 'BLOCKED'))
      const size = Math.min(100, Math.max(1, Number(params.size) || 12)), pages = Math.ceil(rows.length / size)
      const page = Math.min(Math.max(1, Number(params.page) || 1), Math.max(1, pages))
      return { result: structuredClone(rows.slice((page - 1) * size, page * size)), meta: { page, pageSize: size, pages, total: rows.length }, localCrud: true }
    },
  }
}
