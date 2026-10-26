import React, { useState, useMemo } from 'react'
import AdminSidebar from '../../../layouts/admin/AdminSidebar'
import AdminHeader from '../../../layouts/admin/AdminHeader'
import AdminOrderDetailModal from './AdminOrderDetailModal'
import OrderStatusBadge from './OrderStatusBadge'
import { getAdminOrderStatus } from './adminOrderStatus'
import { getBakeryBadgeColor } from './bakeryBadgeColors'
import { useAppData } from '../../../context/AppDataContext'

import { INITIAL_ADMIN_ORDERS as INITIAL_ORDERS } from '../../../mockData/admin/orders.js'

export default function AdminOrdersEscrowPage({ onNavigate }) {
  const { kanbanOrders } = useAppData()

  // Sync context kanban orders into Admin order list
  const contextOrdersFormatted = useMemo(() => {
    const list = []
    if (!kanbanOrders) return list

    kanbanOrders.pending?.forEach((o) => {
      list.push({
        id: o.id,
        customerName: o.customer || 'Khách hàng SweetCake',
        customerPhone: o.phone || '0901234567',
        vendorName: o.bakery || 'Sweet Bakery',
        vendorPhone: '0908889999',
        cakeTitle: o.title || 'Bánh Kem Nghệ Thuật',
        cakePrice: o.price || 1000000,
        depositAmount: o.price || 1000000,
        escrowStatus: 'locked',
        progressStage: 'baking',
        orderType: 'bespoke',
        image: o.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80',
        createdDate: 'Hôm nay',
        isDelivered: false,
      })
    })

    kanbanOrders.baking?.forEach((o) => {
      list.push({
        id: o.id,
        customerName: o.customer || 'Khách hàng SweetCake',
        customerPhone: o.phone || '0901234567',
        vendorName: o.bakery || 'Sweet Bakery',
        vendorPhone: '0908889999',
        cakeTitle: o.title || 'Bánh Kem Nghệ Thuật',
        cakePrice: o.price || 1000000,
        depositAmount: o.price || 1000000,
        escrowStatus: 'locked',
        progressStage: 'baking',
        orderType: 'bespoke',
        image: o.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80',
        createdDate: 'Hôm nay',
        isDelivered: false,
      })
    })

    kanbanOrders.delivering?.forEach((o) => {
      list.push({
        id: o.id,
        customerName: o.customer || 'Khách hàng SweetCake',
        customerPhone: o.phone || '0901234567',
        vendorName: o.bakery || 'Sweet Bakery',
        vendorPhone: '0908889999',
        cakeTitle: o.title || 'Bánh Kem Nghệ Thuật',
        cakePrice: o.price || 1000000,
        depositAmount: o.price || 1000000,
        escrowStatus: 'locked',
        progressStage: 'delivering',
        orderType: 'bespoke',
        image: o.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80',
        createdDate: 'Hôm nay',
        isDelivered: false,
      })
    })

    kanbanOrders.completed?.forEach((o) => {
      list.push({
        id: o.id,
        customerName: o.customer || 'Khách hàng SweetCake',
        customerPhone: o.phone || '0901234567',
        vendorName: o.bakery || 'Sweet Bakery',
        vendorPhone: '0908889999',
        cakeTitle: o.title || 'Bánh Kem Nghệ Thuật',
        cakePrice: o.price || 1000000,
        depositAmount: o.price || 1000000,
        escrowStatus: 'released',
        progressStage: 'completed',
        orderType: 'bespoke',
        image: o.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80',
        createdDate: 'Hôm nay',
        isDelivered: true,
      })
    })

    return list
  }, [kanbanOrders])

  const [orders, setOrders] = useState(() => [...contextOrdersFormatted, ...INITIAL_ORDERS])

  React.useEffect(() => {
    if (contextOrdersFormatted.length > 0) {
      setOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o.id))
        const newItems = contextOrdersFormatted.filter((c) => !existingIds.has(c.id))
        if (newItems.length === 0) return prev
        return [...newItems, ...prev]
      })
    }
  }, [contextOrdersFormatted])
  const [activeStageTab, setActiveStageTab] = useState('all') // 'all' | 'pending' | 'baking' | 'delivering' | 'delivered' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')

  // Modals
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null)
  const [selectedOrderForGps, setSelectedOrderForGps] = useState(null)
  const [showEscrowConfigModal, setShowEscrowConfigModal] = useState(false)
  const [showRadarModal, setShowRadarModal] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Stage Tab
      if (activeStageTab === 'baking' && o.progressStage !== 'baking') return false
      if (activeStageTab === 'delivering' && o.progressStage !== 'delivering') return false
      if (activeStageTab === 'delivered' && !o.isDelivered && o.progressStage !== 'completed') return false
      if (activeStageTab === 'completed' && o.escrowStatus !== 'released') return false

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchId = o.id.toLowerCase().includes(q)
        const matchCust = o.customerName.toLowerCase().includes(q)
        const matchVendor = o.vendorName.toLowerCase().includes(q)
        const matchCake = o.cakeTitle.toLowerCase().includes(q)
        if (!matchId && !matchCust && !matchVendor && !matchCake) return false
      }

      // Type Filter
      if (typeFilter !== 'all' && o.orderType !== typeFilter) return false

      // Price Filter
      if (priceFilter === 'low' && o.cakePrice >= 1000000) return false
      if (priceFilter === 'mid' && (o.cakePrice < 1000000 || o.cakePrice > 3000000)) return false
      if (priceFilter === 'high' && o.cakePrice <= 3000000) return false

      return true
    })
  }, [orders, activeStageTab, searchQuery, typeFilter, priceFilter, dateFilter])

  // Escrow Disbursement Action
  const handleDisburseEscrow = (orderId) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
            ...o,
            escrowStatus: 'released',
            escrowStatusLabel: 'Đã Giải Ngân',
            escrowContractId: `Đã chuyển ${(o.cakePrice * 0.9).toLocaleString('vi-VN')}đ về ví`,
            progressStage: 'completed',
            stageLabel: 'Đã Hoàn Tất',
            progressPercent: 100,
          }
          : o
      )
    )
    if (selectedOrderForDetail && selectedOrderForDetail.id === orderId) {
      setSelectedOrderForDetail((prev) => ({
        ...prev,
        escrowStatus: 'released',
        escrowStatusLabel: 'Đã Giải Ngân',
        escrowContractId: `Đã chuyển ${(prev.cakePrice * 0.9).toLocaleString('vi-VN')}đ về ví`,
        progressStage: 'completed',
        stageLabel: 'Đã Hoàn Tất',
        progressPercent: 100,
      }))
    }
    showToast(`Đã giải ngân thành công khoản cọc cho đơn #${orderId}!`)
  }

  const handleResetFilters = () => {
    setActiveStageTab('all')
    setSearchQuery('')
    setTypeFilter('all')
    setPriceFilter('all')
    setDateFilter('today')
    showToast('Đã đặt lại toàn bộ bộ lọc.')
  }
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="bg-background font-body text-admin-body text-on-surface antialiased min-h-screen">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-secondary/40 animate-bounce">
          <span className="material-symbols-outlined text-secondary-fixed text-xl">
            check_circle
          </span>
          <span className="text-admin-body font-medium">{toastMessage}</span>
        </div>
      )}

      {/* UNIFIED ADMIN SIDEBAR */}
      <AdminSidebar
        activeTab="admin-orders"
        onNavigate={onNavigate}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN SHELL */}
      <div className="md:pl-64 flex-1">
        <AdminHeader
          title="Đơn hàng"
          showSearch={false}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Tìm đơn hàng..."
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* MAIN BODY CONTENT */}
        <main className="w-full pt-16 min-h-screen bg-background pb-8">
          <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-2 space-y-3">

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: 'Đơn trong tháng', value: '3.420', unit: 'đơn' },
                { label: 'Ký quỹ', value: '382.400.000', unit: 'đ' },
                { label: 'Đang giao', value: '48', unit: 'xe' },
                { label: 'Cần hỗ trợ', value: '2', unit: 'ca xử lý' },
              ].map(({ label, value, unit }) => (
                <div key={label} className="bg-surface-container-lowest px-4 py-3 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] border border-surface-container-high/60">
                  <p className="text-admin-body text-on-surface-variant font-semibold">{label}</p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="text-admin-metric text-primary font-body font-bold tracking-tight tabular-nums">{value}</span>
                    <span className="font-label-md text-admin-body text-on-surface-variant font-medium">{unit}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* 3. Thanh Tab Trạng Thái Đơn & Bộ Lọc Thông Minh */}
            <div className="space-y-3">
              {/* Tabs Level */}
              <div className="flex items-center overflow-x-auto pb-1 gap-2 bg-surface-container-low p-1.5 rounded-2xl border border-surface-container-high/60">
                <button
                  type="button"
                  onClick={() => setActiveStageTab('all')}
                  className={`px-4 py-2 rounded-xl font-label-md text-admin-body font-semibold whitespace-nowrap transition-all shadow-sm ${activeStageTab === 'all'
                      ? 'bg-primary-container text-on-primary font-bold'
                      : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  Tất cả (186)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStageTab('baking')}
                  className={`px-4 py-2 rounded-xl font-label-md text-admin-body font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeStageTab === 'baking'
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <span>Đang làm</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-admin-body font-bold">
                    54
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStageTab('delivering')}
                  className={`px-4 py-2 rounded-xl font-label-md text-admin-body font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeStageTab === 'delivering'
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <span>Đang giao</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-admin-body font-bold">
                    48
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStageTab('delivered')}
                  className={`px-4 py-2 rounded-xl font-label-md text-admin-body font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeStageTab === 'delivered'
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <span>Đã giao</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-admin-body font-bold">
                    28
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStageTab('completed')}
                  className={`px-4 py-2 rounded-xl font-label-md text-admin-body font-semibold whitespace-nowrap transition-all ${activeStageTab === 'completed'
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  Đã giải ngân
                </button>

                <button
                  type="button"
                  onClick={() =>
                    showToast('Có 2 đơn hàng đã được hỗ trợ hoàn tiền cọc bảo hiểm.')
                  }
                  className="px-4 py-2 rounded-xl hover:bg-surface-container text-error hover:bg-error-container/30 font-label-md text-admin-body font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ml-auto"
                >
                  <span>Hủy / Hoàn cọc</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-error-container text-on-error-container text-admin-body font-bold">
                    2
                  </span>
                </button>
              </div>

              {/* Bộ Lọc Thông Minh & Thanh Tìm Kiếm */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] flex flex-col 2xl:flex-row gap-3 items-stretch 2xl:items-center justify-between border border-surface-container-high/60">
                <div className="relative flex-1 min-w-0">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low text-on-surface placeholder:text-outline text-admin-body font-body-sm rounded-xl focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary/40 transition-all font-medium border-none shadow-sm"
                    aria-label="Tìm đơn hàng"
                    placeholder="Tìm mã đơn, khách, tiệm, sản phẩm..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-xs">
                        close
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5 bg-surface-container-low px-3.5 py-2 rounded-xl border border-surface-container-high/60">
                    <span className="font-label-sm text-admin-body text-on-surface-variant font-medium">
                      Phân loại:
                    </span>
                    <select
                      className="bg-transparent font-label-md text-admin-body text-on-surface focus:outline-none cursor-pointer font-medium border-none"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="all">Tất cả đơn</option>
                      <option value="rfq">Bánh đặt riêng</option>
                      <option value="catalog">Bánh có sẵn</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-surface-container-low px-3.5 py-2 rounded-xl border border-surface-container-high/60">
                    <span className="font-label-sm text-admin-body text-on-surface-variant font-medium">
                      Mức giá:
                    </span>
                    <select
                      className="bg-transparent font-label-md text-admin-body text-on-surface focus:outline-none cursor-pointer font-medium border-none"
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                    >
                      <option value="all">Mọi phân khúc</option>
                      <option value="low">Dưới 1.000.000đ</option>
                      <option value="mid">1.000.000đ - 3.000.000đ</option>
                      <option value="high">Trên 3.000.000đ</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-surface-container-low px-3.5 py-2 rounded-xl border border-surface-container-high/60">
                    <select
                      className="bg-transparent font-label-md text-admin-body text-on-surface focus:outline-none cursor-pointer font-medium border-none"
                      aria-label="Ngày giao"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      <option value="today">Giao Hôm Nay</option>
                      <option value="tomorrow">Giao Ngày Mai</option>
                      <option value="weekend">Đơn Cuối Tuần</option>
                      <option value="all_week">Toàn bộ 7 ngày</option>
                    </select>
                  </div>

                  <button
                    className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
                    title="Làm mới bộ lọc"
                    aria-label="Làm mới bộ lọc"
                    type="button"
                    onClick={handleResetFilters}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      restart_alt
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Bảng Dữ Liệu Chi Tiết Đơn Hàng Toàn Sàn (Master Orders Table) */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] overflow-hidden border border-surface-container-high/60">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left border-collapse min-w-[1040px] text-admin-body">
                  <colgroup>
                    <col className="w-[16%]" />
                    <col className="w-[14%]" />
                    <col className="w-[15%]" />
                    <col className="w-[19%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-admin-body uppercase tracking-wider">
                      {['Mã đơn', 'Khách hàng', 'Tiệm bánh', 'Sản phẩm / Giá trị', 'Trạng thái', 'Ký quỹ', 'Thao tác'].map((label) => (
                        <th key={label} scope="col" className={`px-3 py-3 font-semibold first:pl-4 last:pr-4 ${label === 'Thao tác' ? 'text-right' : ''}`}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60 text-on-surface">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center">
                          <p className="font-semibold text-primary">Không tìm thấy đơn hàng</p>
                          <button type="button" onClick={handleResetFilters} className="mt-3 px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold hover:bg-secondary">Xóa bộ lọc</button>
                        </td>
                      </tr>
                    ) : filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 pl-4 pr-3 align-middle font-mono font-semibold text-primary break-words">#{order.id}</td>
                        <td className="py-3 px-3 align-middle">
                          <p className="font-label-md text-admin-body font-semibold break-words">{order.customerName}</p>
                          {order.customerPhone && <p className="mt-1 font-label-sm text-admin-body leading-5 text-on-surface-variant tabular-nums">{order.customerPhone}</p>}
                        </td>
                        <td className="py-3 px-3 align-middle">
                          <span className={`inline-block max-w-full rounded-full px-3 py-1.5 font-label-sm text-admin-body leading-5 font-semibold break-words ${getBakeryBadgeColor(order.vendorName)}`}>{order.vendorName}</span>
                        </td>
                        <td className="py-3 px-3 align-middle">
                          <p className="line-clamp-2 font-label-md text-admin-body font-semibold break-words" title={order.cakeTitle}>{order.cakeTitle}</p>
                          <p className="mt-1 font-semibold text-secondary tabular-nums">{order.cakePriceFormatted ?? `${order.cakePrice.toLocaleString('vi-VN')}đ`}</p>
                        </td>
                        <td className="py-3 px-3 align-middle"><OrderStatusBadge status={getAdminOrderStatus(order)} compact /></td>
                        <td className="py-3 px-3 align-middle">
                          <span className={`inline-flex rounded-md px-2.5 py-1 font-label-sm text-admin-body font-semibold ${order.escrowStatus === 'released' ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface'}`}>
                            {{ locked: 'Đang giữ cọc', waiting_release: 'Chờ khách nhận', released: 'Đã giải ngân' }[order.escrowStatus] || order.escrowStatusLabel || 'Chưa có dữ liệu'}
                          </span>
                        </td>
                        <td className="py-3 pl-3 pr-4 align-middle text-right">
                          <button type="button" onClick={() => setSelectedOrderForDetail(order)} aria-label={`Chi tiết đơn ${order.id}`} className="min-h-10 px-3 py-2 rounded-xl bg-primary-container text-on-primary font-semibold whitespace-nowrap hover:bg-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Chi tiết</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phân Trang Chuẩn Xác */}
              <div className="px-6 py-3.5 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 font-body-sm text-admin-body text-on-surface-variant border-t border-surface-container-high/60">
                <div className="flex items-center gap-2">
                  <span>Hiển thị</span>
                  <select className="bg-surface-container px-2.5 py-1 rounded-lg text-on-surface font-medium focus:outline-none cursor-pointer border border-surface-container-high">
                    <option value="6">6 đơn / trang</option>
                    <option value="15">15 đơn / trang</option>
                    <option value="30">30 đơn / trang</option>
                  </select>
                  <span>
                    trên tổng số{' '}
                    <strong className="font-semibold text-primary">186</strong>{' '}
                    đơn hôm nay
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors disabled:opacity-40"
                    disabled
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_left
                    </span>
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-on-primary font-label-sm text-admin-body font-semibold shadow-sm"
                    type="button"
                  >
                    1
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-admin-body transition-colors"
                    type="button"
                  >
                    2
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-admin-body transition-colors"
                    type="button"
                  >
                    3
                  </button>
                  <span className="px-1 text-on-surface-variant">...</span>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-admin-body transition-colors"
                    type="button"
                  >
                    31
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </div>


          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CHI TIẾT ĐƠN HÀNG & HỢP ĐỒNG ESCROW              */}
      {/* ========================================================= */}
      {selectedOrderForDetail && (
        <AdminOrderDetailModal
          order={selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
          onDisburse={handleDisburseEscrow}
          onTrackDelivery={(order) => {
            setSelectedOrderForDetail(null)
            setSelectedOrderForGps(order)
          }}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 2: RADAR GPS XE LẠNH TOÀN SÀN                       */}
      {/* ========================================================= */}
      {(showRadarModal || selectedOrderForGps) && (
        <div className="fixed inset-0 z-50 bg-modal-overlay backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in duration-200 border border-secondary/20">
            <div className="p-6 bg-primary-container text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[20px]">
                    share_location
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-admin-heading font-bold font-serif">
                    Theo dõi giao hàng
                  </h3>
                  <p className="text-admin-body text-secondary-fixed ">
                    {selectedOrderForGps
                      ? `Giám sát trực tuyến đơn #${selectedOrderForGps.id}`
                      : 'Đang có 48 xe lạnh hoạt động giao tiệc'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRadarModal(false)
                  setSelectedOrderForGps(null)
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-admin-body">
              <div className="h-56 bg-surface-container rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-surface-container-high">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#D48C95_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary animate-bounce shadow-lg">
                    <span className="material-symbols-outlined text-2xl">
                      local_shipping
                    </span>
                  </span>
                  <p className="font-bold text-primary mt-2 text-admin-body">
                    {selectedOrderForGps?.deliveryVehicle || 'Xe Van Suzuki Carry (51D-892.44)'}
                  </p>
                  <p className="text-admin-body text-secondary font-bold">
                    Nhiệt độ thùng lạnh: 4.8°C • Độ rung: 0.02G (Chuẩn an toàn)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-surface-container rounded-xl">
                  <span className="text-admin-body text-on-surface-variant block">Tốc độ xe</span>
                  <span className="font-bold text-primary text-admin-body">32 km/h</span>
                </div>
                <div className="p-3 bg-surface-container rounded-xl">
                  <span className="text-admin-body text-on-surface-variant block">Dự kiến đến</span>
                  <span className="font-bold text-secondary text-admin-body">12 phút</span>
                </div>
                <div className="p-3 bg-surface-container rounded-xl">
                  <span className="text-admin-body text-on-surface-variant block">Khoảng cách</span>
                  <span className="font-bold text-primary text-admin-body">2.8 km</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => {
                    setShowRadarModal(false)
                    setSelectedOrderForGps(null)
                  }}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-admin-body font-bold hover:bg-secondary"
                >
                  Đóng Bản Đồ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CẤU HÌNH THỜI GIAN CHỜ ESCROW                    */}
      {/* ========================================================= */}
      {showEscrowConfigModal && (
        <div className="fixed inset-0 z-50 bg-modal-overlay backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in duration-200 border border-secondary/20">
            <div className="p-5 bg-primary-container text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary-fixed text-lg">
                  lock_clock
                </span>
                <h3 className="font-headline-sm text-admin-heading font-bold font-serif">
                  Thời gian nghiệm thu
                </h3>
              </div>
              <button
                onClick={() => setShowEscrowConfigModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-admin-body">
              <div>
                <label className="block text-admin-body font-bold text-primary mb-1">
                  Thời gian chờ sau giao:
                </label>
                <select className="w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-admin-body font-medium">
                  <option value="2">2 giờ (Tiêu chuẩn bánh tiệc sinh nhật)</option>
                  <option value="4">4 giờ (Bánh cưới Haute Couture nhiều tầng)</option>
                  <option value="12">12 giờ (Sự kiện doanh nghiệp quy mô lớn)</option>
                  <option value="24">24 giờ (Đơn ngoại tỉnh)</option>
                </select>
              </div>

              <div className="p-3 bg-surface-container rounded-xl text-admin-body text-on-surface-variant leading-relaxed">
                Hết thời gian nghiệm thu, tiền cọc tự động chuyển về ví tiệm.
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setShowEscrowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high text-admin-body font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Đã lưu cấu hình thời gian thẩm định Escrow Vault!')
                    setShowEscrowConfigModal(false)
                  }}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-admin-body font-bold hover:bg-secondary"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
