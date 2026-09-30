import { VENDOR_HOT_RFQS } from '../../../mockData/vendor/dashboard.js'
import React, { useState } from 'react'
import VendorSidebar from '../../../layouts/vendor/VendorSidebar'
import VendorHeader from '../../../layouts/vendor/VendorHeader'

export const VendorDashboardPage = ({ onNavigate }) => {
  // Store receiving status
  const [isReceivingOrders, setIsReceivingOrders] = useState(true)
  const [toastMessage, setToastMessage] = useState(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Hot RFQ items
  const [rfqList, setRfqList] = useState([
    {
      id: '#RFQ-2025-8892',
      title: 'Bánh Sinh Nhật Pikachu Tạo Hình 3D (2 Tầng)',
      customerName: 'Nguyễn Mai Thảo Hân',
      customerTag: 'Đơn tiệc sinh nhật bé 7 tuổi',
      location: 'Giao Quận 1, TP.HCM',
      timeLeft: 'Còn 20 phút',
      urgent: true,
      flavor: 'Chiffon dâu tây hữu cơ, kem whipping Pháp',
      deadline: '15:30 Hôm nay (20/09/2026)',
      budget: '1.000.000đ',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ',
    },
    {
      id: '#RFQ-2025-9105',
      title: 'Bánh Kem Tiệc Cưới 3 Tầng Hoa Tươi Haute Couture',
      customerName: 'Trần Minh Tuấn',
      customerTag: 'Tiệc cưới sang trọng',
      location: 'Giao GEM Center, Quận 1',
      timeLeft: 'Còn 45 phút',
      urgent: true,
      flavor: 'Red Velvet Mascarpone & hoa hồng hữu cơ',
      deadline: '17:00 22/10/2026',
      budget: '5.000.000đ',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA5GwhbMoDgjFYx-03IXWg3yDeyNyIko-jZXs4i01e8m62nuwetHh6x4aCI2YTLLT5OhqyDkgg6JOV7maEOMlE46DnLeE3fdU8vQEeyTsc1U03tVhf-eZK7E49ZcrmAzLb4dC0OLoUjG6Z0QIYPnGCttyBdReVJyMUMWvaCKOOf31242Z6M4M75guDZa0gRDVKpMQ6JpjuteH8I_L9KdY9vvWs9A1aMzUkWGKHS75GYDodJpK5SllBe',
    },
    {
      id: '#RFQ-2025-9098',
      title: 'Bento Cake Kỷ Niệm 1 Năm Tối Giản Hàn Quốc',
      customerName: 'Lê Hoàng Lan Anh',
      customerTag: 'Lấy liền trong ngày',
      location: 'Bình Thạnh, TP.HCM',
      timeLeft: 'Còn 35 phút',
      urgent: false,
      flavor: 'Bông lan phô mai trứng muối',
      deadline: '16:00 Hôm nay',
      budget: '450.000đ',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBCjYMzSRCQrViSzwDg9dP8R1WtTGQBj6NJ2A2X1RPFdN44ZCIgOF93ECox_XgBvNy5JwLEoIjDjBH9ExYvsol2VeuuS7zTIM41vPphqjnNBp0tIDWGNFjPCen-ly2NfPJVB5lc5FjNij7G1x1hFj_3uoJu0qPt6W6eMYC__R_3GO1Xe3oJsWNPJB8ijpG8BvQxMu5c67uoCjReIp923JHSH-JIVtIEkDP9yw8mJZLd6zoUU-wPpneP',
    },
  ])

  // Quote Modal State
  const [selectedRfq, setSelectedRfq] = useState(null)
  const [quotePrice, setQuotePrice] = useState('')
  const [quoteNotes, setQuoteNotes] = useState('')
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleOpenQuoteModal = (rfq) => {
    setSelectedRfq(rfq)
    setQuotePrice(rfq.budget.replace(/[^0-9]/g, '') || '950000')
    setQuoteNotes(
      'La Crème Pâtisserie cam kết tạo hình chuẩn 96% theo ảnh thiết kế, sử dụng bơ Pháp cao cấp và tặng kèm nến số mạ vàng, dao cắt và thiệp viết tay.'
    )
    setIsQuoteModalOpen(true)
  }

  const handleSubmitQuote = (e) => {
    e.preventDefault()
    if (!quotePrice) return
    showToast(
      `Đã gửi báo giá ${parseInt(quotePrice).toLocaleString('vi-VN')}đ thành công tới khách hàng ${selectedRfq.customerName}!`
    )
    setRfqList((prev) => prev.filter((r) => r.id !== selectedRfq.id))
    setIsQuoteModalOpen(false)
  }

  const handleDismissRfq = (rfqId) => {
    setRfqList((prev) => prev.filter((r) => r.id !== rfqId))
    showToast(`Đã tạm ẩn yêu cầu ${rfqId}`)
  }

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-secondary text-xl">
            check_circle
          </span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* TOPBAR HEADER */}
      <VendorHeader
        title="Tổng Quan Xưởng Bánh"
        subtitle="Hiệu suất vận hành, doanh thu & đơn bánh nóng"
        isReceivingOrders={isReceivingOrders}
        onToggleReceiving={() => {
          setIsReceivingOrders(!isReceivingOrders)
          showToast(
            !isReceivingOrders
              ? 'Gian hàng đã mở bán trở lại! Sẵn sàng nhận đơn nướng.'
              : 'Đã tạm dừng nhận đơn mới trên sàn.'
          )
        }}
        onNavigate={onNavigate}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        showToast={showToast}
        actions={
          <>
            <button
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant/30 cursor-pointer transition-colors"
              onClick={() => onNavigate && onNavigate('vendor-rfq')}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">
                radar
              </span>
              <span>Chợ Yêu Cầu RFQ</span>
            </button>

            <button
              className="inline-flex items-center gap-1.5 bg-primary text-on-primary px-3 sm:px-4 py-2 rounded-xl font-bold text-xs shadow-xs hover:bg-secondary transition-colors cursor-pointer"
              onClick={() => onNavigate && onNavigate('vendor-menu')}
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">
                add_circle
              </span>
              <span className="hidden sm:inline">+ Mẫu bánh mới</span>
              <span className="sm:hidden">+ Mẫu bánh</span>
            </button>
          </>
        }
      />

      {/* VENDOR SIDEBAR */}
      <VendorSidebar
        activeTab="dashboard"
        onNavigate={onNavigate}
        rfqCount={4}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN OPERATIONS WORKSPACE */}
      <div className="md:pl-72 flex-1">
        <main className="pt-24 min-h-screen bg-background pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 space-y-6">
            {/* WELCOME BANNER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-secondary font-label-sm text-label-sm font-bold uppercase tracking-wider">
                </div>
                <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                  Xin chào, La Crème Pâtisserie 👋
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Dưới đây là các chỉ số hoạt động và yêu cầu đặt bánh quan trọng nhất cần xử lý hôm nay.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('vendor-orders')}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-primary border border-outline-variant/30 cursor-pointer font-label-lg"
                >
                  Xem danh sách đơn hàng (15)
                </button>
              </div>
            </div>

            {/* 4 CORE KPI CARDS (Nhìn trong 5 giây đầu) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* KPI 1: RFQ Mới */}
              <div
                className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigate && onNavigate('vendor-rfq')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    RFQ Mới Hôm Nay
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">
                      description
                    </span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-3xl sm:text-4xl font-bold text-primary">12</span>
                    <span className="font-body-sm text-xs text-on-surface-variant font-medium">
                      yêu cầu bánh
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI 2: Đơn Đang Làm */}
              <div
                className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigate && onNavigate('vendor-orders')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Đơn Đang Thực Hiện
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">cake</span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-3xl sm:text-4xl font-bold text-primary">15</span>
                    <span className="font-body-sm text-xs text-on-surface-variant font-medium">
                      chiếc bánh
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI 3: Doanh Thu */}
              <div
                className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigate && onNavigate('vendor-revenue')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Doanh Thu Tháng
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">
                      payments
                    </span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary">
                      38.500.000 ₫
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI 4: Hiệu Suất Báo Giá */}
              <div
                className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigate && onNavigate('vendor-rfq')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Hiệu Suất Báo Giá
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">trending_up</span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-3xl sm:text-4xl font-bold text-primary">68%</span>
                    <span className="font-body-sm text-xs text-on-surface-variant font-medium">
                      tỷ lệ chốt đơn
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION REQUIRED: CARD ĐỎ NỔI BẬT */}
            <div className="bg-gradient-to-r from-rose-50 via-rose-50/70 to-amber-50/50 border border-rose-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-rose-200/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
                  <h2 className="text-sm font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    Việc Cần Xử Lý Ngay (Action Required)
                  </h2>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  3 việc cần làm
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                <div
                  className="bg-white/80 p-3 rounded-xl border border-rose-100 flex items-start justify-between gap-3 hover:bg-white transition-colors cursor-pointer"
                  onClick={() => onNavigate && onNavigate('vendor-rfq')}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-rose-800 block">
                      3 RFQ cần nộp báo giá gấp
                    </span>
                    <p className="text-[11px] text-on-surface-variant">
                      Pikachu Cake (còn 20p), Wedding Cake (còn 45p)...
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-rose-600 text-lg shrink-0">
                    arrow_forward
                  </span>
                </div>

                <div
                  className="bg-white/80 p-3 rounded-xl border border-amber-100 flex items-start justify-between gap-3 hover:bg-white transition-colors cursor-pointer"
                  onClick={() => onNavigate && onNavigate('vendor-orders')}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-900 block">
                      2 đơn mới cần tiệm duyệt
                    </span>
                    <p className="text-[11px] text-on-surface-variant">
                      Đơn #ORD-9982 và #ORD-9985 khách đã cọc tiền
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-amber-700 text-lg shrink-0">
                    arrow_forward
                  </span>
                </div>

                <div
                  className="bg-white/80 p-3 rounded-xl border border-blue-100 flex items-start justify-between gap-3 hover:bg-white transition-colors cursor-pointer"
                  onClick={() => onNavigate && onNavigate('vendor-orders')}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-blue-900 block">
                      1 đơn sắp tới giờ hẹn giao
                    </span>
                    <p className="text-[11px] text-on-surface-variant">
                      Bánh Velvet Raspberry Bliss hẹn khách lúc 15:30
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-blue-700 text-lg shrink-0">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>

            {/* MAIN WORKSPACE GRID: HOT RFQS & NOTIFICATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: HOT RFQ MARKETPLACE LIST (8 Cols) */}
              <div className="lg:col-span-8 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[18px]">
                        request_quote
                      </span>
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-primary">
                        RFQ Cần Xử Lý Ngay (Yêu Cầu Báo Giá Hot)
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Khách hàng vừa đăng yêu cầu đặt bánh độc bản lên sàn Sweet Cake
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('vendor-rfq')}
                    className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                  >
                    <span>Xem tất cả ({rfqList.length})</span>
                    <span className="material-symbols-outlined text-xs inline-block align-middle ml-0.5">arrow_forward</span>
                  </button>
                </div>

                {/* RFQ List */}
                <div className="space-y-3">
                  {rfqList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
                      Đã phản hồi hết tất cả các yêu cầu RFQ hiện có. Hệ thống sẽ phát chuông khi có yêu cầu mới!
                    </div>
                  ) : (
                    rfqList.map((rfq) => (
                      <div
                        key={rfq.id}
                        className="bg-surface-container-low/70 p-4 rounded-xl hover:bg-surface-container transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border border-outline-variant/15"
                      >
                        <div className="flex items-start gap-3.5">
                          <img
                            src={rfq.image}
                            alt={rfq.title}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-sm"
                          />
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-mono font-bold text-secondary">
                                {rfq.id}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                                {rfq.customerTag}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  rfq.urgent
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-surface-container text-on-surface-variant'
                                }`}
                              >
                                ⏰ {rfq.timeLeft}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm text-primary leading-snug">
                              {rfq.title}
                            </h3>
                            <div className="text-xs text-on-surface-variant flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              <span>
                                Khách: <strong>{rfq.customerName}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Ngân sách: <strong className="text-secondary">{rfq.budget}</strong>
                              </span>
                              <span>•</span>
                              <span>Hạn: {rfq.deadline}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleOpenQuoteModal(rfq)}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-secondary font-bold text-xs shadow-sm transition-colors cursor-pointer text-center"
                          >
                            Soạn báo giá
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissRfq(rfq.id)}
                            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs cursor-pointer"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT: LIVE FEED & RECENT ORDERS (4 Cols) */}
              <div className="lg:col-span-4 space-y-4">
                {/* NOTIFICATIONS FEED */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px]">
                        notifications_active
                      </span>
                      Thông Báo Mới Nhất
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900">
                          Khách vừa chấp nhận báo giá!
                        </span>
                        <span className="text-[10px] text-emerald-700">5 phút trước</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-snug">
                        Khách <strong>Hân Mai</strong> đã chọn báo giá 950.000đ cho đơn bánh Pikachu 2 tầng.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900">
                          RFQ sắp hết hạn nhận báo giá
                        </span>
                        <span className="text-[10px] text-amber-700">12 phút trước</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Yêu cầu #RFQ-2025-8892 chỉ còn 20 phút trước khi khách khóa danh sách tiệm.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900">
                          Đơn hàng cần bàn giao
                        </span>
                        <span className="text-[10px] text-blue-700">25 phút trước</span>
                      </div>
                      <p className="text-[11px] text-blue-800 leading-snug">
                        Đơn #ORD-9982 đã hoàn thành trang trí, sẵn sàng đóng hộp giao khách.
                      </p>
                    </div>
                  </div>
                </div>

                {/* FUNNEL STATUS WIDGET */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
                    <h3 className="text-sm font-bold text-primary">
                      Tiến Độ Đơn Hàng Hôm Nay
                    </h3>
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('vendor-orders')}
                      className="text-xs text-secondary font-bold hover:underline cursor-pointer"
                    >
                      <span>Kanban</span>
                      <span className="material-symbols-outlined text-xs inline-block align-middle ml-0.5">arrow_forward</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                      <span className="text-on-surface-variant">Chờ duyệt (Đơn mới):</span>
                      <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
                        8 đơn
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                      <span className="text-on-surface-variant">Đang làm tại xưởng:</span>
                      <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full text-[11px]">
                        15 đơn
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                      <span className="text-on-surface-variant">Đang trên đường giao:</span>
                      <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full text-[11px]">
                        3 đơn
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                      <span className="text-on-surface-variant">Đã hoàn thành hôm nay:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                        25 đơn
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL: SOẠN BÁO GIÁ NHANH */}
      {isQuoteModalOpen && selectedRfq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-outline-variant/30 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div>
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  Nộp Báo Giá Cạnh Tranh
                </span>
                <h3 className="text-base font-bold text-primary">
                  {selectedRfq.title} ({selectedRfq.id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low flex items-center gap-3">
                <img
                  src={selectedRfq.image}
                  alt={selectedRfq.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div>
                  <p className="font-bold text-primary">{selectedRfq.customerName}</p>
                  <p className="text-[11px] text-on-surface-variant">
                    Địa chỉ: {selectedRfq.location}
                  </p>
                  <p className="text-[11px] text-secondary font-semibold">
                    Ngân sách khách mong muốn: {selectedRfq.budget}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-primary block">
                  Giá chào thầu của tiệm (VNĐ):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold text-primary focus:outline-none focus:border-secondary"
                    placeholder="VD: 950000"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline font-semibold">
                    VNĐ
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-primary block">
                  Lời nhắn &amp; Cam kết của tiệm gửi khách:
                </label>
                <textarea
                  rows={3}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary leading-relaxed focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-secondary font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Gửi Báo Giá Cho Khách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorDashboardPage
