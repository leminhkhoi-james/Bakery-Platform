import { recordSource } from '../../../services/unifiedDataService.js'
import { businessAction } from '../../../mockData/business/actions.js'
import { VendorConfirm } from '../../../components/common/VendorUi.jsx'
import { ApiErrorMessage } from '../../../components/management/ApiState.jsx'
import RecordActionButton from '../../../components/common/RecordActionButton.jsx'
import { useViewportPageSize } from '../../../hooks/useViewportPageSize.js'
import React, { useState } from 'react'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadVendorOrders, orderDeliveryArea, vendorOrderError, vendorOrderSourceLabels } from '../../../services/vendorOrderPresentation.js'
import { ORDER_STATUSES, ORDER_SOURCES, orderStatusLabel } from '../../../services/orderModels.js'
import { formatOrderDate, formatOrderMoney, orderDisplayNumber } from '../../../services/orderPresentation.js'
import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import { OrderDetail } from '../../../components/orders/OrderViews.jsx'
import { DataTable, EmptyPanel, Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'

const collectionLabels = { PAID: 'Đã thu', REFUNDED: 'Đã hoàn', CANCELLED: 'Đã hủy thu' }

export function VendorOrderError({ resource }) {
  return <div className="sc-vendor-order-error" role="alert"><Icon name={resource.error?.status === 403 ? 'lock' : 'info'} /><p>{vendorOrderError(resource.error)}</p>{![400, 401].includes(resource.error?.status) && <RefreshButton onClick={resource.reload}>Thử lại</RefreshButton>}</div>
}

export default function VendorOrderList({ bakeryId, initialOrderId = '', embedded = false, navigation, actor }) {
  const [collecting, setCollecting] = useState(null), [collectBusy, setCollectBusy] = useState(false), [collectError, setCollectError] = useState(null)
  const [filters, setFilters] = useState({ page: 1, status: '', orderSource: '', sort: 'createdAt,desc', from: '', to: '', search: '', address: '' })
  const [orderId, setOrderId] = useState(initialOrderId)
  const { containerRef, pageSize } = useViewportPageSize(() => setFilters(current => ({ ...current, page: 1 })))
  const resource = useCatalogResource(loadVendorOrders, { bakeryId, size: pageSize, ...filters })
  const change = (key) => (event) => setFilters((current) => ({ ...current, page: 1, [key]: event.target.value }))
  const loading = resource.status === 'loading' || resource.refreshing
  const badRange = Boolean(filters.from && filters.to && filters.from > filters.to)
  return <section ref={containerRef} className={embedded ? "sc-vendor-order-list sc-vendor-order-list--embedded" : "sc-panel sc-vendor-order-list"}>
    <div className="sc-toolbar sc-vendor-order-filters">
      <div className="sc-vendor-order-filter-row sc-vendor-order-filter-row--address">
        <label className="sc-vendor-order-search">Tìm tên hoặc mã đơn<input className="sc-input" type="search" value={filters.search} onChange={change('search')} placeholder="Nhập tên hoặc một phần mã" /></label>
        <label>Địa chỉ giao<input className="sc-input" type="search" value={filters.address} onChange={change('address')} placeholder="Nhập địa chỉ hoặc khu vực" /></label>
        <label>Trạng thái<select className="sc-input" value={filters.status} onChange={change('status')}><option value="">Tất cả</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}</select></label>
        <label>Nguồn đơn<select className="sc-input" value={filters.orderSource} onChange={change('orderSource')}><option value="">Tất cả</option>{ORDER_SOURCES.map((source) => <option key={source} value={source}>{vendorOrderSourceLabels[source]}</option>)}</select></label>
      </div>
      <div className="sc-vendor-order-date-row"><label>Tạo từ<input className="sc-input" type="date" value={filters.from} onChange={change('from')} aria-invalid={badRange || undefined} /></label><label>Tạo đến<input className="sc-input" type="date" value={filters.to} onChange={change('to')} aria-invalid={badRange || undefined} /></label></div>
    </div>
    {navigation}
    {loading ? <div className="sc-vendor-order-loading" role="status" aria-live="polite"><p>Đang tải đơn hàng…</p><div aria-hidden="true" /></div> : resource.error ? <VendorOrderError resource={resource} /> : resource.data && <>
      {resource.data.result.length ? <DataTable label="Đơn hàng của cửa hàng" className="sc-vendor-order-table sc-vendor-expanded-orders">
        <colgroup>
          {['number', 'cake', 'customer', 'area', 'status', 'source', 'budget', 'total', 'date', 'action'].map(column =>
            <col key={column} className={'sc-vendor-order-col--' + column} />)}
        </colgroup>
        <thead><tr>
          {['STT', 'Nội dung bánh', 'Khách hàng', 'Khu vực giao', 'Trạng thái', 'Nguồn đơn', 'Ngân sách', 'Tổng tiền', 'Hẹn giao', 'Thao tác'].map(label =>
            <th key={label} scope="col">{label}</th>)}
        </tr></thead>
        <tbody>{resource.data.result.map((order, index) => {
          const cakes = order.items?.filter(item => item.itemType !== 'ADD_ON' && item.name) || []
          const budget = [...new Set([order.budgetMin, order.budgetMax].filter(value => value != null))]
          return <tr key={order.id}>
            <td>{(resource.data.meta.page - 1) * (resource.data.meta.pageSize || pageSize) + index + 1}</td>
            <td>
              {cakes.length ? <ul>{cakes.map(item => <li key={item.id}><strong>{item.quantity ? item.quantity + ' × ' : ''}{item.name}</strong></li>)}</ul> : '—'}
              <small className="sc-vendor-order-code">{orderDisplayNumber(order)}</small>
            </td>
            <td><div className="sc-vendor-order-customer">
              <span>{cleanPresentationLabel(order.customerName, order.customerLookupFailed ? 'Chưa tải được tên' : 'Chưa có tên khách hàng')}</span>
              {order.customerPhone && <small>SĐT: {order.customerPhone}</small>}
            </div></td>
            <td>{orderDeliveryArea(order) || '—'}</td>
            <td>
              <StatusBadge status={order.status} label={orderStatusLabel(order.status)} />
              {collectionLabels[order.paymentStatus] && <small className="sc-order-collection block mt-1">{collectionLabels[order.paymentStatus]}{recordSource(order) === 'local' && ' · Mô phỏng'}</small>}
              {order.review?.rating && <span className="block text-xs mt-1">★ {order.review.rating}/5</span>}
            </td>
            <td>{vendorOrderSourceLabels[order.orderSource] || 'Chưa có thông tin'}</td>
            <td>{budget.length ? budget.map(value => formatOrderMoney(value, order.currency)).join(' – ') : '—'}</td>
            <td className="sc-vendor-order-money">{formatOrderMoney(order.totalAmount, order.currency)}</td>
            <td>{formatOrderDate(order.neededAt)}</td>
            <td className="sc-vendor-order-actions">
              <RecordActionButton type="button" className="sc-button sc-vendor-view-order" aria-label="Xem chi tiết đơn hàng" onClick={() => setOrderId(order.id)} action="view" />
              {actor && recordSource(order) === 'local' && order.status === 'COMPLETED' && order.paymentStatus === 'UNPAID' && <button type="button" className="sc-button sc-action-button--secondary" onClick={() => { setCollectError(null); setCollecting(order.id) }}>Ghi nhận đã thu</button>}
            </td>
          </tr>
        })}</tbody>
      </DataTable> : <EmptyPanel title="Chưa có đơn hàng phù hợp" description={filters.status || filters.orderSource || filters.from || filters.to || filters.address || filters.search ? 'Thử thay đổi bộ lọc để xem các đơn hàng khác.' : 'Đơn mới của cửa hàng sẽ xuất hiện tại đây.'} icon="shopping_bag" />}
      {resource.data.customerLookupIncomplete && <p role="status">Một số tên khách chưa tải được nên kết quả tìm kiếm có thể chưa đầy đủ.</p>}
      <CatalogPagination meta={resource.data.meta} onPage={(page) => setFilters((current) => ({ ...current, page }))} />
    </>}
    {collecting && <VendorConfirm title="Xác nhận đã thu tiền" label="Ghi nhận đã thu" busy={collectBusy}
      error={collectError && <ApiErrorMessage error={collectError} />} onClose={() => setCollecting(null)}
      onConfirm={async () => {
        setCollectBusy(true); setCollectError(null)
        try { await businessAction('collect', collecting, actor); setCollecting(null); resource.reload() }
        catch (error) { setCollectError(error) }
        finally { setCollectBusy(false) }
      }}><p>Xác nhận ghi nhận khoản thu của đơn này.</p></VendorConfirm>}
    {orderId && !resource.error && <OrderDetail key={orderId} orderId={orderId} scope="bakery" bakeryId={bakeryId} onChanged={resource.reload} onClose={() => setOrderId('')} />}
  </section>
}
