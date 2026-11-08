import { api, ApiError } from './apiClient.js'
import { requireId } from './managementModels.js'

// Contract: docs/API_SPEC.md §2 User Administration (Identity Service, ADMIN only).
export const USER_STATUSES = ['ACTIVE', 'BLOCKED', 'DELETED']
export const PLATFORM_ROLES = ['CUSTOMER', 'BAKERY_OWNER', 'ADMIN']
const LIST_PARAMS = ['page', 'size', 'sort', 'email', 'status', 'role']

export function userRestriction(person, actor) {
  // The API rejects self block/delete with 409; explain it before sending a request.
  if (person?.id && person.id === actor?.id) return 'Không thể thay đổi tài khoản đang đăng nhập.'
  if (person?.status === 'DELETED') return 'Tài khoản đã bị xóa, không thể thao tác thêm.'
  return null
}
// `name` only exists on local demo records; the API contract uses `displayName`.
export const userName = (person) => person?.displayName || person?.name || ''
export const userStatus = (status) => ({ ACTIVE: 'Đang hoạt động', BLOCKED: 'Đã khóa', DELETED: 'Đã xóa' }[status] || 'Chưa rõ trạng thái')

function userPath(id) { return '/admin/users/' + requireId(id) }
function assertUser(result, expectedId) {
  if (!result?.id || result.id !== expectedId || !Array.isArray(result.roles)) throw new ApiError('Chưa thể xác nhận dữ liệu người dùng.', 502)
  return result
}

export async function loadUsers(params = {}, options) {
  const query = new URLSearchParams(LIST_PARAMS.filter((key) => params[key] !== '' && params[key] != null).map((key) => [key, params[key]]))
  const data = await api.get('/admin/users?' + query, options)
  if (!Array.isArray(data?.result) || data.result.some((row) => !row?.id || !Array.isArray(row.roles)) || !data.meta) throw new ApiError('Chưa tải được danh sách người dùng.', 502)
  return data
}

export async function getUser(id, options) {
  return assertUser(await api.get(userPath(id), options), String(id).toLowerCase())
}

export async function changeUserStatus(person, actor, status) {
  const reason = userRestriction(person, actor)
  if (reason) throw new ApiError(reason, 403)
  if (!USER_STATUSES.includes(status)) throw new ApiError('Trạng thái người dùng không hợp lệ.', 400)
  if (status === person.status) throw new ApiError('Người dùng đã ở trạng thái này.', 409)
  const result = assertUser(await api.patch(userPath(person.id) + '/status', { status }), person.id)
  if (result.status !== status) throw new ApiError('Chưa thể xác nhận trạng thái người dùng.', 502)
  return result
}

// The contract has no hard delete: deleting means status DELETED and revokes refresh tokens.
export const deleteUser = (person, actor) => changeUserStatus(person, actor, 'DELETED')

export function roleErrors(roles) {
  if (!Array.isArray(roles) || !roles.length) return 'Người dùng phải có ít nhất một vai trò.'
  if (roles.some((role) => !PLATFORM_ROLES.includes(role))) return 'Vai trò không hợp lệ.'
  return null
}

export async function updateUserRoles(person, roles, actor) {
  const reason = userRestriction(person, actor)
  if (reason) throw new ApiError(reason, 403)
  const unique = [...new Set(roles)]
  const invalid = roleErrors(unique)
  if (invalid) throw new ApiError(invalid, 422)
  const result = assertUser(await api.put(userPath(person.id) + '/roles', { roles: unique }), person.id)
  if (result.roles.length !== unique.length || unique.some((role) => !result.roles.includes(role))) throw new ApiError('Chưa thể xác nhận vai trò đã lưu.', 502)
  return result
}
