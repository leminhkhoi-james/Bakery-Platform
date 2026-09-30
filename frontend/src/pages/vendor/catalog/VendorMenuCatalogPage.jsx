import { INITIAL_VENDOR_CAKES } from '../../../mockData/vendor/catalog.js'
import { useState, useMemo } from 'react'
import VendorSidebar from '../../../layouts/vendor/VendorSidebar'
import VendorHeader from '../../../layouts/vendor/VendorHeader'

export const VendorMenuCatalogPage = ({ onNavigate }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  // Active sidebar tab
  const [activeSidebarTab, setActiveSidebarTab] = useState('thuc-don-va-mau-banh')

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPrepTime, setSelectedPrepTime] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [currentPageNum, setCurrentPageNum] = useState(1)

  // Cake Catalog Data State
  const [cakes, setCakes] = useState(INITIAL_VENDOR_CAKES)

  // Slide-over Drawer Edit State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingCake, setEditingCake] = useState(cakes[0])

  // Drawer form fields
  const [formTitle, setFormTitle] = useState(editingCake.title)
  const [formCategory, setFormCategory] = useState(editingCake.category)
  const [formFlavor, setFormFlavor] = useState(editingCake.flavor)
  const [formSweetness, setFormSweetness] = useState(editingCake.sweetness)
  const [formSizes, setFormSizes] = useState(editingCake.sizes)
  const [formComplimentary, setFormComplimentary] = useState(editingCake.complimentaryGift)
  const [formCalligraphy, setFormCalligraphy] = useState(editingCake.freeCalligraphy)
  const [formFlowers, setFormFlowers] = useState(editingCake.freshFlowersAddon)

  // Toast Feedback
  const [toastMsg, setToastMsg] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Open Drawer for Edit
  const handleOpenEditDrawer = (cake) => {
    setEditingCake(cake)
    setFormTitle(cake.title)
    setFormCategory(cake.category)
    setFormFlavor(cake.flavor)
    setFormSweetness(cake.sweetness)
    setFormSizes([...cake.sizes])
    setFormComplimentary(cake.complimentaryGift)
    setFormCalligraphy(cake.freeCalligraphy)
    setFormFlowers(cake.freshFlowersAddon)
    setIsDrawerOpen(true)
  }

  // Open Drawer for Create
  const handleOpenCreateDrawer = () => {
    const newSku = `#CK-NEW-${Date.now().toString().slice(-4)}`
    const newBlankCake = {
      id: newSku,
      title: 'Mẫu bánh nghệ thuật mới',
      category: 'Bánh sinh nhật nghệ thuật',
      badge: 'Mới',
      isTop1: false,
      description: 'Mô tả nguyên liệu tươi ngon và công thức làm bánh độc quyền.',
      flavor: 'Cốt Chiffon, kem tươi Mascarpone',
      sweetness: '30%',
      prepTimeText: 'Lấy liền 2 giờ',
      prepTimeDetail: 'Có sẵn nguyên liệu',
      prepTimeCategory: 'express',
      rating: 5.0,
      reviewsCount: 0,
      soldCount: 0,
      isOpenForSale: true,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC2vTjST00JoGOfuB7fysakDrOlVo4cniHVNrmzoSQii6cAG3hnCwMY3m833KB8JgELcxuRZBgtC-b34lfugTaq8eXe0dynZz8oLiJ5guXtXPnAYqPalWoWcmKNUiBZmoIrDtrPQKy3Hp7y8Qea-aNxxVWfcYRzKZ3BTKHG6JGHLepouI6uMSmG1_ZMq6-NUbT3_WHuWIWx3zRTPOu7H8pT9bEcs2pF3vbVUuo8J1ZaQ0Z3Imx5a7sB',
      sizes: [
        { label: '14cm (2-4 pax)', price: 420000, cost: 130000, margin: '69.0%' },
        { label: '16cm (4-6 pax)', price: 480000, cost: 148000, margin: '69.2%', isPopular: true },
      ],
      complimentaryGift: true,
      freeCalligraphy: true,
      freshFlowersAddon: false,
    }
    handleOpenEditDrawer(newBlankCake)
  }

  // Save Drawer changes
  const handleSaveDrawer = () => {
    setCakes((prev) => {
      const exists = prev.some((c) => c.id === editingCake.id)
      if (exists) {
        return prev.map((c) =>
          c.id === editingCake.id
            ? {
              ...c,
              title: formTitle,
              category: formCategory,
              flavor: formFlavor,
              sweetness: formSweetness,
              sizes: formSizes,
              complimentaryGift: formComplimentary,
              freeCalligraphy: formCalligraphy,
              freshFlowersAddon: formFlowers,
            }
            : c
        )
      } else {
        return [
          {
            ...editingCake,
            title: formTitle,
            category: formCategory,
            flavor: formFlavor,
            sweetness: formSweetness,
            sizes: formSizes,
            complimentaryGift: formComplimentary,
            freeCalligraphy: formCalligraphy,
            freshFlowersAddon: formFlowers,
          },
          ...prev,
        ]
      }
    })
    setIsDrawerOpen(false)
    showToast(`Đã lưu và đồng bộ mẫu bánh "${formTitle}" lên sàn Sweet Cake!`)
  }

  // Toggle open for sale
  const handleToggleSale = (cakeId) => {
    setCakes((prev) =>
      prev.map((c) => {
        if (c.id === cakeId) {
          const nextState = !c.isOpenForSale
          showToast(
            nextState
              ? `Mẫu bánh "${c.title}" đã mở bán trở lại trên sàn!`
              : `Mẫu bánh "${c.title}" đã được tạm ẩn khỏi sàn.`
          )
          return { ...c, isOpenForSale: nextState }
        }
        return c
      })
    )
  }

  // Clone cake
  const handleCloneCake = (cake) => {
    const cloned = {
      ...cake,
      id: `${cake.id}-COPY`,
      title: `${cake.title} (Bản sao)`,
      badge: 'Bản sao',
      isTop1: false,
      soldCount: 0,
      reviewsCount: 0,
    }
    setCakes((prev) => [cloned, ...prev])
    showToast(`Đã nhân bản mẫu "${cake.title}" thành "${cloned.title}"!`)
  }

  // Delete cake
  const handleDeleteCake = (cakeId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mẫu bánh này khỏi thực đơn?')) {
      setCakes((prev) => prev.filter((c) => c.id !== cakeId))
      showToast('Đã xóa mẫu bánh khỏi catalog.')
    }
  }

  // Filter and Sort Logic
  const filteredCakes = useMemo(() => {
    return cakes.filter((c) => {
      // Search
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.flavor.toLowerCase().includes(searchQuery.toLowerCase())

      // Status
      const matchStatus =
        selectedStatus === 'all'
          ? true
          : selectedStatus === 'open'
            ? c.isOpenForSale
            : selectedStatus === 'paused'
              ? !c.isOpenForSale
              : true

      // Prep Time
      const matchPrep =
        selectedPrepTime === 'all'
          ? true
          : selectedPrepTime === 'express'
            ? c.prepTimeCategory === 'express'
            : selectedPrepTime === 'same-day'
              ? c.prepTimeCategory === 'same-day'
              : true

      // Category
      const matchCategory =
        selectedCategory === 'all'
          ? true
          : c.category.toLowerCase().includes(selectedCategory.toLowerCase())

      return matchSearch && matchStatus && matchPrep && matchCategory
    })
  }, [cakes, searchQuery, selectedStatus, selectedPrepTime, selectedCategory])

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-secondary text-xl">
            check_circle
          </span>
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* VENDOR FIXED SIDEBAR */}
      <VendorSidebar
        activeTab="menu"
        onNavigate={onNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* TOPBAR HEADER */}
      <VendorHeader
        title="Mẫu Bánh Tiệm"
        subtitle="Quản lý thực đơn bánh nướng, giá cốt, kích cỡ & mở bán trên sàn"
        contextBadge={`${cakes.length} mẫu bánh`}
        onNavigate={onNavigate}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        showToast={showToast}
        actions={
          <button
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-on-primary font-bold text-xs shadow-xs transition-colors cursor-pointer"
            onClick={handleOpenCreateDrawer}
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            <span className="hidden sm:inline">+ Tạo mẫu bánh mới</span>
            <span className="sm:hidden">+ Mẫu mới</span>
          </button>
        }
      />

      {/* MAIN BODY CONTENT */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        <main className="relative pt-24 w-full bg-surface min-h-screen pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-space-md flex flex-col gap-space-lg">

            {/* HEADER TITLE & GLOBAL ACTIONS */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-xs text-secondary font-label-sm text-label-sm uppercase tracking-widest text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">
                    menu_book
                  </span>
                  <span>Catalog &amp; Formula Management</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight text-2xl sm:text-3xl">
                  Quản lý Thực đơn &amp; Mẫu bánh thủ công
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl text-xs sm:text-sm">
                  Quản lý danh sách mẫu bánh signature, cấu hình kích thước (size), giá niêm yết, thời gian nướng chuẩn bị và kích hoạt hiển thị trực tiếp trên sàn Sweet Cake.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center flex-wrap gap-space-sm shrink-0">
                <button
                  className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg text-label-lg shadow-sm transition-all text-xs cursor-pointer border border-outline-variant/30"
                  onClick={() => showToast('Đã đồng bộ kiểm tra kho nguyên liệu trứng, bơ và Mascarpone!')}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    sync
                  </span>
                  <span>Đồng bộ nguyên liệu</span>
                </button>

                <button
                  className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-lg text-label-lg shadow-[0_8px_24px_-4px_rgba(45,30,24,0.18)] transition-all text-xs cursor-pointer font-bold"
                  onClick={handleOpenCreateDrawer}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    add_circle
                  </span>
                  <span>+ Thêm mẫu bánh mới</span>
                </button>
              </div>
            </div>

            {/* OVERVIEW METRIC KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
              {/* KPI 1 */}
              <div className="p-space-md rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] flex flex-col justify-between gap-space-md transition-all hover:shadow-[0_12px_28px_-6px_rgba(45,30,24,0.08)] border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline text-xs">
                    Tổng mẫu bánh Catalog
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">
                      cake
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg text-primary text-3xl font-bold">
                    {cakes.length}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant text-xs">
                    mẫu bánh
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-secondary text-xs">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span className="font-body-sm text-body-sm font-medium">
                    {cakes.filter((c) => c.isOpenForSale).length} mẫu đang mở bán trực tuyến
                  </span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="p-space-md rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] flex flex-col justify-between gap-space-md transition-all hover:shadow-[0_12px_28px_-6px_rgba(45,30,24,0.08)] border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline text-xs">
                    Bán chạy nhất tuần qua
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">
                      local_fire_department
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-primary truncate text-base font-bold">
                    Velvet Raspberry Bliss
                  </span>
                  <span className="font-label-md text-label-md text-secondary font-semibold text-xs">
                    64 đơn hoàn tất
                  </span>
                </div>
                <div className="flex items-center gap-1 text-outline text-xs">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    trending_up
                  </span>
                  <span className="font-body-sm text-body-sm">
                    +18% so với tuần trước
                  </span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="p-space-md rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] flex flex-col justify-between gap-space-md transition-all hover:shadow-[0_12px_28px_-6px_rgba(45,30,24,0.08)] border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline text-xs">
                    Mẫu bánh Custom Base
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">
                      palette
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg text-primary text-3xl font-bold">
                    12
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant text-xs">
                    mẫu phối AI
                  </span>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    auto_fix_high
                  </span>
                  <span className="font-body-sm text-body-sm">
                    Sẵn sàng cá nhân hóa ảnh vẽ
                  </span>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="p-space-md rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] flex flex-col justify-between gap-space-md transition-all hover:shadow-[0_12px_28px_-6px_rgba(45,30,24,0.08)] border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline text-xs">
                    Tạm hết nguyên liệu / Ẩn
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">
                      inventory_2
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg text-error text-3xl font-bold">
                    0{cakes.filter((c) => !c.isOpenForSale).length}
                  </span>
                  <span className="font-label-md text-label-md text-error font-medium text-xs">
                    mẫu tạm ẩn
                  </span>
                </div>
                <div className="flex items-center gap-1 text-error text-xs">
                  <span className="material-symbols-outlined text-[16px]">
                    info
                  </span>
                  <span className="font-body-sm text-body-sm truncate">
                    Cần nhập mâm xôi &amp; Mascarpone
                  </span>
                </div>
              </div>
            </div>

            {/* FILTER & SEARCH BAR PANEL */}
            <div className="p-space-md rounded-2xl bg-surface-container-lowest shadow-[0_4px_16px_rgba(45,30,24,0.03)] flex flex-col gap-space-md border border-outline-variant/20">
              {/* Search and Dropdowns row */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-space-md">
                {/* Search Box */}
                <div className="relative w-full lg:w-96">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all placeholder:text-outline text-xs"
                    placeholder="Tìm theo tên bánh, mã SKU (#CK-...), hương vị..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter Selects */}
                <div className="flex flex-wrap items-center gap-space-sm w-full lg:w-auto justify-start lg:justify-end text-xs">
                  {/* Status filter */}
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md border border-outline-variant/20">
                    <span className="text-outline">Trạng thái:</span>
                    <select
                      className="bg-transparent text-primary font-semibold focus:outline-none cursor-pointer text-xs"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="open">Đang mở bán ({cakes.filter((c) => c.isOpenForSale).length})</option>
                      <option value="paused">Hết nguyên liệu ({cakes.filter((c) => !c.isOpenForSale).length})</option>
                    </select>
                  </div>

                  {/* Prep time filter */}
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md border border-outline-variant/20">
                    <span className="text-outline">Thời gian chuẩn bị:</span>
                    <select
                      className="bg-transparent text-primary font-semibold focus:outline-none cursor-pointer text-xs"
                      value={selectedPrepTime}
                      onChange={(e) => setSelectedPrepTime(e.target.value)}
                    >
                      <option value="all">Tất cả thời gian</option>
                      <option value="express">Lấy liền 2 giờ (Express)</option>
                      <option value="same-day">Trong ngày 4h - 6h</option>
                    </select>
                  </div>

                  {/* Sort filter */}
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md border border-outline-variant/20">
                    <span className="text-outline">Sắp xếp:</span>
                    <select
                      className="bg-transparent text-primary font-semibold focus:outline-none cursor-pointer text-xs"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="popular">Phổ biến nhất</option>
                      <option value="sales">Doanh số cao → thấp</option>
                      <option value="price">Giá bán tăng dần</option>
                      <option value="recent">Mới cập nhật</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Categories Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-nowrap text-xs">
                {[
                  { id: 'all', label: `Tất cả danh mục (${cakes.length})` },
                  { id: 'sinh nhật', label: 'Bánh sinh nhật nghệ thuật (14)' },
                  { id: 'mousse', label: 'Bánh Mousse & Entremet (8)' },
                  { id: 'cưới', label: 'Bánh cưới Haute Couture (4)' },
                  { id: 'bento', label: 'Bento Cake tối giản Hàn Quốc (6)' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-colors cursor-pointer text-xs ${selectedCategory === cat.id
                        ? 'bg-primary text-on-primary font-medium shadow-sm'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                      }`}
                    onClick={() => setSelectedCategory(cat.id)}
                    type="button"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MASTER CAKE CATALOG TABLE */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_32px_rgba(45,30,24,0.04)] overflow-hidden border border-outline-variant/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/70 text-outline font-label-sm text-label-sm uppercase tracking-wider text-xs border-b border-outline-variant/20">
                      <th className="py-4 px-space-md">Mẫu Bánh &amp; Danh Mục</th>
                      <th className="py-4 px-space-md">Cấu hình Size &amp; Đơn Giá</th>
                      <th className="py-4 px-space-md">Thời gian làm bánh</th>
                      <th className="py-4 px-space-md">Đã Bán</th>
                      <th className="py-4 px-space-md text-center">Trạng thái sàn</th>
                      <th className="py-4 px-space-md text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container font-body-md text-body-md text-on-surface text-xs">
                    {filteredCakes.length === 0 ? (
                      <tr>
                        <td className="p-8 text-center text-on-surface-variant" colSpan={6}>
                          Không tìm thấy mẫu bánh nào phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      filteredCakes.map((cake) => (
                        <tr
                          key={cake.id}
                          className={`hover:bg-surface-container-low/40 transition-colors group ${!cake.isOpenForSale ? 'bg-surface-container-low/20 opacity-80' : ''
                            }`}
                        >
                          {/* Col 1: Name & Visual */}
                          <td className="py-space-md px-space-md">
                            <div className="flex items-center gap-space-md">
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-sm shrink-0 bg-surface-container">
                                <img
                                  alt={cake.title}
                                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!cake.isOpenForSale ? 'grayscale group-hover:grayscale-0' : ''
                                    }`}
                                  src={cake.image}
                                />
                                {cake.isTop1 && (
                                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-secondary text-on-secondary font-label-sm text-[10px] font-bold uppercase">
                                    Top 1
                                  </span>
                                )}
                                {!cake.isOpenForSale && (
                                  <span className="absolute inset-0 bg-primary/40 flex items-center justify-center font-label-sm text-[10px] text-surface font-semibold text-center px-1">
                                    {cake.badge || 'Tạm ngưng'}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-headline-sm text-[16px] font-bold transition-colors ${!cake.isOpenForSale
                                        ? 'text-on-surface-variant line-through'
                                        : 'text-primary group-hover:text-secondary'
                                      }`}
                                  >
                                    {cake.title}
                                  </span>
                                  {cake.badge && cake.isOpenForSale && (
                                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[10px] font-semibold">
                                      {cake.badge}
                                    </span>
                                  )}
                                </div>
                                <span className="font-label-sm text-label-sm text-outline font-mono text-[11px]">
                                  {cake.id}
                                </span>
                                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5 text-xs">
                                  {cake.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Sizes & Pricing */}
                          <td className="py-space-md px-space-md align-middle">
                            <div className="flex flex-col gap-1">
                              {cake.sizes.map((s, idx) => (
                                <div
                                  key={idx}
                                  className="inline-flex items-center justify-between gap-4 font-label-md text-label-md text-xs"
                                >
                                  <span className="text-on-surface-variant font-medium">
                                    {s.label}:
                                  </span>
                                  <span
                                    className={`font-bold ${s.isPopular ? 'text-secondary' : 'text-primary'
                                      }`}
                                  >
                                    {s.price.toLocaleString('vi-VN')}₫
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Col 3: Prep Time */}
                          <td className="py-space-md px-space-md align-middle">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold text-xs ${!cake.isOpenForSale
                                  ? 'bg-error-container text-on-error-container'
                                  : 'bg-surface-container-high text-on-surface-variant'
                                }`}
                            >
                              <span className="material-symbols-outlined text-[16px] text-secondary">
                                {!cake.isOpenForSale ? 'pause_circle' : 'timer'}
                              </span>
                              {cake.prepTimeText}
                            </span>
                            <span className="block font-label-sm text-label-sm text-outline mt-1 text-[11px]">
                              {cake.prepTimeDetail}
                            </span>
                          </td>

                          {/* Col 4: Sales Volume */}
                          <td className="py-space-md px-space-md align-middle">
                            <span className="font-label-md text-label-md text-primary font-bold text-xs block">
                              {cake.soldCount} chiếc
                            </span>
                            <span className="block font-label-sm text-label-sm text-on-surface-variant text-[11px] mt-0.5">
                              Đã hoàn tất
                            </span>
                          </td>

                          {/* Col 5: Toggle Status */}
                          <td className="py-space-md px-space-md align-middle text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                checked={cake.isOpenForSale}
                                className="sr-only peer"
                                type="checkbox"
                                onChange={() => handleToggleSale(cake.id)}
                              />
                              <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-secondary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                            <span
                              className={`block font-label-sm text-label-sm font-semibold mt-1 text-[11px] ${cake.isOpenForSale ? 'text-secondary' : 'text-outline'
                                }`}
                            >
                              {cake.isOpenForSale ? 'Đang mở bán' : 'Tạm ẩn'}
                            </span>
                          </td>

                          {/* Col 6: Action Buttons */}
                          <td className="py-space-md px-space-md align-middle text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                className="p-2 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary text-on-surface-variant transition-colors cursor-pointer"
                                onClick={() => handleOpenEditDrawer(cake)}
                                title="Chỉnh sửa chi tiết"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  edit
                                </span>
                              </button>
                              <button
                                className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                                onClick={() => onNavigate && onNavigate('explore')}
                                title="Xem trên sàn Sweet Cake"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  visibility
                                </span>
                              </button>
                              <button
                                className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                                onClick={() => handleCloneCake(cake)}
                                title="Nhân bản mẫu mới"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  content_copy
                                </span>
                              </button>
                              <button
                                className="p-2 rounded-lg bg-surface-container-low hover:bg-error-container hover:text-on-error-container text-outline transition-colors cursor-pointer"
                                onClick={() => handleDeleteCake(cake.id)}
                                title="Xóa mẫu"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* TABLE PAGINATION FOOTER */}
              <div className="px-space-md py-4 bg-surface-container-low/50 flex flex-col sm:flex-row items-center justify-between gap-space-md text-xs border-t border-outline-variant/20">
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Hiển thị <strong className="text-primary font-semibold">1-{filteredCakes.length}</strong> trong tổng số{' '}
                  <strong className="text-primary font-semibold">{cakes.length}</strong> mẫu bánh boutique
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="p-2 rounded-lg bg-surface-container text-outline cursor-not-allowed"
                    disabled
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_left
                    </span>
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold"
                    type="button"
                  >
                    1
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md cursor-pointer"
                    onClick={() => showToast('Đang ở trang 1')}
                    type="button"
                  >
                    2
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md cursor-pointer"
                    onClick={() => showToast('Đang ở trang 1')}
                    type="button"
                  >
                    3
                  </button>
                  <span className="px-1 text-outline">...</span>
                  <button
                    className="p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface cursor-pointer"
                    onClick={() => showToast('Đã đến trang cuối')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* QUICK BENTO STATS & INSIGHTS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-xl">
              {/* Fast Config Widget */}
              <div className="p-space-md rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] flex flex-col justify-between gap-space-md border border-outline-variant/20">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    price_change
                  </span>
                  <span className="font-label-lg text-label-lg text-primary font-bold text-sm">
                    Điều chỉnh giá đồng loạt
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                  Áp dụng phụ thu mùa lễ hội hoặc giảm giá đồng loạt cho nhóm Entremet cỡ 16cm.
                </p>
                <button
                  className="inline-flex items-center justify-between px-space-md py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-label-md text-label-md transition-colors text-xs font-semibold cursor-pointer"
                  onClick={() => showToast('Mở biểu mẫu điều chỉnh bảng giá mùa lễ hội!')}
                  type="button"
                >
                  <span>Thiết lập biểu giá sự kiện</span>
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </button>
              </div>

              {/* Fresh Ingredients Sync */}
              <div className="p-space-md rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] flex flex-col justify-between gap-space-md border border-outline-variant/20">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    eco
                  </span>
                  <span className="font-label-lg text-label-lg text-primary font-bold text-sm">
                    Kho dâu &amp; Mascarpone
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between font-label-sm">
                    <span className="text-outline">Dâu tươi nhập khẩu:</span>
                    <span className="text-error font-semibold">
                      Còn 1.5kg (Sắp hết)
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-error h-full rounded-full"
                      style={{ width: '20%' }}
                    ></div>
                  </div>
                </div>
                <button
                  className="inline-flex items-center justify-between px-space-md py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-label-md text-label-md transition-colors text-xs font-semibold cursor-pointer"
                  onClick={() => showToast('Lô dâu tây Đà Lạt mới sẽ được giao lúc 16:30 chiều nay!')}
                  type="button"
                >
                  <span>Cập nhật tồn kho bếp bánh</span>
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </button>
              </div>

              {/* AI Customizer Base status */}
              <div className="p-space-md rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] flex flex-col justify-between gap-space-md border border-outline-variant/20">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    auto_awesome
                  </span>
                  <span className="font-label-lg text-label-lg text-primary font-bold text-sm">
                    Sweet AI Custom Canvas
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                  12 phôi bánh kem phẳng sẵn sàng nhận yêu cầu vẽ họa mặt hoặc phối 3D từ khách hàng.
                </p>
                <button
                  className="inline-flex items-center justify-between px-space-md py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-label-md text-label-md transition-colors text-xs font-semibold cursor-pointer"
                  onClick={() => onNavigate && onNavigate('ai-studio')}
                  type="button"
                >
                  <span>Quản lý phôi custom</span>
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================
          SLIDE-OVER DRAWER FOR ADD / EDIT CAKE
      ========================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-surface shadow-2xl flex flex-col animate-slide-in">
              {/* Drawer Header */}
              <div className="px-space-lg py-space-md bg-surface-container-lowest shadow-sm flex items-center justify-between shrink-0 border-b border-outline-variant/20">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary text-xs">
                    Cập nhật công thức &amp; Thực đơn
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-primary text-lg font-bold">
                    {formTitle} ({editingCake.id})
                  </h2>
                </div>
                <button
                  className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                  onClick={() => setIsDrawerOpen(false)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    close
                  </span>
                </button>
              </div>

              {/* Drawer Body Form Scrollable */}
              <div className="flex-1 overflow-y-auto px-space-lg py-space-md flex flex-col gap-space-lg text-xs">
                {/* PHOTO GALLERY UPLOAD SECTION */}
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-lg text-label-lg text-primary font-semibold text-xs">
                    Hình ảnh mẫu bánh chất lượng cao (3 góc chụp)
                  </label>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                    Yêu cầu tối thiểu 3 ảnh: Góc chụp chính diện, Lớp mặt cắt kem (cross-section) và Ảnh cắm nến sinh nhật ấm cúng.
                  </p>
                  <div className="grid grid-cols-3 gap-space-sm mt-2">
                    {/* Image Slot 1 */}
                    <div className="relative aspect-square rounded-xl overflow-hidden group shadow-sm bg-surface-container">
                      <img
                        alt="Front facing studio photo"
                        className="w-full h-full object-cover"
                        src={editingCake.image}
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-primary/80 text-on-primary font-label-sm text-[10px]">
                        Chính diện
                      </span>
                    </div>

                    {/* Image Slot 2 */}
                    <div className="relative aspect-square rounded-xl overflow-hidden group shadow-sm bg-surface-container">
                      <img
                        alt="Cake cross-section"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7HWwDDE0A-xOFC8XG39xUMvWq-3QlLhYgoECmK5Uag7uBleuPZtzp_gvJqeE61Id3Lpqx-ZORYglgrytUFsrz4vqqpmuAY0G2iTYXq5VO8E7qjDOGOC2fy5SfI_jMjRa1oEztvz6DcwHBnQmVzvsdANMDO2D-UgWHs6ezKF8kwXllpiirQcRqfR1SrP4ZW4LEXmLfNk9T3sYUV_M5Usgr87FN66CCJVxIyQZHYxEjxxhpQMj9LDQ_"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-primary/80 text-on-primary font-label-sm text-[10px]">
                        Mặt cắt kem
                      </span>
                    </div>

                    {/* Upload Dropzone Slot 3 */}
                    <div
                      className="aspect-square rounded-xl bg-surface-container-low flex flex-col items-center justify-center p-2 text-center hover:bg-surface-container transition-colors cursor-pointer border-2 border-dashed border-outline-variant/40"
                      onClick={() => showToast('Mở cửa sổ chọn ảnh chụp tiệc bánh từ máy tính!')}
                    >
                      <span className="material-symbols-outlined text-secondary text-[26px]">
                        add_a_photo
                      </span>
                      <span className="font-label-sm text-label-sm text-primary font-semibold mt-1 text-[11px]">
                        + Thêm ảnh thứ 3
                      </span>
                      <span className="font-body-sm text-[10px] text-outline">
                        Kéo thả ảnh tại đây
                      </span>
                    </div>
                  </div>
                </div>

                {/* BASIC INFORMATIONS */}
                <div className="flex flex-col gap-space-md">
                  <div>
                    <label className="font-label-lg text-label-lg text-primary font-semibold block mb-1 text-xs">
                      Tên mẫu bánh
                    </label>
                    <input
                      className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/30 border border-outline-variant/30 text-xs"
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-space-md">
                    <div>
                      <label className="font-label-lg text-label-lg text-primary font-semibold block mb-1 text-xs">
                        Danh mục thực đơn
                      </label>
                      <select
                        className="w-full px-space-md py-2.5 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none border border-outline-variant/30 text-xs"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                      >
                        <option>Bánh sinh nhật nghệ thuật</option>
                        <option>Bánh Mousse &amp; Entremet</option>
                        <option>Bánh cưới Haute Couture</option>
                        <option>Bento Cake tối giản Hàn Quốc</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-label-lg text-label-lg text-primary font-semibold block mb-1 text-xs">
                        Mã định danh SKU
                      </label>
                      <input
                        className="w-full px-space-md py-2.5 rounded-xl bg-surface-container text-outline font-mono text-body-md cursor-not-allowed border border-outline-variant/30 text-xs"
                        readOnly
                        type="text"
                        value={editingCake.id}
                      />
                    </div>
                  </div>

                  {/* Flavor & Sweetness Profile */}
                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-sm border border-outline-variant/20">
                    <span className="font-label-lg text-label-lg text-primary font-bold text-xs">
                      Hồ sơ Hương Vị &amp; Độ Ngọt
                    </span>
                    <div className="grid grid-cols-2 gap-space-md">
                      <div>
                        <span className="font-label-sm text-label-sm text-outline block mb-1 text-[11px]">
                          Hương vị chủ đạo
                        </span>
                        <input
                          className="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest text-body-sm text-xs border border-outline-variant/30"
                          type="text"
                          value={formFlavor}
                          onChange={(e) => setFormFlavor(e.target.value)}
                        />
                      </div>
                      <div>
                        <span className="font-label-sm text-label-sm text-outline block mb-1 text-[11px]">
                          Độ ngọt tiêu chuẩn
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            className="w-16 px-2 py-1 rounded-lg bg-surface-container-lowest text-xs font-bold text-secondary border border-outline-variant/30"
                            type="text"
                            value={formSweetness}
                            onChange={(e) => setFormSweetness(e.target.value)}
                          />
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                            (Thanh nhẹ - Giảm đường)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SIZES & PRICING CONFIGURATION */}
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <label className="font-label-lg text-label-lg text-primary font-semibold text-xs">
                      Cấu hình Kích thước &amp; Bảng Giá
                    </label>
                    <button
                      className="text-secondary font-label-sm text-label-sm font-semibold flex items-center gap-1 hover:underline cursor-pointer text-xs"
                      onClick={() => {
                        setFormSizes((prev) => [
                          ...prev,
                          { label: 'Size 20cm (Khẩu phần 8-10 người)', price: 680000 },
                        ])
                      }}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        add
                      </span>
                      Thêm Size khác
                    </button>
                  </div>

                  {formSizes.map((sz, idx) => (
                    <div
                      key={idx}
                      className={`p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-xs border ${sz.isPopular ? 'ring-2 ring-secondary/30 border-secondary/40' : 'border-outline-variant/20'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-label-lg text-label-lg text-primary font-bold text-xs">
                          {sz.label}
                        </span>
                        {sz.isPopular && (
                          <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[10px] font-semibold">
                            Phổ biến nhất
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mt-1">
                        <div>
                          <span className="font-label-sm text-label-sm text-outline text-[11px] block mb-1">
                            Tên phân loại / Kích thước
                          </span>
                          <input
                            className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-primary font-medium text-xs border border-outline-variant/30"
                            type="text"
                            value={sz.label}
                            onChange={(e) => {
                              const newLabel = e.target.value
                              setFormSizes((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, label: newLabel } : item
                                )
                              )
                            }}
                          />
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-outline text-[11px] block mb-1">
                            Giá bán niêm yết trên sàn
                          </span>
                          <input
                            className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-primary font-bold text-xs border border-outline-variant/30"
                            type="text"
                            value={`${sz.price.toLocaleString('vi-VN')}₫`}
                            onChange={(e) => {
                              const raw = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                              setFormSizes((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, price: raw } : item
                                )
                              )
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ADD-ONS & COMPLIMENTARIES */}
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-lg text-label-lg text-primary font-semibold text-xs">
                    Tùy chọn quà tặng &amp; Phụ kiện đi kèm
                  </label>
                  <div className="space-y-2 mt-1">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low cursor-pointer border border-outline-variant/15">
                      <input
                        checked={formComplimentary}
                        className="w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary"
                        type="checkbox"
                        onChange={(e) => setFormComplimentary(e.target.checked)}
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-primary font-semibold text-xs">
                          Tặng kèm bộ dao cắt bánh và nến pastel Sweet Cake
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                          Miễn phí cho mọi đơn hàng
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low cursor-pointer border border-outline-variant/15">
                      <input
                        checked={formCalligraphy}
                        className="w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary"
                        type="checkbox"
                        onChange={(e) => setFormCalligraphy(e.target.checked)}
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-primary font-semibold text-xs">
                          Cho phép khách ghi thông điệp viết tay lên mặt bánh
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                          Tối đa 25 ký tự không tính phí
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low cursor-pointer border border-outline-variant/15">
                      <input
                        checked={formFlowers}
                        className="w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary"
                        type="checkbox"
                        onChange={(e) => setFormFlowers(e.target.checked)}
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-primary font-semibold text-xs">
                          Tùy chọn hoa tươi trang trí (+45.000₫)
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                          Được bếp trưởng sơ chế cồn thực phẩm bảo đảm an toàn
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="px-space-lg py-space-md bg-surface-container-lowest shadow-sm flex items-center justify-between shrink-0 border-t border-outline-variant/20">
                <button
                  className="px-space-md py-2.5 rounded-xl bg-error-container/40 text-error hover:bg-error-container font-label-md text-label-md transition-colors text-xs font-semibold cursor-pointer"
                  onClick={() => {
                    handleToggleSale(editingCake.id)
                    setIsDrawerOpen(false)
                  }}
                  type="button"
                >
                  Tạm ngưng nhận đơn mẫu này
                </button>
                <div className="flex items-center gap-space-sm">
                  <button
                    className="px-space-md py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors text-xs cursor-pointer"
                    onClick={() => setIsDrawerOpen(false)}
                    type="button"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    className="px-space-lg py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md text-label-md font-semibold shadow-md transition-colors text-xs cursor-pointer"
                    onClick={handleSaveDrawer}
                    type="button"
                  >
                    Lưu thay đổi &amp; Đồng bộ sàn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorMenuCatalogPage
