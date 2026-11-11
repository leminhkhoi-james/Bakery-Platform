import { ownerDraftReceipts, rememberOwnerDraft } from './ownerDraftReceipts.js'
import { authService } from './authService.js'
import { api as sharedApi, ApiError } from './apiClient.js'
import { catalogQuery } from './catalogModels.js'
import { bakeryPayload, productPayload, requireId, requireText, mapPage, mapManagedProduct, validateImage, productActions, operationsPayload } from './managementModels.js'
import { onboardingService } from './onboardingService.js'

// These management calls must never resolve through the display transport.
const api = Object.fromEntries(['get', 'post', 'put', 'patch', 'delete'].map(method => [method, (...args) => {
  const optionIndex = ['get', 'delete'].includes(method) ? 1 : 2
  args[optionIndex] = { ...args[optionIndex], allowMockFallback: false }
  return sharedApi[method](...args)
}]))

const bakeryPath = (id) => '/bakeries/' + requireId(id, 'Cửa hàng')
const productPath = (bakeryId, id) => bakeryPath(bakeryId) + '/products/' + requireId(id, 'Sản phẩm')
const list = (data) => { if (!Array.isArray(data)) throw new ApiError('Response phải là danh sách.', 502); return data }
const bakeryDto = (data) => { if (!data?.id) throw new ApiError('Thiếu BakeryDto.', 502); requireId(data.id); return data }

