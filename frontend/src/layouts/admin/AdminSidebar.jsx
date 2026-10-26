import React from 'react'
import BrandLogo from '../../components/common/BrandLogo'

/**
 * Unified Master Admin Sidebar
 * Design & Layout 100% identical to VendorSidebar
 */
export default function AdminSidebar({
  activeTab = 'admin-dashboard',
  onNavigate,
  isMobileOpen = false,
  onCloseMobile,
  pendingVendorsCount = 14,
}) {
  const handleNav = (route) => {
    if (onNavigate) {
      onNavigate(route)
    }
    if (onCloseMobile) {
      onCloseMobile()
    }
  }

  const normalizeTab = (t) => {
    if (!t) return 'admin-dashboard'
    if (['admin-dashboard', 'dashboard', 'tong-quan', 'master-admin'].includes(t)) {
      return 'admin-dashboard'
    }
    if (['admin-vendors', 'vendors', 'tiem-banh', 'duyet-xuong'].includes(t)) {
      return 'admin-vendors'
    }
    if (['admin-orders', 'orders', 'escrow', 'escrow-vault'].includes(t)) {
      return 'admin-orders'
    }
    if (['admin-users', 'users', 'nguoi-dung'].includes(t)) {
      return 'admin-users'
    }
    return t
  }

  const currentTab = normalizeTab(activeTab)

  const navItems = [
    {
      id: 'admin-dashboard',
      route: 'admin-dashboard',
      label: 'Tổng quan',
      icon: 'dashboard',
    },
    {
      id: 'admin-vendors',
      route: 'admin-vendors',
      label: 'Tiệm bánh',
      icon: 'storefront',
      badge: pendingVendorsCount > 0 ? `${pendingVendorsCount}` : null,
    },
    {
      id: 'admin-orders',
      route: 'admin-orders',
      label: 'Đơn hàng',
      icon: 'lock_clock',
      badge: null,
    },
    {
      id: 'admin-users',
      route: 'admin-users',
      label: 'Người dùng',
      icon: 'group',
    },
  ]

  const sidebarContent = (
    <aside className="w-64 h-full bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col justify-between py-4 px-2.5 select-none">
      {/* Top Branding & Main Navigation */}
      <div>
        {/* Brand Logo & Admin Badge */}
        <div className="px-2.5 mb-4">
          <div className="flex items-center justify-between">
            <BrandLogo onClick={() => handleNav('home')} />
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1 text-on-surface-variant hover:text-primary rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 px-2.5 py-1 rounded-xl bg-secondary-container/60 border border-secondary/20">
            <span className="material-symbols-outlined text-secondary text-sm">
              verified
            </span>
            <span className="text-admin-body font-label-md font-bold text-on-secondary-container tracking-wide uppercase">
              ADMIN
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.route)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-admin-body transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary font-semibold shadow-sm shadow-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 ${
                      isActive ? 'text-amber-200' : 'text-outline'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap text-admin-body font-medium tracking-tight truncate">
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className={`text-admin-body font-bold px-2 py-0.5 rounded-full shrink-0 ml-1.5 ${
                      isActive
                        ? 'bg-on-primary/20 text-on-primary'
                        : 'bg-secondary-fixed text-on-secondary-fixed'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Shortcuts */}
      <div className="pt-3 border-t border-outline-variant/20 space-y-1">
        <button
          onClick={() => handleNav('home')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors text-admin-body font-label-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg text-outline">
            storefront
          </span>
          <span>Marketplace</span>
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <div className="hidden md:block fixed top-0 left-0 bottom-0 z-40">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-modal-overlay backdrop-blur-xs transition-opacity"
          ></div>
          {/* Drawer content */}
          <div className="relative z-10 animate-slide-right">{sidebarContent}</div>
        </div>
      )}
    </>
  )
}
