import { ApiError } from './apiClient.js'
import { requireId, requireText, memberCanEdit } from './managementModels.js'
import { isCatalogId } from './catalogModels.js'
export function mapManagedList(data, kind) {
  if (!Array.isArray(data) || data.some((row) => !isCatalogId(row?.id))) throw new ApiError('Danh sách quản lý không hợp lệ.', 502)
  return data.map((row) => {
    if (kind === 'members' && (!isCatalogId(row.userId) || !['OWNER'].includes(row.memberRole) || !['INVITED', 'ACTIVE', 'INACTIVE'].includes(row.status))) throw new ApiError('Membership DTO không hợp lệ.', 502)
    if (kind && kind !== 'members' && (typeof row.name !== 'string' || typeof row.active !== 'boolean')) throw new ApiError('Catalog DTO thiếu tên/trạng thái.', 502)
    if (kind === 'categories' && (typeof row.slug !== 'string' || !Number.isInteger(row.displayOrder) || row.displayOrder < 0)) throw new ApiError('Category DTO không hợp lệ.', 502)
    if (kind === 'add-ons' && (typeof row.category !== 'string' || row.price === null || !Number.isFinite(Number(row.price)) || Number(row.price) < 0)) throw new ApiError('Add-on DTO không hợp lệ.', 502)
    return { ...row }
  })
}
export function catalogEntityPayload(kind, input) {
  if (kind === 'members') throw new ApiError('Chủ tiệm được tạo cùng tiệm; không có thao tác sửa thành viên.', 403)
  const body = { name: requireText(input.name, 'Tên', kind === 'categories' ? 120 : 160), active: input.active }
  if (typeof body.active !== 'boolean') throw new ApiError('active phải là boolean.', 400)
  if (kind === 'categories') {
    body.slug = requireText(input.slug, 'Slug', 140); body.displayOrder = Number(input.displayOrder)
    if (input.displayOrder === '' || !Number.isInteger(body.displayOrder) || body.displayOrder < 0) throw new ApiError('Thứ tự phải là số nguyên không âm.', 400)
  } else if (kind === 'add-ons') {
    body.category = requireText(input.category, 'Nhóm phụ kiện', 80); body.description = input.description ?? ''; body.price = Number(input.price)
    if (input.price === '' || !Number.isFinite(body.price) || body.price < 0 || typeof body.description !== 'string') throw new ApiError('Giá/mô tả phụ kiện không hợp lệ.', 400)
  } else throw new ApiError('Loại quản lý không hợp lệ.', 400)
  return body
}
export function canManageEntity(actor, roles, kind) {
  return kind !== 'members' && memberCanEdit(actor, roles)
}
const integer = (value, label) => { if (value === '' || !Number.isInteger(Number(value)) || Number(value) < 0) throw new ApiError(label + ' phải là số nguyên không âm.', 400); return Number(value) }
export function optionsPayload(input) {
  if (!Array.isArray(input?.groups)) throw new ApiError('Cần snapshot groups đầy đủ.', 400)
  return { groups: input.groups.map((group) => {
    const minimumSelections = integer(group.minimumSelections, 'Số chọn tối thiểu'), maximumSelections = integer(group.maximumSelections, 'Số chọn tối đa')
    if (!['SINGLE', 'MULTIPLE'].includes(group.selectionType) || typeof group.required !== 'boolean' || maximumSelections < minimumSelections || (group.required && minimumSelections < 1) || (group.selectionType === 'SINGLE' && maximumSelections > 1) || !Array.isArray(group.values)) throw new ApiError('Quy tắc chọn options không hợp lệ.', 422)
    const values = group.values.map((value) => {
      const priceAdjustment = Number(value.priceAdjustment)
      if (value.priceAdjustment === '' || !Number.isFinite(priceAdjustment) || typeof value.active !== 'boolean') throw new ApiError('Giá/trạng thái option không hợp lệ.', 400)
      return { ...(value.id ? { id: requireId(value.id) } : {}), name: requireText(value.name, 'Tên option', 120), description: value.description ?? '', priceAdjustment, active: value.active, displayOrder: integer(value.displayOrder ?? 0, 'Thứ tự') }
    })
    return { ...(group.id ? { id: requireId(group.id) } : {}), name: requireText(group.name, 'Tên nhóm', 120), selectionType: group.selectionType, required: group.required, minimumSelections, maximumSelections, displayOrder: integer(group.displayOrder ?? 0, 'Thứ tự nhóm'), values }
  }) }
}
export function mapOptions(dto) {
  try {
    const result = optionsPayload(dto)
    if (result.groups.some((group) => !isCatalogId(group.id) || group.values.some((value) => !isCatalogId(value.id)))) throw new Error('Missing persisted option IDs')
    return result
  } catch { throw new ApiError('Snapshot options từ backend không hợp lệ.', 502) }
}

