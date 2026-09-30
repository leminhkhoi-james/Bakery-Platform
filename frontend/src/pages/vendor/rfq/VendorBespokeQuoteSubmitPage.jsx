import { DEFAULT_BESPOKE_RFQ } from '../../../mockData/vendor/rfqs.js'
import { DEFAULT_QUOTE_SAMPLE_IMAGES } from '../../../mockData/vendor/quotes.js'
import React, { useState, useEffect } from 'react'
import { useAppData } from '../../../context/AppDataContext.jsx'
import VendorSidebar from '../../../layouts/vendor/VendorSidebar'
import VendorHeader from '../../../layouts/vendor/VendorHeader'

export const VendorBespokeQuoteSubmitPage = ({ onNavigate, rfqData = null }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  // Lấy dữ liệu RFQ từ props hoặc localStorage
  const [currentRfq, setCurrentRfq] = useState(() => {
    if (rfqData) return rfqData
    try {
      const stored = localStorage.getItem('sweetcake_current_quote_rfq')
      if (stored) return JSON.parse(stored)
    } catch {}
    // Mặc định RFQ demo chuẩn Pikachu 2 tầng
    return DEFAULT_BESPOKE_RFQ
  })

  // 1. THÔNG TIN BÁO GIÁ
  const [quotePrice, setQuotePrice] = useState(950000)
  const [selectedCakeSize, setSelectedCakeSize] = useState('2-tier')
  const [selectedFlavor, setSelectedFlavor] = useState('vanilla-strawberry')
  const [completionHours, setCompletionHours] = useState('6')
  const [similarityNote, setSimilarityNote] = useState(
    'Tiệm cam kết tạo hình giống 90% - 95% ảnh mẫu khách gửi. Tượng Pikachu 3D nặn thủ công tỉ mỉ bằng đường Fondant Pháp cao cấp, an toàn và ăn được. Cốt bánh Chiffon dâu tây organic giảm 30% ngọt thanh mát cho bé. Tặng kèm bộ nến số 7 mạ vàng hoàng gia, set dĩa nĩa gỗ và thiệp viết tay.'
  )

  // 2. ẢNH MINH HỌA BÁNH TƯƠNG TỰ ĐÃ LÀM (1-3 ảnh)
  const [sampleImages, setSampleImages] = useState([
    {
      id: 1,
      name: 'Bánh Pokemon 2 tầng xưởng từng làm (Đơn #8841)',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB41yHv4OuRriCctFtGR5K2LcqwySpMV3AC2JhEeaS463F4e0oqdLZxz7hYLNkMTuQ_kW7Ety32CcWWk0UN2PySrPJUfZ6sq9BNI2nYIcJgi-KFtVRO-IUDOPuC5sE8xaJmGf-Rd3a0SSWhK8OgZptD-BcCkTTSaJMpfuh9Zioy_xMNkfYEbyRSvnncKpxck19jiln0C3CWWqUfo299eIuU8Nz6XxDJ5CE_JQfHQlVCywtgrWOOpPAl',
      tag: 'Ảnh thật tiệm đã làm',
    },
    {
      id: 2,
      name: 'Tượng Pikachu 3D Fondant nghệ thuật',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXCDVD9Eshg8hcKYI4i-G0X0RSPmtrP0RTUJf58bkkkgJKeouBvD6AjHW2aly1fNrXuhqfnVMvki1t_N9hMqd4h6FE0aK9cuLYgQwpfUatpUyVEfqnXwRLuKvOQRQy54W59b-ruCJCBvqPEB4BX-cIFcPczELlDtTfrMboHluFFgqsTN8vBaZFZZK6WwjdhFMsimhqtofR0A2GYEo3BD6i1tuWdAuF9EWSCqugGC_q3b4_94bG1U4j',
      tag: 'Ảnh thật tiệm đã làm',
    },
  ])

  // 3. CAM KẾT DỊCH VỤ
  const [commitOnTime, setCommitOnTime] = useState(true)
  const [commitCoolShipping, setCommitCoolShipping] = useState(true)
  const [commitMoneyBack, setCommitMoneyBack] = useState(true)

  // Countdown timer
  const [secondsLeft, setSecondsLeft] = useState(45 * 60)
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Toast
  const [toastMsg, setToastMsg] = useState(null)
  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Currency Formatter
  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num) + 'đ'

  // Upload thêm ảnh mô phỏng
  const handleAddSampleImage = () => {
    if (sampleImages.length >= 3) {
      showToast('Tiệm đã chọn đủ 3 ảnh minh họa tương tự!')
      return
    }
    const newImg = {
      id: Date.now(),
      name: 'Bánh Pikachu mini pastel tiệm vừa hoàn thiện',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJKGUpQnttx6C8qh0zlOYIudj45-hP0M1x2oXJ7AKkT-85T-jASQVtE2WvVkYZhbI6KyvKdxkpVRIpkIvyqcXcrG8xTc916ZfDypU6OfaP0wixDYQOjsPCkWHG_mv_c6CtdTozsYK3DhhA_ERpkN1t0E986z89ClZuAkd6EvzN_Pq4x_OE9Mhqgh2Q-Oy9SLP14uhALwf4acBLKtKGcR3e2aAUiCTdvPzVIQKu-Fy71iafUOwbMKPH',
      tag: 'Vừa tải lên',
    }
    setSampleImages((prev) => [...prev, newImg])
    showToast('Tải ảnh bánh tương tự thành công!')
  }

  const handleRemoveSampleImage = (id) => {
    setSampleImages((prev) => prev.filter((img) => img.id !== id))
  }

  // Submit Báo Giá — writes to shared Context
  const { addBid } = useAppData()

  const handleSubmitQuote = (e) => {
    e.preventDefault()

    // Build a bid object compatible with BiddingComparisonPage's BIDS_DATA shape
    const newBid = {
      id: `vendor-${Date.now()}`,
      rfqId: currentRfq.id,
      name: 'Tiệm Bánh Của Bạn',
      avatar: sampleImages[0]?.url || '',
      rating: 4.8,
      ordersCount: 120,
      tag: 'Báo Giá Mới',
      verified: true,
      isRecommended: false,
      ribbonText: 'Báo giá từ tiệm',
      badgeClass: 'bg-surface-container-high text-on-surface-variant',
      price: quotePrice,
      savingsText: currentRfq.budget ? `Tiết kiệm ${new Intl.NumberFormat('vi-VN').format(currentRfq.budget - quotePrice)}đ` : '',
      savingsSubtitle: 'So với ngân sách khách',
      durationDays: parseInt(completionHours, 10) || 2,
      durationText: `${completionHours} giờ hoàn thiện`,
      deliveryTime: currentRfq.deliveryTime || '15:30',
      deliveryNote: 'Đúng hẹn',
      deliveryType: commitCoolShipping ? 'Xe thùng lạnh chuyên dụng' : 'Giao hàng tiêu chuẩn',
      deliveryDesc: commitCoolShipping ? 'Bảo hiểm 100% dáng bánh kem' : 'Giao hàng cẩn thận',
      packageTitle: 'Gói dịch vụ bao gồm:',
      packageItems: [
        commitOnTime ? 'Cam kết giao đúng giờ' : '',
        commitCoolShipping ? 'Vận chuyển xe lạnh chuyên dụng' : '',
        commitMoneyBack ? 'Hoàn tiền nếu không đủ yêu cầu' : '',
      ].filter(Boolean),
      pitchTitle: 'Lời nhắn từ tiệm:',
      pitchQuote: `"${similarityNote}"`,
      speedRank: 99,
      sampleImages: sampleImages,
    }

    // Push bid to shared Context
    addBid(currentRfq.id, newBid)

    // Also persist to localStorage (legacy backup)
    try {
      const quotedRfqs = JSON.parse(localStorage.getItem('sweetcake_quoted_rfqs') || '[]')
      if (!quotedRfqs.includes(currentRfq.id)) {
        quotedRfqs.push(currentRfq.id)
        localStorage.setItem('sweetcake_quoted_rfqs', JSON.stringify(quotedRfqs))
      }
    } catch {}

    showToast(
      `Đã gửi báo giá ${formatVND(quotePrice)} thành công! Khách hàng sẽ nhận được thông báo ngầy bây giờ.`
    )

    setTimeout(() => {
      if (onNavigate) {
        onNavigate('vendor-rfq')
      }
    }, 1800)
  }

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
        activeTab="rfq"
        onNavigate={onNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* TOPBAR */}
      <VendorHeader
        title="Soạn Báo Giá Chi Tiết"
        subtitle={`Yêu cầu ${currentRfq.id} • Khách hàng ${currentRfq.customerName}`}
        backButton={{
          label: 'Quay lại Sàn RFQ',
          onClick: () => onNavigate && onNavigate('vendor-rfq'),
        }}
        onNavigate={onNavigate}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        showToast={showToast}
        actions={
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-1.5 rounded-full text-xs font-bold">
            <span className="material-symbols-outlined text-sm animate-spin">timer</span>
            <span className="hidden sm:inline">Hạn báo giá: </span>
            <span>{formatCountdown(secondsLeft)}</span>
          </div>
        }
      />

      {/* MAIN CONTENT WRAPPER */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        {/* MAIN BODY */}
        <main className="relative pt-24 w-full bg-surface min-h-screen pb-20">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 space-y-6">

            {/* 2-COLUMN LAYOUT: LEFT = CUSTOMER RFQ SUMMARY, RIGHT = QUOTE FORM */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* ================= CỘT TRÁI: THÔNG TIN ĐƠN HÀNG CỦA KHÁCH (PHẢI GIỮ) ================= */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                      Thông Tin Yêu Cầu Của Khách
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">auto_awesome</span>
                      Phù hợp: {currentRfq.matchScore || 98}%
                    </span>
                  </div>

                  {/* Ảnh khách upload */}
                  <div className="relative rounded-2xl overflow-hidden bg-surface-container aspect-4/3 group shadow-inner">
                    <img
                      src={currentRfq.image}
                      alt={currentRfq.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/75 text-white text-[11px] px-2.5 py-1 rounded-md font-medium">
                      Ảnh tham khảo khách upload
                    </span>
                  </div>

                  {/* Tên & mô tả */}
                  <div className="space-y-2">
                    <h2 className="font-headline-sm text-lg font-bold text-primary leading-snug">
                      {currentRfq.title}
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20">
                      {currentRfq.description}
                    </p>
                  </div>

                  {/* Key specs: Ngân sách, Ngày giao, Địa chỉ, Số tiệm đã báo giá */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                      <span className="text-outline block font-label-sm text-[11px]">Ngân sách của khách</span>
                      <strong className="font-headline-sm text-sm font-bold text-secondary mt-0.5 block">
                        {currentRfq.budgetDisplay || '1.000.000đ'}
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                      <span className="text-outline block font-label-sm text-[11px]">Thời gian giao</span>
                      <strong className="text-xs font-bold text-primary mt-0.5 block">
                        {currentRfq.deliveryFullText || '25/10 - 15:30'}
                      </strong>
                    </div>

                    <div className="col-span-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                      <span className="text-outline block font-label-sm text-[11px]">Địa chỉ giao bánh</span>
                      <strong className="text-xs font-medium text-primary mt-0.5 block">
                        {currentRfq.address}
                      </strong>
                      <span className="text-[11px] text-secondary font-semibold mt-1 inline-block">
                        • Cách tiệm {currentRfq.distanceKm || 5.4} km
                      </span>
                    </div>
                  </div>

                  {/* Số tiệm đã báo giá */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-medium">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                      Đã có: {currentRfq.bidsSent || 2}/{currentRfq.maxBids || 5} tiệm gửi báo giá
                    </span>
                    <span className="text-[11px] text-blue-700">Cơ hội chốt đơn cao</span>
                  </div>
                </div>
              </div>

              {/* ================= CỘT PHẢI: MÀN SOẠN BÁO GIÁ CHI TIẾT (MÀN THIẾU QUAN TRỌNG NHẤT) ================= */}
              <div className="lg:col-span-7">
                <form
                  onSubmit={handleSubmitQuote}
                  className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-sm border border-outline-variant/20 space-y-7"
                >
                  <div className="border-b border-outline-variant/15 pb-4">
                    <h1 className="font-headline-lg text-2xl font-bold text-primary tracking-tight">Soạn Báo Giá Cho Khách Hàng</h1>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Đưa ra mức giá hợp lý, cam kết kích thước, hương vị và hình ảnh minh chứng để
                      thắng thầu đơn hàng này.
                    </p>
                  </div>

                  {/* 1. THÔNG TIN BÁO GIÁ (Core MVP) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
                        1
                      </span>
                      <h3 className="font-headline-sm text-sm font-bold text-primary uppercase tracking-wider">
                        Thông Tin Báo Giá
                      </h3>
                    </div>

                    {/* Giá đề xuất */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary flex items-center justify-between">
                        <span>Mức giá đề xuất tới khách (VND):</span>
                        <span className="text-outline text-[11px] font-normal">
                          Ngân sách khách: {currentRfq.budgetDisplay || '1.000.000đ'}
                        </span>
                      </label>

                      {/* Các lựa chọn giá nhanh */}
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setQuotePrice(900000)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            quotePrice === 900000
                              ? 'border-secondary bg-secondary-fixed/50 font-bold text-primary shadow-xs'
                              : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          <span className="text-[11px] block">Cạnh tranh</span>
                          <span className="text-xs font-bold text-primary">900.000đ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setQuotePrice(950000)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            quotePrice === 950000
                              ? 'border-secondary bg-secondary-fixed/50 font-bold text-primary shadow-xs'
                              : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          <span className="text-[11px] text-secondary font-bold block">
                            Khuyên dùng ★
                          </span>
                          <span className="text-xs font-bold text-primary">950.000đ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setQuotePrice(1000000)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            quotePrice === 1000000
                              ? 'border-secondary bg-secondary-fixed/50 font-bold text-primary shadow-xs'
                              : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          <span className="text-[11px] block">Trọn gói cao cấp</span>
                          <span className="text-xs font-bold text-primary">1.000.000đ</span>
                        </button>
                      </div>

                      {/* Ô nhập giá tùy chỉnh */}
                      <div className="relative flex items-center pt-1">
                        <span className="absolute left-3.5 text-xs font-bold text-secondary select-none">
                          VNĐ
                        </span>
                        <input
                          type="number"
                          value={quotePrice}
                          onChange={(e) => setQuotePrice(Number(e.target.value))}
                          step="10000"
                          className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold text-primary focus:outline-none focus:border-secondary"
                        />
                      </div>
                    </div>

                    {/* Kích thước & Hương vị */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Size */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-primary">Kích thước (Size):</label>
                        <select
                          value={selectedCakeSize}
                          onChange={(e) => setSelectedCakeSize(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                        >
                          <option value="2-tier">2 Tầng (20cm + 14cm) • 15-18 khách ★</option>
                          <option value="20cm">Size 20cm (1 tầng cao) • 8-10 khách</option>
                          <option value="24cm">Size 24cm (1 tầng rộng) • 12-14 khách</option>
                          <option value="16cm">Size 16cm (Nhỏ gọn) • 4-6 khách</option>
                        </select>
                      </div>

                      {/* Hương vị */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-primary">
                          Hương vị / Cốt bánh:
                        </label>
                        <select
                          value={selectedFlavor}
                          onChange={(e) => setSelectedFlavor(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                        >
                          <option value="vanilla-strawberry">
                            Chiffon Vani dâu tây ít ngọt 30% ★
                          </option>
                          <option value="chocolate-belgium">Chocolate Bỉ socola đen cao cấp</option>
                          <option value="red-velvet">Red Velvet phô mai Mascarpone</option>
                          <option value="matcha-azuki">Trà xanh Matcha Uji đậu đỏ</option>
                        </select>
                      </div>
                    </div>

                    {/* Thời gian hoàn thành */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-primary">
                        Thời gian hoàn thành bánh:
                      </label>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setCompletionHours('4')}
                          className={`p-2 rounded-xl border text-center cursor-pointer ${
                            completionHours === '4'
                              ? 'border-secondary bg-secondary-fixed/50 font-bold text-primary'
                              : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant'
                          }`}
                        >
                          4 Giờ (Cấp tốc)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompletionHours('6')}
                          className={`p-2 rounded-xl border text-center cursor-pointer ${
                            completionHours === '6'
                              ? 'border-secondary bg-secondary-fixed/50 font-bold text-primary'
                              : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant'
                          }`}
                        >
                          6 Giờ (Tiêu chuẩn ★)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompletionHours('12')}
                          className={`p-2 rounded-xl border text-center cursor-pointer ${
                            completionHours === '12'
                              ? 'border-secondary bg-secondary-fixed/50 font-bold text-primary'
                              : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant'
                          }`}
                        >
                          Trước 12:00 ngày giao
                        </button>
                      </div>
                    </div>

                    {/* Ghi chú mức độ tương đồng & Lời nhắn */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-primary">
                          Ghi chú mức độ tương đồng &amp; Cam kết tay nghề:
                        </label>
                        <span className="text-[11px] font-bold text-secondary">
                          Có thể làm giống 90% - 95% mẫu
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={similarityNote}
                        onChange={(e) => setSimilarityNote(e.target.value)}
                        placeholder="Mô tả chi tiết giải pháp tạo hình, cam kết độ giống mẫu và các quà tặng kèm..."
                        className="w-full p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary focus:outline-none focus:border-secondary leading-relaxed resize-none"
                      />
                    </div>
                  </div>

                  {/* 2. ẢNH MINH HỌA BÁNH TƯƠNG TỰ ĐÃ LÀM (1-3 ảnh) */}
                  <div className="space-y-3 pt-2 border-t border-outline-variant/15">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
                          2
                        </span>
                        <h3 className="font-headline-sm text-sm font-bold text-primary uppercase tracking-wider">
                          Ảnh Minh Họa Bánh Tương Tự Đã Làm ({sampleImages.length}/3 ảnh)
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSampleImage}
                        className="text-xs font-bold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                        + Tải thêm ảnh
                      </button>
                    </div>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">
                      Upload 1-3 ảnh bánh thật tiệm từng làm giúp khách tin tưởng tuyệt đối vào tay nghề
                      và quyết định chọn tiệm của bạn.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {sampleImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative rounded-xl overflow-hidden aspect-4/3 bg-surface-container group shadow-sm border border-outline-variant/20"
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded">
                            {img.tag}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSampleImage(img.id)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Xóa ảnh này"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        </div>
                      ))}

                      {sampleImages.length < 3 && (
                        <div
                          onClick={handleAddSampleImage}
                          className="rounded-xl border-2 border-dashed border-outline-variant/40 hover:border-secondary aspect-4/3 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-surface-container-low/50 hover:bg-surface-container"
                        >
                          <span className="material-symbols-outlined text-secondary text-2xl mb-1">
                            upload
                          </span>
                          <span className="text-xs font-bold text-primary">+ Tải ảnh bánh mẫu</span>
                          <span className="text-[10px] text-outline mt-0.5">JPG, PNG</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. CAM KẾT DỊCH VỤ */}
                  <div className="space-y-3 pt-2 border-t border-outline-variant/15">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
                        3
                      </span>
                      <h3 className="font-headline-sm text-sm font-bold text-primary uppercase tracking-wider">
                        Cam Kết Dịch Vụ
                      </h3>
                    </div>

                    <div className="space-y-2 text-xs">
                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container transition-colors">
                        <input
                          type="checkbox"
                          checked={commitOnTime}
                          onChange={(e) => setCommitOnTime(e.target.checked)}
                          className="w-4 h-4 accent-secondary rounded cursor-pointer"
                        />
                        <span className="font-semibold text-primary">
                          ✓ Giao đúng giờ (Cam kết đúng 15:30 ngày 25/10)
                        </span>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container transition-colors">
                        <input
                          type="checkbox"
                          checked={commitCoolShipping}
                          onChange={(e) => setCommitCoolShipping(e.target.checked)}
                          className="w-4 h-4 accent-secondary rounded cursor-pointer"
                        />
                        <span className="font-semibold text-primary">
                          ✓ Xe lạnh / Thùng bảo quản chuyên dụng (Không chảy kem, không xô lệch)
                        </span>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container transition-colors">
                        <input
                          type="checkbox"
                          checked={commitMoneyBack}
                          onChange={(e) => setCommitMoneyBack(e.target.checked)}
                          className="w-4 h-4 accent-secondary rounded cursor-pointer"
                        />
                        <span className="font-semibold text-primary">
                          ✓ Hoàn tiền 100% nếu bánh bị hỏng dáng hoặc sai yêu cầu cốt bánh
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* 4. HÀNH ĐỘNG GỬI BÁO GIÁ */}
                  <div className="pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('vendor-rfq')}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface-variant transition-colors cursor-pointer"
                    >
                      Hủy &amp; Quay lại
                    </button>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() =>
                          showToast('Đã lưu bản thảo báo giá vào kho lưu trữ nội bộ tiệm!')
                        }
                        className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-primary transition-colors cursor-pointer"
                      >
                        Lưu nháp
                      </button>

                      <button
                        type="submit"
                        className="flex-1 sm:flex-initial px-8 py-3 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">send</span>
                        <span>Gửi Báo Giá Cho Khách ({formatVND(quotePrice)})</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default VendorBespokeQuoteSubmitPage
