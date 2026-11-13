import { loadRfqs, loadOffers } from '../../../services/rfqService.js'
import { unifiedSnapshot } from '../../../services/unifiedDataService.js'
import React from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadAdminDashboard } from '../../../services/adminDashboardService.js'
import { buildAdminDashboard, dashboardMoney, dashboardNumber } from '../../../services/adminDashboardModels.js'
import { getDemoStore, demoRuntime } from '../../../mockData/runtime.js'
import { dashboardSupplement } from '../../../mockData/admin/dashboardSnapshot.js'
import { StatusDistribution } from './DashboardCharts.jsx'
import AdminWorkQueue from './AdminWorkQueue.jsx'
import './admin-dashboard.css'
import { simulationStore } from '../../../mockData/business/runtime.js'
import { businessDateSelected } from '../../../mockData/business/metrics.js'
import AdminBakeryScope from '../../../components/management/AdminBakeryScope.jsx'
import AdminRevenueFilters from '../revenue/AdminRevenueFilters.jsx'
import { useAdminReportFilters } from '../revenue/useAdminReportFilters.js'
import { useAdminRevenueData } from '../revenue/useAdminRevenueData.js'

export default function AdminDashboardPage({ onNavigate }) {
  const { user } = useAuth()
  const [filters, updateFilters] = useAdminReportFilters(user?.id)
  const { bakeryId, dates } = filters
  const { realRevenue, simulatedRevenue, planTiers, periodTotalRevenue, loading: revenueLoading } = useAdminRevenueData(filters)
  const resource = useCatalogResource(loadAdminDashboard, { user: { id: user?.id, roles: user?.roles || [] } })
  const demoStore = getDemoStore()
  const runtime = demoRuntime || (demoStore ? { store: demoStore } : null)
  useCatalogResource(loadRfqs, { scope: 'all', size: 100 })
  useCatalogResource(loadOffers, { scope: 'all', size: 100 })
  const snapshot = unifiedSnapshot()
  const simulated = snapshot ? { state: snapshot } : simulationStore()
  const supplement = simulated ? Object.fromEntries(['products', 'requests', 'offers', 'designs', 'plans', 'reviews'].map(key => [key, { state: 'ready', source: 'simulation', rows: key === 'reviews' ? simulated.state.orders.filter(order => order.review).map(order => ({ ...order.review, id: order.id })) : simulated.state[key] || [] }])) : dashboardSupplement(runtime, user, resource.data || {})
  const combinedData = { ...resource.data, ...supplement }
  const dashboard = buildAdminDashboard(combinedData)
  const loading = resource.status === 'loading'
  const failing = resource.status === 'error' || Object.values(resource.data || {}).some((item) => item.state === 'error')
  const go = (route) => () => onNavigate(route)
  const workGroups = [
    { key: 'bakeries', title: 'Tiệm chờ duyệt', icon: 'storefront', route: 'admin-vendors?status=PENDING_APPROVAL', items: dashboard.pendingBakeries?.map((row) => ({ key: row.id, name: row.name || 'Tiệm bánh', route: 'admin-vendors?bakeryId=' + row.id })) },
    { key: 'payments', title: 'Gói dịch vụ chờ duyệt', icon: 'receipt_long', route: 'admin-payments', items: dashboard.pendingPayments?.map(row => ({ key: row.id, name: 'Chứng từ mua gói', route: 'admin-payments?paymentId=' + row.id })) },
    { key: 'moderation', title: 'Kiểm duyệt nội dung', icon: 'fact_check', route: 'admin-moderation', items: dashboard.moderation?.map((row) => ({ key: row.kind + row.id, name: row.label, route: 'admin-moderation?kind=' + row.kind + '&id=' + row.id })) },
  ]


  const nameKey = value => String(value || '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('vi').replace(/đ/g, 'd')
  const query = nameKey(filters.search.trim())
  const matchesName = values => !query || values.some(value => nameKey(value).includes(query))
  const withinDates = row => businessDateSelected(row.createdAt, dates.from, dates.to)
  const activityDashboard = buildAdminDashboard(Object.fromEntries([
    ['orders', row => (!bakeryId || row.bakeryId === bakeryId) && withinDates(row) && matchesName([row.customerName, row.bakeryName])],
    ['bakeries', row => (!bakeryId || row.id === bakeryId) && withinDates(row) && matchesName([row.name])],
    ['users', row => withinDates(row) && matchesName([row.displayName, row.name])],
  ].map(([key, matches]) => {
    const collection = combinedData[key]
    return [key, collection?.state === 'ready' ? { ...collection, rows: collection.rows.filter(matches) } : collection]
  })), { includeEmptyStatuses: true })
  const activity = [
    { key: 'orders', title: 'Đơn hàng', icon: 'shopping_bag', route: 'admin-orders' },
    { key: 'revenue', title: 'Doanh thu gói', icon: 'account_balance_wallet', route: 'admin-payments' },
    { key: 'bakeries', title: 'Tiệm bánh', icon: 'storefront', route: 'admin-vendors' },
    { key: 'users', title: 'Người dùng', icon: 'group', route: 'admin-users' },
  ]

  return (
    <AdminFrame
      activeTab="admin-dashboard"
      onNavigate={onNavigate}
      headerAction={<button type="button" className="sc-button sc-action-button--secondary" disabled={loading || resource.refreshing} onClick={resource.reload}>Làm mới tổng quan</button>}
    >
      <div className="sc-dashboard" aria-busy={loading || resource.refreshing}>
        {failing && (
          <p role="alert" className="sc-dashboard-notice">
            <Icon name="warning" />
            Một số số liệu chưa tải được.
          </p>
        )}

        <AdminRevenueFilters filters={filters} updateFilters={updateFilters} scopeControl={<AdminBakeryScope value={bakeryId} onChange={value => updateFilters({ bakeryId: value })} />} />

        <section className="sc-dashboard-section" aria-labelledby="dashboard-statuses">
          <div className="sc-dashboard-section-heading">
            <h2 id="dashboard-statuses">Tình hình hoạt động</h2>
          </div>
          <div className="sc-dashboard-statuses">
            {activity.map(({ key, title, icon, route }) => (
              <StatusDistribution
                key={key}
                title={title}
                icon={icon}
                value={key === 'revenue' ? dashboardMoney(realRevenue) : dashboardNumber(activityDashboard.counts[key])}
                items={activityDashboard.distributions[key]}
                scopeNote={key === 'users' && bakeryId ? 'Toàn hệ thống' : undefined}
                loading={key === 'revenue' ? revenueLoading : loading}
                onNavigate={go(route)}
              >
              {key === 'revenue' && planTiers.length > 0 && <div className="sc-activity-plan-breakdown">
                <ul>{planTiers.map(tier => <li key={tier.id}>
                  <div><span>{tier.name}{periodTotalRevenue != null && <small>{dashboardNumber(tier.count)} gói</small>}</span><strong>{dashboardMoney(periodTotalRevenue == null ? null : tier.revenue)}</strong></div>
                  {periodTotalRevenue != null && <meter min="0" max="100" value={tier.share} aria-label={tier.name + ' · ' + tier.share + '% doanh thu gói'} />}
                </li>)}</ul>
                {simulatedRevenue > 0 && <p className="sc-dashboard-muted mt-2">Gồm giao dịch mô phỏng</p>}
              </div>}
              </StatusDistribution>
            ))}
          </div>
        </section>


        <section className="sc-dashboard-section" aria-labelledby="dashboard-work">
          <div className="sc-dashboard-section-heading">
            <h2 id="dashboard-work">Việc cần xử lý{bakeryId && <small className="sc-activity-scope-note"> (Toàn hệ thống)</small>}</h2>
            
          </div>
          <AdminWorkQueue groups={workGroups} loading={loading} onNavigate={onNavigate} />
        </section>


      </div>
    </AdminFrame>
  )
}
