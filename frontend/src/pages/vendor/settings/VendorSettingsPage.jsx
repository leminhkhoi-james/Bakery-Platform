import { DEFAULT_VENDOR_SETTINGS } from '../../../mockData/vendor/settings.js'
import React, { useState } from 'react'
import VendorSidebar from '../../../layouts/vendor/VendorSidebar'
import VendorHeader from '../../../layouts/vendor/VendorHeader'

export default function VendorSettingsPage({ onNavigate }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [shopName, setShopName] = useState(DEFAULT_VENDOR_SETTINGS.shopName)
  const [headChef, setHeadChef] = useState(DEFAULT_VENDOR_SETTINGS.headChef)
  const [phone, setPhone] = useState(DEFAULT_VENDOR_SETTINGS.phone)
  const [email, setEmail] = useState(DEFAULT_VENDOR_SETTINGS.email)
  const [kitchenAddress, setKitchenAddress] = useState(DEFAULT_VENDOR_SETTINGS.kitchenAddress)
  const [bio, setBio] = useState(DEFAULT_VENDOR_SETTINGS.bio)
  const [deliveryRadius, setDeliveryRadius] = useState(DEFAULT_VENDOR_SETTINGS.deliveryRadius)
  const [operatingHours, setOperatingHours] = useState(DEFAULT_VENDOR_SETTINGS.operatingHours)
  const [minLeadTime, setMinLeadTime] = useState(DEFAULT_VENDOR_SETTINGS.minLeadTime)

  // Bank Info (Nhận thanh toán từ sàn)
  const [bankName, setBankName] = useState(DEFAULT_VENDOR_SETTINGS.bankName)
  const [bankAccount, setBankAccount] = useState(DEFAULT_VENDOR_SETTINGS.bankAccount)
  const [accountHolder, setAccountHolder] = useState(DEFAULT_VENDOR_SETTINGS.accountHolder)

  // Marketplace Preferences
  const [acceptRfqAuto, setAcceptRfqAuto] = useState(true)
  const [soundNotification, setSoundNotification] = useState(true)
  const [acceptUrgentOrder, setAcceptUrgentOrder] = useState(true)

  const [toastFeedback, setToastFeedback] = useState(null)

  const showToast = (msg) => {
    setToastFeedback(msg)
    setTimeout(() => setToastFeedback(null), 3500)
  }

  const handleSaveSettings = (e) => {
    e.preventDefault()
    showToast('Đã lưu thành công hồ sơ tiệm bánh trên sàn SweetCake!')
  }

  return (
    <div className="min-h-screen bg-background font-body-md text-body-md text-on-surface flex flex-col selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Toast Notification */}
      {toastFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-secondary text-xl">
            check_circle
          </span>
          <span className="text-sm font-medium">{toastFeedback}</span>
        </div>
      )}

      {/* VENDOR FIXED SIDEBAR */}
      <VendorSidebar
        activeTab="profile"
        onNavigate={onNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* TOPBAR */}
      <VendorHeader
        title="Hồ Sơ Tiệm Bánh"
        subtitle="Thông tin giới thiệu, địa chỉ xưởng & thiết lập thanh toán sàn Sweet Cake"
        contextBadge="Đã xác thực đối tác"
        onNavigate={onNavigate}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        showToast={showToast}
        actions={
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('stores')}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-primary border border-outline-variant/30 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">visibility</span>
            <span className="hidden sm:inline">Xem gian hàng trên sàn</span>
            <span className="sm:hidden">Gian hàng</span>
          </button>
        }
      />

      {/* MAIN CONTENT AREA */}
      <div className="md:pl-72 flex-1">
        <main className="pt-24 min-h-screen bg-background pb-16">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-8 w-full">
            {/* Store Preview Banner */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-secondary overflow-hidden border border-outline-variant/30 shrink-0">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ"
                    alt={shopName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-headline-lg text-2xl font-bold text-primary tracking-tight">{shopName}</h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-label-sm">
                      Đã xác thực đối tác
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Đại diện: <strong>{headChef}</strong> • Hotline: <strong>{phone}</strong>
                  </p>
                  <p className="text-xs text-secondary font-medium mt-0.5">
                    ★ 4.95 / 5.0 (184 lượt đánh giá từ khách hàng)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('vendor-menu')}
                  className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-primary border border-outline-variant/30 cursor-pointer"
                >
                  Quản lý mẫu bánh
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* SECTION 1: THÔNG TIN CƠ BẢN TIỆM BÁNH */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">
                        storefront
                      </span>
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">
                        1. Thông Tin Gian Hàng &amp; Đại Diện
                      </h2>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Thông tin xuất hiện trên thẻ tiệm bánh và trong các báo giá gửi khách hàng
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-primary block">Tên tiệm bánh:</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary font-medium focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-primary block">Chủ tiệm / Bếp trưởng đại diện:</label>
                    <input
                      type="text"
                      value={headChef}
                      onChange={(e) => setHeadChef(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary font-medium focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-primary block">Hotline tiệm bánh:</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary font-medium focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-primary block">Email liên hệ:</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary font-medium focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-bold text-primary block">Giới thiệu tiệm &amp; Phong cách bánh:</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary font-medium focus:outline-none focus:border-secondary leading-relaxed"
                      placeholder="Mô tả phong cách làm bánh, nguyên liệu cam kết, thế mạnh của tiệm..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: ĐỊA CHỈ & KHU VỰC PHỤC VỤ */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">
                        location_on
                      </span>
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">
                        2. Địa Chỉ Cửa Hàng &amp; Giao Hàng
                      </h2>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Địa chỉ làm bánh và bán kính phục vụ khách hàng quanh khu vực
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-bold text-primary block">
                      Địa chỉ tiệm bánh:
                    </label>
                    <input
                      type="text"
                      value={kitchenAddress}
                      onChange={(e) => setKitchenAddress(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary font-medium focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-primary block">
                      Giờ mở cửa / đón khách:
                    </label>
                    <input
                      type="text"
                      value={operatingHours}
                      onChange={(e) => setOperatingHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary font-medium focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-primary block">
                      Bán kính nhận giao bánh:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={deliveryRadius}
                        onChange={(e) => setDeliveryRadius(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary font-medium focus:outline-none focus:border-secondary"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline font-semibold text-xs">
                        km
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-primary block">
                      Thời gian nhận bánh tối thiểu:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={minLeadTime}
                        onChange={(e) => setMinLeadTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary font-medium focus:outline-none focus:border-secondary"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline font-semibold text-xs">
                        tiếng (đơn gấp)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: THÔNG TIN TÀI KHOẢN NHẬN TIỀN ĐƠN BÁNH */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">
                        account_balance
                      </span>
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-base sm:text-lg font-bold text-primary">
                        3. Tài Khoản Ngân Hàng Nhận Tiền
                      </h2>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Sàn giải ngân tiền cọc và thanh toán đơn hàng sau khi khách nhận bánh thành công
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-bold text-primary block">Tên ngân hàng:</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-primary font-medium focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-primary block">Số tài khoản:</label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-mono font-bold text-secondary focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-primary block">Tên chủ tài khoản:</label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold text-primary uppercase focus:outline-none focus:border-secondary"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: TÙY CHỌN NHẬN ĐƠN HÀNG */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 sm:p-8 space-y-4">
                <h3 className="font-headline-sm text-base sm:text-lg font-bold text-primary">
                  4. Tùy Chọn Nhận Đơn Hàng &amp; Thông Báo
                </h3>

                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container transition-colors">
                    <div>
                      <span className="font-bold text-primary block">
                        Nhận thông báo khi có yêu cầu báo giá (RFQ) mới
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        Nhận chuông và tin nhắn khi có khách hàng cần đặt bánh theo mẫu thiết kế
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={acceptRfqAuto}
                      onChange={(e) => setAcceptRfqAuto(e.target.checked)}
                      className="w-4 h-4 accent-secondary cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container transition-colors">
                    <div>
                      <span className="font-bold text-primary block">
                        Âm thanh chuông báo đơn bánh mới
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        Phát âm thanh cảnh báo ngay khi khách hàng xác nhận chọn tiệm của bạn
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundNotification}
                      onChange={(e) => setSoundNotification(e.target.checked)}
                      className="w-4 h-4 accent-secondary cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container transition-colors">
                    <div>
                      <span className="font-bold text-primary block">
                        Tiếp nhận đơn hỏa tốc (Lấy liền trong 2 - 3 giờ)
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        Mẫu bánh có sẵn cốt sẽ được hiển thị nhãn ưu tiên giao nhanh cho khách
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={acceptUrgentOrder}
                      onChange={(e) => setAcceptUrgentOrder(e.target.checked)}
                      className="w-4 h-4 accent-secondary cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('vendor-dashboard')}
                  className="px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold cursor-pointer"
                >
                  Quay lại Bảng điều khiển
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-secondary font-label-lg font-bold text-xs shadow-md cursor-pointer transition-colors"
                >
                  Lưu Hồ Sơ Tiệm Bánh
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
