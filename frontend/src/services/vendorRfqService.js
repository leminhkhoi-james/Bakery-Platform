import { unifiedEnabled, recordSource, localBakeryFor } from './unifiedDataService.js'
import { ApiError } from './apiClient.js'
import { rfqService } from './rfqService.js'
import { vendorManagementService } from './vendorManagementService.js'
import { loadDashboardAccess } from './vendorDashboardService.js'
import { requestMatchesBakery } from './vendorRfqModels.js'
import { isDemoId } from '../mockData/seed.js'

export async function loadVendorRfqAccess({ bakeryId, userId, includeOnboarding = false }, options) {
  await loadDashboardAccess({ bakeryId, userId }, options)
  return loadVendorRfqProfile(bakeryId, options, includeOnboarding)
}

async function loadVendorRfqProfile(bakeryId, options, includeOnboarding = false) {
  const bakery = await vendorManagementService.getManagedProfile(bakeryId, includeOnboarding, { ...options, allowMockFallback: false })
  if (bakery?.id?.toLowerCase() !== bakeryId.toLowerCase()) throw new ApiError('Chưa xác minh được cửa hàng.', 502)
  if (bakery.status && bakery.status !== 'ACTIVE') throw new ApiError('Cửa hàng chưa hoạt động.', 404)
  if (!bakery.operations) bakery.operations = { serviceAreas: [], addresses: [], businessHours: [] }
  if (!Array.isArray(bakery.operations.serviceAreas)) bakery.operations.serviceAreas = []
  return bakery
}

export async function loadVendorRequests({ bakery, page = 1, size = 12, ...filters }, options = {}) {
  if (!Array.isArray(bakery.operations?.serviceAreas)) bakery = await loadVendorRfqProfile(bakery.id, options)
  // API available scope is the union of the actor's shops. Filter that authorized
  // result against the chosen shop BEFORE pagination; never filter only one page.
  const result = [], seen = new Set()
  let next = 1, pages = 1
  do {
    options.signal?.throwIfAborted()
    const data = await rfqService.getRfqs({ ...filters, scope: 'available', page: next, size: 100 }, { ...options, allowMockFallback: Boolean(isDemoId(bakery.id)) })
    if (data.meta.page !== next) throw new ApiError('Trang yêu cầu trả về không khớp.', 502)
    pages = data.meta.pages
    for (const row of data.result) {
      if (seen.has(row.id)) throw new ApiError('Danh sách yêu cầu bị lặp trang.', 502)
      seen.add(row.id)
      if (unifiedEnabled()) {
        const scopeBakery = recordSource(row) === 'local' ? localBakeryFor(bakery.id) : bakery
        if (scopeBakery && requestMatchesBakery(row, scopeBakery)) result.push(row)
      } else if (isDemoId(row.id) === isDemoId(bakery.id) && requestMatchesBakery(row, bakery)) result.push(row)
    }
    next++
  } while (next <= pages)
  return { result: result.slice((page - 1) * size, page * size), meta: { page, pageSize: size, total: result.length, pages: Math.ceil(result.length / size) } }
}

export async function loadVendorOffers({ bakeryId, ...filters }, options) {
  const data = await rfqService.getOffers({ ...filters, scope: 'sent', bakeryId }, options)
  if (data.result.some((offer) => offer.bakeryId.toLowerCase() !== bakeryId.toLowerCase())) throw new ApiError('Danh sách báo giá trả sai cửa hàng.', 502)
  const requests = new Map()
  for (const offer of data.result) {
    if (requests.has(offer.cakeRequestId)) continue
    try { requests.set(offer.cakeRequestId, await rfqService.getRfqById(offer.cakeRequestId, options)) }
    catch (error) { if (error.status !== 404) throw error; requests.set(offer.cakeRequestId, null) }
  }
  return { ...data, result: data.result.map(offer => {
    const request = requests.get(offer.cakeRequestId)
    return { ...offer, requestTitle: request?.title ?? null, customerName: request?.customerName }
  }) }
}

export async function loadExistingVendorOffer({ bakeryId, cakeRequestId }, options) {
  const data = await rfqService.getOffers({ scope: 'sent', bakeryId, cakeRequestId, page: 1, size: 1 }, options)
  if (data.result.some((offer) => offer.bakeryId.toLowerCase() !== bakeryId.toLowerCase() || offer.cakeRequestId.toLowerCase() !== cakeRequestId.toLowerCase())) throw new ApiError('Báo giá trả về không khớp yêu cầu.', 502)
  return data.result[0] || null
}
