import { canonicalBakeryId, unifiedEnabled, unifiedSnapshot, unifiedMetrics } from '../../../services/unifiedDataService.js'
import React from 'react'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadManagedProducts } from '../../../services/vendorManagementService.js'
import { loadDashboardAccess, dashboardErrorMessage, loadDashboardOrders, loadDashboardCompletedOrders } from '../../../services/vendorDashboardService.js'
import { formatOrderMoney } from '../../../services/orderPresentation.js'
import { EmptyPanel, Icon } from '../../../components/common/WorkspaceUI.jsx'
import './vendor-dashboard.css'
import BusinessSimulationReport from '../../../components/management/BusinessSimulationReport.jsx'
import { simulationStore } from '../../../mockData/business/runtime.js'
import { businessMetrics } from '../../../mockData/business/metrics.js'

function DashboardError({ resources }) {
  const failed = resources.filter((resource) => resource?.error)
  if (!failed.length) return null
  const error = failed.find((resource) => resource.error.status === 401)?.error || failed[0].error
  return <div className="sc-vendor-dashboard-error" role="alert"><Icon name={error.status === 403 ? 'lock' : 'info'} /><p>{failed.map(resource => resource.label).filter(Boolean).join(', ')}{failed.some(resource => resource.label) ? ': ' : ''}{error.status === 503 ? 'Dịch vụ đang tạm gián đoạn. Vui lòng thử lại sau.' : dashboardErrorMessage(error)}{error.status > 0 ? ' (HTTP ' + error.status + ')' : ''}</p>{error.status !== 401 && <RefreshButton disabled={failed.some((resource) => resource.refreshing)} onClick={() => failed.forEach((resource) => resource.reload())}>Thử lại</RefreshButton>}</div>
}

function Metric({ title, icon, caption, resource, onClick, link }) {
  const loading = resource?.status === 'loading' || resource?.refreshing
  const error = resource?.error
  const total = resource?.data?.meta?.total
  const description = error ? (error.status === 403 ? 'Chưa có quyền truy cập' : 'Chưa tải được số liệu') : caption
  return <section className="sc-panel sc-dashboard-kpi sc-vendor-kpi" aria-label={title} aria-busy={Boolean(loading)}>
    <div className="sc-vendor-kpi-heading">
      <div className="sc-kpi-header"><span className="sc-kpi-icon-wrap"><Icon name={icon} /></span><h2 className="sc-kpi-title">{title}</h2></div>
      <p className="sc-kpi-sub-text sc-vendor-kpi-caption">{description}</p>
    </div>
    <div className="sc-kpi-body">{loading ? <p className="sc-vendor-kpi-loading" role="status">Đang tải…</p> : <strong className="sc-metric-value sc-vendor-kpi-value">{!error && Number.isInteger(total) && total >= 0 ? total.toLocaleString('vi-VN') : '—'}</strong>}</div>
    <footer className="sc-vendor-kpi-footer"><button type="button" className="sc-vendor-text-link" onClick={onClick}>{link}<Icon name="arrow_forward" /></button></footer>
  </section>
}

