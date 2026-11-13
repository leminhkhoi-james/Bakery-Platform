import React from 'react'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadManagedProducts } from '../../../services/vendorManagementService.js'
import { loadDashboardAccess, dashboardErrorMessage, loadDashboardCompletedOrders } from '../../../services/vendorDashboardService.js'
import { loadOrders } from '../../../services/orderService.js'
import { formatOrderMoney } from '../../../services/orderPresentation.js'
import { EmptyPanel, Icon } from '../../../components/common/WorkspaceUI.jsx'
import { StatusDistribution } from '../../admin/dashboard/DashboardCharts.jsx'
import { dashboardNumber } from '../../../services/adminDashboardModels.js'
import { ORDER_STATUSES, orderStatusLabel } from '../../../services/orderModels.js'
import { vendorOrderSourceLabels } from '../../../services/vendorOrderPresentation.js'
import './vendor-dashboard.css'

function DashboardError({ resources }) {
  const failed = resources.filter((resource) => resource?.error)
  if (!failed.length) return null
  const error = failed.find((resource) => resource.error.status === 401)?.error || failed[0].error
  return <div className="sc-vendor-dashboard-error" role="alert"><Icon name={error.status === 403 ? 'lock' : 'info'} /><p>{failed.map(resource => resource.label).filter(Boolean).join(', ')}{failed.some(resource => resource.label) ? ': ' : ''}{error.status === 503 ? 'Dịch vụ đang tạm gián đoạn. Vui lòng thử lại sau.' : dashboardErrorMessage(error)}{error.status > 0 ? ' (HTTP ' + error.status + ')' : ''}</p>{error.status !== 401 && <RefreshButton disabled={failed.some((resource) => resource.refreshing)} onClick={() => failed.forEach((resource) => resource.reload())}>Thử lại</RefreshButton>}</div>
}

const productStates = { DRAFT: 'Bản nháp', PUBLISHED: 'Đang bán', HIDDEN: 'Tạm ẩn', ARCHIVED: 'Đã lưu trữ' }
const orderStates = Object.fromEntries(ORDER_STATUSES.map(status => [status, orderStatusLabel(status)]))
async function loadDashboardBreakdown({ bakeryId }, options) {
  const groups = await Promise.all([
    Promise.all(Object.keys(productStates).map(async status => {
      const page = await loadManagedProducts({ bakeryId, status, page: 1, size: 1 }, options)
      return [status, page.meta.total]
    })),
    Promise.all(Object.keys(orderStates).map(async status => {
      const page = await loadOrders({ bakeryId, scope: 'bakery', status, page: 1, size: 1 }, options)
      return [status, page.meta.total]
    })),
  ])
  return { products: Object.fromEntries(groups[0]), orders: Object.fromEntries(groups[1]) }
}
const statusItems = (counts, labels) => counts && Object.entries(labels).map(([status, label]) => ({
  status, label, count: counts[status],
}))
const isLoading = resource => resource?.status === 'loading'
const totalLabel = resource => dashboardNumber(resource?.error ? null : resource?.data?.meta?.total)

export function DashboardOverview({ bakeryId, products, orders, completedOrders, breakdown, onNavigate, onViewOrders }) {
  const navigate = (page) => onNavigate(page + '?bakeryId=' + encodeURIComponent(bakeryId))
  const revenue = completedOrders?.error ? null : completedOrders?.data
  const amountBySource = new Map()
  for (const order of revenue?.result || []) {
    const source = Object.hasOwn(vendorOrderSourceLabels, order.orderSource) ? order.orderSource : ''
    amountBySource.set(source, (amountBySource.get(source) || 0) + order.totalAmount)
  }
  const revenueSources = Object.entries(vendorOrderSourceLabels)
  if (amountBySource.has('')) revenueSources.push(['', 'Chưa rõ nguồn đơn'])

  return <>
    <DashboardError resources={[{ ...products, label: 'Sản phẩm' }, { ...orders, label: 'Đơn hàng' }, { ...completedOrders, label: 'Doanh thu' }]} />
    <div className="sc-vendor-kpis">
      <StatusDistribution
        title="Sản phẩm" icon="cake" value={totalLabel(products)}
        items={statusItems(breakdown?.data?.products, productStates)}
        loading={isLoading(products) || isLoading(breakdown)}
        onNavigate={() => navigate('vendor-menu')} actionLabel="Quản lý sản phẩm"
      />
      <StatusDistribution
        title="Đơn hàng" icon="shopping_bag" value={totalLabel(orders)}
        items={statusItems(breakdown?.data?.orders, orderStates)}
        loading={isLoading(orders) || isLoading(breakdown)}
        onNavigate={onViewOrders || (() => navigate('vendor-orders'))} actionLabel="Xem đơn hàng"
      />
      <StatusDistribution
        title="Doanh thu" icon="account_balance_wallet"
        value={revenue ? formatOrderMoney(revenue.totalAmount, revenue.currency) : '—'}
        loading={isLoading(completedOrders)}
        onNavigate={() => navigate('vendor-revenue')}
      >
        {revenue && <ul aria-label="Giá trị đơn hoàn tất theo nguồn">
          {revenueSources.map(([source, label]) => <li key={source}>
            <div><span>{label}</span><strong>{formatOrderMoney(amountBySource.get(source) || 0, revenue.currency)}</strong></div>
          </li>)}
        </ul>}
      </StatusDistribution>
    </div>
  </>
}

export function DashboardData({ bakeryId, onNavigate, onViewOrders }) {
  const products = useCatalogResource(loadManagedProducts, { bakeryId, page: 1, size: 1 })
  const orders = useCatalogResource(loadOrders, { scope: 'bakery', bakeryId, page: 1, size: 1, sort: 'createdAt,desc' })
  const breakdown = useCatalogResource(loadDashboardBreakdown, { bakeryId })
  const completedOrders = useCatalogResource(loadDashboardCompletedOrders, { bakeryId })
  return <DashboardOverview bakeryId={bakeryId} products={products} orders={orders} completedOrders={completedOrders} breakdown={breakdown} onNavigate={onNavigate} onViewOrders={onViewOrders} />
}

function VerifiedDashboard({ bakeryId, userId, onNavigate }) {
  const access = useCatalogResource(loadDashboardAccess, { bakeryId, userId })
  if (access.status === 'loading') return <section className="sc-panel sc-vendor-access" role="status">Đang xác minh quyền quản lý cửa hàng…</section>
  if (access.error) return <DashboardError resources={[access]} />
  return <DashboardData bakeryId={bakeryId} onNavigate={onNavigate} />
}

export default function VendorDashboardPage({ onNavigate, routeSearch }) {
  const owner = useVendorBakery(routeSearch)
  const { bakeryId, user, available } = owner
  return <VendorFrame owner={owner} title="Tổng quan cửa hàng" activeTab="dashboard" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-vendor-dashboard">{bakeryId ? <VerifiedDashboard key={user.id + ':' + bakeryId} bakeryId={bakeryId} userId={user.id} onNavigate={onNavigate} /> : available.status === 'loading' ? <p role="status">Đang tải cửa hàng…</p> : <section className="sc-panel"><EmptyPanel title="Chọn cửa hàng để bắt đầu" description="Chọn cửa hàng bạn có quyền quản lý hoặc nhập mã cửa hàng." icon="storefront" action={<button className="sc-button" onClick={() => onNavigate('vendor-settings')}>Hồ sơ cửa hàng</button>} /></section>}</div></VendorFrame>
}
