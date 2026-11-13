import { api, ApiError, refreshAccessToken } from './apiClient.js'
import { authService } from './authService.js'
import { bakeryPayload, operationsPayload, requireId } from './managementModels.js'

function bakery(dto) {
  if (dto === null) return null
  if (!dto?.id || !dto.status) throw new ApiError('Hồ sơ đăng ký tiệm không hợp lệ.', 502)
  requireId(dto.id)
  return dto
}

export const onboardingService = {
  async get(_params, options = {}) { return bakery(await api.get('/bakeries/onboarding', { ...options, allowMockFallback: false })) },
  async submit(input) {
    return bakery(await api.post('/bakeries/onboarding', {
      ...bakeryPayload(input, true), operations: operationsPayload(input.operations),
    }, { allowMockFallback: false }))
  },
  async syncOwner(userId, options = {}) {
    const user = await authService.getCurrentUser({ ...options, allowMockFallback: false })
    if (user?.id !== userId) throw new ApiError('Phiên đăng nhập đã thay đổi.', 401)
    if (!user.roles?.includes('BAKERY_OWNER')) return null
    return authService.refreshSession()
  },
  async complete(bakeryId) {
    await api.post('/bakeries/' + requireId(bakeryId) + '/onboarding/complete', {}, { allowMockFallback: false })
    await refreshAccessToken()
    const user = await authService.reloadProfile()
    if (!user.roles?.includes('BAKERY_OWNER')) throw new ApiError('Quyền chủ tiệm chưa được cập nhật. Vui lòng đăng nhập lại.', 409)
    return user
  },
}