export const vendorManagementService = {
  async getProducts(bakeryId, params = {}, options = {}) {
    return mapPage(await api.get(bakeryPath(bakeryId) + '/products' + catalogQuery(params, ['query', 'categoryId', 'status', 'page', 'size', 'sort']), options), mapManagedProduct)
  },
  async getMembership(bakeryId, userId, options = {}) {
    const members = list(await api.get(bakeryPath(bakeryId) + '/members', options))
    return members.find((member) => member.userId === userId && member.status === 'ACTIVE') || null
  },
  async getCategories(bakeryId, options = {}) { return list(await api.get(bakeryPath(bakeryId) + '/categories', options)) },
  async createCategory(bakeryId, input) {
    const body = { name: requireText(input.name, 'Tên danh mục', 120), slug: requireText(input.slug, 'Slug danh mục', 140), displayOrder: Number(input.displayOrder), active: input.active }
    if (input.displayOrder === '' || !Number.isInteger(body.displayOrder) || body.displayOrder < 0 || typeof body.active !== 'boolean') throw new ApiError('Thứ tự và trạng thái danh mục không hợp lệ.', 400)
    const data = await api.post(bakeryPath(bakeryId) + '/categories', body)
    if (!data?.id || typeof data.name !== 'string') throw new ApiError('Thiếu ProductCategoryDto.', 502)
    requireId(data.id)
    return data
  },
  async getPublicProfile(bakeryId, options = {}) { return api.get(bakeryPath(bakeryId), { ...options, auth: false, retryAuth: false }) },
  async getManagedProfile(bakeryId, includeOnboarding, options = {}) {
    // The applicant endpoint returns the owner's full profile even when public
    // detail is unavailable (for example, an approved shop without entitlement).
    // Read it first instead of deliberately issuing a public request that 404s.
    if (includeOnboarding) {
      const profile = await onboardingService.get(null, { ...options, allowMockFallback: false })
      if (profile?.id?.toLowerCase() === bakeryId.toLowerCase()) return profile
    }
    const actor = authService.getSnapshot().user
    const receipt = ownerDraftReceipts(actor?.id).find(row => row.id === bakeryId)
    if (receipt) {
      const member = await vendorManagementService.getMembership(bakeryId, actor.id, options)
      if (member?.memberRole !== 'OWNER') throw new ApiError('Bạn không có quyền quản lý tiệm này.', 403)
      return receipt
    }
    return vendorManagementService.getPublicProfile(bakeryId, options)
  },
  async createBakery(input) { const saved = bakeryDto(await api.post('/bakeries', bakeryPayload(input, true))); rememberOwnerDraft(authService.getSnapshot().user?.id, saved); return saved },
  async updateBakery(bakeryId, input) {
    const bakery = bakeryDto(await api.patch(bakeryPath(bakeryId), bakeryPayload(input)))
    if (bakery.id.toLowerCase() !== bakeryId.toLowerCase()) throw new ApiError('Response cập nhật sai tiệm.', 502)
    rememberOwnerDraft(authService.getSnapshot().user?.id, bakery)
    return bakery
  },
  async submitBakery(bakeryId) {
    const bakery = bakeryDto(await api.post(bakeryPath(bakeryId) + '/submit-for-approval'))
    if (bakery.id.toLowerCase() !== bakeryId.toLowerCase() || bakery.status !== 'PENDING_APPROVAL') throw new ApiError('Backend chưa xác nhận hồ sơ đã gửi duyệt.', 502)
    rememberOwnerDraft(authService.getSnapshot().user?.id, bakery)
    return bakery
  },
  async saveOperations(bakeryId, operations) {
    const data = await api.put(bakeryPath(bakeryId) + '/operations', operationsPayload(operations))
    if (!['addresses', 'serviceAreas', 'businessHours'].every((key) => Array.isArray(data?.[key]))) throw new ApiError('Snapshot vận hành trả về không hợp lệ.', 502)
    const actorId = authService.getSnapshot().user?.id
    const receipt = ownerDraftReceipts(actorId).find(row => row.id === bakeryId)
    if (receipt) rememberOwnerDraft(actorId, { ...receipt, operations: data })
    return data
  },
  async uploadBakeryImage(bakeryId, kind, file) {
    if (!['logo', 'cover'].includes(kind)) throw new ApiError('Loại ảnh không hợp lệ.', 400)
    const body = new FormData(); body.append('file', validateImage(file))
    const result = await api.post(bakeryPath(bakeryId) + '/' + kind, body)
    if (typeof result?.url !== 'string' || !/^https?:\/\//.test(result.url)) throw new ApiError('Máy chủ chưa trả về đường dẫn ảnh hợp lệ.', 502)
    return result
  },
  async saveProduct(bakeryId, productId, input) {
    const body = productPayload(input, !productId)
    const product = mapManagedProduct(productId ? await api.patch(productPath(bakeryId, productId), body) : await api.post(bakeryPath(bakeryId) + '/products', body))
    if (!productId && product.status !== 'DRAFT') throw new ApiError('Backend chưa xác nhận tạo sản phẩm DRAFT mới.', 502)
    if (productId && product.id.toLowerCase() !== productId.toLowerCase()) throw new ApiError('Response cập nhật sai sản phẩm.', 502)
    return product
  },
  async changeProduct(bakeryId, product, action) {
    if (!productActions(product.status).includes(action)) throw new ApiError('Trạng thái sản phẩm không cho phép thao tác này.', 409)
    const result = mapManagedProduct(await api.post(productPath(bakeryId, product.id) + '/' + action))
    if (result.id !== product.id || result.status !== { publish: 'PUBLISHED', hide: 'HIDDEN', archive: 'ARCHIVED' }[action]) throw new ApiError('Backend chưa xác nhận đúng sản phẩm/trạng thái.', 502)
    return result
  },
  async uploadProductImages(bakeryId, productId, files, settings = {}) {
    if (!files?.length || files.length > 10) throw new ApiError('Chọn từ 1 đến 10 ảnh.', 400)
    const body = new FormData()
    for (const file of files) body.append('files', validateImage(file))
    if (settings.displayOrder !== undefined) {
      if (!Array.isArray(settings.displayOrder) || settings.displayOrder.length !== files.length || settings.displayOrder.some((value) => !Number.isInteger(value) || value < 0)) throw new ApiError('Thứ tự phải khớp từng ảnh và không âm.', 400)
      body.append('displayOrder', new Blob([JSON.stringify(settings.displayOrder)], { type: 'application/json' }))
    }
    const primary = settings.primaryIndex
    if (primary !== undefined && (!Number.isInteger(primary) || primary < 0 || primary >= files.length)) throw new ApiError('Ảnh chính phải thuộc các tệp upload.', 400)
    return list(await api.post(productPath(bakeryId, productId) + '/images' + (primary !== undefined ? '?primaryIndex=' + primary : ''), body))
  },
}
export const loadManagedProducts = ({ bakeryId, ...params }, options) => vendorManagementService.getProducts(bakeryId, params, options)
export const loadVendorMembership = ({ bakeryId, userId }, options) => vendorManagementService.getMembership(bakeryId, userId, { ...options, allowMockFallback: false })
export const loadManagedCategories = ({ bakeryId }, options) => vendorManagementService.getCategories(bakeryId, options)
export const loadVendorProfile = ({ bakeryId, includeOnboarding = false }, options) => vendorManagementService.getManagedProfile(bakeryId, includeOnboarding, options)
