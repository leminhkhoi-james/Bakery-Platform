import { ORDER_GALLERY_PHOTOS } from '../../../mockData/customer/orders.js'
import { DEFAULT_TRACKING_CHAT_MESSAGES } from '../../../mockData/shared/conversations.js'
import { useState, useEffect } from 'react'

export const OrderTrackingPage = ({ onNavigate }) => {
  // Read selected bid and order information from localStorage if available
  const [acceptedBid, setAcceptedBid] = useState(() => {
    try {
      const saved = localStorage.getItem('sweetcake_accepted_bid')
      if (saved) return JSON.parse(saved)
    } catch { }
    return null
  })

  const orderId =
    acceptedBid?.orderCode ||
    localStorage.getItem('sweetcake_active_order_code') ||
    '#ORD-2025-9982'
  const bakeryName = acceptedBid?.name || 'Sweet Bakery'

  const [copiedCode, setCopiedCode] = useState(false)
  const [showFaq, setShowFaq] = useState(false)

  // Interactive Modals
  const [isChefChatOpen, setIsChefChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState(() =>
    DEFAULT_TRACKING_CHAT_MESSAGES.map((msg) => ({
      ...msg,
      name: msg.sender === 'chef' ? `Bếp Trưởng (${bakeryName})` : msg.name,
      text:
        msg.sender === 'chef' && bakeryName !== 'Sweet Bakery Studio'
          ? msg.text.replace('Sweet Bakery Studio', bakeryName)
          : msg.text,
    }))
  )
  const [newChefMessage, setNewChefMessage] = useState('')

  // Modal: Change Delivery Time
  const [isChangeTimeModalOpen, setIsChangeTimeModalOpen] = useState(false)
  const [selectedNewTime, setSelectedNewTime] = useState('15:30 - 16:30')
  const [deliveryTimeNotice, setDeliveryTimeNotice] = useState('Hôm nay, 15:30 - 16:30 (25/10/2025)')

  // Modal: Edit Plaque Inscription
  const [isEditPlaqueModalOpen, setIsEditPlaqueModalOpen] = useState(false)
  const [plaqueText, setPlaqueText] = useState('Happy 7th Birthday Minh Khang!')
  const [tempPlaqueText, setTempPlaqueText] = useState('Happy 7th Birthday Minh Khang!')

  // Modal: VAT Invoice
  const [isVatModalOpen, setIsVatModalOpen] = useState(false)

  // Modal: View All 6 Photos
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  // Demo Stage Control: 4 = Baking, 5 = Delivering, 6 = Completed & Review
  const [trackingStage, setTrackingStage] = useState(4)

  // Modal: Customer Review & Escrow Release
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [starRating, setStarRating] = useState(5)
  const [aiMatchScore, setAiMatchScore] = useState(5)
  const [flavorScore, setFlavorScore] = useState(5)
  const [deliveryScore, setDeliveryScore] = useState(5)
  const [reviewComment, setReviewComment] = useState(
    'Bánh Pikachu 2 tầng làm thực tế đẹp xuất sắc ngoài mong đợi! Tượng 3D nặn rất tỉ mỉ, cốt chiffon vani dâu tây thanh nhẹ bé Minh Khang và cả nhà khen nức nở. Xe lạnh giao chuẩn giờ, bánh lạnh nguyên form không tì vết.'
  )
  const [escrowReleased, setEscrowReleased] = useState(false)
  const [showReviewSuccessBanner, setShowReviewSuccessBanner] = useState(false)

  // Unhappy Flow states: Cancellation & Dispute
  const [isCancelEscrowModalOpen, setIsCancelEscrowModalOpen] = useState(false)
  const [orderCancelStatus, setOrderCancelStatus] = useState(null) // null | 'CANCELLED' | 'OVERDUE' | 'DISPUTE'
  const [cancelPolicyPercent, setCancelPolicyPercent] = useState(70)

  const handleOpenCancelModal = () => {
    if (trackingStage >= 5) {
      alert('Đơn hàng đang trên xe lạnh giao đến địa chỉ của bạn nên không thể hủy trực tiếp lúc này. Vui lòng liên hệ tài xế hoặc đồng kiểm khi nhận bánh.')
      return
    }
    const percent = trackingStage <= 3 ? 70 : 20
    setCancelPolicyPercent(percent)
    setIsCancelEscrowModalOpen(true)
  }

  const handleConfirmCancelOrder = () => {
    setIsCancelEscrowModalOpen(false)
    setOrderCancelStatus('CANCELLED')
    const refundMoney = Math.round((currentOrderPrice * cancelPolicyPercent) / 100)
    try {
      const targetOrderId = orderId || '#ORD-2025-6792'
      const cancelledOrder = {
        id: targetOrderId,
        title: currentOrderTitle,
        subtitle: `Xưởng: ${bakeryName} • Hoàn cọc ${cancelPolicyPercent}% (${refundMoney.toLocaleString('vi-VN')}đ)`,
        completedDate: `Hôm nay (Đã hủy & Hoàn cọc Escrow)`,
        price: refundMoney,
        image: cakePhotoDefault,
        deliveryNote: `Khách hủy đơn giai đoạn ${trackingStage === 4 ? 'Đang làm bánh' : 'Chuẩn bị'}. Két Escrow đã hoàn trả ${refundMoney.toLocaleString('vi-VN')}đ`,
        bakery: bakeryName,
        isCancelled: true,
      }
      const existingCompleted = localStorage.getItem('sweetcake_completed_orders')
      let list = existingCompleted ? JSON.parse(existingCompleted) : []
      list = [cancelledOrder, ...list.filter((o) => o.id !== targetOrderId)]
      localStorage.setItem('sweetcake_completed_orders', JSON.stringify(list))
    } catch (e) {
      console.error(e)
    }
  }

  const cakePhotoDefault =
    acceptedBid?.image ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ'
  const [selectedPhotoForReview, setSelectedPhotoForReview] = useState(cakePhotoDefault)
  const currentOrderPrice = acceptedBid?.price || 950000
  const currentOrderTitle = acceptedBid?.title || 'Bánh Sinh Nhật Pikachu Tạo Hình 3D (2 Tầng)'

  // Live Telemetry simulation
  const [temperature, setTemperature] = useState(4.8)
  const [vibration, setVibration] = useState(0.02)
  const [lastUpdated, setLastUpdated] = useState('11:28:40')

  useEffect(() => {
    const timer = setInterval(() => {
      // Minor realistic telemetry jitter
      const tempJitter = (4.7 + Math.random() * 0.3).toFixed(1)
      const vibJitter = (0.015 + Math.random() * 0.01).toFixed(3)
      setTemperature(parseFloat(tempJitter))
      setVibration(parseFloat(vibJitter))

      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      setLastUpdated(timeStr)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const markOrderAsDelivered = () => {
    try {
      localStorage.setItem('sweetcake_delivery_status', 'COMPLETED')
      const activeRfq = localStorage.getItem('sweetcake_active_rfq')
      const parsedRfq = activeRfq ? JSON.parse(activeRfq) : null
      const currentAccepted =
        acceptedBid ||
        (localStorage.getItem('sweetcake_accepted_bid')
          ? JSON.parse(localStorage.getItem('sweetcake_accepted_bid'))
          : null)

      const newCompletedOrder = {
        id: orderId,
        title:
          currentAccepted?.title ||
          parsedRfq?.title ||
          'Bánh Sinh Nhật Pikachu Tạo Hình 3D (2 Tầng)',
        subtitle: `Xưởng thực hiện: ${bakeryName} • Quy cách: ${currentAccepted?.selectedSize ||
          parsedRfq?.selectedSize ||
          '2 Tầng (20cm + 14cm)'
          }`,
        completedDate: `Hôm nay, ${new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })} (${new Date().toLocaleDateString('vi-VN')}) • Giao đến Căn hộ 18.04 Saigon Pearl`,
        price: currentAccepted?.price || parsedRfq?.budget || 950000,
        image:
          currentAccepted?.image ||
          parsedRfq?.image ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ',
        deliveryNote:
          'Đã giao xe lạnh chuyên dụng đạt chuẩn 4.8°C • Đồng kiểm nguyên vẹn 100%',
        bakery: bakeryName,
        isNew: true,
      }

      const existingCompleted = localStorage.getItem('sweetcake_completed_orders')
      let list = existingCompleted ? JSON.parse(existingCompleted) : []
      list = [newCompletedOrder, ...list.filter((o) => o.id !== orderId)]
      localStorage.setItem('sweetcake_completed_orders', JSON.stringify(list))
      localStorage.setItem('sweetcake_delivery_status', 'COMPLETED')
    } catch (e) {
      console.error(e)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(orderId)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleSendChefMessage = (e) => {
    e.preventDefault()
    if (!newChefMessage.trim()) return

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`

    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        name: 'Hân Mai',
        time: timeStr,
        text: newChefMessage.trim(),
      },
    ])
    setNewChefMessage('')

    // Simulated Chef response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'chef',
          name: 'Bếp Trưởng Jean-Luc',
          time: timeStr,
          text: 'Đã nhận yêu cầu của bạn! Xưởng đang điều chỉnh cẩn thận trước khi đóng hộp lạnh.',
        },
      ])
    }, 1500)
  }

  const handleSavePlaque = () => {
    setPlaqueText(tempPlaqueText)
    setIsEditPlaqueModalOpen(false)
  }

  const handleSaveDeliveryTime = () => {
    setDeliveryTimeNotice(`Hôm nay, ${selectedNewTime} (25/10/2025)`)
    setIsChangeTimeModalOpen(false)
  }

  const galleryPhotos = ORDER_GALLERY_PHOTOS

  return (
    <div className="w-full striped-candy-bg min-h-screen">
      <div className="flex flex-col w-full">
        {/* Subtle Ambient Glow Ornaments */}
        <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pt-space-md pb-space-xl">
          {/* Top Metadata Bar */}


          {/* Order Header Hero Card */}
          <div className="relative overflow-hidden bg-surface-container-low rounded-2xl p-space-lg shadow-sm mb-space-lg border border-outline-variant/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md relative z-10">
              <div className="flex flex-col gap-space-xs">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <h1 className="font-headline-md text-3xl sm:text-4xl text-primary tracking-tight drop-shadow-sm">
                    Mã đơn: {orderId}
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary font-bold text-xs flex items-center gap-1 border border-secondary/30">
                    <span className="material-symbols-outlined text-sm">storefront</span>
                    Xưởng chế tác: {bakeryName}
                  </span>
                  <button
                    className="flex items-center gap-1 bg-surface hover:bg-surface-container px-space-sm py-1 rounded-full font-label-sm text-label-sm text-secondary transition-colors shadow-sm cursor-pointer"
                    id="copyBtn"
                    onClick={handleCopyCode}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedCode ? 'check' : 'content_copy'}
                    </span>
                    <span id="copyText">
                      {copiedCode ? 'Đã chép mã!' : 'Sao chép mã'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: Cancel & Escrow Refund */}
              <div className="flex items-center gap-2">
                {orderCancelStatus === 'CANCELLED' ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Đơn hàng đã hủy &amp; Đã hoàn cọc Escrow
                    </span>
                    <button
                      className="px-3.5 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-bold shadow-sm hover:bg-secondary/90 transition-all cursor-pointer"
                      onClick={() => onNavigate && onNavigate('profile')}
                      type="button"
                    >
                      Xem trong Lịch Sử Đơn Hàng
                    </button>
                  </div>
                ) : trackingStage < 6 ? (
                  <button
                    className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-label-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    onClick={handleOpenCancelModal}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    Hủy Đơn &amp; Hoàn Cọc Escrow
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* DYNAMIC UNHAPPY BANNERS: CANCELLED / OVERDUE / DISPUTE */}
          {orderCancelStatus === 'CANCELLED' && (
            <div className="mb-space-lg p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-2xl text-rose-700 shrink-0 mt-0.5">
                  cancel
                </span>
                <div>
                  <h4 className="font-bold text-base text-rose-950">
                    ĐƠN HÀNG ĐÃ HỦY THÀNH CÔNG • KÉT ESCROW ĐÃ HOÀN TIỀN {cancelPolicyPercent}%
                  </h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    Theo chính sách hủy đơn SweetCake Escrow (Giai đoạn {trackingStage === 4 ? 'Đang chế tác' : 'Chuẩn bị'}), hệ thống đã tự động hoàn trả <strong>{Math.round((currentOrderPrice * cancelPolicyPercent) / 100).toLocaleString('vi-VN')} VNĐ</strong> về tài khoản của bạn.
                  </p>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-xl bg-secondary text-on-secondary font-bold text-xs shadow hover:bg-secondary/90 shrink-0 cursor-pointer"
                onClick={() => onNavigate && onNavigate('profile')}
                type="button"
              >
                Xem Lịch Sử Đơn Hàng
              </button>
            </div>
          )}

          {orderCancelStatus === 'OVERDUE' && (
            <div className="mb-space-lg p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-2xl text-amber-700 shrink-0 mt-0.5">
                  warning
                </span>
                <div>
                  <h4 className="font-bold text-base text-amber-950">
                    CẢNH BÁO GIAO TRỄ • ĐANG ĐIỀU PHỐI KHẨN CẤP
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Xưởng bánh đang hoàn thiện công đoạn cuối trễ hơn 15 phút so với dự kiến. Hệ thống đã tự động kích hoạt đội xe lạnh ưu tiên số 1 và gửi tặng bạn <strong>Voucher bồi hoàn 100.000 VNĐ</strong> cho lần đặt sau.
                  </p>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs shadow hover:bg-amber-800 shrink-0 cursor-pointer"
                onClick={() => alert('Đã kết nối đường dây nóng điều phối xe lạnh khẩn cấp!')}
                type="button"
              >
                Liên Hệ Điều Phối
              </button>
            </div>
          )}

          {orderCancelStatus === 'DISPUTE' && (
            <div className="mb-space-lg p-5 rounded-2xl bg-purple-50 border border-purple-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-2xl text-purple-700 shrink-0 mt-0.5">
                  gavel
                </span>
                <div>
                  <h4 className="font-bold text-base text-purple-950">
                    HỒ SƠ TRANH CHẤP KÝ QUỸ ĐANG ĐƯỢC THỤ LÝ
                  </h4>
                  <p className="text-xs text-purple-800 mt-1 leading-relaxed">
                    Toàn bộ số tiền <strong>{currentOrderPrice.toLocaleString('vi-VN')} VNĐ</strong> đang được tạm khóa trong Escrow Vault. Ban quản trị SweetCake Admin đang đối chiếu ảnh live camera xưởng và biên bản xe lạnh 4.8°C để xử lý hoàn tiền trong 24 giờ.
                  </p>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs shadow hover:bg-purple-800 shrink-0 cursor-pointer"
                onClick={() => onNavigate && onNavigate('admin-orders')}
                type="button"
              >
                Xem Két Escrow Vault (Admin)
              </button>
            </div>
          )}

          {/* 6-Stage Marketplace Stepper Section */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm mb-space-lg border border-outline-variant/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary">
                  Tiến Trình Chế Tác &amp; Vận Hành Khép Kín
                </h2>
              </div>

              {/* Interactive Demo Simulation Controls */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-container rounded-xl text-xs font-semibold">
                <span className="text-[11px] text-outline px-2 hidden md:inline">Demo chặng:</span>
                <button
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${trackingStage === 4
                      ? 'bg-secondary text-on-secondary shadow-sm font-bold'
                      : 'hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  onClick={() => setTrackingStage(4)}
                  type="button"
                >
                  1. Làm bánh
                </button>
                <button
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${trackingStage === 5
                      ? 'bg-secondary text-on-secondary shadow-sm font-bold'
                      : 'hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  onClick={() => setTrackingStage(5)}
                  type="button"
                >
                  2. Xe lạnh
                </button>
                <button
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${trackingStage === 6
                      ? 'bg-secondary text-on-secondary shadow-sm font-bold'
                      : 'hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  onClick={() => {
                    setTrackingStage(6)
                    markOrderAsDelivered()
                    if (!hasReviewed) setIsReviewModalOpen(true)
                  }}
                  type="button"
                >
                  3. Đã giao
                </button>
                <button
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${orderCancelStatus === 'OVERDUE'
                      ? 'bg-amber-600 text-white shadow-sm font-bold'
                      : 'hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  onClick={() => setOrderCancelStatus((prev) => (prev === 'OVERDUE' ? null : 'OVERDUE'))}
                  type="button"
                >
                  4. Trễ hạn
                </button>
                <button
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${orderCancelStatus === 'DISPUTE'
                      ? 'bg-purple-700 text-white shadow-sm font-bold'
                      : 'hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  onClick={() => setOrderCancelStatus((prev) => (prev === 'DISPUTE' ? null : 'DISPUTE'))}
                  type="button"
                >
                  5. Tranh chấp
                </button>
              </div>
            </div>

            {/* Stepper Track Desktop */}
            <div className="relative pt-space-xs pb-space-sm overflow-x-auto">
              <div className="min-w-[760px]">
                {/* Progress Line Background */}
                <div className="relative flex items-center justify-between">
                  <div className="absolute left-8 right-8 top-5 h-1 bg-surface-container rounded-full -z-0"></div>
                  <div
                    className="absolute left-8 top-5 h-1 bg-secondary rounded-full -z-0 transition-all duration-700"
                    style={{
                      width:
                        trackingStage === 4
                          ? '62%'
                          : trackingStage === 5
                            ? '82%'
                            : '100%',
                    }}
                  ></div>

                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center relative z-10 w-32">
                    <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md mb-space-xs">
                      <span className="material-symbols-outlined text-xl">
                        check
                      </span>
                    </div>
                    <span className="font-label-md text-label-md font-bold text-primary">
                      Tiếp Nhận
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">
                      Đã tiếp nhận
                    </span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">
                      09:15 - 24/10
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center relative z-10 w-32">
                    <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md mb-space-xs">
                      <span className="material-symbols-outlined text-xl">
                        check
                      </span>
                    </div>
                    <span className="font-label-md text-label-md font-bold text-primary">
                      Báo Giá
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">
                      Đã báo giá (4)
                    </span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">
                      10:45 - 24/10
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center relative z-10 w-32">
                    <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md mb-space-xs">
                      <span className="material-symbols-outlined text-xl">
                        check
                      </span>
                    </div>
                    <span className="font-label-md text-label-md font-bold text-primary">
                      Đã Chốt Tiệm
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">
                      Đã duyệt &amp; Cọc
                    </span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">
                      14:20 - 24/10
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center text-center relative z-10 w-36">
                    {trackingStage === 4 ? (
                      <div className="w-11 h-11 rounded-full bg-primary-container text-secondary-fixed-dim flex items-center justify-center shadow-lg mb-space-xs ring-4 ring-secondary/20 animate-bounce">
                        <span className="material-symbols-outlined text-2xl">
                          oven_gen
                        </span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md mb-space-xs">
                        <span className="material-symbols-outlined text-xl">
                          check
                        </span>
                      </div>
                    )}
                    <span className="font-label-md text-label-md font-bold text-secondary">
                      Làm Bánh
                    </span>
                    <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full font-bold">
                      {trackingStage === 4 ? 'Đang chế tác' : 'Đã hoàn thành'}
                    </span>
                    <span className="font-body-sm text-body-sm text-primary font-semibold mt-0.5">
                      10:30 - Xưởng 02
                    </span>
                  </div>

                  {/* Step 5 */}
                  <div className={`flex flex-col items-center text-center relative z-10 w-32 ${trackingStage < 5 ? 'opacity-60' : ''}`}>
                    {trackingStage === 5 ? (
                      <div className="w-11 h-11 rounded-full bg-primary-container text-secondary-fixed-dim flex items-center justify-center shadow-lg mb-space-xs ring-4 ring-secondary/20 animate-bounce">
                        <span className="material-symbols-outlined text-2xl">
                          local_shipping
                        </span>
                      </div>
                    ) : trackingStage > 5 ? (
                      <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md mb-space-xs">
                        <span className="material-symbols-outlined text-xl">
                          check
                        </span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-container-high text-outline flex items-center justify-center mb-space-xs">
                        <span className="material-symbols-outlined text-xl">
                          local_shipping
                        </span>
                      </div>
                    )}
                    <span className="font-label-md text-label-md font-bold text-primary">
                      Giao Hàng
                    </span>
                    <span className={`font-label-sm text-label-sm ${trackingStage === 5 ? 'bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full font-bold' : 'text-outline'}`}>
                      {trackingStage === 5 ? 'Đang giao 4.8°C' : trackingStage > 5 ? 'Đã tới nơi' : 'Xe lạnh 4-6°C'}
                    </span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">
                      {trackingStage === 5 ? 'Cách 1.5 km' : '15:15 - 15:45'}
                    </span>
                  </div>

                  {/* Step 6 */}
                  <div className={`flex flex-col items-center text-center relative z-10 w-32 ${trackingStage < 6 ? 'opacity-60' : ''}`}>
                    {trackingStage === 6 ? (
                      <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg mb-space-xs ring-4 ring-emerald-300">
                        <span className="material-symbols-outlined text-2xl">
                          verified
                        </span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-container-high text-outline flex items-center justify-center mb-space-xs">
                        <span className="material-symbols-outlined text-xl">
                          verified
                        </span>
                      </div>
                    )}
                    <span className="font-label-md text-label-md font-bold text-primary">
                      Hoàn Thành
                    </span>
                    <span className={`font-label-sm text-label-sm ${trackingStage === 6 ? 'bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold' : 'text-outline'}`}>
                      {hasReviewed ? 'Đã nghiệm thu' : 'Đồng kiểm & Đánh giá'}
                    </span>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">
                      {hasReviewed ? 'Đã giải ngân Escrow' : 'Nhận bánh'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Success Celebration Banner */}
            {showReviewSuccessBanner && (
              <div className="mt-space-md p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-2xl">celebration</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-sm text-emerald-950 font-bold flex items-center gap-1.5">
                      Đã Hoàn Tất Nghiệm Thu &amp; Giải Ngân Escrow Thành Công!
                      <span className="text-amber-500">★★★★★</span>
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      950.000 VNĐ đã được giải phóng từ SweetCake Escrow Vault đến Xưởng bánh <strong>La Crème Pâtisserie</strong> (Mã đối soát: <code>#ESCROW-TXN-9982</code>). Cảm ơn bạn đã tin tưởng dịch vụ!
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                    onClick={() => onNavigate && onNavigate('profile')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">receipt_long</span>
                    <span>Xem Lịch Sử Đơn Hàng</span>
                  </button>
                  <button
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                    onClick={() => setShowReviewSuccessBanner(false)}
                    type="button"
                  >
                    Đóng thông báo
                  </button>
                </div>
              </div>
            )}

            {/* Prompt Banner when in delivery or received */}
            {!hasReviewed && (
              <div className="mt-space-md p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5 text-on-surface-variant">
                  <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">local_shipping</span>
                  </div>
                  <span>
                    Bánh đã đến nơi an toàn. Quý khách vui lòng đồng kiểm tra form bánh cùng tài xế xe lạnh và bấm <strong>Đã Nhận Bánh</strong> để xác nhận và gửi đánh giá trải nghiệm.
                  </span>
                </div>
                <button
                  className="bg-secondary hover:bg-secondary/90 text-on-secondary px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0"
                  onClick={() => {
                    markOrderAsDelivered()
                    setIsReviewModalOpen(true)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Đã Nhận Bánh</span>
                </button>
              </div>
            )}
          </div>

          {/* Main Grid: 65% Left / 35% Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            {/* Left Column: Workshop Quality Cam + Cold Fleet Dispatch (Col 8/12) */}
            <div className="lg:col-span-8 flex flex-col gap-gutter">
              {/* CARD 1: Live Workshop Camera & Quality Proof */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/20">
                <div className="flex flex-wrap items-center justify-between gap-space-xs mb-space-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
                      <h2 className="font-headline-sm text-headline-sm text-primary">
                        Kiểm Soát Chất Lượng Trực Tiếp Tại Xưởng
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Photo Duo Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md mb-space-md">
                  {/* Workshop Image 1 */}
                  <div
                    className="flex flex-col bg-surface-container-low rounded-2xl overflow-hidden group shadow-sm cursor-pointer transition-all hover:shadow-md"
                    onClick={() => {
                      setSelectedPhotoIndex(0)
                      setIsGalleryOpen(true)
                    }}
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        alt="Artisanal chocolate cherry velvet cake topped with fresh cherries and dark chocolate curls on a stone stand in a rustic warm bakery studio."
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIPIr2knWa3uPBpxSEQbXeIaWSr2H-DY3igOoMjPUZMHQ34Vw4fHkauQr5xABIMDMrvxZqDrk4sfdNR6BVYT8Az1ZDx9n-1Y_QzewfHRq4p3HEpQ93-JGQv9CJXemod3u4_iKuotQHcgjjkOtJtgq2K4sGG4NTNaox1zTqv6xRGRKjUZO5g5CmhNAJlEoKx3LOhted84XP5yMOPXHfPBgb0tY1uGdT1LoWbbfejTGOHnpkv_wcetQ5"
                      />
                      <div className="absolute top-space-xs left-space-xs bg-primary/80 backdrop-blur-md text-on-primary px-space-sm py-0.5 rounded-full font-label-sm text-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-secondary-container">
                          schedule
                        </span>{' '}
                        11:15 - Xưởng 02
                      </div>
                      <div className="absolute bottom-space-xs right-space-xs bg-surface-container-lowest/90 px-space-sm py-0.5 rounded-full text-primary font-label-sm text-label-sm font-semibold shadow-sm">
                        QC Pass: Form bánh 100%
                      </div>
                    </div>
                    <div className="p-space-sm flex flex-col gap-1">
                      <span className="font-label-md text-label-md font-bold text-primary">
                        Phủ sốt ganache &amp; quả tươi
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                        Lớp phủ socola đen Bỉ 70% bóng mịn, quả anh đào và mâm xôi Pháp tươi mọng được cắm thủ công.
                      </p>
                    </div>
                  </div>

                  {/* Workshop Image 2 */}
                  <div
                    className="flex flex-col bg-surface-container-low rounded-2xl overflow-hidden group shadow-sm cursor-pointer transition-all hover:shadow-md"
                    onClick={() => {
                      setSelectedPhotoIndex(1)
                      setIsGalleryOpen(true)
                    }}
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        alt="Glossy salted caramel entremet cake topped with roasted hazelnuts and delicate edible gold leaf flakes."
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB67Wu0kUHQxa-Epava4i70oUc-4FHbAECttp8_bFSmNc8bHYbiV2cgFUonyE0hVTjQpbtcwuUuirlevtakllI71DpP1W41XbHx6YLcsJ1vBuAdIbPQXdBDodPyI64poIPrmAZkEx2wIXZbOArV8Ulzt9mDRRJLoJPUGJyifMYK66pXQfWTdGSYOtaPGwRqCLsSOChXtUgKpMrtuwWQegL3IYJISAtjAbjtPUWEusAsfYM0S2fy3WeA"
                      />
                      <div className="absolute top-space-xs left-space-xs bg-primary/80 backdrop-blur-md text-on-primary px-space-sm py-0.5 rounded-full font-label-sm text-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-secondary-container">
                          schedule
                        </span>{' '}
                        11:22 - Bàn hoàn thiện
                      </div>
                      <div className="absolute bottom-space-xs right-space-xs bg-surface-container-lowest/90 px-space-sm py-0.5 rounded-full text-primary font-label-sm text-label-sm font-semibold shadow-sm">
                        Chữ viết vàng nhũ
                      </div>
                    </div>
                    <div className="p-space-sm flex flex-col gap-1">
                      <span className="font-label-md text-label-md font-bold text-primary">
                        Dát vàng &amp; bảng chữ kỷ niệm
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                        Thông điệp: "{plaqueText}" viết tay bằng socola vàng nghệ thuật sắc nét.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: Cold Fleet Logistics & Real-time Telemetry */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/20">
                <div className="flex flex-wrap items-center justify-between gap-space-xs mb-space-md">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary">
                      Hành Trình Giao Nhận Xe Lạnh Chuyên Dụng
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Hệ thống bảo quản ổn định nhiệt độ 4°C - 6°C và đế chống sốc thủy lực
                    </p>
                  </div>

                </div>

                {/* Route Visualization Graphic */}
                <div className="relative w-full h-56 bg-surface-container rounded-2xl overflow-hidden mb-space-md flex items-center justify-center border border-outline-variant/20">
                  {/* Simulated Map Texture Background */}
                  <div
                    className="w-full h-full bg-[radial-gradient(#d2c3be_1px,transparent_1px)] [background-size:16px_16px] bg-surface-container-high opacity-70"
                    data-location="Landmark 81, Ho Chi Minh City"
                  ></div>

                  {/* Visual Route SVG Path */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="none"
                    viewBox="0 0 400 150"
                  >
                    <path
                      d="M 50 110 C 130 110, 180 50, 260 50 S 330 30, 350 40"
                      fill="none"
                      stroke="#D48C95"
                      strokeDasharray="6,4"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                    <circle cx="50" cy="110" fill="#4A2218" r="6" />
                    <circle cx="230" cy="53" fill="#D48C95" r="8" />
                    <circle
                      className="animate-ping"
                      cx="230"
                      cy="53"
                      fill="#F7D6DA"
                      opacity="0.75"
                      r="12"
                    />
                    <circle cx="350" cy="40" fill="#ba1a1a" r="6" />
                  </svg>

                  {/* Map Route Overlays & Path Details */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent flex flex-col justify-between p-space-md text-on-primary">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-space-xs bg-primary/90 px-space-sm py-1 rounded-xl backdrop-blur-sm shadow">
                        <span className="material-symbols-outlined text-secondary-container text-sm">
                          my_location
                        </span>
                        <span className="font-label-sm text-label-sm">
                          Điểm đi: La Crème (128 Lê Lợi, Q.1)
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs bg-primary/90 px-space-sm py-1 rounded-xl backdrop-blur-sm shadow">
                        <span className="material-symbols-outlined text-secondary-fixed text-sm">
                          location_on
                        </span>
                        <span className="font-label-sm text-label-sm">
                          Điểm đến: Tháp Opal, Saigon Pearl, Bình Thạnh
                        </span>
                      </div>
                    </div>

                    {/* Estimated Path Card */}
                    <div className="bg-surface-container-lowest/95 backdrop-blur-md p-space-sm rounded-xl text-primary flex items-center justify-between shadow-lg border border-outline-variant/30">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0 shadow-sm">
                          <span className="material-symbols-outlined text-xl">
                            rv_hookup
                          </span>
                        </div>
                        <div>
                          <p className="font-label-md text-label-md font-bold text-primary">
                            Xe Van Chuyên Dụng: Suzuki Carry 51D-892.44
                          </p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                            Lộ trình: Lê Lợi → Nam Kỳ Khởi Nghĩa → Nguyễn Hữu Cảnh → Saigon Pearl
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-label-sm text-label-sm text-outline block text-xs">
                          Khoảng cách
                        </span>
                        <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                          5.4 km
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Profile & Telemetry Sensor Triad */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm mb-space-md">
                  {/* Driver Card */}
                  <div className="bg-surface-container-low p-space-sm rounded-xl flex items-center gap-space-sm border border-outline-variant/10">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary-container font-bold text-lg overflow-hidden shrink-0">
                      <span className="material-symbols-outlined text-3xl text-primary">
                        sports_motorsports
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md font-bold text-primary truncate">
                        Nguyễn Văn Hùng
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 text-xs">
                      </span>
                      <a
                        className="font-label-sm text-label-sm text-secondary font-semibold hover:underline text-xs"
                        href="tel:0901234567"
                      >
                        Gọi điện tài xế (0901 234 567)
                      </a>
                    </div>
                  </div>

                  {/* Telemetry 1: Temp Sensor */}
                  <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col justify-between border border-outline-variant/10">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="font-label-sm text-label-sm">
                        Nhiệt độ thùng lạnh
                      </span>
                      <span className="material-symbols-outlined text-secondary text-lg">
                        ac_unit
                      </span>
                    </div>
                    <div className="flex items-baseline gap-space-xs mt-1">
                      <span className="font-headline-md text-headline-md text-primary font-bold">
                        {temperature}°C
                      </span>
                      <span className="font-label-sm text-label-sm text-emerald-700 font-semibold">
                        Tối ưu (4-6°C)
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-secondary h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (temperature / 8) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Telemetry 2: Anti-tilt Shock Sensor */}
                  <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col justify-between border border-outline-variant/10">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="font-label-sm text-label-sm">
                        Cảm biến chống rung chấn
                      </span>
                      <span className="material-symbols-outlined text-secondary text-lg">
                        vibration
                      </span>
                    </div>
                    <div className="flex items-baseline gap-space-xs mt-1">
                      <span className="font-headline-md text-headline-md text-primary font-bold">
                        {vibration}G
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">
                        An toàn tối đa
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Timeframes Details */}
                <div className="flex flex-wrap items-center justify-between gap-space-sm p-space-sm bg-surface-container rounded-xl font-body-sm text-body-sm text-xs">
                  <span className="text-on-surface-variant">
                    Tài xế dự kiến tiếp nhận bánh tại xưởng lúc:{' '}
                    <strong className="text-primary">15:00</strong>
                  </span>
                  <span className="text-on-surface-variant">
                    Khung giờ giao tận tay người nhận:{' '}
                    <strong className="text-primary">15:30 - 16:00</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Order Item Summary + Sweet Cake Escrow Guarantees (Col 4/12) */}
            <div className="lg:col-span-4 flex flex-col gap-gutter">
              {/* CARD 3: Order Item Details & Accessories */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/20">
                <div className="flex items-center justify-between mb-space-md">
                  <h2 className="font-headline-sm text-headline-sm text-primary">
                    Chi Tiết Kiện Bánh
                  </h2>

                </div>

                {/* Product Item Snippet */}
                <div className="flex gap-space-sm pb-space-md border-b border-outline-variant/20">
                  <img
                    alt="Bánh Pikachu 2 tầng nghệ thuật tạo hình 3D cho sinh nhật bé Minh Khang"
                    className="w-20 h-20 rounded-xl object-cover shadow-sm flex-shrink-0"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ"
                  />
                  <div className="flex flex-col min-w-0 justify-center">
                    <h3 className="font-headline-sm text-headline-sm text-primary truncate leading-tight text-base font-bold">
                      Bánh Sinh Nhật Pikachu 3D (2 Tầng)
                    </h3>
                    <span className="font-label-md text-label-md text-secondary font-semibold text-xs mt-0.5">
                      2 Tầng (20cm + 14cm) • 12 - 18 phần
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                      Xưởng: La Crème Pâtisserie
                    </span>
                  </div>
                </div>

                {/* Customization Breakdown */}
                <div className="bg-surface-container-low p-space-sm rounded-xl my-space-md flex flex-col gap-space-xs text-body-sm text-xs">
                  <div className="flex justify-between">
                    <span className="text-outline">Cốt bánh:</span>
                    <span className="font-medium text-primary">
                      Chiffon Vani Dâu Tây Hữu Cơ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Lớp kem:</span>
                    <span className="font-medium text-primary">
                      Whipping Elle &amp; Vire (Pháp) ít ngọt 30%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-outline-variant/10">
                    <span className="text-outline">Lời chúc socola:</span>
                    <span className="font-medium text-secondary italic font-semibold text-right">
                      "{plaqueText}"
                    </span>
                  </div>
                </div>

                {/* Included Accessories List */}
                <div className="mb-space-md">
                  <h4 className="font-label-md text-label-md font-bold text-primary mb-space-xs uppercase tracking-wider text-outline text-xs">
                    Bộ Phụ Kiện Tiệc Kèm Theo
                  </h4>
                  <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant text-xs">
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-base">
                          verified
                        </span>
                        01 Nến số 7 mạ vàng hoàng gia
                      </span>
                      <span className="font-semibold text-secondary">
                        Tặng kèm
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-base">
                          verified
                        </span>
                        01 Hộp nến xoắn pastel 6 cây
                      </span>
                      <span className="font-semibold text-secondary">
                        Tặng kèm
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-base">
                          verified
                        </span>
                        01 Dao răng cưa &amp; 10 set thìa dĩa gỗ mộc
                      </span>
                      <span className="font-semibold text-secondary">
                        Tặng kèm
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-base">
                          verified
                        </span>
                        01 Thiệp mỹ thuật dập nổi viết tay
                      </span>
                      <span className="font-semibold text-secondary">
                        Tặng kèm
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-base">
                          verified
                        </span>
                        Hộp mica trong suốt thắt nơ lụa cao cấp
                      </span>
                      <span className="font-semibold text-secondary">
                        Tặng kèm
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Total Calculation */}
                <div className="bg-surface-container p-space-md rounded-2xl flex flex-col gap-space-xs text-xs">
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Giá bánh custom (2 tầng):</span>
                    <span className="font-medium text-on-surface">950.000đ</span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Phụ kiện tiệc trọn gói:</span>
                    <span className="text-secondary font-semibold">Tặng kèm</span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Phí vận chuyển xe lạnh:</span>
                    <span className="text-secondary font-semibold">
                      Miễn phí (SweetCare)
                    </span>
                  </div>
                  <div className="h-0.5 bg-outline-variant/30 my-1"></div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold text-sm">
                      Tổng thanh toán:
                    </span>
                    <span className="font-headline-md text-headline-md text-secondary font-bold text-xl">
                      950.000đ
                    </span>
                  </div>
                </div>
              </div>


            </div>
          </div>

          {/* Need Changes / Emergency Banner */}
          <div className="mt-space-xl p-space-lg rounded-2xl bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-md shadow-sm border border-outline-variant/20">
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-2xl">
                  edit_note
                </span>
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-primary">
                  Bạn cần đổi ghi chú hay khung giờ nhận bánh?
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-space-sm whitespace-nowrap">
              <button
                className="bg-surface hover:bg-surface-container-high text-primary px-space-md py-space-sm rounded-xl font-label-md text-label-md font-semibold transition-all shadow-sm cursor-pointer"
                onClick={() => setIsChangeTimeModalOpen(true)}
                type="button"
              >
                Thay đổi giờ giao
              </button>
              <button
                className="bg-primary text-on-primary hover:bg-secondary px-space-md py-space-sm rounded-xl font-label-md text-label-md font-semibold transition-all shadow-sm cursor-pointer"
                onClick={() => {
                  setTempPlaqueText(plaqueText)
                  setIsEditPlaqueModalOpen(true)
                }}
                type="button"
              >
                Sửa thiệp mừng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MODALS & INTERACTIVE OVERLAYS
      ========================================================= */}

      {/* MODAL 1: Chef Jean-Luc Direct Messaging */}
      {isChefChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-primary-container text-on-primary-container p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                  JL
                </div>
                <div>
                  <h3 className="font-headline-sm text-base text-primary-fixed font-bold">
                    Bếp Trưởng Jean-Luc
                  </h3>
                  <p className="text-xs text-primary-fixed-dim flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Đang trực tiếp chế tác tại Xưởng 02
                  </p>
                </div>
              </div>
              <button
                className="p-1 text-primary-fixed hover:text-white transition-colors cursor-pointer"
                onClick={() => setIsChefChatOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-surface-container-low text-xs">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-outline">
                    <span>{msg.name}</span>
                    <span>•</span>
                    <span>{msg.time}</span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${msg.sender === 'user'
                        ? 'bg-primary text-on-primary rounded-tr-none'
                        : 'bg-surface text-primary rounded-tl-none border border-outline-variant/20 shadow-sm'
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form
              className="p-3 bg-surface border-t border-outline-variant/20 flex gap-2"
              onSubmit={handleSendChefMessage}
            >
              <input
                className="flex-1 bg-surface-container-low text-on-surface px-4 py-2.5 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
                placeholder="Nhắn tin dặn dò thợ bánh..."
                type="text"
                value={newChefMessage}
                onChange={(e) => setNewChefMessage(e.target.value)}
              />
              <button
                className="px-4 py-2.5 bg-primary hover:bg-secondary text-on-primary rounded-xl font-label-md text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                type="submit"
              >
                <span>Gửi</span>
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Delivery Time */}
      {isChangeTimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-md w-full shadow-2xl p-6 border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-primary text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  schedule
                </span>
                Điều Chỉnh Khung Giờ Nhận
              </h3>
              <button
                className="text-outline hover:text-primary transition-colors cursor-pointer"
                onClick={() => setIsChangeTimeModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Khung giờ tiếp nhận điều chỉnh trước 13:30 hôm nay mà không ảnh hưởng tới tiến độ xe lạnh:
            </p>

            <div className="space-y-2">
              {[
                { time: '14:30 - 15:00', label: 'Sớm hơn 30 phút' },
                { time: '15:30 - 16:00', label: 'Khung giờ hiện tại (Khuyến nghị)' },
                { time: '16:30 - 17:00', label: 'Muộn hơn 1 tiếng' },
                { time: '18:00 - 19:00', label: 'Tối tiệc gia đình' },
              ].map((slot) => (
                <label
                  key={slot.time}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-xs ${selectedNewTime === slot.time
                      ? 'border-secondary bg-secondary-fixed/20 font-bold text-primary'
                      : 'border-outline-variant/30 hover:bg-surface-container-low text-on-surface'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      checked={selectedNewTime === slot.time}
                      className="accent-secondary"
                      name="deliverySlot"
                      type="radio"
                      onChange={() => setSelectedNewTime(slot.time)}
                    />
                    <span>{slot.time}</span>
                  </div>
                  <span className="text-[11px] text-outline font-medium">
                    {slot.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold cursor-pointer"
                onClick={() => setIsChangeTimeModalOpen(false)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md text-xs font-bold transition-colors shadow cursor-pointer"
                onClick={handleSaveDeliveryTime}
                type="button"
              >
                Cập Nhật Giờ Giao
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Plaque Inscription */}
      {isEditPlaqueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-md w-full shadow-2xl p-6 border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-primary text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  draw
                </span>
                Sửa Bảng Chữ Socola &amp; Thiệp
              </h3>
              <button
                className="text-outline hover:text-primary transition-colors cursor-pointer"
                onClick={() => setIsEditPlaqueModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Bếp trưởng Jean-Luc đang chuẩn bị viết chữ socola vàng nghệ thuật trên phiến socola Valrhona:
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary">
                Dòng chữ trên bánh (tối đa 35 ký tự):
              </label>
              <input
                className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/40 text-xs font-medium focus:outline-none focus:border-secondary"
                maxLength={35}
                type="text"
                value={tempPlaqueText}
                onChange={(e) => setTempPlaqueText(e.target.value)}
              />
              <span className="text-[10px] text-outline block text-right">
                {tempPlaqueText.length}/35 ký tự
              </span>
            </div>

            <div className="p-3 bg-surface-container rounded-xl text-[11px] text-on-surface-variant space-y-1">
              <p>
                <strong>Bản xem trước viết tay:</strong>{' '}
                <span className="italic text-secondary font-bold">
                  "{tempPlaqueText}"
                </span>
              </p>
              <p className="text-outline">
                Sử dụng mực socola vàng nhũ thực phẩm cao cấp nhập khẩu từ Pháp.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold cursor-pointer"
                onClick={() => setIsEditPlaqueModalOpen(false)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md text-xs font-bold transition-colors shadow cursor-pointer"
                onClick={handleSavePlaque}
                type="button"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VAT Invoice Quick View */}
      {isVatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full shadow-2xl p-6 border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl">
                  receipt_long
                </span>
                <div>
                  <h3 className="font-headline-sm text-primary text-base font-bold">
                    Hóa Đơn Giá Trị Gia Tăng Điện Tử
                  </h3>
                  <p className="text-[11px] text-outline">
                    Mẫu số: 01GTKT0/001 - Ký hiệu: SC/25E
                  </p>
                </div>
              </div>
              <button
                className="text-outline hover:text-primary transition-colors cursor-pointer"
                onClick={() => setIsVatModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-4 bg-surface-container-low rounded-xl text-xs space-y-2 font-mono">
              <div className="flex justify-between border-b pb-1.5 border-outline-variant/20">
                <span>Đơn vị bán:</span>
                <span className="font-bold">SWEET CAKE VIETNAM CO., LTD</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-outline-variant/20">
                <span>Mã số thuế:</span>
                <span>0318999888</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-outline-variant/20">
                <span>Khách hàng:</span>
                <span>Thảo My (0908 123 456)</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-outline-variant/20">
                <span>Mã đơn hàng:</span>
                <span>#ORD-2025-9982</span>
              </div>
              <div className="pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>1. Bánh Velvet Raspberry Bliss (16cm):</span>
                  <span>436.364đ</span>
                </div>
                <div className="flex justify-between">
                  <span>2. Combo Phụ Kiện Tiệc:</span>
                  <span>72.727đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Thuế suất GTGT (10%):</span>
                  <span>50.909đ</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-outline-variant/30 text-primary">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-secondary">560.000 VNĐ</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold cursor-pointer"
                onClick={() => setIsVatModalOpen(false)}
                type="button"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Full 6-Photo Workshop History Gallery */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col">
            <div className="p-4 bg-primary text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">
                  photo_library
                </span>
                <span className="font-label-md text-sm font-bold">
                  Nhật Ký 6 Cột Mốc Chế Tác Tại Xưởng (#ORD-2025-9982)
                </span>
              </div>
              <button
                className="text-on-primary/80 hover:text-white transition-colors cursor-pointer"
                onClick={() => setIsGalleryOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Main Highlighted Photo */}
            <div className="p-4 bg-surface-container-lowest flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:w-3/5 h-72 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-md">
                <img
                  alt={galleryPhotos[selectedPhotoIndex].title}
                  className="w-full h-full object-cover"
                  src={galleryPhotos[selectedPhotoIndex].src}
                />
              </div>
              <div className="w-full md:w-2/5 space-y-2 text-xs">
                <span className="px-2.5 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full font-bold text-[10px]">
                  {galleryPhotos[selectedPhotoIndex].stage}
                </span>
                <h4 className="font-headline-sm text-primary text-base font-bold">
                  {galleryPhotos[selectedPhotoIndex].title}
                </h4>
                <p className="text-secondary font-semibold text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    schedule
                  </span>
                  {galleryPhotos[selectedPhotoIndex].time}
                </p>
                <p className="text-on-surface-variant leading-relaxed">
                  {galleryPhotos[selectedPhotoIndex].desc}
                </p>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex gap-2 overflow-x-auto">
              {galleryPhotos.map((item, idx) => (
                <button
                  key={idx}
                  className={`w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${selectedPhotoIndex === idx
                      ? 'border-secondary ring-2 ring-secondary/30 scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  type="button"
                >
                  <img
                    alt={item.title}
                    className="w-full h-full object-cover"
                    src={item.src}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Customer Order Completion & View History Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-primary to-surface-container-high text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-md">
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base text-primary-fixed font-bold">
                    Xác Nhận Đã Nhận Bánh
                  </h3>
                  <p className="text-xs text-primary-fixed-dim">
                    Đơn hàng {orderId} • Xưởng: {bakeryName}
                  </p>
                </div>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-on-primary flex items-center justify-center transition-colors cursor-pointer"
                onClick={() => setIsReviewModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body: Only Cake Information */}
            <div className="p-6 space-y-4 bg-surface-container-lowest text-xs">
              {/* Product Card Snippet */}
              <div className="p-4 bg-surface-container-low rounded-2xl flex items-center gap-3.5 border border-outline-variant/20">
                <img
                  alt="Pikachu cake preview"
                  className="w-18 h-18 rounded-xl object-cover shadow-sm shrink-0 border border-outline-variant/20"
                  src={cakePhotoDefault}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Hoàn thành 100%
                    </span>
                    <span className="text-outline text-[11px]">Đã giao xe lạnh</span>
                  </div>
                  <h4 className="font-label-md text-sm font-bold text-primary truncate">
                    {currentOrderTitle}
                  </h4>
                  <p className="text-on-surface-variant text-[11px] truncate mt-0.5">
                    Xưởng chế tác: {bakeryName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-label-sm text-outline block text-[11px]">Giá trị đơn</span>
                  <span className="font-headline-sm text-sm font-bold text-primary">
                    {currentOrderPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {/* Status Note */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0">
                  check_circle
                </span>
                <p className="text-emerald-900 text-xs leading-relaxed">
                  Đơn hàng đã được xác nhận hoàn tất thành công và lưu vào <strong>Lịch sử đơn hàng</strong> trong hồ sơ của bạn.
                </p>
              </div>
            </div>

            {/* Modal Footer Actions: View Order History */}
            <div className="p-4 bg-surface border-t border-outline-variant/20 flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold cursor-pointer"
                onClick={() => setIsReviewModalOpen(false)}
                type="button"
              >
                Đóng
              </button>
              <button
                className="flex-2 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                onClick={() => {
                  markOrderAsDelivered()
                  setHasReviewed(true)
                  setEscrowReleased(true)
                  setTrackingStage(6)
                  setIsReviewModalOpen(false)
                  setShowReviewSuccessBanner(true)
                  if (onNavigate) {
                    onNavigate('profile')
                  }
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-base">receipt_long</span>
                <span>Xem Lịch Sử Đơn Hàng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: Cancel Order & Escrow Refund Modal */}
      {isCancelEscrowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col">
            <div className="p-5 bg-gradient-to-r from-rose-900 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-2xl">cancel</span>
                </div>
                <div>
                  <h3 className="font-bold text-base">Hủy Đơn &amp; Hoàn Cọc Escrow</h3>
                  <p className="text-xs text-rose-200">Đơn hàng {orderId}</p>
                </div>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                onClick={() => setIsCancelEscrowModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 bg-surface-container-lowest text-xs text-on-surface">
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-1">
                <p className="font-bold text-primary text-sm">{currentOrderTitle}</p>
                <p className="text-on-surface-variant">Xưởng chế tác: {bakeryName}</p>
                <div className="flex justify-between pt-1 border-t border-outline-variant/20">
                  <span className="text-outline">Tiền cọc đã thanh toán:</span>
                  <span className="font-bold text-primary">{currentOrderPrice.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Policy Notice Box */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span>Chính sách bồi hoàn SweetCake Escrow:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {trackingStage === 4 ? (
                    <span>
                      Đơn hàng đang ở giai đoạn <strong>Đang làm bánh</strong>, xưởng đã tạo hình và sơ chế nguyên vật liệu cao cấp. Áp dụng chính sách hoàn trả <strong>{cancelPolicyPercent}%</strong> tiền cọc.
                    </span>
                  ) : (
                    <span>
                      Đơn hàng đang ở giai đoạn <strong>Chuẩn bị</strong> trước khi vào lò. Áp dụng mức hoàn trả <strong>{cancelPolicyPercent}%</strong> tiền cọc cho khách hàng.
                    </span>
                  )}
                </p>
                <div className="p-2 rounded-lg bg-white/80 flex items-center justify-between font-bold text-xs pt-1 border border-amber-200/50">
                  <span className="text-amber-900">Số tiền bạn nhận lại:</span>
                  <span className="text-secondary text-sm">
                    {Math.round((currentOrderPrice * cancelPolicyPercent) / 100).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface border-t border-outline-variant/20 flex gap-2.5">
              <button
                className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold cursor-pointer"
                onClick={() => setIsCancelEscrowModalOpen(false)}
                type="button"
              >
                Giữ đơn / Quay lại
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                onClick={handleConfirmCancelOrder}
                type="button"
              >
                Xác nhận hủy &amp; Hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderTrackingPage
