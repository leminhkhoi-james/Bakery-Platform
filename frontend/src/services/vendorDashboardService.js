import { ApiError } from './apiClient.js'
import { loadBakeries } from './vendorService.js'
import { vendorManagementService } from './vendorManagementService.js'

// Public catalog entries are candidates, never evidence of management rights.
// There is currently no public "my bakeries" endpoint (ADR-004).
export async function loadManagedBakeries({ userId }, options = {}) {
  const catalog = await loadBakeries({ page: 1, size: 100 }, options)
  const verified = []
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(4, catalog.result.length) }, async () => {
    while (cursor < catalog.result.length) {
      const bakery = catalog.result[cursor++]
      try {
        const member = await vendorManagementService.getMembership(bakery.id, userId, options)
        if (member?.memberRole === 'OWNER') verified.push(bakery)
      } catch (error) {
        // A different owner's public shop is not an available management choice.
        // Session, connection and server failures must still reach the UI.
        if (error.status !== 403) throw error
      }
    }
  }))
  options.signal?.throwIfAborted()
  return verified.toSorted((a, b) => a.name.localeCompare(b.name, 'vi'))
}

export async function loadDashboardAccess({ bakeryId, userId }, options) {
  const member = await vendorManagementService.getMembership(bakeryId, userId, options)
  if (member?.memberRole !== 'OWNER') throw new ApiError('Bạn chưa có quyền quản lý cửa hàng này.', 403)
  return member
}

export function dashboardErrorMessage(error) {
  if (error?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (error?.status === 403) return 'Bạn chưa có quyền quản lý cửa hàng này. Vui lòng chọn lại cửa hàng.'
  if (error?.status === 404) return 'Không tìm thấy cửa hàng hoặc dữ liệu cần xem.'
  if (error?.status === 0) return 'Kết nối đang gián đoạn. Vui lòng thử lại.'
  return 'Chưa thể tải dữ liệu cửa hàng. Vui lòng thử lại.'
}
