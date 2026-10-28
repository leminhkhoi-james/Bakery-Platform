import { api, ApiError } from './apiClient.js'
import { publicationAdminService } from './publicationAdminService.js'
import { orderService } from './orderService.js'
import { demoRuntime } from '../mockData/runtime.js'
import { dashboardSupplement } from '../mockData/admin/dashboardSnapshot.js'
import { isDemoId } from '../mockData/seed.js'
import { requireId } from './managementModels.js'

// Read full collections before computing distributions; never extrapolate a first page.
export async function readDashboardPages(load, options = {}, getSource = () => 'real') {
  const records = new Map()
  let source, total, pages
  for (let page = 1; ; page++) {
    options.signal?.throwIfAborted()
    const data = await load({ page, size: 100, sort: 'createdAt,desc' }, options)
    const meta = data?.meta
    if (!Array.isArray(data?.result) || !meta || ![meta.total, meta.pages, meta.page].every(Number.isInteger) || meta.page !== page || meta.total < 0 || meta.pages < 0 || meta.pages > 200) throw new ApiError('Chưa thể tổng hợp dữ liệu. Vui lòng thử lại.', 502)
    const currentSource = getSource()
    if (page === 1) { source = currentSource; total = meta.total; pages = meta.pages }
    if (source !== currentSource || total !== meta.total || pages !== meta.pages) throw new ApiError('Dữ liệu vừa thay đổi. Vui lòng tải lại tổng quan.', 409)
    for (const row of data.result) {
      if (!row?.id || (source === 'real' && isDemoId(row.id))) throw new ApiError('Chưa thể tổng hợp dữ liệu.', 502)
      records.set(row.id, row)
    }
    if (page >= pages) break
    if (!data.result.length) throw new ApiError('Chưa tải đủ dữ liệu. Vui lòng thử lại.', 502)
  }
  if (records.size !== total) throw new ApiError('Chưa tải đủ dữ liệu. Vui lòng thử lại.', 409)
  return { state: 'ready', source, rows: [...records.values()] }
}
export async function loadAdminDashboard({ user }, options = {}) {
  if (!user?.roles?.includes('ADMIN')) throw new ApiError('Bạn không có quyền xem tổng quan quản trị.', 403)
  const definitions = {
    bakeries: ['/admin/bakeries', (params, request) => publicationAdminService.getBakeries(params, request)],
    payments: ['/admin/bakery-payments', (params, request) => publicationAdminService.getPayments({ ...params, sort: 'submittedAt,desc' }, request)],
    orders: ['/orders:scope=all', (params, request) => orderService.getOrders({ ...params, scope: 'all' }, request)],
    users: ['/admin/users', (params, request) => api.get('/admin/users?' + new URLSearchParams(params), request)],
  }
  const entries = await Promise.all(Object.entries(definitions).map(async ([key, [path, load]]) => {
    try { return [key, await readDashboardPages(load, options, () => demoRuntime?.sources.get(path) || 'real')] }
    catch (error) { if (options.signal?.aborted) throw error; return [key, { state: 'error', rows: [], error }] }
  }))
  const collections = Object.fromEntries(entries)
  return { ...collections, ...dashboardSupplement(demoRuntime, user, collections) }
}

export async function loadDashboardPayment({ id }, options = {}) {
  if (!id) return null
  requireId(id)
  const collection = await readDashboardPages((params, request) => publicationAdminService.getPayments({ ...params, sort: 'submittedAt,desc' }, request), options, () => demoRuntime?.sources.get('/admin/bakery-payments') || 'real')
  return collection.rows.find((row) => row.id === id) || null
}
