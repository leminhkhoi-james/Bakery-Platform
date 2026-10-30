import React from 'react'
import { displayReference } from '../../../services/displayReference.js'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadManagedProducts } from '../../../services/vendorManagementService.js'
import { loadDashboardAccess, dashboardErrorMessage } from '../../../services/vendorDashboardService.js'
import { loadOrders } from '../../../services/orderService.js'
import { formatOrderDate, formatOrderMoney } from '../../../services/orderPresentation.js'
import { orderStatusLabel } from '../../../services/orderModels.js'
import { DataTable, EmptyPanel, Icon, SectionHeading, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import './vendor-dashboard.css'

function DashboardError({ resources }) {
  const failed = resources.filter((resource) => resource.error)
  if (!failed.length) return null
  const error = failed.find((resource) => resource.error.status === 401)?.error || failed[0].error
  return <div className="sc-vendor-dashboard-error" role="alert"><Icon name={error.status === 403 ? 'lock' : 'info'} /><p>{dashboardErrorMessage(error)}</p>{error.status !== 401 && <RefreshButton disabled={failed.some((resource) => resource.refreshing)} onClick={() => failed.forEach((resource) => resource.reload())}>Thử lại</RefreshButton>}</div>
}

function Metric({ title, icon, resource, onClick, link }) {
  return <section className="sc-panel sc-vendor-kpi"><span className="sc-vendor-kpi-icon"><Icon name={icon} /></span><div><h2>{title}</h2>
    {resource.status === 'loading' || resource.refreshing ? <p className="sc-vendor-kpi-loading" role="status">Đang tải…</p> : resource.error ? <><strong className="sc-vendor-kpi-value">—</strong><p className="sc-vendor-kpi-caption">{resource.error.status === 403 ? 'Chưa có quyền truy cập' : 'Chưa tải được số liệu'}</p></> : <strong className="sc-vendor-kpi-value">{resource.data.meta.total.toLocaleString('vi-VN')}</strong>}
    <button className="sc-vendor-text-link" onClick={onClick}>{link}<Icon name="arrow_forward" /></button></div></section>
}

export function DashboardOverview({ bakeryId, products, orders, onNavigate }) {
  const navigate = (page) => onNavigate(page + '?bakeryId=' + encodeURIComponent(bakeryId))
  return <>
    <DashboardError resources={[products, orders]} />
    <div className="sc-vendor-kpis">
      <Metric title="Sản phẩm" icon="cake" resource={products} onClick={() => navigate('vendor-menu')} link="Quản lý sản phẩm" />
      <Metric title="Tổng đơn hàng" icon="shopping_bag" resource={orders} onClick={() => navigate('vendor-orders')} link="Quản lý đơn hàng" />
      <section className="sc-panel sc-vendor-kpi"><span className="sc-vendor-kpi-icon"><Icon name="account_balance_wallet" /></span><div><h2>Doanh thu</h2><strong className="sc-vendor-kpi-value">—</strong><p className="sc-vendor-kpi-caption">Chưa có số liệu đã đối soát</p><button className="sc-vendor-text-link" onClick={() => navigate('vendor-revenue')}>Xem doanh thu<Icon name="arrow_forward" /></button></div></section>
    </div>
    <section className="sc-panel sc-vendor-recent"><SectionHeading title="Đơn hàng gần đây" icon="receipt_long" action={<RefreshButton disabled={orders.status === 'loading' || orders.refreshing} onClick={orders.reload}>Tải lại</RefreshButton>} />
      {orders.status === 'loading' || orders.refreshing ? <p role="status" className="sc-vendor-table-state">Đang tải đơn hàng…</p> : orders.error ? <p className="sc-vendor-table-state">{orders.error.status === 403 ? 'Chưa có quyền xem đơn hàng của cửa hàng này.' : 'Chưa tải được danh sách đơn hàng.'}</p> : orders.data?.result.length ? <DataTable label="Đơn hàng gần đây" className="sc-vendor-orders-table"><colgroup>{Array.from({ length: 5 }, (_, i) => <col key={i} />)}</colgroup><thead><tr><th scope="col">Đơn hàng</th><th scope="col">Trạng thái</th><th scope="col">Tổng tiền</th><th scope="col">Ngày tạo</th><th scope="col">Chi tiết</th></tr></thead><tbody>{orders.data.result.map((order) => <tr key={order.id}><td>{displayReference(order.id, 'ORD', order.orderNumber)}</td><td><StatusBadge status={order.status} label={orderStatusLabel(order.status)} /></td><td className="tabular-nums">{formatOrderMoney(order.totalAmount, order.currency)}</td><td>{formatOrderDate(order.createdAt)}</td><td><button className="sc-button sc-button--secondary" onClick={() => onNavigate('vendor-orders?bakeryId=' + encodeURIComponent(bakeryId) + '&orderId=' + encodeURIComponent(order.id))}>Xem đơn</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Chưa có đơn hàng" description="Đơn mới của cửa hàng sẽ xuất hiện tại đây." icon="shopping_bag" />}
    </section>
  </>
}

function DashboardData({ bakeryId, onNavigate }) {
  const products = useCatalogResource(loadManagedProducts, { bakeryId, page: 1, size: 1 })
  const orders = useCatalogResource(loadOrders, { scope: 'bakery', bakeryId, page: 1, size: 5, sort: 'createdAt,desc' })
  return <DashboardOverview bakeryId={bakeryId} products={products} orders={orders} onNavigate={onNavigate} />
}

function VerifiedDashboard({ bakeryId, userId, onNavigate }) {
  const access = useCatalogResource(loadDashboardAccess, { bakeryId, userId })
  if (access.status === 'loading') return <section className="sc-panel sc-vendor-access" role="status">Đang xác minh quyền quản lý cửa hàng…</section>
  if (access.error) return <DashboardError resources={[access]} />
  return <DashboardData bakeryId={bakeryId} onNavigate={onNavigate} />
}

export default function VendorDashboardPage({ onNavigate, routeSearch }) {
  const { bakeryId, selectBakery, user, available } = useVendorBakery(routeSearch)
  return <VendorFrame title="Tổng quan cửa hàng" activeTab="dashboard" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-vendor-dashboard"><BakerySelector bakeryId={bakeryId} onSelect={selectBakery} available={available} />{bakeryId ? <VerifiedDashboard key={user.id + ':' + bakeryId} bakeryId={bakeryId} userId={user.id} onNavigate={onNavigate} /> : available.status === 'loading' ? <p role="status">Đang tải cửa hàng…</p> : <section className="sc-panel"><EmptyPanel title="Chọn cửa hàng để bắt đầu" description="Chọn cửa hàng bạn có quyền quản lý hoặc nhập mã cửa hàng." icon="storefront" action={<button className="sc-button" onClick={() => onNavigate('vendor-settings')}>Hồ sơ cửa hàng</button>} /></section>}</div></VendorFrame>
}
