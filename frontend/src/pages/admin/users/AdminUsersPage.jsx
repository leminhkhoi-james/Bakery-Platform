import React, { useState, useMemo } from 'react'
import AdminSidebar from '../../../layouts/admin/AdminSidebar'
import AdminHeader from '../../../layouts/admin/AdminHeader'

import { INITIAL_USERS } from '../../../mockData/admin/users.js'

export default function AdminUsersPage({ onNavigate }) {
  const [users, setUsers] = useState(INITIAL_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [spendingFilter, setSpendingFilter] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  // Modals
  const [selectedUser, setSelectedUser] = useState(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    location: 'Quận 1, TP.HCM',
    tier: 'standard',
  })

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filter & Sort Logic
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchName = u.name.toLowerCase().includes(q)
          const matchEmail = u.email.toLowerCase().includes(q)
          const matchPhone = u.phone.includes(q)
          const matchId = u.id.toLowerCase().includes(q)
          if (!matchName && !matchEmail && !matchPhone && !matchId) return false
        }
        // Tier
        if (tierFilter && u.tier !== tierFilter) {
          return false
        }
        // Status
        if (statusFilter && u.status !== statusFilter) {
          return false
        }
        // Spending Tier
        if (spendingFilter) {
          if (spendingFilter === 'under1' && u.gmv >= 1000000) return false
          if (
            spendingFilter === '1to5' &&
            (u.gmv < 1000000 || u.gmv > 5000000)
          )
            return false
          if (
            spendingFilter === '5to20' &&
            (u.gmv < 5000000 || u.gmv > 20000000)
          )
            return false
          if (spendingFilter === 'over20' && u.gmv <= 20000000) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'gmv-high') return b.gmv - a.gmv
        if (sortBy === 'trust-high') return b.trustScore - a.trustScore
        if (sortBy === 'order-recent') return b.ordersCount - a.ordersCount
        return 0 // default 'recent' keeps initial
      })
  }, [users, searchQuery, tierFilter, statusFilter, spendingFilter, sortBy])

  // Actions
  const handleToggleStatus = (userId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'suspended' ? 'active' : 'suspended'
          const newScore = newStatus === 'active' ? 85 : 42
          const newTrustLabel =
            newStatus === 'active' ? 'Đã gỡ khóa' : 'Cảnh báo rủi ro'
          showToast(
            `Đã ${newStatus === 'active' ? 'mở khóa thành công' : 'tạm khóa'
            } tài khoản ${u.name} (#${u.id})`
          )
          return {
            ...u,
            status: newStatus,
            tier: newStatus === 'active' ? 'standard' : 'suspended',
            tierLabel:
              newStatus === 'active' ? 'Standard Member' : 'Bị Tạm Khóa',
            trustScore: newScore,
            trustLabel: newTrustLabel,
          }
        }
        return u
      })
    )
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser((prev) => ({
        ...prev,
        status: prev.status === 'suspended' ? 'active' : 'suspended',
      }))
    }
  }

  const handleAddUserSubmit = (e) => {
    e.preventDefault()
    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert('Vui lòng nhập họ tên và email')
      return
    }

    const created = {
      id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || '0909 000 000',
      maskedPhone: `${newUser.phone || '0909 ••• 000'} (${newUser.location})`,
      location: newUser.location,
      avatar: null,
      avatarInitials: newUser.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      tier: newUser.tier,
      tierLabel:
        newUser.tier === 'diamond'
          ? 'Khách Doanh Nghiệp'
          : newUser.tier === 'gold'
            ? 'Khách Đặt Tiệc Sự Kiện'
            : newUser.tier === 'silver'
              ? 'Khách Cá Nhân'
              : 'Khách Hàng Mới',
      gmv: 0,
      gmvFormatted: '0 ₫',
      ordersCount: 0,
      ordersLabel: 'Chưa có đơn',
      recentCake: 'Tài khoản tạo thủ công qua Admin',
      recentDate: 'Hôm nay',
      status: 'active',
      trustScore: 90,
      trustLabel: 'Khách hàng mới',
      isStar: false,
      tasteNotes: 'Tài khoản khởi tạo bởi Quản trị viên Elena Vũ',
    }

    setUsers([created, ...users])
    setShowAddUserModal(false)
    setNewUser({
      name: '',
      email: '',
      phone: '',
      location: 'Quận 1, TP.HCM',
      tier: 'standard',
    })
    showToast(`Đã thêm người dùng mới: ${created.name} (#${created.id})`)
  }


  const handleResetFilters = () => {
    setSearchQuery('')
    setTierFilter('')
    setStatusFilter('')
    setSpendingFilter('')
    setSortBy('recent')
    showToast('Đã đặt lại tất cả bộ lọc về mặc định.')
  }

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="bg-background font-body text-body-md text-on-surface antialiased min-h-screen">
      {/* Toast Notification */}
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
        activeTab="admin-users"
        onNavigate={onNavigate}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN SHELL */}
      <div className="md:pl-72 flex-1">
        <AdminHeader
          title="Quản Lý Người Dùng & KYC"
          subtitle="Quản lý thông tin tài khoản Khách hàng, Tiệm bánh đối tác & phân quyền hệ thống"
          contextBadge="2,840 Tài khoản"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Tra cứu User, Tiệm bánh, Mã đơn #ORD..."
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* MAIN BODY CONTENT */}
        <main className="w-full pt-24 min-h-screen bg-background pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 space-y-6">
            {/* Top Section: Quick Actions */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-end gap-4 mb-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2 xl:pt-0">


                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary transition-all font-label-md text-label-md shadow-[0_8px_20px_-4px_rgba(45,30,24,0.18)] font-semibold"
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                >
                  <span className="material-symbols-outlined text-[19px] text-secondary-fixed">
                    person_add
                  </span>
                  <span>+ Thêm Người Dùng Thủ Công</span>
                </button>
              </div>
            </div>

            {/* KPI METRIC OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {/* Card 1: Tổng tài khoản hoạt động */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/20 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-label-sm uppercase tracking-widest text-on-surface-variant/80 block font-semibold text-xs">
                      Tổng tài khoản hoạt động
                    </span>
                    <span className="font-headline-md text-headline-md text-primary font-bold mt-1 block font-serif">
                      48.920
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[24px]">
                      group
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Khách Đặt Lại Thường Xuyên */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/20 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-label-sm uppercase tracking-widest text-on-surface-variant/80 block font-semibold text-xs">
                      Khách Đặt Thường Xuyên
                    </span>
                    <span className="font-headline-md text-headline-md text-primary font-bold mt-1 block font-serif">
                      6.840
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-secondary-fixed/40 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[24px]">
                      repeat
                    </span>
                  </div>
                </div>

              </div>

              {/* Card 3: Tỷ Lệ Mua Lại (Repeat) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/20 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-label-sm uppercase tracking-widest text-on-surface-variant/80 block font-semibold text-xs">
                      Tỷ Lệ Mua Lại (Repeat)
                    </span>
                    <span className="font-headline-md text-headline-md text-primary font-bold mt-1 block font-serif">
                      68.4%
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[24px]">
                      repeat
                    </span>
                  </div>
                </div>

              </div>

              {/* Card 4: Báo cáo & Tạm Khóa */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/20 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-label-sm uppercase tracking-widest text-on-surface-variant/80 block font-semibold text-xs">
                      Báo cáo & Tạm Khóa
                    </span>
                    <span className="font-headline-md text-headline-md text-error font-bold mt-1 block font-serif">
                      18
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-error-container/60 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined text-[24px]">
                      gavel
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* SMART FILTER & SEARCH TOOLBAR */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-outline-variant/20">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm rounded-xl focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary/40 transition-all font-medium"
                    placeholder="Tìm theo họ tên, email, số điện thoại, mã khách hàng (#CUST-...)"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-sm">
                        close
                      </span>
                    </button>
                  )}
                </div>

                {/* Quick Filter Selects */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Tier Filter */}
                  <div className="relative">
                    <select
                      className="appearance-none pl-3.5 pr-8 py-2.5 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-xl cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary/40 transition-all font-medium border-none shadow-sm"
                      value={tierFilter}
                      onChange={(e) => setTierFilter(e.target.value)}
                    >
                      <option value="">Phân loại: Tất cả</option>
                      <option value="diamond">Khách Doanh Nghiệp</option>
                      <option value="gold">Khách Đặt Tiệc Sự Kiện</option>
                      <option value="silver">Khách Cá Nhân</option>
                      <option value="standard">Khách Hàng Mới</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>

                  {/* Account Status Filter */}
                  <div className="relative">
                    <select
                      className="appearance-none pl-3.5 pr-8 py-2.5 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-xl cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary/40 transition-all font-medium border-none shadow-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Trạng thái: Tất cả</option>
                      <option value="active">Đang hoạt động (Active)</option>
                      <option value="suspended">Đang tạm khóa (Suspended)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>

                  {/* Spending Tier Filter */}
                  <div className="relative">
                    <select
                      className="appearance-none pl-3.5 pr-8 py-2.5 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-xl cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary/40 transition-all font-medium border-none shadow-sm"
                      value={spendingFilter}
                      onChange={(e) => setSpendingFilter(e.target.value)}
                    >
                      <option value="">Chi tiêu: Tất cả GMV</option>
                      <option value="under1">Dưới 1.000.000đ</option>
                      <option value="1to5">1.000.000đ - 5.000.000đ</option>
                      <option value="5to20">5.000.000đ - 20.000.000đ</option>
                      <option value="over20">Trên 20.000.000đ</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>

                  {/* Sorting Filter */}
                  <div className="relative">
                    <select
                      className="appearance-none pl-3.5 pr-8 py-2.5 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-xl cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary/40 transition-all font-medium border-none shadow-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="recent">Sắp xếp: Mới nhất</option>
                      <option value="gmv-high">Chi tiêu cao nhất</option>
                      <option value="order-recent">Đặt đơn gần nhất</option>
                      <option value="trust-high">Độ uy tín cao nhất</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                      sort
                    </span>
                  </div>

                  {/* Reset Button */}
                  <button
                    className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
                    title="Làm mới bộ lọc"
                    type="button"
                    onClick={handleResetFilters}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      refresh
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* LUXURY DATA TABLE CONTAINER */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-outline-variant/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-4 px-6 font-semibold">
                        Khách Hàng & Thông Tin
                      </th>

                      <th className="py-4 px-4 font-semibold text-right">
                        Tổng Đơn & GMV
                      </th>
                      <th className="py-4 px-4 font-semibold">
                        Đơn Gần Nhất & Mẫu Bánh
                      </th>
                      <th className="py-4 px-4 font-semibold">Trạng Thái</th>
                      <th className="py-4 px-4 font-semibold text-center">
                        Uy Tín Sàn
                      </th>
                      <th className="py-4 px-6 font-semibold text-right">
                        Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-body-sm font-body-sm divide-y divide-surface-container-low">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">
                            person_search
                          </span>
                          <p className="text-body-md font-semibold text-primary">
                            Không tìm thấy tài khoản nào khớp với bộ lọc
                          </p>
                          <p className="text-body-sm text-on-surface-variant mt-1">
                            Thử điều chỉnh lại từ khóa hoặc xóa bớt tiêu chí lọc.
                          </p>
                          <button
                            onClick={handleResetFilters}
                            className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
                          >
                            Xóa bộ lọc
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isSuspended = user.status === 'suspended'
                        return (
                          <tr
                            key={user.id}
                            className={`hover:bg-surface-container-low/40 transition-colors group ${isSuspended ? 'bg-error-container/5' : ''
                              }`}
                          >
                            {/* Khách Hàng & Thông Tin */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-sm border border-surface-container-high">
                                  {user.avatar ? (
                                    <img
                                      className="w-full h-full object-cover"
                                      src={user.avatar}
                                      alt={user.name}
                                    />
                                  ) : (
                                    <div
                                      className={`w-full h-full flex items-center justify-center font-headline-sm font-bold ${isSuspended
                                          ? 'bg-error-container text-error'
                                          : 'bg-surface-container-high text-primary'
                                        }`}
                                    >
                                      {user.avatarInitials ||
                                        user.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-label-lg text-label-lg font-bold text-primary group-hover:text-secondary transition-colors">
                                      {user.name}
                                    </span>
                                    <span
                                      className={`font-label-sm text-[10px] px-1.5 py-0.5 font-mono rounded ${isSuspended
                                          ? 'bg-error-container text-error'
                                          : 'bg-surface-container text-on-surface-variant'
                                        }`}
                                    >
                                      #{user.id}
                                    </span>
                                  </div>
                                  <span
                                    className={`block font-label-sm text-xs font-mono mt-0.5 ${isSuspended
                                        ? 'text-error font-medium'
                                        : 'text-outline'
                                      }`}
                                  >
                                    {user.maskedPhone}
                                  </span>
                                </div>
                              </div>
                            </td>



                            {/* Tổng Đơn & GMV */}
                            <td className="py-4 px-4 text-right">
                              <div className="font-label-lg font-bold text-primary font-serif">
                                {user.gmvFormatted}
                              </div>
                              <span
                                className={`font-label-sm text-xs ${isSuspended
                                    ? 'text-error font-medium'
                                    : 'text-secondary font-semibold'
                                  }`}
                              >
                                {user.ordersLabel}
                              </span>
                            </td>

                            {/* Đơn Gần Nhất & Mẫu Bánh */}
                            <td className="py-4 px-4">
                              <div className="max-w-[220px]">
                                <span
                                  className={`font-label-md text-xs font-semibold block truncate ${isSuspended ? 'text-error' : 'text-primary'
                                    }`}
                                >
                                  {user.recentCake}
                                </span>
                                <span
                                  className={`font-label-sm text-[11px] flex items-center gap-1 mt-0.5 ${isSuspended
                                      ? 'text-error/80'
                                      : 'text-on-surface-variant'
                                    }`}
                                >
                                  <span
                                    className={`material-symbols-outlined text-[13px] ${isSuspended ? 'text-error' : 'text-secondary'
                                      }`}
                                  >
                                    {isSuspended ? 'warning' : 'schedule'}
                                  </span>
                                  {user.recentDate}
                                </span>
                              </div>
                            </td>

                            {/* Trạng Thái */}
                            <td className="py-4 px-4">
                              {user.status === 'active' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-xs font-semibold">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-error font-label-sm text-xs font-bold">
                                  <span className="w-2 h-2 rounded-full bg-error"></span>
                                  Suspended
                                </span>
                              )}
                            </td>

                            {/* Uy Tín Sàn */}
                            <td className="py-4 px-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span
                                  className={`font-label-md text-xs font-bold ${user.trustScore >= 90
                                      ? 'text-primary'
                                      : 'text-error'
                                    }`}
                                >
                                  {user.trustScore} / 100
                                </span>
                                <span
                                  className={`font-label-sm text-[10px] font-medium ${user.trustScore >= 95
                                      ? 'text-secondary'
                                      : user.trustScore >= 90
                                        ? 'text-on-surface-variant'
                                        : 'text-error'
                                    }`}
                                >
                                  {user.trustLabel}
                                </span>
                              </div>
                            </td>

                            {/* Thao Tác */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm text-xs font-semibold transition-all"
                                  title="Xem hồ sơ chi tiết"
                                  type="button"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  Hồ sơ
                                </button>



                                <div className="relative group/menu inline-block">
                                  <button
                                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
                                    type="button"
                                    onClick={() =>
                                      handleToggleStatus(user.id)
                                    }
                                    title={
                                      isSuspended
                                        ? 'Mở khóa tài khoản'
                                        : 'Tạm khóa tài khoản'
                                    }
                                  >
                                    <span className="material-symbols-outlined text-[18px]">
                                      {isSuspended ? 'lock_reset' : 'block'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* TABLE FOOTER / PAGINATION */}
              <div className="p-4 bg-surface-container-low/40 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-container-high/60">
                {/* Status & Showing Info */}
                <div className="flex items-center gap-4">
                  <span className="font-body-sm text-xs text-on-surface-variant">
                    Hiển thị{' '}
                    <span className="font-semibold text-primary">
                      1 - {filteredUsers.length}
                    </span>{' '}
                    trong tổng số{' '}
                    <span className="font-semibold text-primary">48.920</span>{' '}
                    khách hàng
                  </span>
                  <div className="hidden md:flex items-center gap-2">
                    <span className="font-label-sm text-outline text-xs">
                      Số dòng:
                    </span>
                    <select className="bg-surface-container-lowest font-label-sm text-xs px-2.5 py-1 rounded-lg text-on-surface focus:outline-none cursor-pointer border border-surface-container-high">
                      <option value="10">10 / trang</option>
                      <option value="25">25 / trang</option>
                      <option value="50">50 / trang</option>
                    </select>
                  </div>
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    className="px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-label-sm text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-surface-container-high"
                    disabled
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px] align-middle mr-1">
                      chevron_left
                    </span>
                    Trước
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg bg-primary-container text-on-primary font-label-sm text-xs font-bold flex items-center justify-center shadow-sm"
                    type="button"
                  >
                    1
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-label-sm text-xs font-medium flex items-center justify-center transition-all border border-surface-container-high"
                    type="button"
                  >
                    2
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-label-sm text-xs font-medium flex items-center justify-center transition-all border border-surface-container-high"
                    type="button"
                  >
                    3
                  </button>
                  <span className="px-1 text-outline font-label-sm text-xs">
                    ...
                  </span>
                  <button
                    className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-label-sm text-xs font-medium flex items-center justify-center transition-all border border-surface-container-high"
                    type="button"
                  >
                    489
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-sm text-xs transition-all border border-surface-container-high font-medium"
                    type="button"
                  >
                    Tiếp theo
                    <span className="material-symbols-outlined text-[16px] align-middle ml-1">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CHI TIẾT HỒ SƠ NGƯỜI DÙNG & KIỂM ĐỊNH LỊCH SỬ    */}
      {/* ========================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in duration-200 border border-secondary/20">
            {/* Modal Header */}
            <div className="p-6 bg-primary-container text-on-primary flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-md bg-surface-container">
                  {selectedUser.avatar ? (
                    <img
                      className="w-full h-full object-cover"
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xl text-primary bg-surface-container-high">
                      {selectedUser.avatarInitials}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline-sm text-xl font-bold font-serif">
                      {selectedUser.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface-container-lowest/20 font-mono">
                      #{selectedUser.id}
                    </span>
                  </div>
                  <p className="text-body-sm text-secondary-fixed text-xs mt-0.5">
                    {selectedUser.phone} • {selectedUser.location}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Metrics strip */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-surface-container rounded-2xl">
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Tổng chi tiêu GMV
                  </p>
                  <p className="font-headline-sm text-lg font-bold text-primary font-serif mt-0.5">
                    {selectedUser.gmvFormatted}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Đơn hàng hoàn tất
                  </p>
                  <p className="font-headline-sm text-lg font-bold text-secondary font-serif mt-0.5">
                    {selectedUser.ordersCount} đơn
                  </p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Điểm uy tín Escrow
                  </p>
                  <p className="font-headline-sm text-lg font-bold text-emerald-700 font-serif mt-0.5">
                    {selectedUser.trustScore} / 100
                  </p>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-surface-container-high text-body-sm">
                  <span className="text-on-surface-variant">Phân loại khách hàng:</span>
                  <span className="font-bold text-primary px-3 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs">
                    {selectedUser.tierLabel}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-container-high text-body-sm">
                  <span className="text-on-surface-variant">Địa chỉ mặc định:</span>
                  <span className="font-medium text-primary">
                    {selectedUser.location}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-container-high text-body-sm">
                  <span className="text-on-surface-variant">Đơn bánh gần nhất:</span>
                  <span className="font-medium text-secondary">
                    {selectedUser.recentCake} ({selectedUser.recentDate})
                  </span>
                </div>
                <div className="py-2 text-body-sm">
                  <span className="text-on-surface-variant block mb-1">
                    Ghi chú khẩu vị & Hành vi:
                  </span>
                  <div className="p-3 bg-surface-container rounded-xl text-primary font-medium text-xs">
                    {selectedUser.tasteNotes}
                  </div>
                </div>
              </div>

              {/* Action Buttons inside Modal */}
              <div className="flex items-center justify-between pt-3 gap-3 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleStatus(selectedUser.id)
                  }}
                  className={`px-4 py-2.5 rounded-xl font-label-md text-xs font-bold transition-all ${selectedUser.status === 'suspended'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-error-container hover:bg-error text-on-error-container hover:text-white'
                    }`}
                >
                  {selectedUser.status === 'suspended'
                    ? 'Mở Khóa Tài Khoản Này'
                    : 'Tạm Khóa Tài Khoản (Vi Phạm)'}
                </button>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-secondary font-label-md text-xs font-bold"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: THÊM NGƯỜI DÙNG THỦ CÔNG                         */}
      {/* ========================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in duration-200 border border-secondary/20">
            <div className="p-6 bg-primary-container text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[20px]">
                    person_add
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-lg font-bold font-serif">
                    Thêm Người Dùng Thủ Công
                  </h3>
                  <p className="text-body-sm text-secondary-fixed text-xs">
                    Khởi tạo tài khoản khách hàng hoặc thành viên trực tiếp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                  Họ và tên khách hàng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Phương Linh"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                    Địa chỉ Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="linh.nguyen@gmail.com"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0908 123 456"
                    value={newUser.phone}
                    onChange={(e) =>
                      setNewUser({ ...newUser, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                  Khu vực giao tiệc
                </label>
                <select
                  value={newUser.location}
                  onChange={(e) =>
                    setNewUser({ ...newUser, location: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary/40 cursor-pointer"
                >
                  <option value="Quận 1, TP.HCM">Quận 1, TP.HCM</option>
                  <option value="Quận 3, TP.HCM">Quận 3, TP.HCM</option>
                  <option value="Quận 7, TP.HCM">Quận 7, TP.HCM</option>
                  <option value="Thủ Đức, TP.HCM">Thủ Đức, TP.HCM</option>
                  <option value="Tây Hồ, Hà Nội">Tây Hồ, Hà Nội</option>
                  <option value="Hoàn Kiếm, Hà Nội">Hoàn Kiếm, Hà Nội</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-secondary text-xs font-bold shadow-md"
                >
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ========================================================= */}
      {/* MODAL 4: BỘ LỌC NÂNG CAO                                 */}
      {/* ========================================================= */}
      {showAdvancedFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in duration-200 border border-secondary/20">
            <div className="p-5 bg-primary-container text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary-fixed text-lg">
                  tune
                </span>
                <h3 className="font-headline-sm text-base font-bold font-serif">
                  Bộ Lọc Nâng Cao Khách Hàng
                </h3>
              </div>
              <button
                onClick={() => setShowAdvancedFilterModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-body-sm">
              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Độ uy tín tối thiểu
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="90"
                  className="w-full accent-secondary"
                />
                <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
                  <span>0 (Tất cả)</span>
                  <span>50 (Trung bình)</span>
                  <span className="font-bold text-secondary">
                    90+ (Bảo chứng an toàn)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Số đơn hoàn tất tối thiểu
                </label>
                <select className="w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-xs">
                  <option value="any">Bất kỳ số lượng đơn</option>
                  <option value="1">Ít nhất 1 đơn</option>
                  <option value="5">Từ 5 đơn trở lên</option>
                  <option value="10">Từ 10 đơn trở lên</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Khu vực giao bánh tập trung
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-surface-container rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-secondary" />
                    <span>TP. Hồ Chí Minh</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface-container rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-secondary" />
                    <span>Hà Nội</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface-container rounded-lg cursor-pointer">
                    <input type="checkbox" className="accent-secondary" />
                    <span>Đà Nẵng</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface-container rounded-lg cursor-pointer">
                    <input type="checkbox" className="accent-secondary" />
                    <span>Cần Thơ</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilterModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high text-xs font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Đã áp dụng bộ lọc nâng cao.')
                    setShowAdvancedFilterModal(false)
                  }}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-secondary"
                >
                  Áp Dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
