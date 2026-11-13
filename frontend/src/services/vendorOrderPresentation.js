import { ApiError } from './apiClient.js'
import { loadOrders, orderService } from './orderService.js'
import { readDashboardPages } from './adminDashboardService.js'
import { orderDisplayNumber } from './orderPresentation.js'
import { cleanPresentationLabel } from './uiLabels.js'
import { loadRfq } from './rfqService.js'

export const vendorOrderSourceLabels = {
  DIRECT_CATALOG: 'Đặt từ mẫu bánh',
  ACCEPTED_OFFER: 'Đặt theo báo giá',
}

export function vendorOrderDateRange(from = '', to = '') {
  for (const value of [from, to]) {
    if (!value) continue
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new ApiError('Ngày lọc không hợp lệ.', 400)
  }
  if (from && to && from > to) throw new ApiError('Ngày bắt đầu phải trước hoặc cùng ngày kết thúc.', 400)
  // The API accepts instants with inclusive bounds. A selected day covers the
  // entire Vietnamese calendar day, independent of the browser's timezone.
  return {
    ...(from ? { createdFrom: from + 'T00:00:00+07:00' } : {}),
    ...(to ? { createdTo: to + 'T23:59:59.999999999+07:00' } : {}),
  }
}

export const normalizeOrderSearch = value =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('vi').replace(/đ/g, 'd')

export const orderDeliveryArea = order => [order.deliveryAddress?.district, order.deliveryAddress?.city].filter(Boolean).join(', ')

async function withOrderDetails(orders, options) {
  const rows = []
  for (let index = 0; index < orders.length; index += 5) {
    options?.signal?.throwIfAborted()
    const batch = await Promise.all(orders.slice(index, index + 5).map(async order => {
      if (cleanPresentationLabel(order.customerName) && order.items && order.deliveryAddress) return order
      try {
        const detail = await orderService.getOrderById(order.id, options)
        if (detail.id !== order.id || detail.bakeryId !== order.bakeryId || detail.customerId !== order.customerId) {
          return { ...order, customerLookupFailed: true }
        }
        return { ...order, ...detail, customerName: detail.customerName || order.customerName, customerPhone: detail.customerPhone || order.customerPhone }
      } catch (error) {
        if (options?.signal?.aborted || error.status === 401) throw error
        return { ...order, customerLookupFailed: true }
      }
    }))
    rows.push(...batch)
  }
  return rows
}

async function withOrderBudgets(orders, options) {
  const requests = new Map()
  for (const order of orders) {
    if (!order.cakeRequestId || requests.has(order.cakeRequestId) ||
        order.items?.some(item => item.configuration?.budgetMin != null || item.configuration?.budgetMax != null)) continue
    try { requests.set(order.cakeRequestId, await loadRfq({ id: order.cakeRequestId }, options)) }
    catch (error) {
      if (options?.signal?.aborted || error.status === 401) throw error
      requests.set(order.cakeRequestId, null)
    }
  }
  return orders.map(order => {
    const request = requests.get(order.cakeRequestId)
    const budget = order.items?.map(item => item.configuration).find(config => config?.budgetMin != null || config?.budgetMax != null)
    return { ...order, budgetMin: budget?.budgetMin ?? request?.budgetMin, budgetMax: budget?.budgetMax ?? request?.budgetMax }
  })
}

export async function loadVendorOrders({ from, to, search = '', address = '', page = 1, size = 10, ...params }, options) {
  const filters = { ...params, scope: 'bakery', ...vendorOrderDateRange(from, to) }
  const query = normalizeOrderSearch(search.trim())
  const areaQuery = normalizeOrderSearch(address.trim())
  if (!query && !areaQuery) {
    const orders = await loadOrders({ ...filters, page, size }, options)
    const detailed = await withOrderDetails(orders.result, options)
    return { ...orders, result: await withOrderBudgets(detailed, options) }
  }

  const collection = await readDashboardPages((pagination, request) =>
    loadOrders({ ...pagination, ...filters }, request), options)
  const detailed = await withOrderDetails(collection.rows, options)
  const rows = detailed.filter(order => {
    const { addressLine, ward } = order.deliveryAddress || {}
    return (!query || [order.customerName, order.orderNumber, orderDisplayNumber(order), order.id].some(value =>
      normalizeOrderSearch(value || '').includes(query))) &&
      (!areaQuery || normalizeOrderSearch([addressLine, ward, orderDeliveryArea(order)].filter(Boolean).join(', ')).includes(areaQuery))
  })
  const total = rows.length
  const pages = Math.ceil(total / size)
  const currentPage = Math.min(page, Math.max(1, pages))
  return {
    result: await withOrderBudgets(rows.slice((currentPage - 1) * size, currentPage * size), options),
    meta: { page: currentPage, pageSize: size, total, pages },
    customerLookupIncomplete: detailed.some(order => order.customerLookupFailed),
  }
}

export function vendorOrderError(error) {
  if (error?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (error?.status === 403) return 'Bạn chưa có quyền xem đơn hàng của cửa hàng này. Vui lòng kiểm tra lại cửa hàng đang chọn.'
  if (error?.status === 404) return 'Không tìm thấy cửa hàng hoặc đơn hàng.'
  if (error?.status === 400) return 'Khoảng ngày lọc không hợp lệ. Ngày bắt đầu phải trước hoặc cùng ngày kết thúc.'
  if (error?.status === 0) return 'Kết nối đang gián đoạn. Vui lòng thử lại.'
  return 'Chưa thể tải đơn hàng. Vui lòng thử lại sau.'
}
