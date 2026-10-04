import { STAGE_LOGS, BIDS_DATA, STEPS, LOGS_DATA } from '../../../mockData/customer/quotes.js'
import { useState, useEffect } from 'react'
import { useAppData } from '../../../context/AppDataContext.jsx'


// State machine steps with icons & times matching 8-step workflow

// Mapping trạng thái tiếng Việt
const STATUS_VN_MAP = {
  OPEN: 'Đang mở yêu cầu',
  QUOTED: 'Đang nhận báo giá',
  CUSTOMER_ACCEPTED: 'Khách đã chọn tiệm',
  VENDOR_CONFIRMED: 'Tiệm đã xác nhận',
  PAID: 'Đã ký quỹ Escrow',
  BAKING: 'Đang làm bánh',
  DELIVERING: 'Đang giao hàng',
  COMPLETED: 'Đã hoàn thành',
  EXPIRED: 'Đã hết hạn',
  CLOSED: 'Đã đóng yêu cầu',
  CANCELLED: 'Đã hủy yêu cầu',
}

export const BiddingComparisonPage = ({ onAddToCart, onNavigate }) => {
  // Shared context: rfqs list, bids map, acceptBid action
  const { rfqs, bids: contextBids, activeRfqId, acceptBid: ctxAcceptBid } = useAppData()

  // Load active RFQ: prefer context (most up-to-date), fallback to localStorage
  const [rfqData, setRfqData] = useState(() => {
    const rfqFromCtx = rfqs.find((r) => r.id === activeRfqId)
    if (rfqFromCtx) return rfqFromCtx
    try {
      const saved = localStorage.getItem('sweetcake_active_rfq')
      if (saved) return JSON.parse(saved)
    } catch { }
    return {
      id: '#RFQ-2025-8892',
      title: 'Banh Sinh Nhat Pikachu 2 Tang Cho Be Minh Khang 7 Tuoi (Han)',
      conceptTitle: 'Pikachu Cake',
      budget: 1000000,
      needDate: 'Hôm nay (20/09/2026)',
      deliveryTimeSlot: '15:30 - 16:30',
      deliveryAddress: 'Quan 1, TP. Ho Chi Minh (Giao tan sanh tiec)',
      selectedSize: '2 Tang (25cm + 18cm)',
      flavors: 'Vanilla Madagascar & Dau tuoi',
      cakeMessage: 'Happy 7th Birthday Minh Khang!',
      customerNote: 'Banh cho tiec sinh nhat 7 tuoi be Minh Khang.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAEi3FCt7W-hZS3tOZkx_FOp3iaxhTkZOqxjrbU20sI6rY-J8W1E3s--EdgpBkhmseX3yT1w79c4szKJyyb1MvfNM69ttOwzb7ll43Z7PiVRg8az6l7iIm_baIumuH1ZfG15h-joWvCoGOBGVMLVjsSAKxCeqKl2CfQtkcjq6C3MUwsyhG7M9ioLYae5tfdAbtddHWm12fAXL8HoC-Bk3ZSYMAOCH-IUoIdQT9s_AnnLLMDSxHPTok5',
      status: 'QUOTED',
    }
  })

  // Core Flow Status: OPEN | QUOTED | CUSTOMER_ACCEPTED | VENDOR_CONFIRMED | PAID | BAKING | DELIVERING | COMPLETED
  const [currentStatus, setCurrentStatus] = useState('QUOTED')
  const [acceptedBid, setAcceptedBid] = useState(null)
  const [declinedBidIds, setDeclinedBidIds] = useState([])
  const [orderCode, setOrderCode] = useState(null)
  const [noticeMessage, setNoticeMessage] = useState(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('Đã tìm được phương án khác')

  // Filters and chat
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'lowest' | 'fastest'
  const [chattingWith, setChattingWith] = useState(null)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])

  // Countdown timer simulation
  const [countdownSeconds, setCountdownSeconds] = useState(
    4 * 3600 + 27 * 60 + 35
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Sync active RFQ: prefer context state, fallback to localStorage
  useEffect(() => {
    const rfqFromCtx = rfqs.find((r) => r.id === activeRfqId)
    if (rfqFromCtx) {
      setRfqData(rfqFromCtx)
    } else {
      try {
        const saved = localStorage.getItem('sweetcake_active_rfq')
        if (saved) {
          const parsed = JSON.parse(saved)
          setRfqData(parsed)
        }
      } catch { }
    }

    try {
      const isEdited = localStorage.getItem('sweetcake_rfq_edited_notice')
      if (isEdited) {
        localStorage.removeItem('sweetcake_rfq_edited_notice')
        setCurrentStatus('QUOTED')
        setAcceptedBid(null)
        setNoticeMessage({
          type: 'warning',
          title: 'ĐÃ CẬP NHẬT YÊU CẦU THIẾT KẾ BÁNH & RESET BÁO GIÁ!',
          text: 'Do bạn đã chỉnh sửa thông số yêu cầu/ngân sách, toàn bộ các báo giá cũ đã được reset. Yêu cầu mới đang được mở nhận đấu thầu lại từ các tiệm bánh.',
        })
      } else {
        const accepted = localStorage.getItem('sweetcake_accepted_bid')
        if (!accepted) {
          setAcceptedBid(null)
        }
      }
    } catch { }
  }, [rfqs, activeRfqId])

  const formatCountdown = (totalSecs) => {
    const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0')
    const s = String(totalSecs % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  // 1. Kh ch n m t b o gi  -> L u ti m & Nh y sang m n h nh Thanh To n
  const handleAcceptBid = (bid) => {
    if (declinedBidIds.includes(bid.id)) return
    const code = orderCode || `#ORD-2025-${Math.floor(1000 + Math.random() * 9000)}`
    setAcceptedBid(bid)
    setOrderCode(code)
    setCurrentStatus('VENDOR_CONFIRMED')
    try {
      localStorage.setItem('sweetcake_accepted_bid', JSON.stringify({ ...bid, orderCode: code }))
      localStorage.setItem('sweetcake_active_order_code', code)
      localStorage.setItem('sweetcake_order_bakery', bid.name)
    } catch { }

    // Notify shared context: creates pending order in Vendor Kanban
    ctxAcceptBid(rfqData?.id || activeRfqId, bid)

    if (onAddToCart) {
      onAddToCart({
        id: code,
        title: `${rfqData?.conceptTitle || rfqData?.title || 'Banh Kem Nghe Thuat'} (${bid.name})`,
        price: bid.price,
        selectedSize: rfqData?.selectedSize || 'Size Tieu Chuan',
        cakeMessage: rfqData?.cakeMessage || '',
        deliveryDate: rfqData?.needDate || 'Hôm nay (20/09/2026)',
        image: rfqData?.image,
      })
    }

    // Chon tiem xong -> Nhay qua man hinh thanh toan
    if (onNavigate) {
      onNavigate('payment')
    } else {
      window.history.pushState(null, '', '/payment')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  // 2. Kịch bản A: Tiệm đồng ý nhận làm -> VENDOR_CONFIRMED
  const handleVendorConfirm = () => {
    if (!acceptedBid) return
    const newOrderCode = `#ORD-${Date.now().toString().slice(-6)}`
    setOrderCode(newOrderCode)
    setCurrentStatus('VENDOR_CONFIRMED')
    try {
      localStorage.setItem('sweetcake_accepted_bid', JSON.stringify({ ...acceptedBid, orderCode: newOrderCode }))
      localStorage.setItem('sweetcake_active_order_code', newOrderCode)
    } catch { }
    setNoticeMessage({
      type: 'success',
      title: `${acceptedBid.name} ĐÃ XÁC NHẬN NHẬN LÀM ĐƠN!`,
      text: `Đơn hàng ${newOrderCode} đã được khởi tạo thành công. Đang chuyển sang màn hình thanh toán để ký quỹ Escrow...`,
    })
    // Tới chỗ thanh toán -> Nhảy qua màn hình thanh toán
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('payment')
      } else {
        window.history.pushState(null, '', '/payment')
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    }, 800)
  }

  // 3. Kịch bản B: Tiệm đổi ý từ chối sau khi khách chọn -> VENDOR_DECLINED -> QUAY LẠI OPEN/QUOTED
  const handleVendorDecline = () => {
    if (!acceptedBid) return
    const declinedName = acceptedBid.name
    const declinedId = acceptedBid.id

    // Thêm tiệm vào danh sách đã từ chối
    setDeclinedBidIds((prev) => [...prev, declinedId])
    setAcceptedBid(null)
    // Request quay lại OPEN / QUOTED
    setCurrentStatus('OPEN')
    setNoticeMessage({
      type: 'warning',
      title: `${declinedName.toUpperCase()} ĐÃ TỪ CHỐI NHẬN ĐƠN`,
      text: `Do bếp trưởng kín lịch tiệc, ${declinedName} không thể nhận đơn này. Hệ thống đã đưa yêu cầu quay lại trạng thái OPEN. Báo giá của ${declinedName} đã bị hủy, bạn có thể chọn một trong các báo giá khác bên dưới.`,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 4. Khách thanh toán -> Nhảy qua màn hình thanh toán
  const handlePayment = () => {
    if (!acceptedBid) return
    const code = orderCode || `#ORD-2025-${Math.floor(1000 + Math.random() * 9000)}`
    try {
      localStorage.setItem('sweetcake_accepted_bid', JSON.stringify({ ...acceptedBid, orderCode: code }))
      localStorage.setItem('sweetcake_active_order_code', code)
      localStorage.setItem('sweetcake_order_bakery', acceptedBid.name)
    } catch { }
    if (onAddToCart) {
      onAddToCart({
        id: code,
        title: `${rfqData?.conceptTitle || rfqData?.title || 'Bánh Kem Nghệ Thuật'} (${acceptedBid.name})`,
        price: acceptedBid.price,
        selectedSize: rfqData?.selectedSize || 'Size Tiêu Chuẩn',
        cakeMessage: rfqData?.cakeMessage || '',
        deliveryDate: rfqData?.needDate || 'Hôm nay (20/09/2026)',
        image: rfqData?.image,
      })
    }

    // Tới chỗ thanh toán -> Nhảy qua màn hình thanh toán
    if (onNavigate) {
      onNavigate('payment')
    } else {
      window.history.pushState(null, '', '/payment')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  // Đánh dấu hoàn thành đơn hàng -> Lưu vào lịch sử đơn hàng
  const handleCompleteOrder = () => {
    setCurrentStatus('COMPLETED')
    try {
      localStorage.setItem('sweetcake_delivery_status', 'COMPLETED')
      const targetOrderId = orderCode || '#ORD-2025-9982'
      const newCompletedOrder = {
        id: targetOrderId,
        title:
          rfqData?.title ||
          'Bánh Sinh Nhật Pikachu 2 Tầng Cho Bé Minh Khang 7 Tuổi',
        subtitle: `Xưởng thực hiện: ${acceptedBid?.name || 'Sweet Bakery'
          } • Quy cách: ${rfqData?.selectedSize || '2 Tầng (25cm + 18cm)'}`,
        completedDate: `Hôm nay, ${new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })} (${new Date().toLocaleDateString('vi-VN')}) • Giao đến ${rfqData?.deliveryAddress || 'Quận 1, TP. Hồ Chí Minh'
          }`,
        price: acceptedBid?.price || rfqData?.budget || 950000,
        image:
          acceptedBid?.image ||
          rfqData?.image ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAEi3FCt7W-hZS3tOZkx_FOp3iaxhTkZOqxjrbU20sI6rY-J8W1E3s--EdgpBkhmseX3yT1w79c4szKJyyb1MvfNM69ttOwzb7ll43Z7PiVRg8az6l7iIm_baIumuH1ZfG15h-joWvCoGOBGVMLVjsSAKxCeqKl2CfQtkcjq6C3MUwsyhG7M9ioLYae5tfdAbtddHWm12fAXL8HoC-Bk3ZSYMAOCH-IUoIdQT9s_AnnLLMDSxHPTok5',
        deliveryNote:
          'Đã giao xe lạnh chuyên dụng đạt chuẩn 4.8°C • Đồng kiểm nguyên vẹn 100%',
        bakery: acceptedBid?.name || 'Sweet Bakery',
        isNew: true,
      }
      const existingCompleted = localStorage.getItem('sweetcake_completed_orders')
      let list = existingCompleted ? JSON.parse(existingCompleted) : []
      list = [newCompletedOrder, ...list.filter((o) => o.id !== targetOrderId)]
      localStorage.setItem('sweetcake_completed_orders', JSON.stringify(list))
    } catch (err) {
      console.error(err)
    }
  }

  // Reset về trạng thái ban đầu để test
  const handleResetFlow = () => {
    setCurrentStatus('QUOTED')
    setAcceptedBid(null)
    setDeclinedBidIds([])
    setOrderCode(null)
    setNoticeMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Khách hủy yêu cầu RFQ
  const handleConfirmCancelRfq = () => {
    setIsCancelModalOpen(false)
    setCurrentStatus('CANCELLED')
    setNoticeMessage({
      type: 'warning',
      title: 'YÊU CẦU #RFQ ĐÃ ĐƯỢC HỦY THÀNH CÔNG',
      text: `Lý do hủy: "${cancelReason || 'Khách hàng thay đổi kế hoạch'}". Toàn bộ các báo giá đã chuyển sang trạng thái VÔ HIỆU HÓA. Không có khoản cọc nào bị trừ.`,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Gia hạn thêm 24h khi hết hạn (EXPIRED -> OPEN/QUOTED)
  const handleExtendRfq = () => {
    setCountdownSeconds(24 * 3600)
    setCurrentStatus('QUOTED')
    setNoticeMessage({
      type: 'success',
      title: 'ĐÃ GIA HẠN YÊU CẦU THÊM 24 GIỜ!',
      text: 'Yêu cầu của bạn đã được gia hạn thời gian và đẩy lên radar ưu tiên để các tiệm bánh tiếp tục gửi báo giá.',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Mở lại yêu cầu sau khi bị đóng 7 ngày (CLOSED -> QUOTED)
  const handleReopenRfq = () => {
    setCurrentStatus('QUOTED')
    setDeclinedBidIds([])
    setCountdownSeconds(48 * 3600)
    setNoticeMessage({
      type: 'success',
      title: 'ĐÃ MỞ LẠI YÊU CẦU THÀNH CÔNG!',
      text: 'Các tiệm bánh sẽ nhận được thông báo để gửi lại báo giá mới nhất cho bạn.',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Bids source: merge context bids (from Vendor) with static demo bids
  const baseBids = BIDS_DATA
  const ctxBidsForRfq = contextBids[rfqData?.id] || []
  // Vendor-submitted bids appear first; static demo bids fill in for default demo RFQ
  const allBids = [
    ...ctxBidsForRfq,
    ...baseBids.filter((b) => !ctxBidsForRfq.find((c) => c.id === b.id)),
  ]

  // Dynamic Bids scaled to customer budget
  const dynamicBids = allBids.map((bid) => {
    const budget = rfqData?.budget || 1000000
    let calculatedPrice = bid.price
    // Only re-scale static demo bids (no rfqId field)
    if (budget !== 1000000 && !bid.rfqId) {
      if (bid.id === 'sweet-bakery') {
        calculatedPrice = Math.round((budget * 0.95) / 10000) * 10000
      } else if (bid.id === 'moon-bakery') {
        calculatedPrice = Math.round((budget * 0.9) / 10000) * 10000
      } else if (bid.id === 'abc-bakery') {
        calculatedPrice = Math.round((budget * 0.92) / 10000) * 10000
      }
    }
    const savings = Math.max(0, budget - calculatedPrice)
    const cakeName = rfqData?.conceptTitle || rfqData?.title || 'banh kem nghe thuat'

    return {
      ...bid,
      price: calculatedPrice,
      savingsText: savings > 0 ? `Tiet kiem ${savings.toLocaleString('vi-VN')}d` : 'Bao gia xuong tot nhat',
      savingsSubtitle: `So voi ngan sach ${budget.toLocaleString('vi-VN')}d`,
      pitchQuote:
        bid.rfqId
          ? bid.pitchQuote // Vendor-submitted: keep its own pitch
          : bid.id === 'sweet-bakery'
            ? `"Chao ban, Sweet Bakery chuyen lam ${cakeName} chuan mau tu kem bo Phap & bo Elle & Vire. Cam ket giong hinh mau tren 95%!"`
            : bid.id === 'moon-bakery'
              ? `"Moon Bakery co san cot Chiffon tuoi huu co cho mau ${cakeName}, nhan lam chuan hen voi muc gia toi uu nhat san!"`
              : `"ABC Bakery cam ket tao hinh ${cakeName} ti mi, tang day du phu kien tiec va giao xe chong soc an toan!"`,
    }
  })

  // Sorting
  const filteredBids = [...dynamicBids].sort((a, b) => {
    if (activeFilter === 'lowest') return a.price - b.price
    if (activeFilter === 'fastest') return a.speedRank - b.speedRank
    return 0
  })

  // Chat logic
  const handleOpenChat = (bid) => {
    setChattingWith(bid)
    setChatHistory([
      {
        sender: 'bakery',
        text: bid.pitchQuote.replace(/^"|"$/g, ''),
        time: '09:45',
      },
    ])
  }

  const handleSendChatMessage = (e) => {
    e.preventDefault()
    if (!chatMessage.trim()) return
    const newMsg = {
      sender: 'user',
      text: chatMessage,
      time: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    setChatHistory((prev) => [...prev, newMsg])
    setChatMessage('')
  }

  return (
    <div className="w-full striped-candy-bg min-h-screen pb-20">
      <div className="flex flex-col w-full">
        {/* Ambient Glow Element */}
        <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6">
          <div className="absolute top-12 left-1/3 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute top-48 right-12 w-80 h-80 rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none -z-10"></div>

          {/* ========================================================================= */}
          {/* 1. SCENARIO TESTER BAR (Cho phép bấm thử trực tiếp các flow) */}
          {/* ========================================================================= */}
          <div className="mb-6 p-4.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-bold text-base shrink-0">
                <span className="material-symbols-outlined text-xl">tune</span>
              </span>
              <div>
                <h4 className="font-label-md text-sm sm:text-base font-bold text-primary flex items-center gap-2">
                  <span>Bảng Chuyển Kịch Bản Thử Nghiệm</span>
                  <span className="bg-secondary-fixed text-on-secondary-fixed text-xs px-2 py-0.5 rounded-full font-bold">Môi trường thử nghiệm</span>
                </h4>
                <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5">
                  Bấm để chuyển đổi nhanh giữa các trường hợp thực tế
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
              <button
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${currentStatus === 'QUOTED' || currentStatus === 'OPEN'
                    ? 'bg-secondary text-on-secondary shadow-sm font-bold'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                onClick={handleResetFlow}
                type="button"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                1. Đang có báo giá
              </button>

              <button
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${currentStatus === 'EXPIRED'
                    ? 'bg-amber-600 text-white shadow-sm font-bold'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                onClick={() => {
                  setCurrentStatus('EXPIRED')
                  setNoticeMessage({
                    type: 'warning',
                    title: 'HẾT HẠN 48 GIỜ: CHƯA CÓ TIỆM BÁO GIÁ',
                    text: 'Yêu cầu đã quá 48h nhưng chưa có xưởng bánh nào nộp báo giá phù hợp ngân sách. Bạn có thể gia hạn thêm 24h hoặc hủy yêu cầu.',
                  })
                }}
                type="button"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                2. Quá 48h chưa ai nhận
              </button>

              <button
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${declinedBidIds.length > 0
                    ? 'bg-rose-600 text-white shadow-sm font-bold'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                onClick={() => {
                  const firstBid = dynamicBids[0]
                  setAcceptedBid(firstBid)
                  setTimeout(() => {
                    handleVendorDecline()
                  }, 50)
                }}
                type="button"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                3. Tiệm từ chối
              </button>

              <button
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${currentStatus === 'CLOSED'
                    ? 'bg-slate-700 text-white shadow-sm font-bold'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                onClick={() => {
                  setCurrentStatus('CLOSED')
                  setNoticeMessage({
                    type: 'info',
                    title: 'YÊU CẦU ĐÃ ĐÓNG: QUÁ 7 NGÀY KHÔNG CHỌN BÁO GIÁ',
                    text: 'Hệ thống đã tự động đóng yêu cầu này để giải phóng năng lực cho các xưởng bánh.',
                  })
                }}
                type="button"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                4. Quá 7 ngày không chọn
              </button>

              <button
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${currentStatus === 'CANCELLED'
                    ? 'bg-red-700 text-white shadow-sm font-bold'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                onClick={() => {
                  setCurrentStatus('CANCELLED')
                  setNoticeMessage({
                    type: 'warning',
                    title: 'YÊU CẦU ĐÃ HỦY',
                    text: 'Yêu cầu đã được hủy bởi khách hàng. Toàn bộ các báo giá đã hết hiệu lực.',
                  })
                }}
                type="button"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                5. Khách hủy đơn
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1.1 VISUAL 8-STEP WORKFLOW STATE MACHINE PROGRESS BAR */}
          {/* ========================================================================= */}
          <div className="mb-6 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm overflow-x-auto">
            <div className="flex items-center min-w-[750px] justify-between relative">
              {STEPS.map((step, idx) => {
                const stepKeys = STEPS.map((s) => s.key)
                const currentIdx = stepKeys.indexOf(currentStatus)
                const isPassed = idx < currentIdx
                const isCurrent = step.key === currentStatus

                return (
                  <div key={step.key} className="flex flex-col items-center text-center relative z-10 flex-1 px-1">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all mb-1.5 ${isCurrent
                          ? 'bg-secondary text-on-secondary shadow-md ring-4 ring-secondary/20 scale-110 font-bold'
                          : isPassed
                            ? 'bg-emerald-700 text-white font-bold'
                            : 'bg-surface-container-highest text-on-surface-variant font-bold border border-outline-variant/40'
                        }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {isPassed ? 'check' : step.icon}
                      </span>
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-bold tracking-tight ${isCurrent
                          ? 'text-secondary'
                          : isPassed
                            ? 'text-emerald-800'
                            : 'text-on-surface-variant'
                        }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium mt-0.5 truncate max-w-[100px]">
                      {step.desc}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. DYNAMIC NOTIFICATION / ACTION BANNERS FOR EACH STAGE */}
          {/* ========================================================================= */}
          {noticeMessage && (
            <div
              className={`mb-8 p-5 rounded-2xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in ${noticeMessage.type === 'success'
                  ? 'bg-green-50/90 border-green-200 text-green-900'
                  : noticeMessage.type === 'warning'
                    ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                    : 'bg-blue-50/90 border-blue-200 text-blue-900'
                }`}
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-2xl shrink-0 mt-0.5">
                  {noticeMessage.type === 'success'
                    ? 'check_circle'
                    : noticeMessage.type === 'warning'
                      ? 'warning'
                      : 'info'}
                </span>
                <div>
                  <h4 className="font-bold text-base leading-tight">
                    {noticeMessage.title}
                  </h4>
                  <p className="text-sm mt-1 leading-relaxed opacity-90">
                    {noticeMessage.text}
                  </p>
                </div>
              </div>

              {/* Action buttons inside banner depending on state */}
              {currentStatus === 'CUSTOMER_ACCEPTED' && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    className="px-4 py-2 rounded-xl bg-secondary text-on-secondary hover:bg-secondary/90 font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    onClick={() => onNavigate && onNavigate('tracking')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      local_shipping
                    </span>
                    Đi đến trang Theo Dõi Đơn Hàng
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    onClick={handleVendorConfirm}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      thumb_up
                    </span>
                    Tiệm đồng ý làm
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    onClick={handleVendorDecline}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      thumb_down
                    </span>
                    Tiệm đổi ý từ chối
                  </button>
                </div>
              )}

              {currentStatus === 'VENDOR_CONFIRMED' && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                    onClick={handlePayment}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">
                      lock_open
                    </span>
                    Thanh Toán Escrow ({acceptedBid?.price.toLocaleString('vi-VN')}đ)
                  </button>
                  <button
                    className="px-4 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                    onClick={() => onNavigate && onNavigate('tracking')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      local_shipping
                    </span>
                    Màn hình Theo Dõi
                  </button>
                </div>
              )}

              {currentStatus === 'PAID' && (
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    className="px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary/90 cursor-pointer flex items-center gap-1"
                    onClick={() => onNavigate && onNavigate('tracking')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      local_shipping
                    </span>
                    Mở Màn hình Theo Dõi Tiến Trình
                  </button>
                  <button
                    className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 cursor-pointer"
                    onClick={() => setCurrentStatus('BAKING')}
                    type="button"
                  >
                    Tiếp: Đang làm bánh
                  </button>
                  <button
                    className="px-3.5 py-1.5 rounded-xl bg-surface-container text-primary text-xs font-bold hover:bg-surface-container-high cursor-pointer"
                    onClick={() => setCurrentStatus('DELIVERING')}
                    type="button"
                  >
                    Tiếp: Đang giao
                  </button>
                  <button
                    className="px-3.5 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 cursor-pointer flex items-center gap-1"
                    onClick={handleCompleteOrder}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Hoàn thành
                  </button>
                  {currentStatus === 'COMPLETED' && (
                    <button
                      className="px-3.5 py-1.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary/90 cursor-pointer flex items-center gap-1 shadow-sm animate-fade-in"
                      onClick={() => onNavigate && onNavigate('profile')}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">receipt_long</span>
                      Xem trong Lịch Sử Đơn Hàng
                    </button>
                  )}
                </div>
              )}

              {currentStatus === 'EXPIRED' && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    onClick={handleExtendRfq}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">more_time</span>
                    Gia Hạn Thêm 24 Giờ
                  </button>
                  <button
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    onClick={() => setIsCancelModalOpen(true)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    Hủy Yêu Cầu Này
                  </button>
                </div>
              )}

              {currentStatus === 'CLOSED' && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    onClick={handleReopenRfq}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">replay</span>
                    Mở Lại Yêu Cầu &amp; Nhận Báo Giá Mới
                  </button>
                </div>
              )}

              {currentStatus === 'CANCELLED' && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    onClick={() => onNavigate && onNavigate('ai-studio')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    Thiết Kế Mẫu Bánh Mới
                  </button>
                  <button
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-surface-container text-primary border border-outline-variant font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    onClick={handleReopenRfq}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">undo</span>
                    Khôi Phục Yêu Cầu Này
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. REQUEST BRIEF BENTO PANEL (Khách đăng: Pikachu Cake, 1tr, 20/10) */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-md p-6 lg:p-8 mb-10 relative overflow-hidden border border-outline-variant/30">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: AI Design Preview */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="relative group rounded-xl overflow-hidden shadow-sm aspect-square bg-surface-container-low">
                  <img
                    alt="Pikachu Cake render"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={rfqData.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>

                  <div className="absolute bottom-3 left-3 right-3 text-on-primary">
                    <p className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-wider">
                      Bản Vẽ Đăng Sàn Marketplace
                    </p>
                    <h4 className="font-headline-sm text-[17px] leading-tight text-surface-container-lowest font-semibold">
                      {rfqData.conceptTitle || 'Pikachu Cake (Bánh 2 Tầng)'}
                    </h4>
                  </div>
                </div>

                {/* Quick Spec Badges */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-label-md text-label-md">
                  <div className="p-3 rounded-xl bg-surface-container flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      straighten
                    </span>
                    <div>
                      <p className="text-on-surface-variant font-bold text-xs leading-none mb-1">
                        Kích thước
                      </p>
                      <p className="font-bold text-primary text-sm sm:text-base truncate">
                        {rfqData.selectedSize || '25cm + 18cm'}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      layers
                    </span>
                    <div>
                      <p className="text-on-surface-variant font-bold text-xs leading-none mb-1">
                        Cốt &amp; Vị
                      </p>
                      <p className="font-bold text-primary text-sm sm:text-base truncate">
                        {rfqData.flavors || 'Vanilla & Dâu tươi'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Request Brief, Requirements & Target Constraints */}
              <div className="lg:col-span-8 flex flex-col justify-between h-full">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-sm uppercase tracking-wide font-bold">
                        Yêu Cầu Báo Giá
                      </span>
                      <span className="px-3 py-1.5 rounded-full bg-surface-container font-label-md text-sm text-primary font-bold">
                        Trạng thái: {STATUS_VN_MAP[currentStatus] || currentStatus}
                      </span>
                    </div>
                    <span className="font-label-md text-sm text-on-surface-variant font-bold">
                      {rfqData.id || '#RFQ-2025-8892'}
                    </span>
                  </div>

                  <h1 className="font-headline-md text-2xl sm:text-3xl text-primary font-bold leading-tight mb-4">
                    {rfqData.title || 'Bánh Sinh Nhật Pikachu 2 Tầng Cho Bé'}
                  </h1>

                  {/* Metadata Metrics Grid (3 thông số cốt lõi: Tên bánh, Budget 1 triệu, Need 20/10) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 sm:p-5 rounded-2xl bg-surface-container-low mb-6">
                    <div>
                      <div className="flex items-center gap-1.5 font-label-md text-sm text-on-surface-variant font-bold mb-1">
                        <span className="material-symbols-outlined text-[18px]">
                          payments
                        </span>
                        <span>Ngân sách</span>
                      </div>
                      <div className="font-headline-sm text-xl sm:text-2xl text-secondary font-bold">
                        {rfqData.budget
                          ? rfqData.budget.toLocaleString('vi-VN')
                          : '1.000.000'}
                        <span className="text-base font-normal text-on-surface-variant">
                          đ
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm text-on-surface-variant font-medium">
                        Khách mong muốn
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-label-md text-sm text-on-surface-variant font-bold mb-1">
                        <span className="material-symbols-outlined text-[18px]">
                          event
                        </span>
                        <span>Ngày cần</span>
                      </div>
                      <div className="font-headline-sm text-base sm:text-lg text-primary font-bold">
                        {rfqData.needDate || 'Hôm nay (20/09/2026)'}
                      </div>
                      <div className="font-body-sm text-xs sm:text-sm text-secondary font-semibold mt-0.5">
                        {rfqData.deliveryTimeSlot || '15:30 - 16:30'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-label-md text-sm text-on-surface-variant font-bold mb-1">
                        <span className="material-symbols-outlined text-[18px]">
                          pin_drop
                        </span>
                        <span>Địa điểm nhận</span>
                      </div>
                      <div className="font-headline-sm text-base sm:text-lg text-primary font-bold truncate">
                        {rfqData.deliveryAddress || 'Quận 1, TP.HCM'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-label-md text-sm text-on-surface-variant font-bold mb-1">
                        <span className="material-symbols-outlined text-[18px]">
                          cake
                        </span>
                        <span>Yêu cầu chữ viết</span>
                      </div>
                      <div className="font-headline-sm text-base sm:text-lg text-primary font-bold truncate">
                        {rfqData.cakeMessage || 'Happy Birthday!'}
                      </div>
                      <div className="font-body-sm text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5">
                        Viết kem socola đỏ
                      </div>
                    </div>
                  </div>

                  {/* Customer Note Sent to Bakeries Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 mb-5 flex items-start gap-3.5 shadow-xs animate-in fade-in">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-2xl">
                        edit_note
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-label-md text-sm font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                          Ghi chú của khách hàng gửi đến các tiệm
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-amber-950 leading-relaxed font-medium italic">
                        "{rfqData.customerNote || 'Bánh cho tiệc sinh nhật 7 tuổi bé Minh Khang, làm cốt Chiffon vani ít ngọt 30%, bé hơi nhạy cảm với socola đắng nên dùng socola sữa tạo hình Pikachu giúp em nhé. Giao thùng xe lạnh đúng hẹn.'}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-on-surface-variant font-medium">
                      Thời gian đóng nhận thầu:
                    </span>
                    <strong className="text-primary text-sm sm:text-base font-bold">
                      {formatCountdown(countdownSeconds)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentStatus === 'OPEN' || currentStatus === 'QUOTED' ? (
                      <button
                        className="px-4 py-2 rounded-full bg-secondary text-on-secondary hover:bg-secondary/90 font-label-md text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        onClick={() => {
                          try { localStorage.setItem('sweetcake_is_editing_rfq', 'true') } catch {}
                          onNavigate && onNavigate('ai-studio')
                        }}
                        title="Chỉnh sửa thiết kế & reset các báo giá"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          edit_note
                        </span>
                        Chỉnh sửa yêu cầu (Cho sửa)
                      </button>
                    ) : (
                      <button
                        className="px-4 py-2 rounded-full bg-surface-container-high text-outline text-sm font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-70"
                        onClick={() =>
                          alert(
                            `Đơn hàng đang ở trạng thái "${STATUS_VN_MAP[currentStatus] || currentStatus}". Đã chốt tiệm / đang thực hiện nên ĐÃ KHÓA CHỈNH SỬA.`
                          )
                        }
                        title="Đã khóa chỉnh sửa"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          lock
                        </span>
                        Khóa chỉnh sửa
                      </button>
                    )}
                    {currentStatus !== 'CANCELLED' && (
                      <button
                        className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 font-label-md text-sm transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
                        onClick={() => setIsCancelModalOpen(true)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          cancel
                        </span>
                        Hủy yêu cầu (#RFQ)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. VENDOR QUOTATIONS SECTION (Các Vendor tự vào xem & gửi báo giá) */}
          {/* ========================================================================= */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {declinedBidIds.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-xs">
                    Có {declinedBidIds.length} tiệm đã từ chối
                  </span>
                )}
              </div>
              <h2 className="font-headline-lg text-headline-lg text-primary leading-tight">
                Danh Sách Báo Giá Từ Các Tiệm Bánh
              </h2>
            </div>

            {/* Quick Sorting */}
            <div className="flex items-center p-1 rounded-full bg-surface-container-high self-start md:self-auto">
              <button
                className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm transition-all cursor-pointer ${activeFilter === 'all'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                  }`}
                onClick={() => setActiveFilter('all')}
                type="button"
              >
                Tất cả (3 tiệm)
              </button>
              <button
                className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm transition-all cursor-pointer ${activeFilter === 'lowest'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                  }`}
                onClick={() => setActiveFilter('lowest')}
                type="button"
              >
                Giá thấp nhất
              </button>
              <button
                className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm transition-all cursor-pointer ${activeFilter === 'fastest'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                  }`}
                onClick={() => setActiveFilter('fastest')}
                type="button"
              >
                Làm nhanh nhất
              </button>
            </div>
          </div>

          {/* VENDORS CARDS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 items-stretch">
            {filteredBids.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">
                  hourglass_empty
                </span>
                <h3 className="font-headline-sm text-lg font-bold text-primary mb-1">
                  Chưa có tiệm bánh nào gửi báo giá
                </h3>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                  Yêu cầu của bạn đã được đăng lên chợ mua bán. Vui lòng chờ các tiệm bánh xem xét và nộp báo giá.
                </p>
              </div>
            ) : (
              filteredBids.map((bid) => {
              const isDeclined = declinedBidIds.includes(bid.id)
              const isAcceptedThis =
                acceptedBid && acceptedBid.id === bid.id
              const isTop = bid.isRecommended && !isDeclined

              return (
                <div
                  key={bid.id}
                  className={`relative flex flex-col justify-between rounded-2xl p-6 lg:p-7 transition-all border ${isDeclined
                      ? 'bg-surface-container/40 border-outline-variant/20 opacity-60 grayscale-[40%]'
                      : isAcceptedThis
                        ? 'bg-surface-container-lowest border-secondary shadow-xl ring-2 ring-secondary'
                        : 'bg-surface-container-lowest border-outline-variant/30 shadow-md hover:shadow-lg'
                    }`}
                >
                  {/* Status Indicator Badge (Only shown when declined or accepted) */}
                  {isDeclined && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-label-sm text-label-sm shadow-md flex items-center gap-1.5 uppercase tracking-wider font-bold whitespace-nowrap z-10 bg-rose-700 text-white">
                      <span className="material-symbols-outlined text-[14px]">
                        cancel
                      </span>
                      {bid.name} (Đã từ chối nhận đơn)
                    </div>
                  )}
                  {isAcceptedThis && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-label-sm text-label-sm shadow-md flex items-center gap-1.5 uppercase tracking-wider font-bold whitespace-nowrap z-10 bg-secondary text-on-secondary">
                      <span className="material-symbols-outlined text-[14px]">
                        check_circle
                      </span>
                      Bạn đang chọn báo giá này
                    </div>
                  )}

                  <div>
                    {/* Bakery Header & Avatar */}
                    <div className="flex items-start justify-between gap-3 pt-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-high overflow-hidden shadow-sm shrink-0">
                          <img
                            alt={bid.name}
                            className="w-full h-full object-cover"
                            src={bid.avatar}
                          />
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-[20px] text-primary leading-snug flex items-center gap-1.5">
                            {bid.name}
                            {isDeclined && (
                              <span className="text-rose-600 font-bold text-xs px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                                Đã từ chối
                              </span>
                            )}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Price & Completion Timeline Callout */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low mb-5 flex items-baseline justify-between">
                      <div>
                        <p className="font-label-md text-sm text-outline uppercase tracking-wider font-semibold">
                          Giá báo cho đơn này
                        </p>
                        <div className="font-headline-lg text-2xl sm:text-3xl text-primary leading-tight font-bold">
                          {bid.price.toLocaleString('vi-VN')}
                          <span className="text-lg text-secondary font-normal ml-0.5">
                            đ
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3.5 py-1.5 rounded-xl bg-secondary-fixed/60 font-label-md text-sm text-on-secondary-container font-bold">
                          {bid.durationText}
                        </span>
                      </div>
                    </div>

                    {/* Timeline & Delivery */}
                    <div className="space-y-3 mb-5 text-body-sm text-on-surface">
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                          schedule
                        </span>
                        <div>
                          <p className="font-label-md text-sm sm:text-base text-primary font-bold">
                            Thời gian hoàn thành: {bid.durationDays} ngày
                          </p>
                          <p className="text-on-surface-variant text-sm font-medium mt-0.5">
                            Cam kết giao lúc{' '}
                            <span className="font-semibold text-primary">
                              {bid.deliveryTime}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                          ac_unit
                        </span>
                        <div>
                          <p className="font-label-md text-sm sm:text-base text-primary font-bold">
                            {bid.deliveryType}
                          </p>
                          <p className="text-on-surface-variant text-sm font-medium mt-0.5">
                            {bid.deliveryDesc}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Package Included Items */}
                    <div className="mb-5">
                      <p className="font-label-md text-sm text-primary uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          inventory_2
                        </span>
                        {bid.packageTitle}
                      </p>
                      <ul className="space-y-2 font-body-sm text-sm text-on-surface-variant font-medium">
                        {bid.packageItems.map((item, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-[17px]">
                              check_circle
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Chef Pitch */}
                    <div className="p-4 rounded-xl bg-surface-container mb-6 relative">
                      <span className="material-symbols-outlined absolute top-2 right-2 text-outline-variant text-[22px] opacity-40">
                        format_quote
                      </span>
                      <p className="font-label-md text-xs sm:text-sm text-secondary uppercase font-bold mb-1">
                        {bid.pitchTitle}
                      </p>
                      <p className="font-body-sm text-sm text-on-surface italic leading-relaxed font-medium">
                        {bid.pitchQuote}
                      </p>
                    </div>
                  </div>

                  {/* Actions for this bid */}
                  <div className="space-y-2 pt-2">
                    {isDeclined ? (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-center text-xs font-bold">
                        ❌ Tiệm đã từ chối nhận đơn này
                      </div>
                    ) : isAcceptedThis ? (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-center text-xs font-bold">
                          ✓ Bạn đã chọn báo giá này (Đang chờ tiệm duyệt)
                        </div>
                        {currentStatus === 'CUSTOMER_ACCEPTED' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              className="py-2.5 px-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 cursor-pointer transition-all"
                              onClick={handleVendorConfirm}
                              title="Mô phỏng tiệm đồng ý nhận"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-sm">
                                check
                              </span>
                              Tiệm xác nhận
                            </button>
                            <button
                              className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 cursor-pointer transition-all"
                              onClick={handleVendorDecline}
                              title="Mô phỏng tiệm đổi ý từ chối"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-sm">
                                close
                              </span>
                              Tiệm từ chối
                            </button>
                          </div>
                        )}
                        {currentStatus === 'VENDOR_CONFIRMED' && (
                          <button
                            className="w-full py-3 px-4 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                            onClick={handlePayment}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">
                              lock_open
                            </span>
                            Thanh toán ngay ({bid.price.toLocaleString('vi-VN')}đ)
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        className="w-full py-3.5 px-4 rounded-xl bg-secondary text-on-secondary hover:bg-secondary/90 font-label-md text-label-md font-bold shadow-md transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                        onClick={() => handleAcceptBid(bid)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          payment
                        </span>
                        <span>
                          Chọn Tiệm &amp; Thanh Toán ({bid.price.toLocaleString('vi-VN')}đ)
                        </span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-semibold text-xs"
                        onClick={() => onNavigate && onNavigate('baker-quote')}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          visibility
                        </span>
                        <span>Xem chi tiết</span>
                      </button>
                      <button
                        className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-semibold text-xs"
                        onClick={() => handleOpenChat(bid)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          chat
                        </span>
                        <span>Nhắn tin bếp</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          </div>
        </div>
      </div>

      {/* CHAT MODAL */}
      {chattingWith && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest max-w-xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[540px] border border-outline-variant/30">
            {/* Header */}
            <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/30">
              <div className="flex items-center gap-3">
                <img
                  alt={chattingWith.name}
                  className="w-10 h-10 rounded-full object-cover shadow-sm"
                  src={chattingWith.avatar}
                />
                <div>
                  <h4 className="font-label-md text-primary font-bold text-base flex items-center gap-1">
                    {chattingWith.name}
                  </h4>
                  <p className="text-xs text-secondary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                    Trực tuyến • Báo giá: {chattingWith.price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
                onClick={() => setChattingWith(null)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface-container-lowest">
              <div className="p-3 bg-surface-container rounded-xl text-xs text-on-surface-variant text-center">
                Đang trao đổi về yêu cầu <strong>{rfqData.id}</strong> (
                {rfqData.conceptTitle})
              </div>
              {chatHistory.map((msg, i) => {
                const isUser = msg.sender === 'user'
                return (
                  <div
                    key={i}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'
                      }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${isUser
                          ? 'bg-primary text-on-primary rounded-br-none'
                          : 'bg-surface-container-high text-on-surface rounded-bl-none'
                        }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-outline mt-1 px-1">
                      {msg.time}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Chat Input */}
            <form
              className="p-3 bg-surface-container-low border-t border-outline-variant/30 flex items-center gap-2"
              onSubmit={handleSendChatMessage}
            >
              <input
                className="flex-1 px-4 py-2.5 rounded-full bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Nhắn tin với bếp trưởng..."
                type="text"
                value={chatMessage}
              />
              <button
                className="w-10 h-10 rounded-full bg-primary hover:bg-secondary text-on-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
                type="submit"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL RFQ CONFIRMATION MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-md w-full shadow-2xl p-6 border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">cancel</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-primary">
                  Xác Nhận Hủy Yêu Cầu #RFQ?
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Mã: {rfqData?.id || '#RFQ-2025-8892'}
                </p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Khi bạn hủy yêu cầu này, toàn bộ các báo giá từ các tiệm bánh sẽ bị vô hiệu hóa. Do bạn chưa đặt cọc nên sẽ <strong>không phát sinh bất kỳ khoản phí nào</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="font-label-sm text-xs text-primary font-semibold">
                Lý do hủy yêu cầu:
              </label>
              <select
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              >
                <option value="Đã tìm được phương án khác">Đã tìm được phương án khác</option>
                <option value="Muốn thay đổi mẫu thiết kế / ngân sách">Muốn thay đổi mẫu thiết kế / ngân sách</option>
                <option value="Hoãn / Hủy lịch tiệc sinh nhật">Hoãn / Hủy lịch tiệc sinh nhật</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold cursor-pointer"
                onClick={() => setIsCancelModalOpen(false)}
                type="button"
              >
                Quay lại
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                onClick={handleConfirmCancelRfq}
                type="button"
              >
                Xác nhận hủy yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BiddingComparisonPage
