import RecordActionButton from '../common/RecordActionButton.jsx'
import { useViewportPageSize } from '../../hooks/useViewportPageSize.js'
import { loadUsers, userName } from '../../services/adminUserService.js'
import { readDashboardPages } from '../../services/adminDashboardService.js'
import { formatOrderDate, formatOrderMoney, orderDisplayNumber } from '../../services/orderPresentation.js'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import { DataTable, DetailDrawer, StatusBadge, Icon } from '../common/WorkspaceUI.jsx'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { requestMatchesBakery, requestTitleWithoutCustomer } from '../../services/vendorRfqModels.js'
import { loadVendorRequests } from '../../services/vendorRfqService.js'
import { loadOffers, loadRfq } from '../../services/rfqService.js'
import { loadOrders } from '../../services/orderService.js'
import { publicationAdminService } from '../../services/publicationAdminService.js'
import { unifiedEnabled, unifiedSnapshot, unifiedMetrics, recordSource, canonicalBakeryId, localBakeryFor } from '../../services/unifiedDataService.js'
import BusinessRequestForm from './BusinessRequestForm.jsx'
import { businessRequestChange } from '../../mockData/business/requests.js'
import BusinessRecordDetail from './BusinessRecordDetail.jsx'
import React, { useEffect, useId, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { simulationStore } from '../../mockData/business/runtime.js'
import { businessMetrics, businessDateSelected } from '../../mockData/business/metrics.js'
import { businessAction } from '../../mockData/business/actions.js'
import { ORDER_SOURCES, orderStatusLabel } from '../../services/orderModels.js'
import { uiLabel } from '../../services/uiLabels.js'
import { moneyVnd } from '../../services/marketplaceModels.js'
import { displayReference } from '../../services/displayReference.js'

const loadReportOrders = ({ enabled, scope, bakeryId }, options) => enabled
  ? loadOrders({ scope, bakeryId, size: 100 }, options) : Promise.resolve(null)
const loadReportPayments = ({ enabled }, options) => enabled
  ? publicationAdminService.getPayments({ size: 100 }, options) : Promise.resolve(null)

const loadReportRequests = ({ bakery }, options) => bakery
  ? loadVendorRequests({ bakery, size: Number.MAX_SAFE_INTEGER }, options) : Promise.resolve(null)
const loadReportOffers = ({ bakeryId }, options) => bakeryId
  ? loadOffers({ scope: 'sent', bakeryId, size: 100 }, options) : Promise.resolve(null)

const loadReportCustomers = ({ enabled }, options) => enabled
  ? readDashboardPages(loadUsers, options)
  : Promise.resolve(null)

async function loadRequestCustomerIds({ ids }, options) {
  const customers = {}
  for (let offset = 0; offset < ids.length; offset += 6) {
    options.signal?.throwIfAborted()
    const batch = await Promise.allSettled(ids.slice(offset, offset + 6).map(id => loadRfq({ id }, options)))
    for (const result of batch) {
      if (result.status === 'fulfilled') customers[result.value.id] = result.value.customerId
    }
  }
  return customers
}

function requestBudget(row) {
  const { budgetMin, budgetMax } = row
  if (budgetMin != null && budgetMax != null) {
    return budgetMin === budgetMax ? moneyVnd(budgetMin) : moneyVnd(budgetMin) + ' – ' + moneyVnd(budgetMax)
  }
  if (budgetMin != null) return 'Từ ' + moneyVnd(budgetMin)
  if (budgetMax != null) return 'Đến ' + moneyVnd(budgetMax)
  return '—'
}

const recordStatusLabels = { OPEN: 'Đang nhận báo giá', DRAFT: 'Bản nháp', OFFER_SELECTED: 'Đã chọn báo giá', PENDING: 'Chờ phản hồi', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', EXPIRED: 'Đã hết hạn', WITHDRAWN: 'Đã rút', CLOSED: 'Đã đóng', CANCELLED: 'Đã hủy', ACTIVE: 'Đang hoạt động', BLOCKED: 'Đã tạm ngưng', SUSPENDED: 'Đã tạm ngưng', DELETED: 'Đã xóa', COMPLETED: 'Đã thu', REFUNDED: 'Đã hoàn' }

function recordStatusLabel(tab, status) {
  if (tab === 'orders') return orderStatusLabel(status)
  if (tab === 'transactions' && status === 'PENDING') return 'Chờ thu'
  return recordStatusLabels[status] || 'Chưa rõ trạng thái'
}

const normalizeSearch = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('vi').replace(/đ/g, 'd')

function MetricGroup({ title, metrics, monetary }) {
  return <section className={'sc-business-kpi-group' + (monetary ? ' sc-business-kpi-group--money' : '')}>
    <h3>{title}</h3>
    <dl className="sc-business-totals">
      {metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd data-business-metric={label}>{value}</dd></div>)}
    </dl>
  </section>
}

export default function BusinessSimulationReport({ bakeryId = '', bakery, requestsOnly = false, loadHistory = false, dates, reportBakeryId, showRecords = true, showMetrics = !requestsOnly, activeTab, navigation }) {
  const { user, roles } = useAuth(), [, setRevision] = useState(0), [now, setNow] = useState(Date.now), [selectedShop, setShop] = useState(''), [draftFrom, setFrom] = useState(''), [draftTo, setTo] = useState(''), [selectedTab, setTab] = useState(requestsOnly ? 'requests' : 'orders'), [decision, setDecision] = useState(null), [note, setNote] = useState(''), [message, setMessage] = useState(''), [search, setSearch] = useState(''), [page, setPage] = useState(1), [condition, setCondition] = useState(''), [selection, setSelection] = useState(null), [addingRequest, setAddingRequest] = useState(false), [formError, setFormError] = useState(null)
  const { containerRef, pageSize } = useViewportPageSize(() => setPage(1), showRecords)
  const tab = activeTab ?? selectedTab
  const useOrderFilters = Boolean(activeTab || requestsOnly)
  const usesOwnerTable = useOrderFilters
  const isOrderTable = usesOwnerTable && tab === 'orders'
  const confirmFormId = useId()
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('desc')
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
  useCatalogResource(loadReportOffers, { bakeryId: ownerBakeryId })
  store?.reload()
  const unified = unifiedEnabled(), state = unified ? unifiedSnapshot() : store ? structuredClone(store.state) : null
  const requestIdsWithoutCustomers = requestsOnly && isAdmin && ['requests', 'offers'].includes(tab)
    ? (state?.requests || []).filter(row => !row.customerId && !row.customerName && recordSource(row) === 'api').map(row => row.id)
    : []
  const requestCustomers = useCatalogResource(loadRequestCustomerIds, { ids: requestIdsWithoutCustomers })
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
    userName(usersById.get(request?.customerId || requestCustomers.data?.[request?.id])) ||
    namesByRequest.get(request?.id) || namesByCustomer.get(request?.customerId)
  const customerOrders = new Map()
  if (tab === 'customers') {
    for (const order of scopedOrders) {
      const orders = customerOrders.get(order.customerId) || []
      orders.push(order)
      customerOrders.set(order.customerId, orders)
    }
  }

  const records = tab === 'requests'
    ? requests.filter(row => unified || isAdmin || row.status === 'OPEN' || sentRequestIds.has(row.id)).map(row => ({
      ...row, customerName: requestCustomerName(row), bakeryName: row.bakeryName || shopsById.get(row.targetBakeryId),
    }))
    : tab === 'transactions'
      ? state.salesPayments.filter(visible).map(row => {
        const order = ordersById.get(row.orderId)
        return { ...row, title: order?.orderNumber, customerName: order?.customerName, totalAmount: row.amount }
      })
      : tab === 'offers'
        ? state.offers.filter(visible).map(row => {
          const request = requestsById.get(row.cakeRequestId)
          return { ...row, title: request?.title, customerName: requestCustomerName(request) }
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
  const statuses = useOrderFilters ? [...new Set(matchingRecords.map(row => row.status).filter(Boolean))] : []
  const selectedStatus = statuses.includes(status) ? status : ''
  const filtered = selectedStatus ? matchingRecords.filter(row => row.status === selectedStatus) : matchingRecords
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
      <MetricGroup title="Tổng quan đơn hàng" metrics={[["Tổng đơn", metrics.orders], ["Đang xử lý", metrics.orders - metrics.byStatus.COMPLETED - metrics.byStatus.CANCELLED], ["Hoàn thành", metrics.byStatus.COMPLETED], ["Đã hủy", metrics.byStatus.CANCELLED], ["Đơn chờ thu", metrics.pendingCollections]]} />
      <MetricGroup title="Hoạt động & khách hàng" metrics={[["Yêu cầu bánh", metrics.rfqs], ["Báo giá", metrics.offers], ["Khách hàng", metrics.customers], ["Đánh giá", metrics.reviews], ["Chứng từ chờ duyệt", metrics.pendingPayments], ["Đã lên lịch", metrics.scheduled], ["Quá hạn giao", metrics.overdue], ["Đang xử lý phản ánh", metrics.disputed]]} />
      <MetricGroup title="Doanh thu & giá trị" monetary metrics={[[unified ? 'Doanh thu bán bánh mô phỏng' : 'Doanh thu bán bánh', moneyVnd(metrics.salesRevenue)], ['Giá trị đơn hàng', moneyVnd(metrics.orderValue)], [unified ? 'Doanh thu gói thực nhận' : 'Doanh thu gói dịch vụ', (metrics.subscriptionRevenue == null ? '—' : moneyVnd(metrics.subscriptionRevenue))], ...(unified ? [['Doanh thu gói mô phỏng', moneyVnd(metrics.simulationSubscriptionRevenue)]] : [])]} />
    </div>}</>}
    {showRecords && <>
    {useOrderFilters && <div className="sc-toolbar sc-vendor-order-filters">
      <div className={requestsOnly ? "sc-vendor-order-filter-row" : "sc-vendor-order-filter-row sc-vendor-order-filter-row--two"}>
        <label>Trạng thái<select className="sc-input" value={selectedStatus} onChange={changeFilter(setStatus)}>
          <option value="">Tất cả</option>
          {statuses.map(value => <option key={value} value={value}>{recordStatusLabel(tab, value)}</option>)}
        </select></label>
        {showOrderSource && <label>Nguồn đơn<select className="sc-input" value={orderSource} onChange={changeFilter(setOrderSource)}>
          <option value="">Tất cả</option>
          {ORDER_SOURCES.map(value => <option key={value} value={value}>{uiLabel(value)}</option>)}
        </select></label>}
        <label>Sắp xếp<select className="sc-input" value={sort} onChange={changeFilter(setSort)}>
          <option value="desc">Mới nhất</option><option value="asc">Cũ nhất</option>
        </select></label>
      </div>
      <div className={requestsOnly ? "sc-vendor-order-date-row sc-vendor-order-date-row--with-search" : "sc-vendor-order-date-row"}>
        <label>Tạo từ<input className="sc-input" type="date" value={from} onChange={changeFilter(setFrom)} aria-invalid={Boolean(invalidDates) || undefined} /></label>
        <label>Tạo đến<input className="sc-input" type="date" value={to} onChange={changeFilter(setTo)} aria-invalid={Boolean(invalidDates) || undefined} /></label>
        {requestsOnly && <label className="sc-vendor-order-search">Tìm theo tên hoặc mã<input className="sc-input" type="search" value={search} onChange={changeFilter(setSearch)} placeholder="Nhập tên hoặc một phần mã" /></label>}
      </div>
    </div>}
    {!activeTab && <div className="sc-business-table-toolbar">
      {!activeTab && <div className="sc-business-tabs">{[['orders', 'Đơn hàng'], ['requests', 'Yêu cầu bánh'], ['offers', 'Báo giá'], ['customers', 'Khách hàng'], ['transactions', 'Thu & hoàn']].map(([key, label]) => <button key={key} className={'sc-button sc-action-button--secondary' + (tab === key ? ' is-selected' : '')} aria-pressed={tab === key} onClick={() => { setTab(key); setStatus(''); setSearch(''); setCondition(''); setPage(1) }}>{label}</button>)}{isAdmin && tab === 'requests' && <button className="sc-button" onClick={() => { setFormError(null); setAddingRequest(true) }}>Thêm yêu cầu bánh</button>}</div>}
    {!requestsOnly && <div className="sc-business-filters">
    {tab === 'orders' && <label>Tình trạng bổ sung<select aria-label="Tình trạng bổ sung" value={condition} onChange={event => { setCondition(event.target.value); setPage(1) }}><option value="">Tất cả</option><option value="SCHEDULED">Đã lên lịch</option><option value="OVERDUE">Quá hạn giao</option><option value="DISPUTED">Đang xử lý phản ánh</option><option value="UNPAID">Hoàn tất chưa thu</option></select></label>}
    <label>Tìm trong sổ<input aria-label="Tìm trong sổ" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder="Mã đơn, khách hàng hoặc nội dung" /></label>
    </div>}</div>}
    {navigation}
    <DataTable label="Danh sách trong sổ kinh doanh" className={isOrderTable ? "sc-vendor-order-table" : usesOwnerTable ? "sc-vendor-order-table sc-vendor-related-table" : "sc-business-table"}>
      {isOrderTable && <colgroup><col style={{ width: '60px' }} />{[18, 19, 17, 14, 18, 14].map((width, index) => <col key={index} style={{ width: width + '%' }} />)}</colgroup>}
      <thead><tr>{usesOwnerTable && <th scope="col">STT</th>}<th>{isOrderTable ? 'Mã đơn' : 'Nội dung'}</th><th>{isOrderTable ? 'Khách hàng' : 'Khách hàng / tiệm'}</th><th>Trạng thái</th><th className={isOrderTable ? "sc-money" : "sc-business-value"}>{isOrderTable ? 'Tổng tiền' : tab === 'customers' ? 'Tổng giá trị đơn' : 'Giá trị'}</th>{isOrderTable && <th scope="col">Hẹn giao</th>}<th scope="col" className="sc-table-actions">Thao tác</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id}>{usesOwnerTable && <td data-label="STT">{(currentPage - 1) * pageSize + index + 1}</td>}<td>{isOrderTable ? <strong>{orderDisplayNumber(row)}</strong> : usesOwnerTable ? <strong>{row.orderNumber || (tab === 'requests' || tab === 'offers' ? requestTitleWithoutCustomer(row.title, row.customerName) : row.title) || row.name || row.displayName}</strong> : row.orderNumber || (tab === 'requests' || tab === 'offers' ? requestTitleWithoutCustomer(row.title, row.customerName) : row.title) || row.name || row.displayName}{!isOrderTable && <small className="block">{displayReference(row.id, tab === 'offers' ? 'OF' : 'SC')}</small>}</td><td>{row.customerName || row.name || (!isAdmin && shopsById.get(row.bakeryId)) || (tab === 'requests' || isOrderTable ? 'Chưa có tên khách hàng' : '—')}{(isAdmin || isOrderTable) && <small className="block">{row.shopNames?.join(', ') || row.bakeryName || shopsById.get(row.bakeryId)}</small>}</td><td>{usesOwnerTable && row.status ? <StatusBadge status={row.status} label={recordStatusLabel(tab, row.status)} /> : recordStatusLabel(tab, row.status)}{row.issueStatus === 'DISPUTED' && <small className="sc-business-order-tag">Đang xử lý phản ánh</small>}{row.status === 'CONFIRMED' && Date.parse(row.neededAt) > now && <small className="sc-business-order-tag">Đã lên lịch</small>}{row.neededAt && !['COMPLETED', 'CANCELLED'].includes(row.status) && Date.parse(row.neededAt) < now && <small className="sc-business-order-tag">Quá hạn giao</small>}</td><td className={"whitespace-nowrap font-semibold tabular-nums" + (isOrderTable ? "" : " sc-business-value")}>{isOrderTable ? formatOrderMoney(row.totalAmount, row.currency) : tab === 'requests' ? requestBudget(row) : tab === 'customers' ? ([...row.totals].map(([currency, total]) => formatOrderMoney(total, currency)).join(' · ') || '—') : row.totalAmount != null || row.totalPrice != null ? moneyVnd(row.totalAmount ?? row.totalPrice) : '—'}</td>{isOrderTable && <td>{formatOrderDate(row.neededAt)}</td>}<td className="sc-table-actions"><div className="sc-business-actions"><RecordActionButton className={usesOwnerTable ? "sc-button sc-vendor-view-order" : "sc-button sc-action-button--secondary"} aria-label="Xem chi tiết" onClick={() => setSelection({ kind: tab, id: row.id })} action="view" />{tab === 'requests' && isAdmin && recordSource(row) === 'local' && row.status === 'DRAFT' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('publishRequest', row)}>Mở nhận báo giá</button>}{tab === 'requests' && isAdmin && recordSource(row) === 'local' && ['DRAFT', 'OPEN'].includes(row.status) && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('cancelRequest', row)}>Hủy yêu cầu</button>}{tab === 'offers' && !isAdmin && roles.includes('BAKERY_OWNER') && recordSource(row) === 'local' && row.status === 'PENDING' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('rejectOffer', row)}>Từ chối báo giá</button>}{tab === 'offers' && !isAdmin && recordSource(row) === 'local' && row.status === 'PENDING' && Date.parse(row.expiresAt) > now && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('acceptOffer', row)}>Ghi nhận khách đồng ý</button>}{tab === 'orders' && recordSource(row) === 'local' && row.status === 'COMPLETED' && row.paymentStatus !== 'PAID' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('collect', row)}>Ghi nhận đã thu</button>}{recordSource(row) === 'local' && row.issueStatus === 'DISPUTED' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('resolve', row)}>Xử lý phản ánh</button>}</div></td></tr>)}</tbody></DataTable>{!rows.length && <p className="p-4">Không có bản ghi phù hợp.</p>}
    <CatalogPagination meta={{ page: currentPage, pages, total: filtered.length }} onPage={setPage} />
    {decision && <DetailDrawer title={({ acceptOffer: 'Xác nhận khách đồng ý báo giá', collect: 'Xác nhận đã thu đủ tiền', resolve: 'Kết quả xử lý phản ánh', publishRequest: 'Mở nhận báo giá', cancelRequest: 'Hủy yêu cầu', rejectOffer: 'Từ chối báo giá' })[decision.type]} busy={saving} onClose={() => setDecision(null)} className="sc-workspace-detail sc-workspace-confirm" footer={<div className="sc-business-actions"><button type="submit" form={confirmFormId} className="sc-button" disabled={saving}>{saving ? 'Đang lưu…' : 'Xác nhận cập nhật'}</button><button type="button" className="sc-button sc-action-button--secondary" disabled={saving} onClick={() => setDecision(null)}>Hủy</button></div>}><form id={confirmFormId} onSubmit={confirm} className="mt-4 space-y-3" aria-label="Xác nhận cập nhật sổ"><label>Ghi chú<textarea aria-label="Ghi chú cập nhật sổ" required={['resolve', 'cancelRequest', 'rejectOffer'].includes(decision.type)} className="block border rounded-lg p-2 w-full" value={note} onChange={event => setNote(event.target.value)} /></label>{message && <p role="alert" className="sc-business-feedback">{message}</p>}</form></DetailDrawer>}
    {addingRequest && <BusinessRequestForm customers={state.users.filter(person => person.roles.includes('CUSTOMER') && !person.roles.includes('BAKERY_OWNER') && person.status === 'ACTIVE')} error={formError} onClose={() => setAddingRequest(false)} onSave={async input => { try { await businessRequestChange('create', null, input, user); setAddingRequest(false); setSearch(input.title); setPage(1); setMessage('Đã lưu bản nháp yêu cầu.'); setRevision(value => value + 1) } catch (error) { setFormError(error.message) } }} />}
    <BusinessRecordDetail now={now} selection={selection} resolvedCustomer={usersById.get(requestCustomers.data?.[selection?.kind === 'offers' ? state.offers.find(offer => offer.id === selection.id)?.cakeRequestId : selection?.id])} state={state} isAdmin={isAdmin} bakeryId={scope} onClose={() => setSelection(null)} onAccept={offer => { setSelection(null); requestAction('acceptOffer', offer) }} />
    {message && !decision && <p role="status" className="sc-business-feedback">{message}</p>}
    </>}
  </section>
}
