import { ADMIN_PERIOD_METRICS, INITIAL_PENDING_BAKERIES, INITIAL_ESCROW_AUDIT_ORDERS } from '../../../mockData/admin/dashboard.js'
import { useState, useMemo } from 'react'
import AdminSidebar from '../../../layouts/admin/AdminSidebar'
import AdminHeader from '../../../layouts/admin/AdminHeader'

export const AdminDashboardPage = ({ onNavigate }) => {
  // Filtering states
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('month') // 'today' | '7days' | 'month' | 'quarter'
  const [selectedCluster, setSelectedCluster] = useState('all') // 'all' | 'hcm' | 'hn' | 'dn'
  const [searchQuery, setSearchQuery] = useState('')

  // Toast feedback
  const [toastMsg, setToastMsg] = useState(null)
  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Modal State for Vendor Verification
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false)
  const [selectedVendorForModal, setSelectedVendorForModal] = useState(null)

  // Modal State for Escrow Audit
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false)
  const [selectedOrderForEscrow, setSelectedOrderForEscrow] = useState(null)

  // Vendors state
  const [vendorQueue, setVendorQueue] = useState([
    {
      id: 1,
      name: 'Atelier De Gâteau',
      location: 'Thảo Điền, TP. Thủ Đức',
      specialty: 'Bánh cưới cao cấp Pháp',
      experience: 'Kinh nghiệm 7 năm',
      badge: 'Đạt chuẩn ATTP',
      image:
        'https://lh3.googleusercontent.com/aida/AEtjO1UmHzVt93pL6w5j9UzqGREgPi3PiEwZ4KiuKgwiKeJ8rMQQIS34ijOpBtGHIly7eaEmOqqi2MeXsmQfIl3OrOkbdUgDZuc_bUV-vfm4cSLMnwc-EbQSVTT3SHAkPuZdzuQO7__mcBu_i75DOEEwSS1eH_2iwD4eTHcFXF6KEvr58KgxO0_rNAzaYlV-PK2iLehgDSfOHkLhAqourDsButDlEEyq2o2EXMeeUeV4ojG6O5tM7UFw5KN1GvE',
      status: 'pending',
    },
    {
      id: 2,
      name: 'Sweet Mochi & Bento',
      location: 'Bình Thạnh, TP. HCM',
      specialty: 'Bento & Mini Cake',
      experience: 'Kinh nghiệm 3 năm',
      badge: 'Cần thêm ảnh bếp nướng',
      badgeType: 'warning',
      image:
        'https://lh3.googleusercontent.com/aida/AEtjO1UMavpQzOpzZX2VWjO17tVHyBL_U7c3LvWWo2SnCpdIBCLUvu__ivGOikYFjcWFrnZlNEfUNDfFdyDOXvRZurrdsV55n346G4XeD9JuIzluQ0JDzxSX4qgEACFBNEJWEQy9oZ_8XI2dazaH9UrIbbZBokHJICncGVG-_mTzlLk6YsU-tqSYpW9CJtJWwlEWnb8Hr8RSNFvp3GSwxgt-Jk9R5JcFbND6guF8XvKwpWLb8r8-IIXloL2NTA',
      status: 'pending',
    },
    {
      id: 3,
      name: 'Dark Velvet Pâtisserie',
      location: 'Quận 1, TP. HCM',
      specialty: 'Truffle Chocolate Chuyên sâu',
      experience: 'Kinh nghiệm 5 năm',
      badge: 'Chứng chỉ Le Cordon Bleu',
      image:
        'https://lh3.googleusercontent.com/aida/AEtjO1Xuu58O1Y591BJyodt5j8gpFRBi3I85x-jVHXtnOVvQsYarJpyBHKIz7gDaO76RQm_qv32W3EfmI9QrQoHQvJNRbOF0tm4eS98s1SHxp4f0dvvX4ykdiZokcN2b0Jq1Q5RRrM1GBwovtVpgXyi8iwse8zzzNIuQJ32GZ0EG1s6hMs2ZkLIgg6XIdeFqs__E7-ciWrtDyEodJPu_ma-VIweQFi7TE-UxKMBWM9BLcOT-4sUxi0up_C2ebyA',
      status: 'pending',
    },
  ])

  // High Value Escrow Orders State
  const [escrowOrders, setEscrowOrders] = useState([
    {
      id: '#ORD-2025-9982',
      customerName: 'Chị Mai Lan',
      avatar:
        'https://lh3.googleusercontent.com/aida/AEtjO1WZRjjnQUSZWO0GO2HHbYzb_pF_Cb1GouEXNwCe8hr80KU7z8gLbqNO3e3r49bcYMylM4EN5qZ5rfSHF1zUax8zf2l6gvDphlkKepCJcgJpJgnBDvnC4dR6oFg-YO8Y-lt4GcA3go2fuzEy5axSH7juE_RlDcYLmaPw_30hlnTVCtvSJ3vukYWt6WPKODHMIF2CcVCVPOAYMYqDniTJB6oVTDtxpPeUSgsrCuTo-RuHJ1fkwE4a5dmjb30',
      vendor: 'La Crème Atelier',
      cakeType: 'Bánh cưới 3 tầng hoa đường',
      amount: 5200000,
      status: 'Khóa cọc 100%',
      statusCode: 'locked',
    },
    {
      id: '#ORD-2025-9975',
      customerName: 'Anh Tuấn Kiệt',
      avatar: null,
      initials: 'TK',
      vendor: 'The Sweet Art Boutique',
      cakeType: 'AI Gen Custom Sculpture',
      amount: 3850000,
      status: 'Đang giao xe lạnh 5°C',
      statusCode: 'delivering',
    },
    {
      id: '#ORD-2025-9968',
      customerName: 'Hoàng Phương Pâtisserie',
      avatar: null,
      initials: 'HP',
      vendor: 'Maison De Mousse',
      cakeType: 'Entremet Set 12 phần',
      amount: 1450000,
      status: 'Đã giao - Chờ giải ngân',
      statusCode: 'ready_payout',
    },
    {
      id: '#ORD-2025-9954',
      customerName: 'Quang Thịnh Event Co.',
      avatar: null,
      initials: 'QT',
      vendor: 'ChocoLuxe Master',
      cakeType: 'Tháp Macaron & Tartlet Sự Kiện',
      amount: 4600000,
      status: 'Khóa cọc 100%',
      statusCode: 'locked',
    },
  ])

  // Handlers for Vendor Actions
  const handleApproveVendor = (vendorId) => {
    setVendorQueue((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, status: 'approved' } : v))
    )
    showToast('Phê duyệt xưởng bánh thành công! Cấp quyền mở gian hàng.')
  }

  const handleOpenVendorModal = (vendor) => {
    setSelectedVendorForModal(vendor)
    setIsVendorModalOpen(true)
  }

  // Handlers for Escrow Payout
  const handlePayoutOrder = (orderId) => {
    setEscrowOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: 'Đã giải ngân ví xưởng', statusCode: 'completed' } : o
      )
    )
    showToast(`Đã giải ngân thành công cho đơn ${orderId}!`)
  }

  const handleOpenEscrowAudit = (order) => {
    setSelectedOrderForEscrow(order)
    setIsEscrowModalOpen(true)
  }

  // Dynamic Filtering
  const filteredVendors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return vendorQueue.filter((v) => {
      const matchesQuery =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.specialty.toLowerCase().includes(q)

      const matchesCluster =
        selectedCluster === 'all' ||
        (selectedCluster === 'hcm' &&
          (v.location.includes('Thủ Đức') ||
            v.location.includes('Bình Thạnh') ||
            v.location.includes('Quận 1') ||
            v.location.includes('TP. HCM') ||
            v.location.includes('Hồ Chí Minh'))) ||
        (selectedCluster === 'hn' && v.location.includes('Hà Nội')) ||
        (selectedCluster === 'dn' && v.location.includes('Đà Nẵng'))

      return matchesQuery && matchesCluster
    })
  }, [vendorQueue, searchQuery, selectedCluster])

  const filteredEscrowOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return escrowOrders.filter((o) => {
      const matchesQuery =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.vendor.toLowerCase().includes(q) ||
        o.cakeType.toLowerCase().includes(q)
      return matchesQuery
    })
  }, [escrowOrders, searchQuery])

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const periodMetrics = ADMIN_PERIOD_METRICS
  const currentMetrics = periodMetrics[selectedTimePeriod] || periodMetrics.month

  return (
    <div className="min-h-screen bg-background font-body-md text-admin-body text-on-surface antialiased flex flex-col selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-8 right-8 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-secondary text-xl">
            check_circle
          </span>
          <span className="font-label-md text-admin-body font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* ================= MASTER ADMIN UNIFIED SIDEBAR ================= */}
      <AdminSidebar
        activeTab="admin-dashboard"
        onNavigate={onNavigate}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        pendingVendorsCount={14}
      />

      {/* ================= MAIN WRAPPER ================= */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* TOP FIXED ADMIN HEADER */}
        <AdminHeader
          title="Tổng quan"
          contextBadge="Admin"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCluster={selectedCluster}
          onClusterChange={setSelectedCluster}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          topActions={
            <div className="inline-flex p-1 bg-surface-container rounded-xl shadow-sm text-admin-body">
              {[
                { id: 'today', label: 'Hôm nay' },
                { id: '7days', label: '7 ngày qua' },
                { id: 'month', label: 'Tháng 10/2025' },
                { id: 'quarter', label: 'Quý này' },
              ].map((period) => (
                <button
                  key={period.id}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-admin-body transition-colors cursor-pointer ${
                    selectedTimePeriod === period.id
                      ? 'bg-primary text-on-primary font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                  onClick={() => setSelectedTimePeriod(period.id)}
                  type="button"
                >
                  {period.label}
                </button>
              ))}
              <button
                className="px-2.5 py-1.5 rounded-lg font-label-md text-admin-body text-on-surface-variant hover:text-primary transition-colors flex items-center cursor-pointer"
                onClick={() => showToast('Mở bộ lọc thời gian nâng cao')}
                type="button"
                title="Bộ lọc thời gian"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              </button>
            </div>
          }
        />

        {/* MAIN PAGE BODY */}
        <main className="relative pt-16 w-full bg-background min-h-screen pb-8">
          <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-2 space-y-3">
            {/* ================= 4 PRIMARY KPI METRIC CARDS ================= */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {/* KPI 1: DOANH THU & GMV */}
              <div
                onClick={() => onNavigate && onNavigate('admin-orders')}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-secondary/40 border border-outline-variant/20 transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer"
                title="Mở đơn hàng"
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary-fixed/20 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-admin-body uppercase tracking-wider text-secondary font-bold  flex items-center gap-1">
                      Doanh thu
                      <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                        arrow_forward
                      </span>
                    </span>
                  </div>
                  <p className="font-headline-md text-admin-metric text-primary mt-2 font-serif font-bold group-hover:text-secondary transition-colors">
                    {currentMetrics.gmv}
                  </p>
                  <p className="font-label-md text-admin-body text-on-surface-variant mt-0.5 ">
                    GMV toàn sàn
                  </p>
                </div>
                <div className="mt-4 pt-3 space-y-2 bg-surface-container-low/70 rounded-xl p-3 text-admin-body border border-outline-variant/10">
                  <div className="flex items-center justify-between text-admin-body font-body-sm">
                    <span className="text-on-surface-variant">Phí sàn (5%):</span>
                    <span className="font-bold text-primary">{currentMetrics.fee}</span>
                  </div>
                  <div className="flex items-center justify-between text-admin-body font-body-sm">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-secondary">
                        lock
                      </span>
                      Ký quỹ:
                    </span>
                    <span className="font-bold text-secondary">382.400.000₫</span>
                  </div>
                </div>

              </div>

              {/* KPI 2: ĐƠN HÀNG TOÀN SÀN */}
              <div
                onClick={() => onNavigate && onNavigate('admin-orders')}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-secondary/40 border border-outline-variant/20 transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer"
                title="Mở đơn hàng"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-admin-body uppercase tracking-wider text-secondary font-bold  flex items-center gap-1">
                      Đơn hàng
                      <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                        arrow_forward
                      </span>
                    </span>
                  </div>
                  <p className="font-headline-md text-admin-metric text-primary mt-2 font-serif font-bold group-hover:text-secondary transition-colors">
                    {currentMetrics.orders}
                  </p>
                </div>
                {/* Realtime stages */}
                <div className="mt-4 pt-3 space-y-2 bg-surface-container-low/70 rounded-xl p-3 text-admin-body border border-outline-variant/10">
                  <div className="flex justify-between items-center text-admin-body font-body-sm">
                    <span className="text-on-surface-variant">Đang xử lý:</span>
                    <span className="font-bold text-primary">186 đơn</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center font-label-sm text-admin-body pt-1">
                    <div className="bg-surface-container-highest/60 rounded p-1">
                      <p className="font-bold text-primary">32</p>
                      <p className="text-admin-body text-on-surface-variant">Chờ duyệt</p>
                    </div>
                    <div className="bg-secondary-fixed/40 rounded p-1">
                      <p className="font-bold text-secondary">54</p>
                      <p className="text-admin-body text-on-surface-variant">Baking</p>
                    </div>
                    <div className="bg-sky-100 rounded p-1">
                      <p className="font-bold text-sky-800">48</p>
                      <p className="text-admin-body text-on-surface-variant">Xe lạnh</p>
                    </div>
                    <div className="bg-emerald-100 rounded p-1">
                      <p className="font-bold text-emerald-800">52</p>
                      <p className="text-admin-body text-on-surface-variant">Đã giao</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI 3: TIỆM BÁNH ĐỐI TÁC */}
              <div
                onClick={() => onNavigate && onNavigate('admin-vendors')}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-secondary/40 border border-outline-variant/20 transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer"
                title="Mở tiệm bánh"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-admin-body uppercase tracking-wider text-secondary font-bold  flex items-center gap-1">
                      Tiệm bánh
                      <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                        arrow_forward
                      </span>
                    </span>
                  </div>
                  <p className="font-headline-md text-admin-metric text-primary mt-2 font-serif font-bold group-hover:text-secondary transition-colors">
                    348{' '}
                    <span className="font-sans text-admin-body font-normal text-on-surface-variant ">
                      tiệm
                    </span>
                  </p>
                  <p className="font-label-md text-admin-body text-on-surface-variant mt-0.5 ">
                    Đang hoạt động
                  </p>
                </div>
              </div>

              {/* KPI 4: NGƯỜI DÙNG & TÍCH CỰC */}
              <div
                onClick={() => onNavigate && onNavigate('admin-users')}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-secondary/40 border border-outline-variant/20 transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer"
                title="Mở người dùng"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-admin-body uppercase tracking-wider text-secondary font-bold  flex items-center gap-1">
                      Người dùng
                      <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                        arrow_forward
                      </span>
                    </span>
                  </div>
                  <p className="font-headline-md text-admin-metric text-primary mt-2 font-serif font-bold group-hover:text-secondary transition-colors">
                    48.920{' '}
                    <span className="font-sans text-admin-body font-normal text-on-surface-variant ">
                      tài khoản
                    </span>
                  </p>
                  <p className="font-label-md text-admin-body text-on-surface-variant mt-0.5 ">
                    Hoạt động tháng: 31.400
                  </p>
                </div>
              </div>
            </section>

            {/* ================= CATEGORY BREAKDOWN & AI CONVERSION ================= */}
            <section className="w-full">
              <div className="bg-white rounded-2xl p-7 shadow-sm border border-outline-variant/20">
                <div className="flex items-center justify-between pb-3">
                  <div>
                    <h2 className="font-headline-sm text-admin-heading text-primary font-serif">
                      Doanh thu theo danh mục
                    </h2>
                  </div>
                  <span className="material-symbols-outlined text-secondary">pie_chart</span>
                </div>

                {/* Category Progress Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                  <div>
                    <div className="flex justify-between items-center text-admin-body font-body-sm mb-1.5 ">
                      <span className="font-medium text-primary flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span> Sinh nhật &amp; Tạo hình 3D
                      </span>
                      <span className="font-bold text-primary">
                        38% <span className="text-on-surface-variant font-normal text-admin-body">(944tr)</span>
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: '38%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-admin-body font-body-sm mb-1.5 ">
                      <span className="font-medium text-primary flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span> Bánh cưới
                      </span>
                      <span className="font-bold text-primary">
                        24% <span className="text-on-surface-variant font-normal text-admin-body">(596tr)</span>
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-primary-container h-full rounded-full" style={{ width: '24%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-admin-body font-body-sm mb-1.5 ">
                      <span className="font-medium text-primary flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-secondary-container"></span> Bento
                      </span>
                      <span className="font-bold text-primary">
                        20% <span className="text-on-surface-variant font-normal text-admin-body">(497tr)</span>
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary-container h-full rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-admin-body font-body-sm mb-1.5 ">
                      <span className="font-medium text-primary flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-surface-tint"></span> Mousse &amp; bánh lạnh
                      </span>
                      <span className="font-bold text-primary">
                        18% <span className="text-on-surface-variant font-normal text-admin-body">(447tr)</span>
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-surface-tint h-full rounded-full" style={{ width: '18%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= HIGH-VALUE ORDERS & ESCROW VAULT AUDIT ================= */}
            <section className="w-full">
              <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[22px]">
                        shield_with_heart
                      </span>
                      <h2 className="font-headline-sm text-admin-heading text-primary font-serif">
                        Đơn hàng giá trị cao
                      </h2>
                    </div>
                  </div>

                </div>

                {/* Table of High-Value Orders */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="font-label-sm text-admin-body text-on-surface-variant uppercase tracking-wider bg-surface-container/80 rounded-lg ">
                        <th className="py-3 px-3.5 rounded-l-lg">Mã Đơn / Khách hàng</th>
                        <th className="py-3 px-3">Tiệm bánh</th>
                        <th className="py-3 px-3">Giá trị</th>
                        <th className="py-3 px-3">Ký quỹ</th>
                        <th className="py-3 px-3 rounded-r-lg text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high text-admin-body font-body-sm ">
                      {filteredEscrowOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-on-surface-variant">
                            Không tìm thấy đơn hàng
                          </td>
                        </tr>
                      ) : (
                        filteredEscrowOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-surface-container/50 transition-colors">
                            <td className="py-3.5 px-3.5">
                              <div className="flex items-center gap-2.5">
                                {order.avatar ? (
                                  <img
                                    alt={order.customerName}
                                    className="w-8 h-8 rounded-full object-cover"
                                    src={order.avatar}
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-admin-body">
                                    {order.initials}
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-primary">{order.id}</span>
                                  <p className="text-admin-body text-on-surface-variant">
                                    {order.customerName}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="font-medium text-primary">{order.vendor}</span>
                              <p className="text-admin-body text-on-surface-variant">
                                {order.cakeType}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 font-bold text-primary font-serif">
                              {order.amount.toLocaleString('vi-VN')}₫
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 text-admin-body px-2 py-0.5 rounded-md font-semibold ${
                                  order.statusCode === 'delivering'
                                    ? 'bg-sky-100 text-sky-800'
                                    : order.statusCode === 'ready_payout'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : order.statusCode === 'completed'
                                        ? 'bg-secondary-fixed text-on-secondary-fixed'
                                        : 'bg-secondary-fixed text-on-secondary-fixed'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[12px]">
                                  {order.statusCode === 'delivering'
                                    ? 'ac_unit'
                                    : order.statusCode === 'ready_payout'
                                      ? 'task_alt'
                                      : 'lock'}
                                </span>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              {order.statusCode === 'ready_payout' ? (
                                <button
                                  className="p-1.5 rounded-lg text-secondary hover:bg-surface-container transition-colors cursor-pointer"
                                  onClick={() => handlePayoutOrder(order.id)}
                                  title="Giải ngân ngay cho xưởng"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    paid
                                  </span>
                                </button>
                              ) : (
                                <button
                                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                  onClick={() => handleOpenEscrowAudit(order)}
                                  title="Kiểm toán giao dịch"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    verified_user
                                  </span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>


              </div>
            </section>

          </div>
        </main>
      </div>



      {/* ================= MODAL KIỂM TOÁN ESCROW VAULT ================= */}
      {isEscrowModalOpen && selectedOrderForEscrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20">
              <div className="flex flex-col">
                <span className="font-label-sm text-secondary font-bold uppercase tracking-wider text-admin-body">
                  Chi tiết ký quỹ
                </span>
                <h3 className="font-headline-sm text-primary font-bold text-admin-heading">
                  Giao dịch: {selectedOrderForEscrow.id}
                </h3>
              </div>
              <button
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface cursor-pointer"
                onClick={() => setIsEscrowModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-admin-body">
              <div className="p-4 bg-surface-container-low rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-outline">Mã giao dịch ký quỹ:</span>
                  <span className="font-mono font-bold text-primary">
                    VAULT-2025-ESCROW-{selectedOrderForEscrow.id.replace(/[^0-9]/g, '')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Khách hàng:</span>
                  <span className="font-bold text-primary">
                    {selectedOrderForEscrow.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Tiệm bánh:</span>
                  <span className="font-bold text-primary">
                    {selectedOrderForEscrow.vendor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Số tiền:</span>
                  <span className="font-bold text-secondary text-admin-body">
                    {selectedOrderForEscrow.amount.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>

              <div className="p-3 bg-secondary-fixed/30 text-on-secondary-fixed rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">lock</span>
                <span>
                  Tiền ký quỹ được chuyển cho tiệm sau khi khách nghiệm thu.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  className="px-4 py-2 rounded-xl bg-surface-container cursor-pointer"
                  onClick={() => setIsEscrowModalOpen(false)}
                >
                  Đóng
                </button>
                <button
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-secondary text-on-primary font-bold cursor-pointer"
                  onClick={() => {
                    showToast('Đã trích xuất biên lai kiểm toán mật mã SHA-256')
                    setIsEscrowModalOpen(false)
                  }}
                >
                  Xuất biên lai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
