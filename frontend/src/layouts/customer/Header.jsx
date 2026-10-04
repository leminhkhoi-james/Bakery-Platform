import { useState, useEffect } from 'react'
import BrandLogo from '../../components/common/BrandLogo'
import { CUSTOMER_NAV_LINKS } from '../../mockData/shared/navigation.js'

export const Header = ({
  cartCount = 2,
  activeTab = 'home',
  onNavigate,
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [scrolledActiveTab, setScrolledActiveTab] = useState(activeTab)

  useEffect(() => {
    setScrolledActiveTab(activeTab)
    if (activeTab !== 'home') return

    const handleScroll = () => {
      const sections = [
        { id: 'cho-tiem-banh', tab: 'stores' },
        { id: 'cach-hoat-dong', tab: 'ai-studio' },
        { id: 'tao-banh-theo-y', tab: 'ai-studio' },
        { id: 'mau-banh-ban-chay', tab: 'explore' },
        { id: 'danh-muc-banh', tab: 'explore' }
      ]

      let currentTab = 'home'
      for (const { id, tab } of sections) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= window.innerHeight / 2.5) {
            currentTab = tab
            break
          }
        }
      }
      setScrolledActiveTab(currentTab)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeTab])

  const handleNav = (e, path) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(path)
    }
  }

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-surface shadow-xs flex flex-col">
      {/* TOP POLKA DOT SCALLOP CURTAIN RIBBON (Placed ABOVE menu items) */}
      <div className="relative w-full overflow-hidden select-none z-10">
        {/* Polka Dot Pink Curtain Ribbon */}
        <div className="h-4 w-full bg-primary-fixed pattern-dots-pink border-b border-primary"></div>

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
              scrolledActiveTab === link.route ||
              (link.activeAliases && link.activeAliases.includes(scrolledActiveTab))

            return (
              <a
                key={link.id}
                className={`px-4 py-1.5 rounded-full text-base font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isTabActive
                    ? 'bg-primary text-on-primary font-extrabold shadow-md scale-[1.02]'
                    : 'text-primary hover:text-primary-container hover:bg-primary-fixed-dim/60'
                }`}
                href={link.href}
                onClick={(e) => handleNav(e, link.route)}
              >
                {link.icon && (
                  <span className="material-symbols-outlined text-base text-current">
                    {link.icon}
                  </span>
                )}
                <span className={isTabActive ? 'text-on-primary' : 'text-primary'}>{link.label}</span>
                {link.badge && (
                  <span className={isTabActive ? "bg-white text-primary font-bold text-xs px-2 py-0.5 rounded-full border border-primary/30" : "bg-primary-fixed text-primary font-bold text-xs px-2 py-0.5 rounded-full border border-primary/30"}>
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
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg">
              search
            </span>
            <input
              className="w-full pl-9 pr-4 py-1.5 rounded-full bg-surface border border-primary/30 focus:border-primary focus:bg-white text-sm text-primary placeholder:text-primary/60 transition-all outline-none font-bold"
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
            className="p-2.5 rounded-full bg-surface hover:bg-primary-fixed-dim text-primary border border-primary/30 transition-colors relative cursor-pointer"
            onClick={(e) => handleNav(e, 'cart')}
          >
            <span className="material-symbols-outlined text-xl">
              shopping_bag
            </span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile / Menu Trigger */}
          <div className="relative">
            <button
              aria-label="Tài khoản khách hàng"
              className="p-1 rounded-full border-2 border-primary/40 hover:border-primary transition-colors cursor-pointer"
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
              <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-surface-container-low shadow-xl border-2 border-primary py-2 z-50">
                <div className="px-4 py-3 border-b border-primary/20">
                  <p className="font-savoure text-lg text-primary font-bold">Hân Mai</p>
                  <p className="text-primary/70 text-xs truncate font-bold">hanmai.sweetcake@example.com</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'profile')
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-primary font-bold hover:bg-primary-fixed-dim flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-primary">person</span>
                    <span>Hồ sơ &amp; Đơn hàng của tôi</span>
                  </button>

                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'tracking')
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-primary font-bold hover:bg-primary-fixed-dim flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-primary">local_shipping</span>
                    <span>Theo dõi đơn làm bánh</span>
                  </button>

                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'bidding')
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-primary font-bold hover:bg-primary-fixed-dim flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-primary">request_quote</span>
                    <span>Báo giá đang so sánh</span>
                  </button>
                </div>

                <div className="border-t border-primary/20 pt-1">
                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'vendor-dashboard')
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-primary hover:bg-primary-fixed-dim flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">storefront</span>
                    <span>Cổng Tiệm bánh (Vendor Hub)</span>
                  </button>

                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'admin-dashboard')
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-primary hover:bg-primary-fixed-dim flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">shield_person</span>
                    <span>Quản trị viên (Master Admin)</span>
                  </button>

                  <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'login')
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-error hover:bg-error-container flex items-center gap-2 cursor-pointer"
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

      {/* SVG Scalloped Wave Border at Bottom of Header */}
      <div className="w-full h-3 relative z-20 shrink-0 -mb-3">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wave-pattern-header" x="0" y="0" width="24" height="12" patternUnits="userSpaceOnUse">
              {/* Fill the area ABOVE the wave with the header's surface color to block background from leaking up */}
              <path d="M 0 0 Q 6 11.5 12 11.5 Q 18 11.5 24 0 Z" className="fill-surface" />
              {/* Draw the red wave stroke */}
              <path d="M 0 0 Q 6 11.5 12 11.5 Q 18 11.5 24 0" fill="none" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wave-pattern-header)" />
        </svg>
      </div>
    </header>
  )
}

export default Header
