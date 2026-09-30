import React, { useState } from 'react'
import { VENDOR_HEADER_NOTIFICATIONS } from '../../mockData/shared/navigation.js'

/**
 * Unified Vendor Partner Hub Header / Topbar
 * Standardized across all 7 Vendor pages
 */
export default function VendorHeader({
  title = 'Kênh Đối Tác',
  subtitle,
  contextBadge,
  backButton,
  actions,
  isReceivingOrders = true,
  onToggleReceiving,
  onNavigate,
  onToggleMobileSidebar,
  showToast,
}) {
  const [notificationCount] = useState(VENDOR_HEADER_NOTIFICATIONS.unreadCount)

  const handleNotificationClick = () => {
    if (showToast) {
      showToast(VENDOR_HEADER_NOTIFICATIONS.summary)
    }
  }

  return (
    <header className="fixed top-0 left-0 md:left-72 right-0 h-20 bg-[#fbf9f5]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,30,24,0.04)] z-30 border-b border-outline-variant/20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left Section: Mobile toggle, Back button, Title & Subtitle */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          title="Mở menu điều hướng"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        {/* Optional Back Button */}
        {backButton && (
          <button
            onClick={backButton.onClick}
            className="flex items-center gap-1 text-sm font-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-surface-container shrink-0"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="hidden sm:inline">{backButton.label || 'Quay lại'}</span>
          </button>
        )}

        {/* Title Group */}
        <div className="truncate">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-headline-sm text-lg sm:text-xl font-bold text-primary truncate">
              {title}
            </h1>
            {contextBadge && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-label-md font-semibold bg-secondary-fixed/40 text-on-secondary-fixed border border-secondary/20 shrink-0">
                {contextBadge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="font-body-sm text-xs text-outline hidden sm:block truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Section: Kitchen Status, Notifications, Actions, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Custom Actions (passed from specific pages) */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Store Receiving Orders Toggle */}
        <button
          onClick={onToggleReceiving}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-label-md font-semibold transition-all cursor-pointer ${
            isReceivingOrders
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-amber-50 border-amber-300 text-amber-800'
          }`}
          title="Bật / Tắt trạng thái nhận đơn mới cho tiệm"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isReceivingOrders ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          ></span>
          <span className="hidden lg:inline">
            {isReceivingOrders ? 'Đang mở lò nhận đơn' : 'Tạm ngưng nhận đơn'}
          </span>
          <span className="lg:hidden">{isReceivingOrders ? 'Mở lò' : 'Ngưng'}</span>
        </button>

        {/* Notifications Icon Button */}
        <button
          onClick={handleNotificationClick}
          className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors relative cursor-pointer"
          title="Thông báo mới từ sàn"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-surface"></span>
          )}
        </button>

        {/* Baker Quick Profile Avatar */}
        <div
          onClick={() => onNavigate && onNavigate('vendor-profile')}
          className="flex items-center gap-2 pl-2 border-l border-outline-variant/30 cursor-pointer group"
          title="Cài đặt thông tin tiệm bánh"
        >
          <img
            src="https://lh3.googleusercontent.com/aida/AEtjO1UW-Pqje1qQ27WocOmEF6z8uQbX4Pu7dER_Li586FmA7D-SZPtELbM4diNLey0TATd7BWeyBRVp0BJyiwRQ_Yj2o8ZvjU1gga_5DYXFHmRARECApBa-Pknbu-F_C4RsJvPsxZur94CVef_-mhMUtBA5pqCBm39qRgn4zALShBi4iNWkPvOaQa9bTIcfaPbq4eDVHCaFKq1lgnsEbgULw4G-0rsbYDlzqjGcSoKiajpNsUeCjPnRs_qaS3o"
            alt="La Crème Pâtisserie"
            className="w-8 h-8 rounded-full object-cover border border-secondary/40 group-hover:scale-105 transition-transform"
          />
          <div className="hidden xl:block text-left leading-tight">
            <p className="font-label-md text-xs font-bold text-primary group-hover:text-secondary transition-colors">
              La Crème Pâtisserie
            </p>
            <p className="font-body-sm text-[11px] text-outline">Bếp Trưởng Jean-Luc</p>
          </div>
        </div>
      </div>
    </header>
  )
}
