import React from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { DataTable, Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadAdminDashboard } from '../../../services/adminDashboardService.js'
import { buildAdminDashboard, dashboardMoney, dashboardNumber, dashboardOrderName, dashboardDateTime, DASHBOARD_PENDING_ORDER_STATUS } from '../../../services/adminDashboardModels.js'
import { orderStatusLabel } from '../../../services/orderModels.js'
import { StatusDistribution } from './DashboardCharts.jsx'
import AdminWorkQueue from './AdminWorkQueue.jsx'
import './admin-dashboard.css'

const metrics = [
  ['bakeries', 'Tổng tiệm bánh', 'storefront', 'admin-vendors'],
  ['pendingBakeries', 'Tiệm chờ duyệt', 'pending_actions', 'admin-vendors'],
  ['users', 'Tổng người dùng', 'group', 'admin-users'],
  ['products', 'Sản phẩm', 'cake'],
  ['orders', 'Tổng đơn hàng', 'shopping_bag', 'admin-orders'],
  ['revenue', 'Doanh thu gói dịch vụ', 'account_balance_wallet', 'admin-payments'],
  ['requests', 'Yêu cầu báo giá', 'request_quote'],
  ['offers', 'Báo giá', 'price_check'],
  ['pendingPayments', 'Gói dịch vụ chờ duyệt', 'receipt_long', 'admin-payments'],
  ['pendingOrders', 'Đơn hàng chờ xử lý', 'assignment_late', 'admin-orders?status=' + DASHBOARD_PENDING_ORDER_STATUS],
]
export default function AdminDashboardPage({ onNavigate }) {
  const { user } = useAuth()
  const resource = useCatalogResource(loadAdminDashboard, { user: { id: user?.id, roles: user?.roles || [] } })
  const dashboard = buildAdminDashboard(resource.data)
  const loading = resource.status === 'loading'
  const failing = resource.status === 'error' || Object.values(resource.data || {}).some((item) => item.state === 'error')
  const go = (route) => () => onNavigate(route)
  const orderRoute = (row) => 'admin-orders?orderId=' + encodeURIComponent(row.id)
  const workGroups = [
    { key: 'bakeries', title: 'Tiệm chờ duyệt', icon: 'storefront', route: 'admin-vendors?status=PENDING_APPROVAL', items: dashboard.pendingBakeries?.map((row) => ({ key: row.id, name: row.name || 'Tiệm bánh', route: 'admin-vendors?bakeryId=' + row.id })) },
    { key: 'payments', title: 'Chứng từ chờ duyệt', icon: 'receipt_long', route: 'admin-payments', items: dashboard.pendingPayments?.map((row) => ({ key: row.id, name: dashboard.bakeries?.find((bakery) => bakery.id === row.bakeryId)?.name || 'Chứng từ mua gói', detail: row.amount == null ? undefined : dashboardMoney(row.amount, row.currency || 'VND'), route: 'admin-payments?paymentId=' + row.id })) },
    { key: 'moderation', title: 'Kiểm duyệt nội dung', icon: 'fact_check', route: 'admin-moderation', items: dashboard.moderation?.map((row) => ({ key: row.kind + row.id, name: row.label, route: 'admin-moderation?kind=' + row.kind + '&id=' + row.id })) },
  ]

  return <AdminFrame activeTab="admin-dashboard" onNavigate={onNavigate} headerAction={<button aria-label="Làm mới tổng quan" className="sc-button sc-action-button sc-action-button--secondary" disabled={loading || resource.refreshing} onClick={resource.reload}><Icon name="refresh" />{loading || resource.refreshing ? 'Đang cập nhật…' : 'Làm mới'}</button>}><div className="sc-dashboard" aria-busy={loading || resource.refreshing}>
    {failing && <p role="alert" className="sc-dashboard-notice">Một số số liệu chưa tải được. Vui lòng làm mới để cập nhật.</p>}
    <section className="sc-dashboard-kpis" aria-label="Chỉ số tổng quan">{metrics.map(([key, label, icon, route]) => <article key={key} className="sc-panel sc-dashboard-kpi"><div><Icon name={icon} /><span>{label}</span></div><div className="sc-dashboard-kpi-footer"><strong className="sc-metric-value" aria-label={loading ? 'Đang tải số liệu' : (key === 'revenue' ? dashboard.revenue == null : dashboard.counts[key] == null) ? 'Chưa có số liệu' : undefined}>{loading ? '…' : key === 'revenue' ? dashboard.revenue == null ? '—' : Object.keys(dashboard.revenue).length ? Object.entries(dashboard.revenue).map(([code, amount]) => <span key={code}>{dashboardMoney(amount, code)}</span>) : dashboardMoney(0) : dashboardNumber(dashboard.counts[key])}</strong>{route && <button onClick={go(route)} aria-label={'Xem ' + label.toLocaleLowerCase('vi')}><Icon name="arrow_forward" /></button>}</div></article>)}</section>
    <section className="sc-dashboard-section" aria-labelledby="dashboard-statuses"><div className="sc-dashboard-section-heading"><h2 id="dashboard-statuses">Tình hình hoạt động</h2></div><div className="sc-dashboard-statuses"><StatusDistribution title="Trạng thái đơn hàng" items={dashboard.distributions.orders} icon="đơn hàng" onNavigate={go('admin-orders')} /><StatusDistribution title="Trạng thái tiệm bánh" items={dashboard.distributions.bakeries} icon="tiệm bánh" onNavigate={go('admin-vendors')} /><StatusDistribution title="Trạng thái người dùng" items={dashboard.distributions.users} icon="người dùng" onNavigate={go('admin-users')} /></div></section>
    <section className="sc-dashboard-section" aria-labelledby="dashboard-work"><div className="sc-dashboard-section-heading"><h2 id="dashboard-work">Việc cần xử lý</h2><span>Chờ quản trị viên xử lý</span></div><AdminWorkQueue groups={workGroups} loading={loading} onNavigate={onNavigate} /></section>
    <section className="sc-dashboard-section" aria-labelledby="dashboard-recent"><div className="sc-dashboard-section-heading"><h2 id="dashboard-recent">Hoạt động gần đây</h2></div><div className="sc-dashboard-recent"><article className="sc-panel"><div className="sc-dashboard-panel-heading"><h3>Đơn hàng mới nhất</h3><button className="sc-dashboard-link" onClick={go('admin-orders')}>Xem tất cả <Icon name="arrow_forward" /></button></div>{dashboard.recentOrders.length ? <DataTable label="Đơn hàng gần đây"><thead><tr><th>Đơn hàng</th><th>Trạng thái</th><th className="sc-money">Giá trị</th><th>Ngày tạo</th><th className="sc-table-actions" scope="col">Chi tiết</th></tr></thead><tbody>{dashboard.recentOrders.map((row) => <tr key={row.id}><td><strong>{dashboardOrderName(row)}</strong><small>{row.customerName || row.bakeryName || 'Đơn bánh'}</small></td><td><StatusBadge status={row.status} label={orderStatusLabel(row.status)} /></td><td className="sc-money">{row.totalAmount == null || !row.currency ? '—' : dashboardMoney(row.totalAmount, row.currency)}</td><td>{dashboardDateTime(row.createdAt)}</td><td className="sc-table-actions"><button className="sc-button sc-action-button sc-action-button--secondary" onClick={go(orderRoute(row))} aria-label={'Xem chi tiết ' + dashboardOrderName(row)}><Icon name="visibility" />Xem</button></td></tr>)}</tbody></DataTable> : <p className="sc-dashboard-empty">{loading ? 'Đang tải đơn hàng…' : dashboard.orders == null ? 'Chưa tải được đơn hàng.' : 'Chưa có đơn hàng.'}</p>}</article></div></section>
  </div></AdminFrame>
}
