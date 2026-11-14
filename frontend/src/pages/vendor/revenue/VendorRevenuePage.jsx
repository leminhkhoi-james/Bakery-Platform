import RecordActionButton from '../../../components/common/RecordActionButton.jsx'
import { OrderDetail } from '../../../components/orders/OrderViews.jsx'
import React, { useState } from 'react'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadDashboardCompletedOrders } from '../../../services/vendorDashboardService.js'
import { formatOrderDate, formatOrderMoney } from '../../../services/orderPresentation.js'
import { displayReference } from '../../../services/displayReference.js'
import { inputClass, panelClass } from '../../../components/management/ApiState.jsx'
import { DataTable, EmptyPanel, Icon } from '../../../components/common/WorkspaceUI.jsx'
import '../dashboard/vendor-dashboard.css'

function CompletedRevenueContent({ bakeryId, onNavigate }) {
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const orders = useCatalogResource(loadDashboardCompletedOrders, { bakeryId })

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const invalidRange = Boolean(from && to && from > to)
  const hasFilter = Boolean(from || to)
  // Local calendar bounds in Vietnam. The end date includes its entire day.
  const start = from ? Date.parse(from + 'T00:00:00+07:00') : -Infinity
  const end = to ? Date.parse(to + 'T00:00:00+07:00') + 86400000 : Infinity
  const completedList = (orders.data?.result || []).filter(order => {
    if (!hasFilter) return true
    const completed = Date.parse(order.completedAt)
    return completed >= start && completed < end
  })
  const currency = orders.data?.currency
  const totalCount = completedList.length
  const estimatedRevenue = completedList.reduce((sum, order) => sum + order.totalAmount, 0)
  const loading = orders.status === 'loading' || orders.refreshing
  const metrics = [
    ['Doanh thu ước tính', 'payments', formatOrderMoney(estimatedRevenue, currency)],
    ['Đơn hàng hoàn tất', 'task_alt', totalCount.toLocaleString('vi-VN') + ' đơn'],
  ]

  return (
    <>
    {selectedOrderId && <OrderDetail orderId={selectedOrderId} scope="bakery" bakeryId={bakeryId} onClose={() => setSelectedOrderId(null)} onChanged={orders.reload} />}
    <div className="grid min-w-0 gap-4">
      <section className={panelClass} aria-label="Lọc theo ngày hoàn tất">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-primary">Ngày hoàn tất đơn</h2>
          <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">Từ ngày
            <input type="date" className={inputClass} value={from} max={to || undefined}
              onChange={event => setFrom(event.target.value)} />
          </label>
          <label className="text-sm">Đến ngày
            <input type="date" className={inputClass} value={to} min={from || undefined}
              onChange={event => setTo(event.target.value)} />
          </label>
          {hasFilter && <button type="button" className="sc-button sc-button--secondary" onClick={() => { setFrom(''); setTo('') }}>Xóa bộ lọc</button>}
          </div>
        </div>
        {invalidRange && <p role="alert" className="text-sm text-red-700">Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</p>}
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        {metrics.map(([label, icon, value]) => (
          <section key={label} className="sc-panel grid content-start gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-primary"><Icon name={icon} />{label}</h2>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {loading ? 'Đang tải…' : orders.error || invalidRange ? '—' : value}
            </p>
          </section>
        ))}
      </div>

      {/* Danh sách đơn hàng hoàn tất */}
      <section className="rounded-3xl border border-primary/15 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base text-primary flex items-center gap-2">
              <Icon name="receipt_long" className="text-primary text-lg" />
              <span>Đơn hàng hoàn tất</span>
            </h3>
          </div>
        </div>

        {orders.status === 'loading' || orders.refreshing ? (
          <p role="status" className="sc-vendor-table-state">Đang tải danh sách đơn hoàn tất…</p>
        ) : orders.error ? (
          <p className="sc-vendor-table-state">
            {orders.error.status === 403
              ? 'Chưa có quyền xem đơn hàng của cửa hàng này.'
              : 'Chưa tải được danh sách đơn hàng.'}
          </p>
        ) : invalidRange ? null : completedList.length ? (
          <DataTable label="Đơn hàng hoàn tất" className="sc-vendor-orders-table">
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '23%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Mã đơn</th>
                <th scope="col">Khách hàng</th>
                <th scope="col">Hoàn tất lúc</th>
                <th scope="col">Giá trị đơn</th>
                <th scope="col" className="sc-table-actions">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {completedList.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong className="text-primary font-semibold">
                      {displayReference(order.id, 'ORD', order.orderNumber)}
                    </strong>
                  </td>
                  <td>{order.customerName || 'Khách hàng'}</td>
                  <td>{formatOrderDate(order.completedAt)}</td>
                  <td className="tabular-nums font-bold text-wine text-base">
                    {formatOrderMoney(order.totalAmount, order.currency)}
                  </td>
                  <td className="sc-table-actions">
                    <RecordActionButton
                      type="button"
                      className="sc-button sc-record-action cursor-pointer"
                      onClick={() => setSelectedOrderId(order.id)}
                     action="view" label="Xem chi tiết" />
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyPanel
            title={hasFilter ? "Không có đơn hoàn tất trong khoảng ngày đã chọn" : "Chưa có đơn hàng hoàn tất"}
            description={hasFilter ? "Hãy chọn khoảng ngày khác để xem thêm đơn." : "Các đơn đã hoàn tất sẽ hiển thị tại đây."}
            icon="shopping_bag"
            action={
              <button
                type="button"
                className="sc-button sc-button--secondary cursor-pointer"
                onClick={() => onNavigate('vendor-orders?bakeryId=' + encodeURIComponent(bakeryId))}
              >
                Quản lý đơn hàng
              </button>
            }
          />
        )}
      </section>
    </div>
    </>
  )
}

export default function VendorRevenuePage({ onNavigate, routeSearch }) {
  const owner = useVendorBakery(routeSearch)
  const { bakeryId } = owner

  return (
    <VendorFrame owner={owner} title="Doanh thu" activeTab="revenue" bakeryId={bakeryId} onNavigate={onNavigate}>
      <div className="sc-vendor-dashboard">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <div>
            <h1 className="text-xl font-bold text-wine">Tổng quan bán hàng</h1>
          </div>
          {bakeryId && (
            <button
              type="button"
              onClick={() => onNavigate('vendor-orders?bakeryId=' + encodeURIComponent(bakeryId))}
              className="px-3.5 py-1.5 rounded-full border border-primary/20 bg-white hover:bg-rose-50/50 text-xs font-semibold text-wine transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Icon name="shopping_bag" className="text-sm" />
              <span>Quản lý đơn hàng</span>
            </button>
          )}
        </div>



        {bakeryId ? (
          <CompletedRevenueContent key={bakeryId} bakeryId={bakeryId} onNavigate={onNavigate} />
        ) : (
          <div className="space-y-4">
            <section className={panelClass}>
              <EmptyPanel
                title="Chọn cửa hàng để xem doanh thu"
                description="Vui lòng chọn cửa hàng bạn có quyền quản lý để xem báo cáo doanh thu ước tính."
                icon="storefront"
              />
            </section>
          </div>
        )}
      </div>
    </VendorFrame>
  )
}
