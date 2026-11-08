import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import React from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { DataTable, Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadAdminDashboard } from '../../../services/adminDashboardService.js'
import { buildAdminDashboard, dashboardMoney, dashboardNumber, dashboardOrderName, dashboardDateTime, DASHBOARD_PENDING_ORDER_STATUS } from '../../../services/adminDashboardModels.js'
import { getDemoStore, demoRuntime } from '../../../mockData/runtime.js'
import { dashboardSupplement } from '../../../mockData/admin/dashboardSnapshot.js'
import { orderStatusLabel } from '../../../services/orderModels.js'
import { StatusDistribution } from './DashboardCharts.jsx'
import AdminWorkQueue from './AdminWorkQueue.jsx'
import './admin-dashboard.css'

export default function AdminDashboardPage({ onNavigate }) {
  const { user } = useAuth()
  const resource = useCatalogResource(loadAdminDashboard, { user: { id: user?.id, roles: user?.roles || [] } })
  const demoStore = getDemoStore()
  const runtime = demoRuntime || (demoStore ? { store: demoStore } : null)
  const supplement = dashboardSupplement(runtime, user, resource.data || {})
  const combinedData = { ...resource.data, ...supplement }
  const dashboard = buildAdminDashboard(combinedData)
  const loading = resource.status === 'loading'
  const failing = resource.status === 'error' || Object.values(resource.data || {}).some((item) => item.state === 'error')
  const go = (route) => () => onNavigate(route)
  const orderRoute = (row) => 'admin-orders?orderId=' + encodeURIComponent(row.id)
  const workGroups = [
    { key: 'bakeries', title: 'Tiệm chờ duyệt', icon: 'storefront', route: 'admin-vendors?status=PENDING_APPROVAL', items: dashboard.pendingBakeries?.map((row) => ({ key: row.id, name: row.name || 'Tiệm bánh', route: 'admin-vendors?bakeryId=' + row.id })) },
    { key: 'payments', title: 'Gói dịch vụ chờ duyệt', icon: 'receipt_long', route: 'admin-payments', items: dashboard.pendingPayments?.map((row) => ({ key: row.id, name: dashboard.bakeries?.find((bakery) => bakery.id === row.bakeryId)?.name || 'Chứng từ mua gói', detail: row.amount == null ? undefined : dashboardMoney(row.amount, row.currency || 'VND'), route: 'admin-payments?paymentId=' + row.id })) },
    { key: 'moderation', title: 'Kiểm duyệt nội dung', icon: 'fact_check', route: 'admin-moderation', items: dashboard.moderation?.map((row) => ({ key: row.kind + row.id, name: row.label, route: 'admin-moderation?kind=' + row.kind + '&id=' + row.id })) },
  ]

  const pendingPaymentsCount = dashboard.counts?.pendingPayments || 0
  const pendingBakeriesCount = dashboard.counts?.pendingBakeries || 0
  const hasUrgentWork = pendingPaymentsCount > 0 || pendingBakeriesCount > 0

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
      subContent: <span className="sc-kpi-sub-text">Doanh thu thực nhận</span>,
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
      subContent: dashboard.counts?.pendingBakeries != null ? (
        <button
          type="button"
          className={`sc-kpi-sub-text sc-kpi-sub-text--clickable ${(dashboard.counts.pendingBakeries || 0) > 0 ? 'sc-kpi-sub-text--highlight' : ''}`}
          onClick={(e) => { e.stopPropagation(); onNavigate('admin-vendors?status=PENDING_APPROVAL') }}
          aria-label={`${dashboard.counts.pendingBakeries} Tiệm chờ duyệt`}
          title="Xem danh sách tiệm chờ duyệt"
        >
          <span>{dashboard.counts.pendingBakeries} Tiệm chờ duyệt</span>
        </button>
      ) : (
        <span className="sc-kpi-sub-text">Tiệm chờ duyệt: —</span>
      ),
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
      subContent: dashboard.counts?.pendingOrders != null ? (
        <button
          type="button"
          className={`sc-kpi-sub-text sc-kpi-sub-text--clickable ${(dashboard.counts.pendingOrders || 0) > 0 ? 'sc-kpi-sub-text--highlight' : ''}`}
          onClick={(e) => { e.stopPropagation(); onNavigate('admin-orders?status=' + DASHBOARD_PENDING_ORDER_STATUS) }}
          aria-label={`${dashboard.counts.pendingOrders} Đơn chờ xử lý`}
          title="Xem danh sách đơn chờ xử lý"
        >
          <span>{dashboard.counts.pendingOrders} Đơn chờ xử lý</span>
        </button>
      ) : (
        <span className="sc-kpi-sub-text">Đơn chờ xử lý: —</span>
      ),
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
      subContent: <span className="sc-kpi-sub-text">Tài khoản thành viên</span>,
    },
  ]

  return (
    <AdminFrame
      activeTab="admin-dashboard"
      onNavigate={onNavigate}
      headerAction={
        <button
          aria-label="Làm mới tổng quan"
          className="sc-button sc-action-button sc-action-button--secondary"
          disabled={loading || resource.refreshing}
          onClick={resource.reload}
        >
          <Icon name="refresh" />
          {loading || resource.refreshing ? 'Đang cập nhật…' : 'Làm mới'}
        </button>
      }
    >
      <div className="sc-dashboard" aria-busy={loading || resource.refreshing}>
        {failing && (
          <p role="alert" className="sc-dashboard-notice">
            <Icon name="warning" />
            Một số số liệu chưa tải được. Vui lòng làm mới để cập nhật.
          </p>
        )}

        {hasUrgentWork && (
          <div className="sc-dashboard-action-banner" role="region" aria-label="Việc cần xử lý khẩn cấp">
            <div className="sc-dashboard-banner-content">
              <div className="sc-dashboard-banner-badge">
                <Icon name="bolt" />
                <span>Cần quản trị viên xử lý</span>
              </div>
              <p className="sc-dashboard-banner-title">
                Có <strong>{pendingPaymentsCount + pendingBakeriesCount}</strong> mục đang chờ xử lý
                <span className="sc-dashboard-banner-desc">
                  ({pendingPaymentsCount} chứng từ gói dịch vụ, {pendingBakeriesCount} hồ sơ tiệm bánh)
                </span>
              </p>
            </div>
            <div className="sc-dashboard-banner-actions">
              {pendingPaymentsCount > 0 && (
                <button
                  type="button"
                  className="sc-banner-btn sc-banner-btn--primary"
                  onClick={go('admin-payments')}
                >
                  <Icon name="receipt_long" />
                  Duyệt gói dịch vụ ({pendingPaymentsCount})
                </button>
              )}
              {pendingBakeriesCount > 0 && (
                <button
                  type="button"
                  className="sc-banner-btn sc-banner-btn--secondary"
                  onClick={go('admin-vendors?status=PENDING_APPROVAL')}
                >
                  <Icon name="storefront" />
                  Duyệt tiệm bánh ({pendingBakeriesCount})
                </button>
              )}
            </div>
          </div>
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
            <span>Chờ quản trị viên xử lý</span>
          </div>
          <AdminWorkQueue groups={workGroups} loading={loading} onNavigate={onNavigate} />
        </section>

        <section className="sc-dashboard-section" aria-labelledby="dashboard-recent">
          <div className="sc-dashboard-section-heading">
            <h2 id="dashboard-recent">Hoạt động gần đây</h2>
          </div>
          <div className="sc-dashboard-recent">
            <article className="sc-panel">
              <div className="sc-dashboard-panel-heading">
                <h3>Đơn hàng mới nhất</h3>
                <button className="sc-dashboard-link" onClick={go('admin-orders')}>
                  Xem tất cả <Icon name="arrow_forward" />
                </button>
              </div>
              {dashboard.recentOrders.length ? (
                <DataTable label="Đơn hàng gần đây" className="sc-admin-fixed-table sc-admin-recent-table">
                  <colgroup>
                    <col style={{ width: '60px' }} />
                    {[24, 20, 20, 20, 16].map((width, index) => (
                      <col key={index} style={{ width: width + '%' }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                      <th>Đơn hàng</th>
                      <th>Trạng thái</th>
                      <th className="sc-money">Giá trị</th>
                      <th>Ngày tạo</th>
                      <th className="sc-table-actions" scope="col">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentOrders.map((row, index) => (
                      <tr key={row.id}>
                        <td data-label="STT" style={{ width: '60px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-muted, #64748b)' }}>
                          {index + 1}
                        </td>
                        <td>
                          <strong>{dashboardOrderName(row)}</strong>
                          <small>{cleanPresentationLabel(row.customerName || row.bakeryName, 'Đơn bánh')}</small>
                        </td>
                        <td>
                          <StatusBadge status={row.status} label={orderStatusLabel(row.status)} />
                        </td>
                        <td className="sc-money">
                          {row.totalAmount == null || !row.currency
                            ? '—'
                            : dashboardMoney(row.totalAmount, row.currency)}
                        </td>
                        <td>{dashboardDateTime(row.createdAt)}</td>
                        <td className="sc-table-actions">
                          <button
                            className="sc-button sc-action-button sc-action-button--secondary"
                            onClick={go(orderRoute(row))}
                            aria-label={'Xem chi tiết ' + dashboardOrderName(row)}
                          >
                            <Icon name="visibility" />
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              ) : (
                <p className="sc-dashboard-empty">
                  {loading
                    ? 'Đang tải đơn hàng…'
                    : dashboard.orders == null
                      ? 'Chưa tải được đơn hàng.'
                      : 'Chưa có đơn hàng.'}
                </p>
              )}
            </article>
          </div>
        </section>
      </div>
    </AdminFrame>
  )
}
