import { INITIAL_RFQS } from '../../../mockData/vendor/rfqs.js'
import React, { useState, useMemo } from 'react'
import { useAppData } from '../../../context/AppDataContext.jsx'
import VendorSidebar from '../../../layouts/vendor/VendorSidebar'
import VendorHeader from '../../../layouts/vendor/VendorHeader'

export const VendorRfqMarketplacePage = ({ onNavigate }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBudget, setSelectedBudget] = useState('all')
  const [selectedDistance, setSelectedDistance] = useState('all')
  const [selectedUrgency, setSelectedUrgency] = useState('all')

  // Modals
  const [detailRfq, setDetailRfq] = useState(null)
  const [chatRfq, setChatRfq] = useState(null)
  const [chatMessageInput, setChatMessageInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'customer',
      senderName: 'Chị Hân Mai (Khách đặt bánh)',
      time: '15:10',
      text: 'Chào Bếp trưởng, mình muốn hỏi cốt Chiffon vani dâu tây có quá ngọt với bé 7 tuổi không ạ? Nhà mình muốn vị thanh tự nhiên ít ngọt 30%.',
    },
    {
      sender: 'chef',
      senderName: 'Bếp trưởng Jean-Luc',
      time: '15:14',
      text: 'Dạ chào chị Hân Mai! Cốt bánh tại tiệm sử dụng đường nho tự nhiên giảm 30% độ ngọt và vani Madagascar kết hợp dâu tây tươi, vị rất thanh nhẹ và an toàn cho bé ạ.',
    },
  ])

  // Toast
  const [toastMsg, setToastMsg] = useState(null)
  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // RFQ List Data — from shared Context (Customer-submitted RFQs appear here)
  const { rfqs, addBid, setActiveRfqId } = useAppData()

  // Navigation to Quote Submit page
  const handleGoToQuoteSubmit = (rfq) => {
    try {
      localStorage.setItem('sweetcake_current_quote_rfq', JSON.stringify(rfq))
    } catch {}
    if (onNavigate) {
      onNavigate('vendor-quote-submit', rfq)
    }
  }

  // FLOW 6: Vendor từ chối RFQ (Không đủ nguyên liệu / Kín lò)
  // (Filtered locally — doesn't remove from shared context for demo simplicity)
  const [rejectedIds, setRejectedIds] = useState([])
  const handleRejectRfq = (rfqId) => {
    setRejectedIds((prev) => [...prev, rfqId])
    setDetailRfq(null)
    showToast(`Đã từ chối RFQ ${rfqId} (Không nhận đơn). Khách hàng sẽ nhận được thông báo!`)
  }

  // Filter Logic — reads from context rfqs, excludes locally-rejected
  const filteredRfqs = useMemo(() => {
    return rfqs.filter((item) => {
      // Exclude locally rejected
      if (rejectedIds.includes(item.id)) return false

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(query)
        const matchDesc = (item.description || '').toLowerCase().includes(query)
        const matchId = item.id.toLowerCase().includes(query)
        const matchCustomer = (item.customerName || '').toLowerCase().includes(query)
        if (!matchTitle && !matchDesc && !matchId && !matchCustomer) return false
      }

      // Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false
      }

      // Budget
      if (selectedBudget === 'under500' && item.budget > 500000) return false
      if (selectedBudget === '500to1500' && (item.budget < 500000 || item.budget > 1500000))
        return false
      if (selectedBudget === 'over1500' && item.budget <= 1500000) return false

      // Distance
      if (selectedDistance === 'under5' && item.distanceKm > 5) return false
      if (selectedDistance === 'under10' && item.distanceKm > 10) return false

      // Urgency
      if (selectedUrgency === 'urgent' && !item.urgent) return false
      if (selectedUrgency === 'today' && !(item.needDate || '').includes('Hôm nay')) return false

      return true
    })
  }, [rfqs, rejectedIds, searchQuery, selectedCategory, selectedBudget, selectedDistance, selectedUrgency])

  // Open Chat
  const handleOpenChat = (rfq) => {
    setChatRfq(rfq)
  }

  const handleSendChatMessage = (e) => {
    e.preventDefault()
    if (!chatMessageInput.trim()) return
    const newMsg = {
      sender: 'chef',
      senderName: 'Bếp trưởng Jean-Luc',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: chatMessageInput.trim(),
    }
    setChatMessages((prev) => [...prev, newMsg])
    setChatMessageInput('')
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
        rfqCount={rfqs.length}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* TOPBAR */}
      <VendorHeader
        title="Chợ Yêu Cầu Báo Giá (RFQ)"
        subtitle="Yêu cầu đặt bánh thiết kế theo yêu cầu từ khách hàng toàn quốc"
        contextBadge={`${filteredRfqs.length} yêu cầu phù hợp tiệm`}
        onNavigate={onNavigate}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        showToast={showToast}
        actions={
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('vendor-orders')}
            className="px-3 sm:px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-primary border border-outline-variant/30 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">
              cake
            </span>
            <span className="hidden sm:inline">Đơn hàng đang làm (15)</span>
            <span className="sm:hidden">Đơn hàng (15)</span>
          </button>
        }
      />

      {/* MAIN CONTENT WRAPPER */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        {/* MAIN BODY */}
        <main className="relative pt-24 w-full bg-surface min-h-screen pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 space-y-6">
            {/* SEARCH & FILTERS BAR */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 space-y-4">
              {/* Search Box */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên bánh, mã #RFQ, hương vị, địa chỉ giao..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-on-surface-variant text-xs">Sắp xếp:</span>
                  <span className="px-3 py-1.5 rounded-xl bg-secondary text-on-secondary font-bold text-xs">
                    Phù hợp nhất với tiệm (AI Match)
                  </span>
                </div>
              </div>

              {/* Filter Selects */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-outline-variant/15">
                <div>
                  <label className="text-[11px] text-outline block mb-1">Loại bánh:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-medium text-primary focus:outline-none"
                  >
                    <option value="all">Tất cả loại bánh</option>
                    <option value="character">Bánh nhân vật &amp; 3D</option>
                    <option value="bento">Bento Cake Hàn Quốc</option>
                    <option value="wedding">Bánh cưới &amp; Sự kiện</option>
                    <option value="mousse">Mousse &amp; Entremet</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-outline block mb-1">Ngân sách:</label>
                  <select
                    value={selectedBudget}
                    onChange={(e) => setSelectedBudget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-medium text-primary focus:outline-none"
                  >
                    <option value="all">Tất cả mức giá</option>
                    <option value="under500">Dưới 500.000đ</option>
                    <option value="500to1500">500.000đ - 1.500.000đ</option>
                    <option value="over1500">Trên 1.500.000đ</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-outline block mb-1">Khoảng cách giao:</label>
                  <select
                    value={selectedDistance}
                    onChange={(e) => setSelectedDistance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-medium text-primary focus:outline-none"
                  >
                    <option value="all">Toàn khu vực phục vụ</option>
                    <option value="under5">Gần tiệm (Dưới 5 km)</option>
                    <option value="under10">Dưới 10 km</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-outline block mb-1">Thời gian cần:</label>
                  <select
                    value={selectedUrgency}
                    onChange={(e) => setSelectedUrgency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-medium text-primary focus:outline-none"
                  >
                    <option value="all">Tất cả thời gian</option>
                    <option value="urgent">Sắp hết hạn báo giá</option>
                    <option value="today">Cần giao trong ngày</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RFQ CARDS LIST */}
            <div className="space-y-4">
              {filteredRfqs.length === 0 ? (
                <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 text-on-surface-variant text-sm">
                  Không tìm thấy yêu cầu nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                filteredRfqs.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-5 sm:p-6 hover:shadow-md transition-shadow flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between"
                  >
                    {/* Left & Center: Information */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 min-w-0">
                      {/* Image Thumbnail */}
                      <div
                        className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-surface-container shrink-0 cursor-pointer group shadow-sm"
                        onClick={() => setDetailRfq(rfq)}
                      >
                        <img
                          src={rfq.image}
                          alt={rfq.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                          Ảnh mẫu khách gửi
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Badges & Match */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-secondary text-xs">
                            {rfq.id}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium">
                            {rfq.categoryName}
                          </span>

                          {/* AI Match % (Điểm cộng recommendation) */}
                          <span
                            className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1"
                            title={rfq.matchReason}
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              auto_awesome
                            </span>
                            Phù hợp: {rfq.matchScore}%
                          </span>

                          {/* Countdown Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                              rfq.urgent
                                ? 'bg-rose-100 text-rose-800 animate-pulse'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">alarm</span>
                            {rfq.timeLeftHours}
                          </span>
                        </div>

                        {/* Title */}
                        <h2
                          className="font-headline-sm text-lg font-bold text-primary leading-snug hover:text-secondary cursor-pointer"
                          onClick={() => setDetailRfq(rfq)}
                        >
                          {rfq.title}
                        </h2>

                        {/* Description snippet */}
                        <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                          {rfq.description}
                        </p>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                          <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <span className="material-symbols-outlined text-secondary text-[16px]">
                              payments
                            </span>
                            <span>
                              Ngân sách:{' '}
                              <strong className="font-headline-sm text-secondary font-bold text-sm sm:text-base">
                                {rfq.budgetDisplay}
                              </strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <span className="material-symbols-outlined text-secondary text-[16px]">
                              event
                            </span>
                            <span>
                              Giao: <strong>{rfq.deliveryFullText}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-on-surface-variant truncate">
                            <span className="material-symbols-outlined text-secondary text-[16px]">
                              location_on
                            </span>
                            <span className="truncate" title={rfq.address}>
                              {rfq.shortAddress} ({rfq.distanceKm}km)
                            </span>
                          </div>
                        </div>

                        {/* Quoting Status */}
                        <div className="text-xs text-on-surface-variant flex items-center gap-2 pt-0.5">
                          <span className="inline-flex items-center gap-1 text-primary font-semibold">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            Đã có: {rfq.bidsSent}/{rfq.maxBids} tiệm báo giá
                          </span>
                          <span className="text-outline-variant">•</span>
                          <span className="text-emerald-700 font-medium">
                            Khách: <strong>{rfq.customerName}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: 3 Action Buttons */}
                    <div className="flex sm:flex-row lg:flex-col gap-2 w-full lg:w-48 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-outline-variant/15">
                      <button
                        type="button"
                        onClick={() => handleGoToQuoteSubmit(rfq)}
                        className="flex-1 lg:w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          edit_document
                        </span>
                        <span>Soạn báo giá</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetailRfq(rfq)}
                        className="flex-1 lg:w-full py-2 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary text-xs font-semibold border border-outline-variant/30 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>Xem chi tiết</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenChat(rfq)}
                        className="flex-1 lg:w-full py-2 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          chat
                        </span>
                        <span>Chat hỏi khách</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ================= MODAL: XEM CHI TIẾT RFQ ================= */}
      {detailRfq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div>
                <span className="font-label-sm text-label-sm font-bold text-secondary uppercase tracking-wider">
                  Chi Tiết Yêu Cầu Đặt Bánh #{detailRfq.id}
                </span>
                <h3 className="font-headline-md text-xl font-bold text-primary">{detailRfq.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailRfq(null)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-surface-container">
                <img
                  src={detailRfq.image}
                  alt={detailRfq.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-surface-container-low space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-outline">Khách hàng:</span>
                    <span className="font-bold text-primary">{detailRfq.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Ngân sách dự kiến:</span>
                    <span className="font-bold text-secondary text-sm">
                      {detailRfq.budgetDisplay}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Thời gian cần nhận:</span>
                    <span className="font-semibold text-primary">
                      {detailRfq.deliveryFullText}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Địa điểm giao:</span>
                    <span className="font-semibold text-primary text-right">
                      {detailRfq.address}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Số lượng báo giá:</span>
                    <span className="font-bold text-blue-700">
                      {detailRfq.bidsSent}/{detailRfq.maxBids} tiệm đã gửi
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60 space-y-1">
                  <span className="font-bold text-emerald-900 block">
                    Độ phù hợp với xưởng của bạn: {detailRfq.matchScore}%
                  </span>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    {detailRfq.matchReason}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-primary">Mô tả &amp; Ghi chú của khách hàng:</h4>
              <p className="p-3.5 rounded-xl bg-surface-container-low text-on-surface leading-relaxed">
                {detailRfq.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-outline block text-[11px]">Kích thước / Khẩu phần:</span>
                <span className="font-bold text-primary">{detailRfq.sizeRequirement}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-outline block text-[11px]">Chữ viết trên bánh:</span>
                <span className="font-bold text-secondary">"{detailRfq.inscription}"</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDetailRfq(null)}
                className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleRejectRfq(detailRfq.id)}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                title="Từ chối yêu cầu này do không đủ nguyên liệu hoặc kín lịch"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>Từ chối RFQ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = detailRfq
                  setDetailRfq(null)
                  handleGoToQuoteSubmit(target)
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">edit_document</span>
                <span>Soạn báo giá ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHAT VỚI KHÁCH HÀNG ================= */}
      {chatRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in fade-in">
            <div className="px-5 py-3.5 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs">
                  KH
                </div>
                <div>
                  <h4 className="font-bold text-xs text-primary">{chatRfq.customerName}</h4>
                  <p className="text-[10px] text-on-surface-variant truncate max-w-[200px]">
                    Hỏi về: {chatRfq.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatRfq(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'chef' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-outline mb-0.5">{msg.senderName}</span>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                      msg.sender === 'chef'
                        ? 'bg-primary text-on-primary rounded-br-none'
                        : 'bg-surface-container-low text-on-surface rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSendChatMessage}
              className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatMessageInput}
                onChange={(e) => setChatMessageInput(e.target.value)}
                placeholder="Nhập câu hỏi tư vấn cho khách hàng..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-surface-container-lowest text-xs focus:outline-none border border-outline-variant/30"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-primary hover:bg-secondary text-on-primary cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorRfqMarketplacePage
