import { DataTable } from '../common/WorkspaceUI.jsx'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { requestMatchesBakery } from '../../services/vendorRfqModels.js'
import { loadVendorRequests } from '../../services/vendorRfqService.js'
import { loadOffers } from '../../services/rfqService.js'
import { loadOrders } from '../../services/orderService.js'
import { publicationAdminService } from '../../services/publicationAdminService.js'
import { unifiedEnabled, unifiedSnapshot, unifiedMetrics, recordSource, canonicalBakeryId, localBakeryFor } from '../../services/unifiedDataService.js'
import BusinessRequestForm from './BusinessRequestForm.jsx'
import { businessRequestChange } from '../../mockData/business/requests.js'
import BusinessRecordDetail from './BusinessRecordDetail.jsx'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { simulationStore } from '../../mockData/business/runtime.js'
import { businessMetrics, businessDateSelected } from '../../mockData/business/metrics.js'
import { businessAction } from '../../mockData/business/actions.js'
import { orderStatusLabel } from '../../services/orderModels.js'
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

export default function BusinessSimulationReport({ bakeryId = '', bakery, requestsOnly = false, loadHistory = false, dates }) {
  const { user, roles } = useAuth(), [, setRevision] = useState(0), [now, setNow] = useState(Date.now), [selectedShop, setShop] = useState(''), [draftFrom, setFrom] = useState(''), [draftTo, setTo] = useState(''), [tab, setTab] = useState(requestsOnly ? 'requests' : 'orders'), [decision, setDecision] = useState(null), [note, setNote] = useState(''), [message, setMessage] = useState(''), [search, setSearch] = useState(''), [page, setPage] = useState(1), [condition, setCondition] = useState(''), [selection, setSelection] = useState(null), [addingRequest, setAddingRequest] = useState(false), [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { const update = () => { setRevision(value => value + 1); setNow(Date.now()) }; window.addEventListener('sweetcake:api-mutated', update); window.addEventListener('sweetcake:unified-updated', update); return () => { window.removeEventListener('sweetcake:api-mutated', update); window.removeEventListener('sweetcake:unified-updated', update) } }, [])
  const store = simulationStore(), isAdmin = roles.includes('ADMIN'), scope = canonicalBakeryId(isAdmin ? selectedShop : bakeryId)
  const shouldLoad = loadHistory && unifiedEnabled() && Boolean(isAdmin || bakeryId)
  useCatalogResource(loadReportOrders, { enabled: shouldLoad, scope: isAdmin ? 'all' : 'bakery', bakeryId: isAdmin ? undefined : scope })
  useCatalogResource(loadReportPayments, { enabled: shouldLoad && isAdmin })
  const ownerBakeryId = !isAdmin && unifiedEnabled() ? scope : undefined
  const eligibleRequests = useCatalogResource(loadReportRequests, { bakery: ownerBakeryId && bakery?.id === ownerBakeryId ? bakery : undefined })
  useCatalogResource(loadReportOffers, { bakeryId: ownerBakeryId })
  store?.reload()
  const unified = unifiedEnabled(), state = unified ? unifiedSnapshot() : store ? structuredClone(store.state) : null
  if (!state || !user || !isAdmin && !scope) return null
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
  const metrics = invalidDates ? null : (unified ? unifiedMetrics : businessMetrics)({ ...state, requests }, { bakeryId: scope, from, to })
  const visible = row => !scope || row.bakeryId === scope
  const records = tab === 'requests' ? requests.filter(row => unified || isAdmin || row.status === 'OPEN' || sentRequestIds.has(row.id)).map(row => ({ ...row, customerName: state.users.find(person => person.id === row.customerId)?.name })) : tab === 'transactions' ? state.salesPayments.filter(visible).map(row => ({ ...row, title: state.orders.find(order => order.id === row.orderId)?.orderNumber, customerName: state.orders.find(order => order.id === row.orderId)?.customerName, totalAmount: row.amount })) : tab === 'offers' ? state.offers.filter(visible).map(row => ({ ...row, title: state.requests.find(request => request.id === row.cakeRequestId)?.title })) : tab === 'customers' ? state.users.filter(person => state.orders.some(order => visible(order) && order.customerId === person.id)) : state.orders.filter(visible)
  const filtered = records.filter(row => businessDateSelected(row.createdAt, from, to) && (!condition || condition === 'DISPUTED' && row.issueStatus === 'DISPUTED' || condition === 'SCHEDULED' && row.status === 'CONFIRMED' && Date.parse(row.neededAt) > now || condition === 'OVERDUE' && row.neededAt && !['COMPLETED', 'CANCELLED'].includes(row.status) && Date.parse(row.neededAt) < now || condition === 'UNPAID' && row.status === 'COMPLETED' && row.paymentStatus !== 'PAID') && [row.title, row.name, row.orderNumber, row.customerName, row.status, orderStatusLabel(row.status)].join(' ').toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))), pages = Math.max(1, Math.ceil(filtered.length / 8)), currentPage = Math.min(page, pages), rows = filtered.slice((currentPage - 1) * 8, currentPage * 8)
  function requestAction(type, record) { setDecision({ type, id: record.id }); setNote(''); setMessage('') }
  async function confirm(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try { if (decision.type.endsWith('Request')) await businessRequestChange(decision.type === 'publishRequest' ? 'publish' : 'cancel', decision.id, { reason: note }, user); else await businessAction(decision.type, decision.id, user, note); setDecision(null); setMessage('Đã cập nhật sổ kinh doanh.'); setRevision(value => value + 1) }
    catch (error) { setMessage(error.message) }
    finally { setSaving(false) }
  }
  return <section className="sc-business-report" aria-label="Sổ kinh doanh liên thông">
    <h2 className="text-xl font-bold text-primary">{requestsOnly ? 'Yêu cầu và báo giá' : 'Sổ kinh doanh liên thông'}</h2>
    <div className="sc-business-filters">{isAdmin && <label>Phạm vi tiệm<select aria-label="Phạm vi tiệm" value={selectedShop} onChange={event => { setShop(event.target.value); setPage(1) }}><option value="">Toàn hệ thống</option>{state.bakeries.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}</select></label>}{!dates && <><label>Từ ngày<input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label><label>Đến ngày<input type="date" value={to} onChange={event => setTo(event.target.value)} /></label></>}</div>
    {invalidDates ? <p role="alert">Ngày bắt đầu phải trước ngày kết thúc.</p> : <><p className="text-sm">{scope ? state.bakeries.find(shop => shop.id === scope)?.name : 'Toàn hệ thống'} · {from || to ? 'Đơn theo ngày tạo · doanh thu theo ngày ghi nhận' : 'Tất cả thời gian'}</p><div className="sc-business-totals">{[['Tổng đơn', metrics.orders], ['Đang xử lý', metrics.orders - metrics.byStatus.COMPLETED - metrics.byStatus.CANCELLED], ['Hoàn thành', metrics.byStatus.COMPLETED], ['Đã hủy', metrics.byStatus.CANCELLED], [unified ? 'Doanh thu bán bánh mô phỏng' : 'Doanh thu bán bánh', moneyVnd(metrics.salesRevenue)], ['Giá trị đơn hàng', moneyVnd(metrics.orderValue)], [unified ? 'Doanh thu gói thực nhận' : 'Doanh thu gói dịch vụ', (metrics.subscriptionRevenue == null ? '—' : moneyVnd(metrics.subscriptionRevenue))], ...(unified ? [['Doanh thu gói mô phỏng', moneyVnd(metrics.simulationSubscriptionRevenue)], ['Đơn trình duyệt', metrics.localOrders]] : []), ['Chứng từ chờ duyệt', metrics.pendingPayments], ['Yêu cầu bánh', metrics.rfqs], ['Báo giá', metrics.offers], ['Khách hàng', metrics.customers], ['Đánh giá', metrics.reviews], ['Đã lên lịch', metrics.scheduled], ['Quá hạn giao', metrics.overdue], ['Đang xử lý phản ánh', metrics.disputed], ['Đơn chờ thu', metrics.pendingCollections]].map(([label, value]) => <article key={label}><p>{label}</p><strong data-business-metric={label}>{value}</strong></article>)}</div><p className="text-xs">Doanh thu mô phỏng được ghi riêng, không phải tiền thực nhận. Gói dịch vụ thực nhận chỉ tính chứng từ API đã phê duyệt. Giá trị đơn hàng gồm các trạng thái khác.</p></>}
    {isAdmin && tab === 'requests' && <button className="sc-button mt-4" onClick={() => { setFormError(null); setAddingRequest(true) }}>Thêm yêu cầu bánh</button>}<div className="sc-business-tabs">{[['orders', 'Đơn hàng'], ['requests', 'Yêu cầu bánh'], ['offers', 'Báo giá'], ['customers', 'Khách hàng'], ['transactions', 'Thu & hoàn']].map(([key, label]) => <button key={key} className="sc-button sc-action-button--secondary" aria-pressed={tab === key} onClick={() => { setTab(key); setSearch(''); setCondition(''); setPage(1) }}>{label}</button>)}</div>
    <label className="sc-business-filters">Tìm trong sổ<input aria-label="Tìm trong sổ" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder="Mã đơn, khách hàng hoặc nội dung" /></label>
    {tab === 'orders' && <label className="sc-business-filters">Tình trạng bổ sung<select aria-label="Tình trạng bổ sung" value={condition} onChange={event => { setCondition(event.target.value); setPage(1) }}><option value="">Tất cả</option><option value="SCHEDULED">Đã lên lịch</option><option value="OVERDUE">Quá hạn giao</option><option value="DISPUTED">Đang xử lý phản ánh</option><option value="UNPAID">Hoàn tất chưa thu</option></select></label>}
    <DataTable label="Danh sách trong sổ kinh doanh" className="sc-business-table"><thead><tr><th>Nội dung</th><th>Khách hàng / tiệm</th><th>Trạng thái</th><th className="sc-money">Giá trị</th><th scope="col" className="sc-table-actions">Thao tác</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.orderNumber || row.title || row.name}<small className="block">{recordSource(row) === 'local' ? 'Trình duyệt' : 'API'}</small><small className="block">{displayReference(row.id, tab === 'offers' ? 'OF' : 'SC')}</small></td><td>{row.customerName || row.name || state.bakeries.find(shop => shop.id === row.bakeryId)?.name}</td><td>{tab === 'orders' ? orderStatusLabel(row.status) : ({ OPEN: 'Đang nhận báo giá', DRAFT: 'Bản nháp', OFFER_SELECTED: 'Đã chọn báo giá', PENDING: 'Chờ phản hồi', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', EXPIRED: 'Đã hết hạn', WITHDRAWN: 'Đã rút', CLOSED: 'Đã đóng', CANCELLED: 'Đã hủy', ACTIVE: 'Đang hoạt động', BLOCKED: 'Đã tạm ngưng', COMPLETED: 'Đã thu', REFUNDED: 'Đã hoàn' }[row.status] || row.status)}{row.issueStatus === 'DISPUTED' && <small className="sc-business-order-tag">Đang xử lý phản ánh</small>}{row.status === 'CONFIRMED' && Date.parse(row.neededAt) > now && <small className="sc-business-order-tag">Đã lên lịch</small>}{row.neededAt && !['COMPLETED', 'CANCELLED'].includes(row.status) && Date.parse(row.neededAt) < now && <small className="sc-business-order-tag">Quá hạn giao</small>}</td><td className="whitespace-nowrap font-semibold tabular-nums">{row.totalAmount != null || row.totalPrice != null ? moneyVnd(row.totalAmount ?? row.totalPrice) : '—'}</td><td className="sc-table-actions"><div className="sc-business-actions"><button className="sc-button sc-action-button--secondary" onClick={() => setSelection({ kind: tab, id: row.id })}>Xem chi tiết</button>{tab === 'requests' && isAdmin && recordSource(row) === 'local' && row.status === 'DRAFT' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('publishRequest', row)}>Mở nhận báo giá</button>}{tab === 'requests' && isAdmin && recordSource(row) === 'local' && ['DRAFT', 'OPEN'].includes(row.status) && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('cancelRequest', row)}>Hủy yêu cầu</button>}{tab === 'offers' && isAdmin && recordSource(row) === 'local' && row.status === 'PENDING' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('rejectOffer', row)}>Từ chối báo giá</button>}{tab === 'offers' && recordSource(row) === 'local' && row.status === 'PENDING' && Date.parse(row.expiresAt) > now && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('acceptOffer', row)}>Ghi nhận khách đồng ý</button>}{tab === 'orders' && recordSource(row) === 'local' && row.status === 'COMPLETED' && row.paymentStatus !== 'PAID' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('collect', row)}>Ghi nhận đã thu</button>}{recordSource(row) === 'local' && row.issueStatus === 'DISPUTED' && <button className="sc-button sc-action-button--secondary" onClick={() => requestAction('resolve', row)}>Xử lý phản ánh</button>}</div></td></tr>)}</tbody></DataTable>{!rows.length && <p className="p-4">Không có bản ghi phù hợp.</p>}
    <div className="sc-business-actions mt-4"><button className="sc-button sc-action-button--secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Trang trước</button><span>Trang {currentPage}/{pages} · {filtered.length} bản ghi</span><button className="sc-button sc-action-button--secondary" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Trang sau</button></div>
    {decision && <form onSubmit={confirm} className="mt-4 space-y-3" aria-label="Xác nhận cập nhật sổ"><h3 className="font-bold">{({ acceptOffer: 'Xác nhận khách đồng ý báo giá', collect: 'Xác nhận đã thu đủ tiền', resolve: 'Kết quả xử lý phản ánh', publishRequest: 'Mở nhận báo giá', cancelRequest: 'Hủy yêu cầu', rejectOffer: 'Từ chối báo giá' })[decision.type]}</h3><label>Ghi chú<textarea aria-label="Ghi chú cập nhật sổ" required={['resolve', 'cancelRequest', 'rejectOffer'].includes(decision.type)} className="block border rounded-lg p-2 w-full" value={note} onChange={event => setNote(event.target.value)} /></label><div className="sc-business-actions"><button className="sc-button" disabled={saving}>{saving ? 'Đang lưu…' : 'Xác nhận cập nhật'}</button><button type="button" className="sc-button sc-action-button--secondary" disabled={saving} onClick={() => setDecision(null)}>Hủy</button></div></form>}
    {addingRequest && <BusinessRequestForm customers={state.users.filter(person => person.roles.includes('CUSTOMER') && !person.roles.includes('BAKERY_OWNER') && person.status === 'ACTIVE')} error={formError} onClose={() => setAddingRequest(false)} onSave={async input => { try { await businessRequestChange('create', null, input, user); setAddingRequest(false); setSearch(input.title); setPage(1); setMessage('Đã lưu bản nháp yêu cầu.'); setRevision(value => value + 1) } catch (error) { setFormError(error.message) } }} />}
    <BusinessRecordDetail now={now} selection={selection} state={state} isAdmin={isAdmin} bakeryId={scope} onClose={() => setSelection(null)} onAccept={offer => { setSelection(null); requestAction('acceptOffer', offer) }} />
    {message && <p role="status" className="sc-business-feedback">{message}</p>}
  </section>
}
