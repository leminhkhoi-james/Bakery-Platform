import RecordActionButton from '../common/RecordActionButton.jsx'
import { useViewportPageSize } from '../../hooks/useViewportPageSize.js'
import { loadUsers, userName, USER_STATUSES } from '../../services/adminUserService.js'
import { readDashboardPages } from '../../services/adminDashboardService.js'
import { formatOrderDate, formatOrderMoney, orderDisplayNumber } from '../../services/orderPresentation.js'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import { DataTable, DetailDrawer, StatusBadge } from '../common/WorkspaceUI.jsx'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { requestMatchesBakery, requestTitleWithoutCustomer } from '../../services/vendorRfqModels.js'
import { loadVendorRequests } from '../../services/vendorRfqService.js'
import { loadOffers, loadRfq } from '../../services/rfqService.js'
import { loadOrder, loadOrders } from '../../services/orderService.js'
import { publicationAdminService } from '../../services/publicationAdminService.js'
import { unifiedEnabled, unifiedSnapshot, unifiedMetrics, recordSource, canonicalBakeryId, localBakeryFor, unifiedIssues } from '../../services/unifiedDataService.js'
import BusinessRequestForm from './BusinessRequestForm.jsx'
import { businessRequestChange } from '../../mockData/business/requests.js'
import BusinessRecordDetail from './BusinessRecordDetail.jsx'
import React, { useEffect, useId, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { simulationStore } from '../../mockData/business/runtime.js'
import { businessMetrics, businessDateSelected } from '../../mockData/business/metrics.js'
import { businessAction } from '../../mockData/business/actions.js'
import { ORDER_STATUSES, ORDER_SOURCES, orderStatusLabel } from '../../services/orderModels.js'
import { uiLabel } from '../../services/uiLabels.js'
import { REQUEST_STATUSES, OFFER_STATUSES, moneyVnd } from '../../services/marketplaceModels.js'
import { displayReference } from '../../services/displayReference.js'

const loadReportOrders = ({ enabled, scope, bakeryId }, options) => enabled
  ? loadOrders({ scope, bakeryId, size: 100 }, options) : Promise.resolve(null)
const loadReportPayments = ({ enabled }, options) => enabled
  ? publicationAdminService.getPayments({ size: 100 }, options) : Promise.resolve(null)

const loadReportRequests = ({ bakery }, options) => bakery
  ? loadVendorRequests({ bakery, size: Number.MAX_SAFE_INTEGER }, options) : Promise.resolve(null)
const loadReportOffers = ({ bakeryId }, options) => bakeryId
  ? readDashboardPages((page, request) => loadOffers({ ...page, scope: 'sent', bakeryId }, request), options, () => 'combined')
  : Promise.resolve(null)

const loadReportCustomers = ({ enabled }, options) => enabled
  ? readDashboardPages(loadUsers, options)
  : Promise.resolve(null)

async function loadLinkedRequests({ ids }, options) {
  const requests = {}
  for (let offset = 0; offset < ids.length; offset += 6) {
    options.signal?.throwIfAborted()
    const batch = await Promise.allSettled(ids.slice(offset, offset + 6).map(id => loadRfq({ id }, options)))
    for (const result of batch) {
      if (result.status === 'fulfilled') requests[result.value.id] = result.value
    }
  }
  return requests
}

async function loadOrderCustomerNames({ orders }, options) {
  const names = {}
  for (let offset = 0; offset < orders.length; offset += 6) {
    options.signal?.throwIfAborted()
    const batch = orders.slice(offset, offset + 6)
    const results = await Promise.allSettled(batch.map(order => loadOrder({ orderId: order.id }, options)))
    results.forEach((result, index) => {
      const expected = batch[index], detail = result.value
      if (detail?.bakeryId === expected.bakeryId && detail.customerId === expected.customerId && detail.customerName) {
        names[detail.customerId] = detail.customerName
      }
    })
  }
  return names
}

function requestBudget(row, compact = false) {
  const { budgetMin, budgetMax } = row
  if (budgetMin != null && budgetMax != null) {
    if (budgetMin === budgetMax) return moneyVnd(budgetMin)
    return (compact ? Number(budgetMin).toLocaleString('vi-VN') : moneyVnd(budgetMin)) + ' – ' + moneyVnd(budgetMax)
  }
  if (budgetMin != null) return 'Từ ' + moneyVnd(budgetMin)
  if (budgetMax != null) return 'Đến ' + moneyVnd(budgetMax)
  return '—'
}

const recordStatusLabels = { OPEN: 'Đang nhận báo giá', DRAFT: 'Bản nháp', OFFER_SELECTED: 'Đã chọn báo giá', PENDING: 'Chờ phản hồi', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', EXPIRED: 'Đã hết hạn', WITHDRAWN: 'Đã rút', CLOSED: 'Đã đóng', CANCELLED: 'Đã hủy', ACTIVE: 'Đang hoạt động', BLOCKED: 'Đã tạm ngưng', SUSPENDED: 'Đã tạm ngưng', DELETED: 'Đã xóa', COMPLETED: 'Đã thu', REFUNDED: 'Đã hoàn' }

function recordStatusLabel(tab, status) {
  if (tab === 'orders') return orderStatusLabel(status)
  if (tab === 'transactions' && status === 'PENDING') return 'Chờ thu'
  if (tab === 'customers' && status === 'PENDING') return 'Chờ kích hoạt'
  return recordStatusLabels[status] || 'Chưa rõ trạng thái'
}

const normalizeSearch = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('vi').replace(/đ/g, 'd')

function MetricGroup({ title, metrics, monetary }) {
  return <section className={'sc-business-kpi-group' + (monetary ? ' sc-business-kpi-group--money' : '')}>
    <h3>{title}</h3>
    <dl className="sc-business-totals" style={{ '--sc-metric-columns': metrics.length }}>
      {metrics.map(([label, value, description]) => <div key={label} title={description}><dt>{label}</dt><dd data-business-metric={label}>{value}</dd></div>)}
    </dl>
  </section>
}

export default function BusinessSimulationReport({ bakeryId = '', bakery, requestsOnly = false, loadHistory = false, dates, reportBakeryId, showRecords = true, showMetrics = !requestsOnly, activeTab, navigation, onOpenRecord }) {
  const { user, roles } = useAuth(), [, setRevision] = useState(0), [now, setNow] = useState(Date.now), [selectedShop, setShop] = useState(''), [draftFrom, setFrom] = useState(''), [draftTo, setTo] = useState(''), [selectedTab, setTab] = useState(requestsOnly ? 'requests' : 'orders'), [decision, setDecision] = useState(null), [note, setNote] = useState(''), [message, setMessage] = useState(''), [search, setSearch] = useState(''), [page, setPage] = useState(1), [condition, setCondition] = useState(''), [selection, setSelection] = useState(null), [addingRequest, setAddingRequest] = useState(false), [formError, setFormError] = useState(null)
  const { containerRef, pageSize } = useViewportPageSize(() => setPage(1), showRecords)
  const tab = activeTab ?? selectedTab
  const useOrderFilters = Boolean(activeTab || requestsOnly)
  const usesOwnerTable = useOrderFilters
  const isOrderTable = usesOwnerTable && tab === 'orders'
  const confirmFormId = useId()
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [location, setLocation] = useState('')
  const [unquotedOnly, setUnquotedOnly] = useState(false)
  const sort = 'desc'
  const [orderSource, setOrderSource] = useState('')
  const showOrderSource = requestsOnly
  useEffect(() => { const update = () => { setRevision(value => value + 1); setNow(Date.now()) }; window.addEventListener('sweetcake:api-mutated', update); window.addEventListener('sweetcake:unified-updated', update); return () => { window.removeEventListener('sweetcake:api-mutated', update); window.removeEventListener('sweetcake:unified-updated', update) } }, [])
  const store = simulationStore(), isAdmin = roles.includes('ADMIN'), scope = canonicalBakeryId(isAdmin ? (reportBakeryId ?? selectedShop) : bakeryId)
  const customersResource = useCatalogResource(loadReportCustomers, { enabled: requestsOnly && isAdmin })
  const shouldLoad = loadHistory && unifiedEnabled() && Boolean(isAdmin || bakeryId)
  useCatalogResource(loadReportOrders, { enabled: shouldLoad, scope: isAdmin ? 'all' : 'bakery', bakeryId: isAdmin ? undefined : scope })
  useCatalogResource(loadReportPayments, { enabled: shouldLoad && isAdmin })
  const ownerBakeryId = !isAdmin && unifiedEnabled() ? scope : undefined
  const eligibleRequests = useCatalogResource(loadReportRequests, { bakery: ownerBakeryId && bakery?.id === ownerBakeryId ? bakery : undefined })
  const reportOffers = useCatalogResource(loadReportOffers, { bakeryId: ownerBakeryId })
  store?.reload()
  const unified = unifiedEnabled(), state = unified ? unifiedSnapshot() : store ? structuredClone(store.state) : null
  const requestIdsWithoutCustomers = requestsOnly && isAdmin && ['requests', 'offers'].includes(tab)
    ? (state?.requests || []).filter(row => !row.customerId && !row.customerName && recordSource(row) === 'api').map(row => row.id)
    : []
  const ownerRelated = !isAdmin && Boolean(onOpenRecord)
  const ownerOfferRequestIds = ownerRelated && tab === 'offers' ? (state?.offers || [])
    .filter(row => row.bakeryId === scope && recordSource(row) === 'api')
    .map(row => row.cakeRequestId) : []
  const ownerRequestIds = ownerRelated && tab === 'requests' ? (eligibleRequests.data?.result || [])
    .filter(row => !row.customerId && !row.customerName && recordSource(row) === 'api').map(row => row.id) : []
  const linkedRequests = useCatalogResource(loadLinkedRequests, { ids: [...new Set([...requestIdsWithoutCustomers, ...ownerOfferRequestIds, ...ownerRequestIds])].sort() })
  const missingCustomerIds = new Set([...(eligibleRequests.data?.result || []), ...Object.values(linkedRequests.data || {})]
    .filter(row => row.customerId && !row.customerName).map(row => row.customerId))
  const orderCandidates = new Map()
  if (ownerRelated) for (const order of state?.orders || []) {
    if (order.bakeryId === scope && missingCustomerIds.has(order.customerId) && !orderCandidates.has(order.customerId)) {
      orderCandidates.set(order.customerId, { id: order.id, bakeryId: order.bakeryId, customerId: order.customerId })
    }
  }
  const orderCustomerNames = useCatalogResource(loadOrderCustomerNames, { orders: [...orderCandidates.values()] })
  if (!state || !user || !isAdmin && !scope) return navigation ?? null
  const from = dates?.from ?? draftFrom
  const to = dates?.to ?? draftTo
  const invalidDates = from && to && from > to
  const sentRequestIds = new Set(state.offers.filter(offer => offer.bakeryId === scope).map(offer => offer.cakeRequestId))
  const eligibleIds = new Set(eligibleRequests.data?.result.map(row => row.id) || [])
  const localBakery = unified && scope ? localBakeryFor(scope) : null
  const apiBakery = scope ? state.bakeries.find(shop => shop.id === scope) : null
  const requests = !unified || !scope ? state.requests : state.requests.filter(row => {
    if (sentRequestIds.has(row.id) || eligibleIds.has(row.id)) return true
    const bakery = recordSource(row) === 'local' ? localBakery : isAdmin ? apiBakery : null
    const request = row.targetBakeryId ? { ...row, targetBakeryId: canonicalBakeryId(row.targetBakeryId) } : row
    return bakery && requestMatchesBakery(request, bakery)
  })
  const metrics = !showMetrics || invalidDates ? null : (unified ? unifiedMetrics : businessMetrics)({ ...state, requests }, { bakeryId: scope, from, to })
  const visible = row => !scope || row.bakeryId === scope
  const usersById = new Map(state.users.map(person => [person.id, person]))
  for (const person of customersResource.data?.rows || []) usersById.set(person.id, person)
  const requestsById = new Map(state.requests.map(request => [request.id, request]))
  const ordersById = new Map(state.orders.map(order => [order.id, order]))
  const shopsById = new Map(state.bakeries.map(shop => [shop.id, shop.name]))
  const scopedOrders = state.orders.filter(visible)
  const namesByRequest = new Map()
  const namesByCustomer = new Map()
  if (!isAdmin && (tab === 'requests' || tab === 'offers')) {
    for (const record of [...scopedOrders, ...state.conversations.filter(visible)]) {
      if (!record.customerName) continue
      if (record.cakeRequestId) namesByRequest.set(record.cakeRequestId, record.customerName)
      if (record.customerId) namesByCustomer.set(record.customerId, record.customerName)
    }
  }
  const requestCustomerName = request => request?.customerName ||
    linkedRequests.data?.[request?.id]?.customerName ||
    userName(usersById.get(request?.customerId || linkedRequests.data?.[request?.id]?.customerId)) ||
    namesByRequest.get(request?.id) || namesByCustomer.get(request?.customerId || linkedRequests.data?.[request?.id]?.customerId) ||
    orderCustomerNames.data?.[request?.customerId || linkedRequests.data?.[request?.id]?.customerId]
  const customerOrders = new Map()
  if (tab === 'customers') {
    for (const order of scopedOrders) {
      const orders = customerOrders.get(order.customerId) || []
      orders.push(order)
      customerOrders.set(order.customerId, orders)
    }
  }

  const records = tab === 'requests'
    ? requests.filter(row => (unified || isAdmin || row.status === 'OPEN' || sentRequestIds.has(row.id)) &&
      (!unquotedOnly || row.status === 'OPEN' && !sentRequestIds.has(row.id))).map(row => ({
      ...row, customerName: requestCustomerName(row), bakeryName: row.bakeryName || shopsById.get(row.targetBakeryId),
    }))
    : tab === 'transactions'
      ? state.salesPayments.filter(visible).map(row => {
        const order = ordersById.get(row.orderId)
        return { ...row, title: order?.orderNumber, customerName: order?.customerName, totalAmount: row.amount }
      })
      : tab === 'offers'
        ? state.offers.filter(visible).map(row => {
          const request = linkedRequests.data?.[row.cakeRequestId] || requestsById.get(row.cakeRequestId)
          return { ...row, title: request?.title, customerName: requestCustomerName(request) || namesByRequest.get(row.cakeRequestId),
            deliveryCity: request?.deliveryCity, deliveryDistrict: request?.deliveryDistrict,
            servingSize: request?.servingSize, description: request?.description,
            budgetMin: request?.budgetMin, budgetMax: request?.budgetMax }
        })
        : tab === 'customers'
          ? state.users.filter(person => customerOrders.has(person.id)).map(person => {
            const orders = customerOrders.get(person.id)
            const shopNames = [...new Set(orders.map(order => order.bakeryName || shopsById.get(order.bakeryId)).filter(Boolean))]
            const totals = new Map()
            for (const order of orders) {
              if (typeof order.totalAmount === 'number' && Number.isFinite(order.totalAmount) && order.currency) {
                totals.set(order.currency, (totals.get(order.currency) || 0) + order.totalAmount)
              }
            }
            return { ...person, customerName: userName(person), shopNames, totals }
          })
          : scopedOrders

  const query = normalizeSearch(search.trim())
  const matchesSearch = row => {
    const text = [row.title, row.name, row.orderNumber, row.customerName, row.status, recordStatusLabel(tab, row.status)]
    if (!requestsOnly) return text.join(' ').toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))
    return !query || normalizeSearch([
      ...text, row.displayName, row.bakeryName, ...(row.shopNames || []), row.id, displayReference(row.id, tab === 'offers' ? 'OF' : 'SC'),
    ].join(' ')).includes(query)
  }
  const sourceOrders = showOrderSource && orderSource
    ? state.orders.filter(order => visible(order) && order.orderSource === orderSource)
    : null
  const matchesOrderSource = row => !sourceOrders || sourceOrders.some(order => {
    switch (tab) {
      case 'requests': return order.cakeRequestId === row.id
      case 'offers': return order.offerId === row.id
      case 'customers': return order.customerId === row.id
      case 'transactions': return order.id === row.orderId
      default: return order.id === row.id
    }
  })
  const matchingRecords = records.filter(row => matchesOrderSource(row) && businessDateSelected(row.createdAt, from, to) && (!condition || condition === 'DISPUTED' && row.issueStatus === 'DISPUTED' || condition === 'SCHEDULED' && row.status === 'CONFIRMED' && Date.parse(row.neededAt) > now || condition === 'OVERDUE' && row.neededAt && !['COMPLETED', 'CANCELLED'].includes(row.status) && Date.parse(row.neededAt) < now || condition === 'UNPAID' && row.status === 'COMPLETED' && row.paymentStatus !== 'PAID') && matchesSearch(row))
  const deliveryArea = row => [row.deliveryDistrict, row.deliveryCity].filter(Boolean).join(', ')
  const locations = ownerRelated ? [...new Set(records.map(deliveryArea).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')) : []
  const cities = ownerRelated ? [...new Set(records.map(row => row.deliveryCity).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')) : []
  const locationMatches = matchingRecords.filter(row => !ownerRelated || !location ||
    location === 'city:' + row.deliveryCity || deliveryArea(row) === location)
  const statuses = useOrderFilters ? ({
    orders: ORDER_STATUSES, requests: REQUEST_STATUSES, offers: OFFER_STATUSES, customers: USER_STATUSES,
  }[tab] || [...new Set(matchingRecords.map(row => row.status).filter(Boolean))]) : []
  const selectedStatus = statuses.includes(status) ? status : ''
  const filtered = selectedStatus ? locationMatches.filter(row => (tab === 'customers' && row.status === 'SUSPENDED' ? 'BLOCKED' : row.status) === selectedStatus) : locationMatches
  if (useOrderFilters) filtered.sort((a, b) => {
    const difference = (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0)
    return sort === 'asc' ? difference : -difference
  })
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pages)
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const changeFilter = setter => event => { setter(event.target.value); setPage(1) }
  function requestAction(type, record) { setDecision({ type, id: record.id }); setNote(''); setMessage('') }
  async function confirm(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try { if (decision.type.endsWith('Request')) await businessRequestChange(decision.type === 'publishRequest' ? 'publish' : 'cancel', decision.id, { reason: note }, user); else await businessAction(decision.type, decision.id, user, note); setDecision(null); setMessage('Đã cập nhật sổ kinh doanh.'); setRevision(value => value + 1) }
    catch (error) { setMessage(error.message) }
    finally { setSaving(false) }
  }
  return <section ref={containerRef} className={activeTab ? "sc-business-report sc-business-report--embedded sc-vendor-order-list sc-vendor-order-list--embedded" : requestsOnly ? "sc-business-report sc-business-report--embedded" : "sc-business-report"} aria-label={activeTab ? "Danh sách quản lý đơn hàng" : "Báo cáo kinh doanh"}>
    {!activeTab && !requestsOnly && <h2 className="text-xl font-bold text-primary">Báo cáo kinh doanh</h2>}
    {!requestsOnly && !activeTab && (!dates || isAdmin && reportBakeryId === undefined) && <div className="sc-business-filters">{isAdmin && reportBakeryId === undefined && <label>Phạm vi tiệm<select aria-label="Phạm vi tiệm" value={selectedShop} onChange={event => { setShop(event.target.value); setPage(1) }}><option value="">Toàn hệ thống</option>{state.bakeries.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}</select></label>}{!dates && <><label>Từ ngày<input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label><label>Đến ngày<input type="date" value={to} onChange={event => setTo(event.target.value)} /></label></>}</div>}
    {invalidDates ? <p role="alert">Ngày bắt đầu phải trước ngày kết thúc.</p> : <>{!requestsOnly && !activeTab && <p className="text-sm">{isAdmin && reportBakeryId === undefined && <>{scope ? state.bakeries.find(shop => shop.id === scope)?.name : 'Toàn hệ thống'} · </>}{from || to ? 'Đơn theo ngày tạo · doanh thu theo ngày ghi nhận' : 'Tất cả thời gian'}</p>}{showMetrics && <div className="sc-business-kpi-groups">
      {unified && <p className="sc-business-metric-note">{metrics.apiOrders} đơn hệ thống · {metrics.localOrders} đơn mô phỏng{unifiedIssues().some(issue => ['/orders', '/cake-requests', '/offers', '/admin/bakery-payments'].includes(issue.path)) && ' · Một số nguồn chưa tải đủ, số liệu hiện tại có thể chưa đầy đủ.'}</p>}
      <MetricGroup title="Tổng quan đơn hàng" metrics={[
        ['Tổng đơn', metrics.orders, 'Số đơn duy nhất của các nguồn trong phạm vi và khoảng ngày đã chọn.'],
        ['Đang xử lý', metrics.processing, 'Chờ xác nhận, đã xác nhận, đang làm bánh, sẵn sàng giao và đang giao.'],
        ['Hoàn thành', metrics.byStatus.COMPLETED],
        ['Đã hủy', metrics.byStatus.CANCELLED],
      ]} />
      <MetricGroup title="Theo dõi đơn hàng" metrics={[
        ['Đã xác nhận, chờ giao', metrics.scheduled, 'Đơn đã xác nhận và chưa đến thời gian hẹn giao.'],
        ['Quá hẹn chưa hoàn tất', metrics.overdue, 'Đơn chưa hoàn thành hoặc hủy, có hẹn giao trước thời điểm hiện tại.'],
        ['Đang có phản ánh', metrics.disputed],
        ['Hoàn tất, chưa thu tiền', metrics.pendingCollections, 'Chỉ tính đơn đã hoàn thành có trạng thái chưa thu tiền được lưu.'],
        ['Chưa rõ trạng thái thu tiền', metrics.unknownPaymentOrders, 'Đơn chưa hủy nhưng nguồn dữ liệu chưa cung cấp trạng thái thu tiền.'],
      ]} />
      <MetricGroup title="Yêu cầu & khách hàng" metrics={[
        ['Tổng yêu cầu bánh', metrics.rfqs, 'Bao gồm các trạng thái yêu cầu trong phạm vi đã chọn.'],
        ['Tổng báo giá', metrics.offers],
        ['Khách đã đặt bánh', metrics.customers, 'Đếm khách hàng duy nhất có đơn trong khoảng ngày đã chọn, không phải tổng tài khoản.'],
        ['Đánh giá công khai', metrics.reviews],
        ['Chứng từ chờ duyệt', metrics.pendingPayments],
      ]} />
      <MetricGroup title="Doanh thu & giá trị" monetary metrics={[
        [unified ? 'Doanh thu bánh đã thu (mô phỏng)' : 'Doanh thu bánh đã thu', moneyVnd(metrics.salesRevenue), 'Chỉ ghi nhận đơn hoàn thành, đã thu đủ tiền, có phiếu thu hợp lệ, chưa hoàn tiền và không có tranh chấp.'],
        ['Giá trị đơn chưa hủy', metrics.activeOrderValue == null ? '—' : moneyVnd(metrics.activeOrderValue), 'Tổng giá trị các đơn chưa hủy theo ngày tạo, bao gồm phí giao hàng. Đây là giá trị đơn, không phải doanh thu đã thu.'],
        ['Doanh thu gói đã xác nhận', metrics.subscriptionRevenue == null ? '—' : moneyVnd(metrics.subscriptionRevenue), 'Giao dịch gói của hệ thống đã được xác nhận, tính theo thời điểm phê duyệt và mỗi đơn mua gói chỉ ghi nhận một lần.'],
        ...(unified ? [['Doanh thu gói (mô phỏng)', moneyVnd(metrics.simulationSubscriptionRevenue), 'Ghi nhận riêng giao dịch mô phỏng đã được duyệt.']] : []),
      ]} />
      {unified && metrics.realSalesRevenue == null && <p className="sc-business-metric-note">Doanh thu bánh của hệ thống chưa xác định vì chưa có dữ liệu xác nhận thu tiền. Doanh thu mô phỏng được thống kê riêng.</p>}
    </div>}</>}
    {showRecords && <>
    {useOrderFilters && <div className="sc-toolbar sc-vendor-order-filters">
      <div className={requestsOnly ? "sc-vendor-order-filter-row" : "sc-vendor-order-filter-row sc-vendor-order-filter-row--two"}>
        {requestsOnly && <label className="sc-vendor-order-search">Tìm tên hoặc mã đơn<input className="sc-input" type="search" value={search} onChange={changeFilter(setSearch)} placeholder="Nhập tên hoặc một phần mã" /></label>}
        <label>Trạng thái<select className="sc-input" value={selectedStatus} onChange={changeFilter(setStatus)}>
          <option value="">Tất cả</option>
          {statuses.map(value => <option key={value} value={value}>{recordStatusLabel(tab, value)}</option>)}
        </select></label>
        {ownerRelated && <label>Khu vực giao<select className="sc-input" value={location} onChange={changeFilter(setLocation)}>
          <option value="">Tất cả khu vực</option>
          {cities.length > 0 && <optgroup label="Tỉnh/thành">{cities.map(value => <option key={value} value={'city:' + value}>{value}</option>)}</optgroup>}
          {locations.length > 0 && <optgroup label="Quận/huyện và tỉnh/thành">{locations.map(value => <option key={value} value={value}>{value}</option>)}</optgroup>}
        </select></label>}
        {ownerRelated && tab === 'requests' && <label>Danh sách<select className="sc-input" value={unquotedOnly ? 'unquoted' : ''} onChange={event => { setUnquotedOnly(event.target.value === 'unquoted'); setStatus(''); setPage(1) }}>
          <option value="">Tất cả yêu cầu</option><option value="unquoted">Chưa báo giá</option>
        </select></label>}
        {showOrderSource && <label>Nguồn đơn<select className="sc-input" value={orderSource} onChange={changeFilter(setOrderSource)}>
          <option value="">Tất cả</option>
          {ORDER_SOURCES.map(value => <option key={value} value={value}>{uiLabel(value)}</option>)}
        </select></label>}
      </div>
      <div className={requestsOnly ? "sc-vendor-order-date-row sc-vendor-order-date-row--with-search" : "sc-vendor-order-date-row"}>
        <label>Tạo từ<input className="sc-input" type="date" value={from} onChange={changeFilter(setFrom)} aria-invalid={Boolean(invalidDates) || undefined} /></label>
        <label>Tạo đến<input className="sc-input" type="date" value={to} onChange={changeFilter(setTo)} aria-invalid={Boolean(invalidDates) || undefined} /></label>
      </div>
    </div>}
    {!activeTab && <div className="sc-business-table-toolbar">
      {!activeTab && <div className="sc-business-tabs">{[['orders', 'Đơn hàng'], ['requests', 'Yêu cầu bánh'], ['offers', 'Báo giá'], ['customers', 'Khách hàng'], ['transactions', 'Thu & hoàn']].filter(([key]) => isAdmin || key !== 'transactions').map(([key, label]) => <button key={key} className={'sc-button sc-action-button--secondary' + (tab === key ? ' is-selected' : '')} aria-pressed={tab === key} onClick={() => { setTab(key); setStatus(''); setSearch(''); setCondition(''); setPage(1) }}>{label}</button>)}{isAdmin && tab === 'requests' && <button className="sc-button" onClick={() => { setFormError(null); setAddingRequest(true) }}>Thêm yêu cầu bánh</button>}</div>}
    {!requestsOnly && <div className="sc-business-filters">
    {tab === 'orders' && <label>Tình trạng bổ sung<select aria-label="Tình trạng bổ sung" value={condition} onChange={event => { setCondition(event.target.value); setPage(1) }}><option value="">Tất cả</option><option value="SCHEDULED">Đã lên lịch</option><option value="OVERDUE">Quá hạn giao</option><option value="DISPUTED">Đang xử lý phản ánh</option><option value="UNPAID">Hoàn tất chưa thu</option></select></label>}
    <label>Tìm trong sổ<input aria-label="Tìm trong sổ" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder="Mã đơn, khách hàng hoặc nội dung" /></label>
    </div>}</div>}
    {navigation}
    {ownerRelated && (reportOffers.error || eligibleRequests.error) && <p role="alert">Chưa tải được đầy đủ yêu cầu hoặc báo giá.</p>}
    <DataTable label="Danh sách trong sổ kinh doanh" className={ownerRelated ? "sc-vendor-order-table sc-vendor-related-table sc-owner-rfq-orders-table" : isOrderTable ? "sc-vendor-order-table" : usesOwnerTable ? "sc-vendor-order-table sc-vendor-related-table" : "sc-business-table"}>
      {ownerRelated && <colgroup>
        <col className="sc-rfq-orders-col--number" /><col />
        <col className="sc-rfq-orders-col--customer" /><col className="sc-rfq-orders-col--area" />
        <col className="sc-rfq-orders-col--status" />
        {tab === 'offers' && <col className="sc-rfq-orders-col--price" />}
        <col className="sc-rfq-orders-col--budget" /><col className="sc-rfq-orders-col--date" />
        {tab === 'requests' && <col className="sc-rfq-orders-col--date" />}
        <col className="sc-rfq-orders-col--action" />
      </colgroup>}
      {isOrderTable && <colgroup><col style={{ width: '60px' }} />{[16, 17, 16, 13, 13, 14, 11].map((width, index) => <col key={index} style={{ width: width + '%' }} />)}</colgroup>}
      <thead><tr>{usesOwnerTable && <th scope="col">STT</th>}<th>{isOrderTable ? 'Mã đơn' : 'Nội dung'}</th><th>{isOrderTable || ownerRelated ? 'Khách hàng' : 'Khách hàng / tiệm'}</th>{ownerRelated && <th scope="col">Khu vực giao</th>}<th>Trạng thái</th>{isOrderTable && <th>Nguồn đơn</th>}<th className={isOrderTable ? "sc-money" : "sc-business-value"}>{isOrderTable ? 'Tổng tiền' : tab === 'customers' ? 'Tổng giá trị đơn' : ownerRelated ? (tab === 'offers' ? 'Giá đã báo' : 'Ngân sách') : 'Giá trị'}</th>{ownerRelated && tab === 'offers' && <th scope="col" className="sc-business-value">Ngân sách</th>}{ownerRelated && <th scope="col">Hiệu lực đến</th>}{ownerRelated && tab === 'requests' && <th scope="col">Cần bánh lúc</th>}{isOrderTable && <th scope="col">Hẹn giao</th>}<th scope="col" className="sc-table-actions">Thao tác</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id}>{usesOwnerTable && <td data-label="STT">{(currentPage - 1) * pageSize + index + 1}</td>}<td>{isOrderTable ? <strong>{orderDisplayNumber(row)}</strong> : usesOwnerTable ? <strong>{ownerRelated && (tab === 'requests' || tab === 'offers') && '1 × '}{row.orderNumber || (tab === 'requests' || tab === 'offers' ? requestTitleWithoutCustomer(row.title, row.customerName) : row.title) || row.name || row.displayName}</strong> : row.orderNumber || (tab === 'requests' || tab === 'offers' ? requestTitleWithoutCustomer(row.title, row.customerName) : row.title) || row.name || row.displayName}{!isOrderTable && <small className="block">{displayReference(row.id, tab === 'offers' ? 'OF' : 'SC')}</small>}{ownerRelated && tab === 'requests' && row.description && <small className="sc-rfq-request-description">{row.description}</small>}</td><td>{row.customerName || row.name || (!isAdmin && !ownerRelated && shopsById.get(row.bakeryId)) || (ownerRelated || tab === 'requests' || isOrderTable ? 'Chưa có tên khách hàng' : '—')}{(isAdmin || isOrderTable) && <small className="block">{row.shopNames?.join(', ') || row.bakeryName || shopsById.get(row.bakeryId)}</small>}</td>{ownerRelated && <td>{deliveryArea(row) || '—'}{row.servingSize > 0 && <small className="block">{row.servingSize} người</small>}</td>}<td>{usesOwnerTable && row.status ? <StatusBadge status={row.status} label={recordStatusLabel(tab, row.status)} /> : recordStatusLabel(tab, row.status)}{row.issueStatus === 'DISPUTED' && <small className="sc-business-order-tag">Đang xử lý phản ánh</small>}{row.status === 'CONFIRMED' && Date.parse(row.neededAt) > now && <small className="sc-business-order-tag">Đã lên lịch</small>}{row.neededAt && !['COMPLETED', 'CANCELLED'].includes(row.status) && Date.parse(row.neededAt) < now && <small className="sc-business-order-tag">Quá hạn giao</small>}</td>{isOrderTable && <td>{uiLabel(row.orderSource, 'Chưa có thông tin')}</td>}<td className={"whitespace-nowrap font-semibold tabular-nums" + (isOrderTable ? "" : " sc-business-value")}>{isOrderTable ? formatOrderMoney(row.totalAmount, row.currency) : tab === 'requests' ? requestBudget(row, ownerRelated) : tab === 'customers' ? ([...row.totals].map(([currency, total]) => formatOrderMoney(total, currency)).join(' · ') || '—') : row.totalAmount != null || row.totalPrice != null ? moneyVnd(row.totalAmount ?? row.totalPrice) : '—'}</td>{ownerRelated && tab === 'offers' && <td className="sc-business-value">{requestBudget(row, true)}</td>}{ownerRelated && <td>{formatOrderDate(tab === 'offers' ? row.expiresAt : row.offerDeadline)}</td>}{ownerRelated && tab === 'requests' && <td>{formatOrderDate(row.neededAt)}</td>}{isOrderTable && <td>{formatOrderDate(row.neededAt)}</td>}<td className="sc-table-actions"><div className="sc-business-actions"><RecordActionButton className={usesOwnerTable ? "sc-button sc-vendor-view-order" : "sc-button sc-action-button--secondary"} aria-label="Xem chi tiết" onClick={() => ownerRelated ? onOpenRecord(tab, row.id) : setSelection({ kind: tab, id: row.id })} action="view" />{tab === 'requests' && isAdmin && recordSource(row) === 'local' && row.status === 'DRAFT' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('publishRequest', row)}>Mở nhận báo giá</button>}{tab === 'requests' && isAdmin && recordSource(row) === 'local' && ['DRAFT', 'OPEN'].includes(row.status) && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('cancelRequest', row)}>Hủy yêu cầu</button>}{tab === 'offers' && !isAdmin && roles.includes('BAKERY_OWNER') && recordSource(row) === 'local' && row.status === 'PENDING' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('rejectOffer', row)}>Từ chối báo giá</button>}{tab === 'offers' && !isAdmin && recordSource(row) === 'local' && row.status === 'PENDING' && Date.parse(row.expiresAt) > now && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('acceptOffer', row)}>Ghi nhận khách đồng ý</button>}{tab === 'orders' && recordSource(row) === 'local' && row.status === 'COMPLETED' && row.paymentStatus !== 'PAID' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('collect', row)}>Ghi nhận đã thu</button>}{recordSource(row) === 'local' && row.issueStatus === 'DISPUTED' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('resolve', row)}>Xử lý phản ánh</button>}</div></td></tr>)}</tbody></DataTable>{!rows.length && <p className="p-4">Không có bản ghi phù hợp.</p>}
    <CatalogPagination meta={{ page: currentPage, pages, total: filtered.length }} onPage={setPage} />
    {decision && <DetailDrawer title={({ acceptOffer: 'Xác nhận khách đồng ý báo giá', collect: 'Xác nhận đã thu đủ tiền', resolve: 'Kết quả xử lý phản ánh', publishRequest: 'Mở nhận báo giá', cancelRequest: 'Hủy yêu cầu', rejectOffer: 'Từ chối báo giá' })[decision.type]} busy={saving} onClose={() => setDecision(null)} className="sc-workspace-detail sc-workspace-confirm" footer={<div className="sc-business-actions"><button type="submit" form={confirmFormId} className="sc-button" disabled={saving}>{saving ? 'Đang lưu…' : 'Xác nhận cập nhật'}</button><button type="button" className="sc-button sc-action-button--secondary" disabled={saving} onClick={() => setDecision(null)}>Hủy</button></div>}><form id={confirmFormId} onSubmit={confirm} className="mt-4 space-y-3" aria-label="Xác nhận cập nhật sổ"><label>Ghi chú<textarea aria-label="Ghi chú cập nhật sổ" required={['resolve', 'cancelRequest', 'rejectOffer'].includes(decision.type)} className="block border rounded-lg p-2 w-full" value={note} onChange={event => setNote(event.target.value)} /></label>{message && <p role="alert" className="sc-business-feedback">{message}</p>}</form></DetailDrawer>}
    {addingRequest && <BusinessRequestForm customers={state.users.filter(person => person.roles.includes('CUSTOMER') && !person.roles.includes('BAKERY_OWNER') && person.status === 'ACTIVE')} error={formError} onClose={() => setAddingRequest(false)} onSave={async input => { try { await businessRequestChange('create', null, input, user); setAddingRequest(false); setSearch(input.title); setPage(1); setMessage('Đã lưu bản nháp yêu cầu.'); setRevision(value => value + 1) } catch (error) { setFormError(error.message) } }} />}
    <BusinessRecordDetail now={now} selection={selection} resolvedCustomer={usersById.get(linkedRequests.data?.[selection?.kind === 'offers' ? state.offers.find(offer => offer.id === selection.id)?.cakeRequestId : selection?.id]?.customerId)} state={state} isAdmin={isAdmin} bakeryId={scope} onClose={() => setSelection(null)} onAccept={offer => { setSelection(null); requestAction('acceptOffer', offer) }} />
    {message && !decision && <p role="status" className="sc-business-feedback">{message}</p>}
    </>}
  </section>
}
