import React, { useState } from 'react'

/**
 * Unified Master Admin Header / Topbar
 * Standardized across all Admin pages, 100% identical to VendorHeader
 */
export default function AdminHeader({
  title = 'Trung Tâm Điều Hành Master Admin',
  subtitle,
  contextBadge,
  backButton,
  actions,
  showSearch = true,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Tra cứu User, Tiệm bánh, Mã đơn #ORD...',
  selectedCluster,
  onClusterChange,
  onToggleMobileSidebar,
}) {
  const [internalCluster, setInternalCluster] = useState('all')
  const cluster = selectedCluster !== undefined ? selectedCluster : internalCluster

  const handleClusterChange = (val) => {
    if (onClusterChange) {
      onClusterChange(val)
    } else {
      setInternalCluster(val)
    }
  }

  return (
    <header className="fixed top-0 left-0 md:left-72 right-0 h-20 bg-[#fbf9f5]/90 backdrop-blur-xl z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-[0_1px_8px_rgba(45,30,24,0.04)] border-b border-outline-variant/20 gap-3">
      {/* Left Section: Mobile toggle, Back button, Title & Subtitle */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Button */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer shrink-0"
            title="Mở menu điều hướng"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        )}

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

      {/* Right Section: Search / Actions, Cluster Filter, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search bar if enabled */}
        {showSearch && onSearchChange && (
          <div className="relative hidden md:block w-48 lg:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              className="w-full pl-9 pr-8 py-2 bg-surface-container-low border-none rounded-xl font-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary/40 transition-all text-xs"
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              type="text"
              value={searchQuery}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
        )}

        {/* Cluster Filter */}
        {onClusterChange && (
          <div className="hidden lg:flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-xl shrink-0">
            <span className="material-symbols-outlined text-secondary text-[16px]">
              near_me
            </span>
            <select
              className="bg-transparent border-none font-label-md text-on-surface-variant focus:outline-none cursor-pointer text-xs"
              onChange={(e) => handleClusterChange(e.target.value)}
              value={cluster}
            >
              <option value="all">Toàn quốc</option>
              <option value="hcm">TP. Hồ Chí Minh</option>
              <option value="hn">Hà Nội</option>
              <option value="dn">Đà Nẵng</option>
            </select>
          </div>
        )}

        {/* Custom Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* System Notifications Icon Button */}
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors relative cursor-pointer"
          title="Thông báo hệ thống"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-surface"></span>
        </button>

        {/* Admin Quick Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/30">
          <div className="relative ring-2 ring-rose-400/40 rounded-full p-0.5">
            <img
              alt="Elena Vũ - Super Administrator"
              className="w-8 h-8 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WZRjjnQUSZWO0GO2HHbYzb_pF_Cb1GouEXNwCe8hr80KU7z8gLbqNO3e3r49bcYMylM4EN5qZ5rfSHF1zUax8zf2l6gvDphlkKepCJcgJpJgnBDvnC4dR6oFg-YO8Y-lt4GcA3go2fuzEy5axSH7juE_RlDcYLmaPw_30hlnTVCtvSJ3vukYWt6WPKODHMIF2CcVCVPOAYMYqDniTJB6oVTDtxpPeUSgsrCuTo-RuHJ1fkwE4a5dmjb30"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface"></span>
          </div>
          <div className="hidden xl:block text-left leading-tight">
            <p className="font-label-md text-xs font-bold text-primary">Elena Vũ</p>
            <p className="font-body-sm text-[11px] text-rose-700 font-semibold">
              Super Admin
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