export function DashboardOverview({ bakeryId, products, orders, completedOrders, onNavigate }) {
  const navigate = (page) => onNavigate(page + '?bakeryId=' + encodeURIComponent(bakeryId))
  const completedList = completedOrders?.data?.result?.filter((o) => o.status === 'COMPLETED') || []
  const complete = completedOrders?.status === 'ready' && !completedOrders.error && !completedOrders.refreshing && completedOrders.data?.meta?.total === completedList.length
  const simulation = simulationStore()
  const snapshot = unifiedSnapshot()
  const scope = canonicalBakeryId(bakeryId)
  const simulatedRevenue = snapshot && scope ? unifiedMetrics(snapshot, { bakeryId: scope }).simulationSalesRevenue : null
  const completedRevenue = unifiedEnabled() ? simulatedRevenue : simulation ? businessMetrics(simulation.state, { bakeryId }).salesRevenue : complete ? completedList.reduce((sum, o) => sum + Math.round(Number(o.totalAmount) * 100), 0) / 100 : null

  return <>
    <DashboardError resources={[{ ...products, label: 'Sản phẩm' }, { ...orders, label: 'Đơn hàng' }, { ...completedOrders, label: 'Doanh thu' }]} />
    <div className="sc-vendor-kpis">
      <Metric title="Sản phẩm" icon="cake" resource={products} onClick={() => navigate('vendor-menu')} link="Quản lý sản phẩm" />
      <Metric title="Tổng đơn hàng" icon="shopping_bag" resource={orders} onClick={() => navigate('vendor-orders')} link="Quản lý đơn hàng" />
      <section className="sc-panel sc-dashboard-kpi sc-vendor-kpi" aria-label="Doanh thu" aria-busy={completedOrders?.status === 'loading' || completedOrders?.refreshing}>
        <div className="sc-vendor-kpi-heading"><div className="sc-kpi-header"><span className="sc-kpi-icon-wrap"><Icon name="account_balance_wallet" /></span><h2 className="sc-kpi-title">Doanh thu</h2></div><p className="sc-kpi-sub-text sc-vendor-kpi-caption">{unifiedEnabled() ? 'Bán bánh mô phỏng · API chưa có đối soát' : !completedOrders ? 'Chưa có số liệu đã đối soát' : completedOrders.error ? 'Chưa tải được doanh thu' : simulation ? 'Đối soát API; số liệu mô phỏng ghi riêng trong báo cáo' : 'Ước tính từ đơn hoàn tất · chưa đối soát'}</p></div>
        <div className="sc-kpi-body">{!unifiedEnabled() && (completedOrders?.status === 'loading' || completedOrders?.refreshing) ? <p role="status" className="sc-vendor-kpi-loading">Đang tải…</p> : <strong className="sc-metric-value sc-vendor-kpi-value">{completedRevenue !== null ? formatOrderMoney(completedRevenue, completedList[0]?.currency || 'VND') : '—'}</strong>}</div>
        <footer className="sc-vendor-kpi-footer"><button className="sc-vendor-text-link" onClick={() => navigate('vendor-revenue')}>Xem doanh thu<Icon name="arrow_forward" /></button></footer>
      </section>
    </div>
  </>
}

function DashboardData({ bakeryId, bakery, onNavigate }) {
  const products = useCatalogResource(loadManagedProducts, { bakeryId, page: 1, size: 1 })
  const orders = useCatalogResource(loadDashboardOrders, { scope: 'bakery', bakeryId, page: 1, size: 5, sort: 'createdAt,desc' })
  const completedOrders = useCatalogResource(loadDashboardCompletedOrders, { bakeryId })
  return <><DashboardOverview bakeryId={bakeryId} products={products} orders={orders} completedOrders={completedOrders} onNavigate={onNavigate} /><BusinessSimulationReport bakeryId={bakeryId} bakery={bakery} showRecords={false} /></>
}

function VerifiedDashboard({ bakeryId, bakery, userId, onNavigate }) {
  const access = useCatalogResource(loadDashboardAccess, { bakeryId, userId })
  if (access.status === 'loading') return <section className="sc-panel sc-vendor-access" role="status">Đang xác minh quyền quản lý cửa hàng…</section>
  if (access.error) return <DashboardError resources={[access]} />
  return <DashboardData bakeryId={bakeryId} bakery={bakery} onNavigate={onNavigate} />
}

export default function VendorDashboardPage({ onNavigate, routeSearch }) {
  const owner = useVendorBakery(routeSearch)
  const { bakeryId, bakery, selectBakery, user, available } = owner
  return <VendorFrame owner={owner} title="Tổng quan cửa hàng" activeTab="dashboard" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-vendor-dashboard">{bakeryId ? <VerifiedDashboard key={user.id + ':' + bakeryId} bakeryId={bakeryId} bakery={bakery} userId={user.id} onNavigate={onNavigate} /> : available.status === 'loading' ? <p role="status">Đang tải cửa hàng…</p> : <section className="sc-panel"><EmptyPanel title="Chọn cửa hàng để bắt đầu" description="Chọn cửa hàng bạn có quyền quản lý hoặc nhập mã cửa hàng." icon="storefront" action={<button className="sc-button" onClick={() => onNavigate('vendor-settings')}>Hồ sơ cửa hàng</button>} /></section>}</div></VendorFrame>
}
