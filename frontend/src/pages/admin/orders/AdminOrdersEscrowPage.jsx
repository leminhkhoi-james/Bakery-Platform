import React, { useState, useMemo } from 'react'
import AdminSidebar from '../../../layouts/admin/AdminSidebar'
import AdminHeader from '../../../layouts/admin/AdminHeader'
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
    <div className="bg-background font-body text-body-md text-on-surface antialiased min-h-screen">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-secondary/40 animate-bounce">
          <span className="material-symbols-outlined text-secondary-fixed text-xl">
            check_circle
          </span>
          <span className="text-sm font-medium">{toastMessage}</span>
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
      <div className="md:pl-72 flex-1">
        <AdminHeader
          title="Đơn Hàng & Giám Sát Escrow"
          subtitle="Giám sát quy trình khóa cọc, thanh toán bảo hộ & đối soát giải ngân 100%"
          contextBadge="Escrow Vault Active"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Tra cứu User, Tiệm bánh, Mã đơn #ORD..."
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* MAIN BODY CONTENT */}
        <main className="w-full pt-24 min-h-screen bg-background pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 space-y-6">

            {/* 2. Thẻ KPI Đơn Hàng & Ký Quỹ Escrow (4 metrics cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Card 1: Tổng Đơn Hàng */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] relative overflow-hidden flex flex-col justify-between group hover:shadow-[0_16px_36px_-6px_rgba(45,30,24,0.08)] transition-all border border-surface-container-high/60">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Tổng Đơn Trong Tháng
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif font-bold">
                        3.420
                      </span>
                      <span className="font-label-md text-xs text-on-surface-variant">
                        đơn
                      </span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[24px]">
                      cake
                    </span>
                  </div>
                </div>

              </div>

              {/* Card 2: Escrow Vault */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] relative overflow-hidden flex flex-col justify-between group hover:shadow-[0_16px_36px_-6px_rgba(45,30,24,0.08)] transition-all border border-surface-container-high/60">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Ký Quỹ Tạm Khóa (Escrow Vault)
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-headline-md text-2xl text-primary tracking-tight font-serif font-bold">
                        382.400.000
                      </span>
                      <span className="font-label-md text-sm text-secondary font-bold">
                        đ
                      </span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[24px]">
                      verified_user
                    </span>
                  </div>
                </div>

              </div>

              {/* Card 3: Xe Lạnh Chuyên Dụng */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] relative overflow-hidden flex flex-col justify-between group hover:shadow-[0_16px_36px_-6px_rgba(45,30,24,0.08)] transition-all border border-surface-container-high/60">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Đang Giao Xe Lạnh 4°C - 6°C
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif font-bold">
                        48
                      </span>
                      <span className="font-label-md text-xs text-on-surface-variant">
                        xe trực tuyến
                      </span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[24px]">
                      local_shipping
                    </span>
                  </div>
                </div>

              </div>

              {/* Card 4: Khiếu Nại & SLA */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] relative overflow-hidden flex flex-col justify-between group hover:shadow-[0_16px_36px_-6px_rgba(45,30,24,0.08)] transition-all border border-surface-container-high/60">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Cần Hỗ Trợ / Khiếu Nại
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif font-bold">
                        2
                      </span>
                      <span className="font-label-md text-xs text-on-surface-variant">
                        ca xử lý
                      </span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-error-container flex items-center justify-center text-on-error-container group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[24px]">
                      support_agent
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. Thanh Tab Trạng Thái Đơn & Bộ Lọc Thông Minh */}
            <div className="space-y-4">
              {/* Tabs Level */}
              <div className="flex items-center overflow-x-auto pb-1 gap-2 bg-surface-container-low p-1.5 rounded-2xl border border-surface-container-high/60">
                <button
                  type="button"
                  onClick={() => setActiveStageTab('all')}
                  className={`px-4 py-2 rounded-xl font-label-md text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${activeStageTab === 'all'
                      ? 'bg-primary-container text-on-primary font-bold'
                      : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  Tất Cả Đơn (186 hôm nay)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStageTab('baking')}
                  className={`px-4 py-2 rounded-xl font-label-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeStageTab === 'baking'
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <span>Đang Nướng & Tạo Hình</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold">
                    54
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStageTab('delivering')}
                  className={`px-4 py-2 rounded-xl font-label-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeStageTab === 'delivering'
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                  <span>Đang Giao Xe Lạnh</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-[11px] font-bold">
                    48
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStageTab('delivered')}
                  className={`px-4 py-2 rounded-xl font-label-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeStageTab === 'delivered'
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <span>Đã Bàn Giao & Nghiệm Thu</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-[11px] font-bold">
                    28
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStageTab('completed')}
                  className={`px-4 py-2 rounded-xl font-label-md text-xs font-semibold whitespace-nowrap transition-all ${activeStageTab === 'completed'
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  Đã Giải Ngân Escrow (Hoàn Tất)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    showToast('Có 2 đơn hàng đã được hỗ trợ hoàn tiền cọc bảo hiểm.')
                  }
                  className="px-4 py-2 rounded-xl hover:bg-surface-container text-error hover:bg-error-container/30 font-label-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ml-auto"
                >
                  <span>Hủy / Hoàn Cọc</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold">
                    2
                  </span>
                </button>
              </div>

              {/* Bộ Lọc Thông Minh & Thanh Tìm Kiếm */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between border border-surface-container-high/60">
                <div className="relative flex-1 max-w-md">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm font-body-sm rounded-xl focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary/40 transition-all font-medium border-none shadow-sm"
                    placeholder="Tìm theo mã #ORD, tên khách, số điện thoại, xưởng bánh..."
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
                    <span className="font-label-sm text-xs text-on-surface-variant font-medium">
                      Phân loại:
                    </span>
                    <select
                      className="bg-transparent font-label-md text-xs text-on-surface focus:outline-none cursor-pointer font-bold border-none"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="all">Tất cả đơn</option>
                      <option value="rfq">AI Custom RFQ (Độc bản)</option>
                      <option value="catalog">Bánh Catalog Sẵn Có</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-surface-container-low px-3.5 py-2 rounded-xl border border-surface-container-high/60">
                    <span className="font-label-sm text-xs text-on-surface-variant font-medium">
                      Mức giá:
                    </span>
                    <select
                      className="bg-transparent font-label-md text-xs text-on-surface focus:outline-none cursor-pointer font-bold border-none"
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                    >
                      <option value="all">Mọi phân khúc</option>
                      <option value="low">Dưới 1.000.000đ</option>
                      <option value="mid">1.000.000đ - 3.000.000đ</option>
                      <option value="high">Trên 3.000.000đ (Boutique cao cấp)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-surface-container-low px-3.5 py-2 rounded-xl border border-surface-container-high/60">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      event
                    </span>
                    <select
                      className="bg-transparent font-label-md text-xs text-on-surface focus:outline-none cursor-pointer font-bold border-none"
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
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-xs tracking-wider uppercase">
                      <th className="py-3.5 px-6 font-semibold">Mã Đơn & Giờ Đặt</th>
                      <th className="py-3.5 px-4 font-semibold">Khách Hàng & Nơi Nhận</th>
                      <th className="py-3.5 px-4 font-semibold">Xưởng Phụ Trách</th>
                      <th className="py-3.5 px-4 font-semibold">Chi Tiết Bánh & Giá Trị</th>
                      <th className="py-3.5 px-4 font-semibold min-w-[220px]">Tiến Độ & Nhiệt Độ</th>
                      <th className="py-3.5 px-4 font-semibold">Escrow Vault</th>
                      <th className="py-3.5 px-6 font-semibold text-right">Thao Tác Quản Trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60 font-body-sm text-body-sm text-on-surface">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">
                            receipt_long
                          </span>
                          <p className="text-body-md font-semibold text-primary">
                            Không tìm thấy đơn hàng nào khớp với bộ lọc
                          </p>
                          <button
                            onClick={handleResetFilters}
                            className="mt-3 px-4 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-secondary"
                          >
                            Xóa bộ lọc
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const isReleased = order.escrowStatus === 'released'
                        const isDelivering = order.progressStage === 'delivering'

                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-surface-container-low/50 transition-colors group"
                          >
                            {/* Mã Đơn & Giờ Đặt */}
                            <td className="py-4 px-6 align-top">
                              <div className="space-y-1">
                                <span className="font-label-md text-xs font-bold text-primary block font-mono">
                                  #{order.id}
                                </span>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full font-label-sm text-[10px] font-semibold ${order.orderType === 'rfq'
                                      ? 'bg-secondary-fixed text-on-secondary-fixed'
                                      : 'bg-surface-container-high text-on-surface-variant'
                                    }`}
                                >
                                  {order.orderTypeLabel}
                                </span>
                                <span className="text-on-surface-variant font-label-sm text-[11px] block">
                                  {order.time}
                                </span>
                              </div>
                            </td>

                            {/* Khách Hàng & Nơi Nhận */}
                            <td className="py-4 px-4 align-top">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-label-md text-xs font-bold text-on-surface">
                                    {order.customerName}
                                  </span>
                                </div>
                                <div
                                  className="text-on-surface-variant font-body-sm text-xs truncate max-w-xs"
                                  title={order.customerAddress}
                                >
                                  {order.customerAddress}
                                </div>
                                <div className="text-on-surface-variant font-label-sm text-[11px] font-mono">
                                  {order.customerPhone}
                                </div>
                              </div>
                            </td>

                            {/* Xưởng Phụ Trách */}
                            <td className="py-4 px-4 align-top">
                              <div className="space-y-0.5">
                                <span className="font-label-md text-xs font-bold text-primary block">
                                  {order.vendorName}
                                </span>
                                <span className="text-on-surface-variant font-label-sm text-[11px] flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-secondary">
                                    countertops
                                  </span>{' '}
                                  {order.chef}
                                </span>
                              </div>
                            </td>

                            {/* Chi Tiết Bánh & Giá Trị */}
                            <td className="py-4 px-4 align-top">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    className="w-11 h-11 rounded-xl object-cover bg-surface-container shrink-0 border border-surface-container-high"
                                    src={order.cakeImage}
                                    alt={order.cakeTitle}
                                  />
                                  <div>
                                    <span
                                      className="font-label-md text-xs font-bold text-on-surface block truncate max-w-[160px]"
                                      title={order.cakeTitle}
                                    >
                                      {order.cakeTitle}
                                    </span>
                                    <span className="text-on-surface-variant font-label-sm text-[11px]">
                                      {order.cakeSpec}
                                    </span>
                                  </div>
                                </div>
                                <div className="font-label-md text-sm font-bold text-secondary font-serif">
                                  {order.cakePriceFormatted}
                                </div>
                              </div>
                            </td>

                            {/* Tiến Độ & Nhiệt Độ */}
                            <td className="py-4 px-4 align-top">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-label-sm">
                                  <span
                                    className={`font-semibold ${isDelivering
                                        ? 'text-secondary flex items-center gap-1'
                                        : 'text-primary'
                                      }`}
                                  >
                                    {isDelivering && (
                                      <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                                    )}
                                    {order.stageLabel}
                                  </span>
                                  <span className="text-on-surface-variant text-[11px]">
                                    {order.stageStep}
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-secondary rounded-full transition-all"
                                    style={{ width: `${order.progressPercent}%` }}
                                  ></div>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[13px] text-secondary">
                                    {isDelivering ? 'thermostat' : 'info'}
                                  </span>
                                  <span>{order.telemetryInfo}</span>
                                </span>
                              </div>
                            </td>

                            {/* Escrow Vault */}
                            <td className="py-4 px-4 align-top">
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-[11px] font-semibold ${isReleased
                                      ? 'bg-primary-container text-on-primary'
                                      : 'bg-surface-container text-on-surface'
                                    }`}
                                >
                                  <span className="material-symbols-outlined text-[13px] text-secondary">
                                    {isReleased ? 'lock_open' : 'lock'}
                                  </span>
                                  <span>{order.escrowStatusLabel}</span>
                                </span>
                                <span className="block text-[11px] font-label-sm text-on-surface-variant font-mono">
                                  {order.escrowContractId}
                                </span>
                              </div>
                            </td>

                            {/* Thao Tác Quản Trị */}
                            <td className="py-4 px-6 align-top text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isDelivering && (
                                  <button
                                    className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-secondary transition-colors"
                                    title="Kiểm tra GPS Xe Lạnh"
                                    type="button"
                                    onClick={() => setSelectedOrderForGps(order)}
                                  >
                                    <span className="material-symbols-outlined text-[18px]">
                                      share_location
                                    </span>
                                  </button>
                                )}

                                {!isReleased && (
                                  <button
                                    className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                                    title="Giải ngân ký quỹ Escrow"
                                    type="button"
                                    onClick={() => handleDisburseEscrow(order.id)}
                                  >
                                    <span className="material-symbols-outlined text-[18px] text-secondary">
                                      paid
                                    </span>
                                  </button>
                                )}

                                <button
                                  className="px-3 py-1.5 rounded-xl bg-primary-container text-on-primary font-label-sm text-xs font-semibold hover:bg-primary transition-colors shadow-sm"
                                  type="button"
                                  onClick={() => setSelectedOrderForDetail(order)}
                                >
                                  Chi Tiết
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phân Trang Chuẩn Xác */}
              <div className="px-6 py-3.5 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 font-body-sm text-xs text-on-surface-variant border-t border-surface-container-high/60">
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
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-on-primary font-label-sm text-xs font-semibold shadow-sm"
                    type="button"
                  >
                    1
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-xs transition-colors"
                    type="button"
                  >
                    2
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-xs transition-colors"
                    type="button"
                  >
                    3
                  </button>
                  <span className="px-1 text-on-surface-variant">...</span>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-xs transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in duration-200 border border-secondary/20">
            <div className="p-6 bg-primary-container text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[20px]">
                    receipt_long
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-lg font-bold font-serif">
                    Đơn Hàng #{selectedOrderForDetail.id}
                  </h3>
                  <p className="text-body-sm text-secondary-fixed text-xs">
                    {selectedOrderForDetail.time} • {selectedOrderForDetail.orderTypeLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-body-sm">
              <div className="flex items-center gap-3 p-3.5 bg-surface-container rounded-2xl">
                <img
                  src={selectedOrderForDetail.cakeImage}
                  alt={selectedOrderForDetail.cakeTitle}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-primary text-sm font-serif">
                    {selectedOrderForDetail.cakeTitle}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {selectedOrderForDetail.cakeSpec}
                  </p>
                  <p className="font-bold text-secondary font-serif mt-0.5">
                    {selectedOrderForDetail.cakePriceFormatted}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold">
                  {selectedOrderForDetail.escrowStatusLabel}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-surface-container-high">
                  <span className="text-on-surface-variant">Khách hàng:</span>
                  <span className="font-bold text-primary">
                    {selectedOrderForDetail.customerName} ({selectedOrderForDetail.customerTier})
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-container-high">
                  <span className="text-on-surface-variant">Địa chỉ giao:</span>
                  <span className="font-medium text-primary text-right max-w-xs">
                    {selectedOrderForDetail.customerAddress}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-container-high">
                  <span className="text-on-surface-variant">Xưởng chế tác:</span>
                  <span className="font-bold text-primary">
                    {selectedOrderForDetail.vendorName} ({selectedOrderForDetail.chef})
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-container-high">
                  <span className="text-on-surface-variant">Ký quỹ Escrow Vault:</span>
                  <span className="font-bold text-secondary font-mono">
                    {selectedOrderForDetail.escrowPledge}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-on-surface-variant">Tiến độ hiện tại:</span>
                  <span className="font-bold text-primary">
                    {selectedOrderForDetail.stageLabel} ({selectedOrderForDetail.stageStep})
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high text-xs font-semibold"
                >
                  Đóng
                </button>

                {selectedOrderForDetail.escrowStatus !== 'released' && (
                  <button
                    type="button"
                    onClick={() => handleDisburseEscrow(selectedOrderForDetail.id)}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-secondary text-xs font-bold shadow-md"
                  >
                    Phê Duyệt Giải Ngân Cọc
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: RADAR GPS XE LẠNH TOÀN SÀN                       */}
      {/* ========================================================= */}
      {(showRadarModal || selectedOrderForGps) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in duration-200 border border-secondary/20">
            <div className="p-6 bg-primary-container text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[20px]">
                    share_location
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-lg font-bold font-serif">
                    Radar GPS & Cảm Biến Xe Lạnh
                  </h3>
                  <p className="text-body-sm text-secondary-fixed text-xs">
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

            <div className="p-6 space-y-4 text-body-sm">
              <div className="h-56 bg-surface-container rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-surface-container-high">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#D48C95_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary animate-bounce shadow-lg">
                    <span className="material-symbols-outlined text-2xl">
                      local_shipping
                    </span>
                  </span>
                  <p className="font-bold text-primary mt-2 text-sm">
                    {selectedOrderForGps?.deliveryVehicle || 'Xe Van Suzuki Carry (51D-892.44)'}
                  </p>
                  <p className="text-xs text-secondary font-bold">
                    Nhiệt độ thùng lạnh: 4.8°C • Độ rung: 0.02G (Chuẩn an toàn)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-surface-container rounded-xl">
                  <span className="text-xs text-on-surface-variant block">Tốc độ xe</span>
                  <span className="font-bold text-primary text-base">32 km/h</span>
                </div>
                <div className="p-3 bg-surface-container rounded-xl">
                  <span className="text-xs text-on-surface-variant block">Dự kiến đến</span>
                  <span className="font-bold text-secondary text-base">12 phút</span>
                </div>
                <div className="p-3 bg-surface-container rounded-xl">
                  <span className="text-xs text-on-surface-variant block">Khoảng cách</span>
                  <span className="font-bold text-primary text-base">2.8 km</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => {
                    setShowRadarModal(false)
                    setSelectedOrderForGps(null)
                  }}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-secondary"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in duration-200 border border-secondary/20">
            <div className="p-5 bg-primary-container text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary-fixed text-lg">
                  lock_clock
                </span>
                <h3 className="font-headline-sm text-base font-bold font-serif">
                  Cấu Hình Thời Gian Nghiệm Thu
                </h3>
              </div>
              <button
                onClick={() => setShowEscrowConfigModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-body-sm">
              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Thời gian Grace Period thẩm định sau giao:
                </label>
                <select className="w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-xs font-medium">
                  <option value="2">2 giờ (Tiêu chuẩn bánh tiệc sinh nhật)</option>
                  <option value="4">4 giờ (Bánh cưới Haute Couture nhiều tầng)</option>
                  <option value="12">12 giờ (Sự kiện doanh nghiệp quy mô lớn)</option>
                  <option value="24">24 giờ (Đơn ngoại tỉnh)</option>
                </select>
              </div>

              <div className="p-3 bg-surface-container rounded-xl text-[11px] text-on-surface-variant leading-relaxed">
                Sau khi khách hàng nhận bánh và hết thời gian Grace Period, hệ
                thống Escrow Vault sẽ tự động mở khóa tiền cọc về ví của tiệm bánh.
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setShowEscrowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Đã lưu cấu hình thời gian thẩm định Escrow Vault!')
                    setShowEscrowConfigModal(false)
                  }}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-secondary"
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
