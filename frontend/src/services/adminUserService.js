import { USER_STATUSES, USER_STATUS_LABELS } from './statusCatalog.js'
import { unifiedEnabled, recordSource } from './unifiedDataService.js'
import { api, ApiError } from './apiClient.js'
import { localUserDirectory } from '../mockData/admin/userManagement.js'
import { requireId } from './managementModels.js'

// Contract: docs/API_SPEC.md §2 User Administration (Identity Service, ADMIN only).
export { USER_STATUSES } from './statusCatalog.js'
export const PLATFORM_ROLES = ['CUSTOMER', 'BAKERY_OWNER', 'ADMIN']
const LIST_PARAMS = ['page', 'size', 'sort', 'email', 'status', 'role']
export const isLocalUser = person => Boolean(localUserDirectory() && (!unifiedEnabled() || recordSource(person) === 'local'))

export function userRestriction(person, actor, action = 'delete') {
  // The API rejects self block/delete with 409; explain it before sending a request.
  if (person?.id && person.id === actor?.id) return 'Không thể thay đổi tài khoản đang đăng nhập.'
  const local = localUserDirectory()
  if (local && (!unifiedEnabled() || recordSource(person) === 'local')) return local.restriction(person, actor, action)
  if (person?.status === 'DELETED') return 'Tài khoản đã bị xóa, không thể thao tác thêm.'
  return null
}
// `name` only exists on local demo records; the API contract uses `displayName`.
export const userName = (person) => person?.displayName || person?.name || ''
export const userStatus = (status) => (USER_STATUS_LABELS[status === 'SUSPENDED' ? 'BLOCKED' : status] || 'Chưa rõ trạng thái')

function userPath(id) { return '/admin/users/' + requireId(id) }
function assertUser(result, expectedId) {
  if (!result?.id || result.id !== expectedId || !Array.isArray(result.roles)) throw new ApiError('Chưa thể xác nhận dữ liệu người dùng.', 502)
  return result
}

export async function loadUsers(params = {}, options) {
  if (params.status === 'BLOCKED' && localUserDirectory() && !unifiedEnabled()) params = { ...params, status: 'SUSPENDED' }
  const query = new URLSearchParams(LIST_PARAMS.filter((key) => params[key] !== '' && params[key] != null).map((key) => [key, params[key]]))
  const data = await api.get('/admin/users?' + query, options)
  if (!Array.isArray(data?.result) || data.result.some((row) => !row?.id || !Array.isArray(row.roles)) || !data.meta) throw new ApiError('Chưa tải được danh sách người dùng.', 502)
  return data
}

export async function getUser(id, options) {
  return assertUser(await api.get(userPath(id), options), String(id).toLowerCase())
}

export async function updateUserProfile(person, changes, actor) {
  const reason = userRestriction(person, actor, 'edit')
  if (reason) throw new ApiError(reason, 403)
  return assertUser(await api.patch(userPath(person.id), changes, { allowMockFallback: false }), person.id)
}

export async function changeUserStatus(person, actor, status) {
  const reason = userRestriction(person, actor, 'status')
  if (reason) throw new ApiError(reason, 403)
  if (status == null && localUserDirectory() && (!unifiedEnabled() || recordSource(person) === 'local')) return localUserDirectory().change(actor, 'status', person.id, { expectedStatus: person.status })
  if (status == null && unifiedEnabled()) status = person.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
  if (status === 'PENDING') throw new ApiError('Không thể chuyển tài khoản về trạng thái chờ kích hoạt.', 422)
  if (!USER_STATUSES.includes(status)) throw new ApiError('Trạng thái người dùng không hợp lệ.', 400)
  if (status === person.status) throw new ApiError('Người dùng đã ở trạng thái này.', 409)
  const result = assertUser(await api.patch(userPath(person.id) + '/status', { status }), person.id)
  if (result.status !== status) throw new ApiError('Chưa thể xác nhận trạng thái người dùng.', 502)
  return result
}

// The contract has no hard delete: deleting means status DELETED and revokes refresh tokens.
export const deleteUser = (person, actor) => localUserDirectory() && (!unifiedEnabled() || recordSource(person) === 'local') ? localUserDirectory().change(actor, 'delete', person.id) : changeUserStatus(person, actor, 'DELETED')

export function roleErrors(roles) {
  if (!Array.isArray(roles) || !roles.length) return 'Người dùng phải có ít nhất một vai trò.'
  if (roles.some((role) => !PLATFORM_ROLES.includes(role))) return 'Vai trò không hợp lệ.'
  return null
}

export async function updateUserRoles(person, roles, actor) {
  const reason = userRestriction(person, actor, 'roles')
  if (reason) throw new ApiError(reason, 403)
  const unique = [...new Set(roles)]
  const invalid = roleErrors(unique)
  if (invalid) throw new ApiError(invalid, 422)
  if (localUserDirectory() && (!unifiedEnabled() || recordSource(person) === 'local')) return localUserDirectory().change(actor, 'roles', person.id, { roles: unique })
  const result = assertUser(await api.put(userPath(person.id) + '/roles', { roles: unique }), person.id)
  if (result.roles.length !== unique.length || unique.some((role) => !result.roles.includes(role))) throw new ApiError('Chưa thể xác nhận vai trò đã lưu.', 502)
  return result
}

export function userFieldErrors(input) {
  const errors = {}
  if (!input.name?.trim()) errors.name = 'Vui lòng nhập họ tên.'
  else if (input.name.trim().length > 100) errors.name = 'Họ tên không quá 100 ký tự.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email?.trim() || '')) errors.email = 'Vui lòng nhập email hợp lệ.'
  else if (input.email.trim().length > 254) errors.email = 'Email không quá 254 ký tự.'
  return errors
}
export async function saveUser(person, input, actor) {
  const errors = userFieldErrors(input)
  if (Object.keys(errors).length) {
    throw new ApiError('Vui lòng kiểm tra họ tên và email.', 422)
  }
  const directory = localUserDirectory()
  if (person && unifiedEnabled() && recordSource(person) === 'api') throw new ApiError('Backend chưa cung cấp API sửa tên/email. Dữ liệu thật không bị thay đổi.', 501)
  if (!directory) throw new ApiError('Identity chưa triển khai API quản lý người dùng. Không có thay đổi nào được lưu.', 501)
  return directory.change(actor, 'save', person?.id, input)
}
