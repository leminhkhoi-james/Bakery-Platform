import { useState, useEffect } from 'react'
import BrandLogo from '../../components/common/BrandLogo'
import { CUSTOMER_NAV_LINKS } from '../../mockData/shared/navigation.js'
import { useAuth } from '../../context/useAuth.js'

export const Header = ({
  cartCount = 2,
  activeTab = 'home',
  onNavigate,
}) => {
  const { user, roles, logout } = useAuth()
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

            if (link.id === 'explore') {
              return (
                <div key={link.id} className="relative group/menu">
                  <a
                    className={`px-4 py-1.5 rounded-full text-base font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isTabActive
                        ? 'bg-primary text-on-primary font-extrabold shadow-md scale-[1.02]'
                        : 'text-primary hover:text-primary-container hover:bg-primary-fixed-dim/60'
                    }`}
                    href={link.href}
                    onClick={(e) => handleNav(e, link.route)}
                  >
                    <span>{link.label}</span>
                    <span className="material-symbols-outlined text-sm transition-transform duration-200 group-hover/menu:rotate-180">
                      expand_more
                    </span>
                  </a>

                  {/* Mega Dropdown Menu for Thực đơn bánh & Gợi ý tiệc */}
                  <div className="absolute left-0 top-full pt-2 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-all duration-200 z-50">
                    <div className="bg-surface rounded-2xl shadow-2xl border-2 border-primary/20 p-5 w-[540px] grid grid-cols-2 gap-4">
                      {/* Left: Danh mục bánh tiệc */}
                      <div className="space-y-2 border-r border-primary/10 pr-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">cake</span>
                          Các loại bánh tiệc
                        </span>
                        <div className="space-y-1">
                          {[
                            { label: 'Bánh Kem Sinh Nhật', cat: 'Bánh Kem Sinh Nhật' },
                            { label: 'Bánh Cưới Nghệ Thuật', cat: 'Bánh Cưới (Wedding)' },
                            { label: 'Mousse & Tiramisu', cat: 'Bánh Mousse' },
                            { label: 'Cheesecake & Tart', cat: 'Bánh Cheesecake & Tart' },
                            { label: 'Bánh Tạo Hình 3D', cat: 'Bánh Tạo Hình 3D' },
                          ].map((item) => (
                            <button
                              key={item.cat}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-primary-fixed-dim text-xs font-bold text-primary flex items-center justify-between transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                try {
                                  localStorage.setItem('explore_initial_category', item.cat)
                                } catch (err) {}
                                window.dispatchEvent(new CustomEvent('sweetcake_filter_category', { detail: { category: item.cat } }))
                                handleNav(e, 'explore')
                              }}
                            >
                              <span>{item.label}</span>
                              <span className="material-symbols-outlined text-xs text-primary/40">chevron_right</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right: Gợi ý kết hợp cùng tiệc ngọt (Đúng vị trí!) */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">auto_awesome</span>
                          Gợi ý cùng tiệc ngọt
                        </span>
                        <div className="space-y-1.5">
                          <button
                            className="w-full text-left p-1.5 rounded-xl hover:bg-primary-fixed-dim transition-colors flex items-center gap-2.5 cursor-pointer group/item"
                            onClick={(e) => {
                              e.stopPropagation()
                              try {
                                localStorage.setItem('explore_initial_category', 'Bánh Tráng Miệng & Cookie')
                              } catch (err) {}
                              window.dispatchEvent(new CustomEvent('sweetcake_filter_category', { detail: { category: 'Bánh Tráng Miệng & Cookie' } }))
                              handleNav(e, 'explore')
                            }}
                          >
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmsVzjTjx0IXkjIOk52xFfrpv7TjI9az2jX1gpiVBfsVk2CkwVOuzGJu2GoliiJ6a6O9yypqJ83qKQlQVNLqVf9t515O2kFPLLmEAXvtMtSbVcPq6V7SNOBSegKib2_tZYTL4Hdg1kAxjPhT4fH_HLAFVDiK0CBqS360SilhLUzy1_YHqUQy2i8SjUdCIGx7j421dsrFO4NO5DsrTotFAbAPz2m_ZBZvNN0mj7q0WXaAS2__WF23w5"
                              alt="Macarons"
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-primary/20"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] bg-secondary/15 text-secondary px-1.5 py-0.5 rounded font-bold">Kèm bánh</span>
                              <p className="text-xs font-bold text-primary truncate group-hover/item:text-secondary">Hộp 6 Macarons Pháp</p>
                              <p className="text-[11px] font-bold text-secondary">210.000₫</p>
                            </div>
                          </button>

                          <button
                            className="w-full text-left p-1.5 rounded-xl hover:bg-primary-fixed-dim transition-colors flex items-center gap-2.5 cursor-pointer group/item"
                            onClick={(e) => {
                              e.stopPropagation()
                              try {
                                localStorage.setItem('explore_initial_category', 'Đồ Uống & Trà')
                              } catch (err) {}
                              window.dispatchEvent(new CustomEvent('sweetcake_filter_category', { detail: { category: 'Đồ Uống & Trà' } }))
                              handleNav(e, 'explore')
                            }}
                          >
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcfE9YSBTHUb99bzqofhGfVJEQW64jE8HJVFnGdD55k9Yg01-B-cQ3ce2DHaGZAyuKhXivzLyb0magKWKG9izSgODiGPQKs2HCj-800Og19xIkV_DOGtgpQwzLqOkxBaNVroLz3H9hFc-tpYqlcCNCQVDqDj6X6L8BUrXWPORrcvzCSYOGtuwBg3XlcyluMCP6wyySl5rGhZ3vJK_4ubOL_sXo0pdp7OcEBSQOmbocaKorPANho-EO"
                              alt="Rose Earl Grey Tea"
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-primary/20"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] bg-secondary/15 text-secondary px-1.5 py-0.5 rounded font-bold">Đồ uống</span>
                              <p className="text-xs font-bold text-primary truncate group-hover/item:text-secondary">Trà Bá Tước Hoa Hồng</p>
                              <p className="text-[11px] font-bold text-secondary">140.000₫</p>
                            </div>
                          </button>

                          <button
                            className="w-full text-left p-1.5 rounded-xl hover:bg-primary-fixed-dim transition-colors flex items-center gap-2.5 cursor-pointer group/item"
                            onClick={(e) => {
                              e.stopPropagation()
                              try {
                                localStorage.setItem('explore_initial_category', 'Bánh Nướng & Viennoiserie')
                              } catch (err) {}
                              window.dispatchEvent(new CustomEvent('sweetcake_filter_category', { detail: { category: 'Bánh Nướng & Viennoiserie' } }))
                              handleNav(e, 'explore')
                            }}
                          >
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6sr1ww3fZYNJ8fP2QVl7ECqdcrKDwOnqolqWUh-UgHuPUnm67IBf-Ol0LjLpxWrUckcW813lCxabs8m21-PpPSW8aXadmDSk6tIY6eXxKJR1tNu4sRt-ZcofnnbCoFwSAe6eno7ZWdtoekCZIqLdC7upija1gpHG1sIxTccPupZvikAWilcF1apCwjSbG5q9JqUTPZ5YcGlCWmTF2jGXdB0-0h8yfcZ8QeWsPrBt9mvzH21CWQ9ZW"
                              alt="Croissant"
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-primary/20"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] bg-secondary/15 text-secondary px-1.5 py-0.5 rounded font-bold">Khai vị mặn</span>
                              <p className="text-xs font-bold text-primary truncate group-hover/item:text-secondary">Croissant Bơ Tỏi Đen</p>
                              <p className="text-[11px] font-bold text-secondary">65.000₫</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Bottom link to view full menu */}
                      <div className="col-span-2 pt-2 border-t border-primary/10 flex items-center justify-between">
                        <span className="text-[11px] text-primary/70 font-bold">Khám phá hơn 100+ mẫu bánh thủ công</span>
                        <button
                          className="text-xs font-bold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            try {
                              localStorage.setItem('explore_initial_category', 'all')
                            } catch (err) {}
                            window.dispatchEvent(new CustomEvent('sweetcake_filter_category', { detail: { category: 'all' } }))
                            handleNav(e, 'explore')
                          }}
                        >
                          <span>Xem tất cả thực đơn</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

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
              placeholder="Tìm theo tên bánh..."
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onNavigate?.('explore', { query: searchValue })
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
                  <p className="font-savoure text-lg text-primary font-bold">{user?.displayName || 'Khách'}</p>
                  <p className="text-primary/70 text-xs truncate font-bold">{user?.email || 'Chưa đăng nhập'}</p>
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
                  {roles.some((role) => ['BAKERY_OWNER', 'BAKERY_STAFF'].includes(role)) && <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'vendor-dashboard')
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-primary hover:bg-primary-fixed-dim flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">storefront</span>
                    <span>Cổng Tiệm bánh (Vendor Hub)</span>
                  </button>}

                  {roles.includes('ADMIN') && <button
                    onClick={(e) => {
                      setIsProfileMenuOpen(false)
                      handleNav(e, 'admin-dashboard')
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-extrabold text-primary hover:bg-primary-fixed-dim flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">shield_person</span>
                    <span>Quản trị viên (Master Admin)</span>
                  </button>}

                  <button
                    onClick={async () => {
                      setIsProfileMenuOpen(false)
                      try { if (user) await logout() }
                      catch { /* AuthContext exposes revocation errors on the login page. */ }
                      onNavigate?.('login')
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-error hover:bg-error-container flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>{user ? 'Đăng xuất' : 'Đăng nhập'}</span>
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
