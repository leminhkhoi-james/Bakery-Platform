import React, { useState } from 'react'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadVendorOrders, vendorOrderError } from '../../../services/vendorOrderPresentation.js'
import { ORDER_STATUSES, ORDER_SOURCES, orderStatusLabel } from '../../../services/orderModels.js'
import { formatOrderDate, formatOrderMoney, orderDisplayNumber } from '../../../services/orderPresentation.js'
import { cleanPresentationLabel, uiLabel } from '../../../services/uiLabels.js'
import { OrderDetail } from '../../../components/orders/OrderViews.jsx'
import { DataTable, EmptyPanel, Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'

export function VendorOrderError({ resource }) {
  return <div className="sc-vendor-order-error" role="alert"><Icon name={resource.error?.status === 403 ? 'lock' : 'info'} /><p>{vendorOrderError(resource.error)}</p>{![400, 401].includes(resource.error?.status) && <RefreshButton onClick={resource.reload}>Thử lại</RefreshButton>}</div>
}

export default function VendorOrderList({ bakeryId, initialOrderId = '' }) {
  const [filters, setFilters] = useState({ page: 1, status: '', orderSource: '', sort: 'createdAt,desc', from: '', to: '' })
  const [orderId, setOrderId] = useState(initialOrderId)
  const resource = useCatalogResource(loadVendorOrders, { bakeryId, size: 10, ...filters })
  const change = (key) => (event) => setFilters((current) => ({ ...current, page: 1, [key]: event.target.value }))
  const loading = resource.status === 'loading' || resource.refreshing
  const badRange = Boolean(filters.from && filters.to && filters.from > filters.to)
  return <section className="sc-panel sc-vendor-order-list">
    <div className="sc-toolbar sc-vendor-order-filters">
      <div className="sc-vendor-order-filter-row">
        <label>Trạng thái<select className="sc-input" value={filters.status} onChange={change('status')}><option value="">Tất cả</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}</select></label>
        <label>Nguồn đơn<select className="sc-input" value={filters.orderSource} onChange={change('orderSource')}><option value="">Tất cả</option>{ORDER_SOURCES.map((source) => <option key={source} value={source}>{uiLabel(source)}</option>)}</select></label>
        <label>Sắp xếp<select className="sc-input" value={filters.sort} onChange={change('sort')}><option value="createdAt,desc">Mới nhất</option><option value="createdAt,asc">Cũ nhất</option><option value="neededAt,asc">Ngày cần giao tăng dần</option><option value="totalAmount,desc">Tổng tiền giảm dần</option></select></label>
      </div>
      <div className="sc-vendor-order-date-row"><label>Tạo từ<input className="sc-input" type="date" value={filters.from} onChange={change('from')} aria-invalid={badRange || undefined} /></label><label>Tạo đến<input className="sc-input" type="date" value={filters.to} onChange={change('to')} aria-invalid={badRange || undefined} /></label><RefreshButton disabled={loading} onClick={resource.reload}>Tải lại</RefreshButton></div>
    </div>
    {loading ? <div className="sc-vendor-order-loading" role="status" aria-live="polite"><p>Đang tải đơn hàng…</p><div aria-hidden="true" /></div> : resource.error ? <VendorOrderError resource={resource} /> : resource.data && <>
      {resource.data.result.length ? <DataTable label="Đơn hàng của cửa hàng" className="sc-vendor-order-table"><colgroup>{[18, 19, 17, 14, 18, 14].map((width, index) => <col key={index} style={{ width: width + '%' }} />)}</colgroup><thead><tr><th scope="col">Mã đơn</th><th scope="col">Khách hàng</th><th scope="col">Trạng thái</th><th scope="col">Tổng tiền</th><th scope="col">Hẹn giao</th><th scope="col">Thao tác</th></tr></thead><tbody>{resource.data.result.map((order) => <tr key={order.id}><td><strong>{orderDisplayNumber(order)}</strong></td><td>{cleanPresentationLabel(order.customerName, 'Xem trong chi tiết')}</td><td><StatusBadge status={order.status} label={orderStatusLabel(order.status)} /></td><td className="sc-vendor-order-money">{formatOrderMoney(order.totalAmount, order.currency)}</td><td>{formatOrderDate(order.neededAt)}</td><td className="sc-vendor-order-actions"><button type="button" className="sc-button sc-vendor-view-order" onClick={() => setOrderId(order.id)}><Icon name="visibility" />Xem chi tiết</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Chưa có đơn hàng phù hợp" description={filters.status || filters.orderSource || filters.from || filters.to ? 'Thử thay đổi bộ lọc để xem các đơn hàng khác.' : 'Đơn mới của cửa hàng sẽ xuất hiện tại đây.'} icon="shopping_bag" />}
      <CatalogPagination meta={resource.data.meta} onPage={(page) => setFilters((current) => ({ ...current, page }))} />
    </>}
    {orderId && !resource.error && <OrderDetail key={orderId} orderId={orderId} scope="bakery" bakeryId={bakeryId} onChanged={resource.reload} onClose={() => setOrderId('')} />}
  </section>
}
