import React from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadRevenueOrders } from '../../services/adminSummaryService.js'
import { dashboardMoney, dashboardNumber } from '../../services/adminDashboardModels.js'
import { ApiState } from './ApiState.jsx'

export default function AdminOrderReport({ dates, bakeryId }) {
  const resource = useCatalogResource(loadRevenueOrders, { ...dates, bakeryId })
  const orders = resource.data?.rows || []
  const count = status => orders.filter(order => order.status === status).length
  const active = orders.filter(order => !['COMPLETED', 'CANCELLED'].includes(order.status))
  const metrics = [
    ['Tổng đơn', orders.length], ['Đang xử lý', active.length],
    ['Hoàn thành', count('COMPLETED')], ['Đã hủy', count('CANCELLED')],
    ['Khách đã đặt hàng', new Set(orders.map(order => order.customerId)).size],
    ['Quá hạn giao', active.filter(order => Date.parse(order.neededAt) < resource.data?.fetchedAt).length],
  ]
  return <section className="sc-revenue-breakdown-panel" aria-label="Thống kê đơn hàng">
    <h3>Hoạt động đặt bánh</h3>
    <p>Thống kê theo ngày tạo đơn. Giá trị đơn bánh không phải doanh thu thực nhận.</p>
    <ApiState resource={resource}>{resource.data && <div className="sc-revenue-plan-cards">
      {metrics.map(([label, value]) => <div className="sc-revenue-plan-card" key={label}>
        <span>{label}</span><strong className="sc-revenue-plan-amount">{dashboardNumber(value)}</strong>
      </div>)}
      <div className="sc-revenue-plan-card"><span>Giá trị đơn hàng (không gồm đơn hủy)</span>
        <strong className="sc-revenue-plan-amount">{dashboardMoney(orders.filter(order => order.status !== 'CANCELLED').reduce((total, order) => total + order.totalAmount, 0), 'VND')}</strong>
      </div>
    </div>}</ApiState>
  </section>
}
