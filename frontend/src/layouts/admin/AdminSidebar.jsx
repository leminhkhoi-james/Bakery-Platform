import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadAdminPending } from '../../services/adminSummaryService.js'
import { loadOrders } from '../../services/orderService.js'
import { demoRuntime } from '../../mockData/runtime.js'
import React from 'react'
import { simulationEnabled } from '../../mockData/business/runtime.js'
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
  pendingVendorsCount = 0,
}) {
  const pending = useCatalogResource(loadAdminPending)
  const pendingOrders = useCatalogResource(loadOrders, { scope: 'all', status: 'PENDING', page: 1, size: 1 })
  const pendingOrdersCount = pendingOrders.status === 'ready' ? pendingOrders.data?.meta.total : null
  const pendingPaymentsCount = pending.data?.payments ?? null
  const pendingVendors = pendingVendorsCount || pending.data?.bakeries || 0
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
    const cleanTab = String(t).split('?')[0].replace(/^\//, '')
    if (['admin-dashboard', 'dashboard', 'tong-quan', 'master-admin'].includes(cleanTab)) {
      return 'admin-dashboard'
    }
    if (['admin-revenue', 'revenue', 'doanh-thu'].includes(cleanTab)) {
      return 'admin-payments'
    }
    if (['admin-vendors', 'vendors', 'tiem-banh', 'duyet-xuong'].includes(cleanTab)) {
      return 'admin-vendors'
    }
    if (['admin-orders', 'orders', 'escrow', 'escrow-vault'].includes(cleanTab)) {
      return 'admin-orders'
    }
    if (['admin-payments', 'payments', 'duyet-goi', 'duyet-thanh-toan', 'duyet-mua-goi'].includes(cleanTab)) {
      return 'admin-payments'
    }
    if (['admin-plans', 'plans', 'goi-dich-vu'].includes(cleanTab)) {
      return 'admin-plans'
    }
    if (['admin-users', 'users', 'nguoi-dung'].includes(cleanTab)) {
      return 'admin-users'
    }
    return cleanTab
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
      label: 'Duyệt tiệm bánh',
      icon: 'storefront',
      badge: pendingVendors > 0 ? `${pendingVendors}` : null,
    },
    {
      id: 'admin-payments',
      route: 'admin-payments',
      label: 'Đơn mua gói',
      icon: 'receipt_long',
      badge: pendingPaymentsCount > 0 ? String(pendingPaymentsCount) : null,
    },
    {
      id: 'admin-plans',
      route: 'admin-plans',
      label: 'Gói dịch vụ',
      icon: 'workspace_premium',
    },
    {
      id: 'admin-orders',
      route: 'admin-orders',
      label: 'Đơn hàng',
      icon: 'shopping_bag',
      badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : null,
    },

    { id: 'admin-users', route: 'admin-users', label: 'Người dùng', icon: 'group' },
    { id: 'admin-moderation', route: 'admin-moderation', label: 'Kiểm duyệt nội dung', icon: 'fact_check' },
  ]

  const sidebarContent = (
    <aside className="sc-admin-sidebar w-64 h-full bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col justify-between py-4 px-2.5 select-none">
      {/* Top Branding & Main Navigation */}
      <div>
        {/* Brand Logo & Admin Badge */}
        <div className="px-2.5 mb-4">
          <div className="flex items-center justify-between">
            <BrandLogo onClick={() => handleNav('home')} />
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                aria-label="Đóng menu"
                className="md:hidden p-1 text-on-surface-variant hover:text-primary rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="material-symbols-outlined text-primary text-sm">
              verified
            </span>
            <span className="text-admin-body font-label-md font-bold text-slate-800 tracking-wide uppercase">
              ADMIN
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.filter((item) => item.id !== 'admin-users' || demoRuntime || typeof window !== 'undefined').map((item) => {
            const isActive = currentTab === item.id

            return (
              <button
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
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
          <span>Về trang chủ</span>
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
