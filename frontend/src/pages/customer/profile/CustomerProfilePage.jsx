import { DEFAULT_PAST_ORDERS } from '../../../mockData/customer/orders.js'
import { DEFAULT_CUSTOMER_PROFILE, DEFAULT_SAVED_ADDRESSES } from '../../../mockData/shared/users.js'
import { DEFAULT_PROFILE_CHEF_MESSAGES } from '../../../mockData/shared/conversations.js'
import { useState, useEffect } from 'react'

export const CustomerProfilePage = ({ onNavigate, onAddToCart }) => {
  // Navigation tabs in left sidebar
  const [activeSideTab, setActiveSideTab] = useState('orders') // 'orders' | 'addresses' | 'security'

  // Order filter tab in right column
  const [orderFilter, setOrderFilter] = useState('delivering') // 'delivering' | 'completed' | 'bespoke'

  // Read active RFQ and accepted bid from localStorage
  const [acceptedBid] = useState(() => {
    try {
      const saved = localStorage.getItem('sweetcake_accepted_bid')
      if (saved) return JSON.parse(saved)
    } catch {}
    return null
  })

  const [activeRfq] = useState(() => {
    try {
      const saved = localStorage.getItem('sweetcake_active_rfq')
      if (saved) return JSON.parse(saved)
    } catch {}
    return null
  })

  const currentOrderId =
    acceptedBid?.orderCode ||
    localStorage.getItem('sweetcake_active_order_code') ||
    '#ORD-2025-9982'

  const currentBakery = acceptedBid?.name || 'Sweet Bakery Studio'
  const currentTitle =
    acceptedBid?.title ||
    activeRfq?.title ||
    'Bánh Sinh Nhật Pikachu Tạo Hình 3D (2 Tầng)'
  const currentPrice = acceptedBid?.price || activeRfq?.budget || 950000
  const currentImage =
    acceptedBid?.image ||
    activeRfq?.image ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ'
  const currentSize =
    acceptedBid?.selectedSize || activeRfq?.selectedSize || '2 Tầng (20cm + 14cm)'

  const [deliveryStatus, setDeliveryStatus] = useState(() => {
    try {
      return localStorage.getItem('sweetcake_delivery_status') || 'DELIVERING'
    } catch {
      return 'DELIVERING'
    }
  })

  // Dynamic completed orders loaded from localStorage
  const [completedOrders, setCompletedOrders] = useState(() => {
    const defaultPast = DEFAULT_PAST_ORDERS
    try {
      const saved = localStorage.getItem('sweetcake_completed_orders')
      if (saved) {
        const parsed = JSON.parse(saved)
        const combined = [...parsed]
        defaultPast.forEach((def) => {
          if (!combined.some((c) => c.id === def.id)) {
            combined.push(def)
          }
        })
        return combined
      }
    } catch {}
    return defaultPast
  })

  // User Profile State
  const [userProfile, setUserProfile] = useState(DEFAULT_CUSTOMER_PROFILE)

  // Saved Addresses
  const [addresses, setAddresses] = useState(DEFAULT_SAVED_ADDRESSES)

  // Modals
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isChefChatModalOpen, setIsChefChatModalOpen] = useState(false)
  const [toastFeedback, setToastFeedback] = useState(null)

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Account Notification Toggles
  const [notifySms, setNotifySms] = useState(true)
  const [notifyZalo, setNotifyZalo] = useState(true)
  const [autoSaveAddress, setAutoSaveAddress] = useState(true)

  // Edit Profile Form State
  const [editName, setEditName] = useState(userProfile.fullName)
  const [editEmail, setEditEmail] = useState(userProfile.email)
  const [editPhone, setEditPhone] = useState(userProfile.phone)

  // New Address Form State
  const [newAddrTitle, setNewAddrTitle] = useState('')
  const [newAddrPhone, setNewAddrPhone] = useState('')
  const [newAddrDetails, setNewAddrDetails] = useState('')

  // Chef Chat
  const [chefMessages, setChefMessages] = useState(DEFAULT_PROFILE_CHEF_MESSAGES)
  const [chatInput, setChatInput] = useState('')

  const showNotification = (msg) => {
    setToastFeedback(msg)
    setTimeout(() => setToastFeedback(null), 3500)
  }

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault()
    setPasswordError('')
    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    showNotification('Đã cập nhật mật khẩu mới thành công!')
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    setUserProfile((prev) => ({
      ...prev,
      name: editName.split(' ').slice(-2).join(' ') || editName,
      fullName: editName,
      email: editEmail,
      phone: editPhone,
    }))
    setIsEditProfileModalOpen(false)
    showNotification('Đã cập nhật thông tin hồ sơ thành công!')
  }

  const handleAddAddress = (e) => {
    e.preventDefault()
    if (!newAddrTitle || !newAddrDetails) return
    setAddresses((prev) => [
      ...prev,
      {
        id: `addr-${Date.now()}`,
        title: newAddrTitle,
        phone: newAddrPhone || userProfile.phone,
        address: newAddrDetails,
        isDefault: false,
      },
    ])
    setNewAddrTitle('')
    setNewAddrPhone('')
    setNewAddrDetails('')
    setIsAddAddressModalOpen(false)
    showNotification('Đã lưu địa chỉ nhận bánh mới vào sổ địa chỉ!')
  }

  const handleSendChefMessage = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`

    setChefMessages((prev) => [
      ...prev,
      { sender: 'user', text: chatInput.trim(), time: timeStr },
    ])
    setChatInput('')

    setTimeout(() => {
      setChefMessages((prev) => [
        ...prev,
        {
          sender: 'chef',
          text: 'Bếp trưởng đã nhận ghi chú của bạn và đang hoàn thiện nơ hộp lạnh nhé!',
          time: timeStr,
        },
      ])
    }, 1200)
  }

  const isCurrentOrderDelivered =
    deliveryStatus === 'COMPLETED' ||
    completedOrders.some((o) => o.id === currentOrderId)

  // Sync with localStorage on mount
  useEffect(() => {
    try {
      const status = localStorage.getItem('sweetcake_delivery_status')
      if (status) setDeliveryStatus(status)

      const saved = localStorage.getItem('sweetcake_completed_orders')
      if (saved) {
        const parsed = JSON.parse(saved)
        setCompletedOrders((prev) => {
          const combined = [...parsed]
          prev.forEach((p) => {
            if (!combined.some((c) => c.id === p.id)) {
              combined.push(p)
            }
          })
          return combined
        })
      }
    } catch {}
  }, [])

  const handleCompleteCurrentOrder = () => {
    const newCompleted = {
      id: currentOrderId,
      title: currentTitle,
      subtitle: `Xưởng thực hiện: ${currentBakery} • Quy cách: ${currentSize}`,
      completedDate: `Hôm nay, ${new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })} (${new Date().toLocaleDateString('vi-VN')}) • Giao đến Căn hộ 18.04 Saigon Pearl`,
      price: currentPrice,
      image: currentImage,
      deliveryNote:
        'Đã giao xe lạnh chuyên dụng đạt chuẩn 4.8°C • Đồng kiểm nguyên vẹn 100%',
      bakery: currentBakery,
      isNew: true,
    }

    try {
      localStorage.setItem('sweetcake_delivery_status', 'COMPLETED')
      const existing = localStorage.getItem('sweetcake_completed_orders')
      let list = existing ? JSON.parse(existing) : []
      list = [newCompleted, ...list.filter((o) => o.id !== currentOrderId)]
      localStorage.setItem('sweetcake_completed_orders', JSON.stringify(list))
    } catch {}

    setDeliveryStatus('COMPLETED')
    setCompletedOrders((prev) => [
      newCompleted,
      ...prev.filter((o) => o.id !== currentOrderId),
    ])
    setOrderFilter('completed')
    showNotification(
      `Đơn hàng ${currentOrderId} đã giao xong và được lưu vào Lịch sử đơn hàng!`
    )
  }

  const handleReorder = (cakeTitle, price) => {
    if (onAddToCart) {
      onAddToCart({
        title: cakeTitle,
        price: price,
        quantity: 1,
        selectedSize: 'Size tiêu chuẩn',
      })
    }
    showNotification(`Đã thêm "${cakeTitle}" vào giỏ hàng để bạn đặt lại!`)
  }

  return (
    <div className="w-full bg-background min-h-[calc(100vh-20rem)] pb-16">
      {/* Toast Feedback Notification */}
      {toastFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-secondary text-xl">
            check_circle
          </span>
          <span className="text-sm font-medium">{toastFeedback}</span>
        </div>
      )}

      <div className="flex flex-col w-full">
        {/* Subtle Ambient Glow Orbs */}
        <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8 sm:py-12 overflow-hidden">
          {/* Profile Banner & Loyalty Tier Highlight */}
          <div className="relative rounded-3xl bg-surface-container-low shadow-[0_16px_36px_-6px_rgba(45,30,24,0.05)] p-6 sm:p-10 mb-10 overflow-hidden border border-outline-variant/20">
            {/* Background Patina Watermark */}
            <div className="absolute -right-16 -top-20 w-96 h-96 rounded-full bg-secondary-fixed/20 blur-3xl pointer-events-none"></div>
            <div className="absolute right-1/4 -bottom-24 w-80 h-80 rounded-full bg-tertiary-fixed/30 blur-2xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              {/* Left: Avatar & Welcome Note */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                <div className="relative group">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-[0_8px_24px_-4px_rgba(45,30,24,0.12)] bg-surface-container-high ring-4 ring-surface-container-lowest">
                    <img
                      alt="Khách hàng Mai An"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida/AEtjO1VT5URbmJEvZBX1TjmxImJwK_osZ6biB1P_DejTWKq44VWCJp159R5LrIDl0ocXUFTIFZl4xJx2ytEZsaUEAlJjKqr-7Ifk2DCUMhTO52eKD28pkfnhUC4fPCwNWkgZp93H-WlYjftqsxYPa-Qjcx2IASGxAXrwFtYPcEPo0zKCa6DBwFmixLws_w2wueivUQvC3JbGrbKOFd8XwtQPkXlfa_1QiEjevzMJakPohX-dNwsP6ctfp2Dldnc"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <h1 className="font-headline-md text-primary tracking-tight text-2xl sm:text-3xl font-bold">
                    Chào mừng trở lại, {userProfile.name}!
                  </h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant font-body-sm">
                    {userProfile.fullName} • Theo dõi quy trình làm bánh &amp; hành trình giao xe lạnh trong ngày
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Navigation & Concierge Support (4 Cols) */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Account Nav Card */}
              <div className="bg-surface-container-low rounded-2xl p-4 shadow-[0_8px_24px_-4px_rgba(45,30,24,0.03)] space-y-3 border border-outline-variant/20">
                <p className="px-1 text-xs font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Tài khoản &amp; Tiện ích
                </p>

                {/* Account Details & Action Buttons */}
                <div className="p-3.5 rounded-xl bg-surface-container-lowest/90 border border-outline-variant/20 space-y-2.5 text-xs font-body-sm shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-base">
                        call
                      </span>
                      Số điện thoại:
                    </span>
                    <span className="font-semibold text-primary">{userProfile.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-base">
                        cake
                      </span>
                      Bánh đã thưởng thức:
                    </span>
                    <span className="font-semibold text-primary">
                      {userProfile.cakesEnjoyed + (isCurrentOrderDelivered ? 1 : 0)} đơn hoàn tất
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/15">
                    <button
                      className="flex-1 py-2 px-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md transition-all flex items-center justify-center gap-1.5 shadow-sm text-xs cursor-pointer font-semibold"
                      onClick={() => {
                        setEditName(userProfile.fullName)
                        setEditEmail(userProfile.email)
                        setEditPhone(userProfile.phone)
                        setIsEditProfileModalOpen(true)
                      }}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        manage_accounts
                      </span>{' '}
                      Chỉnh sửa hồ sơ
                    </button>
                    <button
                      className="py-2 px-2.5 rounded-xl bg-surface-container-low hover:bg-error-container hover:text-error text-on-surface-variant font-label-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => {
                        if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?')) {
                          onNavigate && onNavigate('login')
                        }
                      }}
                      title="Đăng xuất"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        logout
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-outline-variant/10">
                  <button
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-label-md transition-all cursor-pointer ${
                      activeSideTab === 'orders'
                        ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(45,30,24,0.15)] font-bold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                    onClick={() => setActiveSideTab('orders')}
                    type="button"
                  >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined ${
                        activeSideTab === 'orders'
                          ? 'text-secondary-fixed'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      cake
                    </span>
                    <span>Lịch sử đơn bánh &amp; Giao nhận</span>
                  </div>
                  <span className="bg-secondary text-on-secondary text-xs px-2 py-0.5 rounded-full font-bold">
                    1 đang giao
                  </span>
                </button>

                <button
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-label-md transition-colors cursor-pointer ${
                    activeSideTab === 'addresses'
                      ? 'bg-primary text-on-primary shadow-sm font-bold'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                  onClick={() => setActiveSideTab('addresses')}
                  type="button"
                >
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span
                      className={`material-symbols-outlined ${
                        activeSideTab === 'addresses' ? 'text-secondary-fixed' : ''
                      }`}
                    >
                      place
                    </span>
                    <span
                      className={
                        activeSideTab === 'addresses'
                          ? 'text-on-primary'
                          : 'text-on-surface'
                      }
                    >
                      Sổ địa chỉ nhận tiệc
                    </span>
                  </div>
                  <span
                    className={`text-xs ${
                      activeSideTab === 'addresses'
                        ? 'text-primary-fixed-dim'
                        : 'text-on-surface-variant'
                    } font-body-sm`}
                  >
                    {addresses.length} địa chỉ
                  </span>
                </button>

                <button
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-label-md transition-colors cursor-pointer ${
                    activeSideTab === 'security'
                      ? 'bg-primary text-on-primary shadow-sm font-bold'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                  onClick={() => setActiveSideTab('security')}
                  type="button"
                >
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span
                      className={`material-symbols-outlined ${
                        activeSideTab === 'security' ? 'text-secondary-fixed' : ''
                      }`}
                    >
                      security
                    </span>
                    <span
                      className={
                        activeSideTab === 'security'
                          ? 'text-on-primary'
                          : 'text-on-surface'
                      }
                    >
                      Cài đặt &amp; Mật khẩu
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-base text-on-surface-variant">
                    chevron_right
                  </span>
                </button>
                </div>
              </div>

              {/* Saved Addresses Snippet */}
              <div className="bg-surface-container-low rounded-2xl p-5 shadow-[0_8px_24px_-4px_rgba(45,30,24,0.03)] space-y-4 border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-sm text-base text-primary font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-lg">
                      home_pin
                    </span>
                    Địa chỉ nhận bánh thường dùng
                  </h3>
                  <button
                    className="text-xs font-label-md text-secondary hover:underline cursor-pointer font-bold"
                    onClick={() => setIsAddAddressModalOpen(true)}
                    type="button"
                  >
                    + Thêm mới
                  </button>
                </div>

                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-3.5 rounded-xl bg-surface-container-lowest text-xs space-y-1 shadow-sm border ${
                        addr.isDefault
                          ? 'border-secondary/40'
                          : 'border-outline-variant/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-label-md font-semibold text-primary flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              addr.isDefault ? 'bg-secondary' : 'bg-outline-variant'
                            }`}
                          ></span>{' '}
                          {addr.title}
                        </span>
                        <span className="text-on-surface-variant font-mono">
                          {addr.phone}
                        </span>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed text-[11px]">
                        {addr.address}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* RIGHT COLUMN: Based on activeSideTab (8 Cols) */}
            <div className="lg:col-span-8 space-y-8">
              {activeSideTab === 'security' ? (
                /* VIEW: CÀI ĐẶT & ĐỔI MẬT KHẨU */
                <section className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-[0_16px_36px_-6px_rgba(45,30,24,0.06)] border border-outline-variant/20 space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-outline-variant/15">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-2xl">
                          lock_reset
                        </span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-primary text-xl font-bold">
                          Cài Đặt &amp; Đổi Mật Khẩu
                        </h2>
                        <p className="text-xs font-body-sm text-on-surface-variant mt-0.5">
                          Cập nhật mật khẩu bảo vệ tài khoản và tùy chỉnh thông báo vận chuyển
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Password Change Form */}
                  <form className="space-y-4 max-w-xl" onSubmit={handleChangePasswordSubmit}>
                    {passwordError && (
                      <div className="p-3 rounded-xl bg-error-container/40 text-error text-xs flex items-center gap-2 border border-error/20">
                        <span className="material-symbols-outlined text-base">
                          error
                        </span>
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-primary block">
                        Mật khẩu hiện tại:
                      </label>
                      <div className="relative">
                        <input
                          className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/40 text-xs focus:outline-none focus:border-secondary transition-colors pr-10"
                          placeholder="Nhập mật khẩu đang dùng"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          <span className="material-symbols-outlined text-base">
                            {showCurrentPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-primary block">
                          Mật khẩu mới:
                        </label>
                        <div className="relative">
                          <input
                            className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/40 text-xs focus:outline-none focus:border-secondary transition-colors pr-10"
                            placeholder="Tối thiểu 6 ký tự"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            <span className="material-symbols-outlined text-base">
                              {showNewPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-primary block">
                          Xác nhận mật khẩu mới:
                        </label>
                        <div className="relative">
                          <input
                            className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/40 text-xs focus:outline-none focus:border-secondary transition-colors pr-10"
                            placeholder="Nhập lại mật khẩu mới"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            <span className="material-symbols-outlined text-base">
                              {showConfirmPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                        type="submit"
                      >
                        <span className="material-symbols-outlined text-base">
                          save
                        </span>
                        Cập Nhật Mật Khẩu
                      </button>
                    </div>
                  </form>

                  {/* Notification Preferences */}
                  <div className="pt-6 border-t border-outline-variant/15 space-y-4">
                    <h3 className="font-headline-sm text-sm text-primary font-bold">
                      Tùy Chọn Thông Báo Vận Chuyển &amp; Đơn Bánh
                    </h3>
                    <div className="space-y-3 max-w-xl">
                      <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer">
                        <div>
                          <span className="font-label-md text-xs font-semibold text-primary block">
                            Thông báo qua tin nhắn SMS khi xe lạnh bắt đầu giao
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            Cập nhật nhiệt độ thùng lạnh và biển số xe giao bánh
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifySms}
                          onChange={(e) => setNotifySms(e.target.checked)}
                          className="accent-secondary w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer">
                        <div>
                          <span className="font-label-md text-xs font-semibold text-primary block">
                            Thông báo Zalo khi Bếp trưởng tải ảnh kiểm tra thành phẩm
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            Xem ảnh bánh thực tế trước khi xe lạnh xuất xưởng
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifyZalo}
                          onChange={(e) => setNotifyZalo(e.target.checked)}
                          className="accent-secondary w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer">
                        <div>
                          <span className="font-label-md text-xs font-semibold text-primary block">
                            Tự động lưu địa chỉ nhận tiệc mới vào sổ địa chỉ
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            Giúp đặt bánh nhanh hơn trong những lần tiệc sau
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoSaveAddress}
                          onChange={(e) => setAutoSaveAddress(e.target.checked)}
                          className="accent-secondary w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </section>
              ) : activeSideTab === 'addresses' ? (
                /* VIEW: SỔ ĐỊA CHỈ NHẬN TIỆC */
                <section className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-[0_16px_36px_-6px_rgba(45,30,24,0.06)] border border-outline-variant/20 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15">
                    <div>
                      <h2 className="font-headline-sm text-primary text-xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary">
                          home_pin
                        </span>
                        Sổ Địa Chỉ Nhận Tiệc ({addresses.length})
                      </h2>
                      <p className="text-xs font-body-sm text-on-surface-variant mt-0.5">
                        Địa chỉ nhận bánh kem xe lạnh chuyên dụng của bạn
                      </p>
                    </div>
                    <button
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      onClick={() => setIsAddAddressModalOpen(true)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        add
                      </span>
                      Thêm địa chỉ mới
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-2xl bg-surface-container-low border transition-all space-y-3 ${
                          addr.isDefault
                            ? 'border-secondary/50 shadow-sm'
                            : 'border-outline-variant/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-label-md font-bold text-primary flex items-center gap-1.5 text-sm">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                addr.isDefault
                                  ? 'bg-secondary'
                                  : 'bg-outline-variant'
                              }`}
                            ></span>
                            {addr.title}
                          </span>
                          {addr.isDefault && (
                            <span className="px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-label-sm font-bold">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {addr.address}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10 text-xs">
                          <span className="text-on-surface-variant font-mono text-[11px]">
                            {addr.phone}
                          </span>
                          {!addr.isDefault && (
                            <button
                              type="button"
                              className="text-secondary hover:underline font-label-md font-semibold text-xs cursor-pointer"
                              onClick={() => {
                                setAddresses((prev) =>
                                  prev.map((a) => ({
                                    ...a,
                                    isDefault: a.id === addr.id,
                                  }))
                                )
                                showNotification(`Đã đặt "${addr.title}" làm địa chỉ mặc định!`)
                              }}
                            >
                              Đặt làm mặc định
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                /* VIEW: ORDERS & TRACKING */
                <>
                  {/* Filter Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none font-label-md text-sm">
                    <button
                      className={`px-4 py-2 rounded-full shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                        orderFilter === 'delivering'
                          ? 'bg-primary text-on-primary shadow-sm font-semibold'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                      }`}
                      onClick={() => setOrderFilter('delivering')}
                      type="button"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCurrentOrderDelivered
                            ? 'bg-outline-variant'
                            : 'bg-secondary animate-pulse'
                        }`}
                      ></span>
                      Đang chuẩn bị &amp; Giao ({isCurrentOrderDelivered ? 0 : 1})
                    </button>

                    <button
                      className={`px-4 py-2 rounded-full shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                        orderFilter === 'completed'
                          ? 'bg-primary text-on-primary shadow-sm font-semibold'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                      }`}
                      onClick={() => setOrderFilter('completed')}
                      type="button"
                    >
                      <span>Đã giao hoàn tất ({completedOrders.length})</span>
                      {completedOrders.some((o) => o.isNew) && (
                        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                      )}
                    </button>

                    <button
                      className={`px-4 py-2 rounded-full shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                        orderFilter === 'bespoke'
                          ? 'bg-primary text-on-primary shadow-sm font-semibold'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                      }`}
                      onClick={() => setOrderFilter('bespoke')}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-xs text-secondary">
                        brush
                      </span>
                      Bespoke Atelier (1)
                    </button>
                  </div>

                  {/* Notice when current order has already been delivered */}
                  {isCurrentOrderDelivered && orderFilter === 'delivering' && (
                    <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-2xl">
                            verified
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-primary text-sm">
                            Đơn hàng {currentOrderId} đã giao và đồng kiểm thành công!
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            Bánh đã được lưu trữ an toàn trong lịch sử đơn hàng của bạn.
                          </p>
                        </div>
                      </div>
                      <button
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-on-primary font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        onClick={() => setOrderFilter('completed')}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">
                          history
                        </span>
                        Xem trong Lịch Sử Đơn Hàng
                      </button>
                    </div>
                  )}

                  {/* 1. LIVE TRACKING CARD (Bếp đang làm & Giao trong hôm nay) */}
                  {!isCurrentOrderDelivered &&
                    (orderFilter === 'delivering' || orderFilter === 'bespoke') && (
                      <section className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-[0_16px_36px_-6px_rgba(45,30,24,0.06)] relative overflow-hidden border border-outline-variant/20">
                        {/* Top Badge & Order Metadata */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
                          <div>
                            <div className="flex items-center gap-2.5 mb-1">
                              <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary font-label-sm font-bold tracking-wider uppercase text-xs flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>{' '}
                                Đang thực hiện hôm nay
                              </span>
                              <span className="font-headline-sm text-primary text-lg font-bold">
                                Mã đơn {currentOrderId}
                              </span>
                            </div>
                            <p className="text-xs font-body-sm text-on-surface-variant">
                              Đặt lúc: 08:30 Hôm nay • Khung giờ giao hẹn:{' '}
                              <strong className="text-primary font-semibold">
                                15:30 - 16:30
                              </strong>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-label-md flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer font-bold"
                              onClick={handleCompleteCurrentOrder}
                              type="button"
                              title="Xác nhận bánh đã giao thành công và chuyển vào Lịch sử đơn hàng"
                            >
                              <span className="material-symbols-outlined text-base">
                                check_circle
                              </span>{' '}
                              Đã nhận bánh
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-label-md flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
                              onClick={() => setIsInvoiceModalOpen(true)}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">
                                receipt_long
                              </span>{' '}
                              Hóa đơn
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-xl bg-secondary text-on-secondary hover:bg-secondary/90 text-xs font-label-md flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer font-bold"
                              onClick={() => onNavigate && onNavigate('tracking')}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">
                                near_me
                              </span>{' '}
                              Định vị tài xế
                            </button>
                          </div>
                        </div>

                        {/* Visual Progress Stepper (4 Steps) */}
                        <div className="py-6 px-2 sm:px-4 bg-surface-container-low rounded-2xl mb-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                            {/* Step 1: Done */}
                            <div className="flex flex-col items-center text-center space-y-2 relative">
                              <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm shadow-sm">
                                <span className="material-symbols-outlined text-lg">
                                  check
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-label-md text-xs font-bold text-primary">
                                  Bếp nhận đơn
                                </p>
                                <p className="text-[11px] text-on-surface-variant font-body-sm">
                                  Đã duyệt 09:00
                                </p>
                              </div>
                            </div>

                            {/* Step 2: In-Progress (Current) */}
                            <div className="flex flex-col items-center text-center space-y-2 relative">
                              <div className="w-10 h-10 rounded-full bg-primary text-secondary-container flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-secondary-container/30 animate-pulse">
                                <span className="material-symbols-outlined text-lg">
                                  soup_kitchen
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-label-md text-xs font-bold text-secondary">
                                  Đang làm bánh
                                </p>
                                <p className="text-[11px] text-secondary font-body-sm font-medium">
                                  {currentBakery} chế tác
                                </p>
                              </div>
                            </div>

                            {/* Step 3: Pending */}
                            <div className="flex flex-col items-center text-center space-y-2 relative opacity-60">
                              <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold text-sm">
                                <span className="material-symbols-outlined text-lg">
                                  ac_unit
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-label-md text-xs font-semibold text-on-surface">
                                  Hộp mica &amp; Thùng lạnh
                                </p>
                                <p className="text-[11px] text-on-surface-variant font-body-sm">
                                  Bảo quản 4.8°C
                                </p>
                              </div>
                            </div>

                            {/* Step 4: Pending */}
                            <div className="flex flex-col items-center text-center space-y-2 relative opacity-60">
                              <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold text-sm">
                                <span className="material-symbols-outlined text-lg">
                                  two_wheeler
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-label-md text-xs font-semibold text-on-surface">
                                  Xe lạnh giao tận tay
                                </p>
                                <p className="text-[11px] text-on-surface-variant font-body-sm">
                                  Dự kiến 15:30
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pastry Item Card Details */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-surface-container-low mb-6 border border-outline-variant/15">
                          <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm shrink-0 bg-surface-container">
                            <img
                              alt={currentTitle}
                              className="w-full h-full object-cover"
                              src={currentImage}
                            />
                          </div>
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-headline-sm text-base text-primary font-bold truncate">
                                {currentTitle}
                              </h4>
                              <span className="font-headline-sm text-secondary text-base font-bold whitespace-nowrap">
                                {currentPrice.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                            <p className="text-xs font-body-sm text-on-surface-variant">
                              Quy cách: <strong>{currentSize}</strong> • Xưởng thực hiện:{' '}
                              <span className="text-secondary font-medium">
                                {currentBakery}
                              </span>
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-sm font-semibold">
                                ✍️ Chữ mừng: "Happy 7th Birthday Minh Khang!"
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed/40 text-on-secondary-fixed-variant font-label-sm">
                                ⚡ Tượng 3D Fondant &amp; Nến số mạ vàng
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Delivery Note & Chef Contact Quick Links */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-body-sm pt-2">
                          <div className="p-3.5 rounded-xl bg-surface-container flex items-start gap-3">
                            <span className="material-symbols-outlined text-secondary text-lg shrink-0 mt-0.5">
                              location_on
                            </span>
                            <div className="space-y-0.5">
                              <strong className="font-label-md text-primary block">
                                Giao đến Căn hộ 18.04, Tháp Opal - Saigon Pearl
                              </strong>
                              <p className="text-on-surface-variant text-[11px]">
                                92 Nguyễn Hữu Cảnh, P. 22, Bình Thạnh. Xe lạnh chuyên dụng 51D-892.44 giữ nhiệt 4.8°C.
                              </p>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-surface-container flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="material-symbols-outlined text-secondary text-lg shrink-0">
                                chat_bubble
                              </span>
                              <div className="truncate">
                                <strong className="font-label-md text-primary block truncate">
                                  Trao đổi cùng {currentBakery}
                                </strong>
                                <span className="text-on-surface-variant text-[11px]">
                                  Xưởng bánh sẵn sàng hỗ trợ điều chỉnh
                                </span>
                              </div>
                            </div>
                            <button
                              className="text-xs font-label-md text-secondary hover:text-primary transition-colors shrink-0 underline cursor-pointer font-bold"
                              onClick={() => setIsChefChatModalOpen(true)}
                              type="button"
                            >
                              Nhắn bếp trưởng
                            </button>
                          </div>
                        </div>
                      </section>
                    )}

                  {/* 2. PAST ORDERS HISTORY (Chỉ xuất hiện khi chọn Đã giao hoàn tất) */}
                  {orderFilter === 'completed' && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="font-headline-sm text-primary text-xl font-bold flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary">
                            history
                          </span>
                          Đơn hàng trước đây
                        </h2>
                        <span className="text-xs font-body-sm text-on-surface-variant">
                          Hiển thị {completedOrders.length} đơn hoàn tất
                        </span>
                      </div>

                      {completedOrders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] space-y-4 transition-all hover:shadow-[0_16px_36px_-6px_rgba(45,30,24,0.08)] border border-outline-variant/20"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/10">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-headline-sm text-base text-primary font-bold">
                                  {order.id}
                                </span>
                                {order.isCancelled ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-label-sm text-[11px] font-semibold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs text-rose-600">
                                      cancel
                                    </span>{' '}
                                    Đã hủy &amp; Hoàn cọc Escrow
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] font-semibold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs text-secondary">
                                      check_circle
                                    </span>{' '}
                                    Đã giao thành công
                                  </span>
                                )}
                                {order.isNew && !order.isCancelled && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-[10px] font-bold">
                                    Mới hoàn thành
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-body-sm text-on-surface-variant mt-0.5">
                                {order.completedDate}
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="text-xs text-on-surface-variant block">
                                Tổng thanh toán:
                              </span>
                              <span className="font-headline-sm text-primary text-lg font-bold">
                                {order.price.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container shrink-0">
                              <img
                                alt={order.title}
                                className="w-full h-full object-cover"
                                src={order.image}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-label-lg text-primary font-bold truncate text-sm">
                                {order.title}
                              </h5>
                              <p className="text-xs text-on-surface-variant truncate">
                                {order.subtitle}
                              </p>
                              <span className="inline-flex items-center gap-1 text-[11px] text-secondary font-medium pt-1">
                                <span className="material-symbols-outlined text-xs">
                                  verified
                                </span>
                                {order.deliveryNote ||
                                  'Đã giao xe lạnh đạt chuẩn 4.8°C tận nơi'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                              <button
                                className="px-3.5 py-2 rounded-xl bg-primary text-on-primary hover:bg-secondary transition-colors font-label-md text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                                onClick={() =>
                                  handleReorder(order.title, order.price)
                                }
                                type="button"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  replay
                                </span>{' '}
                                Đặt lại đơn này
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </section>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MODALS
      ========================================================= */}

      {/* MODAL 1: Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-md w-full shadow-2xl p-6 border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-primary text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  manage_accounts
                </span>
                Cập Nhật Thông Tin Cá Nhân
              </h3>
              <button
                className="text-outline hover:text-primary transition-colors cursor-pointer"
                onClick={() => setIsEditProfileModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleSaveProfile}>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-primary">
                  Họ và tên:
                </label>
                <input
                  className="w-full bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs focus:outline-none focus:border-secondary"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>



              <div className="space-y-1">
                <label className="text-xs font-semibold text-primary">
                  Số điện thoại liên hệ:
                </label>
                <input
                  className="w-full bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs focus:outline-none focus:border-secondary"
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold cursor-pointer"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  type="button"
                >
                  Hủy
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md text-xs font-bold transition-colors shadow cursor-pointer"
                  type="submit"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Address Modal */}
      {isAddAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-md w-full shadow-2xl p-6 border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-primary text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  add_location_alt
                </span>
                Thêm Địa Chỉ Nhận Bánh
              </h3>
              <button
                className="text-outline hover:text-primary transition-colors cursor-pointer"
                onClick={() => setIsAddAddressModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleAddAddress}>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-primary">
                  Tên gợi nhớ (VD: Biệt thự gia đình, Tiệc Quận 2...):
                </label>
                <input
                  className="w-full bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs focus:outline-none focus:border-secondary"
                  placeholder="VD: Căn hộ nghỉ dưỡng Phú Mỹ Hưng"
                  type="text"
                  value={newAddrTitle}
                  onChange={(e) => setNewAddrTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-primary">
                  Số điện thoại người nhận:
                </label>
                <input
                  className="w-full bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs focus:outline-none focus:border-secondary"
                  placeholder={userProfile.phone}
                  type="tel"
                  value={newAddrPhone}
                  onChange={(e) => setNewAddrPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-primary">
                  Địa chỉ chi tiết:
                </label>
                <textarea
                  className="w-full bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs focus:outline-none focus:border-secondary resize-none"
                  placeholder="Số nhà, tầng, toà nhà, đường, phường, quận..."
                  rows={3}
                  value={newAddrDetails}
                  onChange={(e) => setNewAddrDetails(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold cursor-pointer"
                  onClick={() => setIsAddAddressModalOpen(false)}
                  type="button"
                >
                  Hủy
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md text-xs font-bold transition-colors shadow cursor-pointer"
                  type="submit"
                >
                  Thêm Địa Chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Change Password Modal */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-md w-full shadow-2xl p-6 border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-primary text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  lock_reset
                </span>
                Đổi Mật Khẩu Đăng Nhập
              </h3>
              <button
                className="text-outline hover:text-primary transition-colors cursor-pointer"
                onClick={() => setIsChangePasswordModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                setIsChangePasswordModalOpen(false)
                showNotification('Mật khẩu của bạn đã được cập nhật thành công!')
              }}
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-primary">
                  Mật khẩu hiện tại:
                </label>
                <input
                  className="w-full bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs focus:outline-none focus:border-secondary"
                  type="password"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-primary">
                  Mật khẩu mới:
                </label>
                <input
                  className="w-full bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs focus:outline-none focus:border-secondary"
                  type="password"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-primary">
                  Xác nhận mật khẩu mới:
                </label>
                <input
                  className="w-full bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs focus:outline-none focus:border-secondary"
                  type="password"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold cursor-pointer"
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  type="button"
                >
                  Hủy
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md text-xs font-bold transition-colors shadow cursor-pointer"
                  type="submit"
                >
                  Lưu Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Electronic Invoice View (#ORD-2025-9982) */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full shadow-2xl p-6 border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl">
                  receipt_long
                </span>
                <div>
                  <h3 className="font-headline-sm text-primary text-base font-bold">
                    Biên Lai Điện Tử #ORD-2025-9982
                  </h3>
                  <p className="text-[11px] text-outline font-mono">
                    Ngày xuất: 25/10/2025 • Khách hàng: {userProfile.fullName} ({userProfile.name})
                  </p>
                </div>
              </div>
              <button
                className="text-outline hover:text-primary transition-colors cursor-pointer"
                onClick={() => setIsInvoiceModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-4 bg-surface-container-low rounded-xl text-xs space-y-2 font-mono">
              <div className="flex justify-between border-b pb-1.5 border-outline-variant/20">
                <span>Mặt hàng:</span>
                <span className="font-bold">Bánh Sinh Nhật Pikachu Tạo Hình 3D (2 Tầng)</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-outline-variant/20">
                <span>Tiệm chế tác:</span>
                <span className="font-semibold text-secondary">La Crème Pâtisserie (Chef Jean-Luc)</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-outline-variant/20">
                <span>Tuỳ biến:</span>
                <span>Chiffon dâu tây organic ít ngọt 30%, nến số 7 mạ vàng & thiệp viết tay</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-outline-variant/20">
                <span>Vận chuyển:</span>
                <span>Xe van lạnh 4.8°C Suzuki 51D-892.44 (Miễn phí vận chuyển Escrow)</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 text-primary">
                <span>Tổng thanh toán (Escrow):</span>
                <span className="text-secondary">950.000 VNĐ</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold cursor-pointer"
                onClick={() => setIsInvoiceModalOpen(false)}
                type="button"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Chef Chat Modal */}
      {isChefChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[85vh]">
            <div className="bg-primary-container text-on-primary-container p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                  LC
                </div>
                <div>
                  <h3 className="font-headline-sm text-base text-primary-fixed font-bold">
                    Chef Jean-Luc (La Crème Pâtisserie)
                  </h3>
                  <p className="text-xs text-primary-fixed-dim">
                    Đang hoàn thiện bánh #ORD-2025-9982
                  </p>
                </div>
              </div>
              <button
                className="p-1 text-primary-fixed hover:text-white transition-colors cursor-pointer"
                onClick={() => setIsChefChatModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-surface-container-low text-xs">
              {chefMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className="text-[10px] text-outline mb-0.5">
                    {msg.time}
                  </span>
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-primary text-on-primary rounded-tr-none'
                        : 'bg-surface text-primary rounded-tl-none border border-outline-variant/20 shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form
              className="p-3 bg-surface border-t border-outline-variant/20 flex gap-2"
              onSubmit={handleSendChefMessage}
            >
              <input
                className="flex-1 bg-surface-container-low text-on-surface px-4 py-2.5 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
                placeholder="Nhắn dặn dò bếp trưởng..."
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
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
    </div>
  )
}

export default CustomerProfilePage
