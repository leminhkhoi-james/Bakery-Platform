import { api, ApiError } from './apiClient.js'
import { requireId, requireText } from './managementModels.js'
import { isDemoId } from '../mockData/seed.js'
import { localUserDirectory, localUserRestriction } from '../mockData/admin/userManagement.js'

export function userRestriction(person, actor, action = 'delete') {
  if (person?.id === actor?.id) return 'Không thể thay đổi hoặc xóa tài khoản đang đăng nhập.'
  if (person?.roles?.includes('ADMIN') || person?.protected === true) return 'Tài khoản quản trị hoặc tài khoản được bảo vệ không thể xử lý tại đây.'
  const local = localUserRestriction(person)
  return action === 'delete' ? local : local?.includes('đăng nhập') ? local : null
}
export const userName = (person) => person?.displayName || person?.fullName || person?.name || ''
export const userStatus = (status) => ({ ACTIVE: 'Đang hoạt động', SUSPENDED: 'Tạm ngưng', BLOCKED: 'Tạm ngưng', DELETED: 'Đã xóa' }[status] || 'Chưa rõ trạng thái')
export async function loadUsers(params, options) {
  const data = await api.get('/admin/users?' + new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null)), options)
  if (!Array.isArray(data?.result) || data.result.some((row) => !row?.id || !Array.isArray(row.roles)) || !data.meta) throw new ApiError('Chưa tải được danh sách người dùng.', 502)
  return data
}
export function userFieldErrors(input) {
  const errors = {}
  if (!input.name?.trim()) errors.name = 'Vui lòng nhập họ tên.'
  else if (input.name.trim().length > 100) errors.name = 'Họ tên không quá 100 ký tự.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email?.trim() || '')) errors.email = 'Vui lòng nhập email hợp lệ.'
  else if (input.email.trim().length > 254) errors.email = 'Email không quá 254 ký tự.'
  return errors
}
function localOnly(person) {
  if (!localUserDirectory() || person && !isDemoId(person.id)) throw new ApiError('Chức năng chỉnh sửa hồ sơ hiện chưa khả dụng cho tài khoản này.', 403)
}
export async function saveUser(person, input, actor) {
  localOnly(person)
  if (person && userRestriction(person, actor, 'edit')) throw new ApiError(userRestriction(person, actor, 'edit'), 403)
  if (Object.keys(userFieldErrors(input)).length) throw new ApiError('Vui lòng kiểm tra họ tên và email.', 422)
  const body = { name: requireText(input.name, 'Họ tên', 100), email: requireText(input.email, 'Email', 254) }
  const result = person ? await api.patch('/admin/users/' + requireId(person.id), body) : await api.post('/admin/users', body)
  if (!result?.id || person && result.id !== person.id || !Array.isArray(result.roles)) throw new ApiError('Chưa thể xác nhận hồ sơ đã lưu.', 502)
  return result
}
export async function deleteUser(person, actor) {
  localOnly(person)
  const reason = userRestriction(person, actor)
  if (reason) throw new ApiError(reason, 403)
  await api.delete('/admin/users/' + requireId(person.id))
}
export async function changeUserStatus(person, actor) {
  localOnly(person)
  const reason = userRestriction(person, actor, 'status')
  if (reason) throw new ApiError(reason, 403)
  if (!['ACTIVE', 'BLOCKED', 'SUSPENDED'].includes(person.status)) throw new ApiError('Trạng thái hiện tại không hỗ trợ thao tác này.', 409)
  const status = person.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  const result = await api.patch('/admin/users/' + requireId(person.id), { status })
  if (result?.id !== person.id || result.status !== status) throw new ApiError('Chưa thể xác nhận trạng thái người dùng.', 502)
  return result
}
