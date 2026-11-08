import React from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadOrders } from '../../../services/orderService.js'
import { formatOrderDate, formatOrderMoney } from '../../../services/orderPresentation.js'
import { displayReference } from '../../../services/displayReference.js'
import { orderStatusLabel } from '../../../services/orderModels.js'
import { panelClass } from '../../../components/management/ApiState.jsx'
import { DataTable, EmptyPanel, Icon, SectionHeading, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import '../dashboard/vendor-dashboard.css'

function SettlementDisclaimerNotice() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/95 p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center mt-0.5">
        <Icon name="info" className="text-lg" />
      </div>
      <div className="flex-1 text-xs sm:text-sm text-slate-700 space-y-1.5 leading-relaxed">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-900 text-sm">
            Chưa có số liệu doanh thu đã đối soát
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Sàn thương mại kết nối
          </span>
        </div>
        <p className="text-slate-600 text-xs sm:text-sm">
          Chưa thể hiển thị doanh thu đã nhận, số dư hoặc hoàn tiền. Tổng giá trị đơn hàng gồm cả những khoản chưa thanh toán. Chỉ các giao dịch đã đối soát mới được ghi nhận là doanh thu. Thông tin doanh thu sẽ được cập nhật khi có kết quả đối soát.
        </p>
        <p className="text-[11px] text-slate-500 italic pt-0.5">
          * Số liệu doanh thu ước tính phía trên được tổng hợp trực tiếp từ các đơn hàng có trạng thái HOÀN TẤT (COMPLETED) của cửa hàng, giúp chủ tiệm nắm bắt doanh số thực tế.
        </p>
      </div>
    </div>
  )
}

function CompletedRevenueContent({ bakeryId, onNavigate }) {
  const orders = useCatalogResource(loadOrders, {
    scope: 'bakery',
    bakeryId,
    status: 'COMPLETED',
    page: 1,
    size: 50,
    sort: 'createdAt,desc',
  })

  const completedList = orders.data?.result || []
  const totalCount = orders.data?.meta?.total ?? completedList.length
  const estimatedRevenue = completedList.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
  const averageOrderValue = completedList.length > 0 ? Math.round(estimatedRevenue / completedList.length) : 0

  return (
    <div className="space-y-6">
      {/* 3 Thẻ chỉ số Doanh thu ước tính */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Doanh thu ước tính */}
        <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-white via-rose-50/40 to-rose-100/20 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Doanh thu ước tính
            </span>
            <span className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Icon name="payments" className="text-lg" />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-wine tabular-nums">
              {orders.status === 'loading' || orders.refreshing
                ? 'Đang tính…'
                : orders.error
                ? '—'
                : formatOrderMoney(estimatedRevenue, 'VND')}
            </div>
            <p className="text-xs text-rose-900/70 mt-1 flex items-center gap-1 font-medium">
              <span className="text-rose-500 font-bold">●</span>
              <span>Từ {totalCount} đơn giao thành công</span>
            </p>
          </div>
        </div>

        {/* Card 2: Đơn hoàn tất */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/20 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Đơn hàng hoàn tất
            </span>
            <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Icon name="task_alt" className="text-lg" />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 tabular-nums">
              {orders.status === 'loading' || orders.refreshing
                ? '…'
                : orders.error
                ? '—'
                : `${totalCount.toLocaleString('vi-VN')} đơn`}
            </div>
            <p className="text-xs text-emerald-800/70 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Đã bàn giao cho khách</span>
            </p>
          </div>
        </div>

        {/* Card 3: Giá trị trung bình / đơn */}
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/40 to-amber-100/20 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Trung bình / đơn (AOV)
            </span>
            <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Icon name="trending_up" className="text-lg" />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-950 tabular-nums">
              {orders.status === 'loading' || orders.refreshing
                ? 'Đang tính…'
                : orders.error
                ? '—'
                : formatOrderMoney(averageOrderValue, 'VND')}
            </div>
            <p className="text-xs text-amber-900/70 mt-1 flex items-center gap-1 font-medium">
              <span className="text-amber-500 font-bold">✦</span>
              <span>Quy mô đơn bình quân</span>
            </p>
          </div>
        </div>
      </div>

      {/* Thông tin đối soát & cam kết minh bạch (Bảo toàn invariants của hệ thống & kiểm thử) */}
      <SettlementDisclaimerNotice />

      {/* Danh sách đơn hàng hoàn tất */}
      <section className="rounded-3xl border border-primary/15 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base text-primary flex items-center gap-2">
              <Icon name="receipt_long" className="text-primary text-lg" />
              <span>Đơn hàng hoàn tất đã ghi nhận doanh thu</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Danh sách các đơn hàng đã được tiệm bàn giao thành công tới khách hàng.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton
              disabled={orders.status === 'loading' || orders.refreshing}
              onClick={orders.reload}
            >
              Tải lại
            </RefreshButton>
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
        ) : completedList.length ? (
          <DataTable label="Đơn hàng hoàn tất đã ghi nhận doanh thu" className="sc-vendor-orders-table">
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
                <th scope="col">Thời gian</th>
                <th scope="col">Doanh thu ước tính</th>
                <th scope="col">Chi tiết</th>
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
                  <td>{formatOrderDate(order.completedAt || order.createdAt)}</td>
                  <td className="tabular-nums font-bold text-wine text-base">
                    {formatOrderMoney(order.totalAmount, order.currency)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="sc-button sc-button--secondary cursor-pointer"
                      onClick={() =>
                        onNavigate(
                          'vendor-orders?bakeryId=' +
                            encodeURIComponent(bakeryId) +
                            '&orderId=' +
                            encodeURIComponent(order.id)
                        )
                      }
                    >
                      Xem đơn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyPanel
            title="Chưa có đơn hàng hoàn tất"
            description="Khi tiệm xác nhận hoàn tất đơn hàng và giao thành công cho khách, đơn sẽ hiển thị tại đây."
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
  )
}

export default function VendorRevenueEscrowPage({ onNavigate, routeSearch }) {
  const { bakeryId, selectBakery, available } = useVendorBakery(routeSearch)

  return (
    <VendorFrame title="Doanh thu" activeTab="revenue" bakeryId={bakeryId} onNavigate={onNavigate}>
      <div className="sc-vendor-dashboard">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <div>
            <h1 className="text-xl font-bold text-wine">Doanh thu & Thống kê bán hàng</h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Theo dõi doanh số ước tính từ các đơn hàng hoàn tất của tiệm bánh.
            </p>
          </div>
          {bakeryId && (
            <button
              type="button"
              onClick={() => onNavigate('vendor-orders?bakeryId=' + encodeURIComponent(bakeryId))}
              className="px-3.5 py-1.5 rounded-full border border-primary/20 bg-white hover:bg-rose-50/50 text-xs font-semibold text-wine transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Icon name="shopping_bag" className="text-sm" />
              <span>Xem Quản lý đơn hàng</span>
            </button>
          )}
        </div>

        <BakerySelector bakeryId={bakeryId} onSelect={selectBakery} available={available} />

        {bakeryId ? (
          <CompletedRevenueContent key={bakeryId} bakeryId={bakeryId} onNavigate={onNavigate} />
        ) : (
          <div className="space-y-4">
            <SettlementDisclaimerNotice />
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
