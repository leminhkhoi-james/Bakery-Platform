import { loadOrders } from './orderService.js'
import { readDashboardPages } from './adminDashboardService.js'

export async function loadAdminSearchOrders({ search = '', page = 1, size = 10, ...filters }, options) {
  if (!search.trim()) return loadOrders({ ...filters, scope: 'all', page, size }, options)
  const collection = await readDashboardPages((paging, request) => loadOrders({ ...filters, ...paging, scope: 'all' }, request), options)
  const normalize = value => String(value || '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('vi').replace(/đ/g, 'd')
  const query = normalize(search.trim())
  const rows = collection.rows.filter(row => [row.id, row.orderNumber, row.customerName, row.bakeryName].some(value => normalize(value).includes(query)))
  const pages = Math.ceil(rows.length / size), current = Math.min(page, Math.max(1, pages))
  return { result: rows.slice((current - 1) * size, current * size), meta: { page: current, pageSize: size, pages, total: rows.length } }
}
