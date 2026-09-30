import { INITIAL_KANBAN_ORDERS } from '../../../mockData/vendor/orders.js'
import React, { useState, useEffect, useMemo } from 'react'
import { useAppData } from '../../../context/AppDataContext.jsx'
import VendorSidebar from '../../../layouts/vendor/VendorSidebar'
import VendorHeader from '../../../layouts/vendor/VendorHeader'

export const VendorOrderManagementPage = ({ onNavigate }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  // Live clock
  const [liveClock, setLiveClock] = useState('')
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hrs = String(now.getHours()).padStart(2, '0')
      const mins = String(now.getMinutes()).padStart(2, '0')
      setLiveClock(`${hrs}:${mins}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Filters & Search
  const [selectedFilter, setSelectedFilter] = useState('all') // 'all' | 'urgent' | 'birthday' | 'wedding' | 'corporate'
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [timelineOrder, setTimelineOrder] = useState(null)
  const [qcOrder, setQcOrder] = useState(null)
  const [driverOrder, setDriverOrder] = useState(null)

  // Toast state
  const [toastMsg, setToastMsg] = useState(null)
  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Currency formatter
  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num) + 'đ'

  // Orders State from shared Context (new orders from Customer flow appear here)
  const { kanbanOrders, updateKanban } = useAppData()
  const orders = kanbanOrders
  // Local proxy so all existing setOrders(...) patterns keep working
  const setOrders = updateKanban

  // Handlers for Kanban Stage Transitions
  // 1. Xác nhận nhận đơn (Pending -> Scheduled)
  const handleConfirmOrder = (order) => {
    setOrders((prev) => ({
      ...prev,
      pending: prev.pending.filter((o) => o.id !== order.id),
      scheduled: [
        {
          ...order,
          prepStatus: 'Đã nhận đơn • Bắt đầu chuẩn bị nguyên liệu',
          timeline: [
            ...order.timeline,
            { time: liveClock || 'Vừa xong', text: 'Tiệm đã xác nhận nhận đơn' },
          ],
        },
        ...prev.scheduled,
      ],
    }))
    showToast(`Đã nhận đơn ${order.id}! Đơn đã chuyển sang "Đã lên lịch".`)
  }

  // Từ chối đơn
  const handleRejectOrder = (order) => {
    setOrders((prev) => ({
      ...prev,
      pending: prev.pending.filter((o) => o.id !== order.id),
    }))
    showToast(
      `Đã từ chối đơn ${order.id}. Hệ thống đã tự động hoàn tiền Escrow ${formatVND(order.price)} cho khách!`
    )
  }

  // 2. Bắt đầu làm bánh (Scheduled -> Baking)
  const handleStartBaking = (order) => {
    const bakingItem = {
      ...order,
      progressPercent: 20,
      steps: [
        { name: 'Chuẩn bị nguyên liệu', done: true },
        { name: 'Nướng cốt bánh', done: false },
        { name: 'Đánh kem', done: false },
        { name: 'Tạo hình nghệ thuật', done: false },
        { name: 'Đóng hộp bảo quản', done: false },
      ],
      timeline: [
        ...order.timeline,
        { time: liveClock || 'Vừa xong', text: 'Bếp bắt đầu nướng và tạo hình bánh' },
      ],
    }
    setOrders((prev) => ({
      ...prev,
      scheduled: prev.scheduled.filter((o) => o.id !== order.id),
      baking: [bakingItem, ...prev.baking],
    }))
    showToast(`Đã bắt đầu làm bánh cho đơn ${order.id}!`)
  }

  // Toggle checklist step in Baking
  const handleToggleStep = (orderId, stepIndex) => {
    setOrders((prev) => {
      const updatedBaking = prev.baking.map((order) => {
        if (order.id !== orderId) return order
        const newSteps = [...order.steps]
        newSteps[stepIndex] = { ...newSteps[stepIndex], done: !newSteps[stepIndex].done }
        const doneCount = newSteps.filter((s) => s.done).length
        const newPercent = Math.round((doneCount / newSteps.length) * 100)
        return {
          ...order,
          steps: newSteps,
          progressPercent: newPercent,
        }
      })
      return { ...prev, baking: updatedBaking }
    })
  }

  // 3. Xong & đóng hộp (Baking -> Delivering)
  const handleFinishBaking = (order) => {
    const deliveringItem = {
      ...order,
      driverName: 'Trần Minh Tâm',
      driverPhone: '0918 889 900',
      licensePlate: '51D-921.44',
      vanCode: 'Xe Lạnh SH02',
      tempC: '4.8°C',
      remainingMins: 'Còn ~25 phút',
      timeline: [
        ...order.timeline,
        { time: liveClock || 'Vừa xong', text: 'Xong & đóng hộp, đã bàn giao tài xế Xe SH02' },
      ],
    }
    setOrders((prev) => ({
      ...prev,
      baking: prev.baking.filter((o) => o.id !== order.id),
      delivering: [deliveringItem, ...prev.delivering],
    }))
    showToast(`Đã đóng hộp bánh ${order.id} và bàn giao cho tài xế xe lạnh!`)
  }

  // 4. Khách xác nhận nhận bánh (Delivering -> Completed)
  const handleDeliverSuccess = (order) => {
    const completedItem = {
      ...order,
      completedAt: `Hoàn tất lúc ${liveClock || '15:30'}`,
      netPayout: Math.round(order.price * 0.95),
      escrowReleased: true,
      timeline: [
        ...order.timeline,
        { time: liveClock || 'Vừa xong', text: 'Khách đã nhận bánh nguyên vẹn' },
        {
          time: liveClock || 'Vừa xong',
          text: `Escrow mở khóa • ${formatVND(Math.round(order.price * 0.95))} đã về ví tiệm`,
        },
      ],
    }
    setOrders((prev) => ({
      ...prev,
      delivering: prev.delivering.filter((o) => o.id !== order.id),
      completed: [completedItem, ...prev.completed],
    }))
    showToast(
      `Khách đã nhận đơn ${order.id}! Escrow đã mở khóa, tiền đã chuyển vào ví tiệm bánh của bạn!`
    )
  }

  // 5. Giao hàng thất bại (Delivering -> Back to Pending)
  const handleDeliverFailed = (order) => {
    const failedItem = {
      ...order,
      deliveryFailed: true,
      prepStatus: 'Giao thất bại - Khách không bắt máy',
      timeline: [
        ...order.timeline,
        { time: liveClock || 'Vừa xong', text: 'Giao thất bại: Tài xế không liên lạc được với khách' },
      ],
    }
    setOrders((prev) => ({
      ...prev,
      delivering: prev.delivering.filter((o) => o.id !== order.id),
      pending: [failedItem, ...prev.pending],
    }))
    showToast(`Giao hàng đơn ${order.id} thất bại! Đã chuyển về cột Chờ Xử Lý để liên hệ lại khách.`)
  }

  // Filter & Search computation
  const filterOrderList = (list) => {
    return list.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchId = item.id.toLowerCase().includes(q)
        const matchCust = item.customer.toLowerCase().includes(q)
        const matchPhone = item.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
        const matchTitle = item.title.toLowerCase().includes(q)
        if (!matchId && !matchCust && !matchPhone && !matchTitle) return false
      }
      // Category / Urgency Filter
      if (selectedFilter === 'urgent' && !item.isUrgent) return false
      if (selectedFilter === 'birthday' && item.category !== 'birthday') return false
      if (selectedFilter === 'wedding' && item.category !== 'wedding') return false
      if (selectedFilter === 'corporate' && item.category !== 'corporate') return false

      return true
    })
  }

  const filteredPending = useMemo(
    () => filterOrderList(orders.pending),
    [orders.pending, searchQuery, selectedFilter]
  )
  const filteredScheduled = useMemo(
    () => filterOrderList(orders.scheduled),
    [orders.scheduled, searchQuery, selectedFilter]
  )
  const filteredBaking = useMemo(
    () => filterOrderList(orders.baking),
    [orders.baking, searchQuery, selectedFilter]
  )
  const filteredDelivering = useMemo(
    () => filterOrderList(orders.delivering),
    [orders.delivering, searchQuery, selectedFilter]
  )
  const filteredCompleted = useMemo(
    () => filterOrderList(orders.completed),
    [orders.completed, searchQuery, selectedFilter]
  )

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-secondary text-xl">check_circle</span>
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* VENDOR FIXED SIDEBAR */}
      <VendorSidebar
        activeTab="orders"
        onNavigate={onNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* TOPBAR */}
      <VendorHeader
        title="Quản Lý Đơn Hàng"
        subtitle="Quy trình nướng bánh 5 bước, kiểm định chất lượng & giao xe lạnh"
        contextBadge={`Bếp hoạt động • ${liveClock || '14:00'}`}
        onNavigate={onNavigate}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        showToast={showToast}
        actions={
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('vendor-rfq')}
            className="px-3 sm:px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-primary border border-outline-variant/30 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">explore</span>
            <span className="hidden sm:inline">Chợ RFQ tìm đơn mới</span>
            <span className="sm:hidden">Chợ RFQ</span>
          </button>
        }
      />

      {/* MAIN CONTENT WRAPPER */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        {/* MAIN BODY */}
        <main className="relative pt-24 w-full bg-surface min-h-screen pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 space-y-6">
            {/* 1. TOP KPIS (4 CHỈ SỐ THEO YÊU CẦU) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1 */}
              <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/20 shadow-xs flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider block">
                    Tổng đơn hôm nay
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">23 đơn</span>
                    <span className="font-label-sm text-[11px] text-secondary font-bold">+4 mới</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-xl">receipt_long</span>
                </div>
              </div>

              {/* KPI 2: Cần ra lò trong 2h tới (Giúp bếp trưởng biết đơn gấp) */}
              <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-xs flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-rose-800 font-bold uppercase tracking-wider block flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                    Cần ra lò trong 2h tới
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-lg text-2xl sm:text-3xl font-bold text-rose-700">4 bánh gấp</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                  <span className="material-symbols-outlined text-xl">alarm</span>
                </div>
              </div>

              {/* KPI 3: Đang trên đường giao */}
              <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/20 shadow-xs flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider block">
                    Đang trên đường giao
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">5 xe lạnh</span>
                    <span className="font-label-sm text-[11px] text-emerald-700 font-semibold">Đúng giờ</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-xl">local_shipping</span>
                </div>
              </div>

              {/* KPI 4: Tỷ lệ đúng giờ (Điểm uy tín) */}
              <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/20 shadow-xs flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider block">
                    Tỷ lệ giao đúng giờ
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-lg text-2xl sm:text-3xl font-bold text-emerald-700">99.2%</span>
                    <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Uy tín 5★</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">verified</span>
                </div>
              </div>
            </div>

            {/* 2. CẢNH BÁO ĐƠN TRỄ DEADLINE (THÔNG BÁO GẤP) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping shrink-0"></span>
                <span className="font-bold text-amber-950">
                  🔴 Cảnh báo tiến độ: Bánh Pikachu (#ORD-2025-9982) cần giao lúc 15:30. Khách vừa
                  chốt báo giá, tiệm cần bấm "Xác nhận nhận đơn" ngay!
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleConfirmOrder(orders.pending[0])}
                className="px-3.5 py-1.5 rounded-xl bg-secondary text-on-secondary font-bold text-xs shadow-xs hover:bg-secondary-fixed transition-colors cursor-pointer shrink-0"
              >
                Xác nhận nhận đơn ngay
              </button>
            </div>

            {/* 3. BỘ LỌC & TÌM KIẾM */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã đơn (#ORD), tên khách, SĐT, tên bánh..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary focus:outline-none focus:border-secondary"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                <span className="text-outline text-[11px] mr-1 hidden lg:inline">Lọc đơn:</span>
                {[
                  { id: 'all', label: 'Tất cả hôm nay' },
                  { id: 'urgent', label: 'Khẩn cấp 🔴' },
                  { id: 'birthday', label: 'Sinh nhật' },
                  { id: 'wedding', label: 'Tiệc cưới' },
                  { id: 'corporate', label: 'Doanh nghiệp' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all text-xs cursor-pointer whitespace-nowrap ${
                      selectedFilter === tab.id
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-outline-variant/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. BẢNG KANBAN 5 CỘT TIẾN TRÌNH */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
              {/* ================= CỘT 1: CHỜ DUYỆT ================= */}
              <div className="bg-surface-container-low/70 rounded-2xl p-4 border border-outline-variant/20 flex flex-col gap-3 min-h-[520px]">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <h3 className="font-headline-sm text-xs font-bold text-primary uppercase tracking-wider">
                      1. Chờ duyệt
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-bold text-primary">
                    {filteredPending.length}
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-body-sm">
                  Khách đã cọc Escrow • Chờ tiệm xác nhận
                </span>

                <div className="space-y-3">
                  {filteredPending.map((order) => (
                    <div
                      key={order.id}
                      className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20 shadow-xs hover:shadow-md transition-shadow space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-secondary">
                          {order.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold font-label-sm">
                          Đã cọc Escrow
                        </span>
                      </div>

                      <div
                        className="cursor-pointer"
                        onClick={() => setTimelineOrder(order)}
                        title="Bấm xem timeline đơn"
                      >
                        <h4 className="font-headline-sm text-xs sm:text-sm font-bold text-primary line-clamp-2 hover:text-secondary">
                          {order.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          Khách: <strong>{order.customer}</strong> ({order.phone})
                        </p>
                        <p className="text-[11px] text-secondary font-semibold">
                          Giao: {order.deliveryTime}
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant flex items-center justify-between">
                        <span>Giá chốt:</span>
                        <strong className="text-primary font-bold">
                          {formatVND(order.price)}
                        </strong>
                      </div>

                      {/* 2 Nút: Xác nhận nhận đơn / Từ chối */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleRejectOrder(order)}
                          className="py-1.5 px-2 rounded-lg bg-surface-container hover:bg-rose-100 hover:text-rose-800 text-[11px] font-semibold text-on-surface-variant transition-colors cursor-pointer"
                        >
                          Từ chối
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmOrder(order)}
                          className="py-1.5 px-2 rounded-lg bg-primary hover:bg-secondary text-on-primary text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Xác nhận nhận
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredPending.length === 0 && (
                    <div className="p-6 text-center text-outline text-xs">Không có đơn chờ duyệt</div>
                  )}
                </div>
              </div>

              {/* ================= CỘT 2: ĐÃ LÊN LỊCH ================= */}
              <div className="bg-surface-container-low/70 rounded-2xl p-4 border border-outline-variant/20 flex flex-col gap-3 min-h-[520px]">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <h3 className="font-headline-sm text-xs font-bold text-primary uppercase tracking-wider">
                      2. Đã lên lịch
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-bold text-primary">
                    {filteredScheduled.length}
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-body-sm">
                  Chuẩn bị nguyên liệu &amp; phân công thợ
                </span>

                <div className="space-y-3">
                  {filteredScheduled.map((order) => (
                    <div
                      key={order.id}
                      className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20 shadow-xs hover:shadow-md transition-shadow space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-secondary">
                          {order.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-medium text-on-surface-variant font-label-sm">
                          {order.sizeSpec}
                        </span>
                      </div>

                      <div
                        className="cursor-pointer"
                        onClick={() => setTimelineOrder(order)}
                        title="Bấm xem timeline đơn"
                      >
                        <h4 className="font-headline-sm text-xs sm:text-sm font-bold text-primary line-clamp-2 hover:text-secondary">
                          {order.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          Khách: {order.customer} • Giao: <strong>{order.deliveryTime}</strong>
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant space-y-1">
                        <div className="text-secondary font-semibold">
                          Thợ phụ trách: {order.chefAssigned || 'Bếp trưởng'}
                        </div>
                        <div className="text-[10px] text-outline">
                          {order.prepStatus || 'Đang chuẩn bị nguyên liệu'}
                        </div>
                      </div>

                      {/* Button: Bắt đầu làm bánh */}
                      <button
                        type="button"
                        onClick={() => handleStartBaking(order)}
                        className="w-full py-2 px-3 rounded-lg bg-secondary hover:bg-secondary-fixed text-on-secondary hover:text-primary text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">soup_kitchen</span>
                        <span>Bắt đầu nướng bánh</span>
                      </button>
                    </div>
                  ))}
                  {filteredScheduled.length === 0 && (
                    <div className="p-6 text-center text-outline text-xs">Chưa có đơn lên lịch</div>
                  )}
                </div>
              </div>

              {/* ================= CỘT 3: ĐANG NƯỚNG & TẠO HÌNH ================= */}
              <div className="bg-surface-container-low/70 rounded-2xl p-4 border border-outline-variant/20 flex flex-col gap-3 min-h-[520px]">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                    <h3 className="font-headline-sm text-xs font-bold text-primary uppercase tracking-wider">
                      3. Đang làm &amp; Tạo hình
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-bold text-primary">
                    {filteredBaking.length}
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-body-sm">
                  Giai đoạn sản xuất • Checklist công đoạn
                </span>

                <div className="space-y-3">
                  {filteredBaking.map((order) => (
                    <div
                      key={order.id}
                      className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20 shadow-xs hover:shadow-md transition-shadow space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-secondary">
                          {order.id}
                        </span>
                        <span className="text-xs font-bold text-secondary">
                          {order.progressPercent}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full bg-secondary transition-all duration-300"
                          style={{ width: `${order.progressPercent}%` }}
                        ></div>
                      </div>

                      <div
                        className="cursor-pointer"
                        onClick={() => setTimelineOrder(order)}
                        title="Bấm xem timeline đơn"
                      >
                        <h4 className="font-headline-sm text-xs sm:text-sm font-bold text-primary line-clamp-1 hover:text-secondary">
                          {order.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant">
                          Giao: <strong>{order.deliveryTime}</strong>
                        </p>
                      </div>

                      {/* Checklist công đoạn (Bấm tick được) */}
                      <div className="p-2.5 rounded-xl bg-surface-container-low text-[11px] space-y-1.5">
                        <span className="font-semibold text-primary block text-[10px] uppercase tracking-wider">
                          Công đoạn thực hiện:
                        </span>
                        {order.steps &&
                          order.steps.map((step, idx) => (
                            <label
                              key={idx}
                              className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={step.done}
                                onChange={() => handleToggleStep(order.id, idx)}
                                className="w-3.5 h-3.5 accent-secondary rounded cursor-pointer"
                              />
                              <span
                                className={
                                  step.done
                                    ? 'line-through text-outline'
                                    : 'font-medium text-primary'
                                }
                              >
                                {step.name}
                              </span>
                            </label>
                          ))}
                      </div>

                      {/* 2 Buttons: Chụp duyệt ảnh & Xong đóng hộp */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setQcOrder(order)}
                          className="py-1.5 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs text-secondary">
                            photo_camera
                          </span>
                          <span>Chụp duyệt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFinishBaking(order)}
                          className="py-1.5 px-2 rounded-lg bg-primary hover:bg-secondary text-on-primary text-[11px] font-bold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Xong &amp; Đóng hộp</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredBaking.length === 0 && (
                    <div className="p-6 text-center text-outline text-xs">Không có bánh đang làm</div>
                  )}
                </div>
              </div>

              {/* ================= CỘT 4: ĐANG GIAO XE LẠNH ================= */}
              <div className="bg-surface-container-low/70 rounded-2xl p-4 border border-outline-variant/20 flex flex-col gap-3 min-h-[520px]">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
                    <h3 className="font-headline-sm text-xs font-bold text-primary uppercase tracking-wider">
                      4. Đang giao xe lạnh
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-bold text-primary">
                    {filteredDelivering.length}
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-body-sm">
                  Xe lạnh Sweet Cake • Bảo đảm nhiệt độ 4.5°C
                </span>

                <div className="space-y-3">
                  {filteredDelivering.map((order) => (
                    <div
                      key={order.id}
                      className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20 shadow-xs hover:shadow-md transition-shadow space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-secondary">
                          {order.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold font-label-sm">
                          {order.tempC || '4.5°C'}
                        </span>
                      </div>

                      <div
                        className="cursor-pointer"
                        onClick={() => setTimelineOrder(order)}
                        title="Bấm xem timeline đơn"
                      >
                        <h4 className="font-headline-sm text-xs sm:text-sm font-bold text-primary line-clamp-1 hover:text-secondary">
                          {order.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          Đến: <strong>{order.address}</strong>
                        </p>
                      </div>

                      {/* Thông tin tài xế & xe */}
                      <div className="p-2 rounded-lg bg-surface-container-low text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-outline">Tài xế:</span>
                          <span className="font-semibold text-primary">
                            {order.driverName} ({order.vanCode})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-outline">Thời gian:</span>
                          <span className="font-bold text-secondary">{order.remainingMins}</span>
                        </div>
                      </div>

                      {/* Buttons: GPS xe & Gọi tài xế */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDriverOrder(order)}
                          className="py-1.5 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs text-secondary">
                            near_me
                          </span>
                          <span>GPS xe</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => showToast(`Đang kết nối gọi tài xế: ${order.driverPhone}`)}
                          className="py-1.5 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs text-secondary">
                            call
                          </span>
                          <span>Gọi tài xế</span>
                        </button>
                      </div>

                      {/* Nút mô phỏng nhận / thất bại */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeliverSuccess(order)}
                          className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-xs">done_all</span>
                          <span>Đã giao thành công</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeliverFailed(order)}
                          className="py-1.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-xs">cancel</span>
                          <span>Giao thất bại</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredDelivering.length === 0 && (
                    <div className="p-6 text-center text-outline text-xs">Không có xe đang giao</div>
                  )}
                </div>
              </div>

              {/* ================= CỘT 5: HOÀN TẤT & ESCROW MỞ KHÓA ================= */}
              <div className="bg-surface-container-low/70 rounded-2xl p-4 border border-outline-variant/20 flex flex-col gap-3 min-h-[520px]">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h3 className="font-headline-sm text-xs font-bold text-primary uppercase tracking-wider">
                      5. Hoàn tất
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-bold text-primary">
                    {filteredCompleted.length}
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-body-sm">
                  Khách đã nhận • Escrow mở khóa về ví
                </span>

                <div className="space-y-3">
                  {filteredCompleted.map((order) => (
                    <div
                      key={order.id}
                      className="bg-surface-container-lowest p-3.5 rounded-xl border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-secondary">
                          {order.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5 font-label-sm">
                          <span className="material-symbols-outlined text-[12px]">lock_open</span>
                          Escrow mở khóa
                        </span>
                      </div>

                      <div
                        className="cursor-pointer"
                        onClick={() => setTimelineOrder(order)}
                        title="Bấm xem timeline đơn"
                      >
                        <h4 className="font-headline-sm text-xs sm:text-sm font-bold text-primary line-clamp-1 hover:text-secondary">
                          {order.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {order.completedAt}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-xs">
                        <div className="text-[11px] text-emerald-800">Thực nhận về ví tiệm:</div>
                        <div className="text-sm font-bold text-emerald-900 mt-0.5">
                          {formatVND(order.netPayout || Math.round(order.price * 0.95))}
                        </div>
                        <div className="text-[10px] text-emerald-700 mt-1">
                          Đã trừ 5% phí sàn Sweet Cake
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTimelineOrder(order)}
                        className="w-full py-1.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Xem dòng tiền &amp; Timeline
                      </button>
                    </div>
                  ))}
                  {filteredCompleted.length === 0 && (
                    <div className="p-6 text-center text-outline text-xs">Chưa có đơn hoàn tất</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ================= MODAL: TIMELINE CHI TIẾT ĐƠN HÀNG ================= */}
      {timelineOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div>
                <span className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider">
                  Timeline Tiến Độ Đơn #{timelineOrder.id}
                </span>
                <h3 className="font-headline-sm text-base sm:text-lg font-bold text-primary">{timelineOrder.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setTimelineOrder(null)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Thông tin vắn tắt */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-outline">Khách hàng:</span>
                <span className="font-bold text-primary">
                  {timelineOrder.customer} ({timelineOrder.phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Tổng thanh toán:</span>
                <span className="font-bold text-secondary">
                  {formatVND(timelineOrder.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Địa chỉ giao:</span>
                <span className="font-semibold text-primary">{timelineOrder.address}</span>
              </div>
            </div>

            {/* Timeline Flow */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                Lịch sử xử lý đơn hàng:
              </h4>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/40">
                {timelineOrder.timeline &&
                  timelineOrder.timeline.map((step, idx) => (
                    <div key={idx} className="relative flex flex-col text-xs">
                      <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-secondary ring-4 ring-surface"></span>
                      <span className="font-bold text-secondary text-[11px]">{step.time}</span>
                      <span className="text-primary mt-0.5">{step.text}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/15 flex justify-end">
              <button
                type="button"
                onClick={() => setTimelineOrder(null)}
                className="px-5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHỤP DUYỆT ẢNH BÁNH ================= */}
      {qcOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-outline-variant/30 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-base font-bold text-primary">
                Chụp Duyệt Ảnh Bánh Thực Tế ({qcOrder.id})
              </h3>
              <button
                type="button"
                onClick={() => setQcOrder(null)}
                className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-surface-container relative">
              <img
                src={qcOrder.image}
                alt="Ảnh bánh thực tế"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded">
                Ảnh chụp góc bàn chế tác
              </span>
            </div>

            <p className="text-xs text-on-surface-variant">
              Gửi ảnh thực tế qua app cho khách <strong>{qcOrder.customer}</strong> duyệt dáng bánh
              trước khi đóng thùng chuyển sang xe giao hàng.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQcOrder(null)}
                className="px-4 py-2 rounded-xl bg-surface-container text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setQcOrder(null)
                  showToast(
                    `Đã gửi ảnh bánh thực tế tới khách hàng ${qcOrder.customer} thành công!`
                  )
                }}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-secondary text-on-primary font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Gửi ảnh duyệt cho khách</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: GPS XE LẠNH ================= */}
      {driverOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-outline-variant/30 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-base font-bold text-primary">
                GPS Giám Sát Xe Lạnh ({driverOrder.vanCode})
              </h3>
              <button
                type="button"
                onClick={() => setDriverOrder(null)}
                className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-outline">Tài xế:</span>
                <span className="font-bold text-primary">
                  {driverOrder.driverName} ({driverOrder.licensePlate})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Nhiệt độ thùng xe:</span>
                <span className="font-bold text-secondary">
                  {driverOrder.tempC || '4.5°C'} (Chuẩn lạnh bảo quản)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Điểm đến:</span>
                <span className="font-semibold text-primary">{driverOrder.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Thời gian dự kiến:</span>
                <span className="font-bold text-emerald-700">{driverOrder.remainingMins}</span>
              </div>
            </div>

            {/* Mô phỏng radar GPS map */}
            <div className="h-36 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center relative overflow-hidden p-4 text-center">
              <div className="absolute w-24 h-24 rounded-full border border-cyan-500/40 animate-ping"></div>
              <span className="material-symbols-outlined text-cyan-400 text-3xl mb-1">
                navigation
              </span>
              <span className="text-xs font-bold text-cyan-300">Xe đang cách khách 1.2 km</span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Vận tốc 28 km/h • Đường Nguyễn Hữu Cảnh
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDriverOrder(null)}
                className="px-4 py-2 rounded-xl bg-surface-container text-xs cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setDriverOrder(null)
                  showToast(`Đang quay số gọi tài xế: ${driverOrder.driverPhone}`)
                }}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-secondary text-on-primary font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                <span>Gọi tài xế ({driverOrder.driverPhone})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorOrderManagementPage
