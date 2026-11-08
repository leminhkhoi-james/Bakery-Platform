import { ApiError } from './apiClient.js'
import { loadBakeries } from './vendorService.js'
import { vendorManagementService } from './vendorManagementService.js'
import { onboardingService } from './onboardingService.js'
import { authService } from './authService.js'

// Public catalog entries are candidates, never evidence of management rights.
// There is currently no public "my bakeries" endpoint (ADR-004).
export async function loadManagedBakeries({ userId, includeOnboarding = false }, options = {}) {
  const catalog = { result: [] }
  const seen = new Set()
  // This authenticated endpoint also returns the applicant's unpublished shop.
  // It is available to CUSTOMER accounts, including customers granted OWNER.
  const applicantBakery = includeOnboarding ? await onboardingService.get(null, options) : null
  for (let page = 1; ; page++) {
    options.signal?.throwIfAborted()
    const data = await loadBakeries({ page, size: 100 }, options)
    if (data.meta.page !== page || data.meta.pages > 200) throw new ApiError('Danh sách tiệm trả về không hợp lệ.', 502)
    for (const row of data.result) {
      if (seen.has(row.id)) throw new ApiError('Danh sách tiệm bị lặp trang. Vui lòng tải lại.', 409)
      seen.add(row.id); catalog.result.push(row)
    }
    if (page >= data.meta.pages) break
    if (!data.result.length) throw new ApiError('Chưa tải đủ danh sách tiệm.', 502)
  }
  const verified = []
  if (applicantBakery) {
    const member = await vendorManagementService.getMembership(applicantBakery.id, userId, options)
    if (member?.memberRole === 'OWNER') verified.push(applicantBakery)
  }
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(4, catalog.result.length) }, async () => {
    while (cursor < catalog.result.length) {
      const bakery = catalog.result[cursor++]
      if (bakery.id === applicantBakery?.id) continue
      try {
        const member = await vendorManagementService.getMembership(bakery.id, userId, options)
        // The public collection contains only active, entitled shops. Preserve
        // this provenance: its DTO intentionally omits the status field.
        if (member?.memberRole === 'OWNER') verified.push({ ...bakery, status: 'ACTIVE' })
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

export async function loadOwnerBakery({ bakeryId, userId, includeOnboarding }, options = {}) {
  if (!bakeryId) return null
  options = { ...options, allowMockFallback: false }
  const member = await loadDashboardAccess({ bakeryId, userId }, options)
  const profile = await vendorManagementService.getManagedProfile(bakeryId, includeOnboarding, options)
  if (profile?.id?.toLowerCase() !== bakeryId.toLowerCase()) throw new ApiError('Hồ sơ trả về sai cửa hàng.', 502)
  // A successful public detail is an active shop; unpublished applicant DTOs
  // have an explicit status. Neither URL nor platform role proves ownership.
  return { ...profile, status: profile.status || 'ACTIVE', member }
}

export async function loadDashboardAccess({ bakeryId, userId }, options) {
  const member = await vendorManagementService.getMembership(bakeryId, userId, { ...options, allowMockFallback: false })
  if (member?.memberRole !== 'OWNER') throw new ApiError('Bạn chưa có quyền quản lý cửa hàng này.', 403)
  return member
}

export function dashboardErrorMessage(error) {
  if (error?.status === 400) return 'Mã cửa hàng không hợp lệ. Vui lòng chọn lại cửa hàng.'
  if (error?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (error?.status === 403) return 'Bạn chưa có quyền quản lý cửa hàng này. Vui lòng chọn lại cửa hàng.'
  if (error?.status === 404) return 'Không tìm thấy cửa hàng hoặc dữ liệu cần xem.'
  if (error?.status === 0) return 'Kết nối đang gián đoạn. Vui lòng thử lại.'
  return 'Chưa thể tải dữ liệu cửa hàng. Vui lòng thử lại.'
}
