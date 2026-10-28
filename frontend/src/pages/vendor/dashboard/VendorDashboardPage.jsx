import { displayReference } from '../../../services/displayReference.js'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import React from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadManagedProducts } from '../../../services/vendorManagementService.js'
import { loadOrders } from '../../../services/orderService.js'
import { dateTime, money } from '../../../services/managementModels.js'
import { orderStatusLabel } from '../../../services/orderModels.js'
import { ApiState, panelClass, buttonClass } from '../../../components/management/ApiState.jsx'
import { DataTable, EmptyPanel, Icon, SectionHeading, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'

function DashboardData({ bakeryId, onNavigate }) {
  const products = useCatalogResource(loadManagedProducts, { bakeryId, page: 1, size: 1 })
  const orders = useCatalogResource(loadOrders, { scope: 'bakery', bakeryId, page: 1, size: 5, sort: 'createdAt,desc' })
  return <>
    <div className="grid gap-4 md:grid-cols-3">
      <section className={panelClass + ' sc-metric'}><div><h2>Sản phẩm của cửa hàng</h2><ApiState resource={products}>{products.data && <p className="sc-metric-value">{products.data.meta.total}</p>}</ApiState><button className="mt-3 text-xs font-semibold text-primary underline" onClick={() => onNavigate('vendor-menu?bakeryId=' + bakeryId)}>Quản lý sản phẩm</button></div><span className="sc-metric-icon"><Icon name="cake" /></span></section>
      <section className={panelClass + ' sc-metric'}><div><h2>Tổng số đơn hàng</h2><ApiState resource={orders}>{orders.data && <p className="sc-metric-value">{orders.data.meta.total}</p>}</ApiState><p className="mt-3 text-xs text-on-surface-variant">Tất cả trạng thái theo quyền truy cập.</p></div><span className="sc-metric-icon"><Icon name="shopping_bag" /></span></section>
      <section className={panelClass}><h2 className="font-semibold text-primary">Công việc của tiệm</h2><div className="grid gap-2"><button className="flex items-center justify-between rounded-lg bg-surface-container-low p-3 text-sm" onClick={() => onNavigate('vendor-rfq?bakeryId=' + bakeryId)}>Yêu cầu bánh & báo giá <Icon name="arrow_forward" /></button><button className="flex items-center justify-between rounded-lg bg-surface-container-low p-3 text-sm" onClick={() => onNavigate('vendor-subscription?bakeryId=' + bakeryId)}>Gói dịch vụ <Icon name="arrow_forward" /></button></div></section>
    </div>
    <section className={panelClass}><SectionHeading title="Đơn hàng gần đây" description="Các đơn mới nhất thuộc cửa hàng đang xem." icon="receipt_long" action={<RefreshButton className="text-xs underline" onClick={orders.reload}>Tải lại</RefreshButton>} />
      <ApiState resource={orders}>{orders.data && (orders.data.result.length ? <DataTable label="Đơn hàng gần đây"><thead><tr><th>Đơn hàng</th><th>Trạng thái</th><th>Tổng tiền</th><th>Ngày tạo</th><th className="sc-table-actions" scope="col">Thao tác</th></tr></thead><tbody>{orders.data.result.map((order) => <tr key={order.id}><td className="break-all font-semibold text-primary">{displayReference(order.id, 'ORD', order.orderNumber)}</td><td><StatusBadge status={order.status} label={orderStatusLabel(order.status)} /></td><td className="whitespace-nowrap tabular-nums">{money(order.totalAmount, order.currency)}</td><td>{dateTime(order.createdAt)}</td><td className="sc-table-actions"><button className="sc-table-action-link font-semibold text-primary underline" onClick={() => onNavigate('vendor-orders?bakeryId=' + bakeryId + '&orderId=' + order.id)}>Xem đơn</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Chưa có đơn hàng." description="Đơn mới của cửa hàng sẽ được hiển thị tại đây." icon="shopping_bag" />)}</ApiState>
      <button className={buttonClass} onClick={() => onNavigate('vendor-orders?bakeryId=' + bakeryId)}>Xem tất cả đơn <Icon name="arrow_forward" /></button>
    </section>
    <details className="sc-note"><summary className="cursor-pointer font-semibold">Doanh thu và thanh toán</summary><p className="mt-2">Tổng giá trị đơn hàng gồm cả những khoản chưa thanh toán. Doanh thu chỉ được ghi nhận sau khi đối soát.</p></details>
  </>
}

export default function VendorDashboardPage({ onNavigate, routeSearch }) {
  const { bakeryId, selectBakery } = useVendorBakery(routeSearch)
  return <VendorFrame title="Tổng quan cửa hàng" activeTab="dashboard" bakeryId={bakeryId} onNavigate={onNavigate}><BakerySelector bakeryId={bakeryId} onSelect={selectBakery} />{bakeryId ? <DashboardData key={bakeryId} bakeryId={bakeryId} onNavigate={onNavigate} /> : <section className={panelClass}><EmptyPanel title="Chọn cửa hàng để bắt đầu" description="Xem sản phẩm, đơn hàng và các công việc của tiệm bằng mã cửa hàng thật." icon="storefront" action={<button className={buttonClass} onClick={() => onNavigate('vendor-settings')}>Hồ sơ cửa hàng</button>} /></section>}</VendorFrame>
}
