import { DEFAULT_CART_ITEMS, CHECKOUT_ACCESSORIES } from '../../../mockData/customer/cart.js'
import { MOCK_VOUCHERS } from '../../../mockData/customer/vouchers.js'
import { useState, useRef, useEffect } from 'react'

export const CartCheckoutPage = ({
  cartItems,
  cartCount,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddToCart,
  onNavigate,
}) => {
  // Step state: 'cart' (Xem giỏ hàng bánh đã thêm) | 'checkout' (Điền thông tin giao nhận & thanh toán)
  const [activeStep, setActiveStep] = useState(() => {
    try {
      if (localStorage.getItem('sweetcake_direct_checkout') === 'true') {
        localStorage.removeItem('sweetcake_direct_checkout')
        return 'checkout'
      }
    } catch {}
    return 'cart'
  })

  useEffect(() => {
    try {
      if (localStorage.getItem('sweetcake_direct_checkout') === 'true') {
        localStorage.removeItem('sweetcake_direct_checkout')
        setActiveStep('checkout')
      }
    } catch {}
  }, [])

  // Default fallback items if cartItems is not passed
  const [localItems, setLocalItems] = useState([
    {
      id: 'pikachu-3d-2tier',
      title: 'Bánh Sinh Nhật Pikachu Tạo Hình 3D (2 Tầng)',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ',
      sizeSpec: '2 Tầng (20cm + 14cm) • 12 - 18 phần',
      flavor: 'Chiffon Vani Dâu Tây Hữu Cơ (ít ngọt 30%) + Kem whipping Pháp',
      bakery: 'La Crème Pâtisserie (Chef Jean-Luc)',
      price: 950000,
      quantity: 1,
    },
    {
      id: 'macarons-box-6',
      title: 'Hộp 6 Macarons Pháp Cao Cấp',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDQc3-sChlCzc2ggdfbTb-K34Fx0N8Nq1Yad9S6mpY8e2_TsT5AqG3bBjGsCzzyIIvH4XoZp8JZLjW3hFSfeyKQJvyNh_43DUUvnarGr-1Ly7npVePgmKU44Z9PPmTbqrwTMnEFmLOOdVBiHg6NpGMo0lWxwRxdNJGR0ezBbmYJr1X0nt56OD-NSwugzRwdOCR_XQkve6QCkxESWoZj4zPuKtJBro0jrLdJBbQ_JtGokzv53HveVvZj',
      sizeSpec: '6 vị thượng hạng Pháp',
      flavor: 'Pistachio, Raspberry, Dark Chocolate',
      bakery: 'La Crème Pâtisserie',
      price: 210000,
      quantity: 1,
    },
  ])

  // Active items list: prioritize cartItems from App.jsx
  const items = cartItems !== undefined ? cartItems : localItems

  // Item IDs that user unchecked (to keep in cart without paying)
  const [unselectedIds, setUnselectedIds] = useState([])

  const handleToggleSelect = (id) => {
    setUnselectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    )
  }

  const isAllSelected = items.length > 0 && items.every((it) => !unselectedIds.includes(it.id))

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all items currently in cart
      setUnselectedIds(items.map((it) => it.id))
    } else {
      // Select all items
      setUnselectedIds([])
    }
  }

  // Customer Form State
  const [customerName, setCustomerName] = useState('Nguyễn Mai Thảo Hân')
  const [customerPhone, setCustomerPhone] = useState('0918 234 567')
  const [customerEmail, setCustomerEmail] = useState('hanmai.sweetcake@example.com')
  const [customerAddress, setCustomerAddress] = useState(
    'Căn hộ 18.04, Tháp Opal, Saigon Pearl, 92 Nguyễn Hữu Cảnh'
  )
  const [customerDistrict, setCustomerDistrict] = useState(
    'Bình Thạnh, TP. Hồ Chí Minh'
  )
  const [deliveryNotes, setDeliveryNotes] = useState(
    'Gửi lễ tân sảnh Opal hoặc gọi trước 10 phút'
  )

  // Delivery & Schedule
  const [fulfillmentMethod, setFulfillmentMethod] = useState('delivery') // 'delivery' | 'pickup'
  const [selectedDate, setSelectedDate] = useState('saturday') // 'today' | 'tomorrow' | 'saturday' | 'custom'
  const [customDate, setCustomDate] = useState('2025-10-25')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('15:30 - 16:30')
  const [customTime, setCustomTime] = useState('15:30')
  const dateInputRef = useRef(null)

  // Custom Inscription & Card
  const [plaqueText, setPlaqueText] = useState('Happy 7th Birthday Minh Khang!')
  const [greetingCardText, setGreetingCardText] = useState(
    'Chúc bé Minh Khang (Han) sinh nhật 7 tuổi luôn vui tươi, thông minh, mạnh mẽ như chú chuột điện Pikachu!'
  )

  // Accessories Checklist
  const [accessories, setAccessories] = useState([
    {
      id: 'acc-gold-candle',
      name: 'Nến số mạ vàng hoàng gia',
      desc: 'Mạ vàng sang trọng (Chọn số: 7)',
      icon: 'looks_one',
      price: 0,
      checked: true,
      quantity: 1,
    },
    {
      id: 'acc-pastel-candle',
      name: 'Nến xoắn nghệ thuật pastel',
      desc: 'Bộ 6 cây nến tăm kem sữa thanh lịch',
      icon: 'local_fire_department',
      price: 0,
      checked: true,
      quantity: 1,
    },
    {
      id: 'acc-cake-knife',
      name: 'Dao cắt bánh chuyên dụng',
      desc: 'Răng cưa cao cấp cắt bánh láng mịn',
      icon: 'handyman',
      price: 0,
      checked: true,
      quantity: 1,
    },
    {
      id: 'acc-wooden-plates',
      name: 'Dĩa & thìa sinh học',
      desc: 'Bộ 10 set gỗ mộc thân thiện môi trường',
      icon: 'restaurant',
      price: 0,
      checked: true,
      quantity: 1,
    },
    {
      id: 'acc-card',
      name: 'Thiệp chúc mừng viết tay',
      desc: 'Viết tay theo nội dung lời chúc của bạn',
      icon: 'mail',
      price: 0,
      checked: true,
      quantity: 1,
    },
    {
      id: 'acc-fresh-flower',
      name: 'Hoa tươi trang trí bánh',
      desc: 'Bó hoa mini tone pastel tự nhiên',
      icon: 'local_florist',
      price: 45000,
      checked: false,
      quantity: 1,
    },
    {
      id: 'acc-balloons',
      name: 'Set bong bóng tiệc metallic',
      desc: 'Set bóng bay sinh nhật pastel kèm que cắm',
      icon: 'celebration',
      price: 35000,
      checked: false,
      quantity: 1,
      isWide: true,
    },
  ])

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('vietqr') // 'vietqr' | 'credit_card' | 'ewallet' | 'deposit_50'

  // Voucher & Discount System
  const [appliedVoucher, setAppliedVoucher] = useState(MOCK_VOUCHERS[0]) // default pre-applied SWEETCAKE50K
  const [voucherCodeInput, setVoucherCodeInput] = useState('')
  const [voucherError, setVoucherError] = useState('')
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)

  // Order Completion Modal
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false)
  const [orderNumber] = useState('ORD-2025-9982')

  // Item Quantity Handlers
  const handleItemQuantity = (id, delta) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(id, delta)
    } else {
      setLocalItems((prev) =>
        prev
          .map((item) =>
            item.id === id
              ? { ...item, quantity: item.quantity + delta }
              : item
          )
          .filter((item) => item.quantity > 0)
      )
    }
  }

  const handleRemove = (id) => {
    setUnselectedIds((prev) => prev.filter((itemId) => itemId !== id))
    if (onRemoveItem) {
      onRemoveItem(id)
    } else {
      setLocalItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const handleClear = () => {
    setUnselectedIds([])
    if (onClearCart) {
      onClearCart()
    } else {
      setLocalItems([])
    }
  }

  // Accessories Handlers
  const handleToggleAccessory = (id) => {
    setAccessories((prev) =>
      prev.map((acc) =>
        acc.id === id ? { ...acc, checked: !acc.checked } : acc
      )
    )
  }

  const handleAccessoryQuantity = (id, delta) => {
    setAccessories((prev) =>
      prev.map((acc) => {
        if (acc.id === id) {
          const nextQ = acc.quantity + delta
          return { ...acc, quantity: nextQ > 1 ? nextQ : 1 }
        }
        return acc
      })
    )
  }

  // Calculations
  const selectedItems = items.filter((item) => !unselectedIds.includes(item.id))
  const selectedItemCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0)
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  // Subtotal only calculates for SELECTED items!
  const subtotal = selectedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  )

  const accessoriesExtraTotal =
    selectedItems.length > 0
      ? accessories.reduce((acc, a) => {
          if (a.checked && a.price > 0) {
            return acc + a.price * a.quantity
          }
          return acc
        }, 0)
      : 0

  // Calculate Voucher Discount
  let discountAmount = 0
  if (appliedVoucher && selectedItems.length > 0) {
    if (subtotal >= (appliedVoucher.minOrderValue || 0)) {
      if (appliedVoucher.discountType === 'percent') {
        const raw = Math.round(subtotal * (appliedVoucher.discountValue / 100))
        discountAmount = Math.min(raw, appliedVoucher.maxDiscount || raw)
      } else {
        discountAmount = Math.min(appliedVoucher.discountValue, subtotal)
      }
    }
  }

  const grandTotal = Math.max(0, subtotal + accessoriesExtraTotal - discountAmount)

  const handleApplyVoucher = (voucherOrCode) => {
    setVoucherError('')
    let target = null
    if (typeof voucherOrCode === 'object' && voucherOrCode !== null) {
      target = voucherOrCode
    } else {
      const clean = (voucherOrCode || voucherCodeInput).trim().toUpperCase()
      target = MOCK_VOUCHERS.find((v) => v.code === clean)
    }

    if (!target) {
      setVoucherError('Mã giảm giá không tồn tại hoặc đã hết hạn!')
      return
    }

    if (subtotal < target.minOrderValue) {
      setVoucherError(
        `Mã ${target.code} chỉ áp dụng cho đơn từ ${target.minOrderValue.toLocaleString('vi-VN')}đ trở lên!`
      )
      return
    }

    setAppliedVoucher(target)
    setVoucherCodeInput('')
    setVoucherError('')
    setIsVoucherModalOpen(false)
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherError('')
  }

  const handleCheckoutSubmit = (e) => {
    e.preventDefault()
    if (selectedItems.length === 0) return
    if (onNavigate) {
      onNavigate('payment')
    }
    window.history.pushState(null, '', '/payment')
  }

  const goToCheckout = () => {
    if (selectedItems.length === 0) return
    setActiveStep('checkout')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToCart = () => {
    setActiveStep('cart')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="w-full bg-background min-h-[calc(100vh-20rem)] flex-1">
      <div className="flex flex-col w-full">
        {/* Top Hero Banner */}
        <div className="relative w-full overflow-hidden bg-surface-container-low py-8 sm:py-10 px-margin shadow-sm border-b border-outline-variant/20">
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-secondary-fixed/40 blur-3xl pointer-events-none"></div>
          <div className="absolute left-10 -bottom-16 w-80 h-80 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none"></div>
          
          <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div>
              {activeStep === 'checkout' && (
                <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                  <span className="material-symbols-outlined text-sm">local_shipping</span>
                  <span>Bước 2: Đặt hàng &amp; Thanh toán</span>
                </div>
              )}
              <h1 className="font-headline-lg text-primary text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2.5">
                {activeStep === 'cart' ? (
                  <>
                    <span className="material-symbols-outlined text-secondary text-3xl sm:text-4xl">
                      shopping_cart
                    </span>
                    <span>Giỏ Hàng Của Bạn</span>
                  </>
                ) : (
                  <span>Thông Tin Giao Hàng &amp; Thanh Toán</span>
                )}
              </h1>
              <p className="font-body-md text-on-surface-variant text-sm mt-1.5 max-w-xl">
                {activeStep === 'cart'
                  ? `Bạn đang có ${totalItemCount} món bánh trong giỏ hàng. Kiểm tra số lượng và tùy chọn trước khi đặt bánh.`
                  : 'Vui lòng xác nhận địa chỉ giao nhận, khung giờ bảo quản lạnh và phương thức thanh toán an toàn.'}
              </p>
            </div>

            {/* Interactive Stepper */}
            <div className="flex items-center gap-2 sm:gap-3 bg-surface p-2 sm:p-2.5 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.06)] border border-outline-variant/20">
              <button
                type="button"
                onClick={goToCart}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-label-md transition-all cursor-pointer ${
                  activeStep === 'cart'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-primary hover:bg-surface-container-low font-medium'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeStep === 'cart'
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-surface-container-high text-primary'
                  }`}
                >
                  1
                </span>
                <span>1. Giỏ Hàng ({totalItemCount})</span>
              </button>

              <span className="material-symbols-outlined text-outline-variant text-sm">
                arrow_forward
              </span>

              <button
                type="button"
                onClick={() => selectedItems.length > 0 && goToCheckout()}
                disabled={selectedItems.length === 0}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-label-md transition-all ${
                  activeStep === 'checkout'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : selectedItems.length > 0
                    ? 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low cursor-pointer font-medium'
                    : 'text-outline/50 cursor-not-allowed font-medium'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeStep === 'checkout'
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  2
                </span>
                <span>2. Giao Hàng &amp; Thanh Toán ({selectedItemCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: GIỎ HÀNG (SHOPPING CART VIEW)                                    */}
        {/* ========================================================================= */}
        {activeStep === 'cart' && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10 w-full animate-in fade-in duration-200">
            {items.length === 0 ? (
              /* Empty Cart State */
              <div className="bg-surface rounded-3xl p-12 sm:p-16 border border-outline-variant/30 text-center max-w-2xl mx-auto shadow-sm space-y-6">
                <div className="w-24 h-24 rounded-full bg-secondary-fixed/30 text-secondary flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-5xl">shopping_cart_off</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-md text-primary text-2xl font-bold">
                    Giỏ Hàng Của Bạn Đang Trống
                  </h2>
                  <p className="font-body-md text-on-surface-variant text-sm max-w-md mx-auto">
                    Hiện chưa có món bánh nào trong giỏ. Hãy dạo quanh thực đơn bánh nghệ thuật hoặc tự tạo bánh theo mẫu riêng nhé!
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('explore')}
                    className="px-6 py-3.5 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">cake</span>
                    <span>Khám Phá Menu Bánh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('ai-studio')}
                    className="px-6 py-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md font-semibold transition-all border border-outline-variant/30 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">brush</span>
                    <span>Thiết Kế Bánh Riêng</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Cart Items Grid */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT: Cakes in Cart (8 Cols) */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Cart Header Bar with Select All */}
                  <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          className="w-5 h-5 rounded accent-primary cursor-pointer"
                        />
                        <span className="font-label-md text-primary font-bold text-sm sm:text-base">
                          Chọn tất cả ({items.length} món)
                        </span>
                      </label>
                      <span className="text-xs text-secondary font-bold bg-secondary-fixed/30 px-3 py-1 rounded-full">
                        Đã chọn {selectedItems.length}/{items.length} món tính tiền ({selectedItemCount} bánh)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {selectedItems.length > 0 && selectedItems.length < items.length && (
                        <button
                          type="button"
                          onClick={() => setUnselectedIds(items.map((it) => it.id))}
                          className="text-xs text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-container cursor-pointer"
                        >
                          Bỏ chọn
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-xs text-on-surface-variant hover:text-error transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container cursor-pointer"
                        title="Xóa toàn bộ giỏ hàng"
                      >
                        <span className="material-symbols-outlined text-base">delete_sweep</span>
                        <span className="hidden sm:inline">Xóa toàn bộ</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Cart Items */}
                  <div className="space-y-4">
                    {items.map((item) => {
                      const isSelected = !unselectedIds.includes(item.id)
                      return (
                        <div
                          key={item.id}
                          className={`p-5 sm:p-6 rounded-2xl border transition-all flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center ${
                            isSelected
                              ? 'bg-surface border-secondary/50 shadow-xs hover:shadow-md'
                              : 'bg-surface-container-low/60 border-outline-variant/25 opacity-75'
                          }`}
                        >
                          {/* Item Selection Checkbox */}
                          <div className="flex items-center gap-2 sm:self-center shrink-0">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(item.id)}
                                className="w-5 h-5 rounded accent-primary cursor-pointer"
                              />
                            </label>
                          </div>

                          {/* Cake Thumbnail */}
                          <div className="relative shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-surface-container border border-outline-variant/20 shadow-inner">
                            <img
                              src={item.image}
                              alt={item.title}
                              className={`w-full h-full object-cover transition-transform duration-300 ${
                                isSelected ? 'group-hover:scale-105' : 'grayscale-[25%]'
                              }`}
                            />
                          </div>

                          {/* Cake Details */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {item.bakery && (
                                    <div className="flex items-center gap-1.5 text-xs text-secondary font-semibold">
                                      <span className="material-symbols-outlined text-xs">storefront</span>
                                      <span>{item.bakery}</span>
                                    </div>
                                  )}
                                  {isSelected ? (
                                    <span className="text-[11px] font-bold text-green-700 bg-green-100/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                      <span>Tính vào đơn</span>
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[13px]">bookmark</span>
                                      <span>Để lại giỏ (Không tính tiền)</span>
                                    </span>
                                  )}
                                </div>
                                <h3
                                  className={`font-headline-sm text-base sm:text-lg font-bold leading-snug ${
                                    isSelected ? 'text-primary' : 'text-on-surface-variant'
                                  }`}
                                >
                                  {item.title}
                                </h3>
                              </div>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemove(item.id)}
                                className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-lg hover:bg-surface-container-low cursor-pointer shrink-0"
                                title="Xóa món bánh này khỏi giỏ"
                              >
                                <span className="material-symbols-outlined text-xl">delete</span>
                              </button>
                            </div>

                            {/* Size & Spec Badges */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {item.sizeSpec && (
                                <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-primary font-medium border border-outline-variant/20">
                                  📏 {item.sizeSpec}
                                </span>
                              )}
                              {item.flavor && (
                                <span className="px-2.5 py-1 rounded-lg bg-primary-fixed-dim/20 text-primary font-medium border border-primary/10">
                                  🍓 {item.flavor}
                                </span>
                              )}
                            </div>

                            {/* Price & Quantity Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 mt-1 border-t border-outline-variant/15">
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-on-surface-variant">Đơn giá:</span>
                                <span className="font-label-md text-on-surface font-semibold text-sm">
                                  {item.price.toLocaleString('vi-VN')}đ
                                </span>
                              </div>

                              <div className="flex items-center gap-4">
                                {/* Quantity Stepper */}
                                <div className="flex items-center bg-surface-container-low rounded-xl border border-outline-variant/30 p-1 shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => handleItemQuantity(item.id, -1)}
                                    className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-container text-on-surface font-bold text-sm flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                                    title="Giảm số lượng"
                                  >
                                    −
                                  </button>
                                  <span className="w-10 text-center font-label-md text-primary font-bold text-sm">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleItemQuantity(item.id, 1)}
                                    className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-container text-on-surface font-bold text-sm flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                                    title="Tăng số lượng"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Item Subtotal */}
                                <div className="text-right min-w-[120px]">
                                  <span className="text-[11px] text-on-surface-variant block">Thành tiền:</span>
                                  <span
                                    className={`font-headline-sm font-bold text-base sm:text-lg block ${
                                      isSelected
                                        ? 'text-secondary'
                                        : 'text-on-surface-variant line-through'
                                    }`}
                                  >
                                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                  </span>
                                  {!isSelected && (
                                    <span className="text-[10px] text-on-surface-variant italic">
                                      (Không tính vào tổng)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Included Birthday Accessories & Options in Cart */}
                  <div className="bg-surface p-6 sm:p-7 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-xl">celebration</span>
                        <h3 className="font-headline-sm text-primary font-bold text-base sm:text-lg">
                          Phụ Kiện Đi Kèm &amp; Trang Trí Thêm
                        </h3>
                      </div>
                      <span className="text-xs text-secondary font-semibold">Tặng kèm miễn phí các dụng cụ cơ bản</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {accessories.map((acc) => (
                        <div
                          key={acc.id}
                          className={`p-3.5 rounded-xl flex items-start gap-3 transition-all border ${
                            acc.isWide ? 'md:col-span-2' : ''
                          } ${
                            acc.checked
                              ? 'bg-primary-fixed-dim/20 border-secondary/40 shadow-xs'
                              : 'bg-surface-container-low hover:bg-surface-container border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={acc.checked}
                            onChange={() => handleToggleAccessory(acc.id)}
                            className="mt-1 accent-primary w-4 h-4 rounded cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-label-md text-primary font-semibold text-sm flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-secondary text-sm">
                                  {acc.icon}
                                </span>
                                {acc.name}
                              </span>
                              <span
                                className={`font-label-sm font-bold text-xs ${
                                  acc.price === 0 ? 'text-secondary' : 'text-primary'
                                }`}
                              >
                                {acc.price === 0
                                  ? 'Miễn phí'
                                  : `+${(acc.price * acc.quantity).toLocaleString('vi-VN')}đ`}
                              </span>
                            </div>
                            <p className="text-xs text-on-surface-variant mt-0.5">{acc.desc}</p>
                            {acc.price > 0 && acc.checked && (
                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-outline-variant/20">
                                <span className="text-[11px] text-on-surface-variant">Số lượng set:</span>
                                <div className="flex items-center gap-2 bg-surface px-2 py-0.5 rounded-md border border-outline-variant/30">
                                  <button
                                    type="button"
                                    onClick={() => handleAccessoryQuantity(acc.id, -1)}
                                    className="text-on-surface-variant hover:text-primary text-xs font-bold px-1 cursor-pointer"
                                  >
                                    −
                                  </button>
                                  <span className="font-label-sm text-primary font-semibold text-xs">
                                    {acc.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAccessoryQuantity(acc.id, 1)}
                                    className="text-on-surface-variant hover:text-primary text-xs font-bold px-1 cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>


                </div>

                {/* RIGHT: Cart Summary & Checkout CTA (4 Cols Sticky) */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
                  <div className="bg-surface p-6 sm:p-7 rounded-3xl shadow-[0_16px_36px_-6px_rgba(45,30,24,0.08)] border border-outline-variant/30 space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                      <h3 className="font-headline-sm text-primary font-bold text-lg">
                        Tóm Tắt Đơn Hàng
                      </h3>
                      <span className="font-label-sm text-secondary font-bold bg-secondary-fixed/40 px-2.5 py-0.5 rounded-full text-xs">
                        {selectedItemCount} món chọn mua
                      </span>
                    </div>

                    {selectedItems.length === 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                        <span className="material-symbols-outlined text-base text-amber-600 shrink-0 mt-0.5">info</span>
                        <div>
                          <p className="font-bold">Chưa chọn món nào để tính tiền</p>
                          <p className="text-[11px] text-amber-800 mt-0.5">Vui lòng tick chọn ít nhất 1 món bánh bên trái để tiến hành đặt bánh.</p>
                        </div>
                      </div>
                    )}

                    {/* Cost Breakdown */}
                    <div className="space-y-3 text-xs sm:text-sm text-on-surface">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Tạm tính ({selectedItemCount} bánh đã chọn):</span>
                        <span className="font-semibold">{subtotal.toLocaleString('vi-VN')}đ</span>
                      </div>

                      {accessoriesExtraTotal > 0 && (
                        <div className="flex justify-between text-primary">
                          <span>Phụ kiện trang trí thêm:</span>
                          <span className="font-semibold">+{accessoriesExtraTotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <span>Vận chuyển lạnh chuyên dụng:</span>
                          <span
                            className="material-symbols-outlined text-xs text-on-surface-variant cursor-help"
                            title="Thùng lạnh kiểm soát 4-8°C chống xô vỡ"
                          >
                            info
                          </span>
                        </span>
                        <div className="text-right">
                          <span className="line-through text-on-surface-variant text-xs mr-1">30.000đ</span>
                          <span className="text-secondary font-bold">Miễn phí</span>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Bộ nến, dao cắt &amp; dĩa ăn:</span>
                        <span className="text-secondary font-bold">Miễn phí</span>
                      </div>

                      {/* VOUCHER & GIẢM GIÁ SECTION */}
                      <div className="pt-3 border-t border-outline-variant/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-primary flex items-center gap-1">
                            <span className="material-symbols-outlined text-secondary text-sm">confirmation_number</span>
                            Mã Giảm Giá &amp; Voucher:
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsVoucherModalOpen(true)}
                            className="text-xs text-secondary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Chọn từ Kho Voucher</span>
                            <span className="material-symbols-outlined text-xs">chevron_right</span>
                          </button>
                        </div>

                        {appliedVoucher ? (
                          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                                %
                              </span>
                              <div>
                                <p className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                                  <span>{appliedVoucher.code}</span>
                                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">
                                    {appliedVoucher.title}
                                  </span>
                                </p>
                                <p className="text-[11px] text-emerald-800">
                                  Giảm {discountAmount.toLocaleString('vi-VN')}đ
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveVoucher}
                              className="text-emerald-700 hover:text-red-600 text-xs font-bold p-1 cursor-pointer"
                              title="Bỏ voucher này"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={voucherCodeInput}
                              onChange={(e) => {
                                setVoucherCodeInput(e.target.value)
                                setVoucherError('')
                              }}
                              placeholder="Nhập mã SWEETCAKE50K..."
                              className="flex-1 px-3 py-2 text-xs rounded-xl bg-surface-container-lowest border border-outline-variant/30 uppercase font-mono text-primary"
                            />
                            <button
                              type="button"
                              onClick={() => handleApplyVoucher()}
                              className="px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-secondary transition-colors cursor-pointer"
                            >
                              Áp dụng
                            </button>
                          </div>
                        )}

                        {voucherError && (
                          <p className="text-[11px] text-red-600 font-semibold">{voucherError}</p>
                        )}

                        {discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-700 font-bold text-xs">
                            <span>Số tiền giảm giá (Voucher):</span>
                            <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                          </div>
                        )}
                      </div>

                      {/* Total Box */}
                      <div className="pt-4 mt-3 flex justify-between items-baseline bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                        <div>
                          <span className="font-headline-sm text-primary block text-base sm:text-lg font-bold">
                            Tổng thanh toán
                          </span>
                          <span className="text-[11px] text-on-surface-variant block mt-0.5">
                            {selectedItems.length > 0
                              ? `Đã tính ${selectedItems.length} món bánh đã chọn`
                              : 'Chưa có món nào được chọn'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-headline-md text-primary font-bold text-xl sm:text-2xl block text-secondary">
                            {grandTotal.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Master CTA to Proceed to Step 2: Checkout & Delivery */}
                    <div className="space-y-3 pt-2">
                      <button
                        type="button"
                        onClick={goToCheckout}
                        disabled={selectedItems.length === 0}
                        className={`w-full py-4 px-6 rounded-2xl font-label-lg text-base font-bold flex items-center justify-center gap-2 shadow-[0_12px_28px_-4px_rgba(45,30,24,0.18)] transition-all ${
                          selectedItems.length > 0
                            ? 'bg-primary-container text-primary-fixed hover:bg-secondary hover:text-on-secondary cursor-pointer'
                            : 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed shadow-none'
                        }`}
                      >
                        <span>
                          {selectedItems.length > 0
                            ? `Tiến Hành Đặt Bánh (${selectedItemCount} món)`
                            : 'Vui Lòng Chọn Món Để Đặt'}
                        </span>
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('explore')}
                        className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-primary hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        <span>Chọn thêm các mẫu bánh khác</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: GIAO HÀNG & THANH TOÁN (CHECKOUT & INVOICE DETAILS)              */}
        {/* ========================================================================= */}
        {activeStep === 'checkout' && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10 w-full animate-in fade-in duration-200">
            {/* Back to Cart Bar */}
            <div className="mb-6">
              <button
                type="button"
                onClick={goToCart}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-secondary bg-surface px-4 py-2.5 rounded-xl border border-outline-variant/30 shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                <span>← Quay lại xem giỏ hàng ({totalItemCount} bánh)</span>
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: Form & Logistics (7 Cols) */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Section 1: Customer Contact & Delivery Address */}
                  <div className="bg-surface p-7 sm:p-8 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] space-y-6 border border-outline-variant/30">
                    <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
                      <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md font-bold text-sm">
                        1
                      </span>
                      <div>
                        <h2 className="font-headline-sm text-primary text-lg sm:text-xl font-bold">
                          Thông Tin Người Nhận &amp; Địa Chỉ Giao Bánh
                        </h2>
                        <p className="text-xs text-on-surface-variant">Bánh được giao bảo quản lạnh tận tay người nhận</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-label-md text-on-surface font-semibold text-xs sm:text-sm">
                          Họ và tên người nhận *
                        </label>
                        <input
                          className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/30 text-sm"
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Mai Thảo Hân"
                          required
                          type="text"
                          value={customerName}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-label-md text-on-surface font-semibold text-xs sm:text-sm">
                          Số điện thoại liên hệ *
                        </label>
                        <input
                          className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/30 text-sm"
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="0918 xxx xxx"
                          required
                          type="tel"
                          value={customerPhone}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-label-md text-on-surface font-semibold text-xs sm:text-sm">
                        Email nhận xác nhận đơn hàng
                      </label>
                      <input
                        className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/30 text-sm"
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="email@example.com"
                        type="email"
                        value={customerEmail}
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-4">
                        <label className="font-label-md text-on-surface font-semibold text-xs sm:text-sm">
                          Hình thức nhận bánh:
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                            <input
                              type="radio"
                              name="fulfillment"
                              checked={fulfillmentMethod === 'delivery'}
                              onChange={() => setFulfillmentMethod('delivery')}
                              className="accent-primary"
                            />
                            <span>Giao tận nơi bằng xe lạnh</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                            <input
                              type="radio"
                              name="fulfillment"
                              checked={fulfillmentMethod === 'pickup'}
                              onChange={() => setFulfillmentMethod('pickup')}
                              className="accent-primary"
                            />
                            <span>Tự đến lấy tại xưởng bánh</span>
                          </label>
                        </div>
                      </div>

                      {fulfillmentMethod === 'delivery' ? (
                        <>
                          <div className="space-y-1.5">
                            <label className="font-label-md text-on-surface font-semibold text-xs sm:text-sm">
                              Địa chỉ chi tiết (Số nhà, Tên đường, Tòa nhà/Căn hộ) *
                            </label>
                            <input
                              className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/30 text-sm"
                              onChange={(e) => setCustomerAddress(e.target.value)}
                              placeholder="Ví dụ: Căn hộ 18.04, Tháp Opal, Saigon Pearl"
                              required
                              type="text"
                              value={customerAddress}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-label-md text-on-surface font-semibold text-xs sm:text-sm">
                              Quận / Huyện, Tỉnh / Thành phố *
                            </label>
                            <input
                              className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/30 text-sm"
                              onChange={(e) => setCustomerDistrict(e.target.value)}
                              placeholder="Ví dụ: Quận Bình Thạnh, TP. Hồ Chí Minh"
                              required
                              type="text"
                              value={customerDistrict}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-primary space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-secondary text-base">store</span>
                            Địa điểm nhận bánh trực tiếp:
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            Xưởng bánh SweetCake Artisan: 92 Nguyễn Hữu Cảnh, P.22, Q. Bình Thạnh, TP.HCM
                          </p>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="font-label-md text-on-surface font-semibold text-xs sm:text-sm">
                          Ghi chú giao nhận đặc biệt
                        </label>
                        <input
                          className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/30 text-sm"
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          placeholder="Ví dụ: Gửi lễ tân sảnh Opal hoặc gọi trước 10 phút"
                          type="text"
                          value={deliveryNotes}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Delivery Date & Exact Timeslot */}
                  <div className="bg-surface p-7 sm:p-8 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] space-y-6 border border-outline-variant/30">
                    <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
                      <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md font-bold text-sm">
                        2
                      </span>
                      <div>
                        <h2 className="font-headline-sm text-primary text-lg sm:text-xl font-bold">
                          Thời Gian Giao Nhận &amp; Lịch Trình Tiệc
                        </h2>
                        <p className="text-xs text-on-surface-variant">Chọn ngày &amp; khung giờ bạn mong muốn nhận bánh</p>
                      </div>
                    </div>

                    {/* Date Selector Buttons */}
                    <div className="space-y-2">
                      <label className="font-label-md text-on-surface font-semibold text-xs sm:text-sm">
                        Ngày nhận bánh:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { key: 'today', label: 'Hôm nay', sub: 'Giao gấp trong ngày' },
                          { key: 'tomorrow', label: 'Ngày mai', sub: 'Khuyên dùng' },
                          { key: 'saturday', label: 'Thứ Bảy', sub: 'Tiệc cuối tuần' },
                        ].map((d) => (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => setSelectedDate(d.key)}
                            className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
                              selectedDate === d.key
                                ? 'bg-primary text-on-primary border-primary shadow-sm'
                                : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/20 text-primary'
                            }`}
                          >
                            <p className="font-bold text-sm">{d.label}</p>
                            <p className={`text-[11px] ${selectedDate === d.key ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                              {d.sub}
                            </p>
                          </button>
                        ))}

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate('custom')
                              if (dateInputRef.current) dateInputRef.current.showPicker?.()
                            }}
                            className={`w-full h-full p-3 rounded-xl text-left transition-all border cursor-pointer ${
                              selectedDate === 'custom'
                                ? 'bg-primary text-on-primary border-primary shadow-sm'
                                : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/20 text-primary'
                            }`}
                          >
                            <p className="font-bold text-sm">
                              {selectedDate === 'custom' && customDate ? customDate : 'Chọn ngày khác'}
                            </p>
                            <p className={`text-[11px] ${selectedDate === 'custom' ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                              Mở lịch chọn
                            </p>
                          </button>
                          <input
                            ref={dateInputRef}
                            type="date"
                            value={customDate}
                            onChange={(e) => {
                              if (e.target.value) {
                                setCustomDate(e.target.value)
                                setSelectedDate('custom')
                              }
                            }}
                            className="absolute inset-0 opacity-0 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Time Slot Radio Buttons */}
                    <div className="space-y-2">
                      <label className="font-label-md text-on-surface font-semibold text-xs sm:text-sm">
                        Khung giờ giao nhận chính xác:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { slot: '09:00 - 10:30', desc: 'Khung sáng tinh khôi' },
                          { slot: '14:00 - 15:30', desc: 'Tiệc sinh nhật chiều' },
                          { slot: '18:00 - 19:30', desc: 'Tiệc tối gia đình' },
                        ].map((t) => (
                          <label
                            key={t.slot}
                            className={`p-3.5 rounded-xl cursor-pointer flex items-center gap-3 transition-all border ${
                              selectedTimeSlot === t.slot
                                ? 'bg-primary text-on-primary border-secondary shadow-sm'
                                : 'bg-surface-container-low hover:bg-surface-container border-transparent text-primary'
                            }`}
                          >
                            <input
                              type="radio"
                              name="timeslot"
                              checked={selectedTimeSlot === t.slot}
                              onChange={() => setSelectedTimeSlot(t.slot)}
                              className="accent-secondary w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <div className="font-label-md font-semibold text-sm">{t.slot}</div>
                              <div className={`text-[11px] ${selectedTimeSlot === t.slot ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                                {t.desc}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Chocolate Plaque & Handwritten Card */}
                  <div className="bg-surface p-7 sm:p-8 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] space-y-6 border border-outline-variant/30">
                    <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
                      <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md font-bold text-sm">
                        3
                      </span>
                      <div>
                        <h2 className="font-headline-sm text-primary text-lg sm:text-xl font-bold">
                          Nội Dung Bảng Socola &amp; Lời Chúc Nghệ Thuật
                        </h2>
                        <p className="text-xs text-on-surface-variant">Miễn phí đính kèm trên mọi ổ bánh đặt qua SweetCake</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-label-md text-on-surface font-semibold text-xs sm:text-sm flex items-center justify-between">
                        <span>Chữ viết trên bảng socola (Tối đa 35 ký tự):</span>
                        <span className="text-secondary font-bold text-xs">Miễn phí</span>
                      </label>
                      <input
                        className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/30 text-sm"
                        maxLength={40}
                        onChange={(e) => setPlaqueText(e.target.value)}
                        placeholder="Ví dụ: Happy 7th Birthday Minh Khang!"
                        type="text"
                        value={plaqueText}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-label-md text-on-surface font-semibold text-xs sm:text-sm flex items-center justify-between">
                        <span>Lời chúc viết tay thiệp nghệ thuật:</span>
                        <span className="text-secondary font-bold text-xs">Miễn phí</span>
                      </label>
                      <textarea
                        className="w-full bg-surface-container-lowest text-on-surface font-body-md p-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all resize-none border border-outline-variant/30 text-sm"
                        onChange={(e) => setGreetingCardText(e.target.value)}
                        placeholder="Viết lời chúc yêu thương gửi đến người nhận..."
                        rows="3"
                        value={greetingCardText}
                      ></textarea>
                    </div>
                  </div>

                  {/* Section 4: Secure Payment Methods */}
                  <div className="bg-surface p-7 sm:p-8 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] space-y-6 border border-outline-variant/30">
                    <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
                      <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md font-bold text-sm">
                        4
                      </span>
                      <div>
                        <h2 className="font-headline-sm text-primary text-lg sm:text-xl font-bold">
                          Phương Thức Thanh Toán An Toàn
                        </h2>
                        <p className="text-xs text-on-surface-variant">Bảo mật giao dịch bằng hệ sinh thái Escrow Vault</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          key: 'vietqr',
                          title: 'Chuyển khoản VietQR siêu tốc 24/7',
                          sub: 'Quét mã QR tự động điền số tiền và mã đơn hàng',
                          icon: 'qr_code_scanner',
                        },
                        {
                          key: 'credit_card',
                          title: 'Thẻ thanh toán quốc tế (Visa, Mastercard, JCB)',
                          sub: 'Xử lý qua cổng thanh toán mã hóa 256-bit',
                          icon: 'credit_card',
                        },
                        {
                          key: 'ewallet',
                          title: 'Ví điện tử MoMo / ZaloPay / ShopeePay',
                          sub: 'Thanh toán tiện lợi 1-chạm',
                          icon: 'account_balance_wallet',
                        },
                        {
                          key: 'deposit_50',
                          title: 'Đặt cọc 50% trước (Còn lại thanh toán khi nhận bánh)',
                          sub: 'Áp dụng cho đơn hàng nội thành giao tận nơi',
                          icon: 'payments',
                        },
                      ].map((pm) => (
                        <label
                          key={pm.key}
                          className={`block p-4 rounded-xl cursor-pointer transition-all border ${
                            paymentMethod === pm.key
                              ? 'bg-primary-fixed-dim/20 border-secondary'
                              : 'bg-surface-container-low hover:bg-surface-container border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="payment_method"
                                checked={paymentMethod === pm.key}
                                onChange={() => setPaymentMethod(pm.key)}
                                className="accent-primary w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <span className="font-label-lg text-primary font-semibold text-sm">
                                  {pm.title}
                                </span>
                                <p className="text-[11px] text-on-surface-variant mt-0.5">{pm.sub}</p>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-xl text-on-surface-variant">
                              {pm.icon}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Order Summary & Review in Checkout Step (5 Cols Sticky) */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
                  <div className="bg-surface p-7 rounded-3xl shadow-[0_16px_36px_-6px_rgba(45,30,24,0.08)] space-y-6 border border-outline-variant/30">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                      <h3 className="font-headline-sm text-primary font-bold text-lg">
                        Túi Bánh Đặt Hàng
                      </h3>
                      <button
                        type="button"
                        onClick={goToCart}
                        className="text-xs text-secondary font-bold hover:underline cursor-pointer"
                      >
                        Sửa ({selectedItems.length} món đã chọn)
                      </button>
                    </div>

                    {/* Compact Item List */}
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {selectedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 items-center"
                        >
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-label-md text-primary font-bold text-xs truncate">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-on-surface-variant">{item.sizeSpec}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[11px] text-on-surface-variant font-medium">
                                SL: {item.quantity}
                              </span>
                              <span className="text-xs font-bold text-secondary">
                                {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2.5 pt-3 font-body-sm text-on-surface border-t border-outline-variant/20 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Tạm tính ({selectedItemCount} bánh đã chọn):</span>
                        <span className="font-medium">{subtotal.toLocaleString('vi-VN')}đ</span>
                      </div>

                      {accessoriesExtraTotal > 0 && (
                        <div className="flex justify-between text-primary font-medium">
                          <span>Phụ kiện trang trí:</span>
                          <span className="font-bold">+{accessoriesExtraTotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Vận chuyển xe lạnh:</span>
                        <span className="text-secondary font-bold">Miễn phí</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Thiệp &amp; Bảng socola:</span>
                        <span className="text-secondary font-bold">Miễn phí</span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">confirmation_number</span>
                            Voucher giảm giá ({appliedVoucher?.code}):
                          </span>
                          <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}

                      <div className="pt-4 mt-2 flex justify-between items-baseline bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                        <div>
                          <span className="font-headline-sm text-primary block leading-none font-bold text-base">
                            Tổng thanh toán
                          </span>
                          <span className="font-body-sm text-[11px] text-on-surface-variant">
                            Đã bao gồm VAT &amp; bảo hiểm
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-headline-md text-secondary font-bold block leading-none text-xl sm:text-2xl">
                            {grandTotal.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Shop Reputation & Escrow Trust Protection Card */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5 text-xs text-amber-950">
                      <div className="flex items-center justify-between font-bold border-b border-amber-200/60 pb-2 text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-700 text-sm">verified_user</span>
                          Tiệm Bánh Uy Tín &amp; SweetCake Escrow 100%
                        </span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">
                          5.0★ Verified
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <p className="flex items-center gap-2">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span><strong>Bảo chứng cọc SweetCake Escrow:</strong> Tiền tạm giữ an toàn, nghiệm thu bánh mới giải ngân cho xưởng.</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span><strong>Vận chuyển thùng lạnh 4-6°C:</strong> Đổi mới 100% hoặc hoàn tiền nếu bánh bị xô vỡ.</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span><strong>Nguyên liệu cao cấp:</strong> 100% Bơ Pháp Elle &amp; Vire, Socola Valrhona, trái cây VietGAP.</span>
                        </p>
                      </div>
                    </div>

                    {/* Master Action CTA */}
                    <div className="space-y-2 pt-2">
                      <button
                        type="submit"
                        disabled={selectedItems.length === 0}
                        className="w-full bg-primary-container text-primary-fixed hover:bg-secondary hover:text-on-secondary py-4 px-6 rounded-xl font-label-lg text-base font-bold flex items-center justify-center gap-2 shadow-[0_16px_36px_-6px_rgba(45,30,24,0.18)] transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xl">task_alt</span>
                        <span>Xác Nhận &amp; Đặt Bánh Ngay</span>
                      </button>

                      <button
                        type="button"
                        onClick={goToCart}
                        className="w-full py-2.5 text-xs text-on-surface-variant hover:text-primary text-center font-medium cursor-pointer"
                      >
                        ← Thay đổi số lượng món trong giỏ hàng
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* KHO VOUCHER MODAL */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/30 space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">confirmation_number</span>
                <h3 className="font-headline-sm text-primary font-bold text-lg">Kho Voucher SweetCake</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Input Manual Code */}
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherCodeInput}
                onChange={(e) => {
                  setVoucherCodeInput(e.target.value)
                  setVoucherError('')
                }}
                placeholder="Nhập mã voucher (vd: SWEETCAKE50K)"
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-surface-container-lowest border border-outline-variant/40 uppercase font-mono text-primary focus:border-secondary outline-none"
              />
              <button
                type="button"
                onClick={() => handleApplyVoucher()}
                className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-secondary transition-colors cursor-pointer"
              >
                Áp dụng
              </button>
            </div>

            {voucherError && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-200">
                {voucherError}
              </p>
            )}

            {/* Voucher List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {MOCK_VOUCHERS.map((v) => {
                const isSelected = appliedVoucher?.code === v.code
                const isEligible = subtotal >= v.minOrderValue

                return (
                  <div
                    key={v.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-sm'
                        : isEligible
                        ? 'bg-surface-container-lowest border-outline-variant/30 hover:border-secondary/50'
                        : 'bg-surface-container-low border-outline-variant/20 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-primary bg-secondary-fixed/40 px-2 py-0.5 rounded text-secondary">
                            {v.code}
                          </span>
                          <span className="text-xs font-bold text-primary">{v.title}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1.5">{v.desc}</p>
                        <p className="text-[11px] text-outline mt-1">
                          Đơn tối thiểu: <strong>{v.minOrderValue.toLocaleString('vi-VN')}đ</strong> • HSD: {v.expires}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!isEligible}
                        onClick={() => handleApplyVoucher(v)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : isEligible
                            ? 'bg-primary hover:bg-secondary text-on-primary'
                            : 'bg-outline-variant/40 text-on-surface-variant cursor-not-allowed'
                        }`}
                      >
                        {isSelected ? 'Đang dùng' : isEligible ? 'Dùng ngay' : 'Chưa đủ ĐK'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Order Placement Success & VietQR Confirmation */}
      {isOrderSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-outline-variant/30 text-center relative">
            <button
              type="button"
              onClick={() => setIsOrderSuccessModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>

            <div>
              <span className="font-label-sm uppercase tracking-wider text-secondary font-bold">
                Đặt Bánh Thành Công
              </span>
              <h3 className="font-headline-sm text-primary text-2xl mt-1">
                Đơn Hàng #{orderNumber}
              </h3>
            </div>

            {/* QR Payment Box if VietQR */}
            {paymentMethod === 'vietqr' && (
              <div className="p-4 rounded-2xl bg-surface-container-low space-y-3 text-center border border-outline-variant/20">
                <p className="text-xs font-semibold text-primary">
                  Quét mã VietQR chuyển khoản nhanh:
                </p>
                <div className="w-44 h-44 mx-auto bg-white p-2 rounded-xl shadow-md flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary">
                    qr_code_2
                  </span>
                  <span className="text-[10px] font-mono text-outline mt-1">
                    VCB 9901888999
                  </span>
                </div>
                <div className="text-xs space-y-1 text-on-surface-variant">
                  <p>
                    Số tiền: <strong className="text-secondary">{grandTotal.toLocaleString('vi-VN')}đ</strong>
                  </p>
                  <p>
                    Nội dung: <strong className="text-primary font-mono">{orderNumber} {customerPhone}</strong>
                  </p>
                </div>
              </div>
            )}

            <div className="p-3 bg-surface-container rounded-xl text-xs text-on-surface-variant text-left space-y-1">
              <p>
                🎂 <strong>Bánh đã đặt ({selectedItems.length} món):</strong>{' '}
                {selectedItems.map((it) => `${it.title} (x${it.quantity})`).join(', ')}
              </p>
              <p>
                🕒 <strong>Lịch giao:</strong>{' '}
                {selectedTimeSlot} (
                {selectedDate === 'today'
                  ? 'Hôm nay'
                  : selectedDate === 'tomorrow'
                  ? 'Ngày mai'
                  : selectedDate === 'saturday'
                  ? 'Thứ Bảy'
                  : customDate}
                )
              </p>
              <p>
                📍 <strong>Địa chỉ:</strong> {customerAddress}, {customerDistrict}
              </p>
              <p>
                💌 <strong>Bảng socola:</strong> "{plaqueText}"
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsOrderSuccessModalOpen(false)
                  onNavigate && onNavigate('payment')
                }}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md text-sm font-bold transition-all shadow cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                <span>Vào Cổng Thanh Toán QR (#{orderNumber})</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOrderSuccessModalOpen(false)
                    onNavigate && onNavigate('home')
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-xs font-semibold transition-colors cursor-pointer"
                >
                  Về Trang Chủ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOrderSuccessModalOpen(false)
                    onNavigate && onNavigate('tracking')
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-xs font-semibold transition-colors cursor-pointer"
                >
                  Theo Dõi Đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartCheckoutPage
