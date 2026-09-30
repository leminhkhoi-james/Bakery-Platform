import { useState, useEffect } from 'react'

export const PaymentGatewayPage = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('vnpay') // 'vnpay' | 'momo' | 'cod'
  const [copiedContent, setCopiedContent] = useState(false)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [codConfirmed, setCodConfirmed] = useState(false)

  // Read accepted bid & order from localStorage
  const [acceptedBid] = useState(() => {
    try {
      const saved = localStorage.getItem('sweetcake_accepted_bid')
      if (saved) return JSON.parse(saved)
    } catch {}
    return null
  })

  // Read active RFQ custom cake design from localStorage
  const [activeRfq] = useState(() => {
    try {
      const saved = localStorage.getItem('sweetcake_active_rfq')
      if (saved) return JSON.parse(saved)
    } catch {}
    return null
  })

  const orderId =
    acceptedBid?.orderCode ||
    localStorage.getItem('sweetcake_active_order_code') ||
    '#ORD-2025-9982'
  const bakeryName = acceptedBid?.name || 'Sweet Bakery'
  const totalAmount = acceptedBid?.price || activeRfq?.budget || 950000

  const cakeTitle =
    acceptedBid?.title ||
    activeRfq?.title ||
    'Bánh Sinh Nhật Pikachu Tạo Hình 3D (2 Tầng)'
  const cakeImage =
    acceptedBid?.image ||
    activeRfq?.image ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ'
  const cakeSize =
    acceptedBid?.selectedSize ||
    activeRfq?.selectedSize ||
    '2 Tầng (20cm + 14cm) • 12 - 18 phần'
  const cakeFlavor =
    activeRfq?.flavors ||
    'Chiffon Vani Dâu Tây Hữu Cơ (ít ngọt 30%) + Kem whipping Pháp'

  // Countdown Timer 14:58
  const [secondsRemaining, setSecondsRemaining] = useState(14 * 60 + 58)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTimer = (totalSecs) => {
    if (totalSecs <= 0) return '00:00 - Hết hạn'
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const transferSyntax = `SWEETCAKE ${orderId.replace(/[^a-zA-Z0-9]/g, '')}`

  const handleCopyContent = () => {
    navigator.clipboard?.writeText(transferSyntax)
    setCopiedContent(true)
    setTimeout(() => setCopiedContent(false), 2000)
  }

  const handleVerifyPayment = () => {
    setIsVerifyingPayment(true)
    setTimeout(() => {
      setIsVerifyingPayment(false)
      setPaymentSuccess(true)
    }, 1800)
  }

  const handleSimulateFail = () => {
    setIsVerifyingPayment(true)
    setTimeout(() => {
      setIsVerifyingPayment(false)
      setPaymentFailed(true)
    }, 1800)
  }

  const handleConfirmCod = () => {
    setCodConfirmed(true)
  }

  return (
    <div className="w-full bg-background min-h-[calc(100vh-20rem)] flex-1">
      <div className="flex flex-col w-full">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8 md:py-12">
          {/* TOP TRACKER & STATUS BAR */}
          <div className="flex flex-col gap-4 mb-8">


            {/* Checkout Timer Ribbon */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-high shadow-sm border border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary animate-pulse text-xl">
                    hourglass_top
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                    <p className="font-headline-sm text-base text-primary font-bold">
                      Chờ thanh toán đơn hàng
                    </p>
                  </div>
                  <div className="mt-1">
                    <span className="font-label-sm px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs inline-block">
                      Mã: #ORD-2025-9982
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-xl shadow-sm border border-outline-variant/20">
                <span className="material-symbols-outlined text-secondary text-base">
                  timer
                </span>
                <span className="font-label-md text-on-surface-variant text-xs sm:text-sm">
                  Thời gian thanh toán còn:
                </span>
                <span
                  className={`font-headline-sm text-lg tracking-wider font-bold ${
                    secondsRemaining <= 120 ? 'text-error' : 'text-secondary'
                  }`}
                  id="countdown-timer"
                >
                  {formatTimer(secondsRemaining)}
                </span>
              </div>
            </div>
          </div>

          {/* MAIN CHECKOUT DUAL-COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: PAYMENT GATEWAY HUB (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">

              {/* Payment Method Tabs Nav */}
              <div className="grid grid-cols-3 gap-2 bg-surface-container-high p-1.5 rounded-2xl">
                <button
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl font-label-md transition-all cursor-pointer ${
                    activeTab === 'vnpay'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-primary font-medium'
                  }`}
                  onClick={() => setActiveTab('vnpay')}
                  type="button"
                >
                  <div className="w-6 h-6 rounded-full bg-[#005BAA]/15 flex items-center justify-center text-[#005BAA]">
                    <span className="material-symbols-outlined text-base">
                      qr_code_2
                    </span>
                  </div>
                  <span>VNPay-QR</span>
                </button>

                <button
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl font-label-md transition-all cursor-pointer ${
                    activeTab === 'momo'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-primary font-medium'
                  }`}
                  onClick={() => setActiveTab('momo')}
                  type="button"
                >
                  <div className="w-6 h-6 rounded-full bg-[#A50064]/15 flex items-center justify-center text-[#A50064]">
                    <span className="material-symbols-outlined text-base">
                      account_balance_wallet
                    </span>
                  </div>
                  <span>Ví MoMo</span>
                </button>

                <button
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl font-label-md transition-all cursor-pointer ${
                    activeTab === 'cod'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-primary font-medium'
                  }`}
                  onClick={() => setActiveTab('cod')}
                  type="button"
                >
                  <div className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-base">
                      payments
                    </span>
                  </div>
                  <span>COD Tiền mặt</span>
                </button>
              </div>

              {/* TAB CONTENT: VNPAY */}
              {activeTab === 'vnpay' && (
                <div className="flex flex-col gap-6 animate-in fade-in">
                  <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 border border-outline-variant/30">
                    <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-lg bg-[#005BAA]/10 flex items-center gap-1.5">
                          <span className="font-headline-sm text-[#005BAA] font-black tracking-tight text-lg">
                            VN
                          </span>
                          <span className="font-headline-sm text-[#ED1C24] font-black tracking-tight text-lg">
                            PAY
                          </span>
                          <span className="text-[10px] font-label-sm font-bold bg-[#005BAA] text-white px-1.5 py-0.5 rounded ml-1">
                            QR
                          </span>
                        </div>
                        <div>
                          <p className="font-label-lg text-primary font-bold">
                            Cổng VNPay All-in-One
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Main Display Area */}
                    <div className="flex flex-col md:flex-row items-center gap-8 pt-2">
                      {/* QR Block with Scanning Wave Animation */}
                      <div className="relative flex flex-col items-center shrink-0">
                        <div className="relative p-4 rounded-2xl bg-surface-container-low shadow-sm border border-outline-variant/30">
                          {/* Radar Wave Line Animation */}
                          <div className="absolute inset-x-4 top-4 h-1 bg-gradient-to-r from-transparent via-[#005BAA] to-transparent rounded-full animate-bounce shadow-md"></div>
                          <svg
                            className="w-48 h-48 sm:w-52 sm:h-52 text-primary"
                            fill="currentColor"
                            viewBox="0 0 200 200"
                          >
                            <rect
                              fill="#4A2218"
                              height="45"
                              rx="6"
                              width="45"
                              x="10"
                              y="10"
                            ></rect>
                            <rect
                              fill="#fbf9f5"
                              height="29"
                              rx="3"
                              width="29"
                              x="18"
                              y="18"
                            ></rect>
                            <rect
                              fill="#005BAA"
                              height="17"
                              rx="2"
                              width="17"
                              x="24"
                              y="24"
                            ></rect>
                            <rect
                              fill="#4A2218"
                              height="45"
                              rx="6"
                              width="45"
                              x="145"
                              y="10"
                            ></rect>
                            <rect
                              fill="#fbf9f5"
                              height="29"
                              rx="3"
                              width="29"
                              x="153"
                              y="18"
                            ></rect>
                            <rect
                              fill="#005BAA"
                              height="17"
                              rx="2"
                              width="17"
                              x="159"
                              y="24"
                            ></rect>
                            <rect
                              fill="#4A2218"
                              height="45"
                              rx="6"
                              width="45"
                              x="10"
                              y="145"
                            ></rect>
                            <rect
                              fill="#fbf9f5"
                              height="29"
                              rx="3"
                              width="29"
                              x="18"
                              y="153"
                            ></rect>
                            <rect
                              fill="#005BAA"
                              height="17"
                              rx="2"
                              width="17"
                              x="24"
                              y="159"
                            ></rect>
                            <rect
                              height="20"
                              rx="1"
                              width="8"
                              x="65"
                              y="15"
                            ></rect>
                            <rect
                              height="8"
                              rx="1"
                              width="16"
                              x="80"
                              y="20"
                            ></rect>
                            <rect
                              height="12"
                              rx="2"
                              width="12"
                              x="105"
                              y="12"
                            ></rect>
                            <rect
                              height="25"
                              rx="1"
                              width="10"
                              x="125"
                              y="15"
                            ></rect>
                            <rect
                              height="10"
                              rx="1"
                              width="25"
                              x="65"
                              y="45"
                            ></rect>
                            <rect
                              height="25"
                              rx="1"
                              width="15"
                              x="100"
                              y="35"
                            ></rect>
                            <rect
                              height="15"
                              rx="1"
                              width="12"
                              x="125"
                              y="50"
                            ></rect>
                            <rect
                              height="10"
                              rx="1"
                              width="15"
                              x="15"
                              y="65"
                            ></rect>
                            <rect
                              height="12"
                              rx="1"
                              width="18"
                              x="38"
                              y="70"
                            ></rect>
                            <rect
                              height="10"
                              rx="1"
                              width="25"
                              x="15"
                              y="90"
                            ></rect>
                            <rect
                              height="20"
                              rx="1"
                              width="15"
                              x="15"
                              y="110"
                            ></rect>
                            <rect
                              height="12"
                              rx="1"
                              width="15"
                              x="38"
                              y="105"
                            ></rect>
                            <circle
                              cx="100"
                              cy="100"
                              fill="#fbf9f5"
                              r="24"
                            ></circle>
                            <circle
                              cx="100"
                              cy="100"
                              fill="#4A2218"
                              r="20"
                            ></circle>
                            <path
                              d="M93 96 C93 92 107 92 107 96 C107 103 93 104 93 108 L107 108"
                              fill="none"
                              stroke="#fcdbd5"
                              strokeLinecap="round"
                              strokeWidth="2.5"
                            ></path>
                            <circle
                              cx="100"
                              cy="89"
                              fill="#feb96c"
                              r="2"
                            ></circle>
                            <rect
                              height="10"
                              rx="1"
                              width="15"
                              x="145"
                              y="65"
                            ></rect>
                            <rect
                              height="12"
                              rx="1"
                              width="18"
                              x="168"
                              y="70"
                            ></rect>
                            <rect
                              height="10"
                              rx="1"
                              width="22"
                              x="145"
                              y="90"
                            ></rect>
                            <rect
                              height="15"
                              rx="1"
                              width="20"
                              x="150"
                              y="110"
                            ></rect>
                            <rect
                              height="20"
                              rx="1"
                              width="18"
                              x="65"
                              y="130"
                            ></rect>
                            <rect
                              height="10"
                              rx="1"
                              width="22"
                              x="90"
                              y="135"
                            ></rect>
                            <rect
                              height="25"
                              rx="1"
                              width="15"
                              x="120"
                              y="130"
                            ></rect>
                            <rect
                              height="12"
                              rx="1"
                              width="25"
                              x="65"
                              y="160"
                            ></rect>
                            <rect
                              height="25"
                              rx="1"
                              width="15"
                              x="100"
                              y="155"
                            ></rect>
                            <rect
                              height="15"
                              rx="1"
                              width="20"
                              x="125"
                              y="165"
                            ></rect>
                            <rect
                              height="18"
                              rx="1"
                              width="12"
                              x="155"
                              y="155"
                            ></rect>
                            <rect
                              height="12"
                              rx="1"
                              width="15"
                              x="175"
                              y="145"
                            ></rect>
                            <rect
                              height="18"
                              rx="1"
                              width="18"
                              x="170"
                              y="165"
                            ></rect>
                          </svg>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs font-label-md text-on-surface-variant font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Đang chờ bạn mở App quét mã...</span>
                        </div>
                      </div>

                      {/* Transaction Quick Details */}
                      <div className="w-full flex flex-col gap-3">
                        <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between">
                          <span className="font-body-sm text-xs text-on-surface-variant">
                            Số tiền thanh toán:
                          </span>
                          <span className="font-headline-sm text-xl text-primary font-bold">
                            {totalAmount.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between">
                          <span className="font-body-sm text-xs text-on-surface-variant">
                            Nội dung chuyển khoản:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-label-md text-primary font-bold tracking-wider">
                              {transferSyntax}
                            </span>
                            <button
                              className="p-1 text-secondary hover:text-primary transition-colors cursor-pointer"
                              onClick={handleCopyContent}
                              title="Sao chép nội dung"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">
                                {copiedContent ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between">
                          <span className="font-body-sm text-xs text-on-surface-variant">
                            Mã phiên VNPay:
                          </span>
                          <span className="font-label-md text-on-surface font-semibold">
                            VNPAY-8829103
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            className="py-3 px-3 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-bold text-xs shadow cursor-pointer transition-all flex items-center justify-center gap-1.5"
                            onClick={handleVerifyPayment}
                            disabled={isVerifyingPayment}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isVerifyingPayment ? 'sync' : 'check_circle'}
                            </span>
                            {isVerifyingPayment ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản'}
                          </button>
                          <button
                            className="py-3 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                            onClick={handleSimulateFail}
                            disabled={isVerifyingPayment}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">
                              error
                            </span>
                            Mô phỏng thất bại
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Steps list */}
                    <div className="pt-4 border-t border-outline-variant/20 space-y-2">
                      <p className="font-label-md text-primary font-bold">
                        Hướng dẫn 3 bước thao tác:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-body-sm">
                        <div className="p-3 rounded-xl bg-surface-container">
                          <span className="font-bold text-secondary">
                            Bước 1:
                          </span>{' '}
                          Mở App Ngân hàng hoặc ví VNPay bất kỳ trên điện thoại.
                        </div>
                        <div className="p-3 rounded-xl bg-surface-container">
                          <span className="font-bold text-secondary">
                            Bước 2:
                          </span>{' '}
                          Chọn tính năng <strong>Quét mã QR</strong> và căn vào
                          hình trên.
                        </div>
                        <div className="p-3 rounded-xl bg-surface-container">
                          <span className="font-bold text-secondary">
                            Bước 3:
                          </span>{' '}
                          Kiểm tra số tiền 950.000đ, áp mã ưu đãi và bấm xác nhận.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: MOMO */}
              {activeTab === 'momo' && (
                <div className="flex flex-col gap-6 animate-in fade-in">
                  <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 border border-outline-variant/30">
                    <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#A50064] text-white flex items-center justify-center font-bold shadow-sm">
                          <span className="font-headline-sm text-sm">MoMo</span>
                        </div>
                        <div>
                          <p className="font-label-lg text-primary font-bold">
                            Ví điện tử MoMo
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* QR MoMo Mockup */}
                      <div className="p-5 rounded-2xl bg-[#A50064]/5 flex flex-col items-center text-center space-y-3 border border-outline-variant/20">
                        <div className="p-3 bg-surface-container-lowest rounded-2xl shadow-sm">
                          <svg
                            className="w-40 h-40 text-[#A50064]"
                            fill="currentColor"
                            viewBox="0 0 160 160"
                          >
                            <rect
                              height="35"
                              rx="5"
                              width="35"
                              x="10"
                              y="10"
                            ></rect>
                            <rect
                              fill="#fff"
                              height="23"
                              rx="2"
                              width="23"
                              x="16"
                              y="16"
                            ></rect>
                            <rect
                              fill="#A50064"
                              height="11"
                              rx="1"
                              width="11"
                              x="22"
                              y="22"
                            ></rect>
                            <rect
                              height="35"
                              rx="5"
                              width="35"
                              x="115"
                              y="10"
                            ></rect>
                            <rect
                              fill="#fff"
                              height="23"
                              rx="2"
                              width="23"
                              x="121"
                              y="16"
                            ></rect>
                            <rect
                              fill="#A50064"
                              height="11"
                              rx="1"
                              width="11"
                              x="127"
                              y="22"
                            ></rect>
                            <rect
                              height="35"
                              rx="5"
                              width="35"
                              x="10"
                              y="115"
                            ></rect>
                            <rect
                              fill="#fff"
                              height="23"
                              rx="2"
                              width="23"
                              x="16"
                              y="121"
                            ></rect>
                            <rect
                              fill="#A50064"
                              height="11"
                              rx="1"
                              width="11"
                              x="22"
                              y="127"
                            ></rect>
                            <circle
                              cx="80"
                              cy="80"
                              fill="#A50064"
                              r="16"
                            ></circle>
                            <text
                              fill="#fff"
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                              x="80"
                              y="85"
                            >
                              MoMo
                            </text>
                            <rect
                              height="8"
                              rx="2"
                              width="45"
                              x="55"
                              y="15"
                            ></rect>
                            <rect
                              height="15"
                              rx="2"
                              width="15"
                              x="55"
                              y="30"
                            ></rect>
                            <rect
                              height="8"
                              rx="2"
                              width="20"
                              x="80"
                              y="30"
                            ></rect>
                            <rect
                              height="10"
                              rx="2"
                              width="30"
                              x="15"
                              y="55"
                            ></rect>
                            <rect
                              height="10"
                              rx="2"
                              width="30"
                              x="115"
                              y="55"
                            ></rect>
                            <rect
                              height="25"
                              rx="2"
                              width="15"
                              x="15"
                              y="75"
                            ></rect>
                            <rect
                              height="20"
                              rx="2"
                              width="20"
                              x="125"
                              y="75"
                            ></rect>
                            <rect
                              height="15"
                              rx="2"
                              width="20"
                              x="55"
                              y="115"
                            ></rect>
                            <rect
                              height="30"
                              rx="2"
                              width="15"
                              x="85"
                              y="115"
                            ></rect>
                            <rect
                              height="12"
                              rx="2"
                              width="30"
                              x="115"
                              y="115"
                            ></rect>
                            <rect
                              height="8"
                              rx="2"
                              width="20"
                              x="55"
                              y="138"
                            ></rect>
                            <rect
                              height="15"
                              rx="2"
                              width="15"
                              x="115"
                              y="135"
                            ></rect>
                          </svg>
                        </div>
                        <p className="font-label-md text-primary font-bold">
                          Mã QR Thanh Toán MoMo
                        </p>
                        <p className="font-body-sm text-xs text-on-surface-variant">
                          Sử dụng tính năng Quét mã trên App MoMo
                        </p>
                      </div>

                      {/* Quick MoMo Web Redirection */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
                          <div className="flex justify-between text-xs font-body-sm">
                            <span className="text-on-surface-variant">
                              Số tiền giao dịch:
                            </span>
                            <span className="font-bold text-primary text-base">
                              {totalAmount.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                          <div className="flex justify-between text-xs font-body-sm">
                            <span className="text-on-surface-variant">
                              Đơn vị thụ hưởng:
                            </span>
                            <span className="font-semibold text-primary">
                              Sweet Cake Vietnam Co., Ltd
                            </span>
                          </div>
                        </div>

                        <button
                          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#A50064] hover:bg-[#8d0055] text-white font-label-lg transition-all shadow-md cursor-pointer font-bold"
                          onClick={() =>
                            alert('Đang mở ứng dụng MoMo trên thiết bị của bạn...')
                          }
                          type="button"
                        >
                          <span className="material-symbols-outlined text-lg">
                            open_in_new
                          </span>
                          <span>Chuyển tiếp sang App MoMo</span>
                        </button>

                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: COD */}
              {activeTab === 'cod' && (
                <div className="flex flex-col gap-6 animate-in fade-in">
                  <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 border border-outline-variant/30">
                    <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-2xl">
                            local_shipping
                          </span>
                        </div>
                        <div>
                          <p className="font-label-lg text-primary font-bold">
                            Thanh toán khi nhận bánh (COD)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Premium Patisserie COD Guarantee Box */}
                    <div className="p-5 rounded-2xl bg-surface-container-low space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-secondary text-2xl shrink-0 mt-0.5">
                          verified
                        </span>
                        <div>
                          <h4 className="font-headline-sm text-base text-primary font-semibold">
                            Tiêu chuẩn kiểm định &amp; Bảo hiểm vận chuyển 4°C -
                            6°C:
                          </h4>
                          <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
                            Khách hàng cùng shipper xe lạnh đồng kiểm tra dáng
                            bánh nguyên vẹn, hoa quả tươi tắn và dòng chữ sô-cô-la
                            trước khi thanh toán. Nếu bánh có bất kỳ vết xô
                            lệch, chảy kem hoặc nứt vỡ trong thùng lạnh bảo ôn,
                            bạn có quyền{' '}
                            <strong>
                              từ chối nhận bánh mà không phát sinh bất kỳ khoản
                              phí nào
                            </strong>
                            .
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-surface-container-lowest flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-lg">
                            ac_unit
                          </span>
                          <span className="font-body-sm text-xs text-on-surface">
                            Thùng xe chuyên dụng giữ lạnh 4°C
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-surface-container-lowest flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-lg">
                            currency_exchange
                          </span>
                          <span className="font-body-sm text-xs text-on-surface">
                            Shipper luôn sẵn tiền mặt thối lại
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <span className="font-body-sm text-xs text-on-surface-variant">
                          Tổng tiền mặt cần chuẩn bị:
                        </span>
                        <p className="font-headline-sm text-2xl text-primary font-bold">
                          950.000 VNĐ
                        </p>
                      </div>
                      <button
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-bold"
                        onClick={handleConfirmCod}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-lg">
                          check_circle
                        </span>
                        <span>
                          {codConfirmed
                            ? 'Đã ghi nhận đặt đơn COD'
                            : 'Xác nhận đặt đơn COD'}
                        </span>
                      </button>
                    </div>

                    {codConfirmed && (
                      <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                        <span className="material-symbols-outlined text-base text-emerald-600">
                          check_circle
                        </span>
                        <span>
                          Đơn hàng COD #ORD-2025-9982 đã được xác nhận! Bếp trưởng
                          đang tiến hành nướng bánh.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Real-time sync socket note & back actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low text-xs font-body-sm border border-outline-variant/20">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-secondary text-base animate-spin">
                    sync
                  </span>
                  <span>
                    Hệ thống tự động kích hoạt xác nhận khi nhận tín hiệu giao
                    dịch...
                  </span>
                </div>
                <button
                  className="text-secondary hover:text-primary font-label-md flex items-center gap-1.5 transition-colors cursor-pointer font-semibold px-3 py-1.5 rounded-lg hover:bg-secondary/10"
                  onClick={() => onNavigate && onNavigate('ai-studio')}
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">
                    arrow_back
                  </span>
                  <span>Quay lại chỉnh sửa thiết kế bánh</span>
                </button>
              </div>

              {/* Action confirmation bar (Ẩn khi là đơn COD) */}
              {activeTab !== 'cod' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    className="flex-1 py-4 px-6 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-bold disabled:opacity-50"
                    disabled={isVerifyingPayment}
                    onClick={handleVerifyPayment}
                    type="button"
                  >
                    {isVerifyingPayment ? (
                      <>
                        <span className="material-symbols-outlined text-xl animate-spin">
                          sync
                        </span>
                        <span>Đang kiểm tra giao dịch...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl">
                          task_alt
                        </span>
                        <span>Tôi đã chuyển khoản xong</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY & SHIPPING SPECS (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-28">
              {/* Summary Card Container */}
              <div className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl shadow-sm space-y-6 border border-outline-variant/30">
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                  <div>
                    <span className="font-label-sm uppercase tracking-wider text-secondary font-semibold text-xs">
                      Tóm tắt đơn đặt bánh
                    </span>
                    <h3 className="font-headline-sm text-xl text-primary font-bold">
                      Chi tiết kiện hàng
                    </h3>
                  </div>
                  <button
                    className="text-xs text-secondary hover:text-primary font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-all cursor-pointer shadow-xs"
                    onClick={() => onNavigate && onNavigate('ai-studio')}
                    type="button"
                    title="Quay lại thiết kế bánh để chỉnh sửa"
                  >
                    <span className="material-symbols-outlined text-sm">palette</span>
                    <span>Sửa thiết kế bánh</span>
                  </button>
                </div>

                {/* Cake Product Showcase Item */}
                <div className="flex gap-4 items-start p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <img
                    alt={cakeTitle}
                    className="w-20 h-20 rounded-lg object-cover shadow-sm shrink-0"
                    src={cakeImage}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline-sm text-base text-primary truncate font-bold">
                      {cakeTitle}
                    </h4>
                    <p className="font-body-sm text-xs text-on-surface-variant">
                      {cakeSize}
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5 line-clamp-1">
                      {cakeFlavor}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-label-sm text-xs text-secondary font-bold">
                        Xưởng: {bakeryName}
                      </span>
                      <span className="font-headline-sm text-base text-primary font-semibold">
                        {totalAmount.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personalized Customization Specs */}
                <div className="space-y-3 p-4 rounded-xl bg-surface-container text-xs font-body-sm border border-outline-variant/20">
                  <div className="flex items-start gap-2 text-primary">
                    <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">
                      draw
                    </span>
                    <div>
                      <span className="font-bold">
                        Dòng chữ socola viết tay:
                      </span>
                      <p className="italic text-on-surface-variant mt-0.5">
                        "Happy 7th Birthday Minh Khang!"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-primary pt-2 border-t border-outline-variant/20">
                    <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">
                      celebration
                    </span>
                    <div className="w-full">
                      <span className="font-bold">
                        Phụ kiện &amp; Setup tiệc đính kèm:
                      </span>
                      <ul className="mt-1 space-y-1 text-on-surface-variant">
                        <li className="flex justify-between">
                          <span>- Nến số 7 mạ vàng hoàng gia</span>
                          <span className="text-secondary font-semibold">
                            Miễn phí
                          </span>
                        </li>
                        <li className="flex justify-between">
                          <span>- Bộ dĩa nĩa gỗ &amp; dao cắt bánh cao cấp (Set 10)</span>
                          <span className="text-secondary font-semibold">
                            Miễn phí
                          </span>
                        </li>
                        <li className="flex justify-between">
                          <span>- Tượng Pikachu 3D Fondant nghệ thuật</span>
                          <span className="text-secondary font-semibold">
                            Đã bao gồm
                          </span>
                        </li>
                        <li className="flex justify-between">
                          <span>- Hộp mica trong suốt kèm ruy băng lụa</span>
                          <span className="text-secondary font-semibold">
                            Miễn phí
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Delivery Schedule & Address Info */}
                <div className="space-y-3 p-4 rounded-xl bg-surface-container-low text-xs font-body-sm border border-outline-variant/20">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-lg shrink-0 mt-0.5">
                      schedule
                    </span>
                    <div>
                      <span className="font-label-md text-primary font-bold">
                        Khung giờ nhận bánh cam kết:
                      </span>
                      <p className="text-on-surface font-semibold mt-0.5">
                        15:30 - 16:30, Ngày 25/10/2025
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2 border-t border-outline-variant/20">
                    <span className="material-symbols-outlined text-secondary text-lg shrink-0 mt-0.5">
                      pin_drop
                    </span>
                    <div>
                      <span className="font-label-md text-primary font-bold">
                        Người nhận &amp; Địa chỉ giao bánh:
                      </span>
                      <p className="text-on-surface mt-0.5 font-medium">
                        Nguyễn Mai Thảo Hân (Hân Mai) • 0918 234 567
                      </p>
                      <p className="text-on-surface-variant text-[11px] leading-relaxed mt-0.5">
                        Căn hộ 18.04, Tháp Opal, Saigon Pearl, 92 Nguyễn Hữu Cảnh, Phường
                        22, Quận Bình Thạnh, TP. Hồ Chí Minh
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transparent Price Breakdown */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex justify-between font-body-sm text-xs text-on-surface-variant">
                    <span>Bánh thủ công ({bakeryName}):</span>
                    <span className="font-medium text-on-surface">
                      {totalAmount.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex justify-between font-body-sm text-xs text-on-surface-variant">
                    <span>Phụ kiện &amp; Thiệp mừng viết tay:</span>
                    <span className="font-medium text-secondary">
                      Miễn phí
                    </span>
                  </div>
                  <div className="flex justify-between font-body-sm text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span>Vận chuyển xe lạnh Suzuki 4.8°C:</span>
                      <span className="text-[10px] bg-secondary-fixed/60 text-secondary px-1.5 py-0.2 rounded font-bold">
                        Miễn phí
                      </span>
                    </span>
                    <span className="font-medium text-emerald-700">0 ₫</span>
                  </div>

                  {/* Grand Total */}
                  <div className="flex items-baseline justify-between pt-4 p-4 rounded-xl bg-primary-container text-on-primary-container shadow-sm">
                    <div>
                      <span className="font-label-sm text-primary-fixed uppercase tracking-wider block font-bold text-xs">
                        Tổng tiền thanh toán
                      </span>
                      <span className="text-[11px] text-primary-fixed-dim">
                        (Ký quỹ Sweet Cake Escrow an toàn 100%)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-headline-sm text-2xl text-primary-fixed font-bold tracking-tight">
                        {totalAmount.toLocaleString('vi-VN')}
                      </span>
                      <span className="font-label-md text-secondary-container ml-1 font-bold">
                        VNĐ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Verified Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 bg-primary/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-outline-variant/30 text-center relative">
            <div className="w-16 h-16 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl">
                check_circle
              </span>
            </div>

            <div>
              <span className="font-label-sm uppercase tracking-wider text-secondary font-bold">
                Thanh Toán Hoàn Tất
              </span>
              <h3 className="font-headline-sm text-primary text-2xl mt-1 font-bold">
                Xác Nhận Thành Công!
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Sweet Cake đã nhận được thanh toán <strong>{totalAmount.toLocaleString('vi-VN')} VNĐ</strong>{' '}
                cho đơn hàng <strong>{orderId}</strong> (Xưởng: {bakeryName}).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface-variant text-left space-y-1.5 border border-outline-variant/20">
              <div className="flex justify-between">
                <span>Cổng thanh toán:</span>
                <span className="font-bold text-primary">
                  {activeTab === 'vnpay'
                    ? 'VNPay-QR'
                    : activeTab === 'momo'
                    ? 'Ví MoMo'
                    : 'COD'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mã giao dịch:</span>
                <span className="font-mono text-primary font-semibold">
                  TXN-20251025-8892
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian giao bánh:</span>
                <span className="font-semibold text-secondary">
                  15:30 - 16:30, Hôm nay (20/09/2026)
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-sm font-semibold transition-colors cursor-pointer"
                onClick={() => {
                  setPaymentSuccess(false)
                  onNavigate && onNavigate('home')
                }}
                type="button"
              >
                Về Trang Chủ
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md text-sm font-bold transition-all shadow cursor-pointer"
                onClick={() => {
                  setPaymentSuccess(false)
                  onNavigate && onNavigate('tracking')
                }}
                type="button"
              >
                Theo Dõi Đơn Hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Failed Modal */}
      {paymentFailed && (
        <div className="fixed inset-0 z-50 bg-primary/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-rose-200 text-center relative">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl">
                error_med
              </span>
            </div>

            <div>
              <span className="font-label-sm uppercase tracking-wider text-rose-700 font-bold">
                Thanh Toán Thất Bại
              </span>
              <h3 className="font-headline-sm text-primary text-2xl mt-1 font-bold">
                Giao Dịch Bị Từ Chối
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Tài khoản ngân hàng / ví điện tử của bạn không thể trừ tiền hoặc hết thời gian xác thực (Timeout). Đơn hàng <strong>{orderId}</strong> chưa được ký quỹ.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 text-xs text-rose-900 text-left space-y-1 border border-rose-200">
              <p className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-base">info</span>
                Hướng xử lý:
              </p>
              <p>• Kiểm tra lại số dư ví / tài khoản ngân hàng</p>
              <p>• Thử lại mã QR mới hoặc đổi sang phương thức thanh toán khác (MoMo / COD)</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-sm font-semibold transition-colors cursor-pointer"
                onClick={() => setPaymentFailed(false)}
                type="button"
              >
                Đóng
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-sm font-bold transition-all shadow cursor-pointer"
                onClick={() => {
                  setPaymentFailed(false)
                  handleVerifyPayment()
                }}
                type="button"
              >
                Thử Thanh Toán Lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentGatewayPage
