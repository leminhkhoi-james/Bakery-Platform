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

export async function loadVendorRequests({ bakery, page = 1, size = 12, all = false, excludeQuoted = false, ...filters }, options = {}) {
  if (!Array.isArray(bakery.operations?.serviceAreas)) bakery = await loadVendorRfqProfile(bakery.id, options)
  // API available scope is the union of the actor's shops. Filter that authorized
  // result against the chosen shop BEFORE pagination; never filter only one page.
  const result = [], seen = new Set()
  let next = 1, pages = 1
  do {
    options.signal?.throwIfAborted()
    const data = await rfqService.getRfqs({ ...filters, scope: 'available', page: next, size: 100 }, {
      ...options, allowMockFallback: options.allowMockFallback ?? (unifiedEnabled() || isDemoId(bakery.id)),
    })
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
  const quoted = excludeQuoted && result.length ? await quotedRequests(bakery.id, options) : null
  const rows = quoted ? result.filter(row => !quoted.has(row.id)) : result
  if (all) return { result: rows }
  const pagesCount = Math.ceil(rows.length / size)
  const currentPage = excludeQuoted ? Math.min(page, Math.max(1, pagesCount)) : page
  return { result: rows.slice((currentPage - 1) * size, currentPage * size), meta: { page: currentPage, pageSize: size, total: rows.length, pages: pagesCount } }
}

async function quotedRequests(bakeryId, options) {
  const requestIds = new Set(), seen = new Set()
  for (let page = 1, pages = 1; page <= pages; page++) {
    options.signal?.throwIfAborted()
    const data = await rfqService.getOffers({ scope: 'sent', bakeryId, page, size: 100 }, options)
    if (data.meta.page !== page || data.meta.pages > 500) throw new ApiError('Trang báo giá trả về không khớp.', 502)
    pages = data.meta.pages
    for (const offer of data.result) {
      if (seen.has(offer.id) || offer.bakeryId !== bakeryId) throw new ApiError('Danh sách báo giá trả về không hợp lệ.', 502)
      seen.add(offer.id)
      requestIds.add(offer.cakeRequestId)
    }
  }
  return requestIds
}

export async function loadVendorRfqLocations({ bakery }, options) {
  const data = await loadVendorRequests({ bakery, all: true }, options)
  const locations = [...data.result.map(row => ({ city: row.deliveryCity, district: row.deliveryDistrict })), ...(bakery.operations?.serviceAreas || [])]
  return locations.filter(row => row.city).map(row => ({ city: row.city, district: row.district || '' }))
}

export async function loadVendorOffers({ bakeryId, city = '', district = '', page = 1, size = 12, ...filters }, options) {
  const locationFilter = Boolean(city || district)
  const data = await rfqService.getOffers({ ...filters, scope: 'sent', bakeryId, page: locationFilter ? 1 : page, size: locationFilter ? 100 : size }, options)
  if (locationFilter) {
    for (let next = 2; next <= data.meta.pages; next++) {
      if (next > 500) throw new ApiError('Danh sách báo giá vượt giới hạn tải.', 502)
      const batch = await rfqService.getOffers({ ...filters, scope: 'sent', bakeryId, page: next, size: 100 }, options)
      if (batch.meta.page !== next) throw new ApiError('Trang báo giá trả về không khớp.', 502)
      data.result.push(...batch.result)
    }
    if (new Set(data.result.map(row => row.id)).size !== data.result.length) throw new ApiError('Danh sách báo giá bị lặp.', 502)
  }
  if (data.result.some((offer) => offer.bakeryId.toLowerCase() !== bakeryId.toLowerCase())) throw new ApiError('Danh sách báo giá trả sai cửa hàng.', 502)
  const requests = new Map()
  for (const offer of data.result) {
    if (requests.has(offer.cakeRequestId)) continue
    try { requests.set(offer.cakeRequestId, await rfqService.getRfqById(offer.cakeRequestId, options)) }
    catch (error) { if (error.status !== 404) throw error; requests.set(offer.cakeRequestId, null) }
  }
  const rows = data.result.map(offer => {
    const request = requests.get(offer.cakeRequestId)
    return { ...offer, requestTitle: request?.title ?? null, customerName: request?.customerName,
      description: request?.description, budgetMin: request?.budgetMin, budgetMax: request?.budgetMax, deliveryCity: request?.deliveryCity,
      deliveryDistrict: request?.deliveryDistrict, servingSize: request?.servingSize }
  })
  if (!locationFilter) return { ...data, result: rows }
  const matches = (value, selected) => !selected || String(value || '').trim().toLocaleLowerCase('vi') === selected.trim().toLocaleLowerCase('vi')
  const filtered = rows.filter(row => matches(row.deliveryCity, city) && matches(row.deliveryDistrict, district))
  const pages = Math.ceil(filtered.length / size), currentPage = Math.min(page, Math.max(1, pages))
  return { result: filtered.slice((currentPage - 1) * size, currentPage * size), meta: { page: currentPage, pageSize: size, pages, total: filtered.length } }
}

export async function loadExistingVendorOffer({ bakeryId, cakeRequestId }, options) {
  const data = await rfqService.getOffers({ scope: 'sent', bakeryId, cakeRequestId, page: 1, size: 1 }, options)
  if (data.result.some((offer) => offer.bakeryId.toLowerCase() !== bakeryId.toLowerCase() || offer.cakeRequestId.toLowerCase() !== cakeRequestId.toLowerCase())) throw new ApiError('Báo giá trả về không khớp yêu cầu.', 502)
  return data.result[0] || null
}
