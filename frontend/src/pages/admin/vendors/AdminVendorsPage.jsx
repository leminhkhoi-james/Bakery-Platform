import React, { useState, useMemo } from 'react'
import AdminSidebar from '../../../layouts/admin/AdminSidebar'
import AdminHeader from '../../../layouts/admin/AdminHeader'

import { INITIAL_VENDORS } from '../../../mockData/admin/vendors.js'

export default function AdminVendorsPage({ onNavigate }) {
  const [vendors, setVendors] = useState(INITIAL_VENDORS)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'active' | 'pending' | 'needs_info' | 'suspended'
  const [searchQuery, setSearchQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')

  // Slide-over Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedVendorForDrawer, setSelectedVendorForDrawer] = useState(null)

  // Rate Config Modal
  const [selectedVendorForFee, setSelectedVendorForFee] = useState(null)
  const [newFeeRate, setNewFeeRate] = useState('5.0%')

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteData, setInviteData] = useState({
    name: '',
    chef: '',
    phone: '',
    email: '',
    specialty: 'Bánh Cưới Haute Couture',
    location: 'Quận 1, TP.HCM',
  })

  // Toast
  const [toastMessage, setToastMessage] = useState(null)
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filtered list
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      // Tab filter
      if (activeTab === 'active' && v.status !== 'active') return false
      if (activeTab === 'pending' && v.status !== 'pending') return false
      if (activeTab === 'needs_info' && v.status !== 'needs_info') return false
      if (activeTab === 'suspended' && v.status !== 'suspended') return false

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = v.name.toLowerCase().includes(q)
        const matchChef = v.chef.toLowerCase().includes(q)
        const matchId = v.id.toLowerCase().includes(q)
        if (!matchName && !matchChef && !matchId) return false
      }

      // Region
      if (regionFilter && v.district !== regionFilter) return false

      // Specialty
      if (specialtyFilter && v.categoryType !== specialtyFilter) return false

      return true
    })
  }, [vendors, activeTab, searchQuery, regionFilter, specialtyFilter])

  const handleOpenDrawer = (vendor) => {
    setSelectedVendorForDrawer(vendor)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
  }

  const handleApproveVendor = (vendorId) => {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? {
            ...v,
            status: 'active',
            statusLabel: 'Đang mở lò',
            isUrgent: false,
            verified: true,
          }
          : v
      )
    )
    handleCloseDrawer()
    showToast(`Phê duyệt thành công! Xưởng bánh #${vendorId} đã được kích hoạt gian hàng trên sàn.`)
  }

  const handleReAuditVendor = (vendorId) => {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? {
            ...v,
            status: 'needs_info',
            statusLabel: 'Yêu cầu thẩm tra lại',
          }
          : v
      )
    )
    handleCloseDrawer()
    showToast(`Đã gửi thông báo kiểm tra thực địa bổ sung cho Thanh tra Sweet Cake đối với #${vendorId}!`)
  }

  const handleToggleLock = (vendorId) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          const newStatus = v.status === 'suspended' ? 'active' : 'suspended'
          const label = newStatus === 'active' ? 'Đang mở lò' : 'Tạm ngưng nhận đơn'
          showToast(
            `Đã ${newStatus === 'active' ? 'mở khóa lại lò bánh' : 'tạm ngưng nhận đơn'} cho #${vendorId} (${v.name})`
          )
          return {
            ...v,
            status: newStatus,
            statusLabel: label,
          }
        }
        return v
      })
    )
  }

  const handleSaveFeeRate = (e) => {
    e.preventDefault()
    if (!selectedVendorForFee) return
    setVendors((prev) =>
      prev.map((v) =>
        v.id === selectedVendorForFee.id ? { ...v, takeRate: newFeeRate } : v
      )
    )
    showToast(`Đã cập nhật biểu phí sàn ${newFeeRate} cho ${selectedVendorForFee.name}`)
    setSelectedVendorForFee(null)
  }

  const handleInviteSubmit = (e) => {
    e.preventDefault()
    if (!inviteData.name.trim() || !inviteData.phone.trim()) {
      alert('Vui lòng nhập tên tiệm và số điện thoại')
      return
    }

    const created = {
      id: `VEND-${Math.floor(100 + Math.random() * 900)}`,
      name: inviteData.name,
      chef: inviteData.chef || 'Bếp trưởng đại diện',
      location: inviteData.location,
      district: 'q1',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBZuHJdgD9s_TE5RWxEokJ5CIukWpDBXpbMZ7tbrbYR-ICJSKehtgQ0SfDAcHx2dqormBHk6uZyje3vsiGEu1uNATAuyJi_Q9f1RkdAwV9dWVMrgU6o5pu8eXDIzghYloQunt4q0bSwCepWk_btyEKhSkCbWcv4SvV9RuoDv1wT-DXpOENx-kR-vAESuUOXnXPCnM9CYIF5NeWNDGUAFd7PkAHYLcbBHf72i8wFHk-Xwe2UOS7Gn7BC',
      categoryTag: inviteData.specialty,
      specialty: inviteData.specialty,
      categoryType: 'couture',
      legalBadge: 'Chờ nộp hồ sơ ATTP',
      certification: 'Thư mời gửi qua SMS/Email',
      revenueFormatted: 'Chưa kích hoạt',
      revenueNum: 0,
      ordersCount: 0,
      rating: 'Mới',
      slaOnTime: 'Chưa kiểm định',
      cancellationRate: '0.0%',
      status: 'pending',
      statusLabel: 'Chờ duyệt hồ sơ',
      isUrgent: false,
      verified: false,
      takeRate: '5.0%',
      escrowDeposit: '15.000.000đ',
      inspectionPhotos: [],
    }

    setVendors([created, ...vendors])
    setShowInviteModal(false)
    setInviteData({
      name: '',
      chef: '',
      phone: '',
      email: '',
      specialty: 'Bánh Cưới Haute Couture',
      location: 'Quận 1, TP.HCM',
    })
    showToast(`Đã gửi thư mời và khởi tạo hồ sơ cho xưởng ${created.name} (#${created.id})`)
  }

  const handleResetFilters = () => {
    setActiveTab('all')
    setSearchQuery('')
    setRegionFilter('')
    setSpecialtyFilter('')
    showToast('Đã đặt lại tất cả bộ lọc về mặc định.')
  }
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="bg-background font-body text-body-md text-on-surface antialiased min-h-screen">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-secondary/40 animate-bounce">
          <span className="material-symbols-outlined text-secondary-fixed text-xl">
            check_circle
          </span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* UNIFIED ADMIN SIDEBAR */}
      <AdminSidebar
        activeTab="admin-vendors"
        onNavigate={onNavigate}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN SHELL */}
      <div className="md:pl-72 flex-1">
        <AdminHeader
          title="Duyệt Tiệm Bánh & Thẩm Định"
          subtitle="Thẩm định chứng nhận ATTP, tiêu chuẩn xưởng & cấp phép đối tác"
          contextBadge="14 chờ duyệt"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Tra cứu User, Tiệm bánh, Mã đơn #ORD..."
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* MAIN BODY CONTENT */}
        <main className="w-full pt-24 min-h-screen bg-background pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 space-y-6">
            {/* Top Command & Action Section */}
            <section className="flex flex-col xl:flex-row xl:items-center justify-end gap-6 pb-2">
              <div className="flex flex-wrap items-center gap-3">


                <button
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary text-on-secondary hover:bg-on-secondary-container transition-all shadow-md font-label-lg text-label-lg font-semibold relative text-xs"
                  onClick={() => {
                    const urgent = vendors.find((v) => v.id === 'VEND-88') || vendors[1]
                    handleOpenDrawer(urgent)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    verified
                  </span>
                  <span>Duyệt Hồ Sơ Đang Chờ (14)</span>
                  <span className="w-2 h-2 rounded-full bg-surface-bright animate-ping"></span>
                </button>

                <button
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-primary-container text-primary-fixed hover:bg-primary transition-all shadow-md font-label-lg text-label-lg font-semibold text-xs"
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
                    add_business
                  </span>
                  <span>+ Mời Tiệm Bánh Mới</span>
                </button>
              </div>
            </section>

            {/* KPI METRIC BENTO CARDS */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
              {/* Metric 1 */}
              <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 border border-outline-variant/20">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                    Tổng Tiệm Hoạt Động
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">
                      storefront
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display-lg text-display-lg text-primary leading-none tracking-tight font-serif font-bold">
                    348
                  </span>
                  <span className="font-label-md text-xs text-secondary font-semibold ml-1">
                    tiệm
                  </span>
                </div>

                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-secondary-fixed/20 pointer-events-none blur-2xl"></div>
              </div>

              {/* Metric 2 */}
              <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 border border-outline-variant/20">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                    Thẩm Định Chờ Duyệt
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-[20px]">
                      pending_actions
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display-lg text-display-lg text-secondary leading-none tracking-tight font-serif font-bold">
                    14
                  </span>
                  <span className="font-label-md text-xs text-on-surface-variant font-medium ml-1">
                    xưởng nộp
                  </span>
                </div>

                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-error-container/30 pointer-events-none blur-2xl"></div>
              </div>

              {/* Metric 3 */}
              <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 border border-outline-variant/20">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                    Chuẩn 5 Sao Pâtisserie
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">
                      hotel_class
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display-lg text-display-lg text-primary leading-none tracking-tight font-serif font-bold">
                    92.0
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary leading-none font-bold">
                    %
                  </span>
                </div>

                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-secondary-container/20 pointer-events-none blur-2xl"></div>
              </div>

              {/* Metric 4 */}
              <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 border border-outline-variant/20">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                    Giao Đúng Hạn Chuẩn Lạnh
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">
                      ac_unit
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display-lg text-display-lg text-primary leading-none tracking-tight font-serif font-bold">
                    99.1
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary leading-none font-bold">
                    %
                  </span>
                </div>

                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-surface-variant pointer-events-none blur-2xl"></div>
              </div>
            </section>

            {/* FILTER & TAB WORKSPACE AREA */}
            <section className="space-y-4 pb-6">
              {/* Status Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-full font-label-md text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${activeTab === 'all'
                    ? 'bg-primary-container text-on-primary font-bold'
                    : 'bg-white border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                >
                  Tất Cả Tiệm (348)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 rounded-full font-label-md text-xs font-semibold whitespace-nowrap transition-all ${activeTab === 'active'
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'bg-white border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                >
                  Đang Hoạt Động (324)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 rounded-full font-label-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === 'pending'
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'bg-white border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                >
                  <span>Chờ Phê Duyệt / Thẩm Định</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-secondary text-on-secondary font-bold">
                    14
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('needs_info')}
                  className={`px-4 py-2 rounded-full font-label-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === 'needs_info'
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'bg-white border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                >
                  <span>Cần Bổ Sung Giấy Tờ</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-error-container text-on-error-container font-bold">
                    7
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('suspended')}
                  className={`px-4 py-2 rounded-full font-label-md text-xs font-semibold whitespace-nowrap transition-all ${activeTab === 'suspended'
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'bg-white border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                >
                  Tạm Ngưng Nhận Đơn (3)
                </button>
              </div>

              {/* Filter Control Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
                {/* Search Input */}
                <div className="md:col-span-5 relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-sm text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary/40 transition-all font-medium border-none shadow-sm"
                    placeholder="Tìm theo tên tiệm, Bếp trưởng đại diện, #VEND-..., SĐT..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-xs">
                        close
                      </span>
                    </button>
                  )}
                </div>

                {/* Region Select */}
                <div className="md:col-span-3">
                  <select
                    className="w-full px-3 py-2 bg-surface-container-lowest text-on-surface font-label-md text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary/40 transition-all cursor-pointer font-medium border-none shadow-sm"
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                  >
                    <option value="">Tất cả khu vực (TP.HCM & Hà Nội)</option>
                    <option value="q1">Quận 1, TP.HCM</option>
                    <option value="q2">Quận 2 Thảo Điền, TP.HCM</option>
                    <option value="q3">Quận 3, TP.HCM</option>
                    <option value="bt">Bình Thạnh, TP.HCM</option>
                    <option value="q7">Quận 7 Phú Mỹ Hưng, TP.HCM</option>
                  </select>
                </div>

                {/* Specialization Filter */}
                <div className="md:col-span-3">
                  <select
                    className="w-full px-3 py-2 bg-surface-container-lowest text-on-surface font-label-md text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary/40 transition-all cursor-pointer font-medium border-none shadow-sm"
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                  >
                    <option value="">Tất cả chuyên môn pâtisserie</option>
                    <option value="couture">Bánh Cưới Haute Couture</option>
                    <option value="ai-3d">Bánh Kem AI 3D & Fondant</option>
                    <option value="french">Mousse & Bánh Lạnh Pháp</option>
                    <option value="korean">Bento Studio Hàn Quốc</option>
                    <option value="macaron">Tháp Macaron & Tiệc Sự Kiện</option>
                  </select>
                </div>

                {/* Quick Action Reset */}
                <div className="md:col-span-1 flex items-center justify-center">
                  <button
                    className="w-full h-full py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors"
                    title="Đặt lại bộ lọc"
                    type="button"
                    onClick={handleResetFilters}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      filter_alt_off
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* DETAILED VENDOR TABLE */}
            <section className="w-full overflow-hidden rounded-2xl bg-white shadow-sm mb-8 border border-outline-variant/20">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-xs uppercase tracking-wider">
                      <th className="py-3 px-6 font-semibold">
                        Xưởng Bánh & Thương Hiệu
                      </th>
                      <th className="py-3 px-4 font-semibold">
                        Phân Loại & Chuyên Môn
                      </th>
                      <th className="py-3 px-4 font-semibold">
                        Hồ Sơ Pháp Lý & ATTP
                      </th>
                      <th className="py-3 px-4 font-semibold text-right">
                        Doanh Số Tháng
                      </th>
                      <th className="py-3 px-4 font-semibold text-center">
                        Tỷ Lệ SLA
                      </th>
                      <th className="py-3 px-4 font-semibold">Trạng Thái</th>
                      <th className="py-3 px-6 font-semibold text-center">
                        Hành Động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low text-body-sm font-body-sm">
                    {filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">
                            store_mall_directory
                          </span>
                          <p className="text-body-md font-semibold text-primary">
                            Không tìm thấy xưởng bánh nào khớp với bộ lọc
                          </p>
                          <button
                            onClick={handleResetFilters}
                            className="mt-3 px-4 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-secondary"
                          >
                            Xóa bộ lọc
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((vendor) => {
                        const isPending = vendor.status === 'pending'
                        const isNeedsInfo = vendor.status === 'needs_info'
                        const isSuspended = vendor.status === 'suspended'

                        return (
                          <tr
                            key={vendor.id}
                            className={`transition-colors ${isPending
                              ? 'bg-secondary-fixed/20 hover:bg-secondary-fixed/30'
                              : isSuspended
                                ? 'bg-error-container/5 hover:bg-error-container/10'
                                : 'hover:bg-surface-container-low/60'
                              }`}
                          >
                            {/* Xưởng Bánh & Thương Hiệu */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0 border border-surface-container-high"
                                  src={vendor.image}
                                  alt={vendor.name}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-headline-sm text-sm font-bold text-primary truncate font-serif">
                                      {vendor.name}
                                    </span>
                                    {vendor.verified && (
                                      <span
                                        className="material-symbols-outlined text-[16px] text-secondary shrink-0"
                                        title="Đã xác minh chính chủ"
                                      >
                                        verified
                                      </span>
                                    )}
                                    {vendor.isUrgent && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary text-on-secondary uppercase shrink-0">
                                        Gấp
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 font-label-sm text-xs text-on-surface-variant">
                                    <span className="text-secondary font-semibold font-mono">
                                      #{vendor.id}
                                    </span>
                                    <span>•</span>
                                    <span className="truncate">
                                      {vendor.chef} • {vendor.location}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Phân Loại & Chuyên Môn */}
                            <td className="py-4 px-4">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full font-label-sm text-[11px] font-semibold mb-1 ${vendor.categoryType === 'couture'
                                  ? 'bg-primary-fixed text-on-primary-fixed'
                                  : vendor.categoryType === 'french'
                                    ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                                    : vendor.categoryType === 'macaron'
                                      ? 'bg-secondary-fixed text-on-secondary-fixed'
                                      : 'bg-surface-container-high text-on-surface'
                                  }`}
                              >
                                {vendor.categoryTag}
                              </span>
                              <div className="font-body-sm text-xs text-on-surface-variant">
                                {vendor.specialty}
                              </div>
                            </td>

                            {/* Hồ Sơ Pháp Lý & ATTP */}
                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label-sm text-[11px] font-semibold ${isNeedsInfo
                                    ? 'bg-error-container text-on-error-container'
                                    : 'bg-secondary-fixed text-on-secondary-fixed'
                                    }`}
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    {isNeedsInfo
                                      ? 'warning'
                                      : vendor.verified
                                        ? 'task_alt'
                                        : 'health_and_safety'}
                                  </span>
                                  <span>{vendor.legalBadge}</span>
                                </span>
                                <span
                                  className={`font-label-sm text-[11px] ${isNeedsInfo
                                    ? 'text-error font-semibold'
                                    : 'text-on-surface-variant'
                                    }`}
                                >
                                  {vendor.certification}
                                </span>
                              </div>
                            </td>

                            {/* Doanh Số Tháng */}
                            <td className="py-4 px-4 text-right">
                              <div className="font-label-lg text-sm font-bold text-primary font-serif">
                                {vendor.revenueFormatted}
                              </div>
                              <div className="font-label-sm text-xs text-on-surface-variant flex items-center justify-end gap-1">
                                {vendor.ordersCount > 0 ? (
                                  <>
                                    <span>{vendor.ordersCount} đơn</span>
                                    <span>•</span>
                                    <span className="text-secondary font-semibold">
                                      {vendor.rating}
                                    </span>
                                  </>
                                ) : (
                                  <span>{vendor.cancellationRate}</span>
                                )}
                              </div>
                            </td>

                            {/* Tỷ Lệ SLA */}
                            <td className="py-4 px-4 text-center">
                              {vendor.ordersCount > 0 ? (
                                <>
                                  <div className="font-label-md text-xs font-semibold text-primary">
                                    {vendor.slaOnTime}
                                  </div>
                                  <div className="font-label-sm text-[11px] text-on-surface-variant">
                                    {vendor.cancellationRate}
                                  </div>
                                </>
                              ) : (
                                <span className="font-label-sm text-[11px] px-2 py-0.5 rounded bg-surface-container font-medium text-on-surface-variant">
                                  {vendor.slaOnTime}
                                </span>
                              )}
                            </td>

                            {/* Trạng Thái */}
                            <td className="py-4 px-4">
                              {vendor.status === 'active' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-xs font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                  <span>{vendor.statusLabel}</span>
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-xs font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                                  <span>{vendor.statusLabel}</span>
                                </span>
                              ) : isNeedsInfo ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-xs font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                                  <span>{vendor.statusLabel}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-error font-label-sm text-xs font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                  <span>{vendor.statusLabel}</span>
                                </span>
                              )}
                            </td>

                            {/* Hành Động */}
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {isPending ? (
                                  <>
                                    <button
                                      className="px-2.5 py-1 rounded-lg bg-secondary text-on-secondary hover:bg-on-secondary-container transition-all font-label-sm text-xs font-semibold shadow-sm"
                                      onClick={() => handleApproveVendor(vendor.id)}
                                      type="button"
                                    >
                                      {vendor.id === 'VEND-92'
                                        ? 'Duyệt Mở Sàn'
                                        : 'Phê Duyệt Ngay'}
                                    </button>
                                    <button
                                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                                      onClick={() => handleOpenDrawer(vendor)}
                                      title="Xem hồ sơ pháp lý"
                                      type="button"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        visibility
                                      </span>
                                    </button>
                                  </>
                                ) : isNeedsInfo ? (
                                  <>
                                    <button
                                      className="px-2.5 py-1 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high transition-all font-label-sm text-xs font-semibold"
                                      type="button"
                                      onClick={() =>
                                        showToast(`Đã gửi SMS yêu cầu bổ sung ảnh bếp cho ${vendor.name}`)
                                      }
                                    >
                                      Gửi Yêu Cầu
                                    </button>
                                    <button
                                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                                      onClick={() => handleOpenDrawer(vendor)}
                                      type="button"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        drafts
                                      </span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                                      onClick={() => handleOpenDrawer(vendor)}
                                      title="Xem chi tiết bếp nướng"
                                      type="button"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        soup_kitchen
                                      </span>
                                    </button>
                                    <button
                                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                                      title="Cấu hình biểu phí sàn"
                                      type="button"
                                      onClick={() => {
                                        setSelectedVendorForFee(vendor)
                                        setNewFeeRate(vendor.takeRate)
                                      }}
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        percent
                                      </span>
                                    </button>
                                    <button
                                      className={`p-1.5 rounded-lg transition-colors ${isSuspended
                                        ? 'hover:bg-emerald-100 text-emerald-700'
                                        : 'text-on-surface-variant hover:bg-error-container hover:text-error'
                                        }`}
                                      title={
                                        isSuspended
                                          ? 'Mở lò hoạt động lại'
                                          : 'Tạm khóa lò bánh'
                                      }
                                      type="button"
                                      onClick={() => handleToggleLock(vendor.id)}
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        {isSuspended ? 'lock_open' : 'lock'}
                                      </span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION & SUMMARY FOOTER */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-surface-container-low border-t border-surface-container-high/60">
                <div className="font-body-sm text-xs text-on-surface-variant">
                  Hiển thị{' '}
                  <span className="font-semibold text-on-surface">
                    1 - {filteredVendors.length}
                  </span>{' '}
                  trên tổng số{' '}
                  <span className="font-semibold text-on-surface">348</span>{' '}
                  xưởng bánh toàn quốc
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    disabled
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_left
                    </span>
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg bg-primary-container text-on-primary font-label-sm text-xs font-semibold"
                    type="button"
                  >
                    1
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-label-sm text-xs font-semibold transition-colors"
                    type="button"
                  >
                    2
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-label-sm text-xs font-semibold transition-colors"
                    type="button"
                  >
                    3
                  </button>
                  <span className="px-1 text-outline font-label-sm text-xs">
                    ...
                  </span>
                  <button
                    className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-label-sm text-xs font-semibold transition-colors"
                    type="button"
                  >
                    58
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* SLIDE-OVER INSPECTION DRAWER (#vendorDrawer)              */}
      {/* ========================================================= */}
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 transition-opacity"
            onClick={handleCloseDrawer}
          ></div>

          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-surface-container-lowest shadow-2xl z-50 overflow-y-auto flex flex-col justify-between border-l border-secondary/20 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 bg-surface-container-low flex items-start justify-between shrink-0 border-b border-surface-container-high">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-xs font-semibold">
                    Thẩm Định Thực Tế Bếp
                  </span>
                  <span className="text-secondary font-label-sm text-xs font-bold font-mono">
                    #{selectedVendorForDrawer?.id}
                  </span>
                </div>
                <h2 className="font-headline-md text-xl text-primary font-serif font-bold">
                  {selectedVendorForDrawer?.name}
                </h2>
                <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                  {selectedVendorForDrawer?.location} • Hồ sơ xin mở gian hàng bánh
                  cưới cao cấp
                </p>
              </div>
              <button
                className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                onClick={handleCloseDrawer}
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">
                  close
                </span>
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="p-6 space-y-6 flex-1 text-body-sm">
              {/* Section: Visual Verification Photos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-headline-sm text-base text-primary font-bold font-serif">
                    Ảnh Kiểm Định Cơ Sở & Lò Nướng
                  </h3>
                  <span className="font-label-sm text-xs text-secondary font-medium">
                    Chụp GPS & Timestamp 2 giờ trước
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative rounded-2xl overflow-hidden group shadow-sm bg-surface-container border border-surface-container-high">
                    <img
                      className="w-full h-44 object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrd6k8AxdXIpcvUew_MOuWPXERmixyGoGEMSbfRrr2D_NjHNcEfpwO6YmdXvHeBa1Z2RngGb9XmrNj0ZOGL3sN-FAYCvXwCJJKfU7Yp8EabBcjG9dEXYq4nYAN23G4LYhRnmY1pXcqZzK_SmfHOwjKhFKTwsm8fdLQNSiVRu6hg9u1GLpNlwMR4ddt5aAHza-WulOSntXT0apE-cvO0trXucNDl7cTwV9HkUHIgfK-5Y15ik_vKmN4"
                      alt="Buồng Nướng Công Nghiệp"
                    />
                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-on-primary font-label-md text-xs font-semibold">
                      Buồng Nướng Công Nghiệp
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary/80 backdrop-blur-md text-on-primary font-label-sm text-[10px]">
                      Lò Salva Tây Ban Nha
                    </div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden group shadow-sm bg-surface-container border border-surface-container-high">
                    <img
                      className="w-full h-44 object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZg77AfnTaX4peI3YynMee-I-DcrPyvFY3H0GoucHiBopkRC1ptttt5oVT3RVJOBA00DkaxeO9qQplvKHjruVLhzIzJ6dwM5Sigxpwx88ezXEfuOevJrCBs8nUjDJ7EyNiWtBbBGIO0Ymr-iWlU7u9TJDRdfbfWzdkbBfkUt6gKDvLSSJzQJNFJSvLzbsU6TXlzXAbAeXx-FHC4Bdf7kDCHXhK8Vudtd8z21EMQ9vDUfR6eN1W0Hc0"
                      alt="Phòng Lạnh Ráp Bánh Cưới"
                    />
                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-on-primary font-label-md text-xs font-semibold">
                      Phòng Lạnh Ráp Bánh Cưới
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary/80 backdrop-blur-md text-on-primary font-label-sm text-[10px]">
                      Buồng lạnh 16°C
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Compliance Checklist */}
              <div className="space-y-3">
                <h3 className="font-headline-sm text-base text-primary font-bold font-serif">
                  Danh Sách Tiêu Chuẩn Thẩm Định
                </h3>
                <div className="space-y-2">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/60">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        verified
                      </span>
                      <div>
                        <div className="font-label-md text-xs text-on-surface font-bold">
                          Giấy Chứng Nhận Cơ Sở Đủ Điều Kiện ATTP
                        </div>
                        <div className="font-body-sm text-[11px] text-on-surface-variant">
                          Cấp bởi Ban Quản lý ATTP TP.HCM • Còn hạn đến 11/2026
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-xs font-bold">
                      Hợp lệ 100%
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/60">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        verified
                      </span>
                      <div>
                        <div className="font-label-md text-xs text-on-surface font-bold">
                          Bằng Cấp Bếp Trưởng Điều Hành
                        </div>
                        <div className="font-body-sm text-[11px] text-on-surface-variant">
                          Diplôme de Pâtisserie • Chef Monique (Paris)
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-xs font-bold">
                      Đã xác minh
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/60">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        check_circle
                      </span>
                      <div>
                        <div className="font-label-md text-xs text-on-surface font-bold">
                          Quy Trình Kiểm Soát Thùng Lạnh Giao Hàng
                        </div>
                        <div className="font-body-sm text-[11px] text-on-surface-variant">
                          Thiết bị giám sát nhiệt độ IoT gắn trong thùng giao bánh cưới
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-xs font-bold">
                      Đã cấu hình
                    </span>
                  </div>
                </div>
              </div>

              {/* Section: Take Rate & Escrow Agreement */}
              <div className="p-4 rounded-2xl bg-surface-container space-y-2 border border-surface-container-high">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-xs font-bold text-primary">
                    Biểu Phí Sàn & Ký Quỹ Escrow
                  </span>
                  <span className="font-label-sm text-xs text-secondary font-bold font-mono">
                    Standard Tier: {selectedVendorForDrawer?.takeRate || '5.0%'}
                  </span>
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Tiệm đã đồng ý giữ khoản ký quỹ cam kết chất lượng{' '}
                  <strong className="text-primary">
                    {selectedVendorForDrawer?.escrowDeposit || '15.000.000đ'}
                  </strong>{' '}
                  trong Escrow Vault Sweet Cake nhằm đảm bảo không trễ giờ tiệc
                  cưới của khách hàng.
                </p>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 bg-surface-container-low flex items-center justify-end gap-3 shrink-0 border-t border-surface-container-high">
              <button
                className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-lg text-xs font-semibold"
                onClick={handleCloseDrawer}
                type="button"
              >
                Đóng Xem Thử
              </button>
              <button
                className="px-4 py-2.5 rounded-xl bg-error-container text-on-error-container hover:opacity-90 transition-opacity font-label-lg text-xs font-semibold"
                onClick={() =>
                  handleReAuditVendor(selectedVendorForDrawer?.id)
                }
                type="button"
              >
                Yêu Cầu Thẩm Tra Lại
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-lg text-xs font-bold shadow-md"
                onClick={() =>
                  handleApproveVendor(selectedVendorForDrawer?.id)
                }
                type="button"
              >
                Phê Duyệt Mở Sàn Ngay
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* MODAL: MỜI TIỆM BÁNH MỚI                                  */}
      {/* ========================================================= */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in duration-200 border border-secondary/20">
            <div className="p-6 bg-primary-container text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[20px]">
                    add_business
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-lg font-bold font-serif">
                    Mời Tiệm Bánh Đối Tác Mới
                  </h3>
                  <p className="text-body-sm text-secondary-fixed text-xs">
                    Gửi thư mời gia nhập mạng lưới Haute Pâtisserie
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4 text-body-sm">
              <div>
                <label className="block text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                  Tên thương hiệu tiệm / Xưởng bánh *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Maison Des Fleurs Pâtisserie"
                  value={inviteData.name}
                  onChange={(e) =>
                    setInviteData({ ...inviteData, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-secondary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                    Bếp trưởng đại diện
                  </label>
                  <input
                    type="text"
                    placeholder="Chef Pierre / Minh"
                    value={inviteData.chef}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, chef: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-secondary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                    Số điện thoại liên hệ *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    value={inviteData.phone}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-secondary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                    Chuyên môn chính
                  </label>
                  <select
                    value={inviteData.specialty}
                    onChange={(e) =>
                      setInviteData({
                        ...inviteData,
                        specialty: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-secondary/40 cursor-pointer"
                  >
                    <option value="Bánh Cưới Haute Couture">
                      Bánh Cưới Haute Couture
                    </option>
                    <option value="AI Custom 3D & Fondant">
                      AI Custom 3D & Fondant
                    </option>
                    <option value="Mousse & Bánh Lạnh Pháp">
                      Mousse & Bánh Lạnh Pháp
                    </option>
                    <option value="Bento Studio Hàn Quốc">
                      Bento Studio Hàn Quốc
                    </option>
                    <option value="Tháp Macaron & Tiệc Sự Kiện">
                      Tháp Macaron & Tiệc Sự Kiện
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                    Khu vực xưởng bánh
                  </label>
                  <input
                    type="text"
                    placeholder="Quận 1, TP.HCM"
                    value={inviteData.location}
                    onChange={(e) =>
                      setInviteData({
                        ...inviteData,
                        location: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-secondary/40"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-secondary text-xs font-bold shadow-md"
                >
                  Gửi Thư Mời & Khởi Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CẤU HÌNH BIỂU PHÍ SÀN (TAKE RATE)                  */}
      {/* ========================================================= */}
      {selectedVendorForFee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in duration-200 border border-secondary/20">
            <div className="p-5 bg-primary-container text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary-fixed text-lg">
                  percent
                </span>
                <h3 className="font-headline-sm text-base font-bold font-serif">
                  Cấu Hình Biểu Phí Sàn
                </h3>
              </div>
              <button
                onClick={() => setSelectedVendorForFee(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveFeeRate} className="p-5 space-y-4 text-body-sm">
              <div>
                <p className="font-bold text-primary text-sm">
                  {selectedVendorForFee.name}
                </p>
                <p className="text-xs text-on-surface-variant font-mono">
                  Mã đối tác: #{selectedVendorForFee.id}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Mức phí sàn áp dụng (Net Take Rate)
                </label>
                <select
                  value={newFeeRate}
                  onChange={(e) => setNewFeeRate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-xs focus:outline-none"
                >
                  <option value="3.5%">3.5% (Ưu đãi Đối tác Chiến lược)</option>
                  <option value="5.0%">5.0% (Mặc định Tiêu chuẩn Toàn sàn)</option>
                  <option value="6.5%">6.5% (Gói Hỗ trợ Marketing Cao Cấp)</option>
                  <option value="8.0%">8.0% (Bao trọn Giao hàng Xe lạnh)</option>
                </select>
              </div>

              <div className="p-3 bg-surface-container rounded-xl text-[11px] text-on-surface-variant leading-relaxed">
                Biểu phí sẽ áp dụng tự động trong Escrow Vault khi khách hàng
                chốt thanh toán các đơn hàng mới của tiệm.
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setSelectedVendorForFee(null)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high text-xs font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-secondary"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
