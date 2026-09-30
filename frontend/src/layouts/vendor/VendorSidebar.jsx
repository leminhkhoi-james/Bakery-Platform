import React from 'react'
import BrandLogo from '../../components/common/BrandLogo'
import { VENDOR_NAV_ITEMS } from '../../mockData/shared/navigation.js'

/**
 * Unified Vendor Partner Hub Sidebar
 * Standardized across all 7 Vendor pages
 */
export default function VendorSidebar({
  activeTab = 'dashboard',
  onNavigate,
  isMobileOpen = false,
  onCloseMobile,
  rfqCount = 4,
}) {
  const handleNav = (route) => {
    if (onNavigate) {
      onNavigate(route)
    }
    if (onCloseMobile) {
      onCloseMobile()
    }
  }

  const sidebarContent = (
    <aside className="w-72 h-full bg-[#fbf9f5] border-r border-outline-variant/20 flex flex-col justify-between py-6 px-4 select-none">
      {/* Top Branding & Main Navigation */}
      <div>
        {/* Brand Logo & Baker Portal Badge */}
        <div className="px-3 mb-8">
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
          <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-xl bg-secondary-fixed/30 border border-secondary/20">
            <span className="material-symbols-outlined text-secondary text-sm">
              verified
            </span>
            <span className="text-xs font-label-md font-bold text-on-secondary-fixed tracking-wide">
              XƯỞNG BÁNH ĐỐI TÁC
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {VENDOR_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            const badgeText =
              item.badgeKey === 'rfqCount'
                ? rfqCount > 0
                  ? `${rfqCount}${item.badgeSuffix || ''}`
                  : null
                : item.badge

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.route)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-label-lg text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary font-bold shadow-md shadow-primary/10'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-xl ${
                      isActive ? 'text-secondary' : 'text-outline'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {badgeText && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-on-primary/20 text-on-primary'
                        : 'bg-secondary-fixed text-on-secondary-fixed'
                    }`}
                  >
                    {badgeText}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Shortcuts: Switch to Customer Marketplace & Help */}
      <div className="pt-4 border-t border-outline-variant/20 space-y-2">
        <button
          onClick={() => handleNav('home')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors text-sm font-label-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg text-outline">
            storefront
          </span>
          <span>Xem Marketplace Khách</span>
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
            className="fixed inset-0 bg-primary/40 backdrop-blur-xs transition-opacity"
          ></div>
          {/* Drawer content */}
          <div className="relative z-10 animate-slide-right">{sidebarContent}</div>
        </div>
      )}
    </>
  )
}
