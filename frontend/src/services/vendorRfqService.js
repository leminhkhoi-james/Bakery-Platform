import { ApiError } from './apiClient.js'
import { rfqService } from './rfqService.js'
import { vendorManagementService } from './vendorManagementService.js'
import { loadDashboardAccess } from './vendorDashboardService.js'
import { requestMatchesBakery } from './vendorRfqModels.js'
import { isDemoId } from '../mockData/seed.js'

export async function loadVendorRfqAccess({ bakeryId, userId }, options) {
  await loadDashboardAccess({ bakeryId, userId }, options)
  return loadVendorRfqProfile(bakeryId, options)
}

async function loadVendorRfqProfile(bakeryId, options) {
  const bakery = await vendorManagementService.getPublicProfile(bakeryId, options)
  if (bakery?.id !== bakeryId || !Array.isArray(bakery.operations?.serviceAreas)) throw new ApiError('Chưa xác minh được khu vực phục vụ.', 502)
  if (bakery.status && bakery.status !== 'ACTIVE') throw new ApiError('Cửa hàng chưa hoạt động.', 404)
  return bakery
}

export async function loadVendorRequests({ bakery, page = 1, size = 12, ...filters }, options = {}) {
  if (!bakery.operations) bakery = await loadVendorRfqProfile(bakery.id, options)
  // API available scope is the union of the actor's shops. Filter that authorized
  // result against the chosen shop BEFORE pagination; never filter only one page.
  const result = [], seen = new Set()
  let next = 1, pages = 1
  do {
    options.signal?.throwIfAborted()
    const data = await rfqService.getRfqs({ ...filters, scope: 'available', page: next, size: 100 }, { ...options, allowMockFallback: isDemoId(bakery.id) })
    if (data.meta.page !== next) throw new ApiError('Trang yêu cầu trả về không khớp.', 502)
    pages = data.meta.pages
    for (const row of data.result) {
      if (seen.has(row.id)) throw new ApiError('Danh sách yêu cầu bị lặp trang.', 502)
      seen.add(row.id)
      if (isDemoId(row.id) === isDemoId(bakery.id) && requestMatchesBakery(row, bakery)) result.push(row)
    }
    next++
  } while (next <= pages)
  return { result: result.slice((page - 1) * size, page * size), meta: { page, pageSize: size, total: result.length, pages: Math.ceil(result.length / size) } }
}

export async function loadVendorOffers({ bakeryId, ...filters }, options) {
  const data = await rfqService.getOffers({ ...filters, scope: 'sent', bakeryId }, options)
  if (data.result.some((offer) => offer.bakeryId !== bakeryId)) throw new ApiError('Danh sách báo giá trả sai cửa hàng.', 502)
  const titles = new Map()
  for (const offer of data.result) {
    if (titles.has(offer.cakeRequestId)) continue
    try { titles.set(offer.cakeRequestId, (await rfqService.getRfqById(offer.cakeRequestId, options)).title) }
    catch (error) { if (error.status !== 404) throw error; titles.set(offer.cakeRequestId, null) }
  }
  return { ...data, result: data.result.map((offer) => ({ ...offer, requestTitle: titles.get(offer.cakeRequestId) })) }
}

export async function loadExistingVendorOffer({ bakeryId, cakeRequestId }, options) {
  const data = await rfqService.getOffers({ scope: 'sent', bakeryId, cakeRequestId, page: 1, size: 1 }, options)
  if (data.result.some((offer) => offer.bakeryId !== bakeryId || offer.cakeRequestId !== cakeRequestId)) throw new ApiError('Báo giá trả về không khớp yêu cầu.', 502)
  return data.result[0] || null
}
