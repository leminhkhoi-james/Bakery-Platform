import { useState } from 'react'
import BrandLogo from '../../components/common/BrandLogo'
import { CUSTOMER_NAV_LINKS } from '../../mockData/shared/navigation.js'

export const Header = ({
  cartCount = 2,
  activeTab = 'home',
  onNavigate,
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const handleNav = (e, path) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(path)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fffaf3] shadow-xs">
      {/* TOP POLKA DOT SCALLOP CURTAIN RIBBON (Placed ABOVE menu items) */}
      <div className="relative w-full overflow-hidden select-none z-10">
        {/* Polka Dot Pink Curtain Ribbon */}
        <div className="h-4 w-full bg-[#ffc6db] pattern-dots-pink border-b border-wine"></div>

        {/* White Pearl Scallop Ruffle Edge */}
        <div
          className="w-full h-3.5 bg-repeat-x relative -mt-0.5"
          style={{
            backgroundImage: 'radial-gradient(circle at 12px 0px, #ffc6db 9px, transparent 10px)',
            backgroundSize: '24px 12px'
          }}
        >
          <div
            className="w-full h-full bg-repeat-x"
            style={{
              backgroundImage: 'radial-gradient(circle at 12px 7px, #ffffff 2px, transparent 2.5px)',
              backgroundSize: '24px 12px'
            }}
          ></div>
        </div>
      </div>

      {/* MAIN NAVIGATION BAR (Below the top curtain ribbon) */}
      <div className="h-16 sm:h-18 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex items-center justify-between gap-gutter">
        {/* Brand Logo */}
        <div className="flex items-center gap-space-md shrink-0">
          <BrandLogo onClick={(e) => handleNav(e, 'home')} />
        </div>

        {/* Nav Links */}
        <nav className="hidden lg:flex items-center gap-2 font-savoure">
          {CUSTOMER_NAV_LINKS.map((link) => {
            const isTabActive =
              activeTab === link.route ||
              (link.activeAliases && link.activeAliases.includes(activeTab))

            return (
              <a
                key={link.id}
                className={`px-4 py-1.5 rounded-full text-base font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isTabActive
                    ? 'bg-[#9f1e31] text-white font-extrabold shadow-md scale-[1.02]'
                    : 'text-[#9f1e31] hover:text-[#b8273b] hover:bg-[#ffe2e9]/60'
                }`}
                href={link.href}
                onClick={(e) => handleNav(e, link.route)}
              >
                {link.icon && (
                  <span className="material-symbols-outlined text-base text-current">
                    {link.icon}
                  </span>
                )}
                <span className={isTabActive ? 'text-white' : 'text-[#9f1e31]'}>{link.label}</span>
                {link.badge && (
                  <span className={isTabActive ? "bg-white text-[#9f1e31] font-bold text-xs px-2 py-0.5 rounded-full border border-wine/30" : "bg-[#ffc6db] text-wine font-bold text-xs px-2 py-0.5 rounded-full border border-wine/30"}>
                    {link.badge}
                  </span>
                )}
              </a>
            )
          })}
        </nav>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-4">
          {/* Quick Search */}
          <div className="relative hidden md:block w-48 xl:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wine text-lg">
              search
            </span>
            <input
              className="w-full pl-9 pr-4 py-1.5 rounded-full bg-[#fff4e9] border border-wine/30 focus:border-wine focus:bg-white text-sm text-wine placeholder:text-wine/60 transition-all outline-none font-bold"
              placeholder="Tìm bánh, tiệm bánh..."
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onNavigate && onNavigate('explore')
                }
              }}
            />
          </div>

          {/* Cart Icon Button */}
          <button
            aria-label="Xem giỏ hàng bánh kem"
            className="p-2.5 rounded-full bg-[#fff4e9] hover:bg-[#ffe2e9] text-wine border border-wine/30 transition-colors relative cursor-pointer"
            onClick={(e) => handleNav(e, 'cart')}
          >
            <span className="material-symbols-outlined text-xl">
              shopping_bag
            </span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-wine text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile / Menu Trigger */}
          <div className="relative">
            <button
              aria-label="Tài khoản khách hàng"
              className="p-1 rounded-full border-2 border-wine/40 hover:border-wine transition-colors cursor-pointer"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <img
                alt="Avatar khách hàng"
                className="w-8 h-8 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZPxXa22XB0i3Vu6CEjC4sV8mvBIFb0EQEZcnrvSuK1DEWprPNIp8PkP71WcMVzOLDX6K-Jt8VTcnRELtaaMv9rnSZgPT4TmpW-whaHgBMbbNYkdUSCvSRluMe7lpAnau4QdozHVyKUzc-cOkYvDDtR1JZmBfJhvyyBetI1iwKFIecoBb2W-UPkWCRuIRrrqOITaESSKPbN_PRkwFhA-JKj3ye8RLhRYTIvA4UBkobMHm1hSVvheCw"
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#fffaf3] shadow-xl border-2 border-wine py-2 z-50">
                <div className="px-4 py-3 border-b border-wine/20">
                  <p className="font-savoure text-lg text-wine font-bold">Hân Mai</p>
                  <p className="text-wine/70 text-xs truncate font-bold">hanmai.sweetcake@example.com</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'profile')
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-wine font-bold hover:bg-[#ffe2e9] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-wine">person</span>
                    <span>Hồ sơ &amp; Đơn hàng của tôi</span>
                  </button>

                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'tracking')
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-wine font-bold hover:bg-[#ffe2e9] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-wine">local_shipping</span>
                    <span>Theo dõi đơn làm bánh</span>
                  </button>

                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'bidding')
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-wine font-bold hover:bg-[#ffe2e9] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-wine">request_quote</span>
                    <span>Báo giá đang so sánh</span>
                  </button>
                </div>

                <div className="border-t border-wine/20 pt-1">
                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'vendor-dashboard')
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-wine hover:bg-[#ffe2e9] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">storefront</span>
                    <span>Cổng Tiệm bánh (Vendor Hub)</span>
                  </button>

                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'admin-dashboard')
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-wine hover:bg-[#ffe2e9] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">shield_person</span>
                    <span>Quản trị viên (Master Admin)</span>
                  </button>

                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'login')
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-[#ffe2e9] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SVG Scalloped Wave Border at Bottom of Header (Pure SVG Wavy Line, No Straight Horizontal Line underneath) */}
      <div
        className="w-full h-3 relative z-20 pointer-events-none -mb-3"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='12' viewBox='0 0 24 12'%3E%3Cpath d='M 0 0 Q 6 11.5 12 11.5 Q 18 11.5 24 0 Z' fill='%23fffaf3'/%3E%3Cpath d='M 0 0 Q 6 11.5 12 11.5 Q 18 11.5 24 0' fill='none' stroke='%239f1e31' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundSize: '24px 12px'
        }}
      ></div>
    </header>
  )
}

export default Header
