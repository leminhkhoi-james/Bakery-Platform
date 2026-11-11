import { loadRfqs, loadOffers } from '../../../services/rfqService.js'
import { unifiedEnabled, unifiedSnapshot, recordSource } from '../../../services/unifiedDataService.js'
import { uiLabel, cleanPresentationLabel } from '../../../services/uiLabels.js'
import React from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadAdminDashboard } from '../../../services/adminDashboardService.js'
import { buildAdminDashboard, dashboardMoney, dashboardNumber, DASHBOARD_PENDING_ORDER_STATUS } from '../../../services/adminDashboardModels.js'
import { getDemoStore, demoRuntime } from '../../../mockData/runtime.js'
import { dashboardSupplement } from '../../../mockData/admin/dashboardSnapshot.js'
import { StatusDistribution } from './DashboardCharts.jsx'
import AdminWorkQueue from './AdminWorkQueue.jsx'
import './admin-dashboard.css'
import { simulationStore } from '../../../mockData/business/runtime.js'

export default function AdminDashboardPage({ onNavigate }) {
  const { user } = useAuth()
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
  if (unifiedEnabled() && combinedData.payments?.rows) { const financial = buildAdminDashboard({ ...combinedData, payments: { ...combinedData.payments, rows: combinedData.payments.rows.filter(row => recordSource(row) === 'api') } }); dashboard.revenue = (combinedData.payments.state === 'ready' || snapshot?.apiPaymentsComplete !== false) ? financial.revenue : null; dashboard.currencies = financial.currencies; dashboard.currency = financial.currency }
  const loading = resource.status === 'loading'
  const failing = resource.status === 'error' || Object.values(resource.data || {}).some((item) => item.state === 'error')
  const go = (route) => () => onNavigate(route)
  const workGroups = [
    { key: 'bakeries', title: 'Tiệm chờ duyệt', icon: 'storefront', route: 'admin-vendors?status=PENDING_APPROVAL', items: dashboard.pendingBakeries?.map((row) => ({ key: row.id, name: row.name || 'Tiệm bánh', route: 'admin-vendors?bakeryId=' + row.id })) },
    { key: 'moderation', title: 'Kiểm duyệt nội dung', icon: 'fact_check', route: 'admin-moderation', items: dashboard.moderation?.map((row) => ({ key: row.kind + row.id, name: row.label, route: 'admin-moderation?kind=' + row.kind + '&id=' + row.id })) },
  ]


  const distributionSummary = rows => rows ? Object.entries(rows.reduce((counts, row) => { const label = uiLabel(row.status, 'Chưa rõ trạng thái'); counts[label] = (counts[label] || 0) + 1; return counts }, {})).map(([label, total]) => `${total} ${label.toLocaleLowerCase('vi')}`).join(' · ') : 'Chưa tải được phân bố trạng thái'

  const cards = [
    {
      id: 'revenue',
      title: 'Doanh thu gói dịch vụ',
      icon: 'account_balance_wallet',
      route: 'admin-revenue',
      variant: 'revenue',
      isMissing: dashboard.revenue == null,
      renderedValue: dashboard.revenue == null
        ? '—'
        : Object.keys(dashboard.revenue).length
          ? Object.entries(dashboard.revenue).map(([code, amount]) => (
              <span key={code}>{dashboardMoney(amount, code)}</span>
            ))
          : dashboardMoney(0),
      hasUrgentDot: false,
      subContent: <span className="sc-kpi-sub-text">Doanh thu gói thực nhận</span>,
    },
    {
      id: 'bakeries',
      title: 'Tiệm bánh',
      icon: 'storefront',
      route: 'admin-vendors',
      variant: 'scale',
      isMissing: dashboard.counts?.bakeries == null,
      renderedValue: dashboardNumber(dashboard.counts?.bakeries),
      hasUrgentDot: (dashboard.counts?.pendingBakeries || 0) > 0,
      subContent: <span className="sc-kpi-sub-text">{distributionSummary(dashboard.bakeries)}</span>,
    },
    {
      id: 'orders',
      title: 'Đơn hàng',
      icon: 'shopping_bag',
      route: 'admin-orders',
      variant: 'orders',
      isMissing: dashboard.counts?.orders == null,
      renderedValue: dashboardNumber(dashboard.counts?.orders),
      hasUrgentDot: (dashboard.counts?.pendingOrders || 0) > 0,
      subContent: <span className="sc-kpi-sub-text">{distributionSummary(dashboard.orders)}</span>,
    },
    {
      id: 'users',
      title: 'Người dùng',
      icon: 'group',
      route: 'admin-users',
      variant: 'scale',
      isMissing: dashboard.counts?.users == null,
      renderedValue: dashboardNumber(dashboard.counts?.users),
      hasUrgentDot: false,
      subContent: <span className="sc-kpi-sub-text">{distributionSummary(dashboard.users)}</span>,
    },
  ]

  return (
    <AdminFrame
      activeTab="admin-dashboard"
      onNavigate={onNavigate}

    >
      <div className="sc-dashboard" aria-busy={loading || resource.refreshing}>
        {failing && (
          <p role="alert" className="sc-dashboard-notice">
            <Icon name="warning" />
            Một số số liệu chưa tải được. Vui lòng làm mới để cập nhật.
          </p>
        )}

        <section className="sc-dashboard-kpis" aria-label="Chỉ số tổng quan">
          {cards.map((card) => (
            <article
              key={card.id}
              className="sc-panel sc-dashboard-kpi sc-dashboard-kpi--clickable"
              onClick={card.route ? go(card.route) : undefined}
            >
              {/* Ở trên: icon + tiêu đề */}
              <div className="sc-kpi-header">
                <span className="sc-kpi-icon-wrap">
                  <Icon name={card.icon} />
                </span>
                <span className="sc-kpi-title" title={card.title}>{card.title}</span>
              </div>

              {/* Ở giữa: số liệu lớn */}
              <div className="sc-kpi-body">
                <strong
                  className="sc-metric-value"
                  aria-label={
                    loading
                      ? 'Đang tải số liệu'
                      : card.isMissing
                        ? 'Chưa có số liệu'
                        : undefined
                  }
                >
                  {loading ? '…' : card.renderedValue}
                </strong>
              </div>

              {/* Bên dưới: mô tả nhỏ */}
              <div className="sc-dashboard-kpi-footer">
                {loading ? <span className="sc-kpi-sub-text">Đang tải…</span> : card.subContent}
              </div>
            </article>
          ))}
        </section>

        <section className="sc-dashboard-section" aria-labelledby="dashboard-statuses">
          <div className="sc-dashboard-section-heading">
            <h2 id="dashboard-statuses">Tình hình hoạt động</h2>
          </div>
          <div className="sc-dashboard-statuses">
            <StatusDistribution
              title="Trạng thái đơn hàng"
              items={dashboard.distributions.orders}
              icon="đơn hàng"
              onNavigate={go('admin-orders')}
            />
            <StatusDistribution
              title="Trạng thái tiệm bánh"
              items={dashboard.distributions.bakeries}
              icon="tiệm bánh"
              onNavigate={go('admin-vendors')}
            />
            <StatusDistribution
              title="Trạng thái người dùng"
              items={dashboard.distributions.users}
              icon="người dùng"
              onNavigate={go('admin-users')}
            />
          </div>
        </section>

        <section className="sc-dashboard-section" aria-labelledby="dashboard-work">
          <div className="sc-dashboard-section-heading">
            <h2 id="dashboard-work">Việc cần xử lý</h2>
            
          </div>
          <AdminWorkQueue groups={workGroups} loading={loading} onNavigate={onNavigate} />
        </section>


      </div>
    </AdminFrame>
  )
}
