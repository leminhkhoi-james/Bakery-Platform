import { useState } from 'react'
import { INITIAL_CAKES } from '../../../mockData/customer/cakes.js'
import { useAppData } from '../../../context/AppDataContext.jsx'

export const ExploreCakesPage = ({ onAddToCart, onNavigate }) => {
  const { addRfq } = useAppData()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState('popular')
  const [maxPrice, setMaxPrice] = useState(2500000)
  const [deliveryTime, setDeliveryTime] = useState('all')
  const [selectedThemes, setSelectedThemes] = useState([])
  const [selectedOccasions, setSelectedOccasions] = useState([])
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả quận / TP. Hồ Chí Minh')
  const [wishlist, setWishlist] = useState({})
  const [selectedSizes, setSelectedSizes] = useState({})
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [activePage, setActivePage] = useState(1)

  const toggleWishlist = (id) => {
    setWishlist((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleResetFilters = () => {
    setMaxPrice(2500000)
    setDeliveryTime('all')
    setSelectedThemes([])
    setSelectedOccasions([])
    setSelectedColor('')
    setSearchTerm('')
    setSelectedCategory('all')
    setActivePage(1)
  }

  const handleRemoveChip = (type, val) => {
    if (type === 'price') setMaxPrice(2500000)
    if (type === 'theme') {
      setSelectedThemes((prev) => prev.filter((t) => t !== val))
    }
    if (type === 'occasion') {
      setSelectedOccasions((prev) => prev.filter((o) => o !== val))
    }
  }

  const handleQuickBiddingOrder = (cakeToOrder) => {
    if (onAddToCart) {
      onAddToCart(cakeToOrder)
    }

    try {
      localStorage.setItem('sweetcake_direct_checkout', 'true')
    } catch (e) {
      console.error(e)
    }

    if (onNavigate) {
      onNavigate('cart')
    }
  }

  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredCakes = INITIAL_CAKES.filter((cake) => {
    const matchesSearch =
      searchTerm === '' ||
      cake.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cake.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPrice = cake.price <= maxPrice
    const matchesDelivery =
      deliveryTime === 'all' ||
      (deliveryTime === 'fast' && cake.deliveryTime === 'fast') ||
      (deliveryTime === 'same_day' &&
        (cake.deliveryTime === 'same_day' || cake.deliveryTime === 'fast')) ||
      (deliveryTime === 'custom' && cake.deliveryTime === 'custom')
    const matchesCategory =
      selectedCategory === 'all' ||
      cake.category === selectedCategory ||
      (selectedCategory === 'Bánh Kem Sinh Nhật' && (!cake.category || cake.category === 'Bánh Kem Sinh Nhật'))

    const matchesThemes =
      selectedThemes.length === 0 ||
      selectedThemes.some((themeName) => {
        const t = (cake.title || '').toLowerCase()
        const b = (cake.badges || []).join(' ').toLowerCase()
        const theme = (cake.theme || '').toLowerCase()
        const cat = (cake.category || '').toLowerCase()

        if (themeName.includes('Minimalist') || themeName.includes('Hàn Quốc')) {
          return theme === 'korean' || t.includes('hàn quốc') || t.includes('minimalist') || t.includes('bento') || t.includes('pastel') || b.includes('hàn quốc')
        }
        if (themeName.includes('3D') || themeName.includes('hoạt hình')) {
          return theme === 'cartoon' || cat.includes('3d') || t.includes('3d') || t.includes('fondant') || t.includes('pikachu') || t.includes('khủng long') || t.includes('gấu') || t.includes('heo') || t.includes('cún') || t.includes('lân') || t.includes('pooh')
        }
        if (themeName.includes('Vintage') || themeName.includes('Pháp')) {
          return theme === 'vintage' || t.includes('vintage') || t.includes('pháp') || t.includes('chantilly') || t.includes('mousseline') || t.includes('velvet')
        }
        if (themeName.includes('Trừu tượng') || themeName.includes('Modern')) {
          return theme === 'abstract' || t.includes('abstract') || t.includes('hiện đại') || t.includes('trừu tượng') || t.includes('tối giản')
        }
        if (themeName.includes('Vương miện') || themeName.includes('Công chúa')) {
          return theme === 'crown' || t.includes('vương miện') || t.includes('công chúa') || t.includes('princess') || t.includes('crown') || b.includes('công chúa')
        }
        if (themeName.includes('Hoa tươi') || themeName.includes('Trái cây')) {
          return theme === 'natural' || cat.includes('hoa') || t.includes('hoa') || t.includes('tulip') || t.includes('dâu') || t.includes('trái cây') || t.includes('xoài') || t.includes('bơ') || t.includes('nho') || t.includes('việt quất')
        }
        if (themeName.includes('Bento') || themeName.includes('10cm')) {
          return theme === 'bento' || t.includes('bento') || t.includes('mini') || t.includes('10cm')
        }
        if (themeName.includes('Gold') || themeName.includes('Vàng')) {
          return theme === 'luxury' || t.includes('dát vàng') || t.includes('gold') || t.includes('hoàng gia') || t.includes('luxury')
        }
        return true
      })

    const matchesOccasions =
      selectedOccasions.length === 0 ||
      selectedOccasions.some((occName) => {
        const t = (cake.title || '').toLowerCase()
        const b = (cake.badges || []).join(' ').toLowerCase()
        const occ = (cake.occasion || '').toLowerCase()
        const cat = (cake.category || '').toLowerCase()

        if (occName.includes('bé trai') || occName.includes('bé gái')) {
          return occ === 'kids' || b.includes('sinh nhật bé') || t.includes('bé') || t.includes('công chúa') || cat.includes('3d')
        }
        if (occName.includes('người lớn') || occName.includes('Gia đình')) {
          return occ === 'family' || cat.includes('sinh nhật') || b.includes('gia đình') || t.includes('ông') || t.includes('bà') || t.includes('mẹ') || t.includes('bố')
        }
        if (occName.includes('ngày cưới') || occName.includes('Tình yêu')) {
          return occ === 'love' || t.includes('tình yêu') || t.includes('tim') || t.includes('love') || t.includes('kỷ niệm')
        }
        if (occName.includes('Tiệc cưới') || occName.includes('đính hôn')) {
          return occ === 'wedding' || cat.includes('cưới') || t.includes('cưới') || t.includes('wedding') || t.includes('2 tầng')
        }
        if (occName.includes('Thôi nôi') || occName.includes('đầy tháng')) {
          return occ === 'baby' || t.includes('thôi nôi') || t.includes('đầy tháng') || t.includes('bento') || t.includes('gấu')
        }
        if (occName.includes('Khai trương') || occName.includes('công ty')) {
          return occ === 'event' || t.includes('khai trương') || t.includes('công ty') || t.includes('bia') || t.includes('rượu') || t.includes('dát vàng')
        }
        if (occName.includes('Ngày lễ')) {
          return t.includes('mother') || t.includes('mẹ') || t.includes('8/3') || t.includes('20/10') || t.includes('valentine')
        }
        return true
      })

    const matchesColorFilter = (() => {
      if (!selectedColor) return true
      const c = (cake.color || '').toLowerCase()
      const t = (cake.title || '').toLowerCase()
      const b = (cake.badges || []).join(' ').toLowerCase()

      switch (selectedColor) {
        case 'Hồng':
          return c === 'pink' || t.includes('hồng') || b.includes('hồng')
        case 'Trắng':
          return c === 'white' || t.includes('trắng') || t.includes('white') || t.includes('kem tươi')
        case 'Vàng':
          return c === 'yellow' || t.includes('vàng') || t.includes('bắp') || t.includes('xoài') || t.includes('chanh')
        case 'Xanh':
          return c === 'blue' || c === 'green' || t.includes('xanh') || t.includes('blue')
        case 'Đỏ':
          return c === 'red' || t.includes('đỏ') || t.includes('red') || t.includes('dâu') || t.includes('mâm xôi')
        case 'Tím':
          return c === 'purple' || t.includes('tím') || t.includes('khoai môn') || t.includes('việt quất')
        case 'Matcha':
          return c === 'matcha' || t.includes('matcha') || t.includes('trà xanh')
        case 'Cacao':
          return c === 'chocolate' || c === 'cacao' || t.includes('cacao') || t.includes('socola') || t.includes('chocolate') || t.includes('tiramisu') || t.includes('truffle')
        case 'Rainbow':
          return c === 'rainbow' || t.includes('nhiều màu') || t.includes('nhiệt đới') || t.includes('hoa quả') || t.includes('bầu trời') || t.includes('dải ngân hà') || t.includes('lân') || t.includes('vũ trụ')
        default:
          return true
      }
    })()

    const matchesDistrict =
      !selectedDistrict ||
      selectedDistrict.startsWith('Tất cả') ||
      (() => {
        const v = (cake.vendor || '').toLowerCase()
        const d = selectedDistrict.toLowerCase()
        if (d.includes('quận 1') && (v.includes('q.1') || v.includes('quận 1'))) return true
        if ((d.includes('quận 2') || d.includes('thủ đức')) && (v.includes('q.2') || v.includes('thảo điền'))) return true
        if (d.includes('quận 3') && (v.includes('q.3') || v.includes('quận 3'))) return true
        if (d.includes('quận 7') && (v.includes('q.7') || v.includes('phú mỹ hưng'))) return true
        if (d.includes('quận 10') && (v.includes('q.10') || v.includes('quận 10'))) return true
        if (d.includes('bình thạnh') && (v.includes('bình thạnh') || v.includes('q.bình thạnh'))) return true
        return false
      })()

    return matchesSearch && matchesPrice && matchesDelivery && matchesCategory && matchesThemes && matchesOccasions && matchesColorFilter && matchesDistrict
  }).sort((a, b) => {
    if (sortOption === 'price_asc') return a.price - b.price
    if (sortOption === 'price_desc') return b.price - a.price
    if (sortOption === 'rating') return b.rating - a.rating
    return 0
  })

  const ITEMS_PER_PAGE = 9
  const totalPages = Math.ceil(filteredCakes.length / ITEMS_PER_PAGE) || 1
  const currentPage = Math.min(activePage, totalPages)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredCakes.length)
  const paginatedCakes = filteredCakes.slice(startIndex, endIndex)

  const handlePageChange = (newPage) => {
    setActivePage(newPage)
    const gridEl = document.getElementById('cakeGridContainer')
    if (gridEl) {
      gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="w-full striped-candy-bg min-h-[calc(100vh-20rem)]">
      <div className="flex flex-col w-full">
        {/* BREADCRUMB & PAGE INTRO SECTION */}
        <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pt-6 pb-4">
          {/* Page Title & Editorial Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b-0 pb-2">
            <div className="max-w-4xl">
              <span className="inline-block px-3 py-1 bg-surface/80 backdrop-blur-md rounded-full font-label-md text-xs uppercase tracking-widest text-primary font-bold shadow-sm mb-2 border border-outline-variant/30">
                Bộ Sưu Tập Đa Tiệm Nghệ Nhân
              </span>
              <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-[44px] text-primary mt-1 tracking-tight drop-shadow-sm">
                Khám Phá & Đặt Bánh Kem Nghệ Nhân
              </h1>
            </div>
          </div>

          {/* FILTER BAR & QUICK SORT CONTROLS & CATEGORIES */}
          <div className="mt-6 bg-surface/60 backdrop-blur-md rounded-2xl p-space-md shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-xl">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                  search
                </span>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-surface rounded-xl font-body-sm text-body-sm text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all shadow-inner"
                  id="cakeSearchInput"
                  placeholder="Tìm theo tên bánh, phong cách, vị kem (vd: Dâu Đà Lạt, Valrhona, Minimalist)..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Results Count & Sorting Controls */}
              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-space-md">
                <div className="flex items-center gap-2">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Hiển thị:
                  </span>
                  <span className="font-label-lg text-label-lg text-primary bg-surface-container px-2.5 py-1 rounded-full font-bold">
                    {filteredCakes.length > 0 ? `${filteredCakes.length} mẫu bánh` : '0 mẫu bánh'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">
                    Sắp xếp:
                  </span>
                  <div className="relative">
                    <select
                      className="appearance-none bg-surface text-primary font-label-lg text-label-lg py-2.5 pl-4 pr-10 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/30 shadow-sm transition-all"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                    >
                      <option value="popular">Phổ biến nhất</option>
                      <option value="price_asc">Giá tăng dần</option>
                      <option value="price_desc">Giá giảm dần</option>
                      <option value="rating">Đánh giá cao nhất (5.0★)</option>
                      <option value="fastest">Giao nhanh nhất (2 Giờ)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-lg">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Mobile Filter Toggle Button */}
                <button
                  className="lg:hidden flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-label-lg text-label-lg cursor-pointer"
                  id="mobileFilterBtn"
                  onClick={() => setShowMobileFilter((prev) => !prev)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">tune</span>
                  <span>Lọc bánh</span>
                </button>
              </div>
            </div>

            {/* CATEGORY FILTER CHIPS BAR */}
            <div className="pt-3 border-t border-outline-variant/30 flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: '🎂 Tất cả', count: INITIAL_CAKES.length },
                { id: 'Bánh Kem Sinh Nhật', label: '🎉 Bánh Kem Sinh Nhật', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Kem Sinh Nhật').length },
                { id: 'Bánh Tạo Hình 3D', label: '🎨 Bánh Tạo Hình 3D', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Tạo Hình 3D').length },
                { id: 'Bánh Kem Hình Hoa & Bó Hoa', label: '🌸 Bánh Kem Hình Hoa & Bó Hoa', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Kem Hình Hoa & Bó Hoa').length },
                { id: 'Bánh Su Kem', label: '🧁 Bánh Su Kem', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Su Kem').length },
                { id: 'Bánh Pudding & Jelly', label: '🍮 Bánh Pudding & Jelly', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Pudding & Jelly').length },
                { id: 'Bánh Lon & Hũ (Dream Cake)', label: '🥫 Bánh Lon & Hũ (Dream Cake)', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Lon & Hũ (Dream Cake)').length },
                { id: 'Combo & Set Bánh', label: '🎁 Combo & Set Bánh', count: INITIAL_CAKES.filter(c => c.category === 'Combo & Set Bánh').length },
                { id: 'Bánh Mousse', label: '🥭 Bánh Mousse', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Mousse').length },
                { id: 'Bánh Tiramisu', label: '☕ Bánh Tiramisu', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Tiramisu').length },

                { id: 'Bánh Cưới (Wedding)', label: '💍 Bánh Cưới (Wedding)', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Cưới (Wedding)').length },
                { id: 'Bánh Trung Thu & Quà Tặng', label: '🥮 Bánh Trung Thu & Quà Tặng', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Trung Thu & Quà Tặng').length },
                { id: 'Bánh Flan Gato', label: '🍮 Bánh Flan Gato', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Flan Gato').length },
                { id: 'Bánh Cheesecake & Tart', label: '🧀 Cheesecake & Tart', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Cheesecake & Tart').length },
                { id: 'Bánh Tráng Miệng & Cookie', label: '🍪 Tráng Miệng & Cookie', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Tráng Miệng & Cookie').length },
              ].map((cat) => {
                const isActive = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id)
                      setActivePage(1)
                    }}
                    className={`px-4 py-2 rounded-xl font-label-md text-label-md whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                      isActive
                        ? 'bg-primary text-on-primary font-bold border-primary shadow-md'
                        : 'bg-surface hover:bg-surface-container text-on-surface border-outline-variant/50 hover:border-secondary'
                    }`}
                    type="button"
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* MAIN CATALOG CONTENT: FILTER SIDEBAR & PRODUCT GRID */}
        <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            {/* LEFT SIDEBAR: FILTERS */}
            <aside
              className={`lg:col-span-3 bg-surface-container-low p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-lg ${showMobileFilter ? 'block' : 'hidden lg:flex'
                }`}
              id="filterSidebar"
            >
              <div className="flex items-center justify-between pb-3 border-b-0">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-secondary">tune</span>
                  <h2 className="font-headline-sm text-headline-sm tracking-tight text-primary">
                    Bộ Lọc Chi Tiết
                  </h2>
                </div>
                <button
                  className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer"
                  id="resetFiltersBtn"
                  onClick={handleResetFilters}
                  type="button"
                >
                  Xóa tất cả
                </button>
              </div>

              {/* 0. LOẠI BÁNH (CATEGORY FILTER) */}
              <div className="flex flex-col gap-2.5 pb-4 border-b border-outline-variant/30">
                <label className="font-label-lg text-label-lg text-primary flex items-center justify-between">
                  <span>Loại bánh (Danh mục)</span>
                  <span className="material-symbols-outlined text-base text-secondary">
                    cake
                  </span>
                </label>
                <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {[
                    { id: 'all', label: '🎂 Tất cả loại bánh', count: INITIAL_CAKES.length },
                    { id: 'Bánh Kem Sinh Nhật', label: '🎉 Bánh Kem Sinh Nhật', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Kem Sinh Nhật').length },
                    { id: 'Bánh Tạo Hình 3D', label: '🎨 Bánh Tạo Hình 3D', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Tạo Hình 3D').length },
                    { id: 'Bánh Kem Hình Hoa & Bó Hoa', label: '🌸 Bánh Kem Hình Hoa & Bó Hoa', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Kem Hình Hoa & Bó Hoa').length },
                    { id: 'Bánh Su Kem', label: '🧁 Bánh Su Kem', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Su Kem').length },
                    { id: 'Bánh Pudding & Jelly', label: '🍮 Bánh Pudding & Jelly', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Pudding & Jelly').length },
                    { id: 'Bánh Lon & Hũ (Dream Cake)', label: '🥫 Bánh Lon & Hũ (Dream Cake)', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Lon & Hũ (Dream Cake)').length },
                    { id: 'Combo & Set Bánh', label: '🎁 Combo & Set Bánh', count: INITIAL_CAKES.filter(c => c.category === 'Combo & Set Bánh').length },
                    { id: 'Bánh Mousse', label: '🥭 Bánh Mousse', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Mousse').length },
                    { id: 'Bánh Tiramisu', label: '☕ Bánh Tiramisu', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Tiramisu').length },

                    { id: 'Bánh Cưới (Wedding)', label: '💍 Bánh Cưới (Wedding)', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Cưới (Wedding)').length },
                    { id: 'Bánh Trung Thu & Quà Tặng', label: '🥮 Bánh Trung Thu & Quà Tặng', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Trung Thu & Quà Tặng').length },
                    { id: 'Bánh Flan Gato', label: '🍮 Bánh Flan Gato', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Flan Gato').length },
                    { id: 'Bánh Cheesecake & Tart', label: '🧀 Cheesecake & Tart', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Cheesecake & Tart').length },
                    { id: 'Bánh Tráng Miệng & Cookie', label: '🍪 Tráng Miệng & Cookie', count: INITIAL_CAKES.filter(c => c.category === 'Bánh Tráng Miệng & Cookie').length },
                  ].map((cat) => {
                    const isSelected = selectedCategory === cat.id
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-body-sm font-body-sm transition-all ${
                          isSelected
                            ? 'bg-secondary/15 text-primary font-bold'
                            : 'text-on-surface hover:bg-surface hover:text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="sidebar_category"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedCategory(cat.id)
                              setActivePage(1)
                            }}
                            className="accent-secondary w-4 h-4 cursor-pointer"
                          />
                          <span className="truncate">{cat.label}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ml-1 ${isSelected ? 'bg-secondary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {cat.count}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* 1. Giao Hàng Siêu Tốc */}
              <div className="flex flex-col gap-2.5">
                <label className="font-label-lg text-label-lg text-primary flex items-center justify-between">
                  <span>Thời gian nhận bánh</span>
                  <span className="material-symbols-outlined text-base text-secondary">
                    schedule
                  </span>
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-body-sm font-body-sm text-on-surface hover:text-primary">
                    <input
                      checked={deliveryTime === 'all'}
                      onChange={() => setDeliveryTime('all')}
                      className="accent-secondary w-4 h-4 cursor-pointer"
                      name="delivery_time"
                      type="radio"
                    />
                    <span>Tất cả thời gian</span>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer text-body-sm font-body-sm text-on-surface hover:text-primary bg-surface p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        checked={deliveryTime === 'fast'}
                        onChange={() => setDeliveryTime('fast')}
                        className="accent-secondary w-4 h-4 cursor-pointer"
                        name="delivery_time"
                        type="radio"
                      />
                      <span className="font-medium text-primary">Giao ngay trong 2h</span>
                    </div>
                    <span className="bg-secondary/10 text-secondary text-xs px-2 py-0.5 rounded-full font-bold">
                      Hỏa tốc
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-body-sm font-body-sm text-on-surface hover:text-primary">
                    <input
                      checked={deliveryTime === 'same_day'}
                      onChange={() => setDeliveryTime('same_day')}
                      className="accent-secondary w-4 h-4 cursor-pointer"
                      name="delivery_time"
                      type="radio"
                    />
                    <span>Đặt trước trong ngày (4-6h)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-body-sm font-body-sm text-on-surface hover:text-primary">
                    <input
                      checked={deliveryTime === 'custom'}
                      onChange={() => setDeliveryTime('custom')}
                      className="accent-secondary w-4 h-4 cursor-pointer"
                      name="delivery_time"
                      type="radio"
                    />
                    <span>Đặt trước 24h - 48h (Custom)</span>
                  </label>
                </div>
              </div>

              {/* 2. Khoảng Giá (Price Range Slider & Quick Choices) */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="font-label-lg text-label-lg text-primary">
                    Khoảng giá (VNĐ)
                  </label>
                  <span
                    className="font-label-sm text-label-sm font-semibold text-secondary"
                    id="priceDisplay"
                  >
                    {maxPrice >= 2500000
                      ? '250k - 2.500k+'
                      : `250k - ${(maxPrice / 1000).toLocaleString('vi-VN')}k`}
                  </span>
                </div>
                {/* Dual-style slider indicator */}
                <div className="relative w-full pt-2">
                  <input
                    className="w-full accent-secondary cursor-pointer bg-surface-container rounded-lg h-2"
                    id="priceRange"
                    max="2500000"
                    min="250000"
                    step="50000"
                    type="range"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                  />
                  <div className="flex justify-between text-label-sm font-label-sm text-outline mt-1.5">
                    <span>250.000đ</span>
                    <span>2.500.000đ+</span>
                  </div>
                </div>

                {/* Quick Price Segment Pills */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <button
                    className="text-left text-body-sm font-body-sm p-2 rounded-lg bg-surface hover:bg-surface-container transition-all flex items-center justify-between text-on-surface cursor-pointer"
                    onClick={() => setMaxPrice(300000)}
                    type="button"
                  >
                    <span>Dưới 300.000đ</span>
                    <span className="text-label-sm text-outline">Bento / Mini</span>
                  </button>
                  <button
                    className="text-left text-body-sm font-body-sm p-2 rounded-lg bg-surface hover:bg-surface-container transition-all flex items-center justify-between text-on-surface cursor-pointer"
                    onClick={() => setMaxPrice(600000)}
                    type="button"
                  >
                    <span>300.000đ - 600.000đ</span>
                    <span className="text-label-sm text-outline">Tiệc gia đình nhỏ</span>
                  </button>
                  <button
                    className="text-left text-body-sm font-body-sm p-2 rounded-lg bg-surface hover:bg-surface-container transition-all flex items-center justify-between text-on-surface cursor-pointer"
                    onClick={() => setMaxPrice(1200000)}
                    type="button"
                  >
                    <span>600.000đ - 1.200.000đ</span>
                    <span className="text-label-sm text-outline">Sinh nhật 2 tầng</span>
                  </button>
                  <button
                    className="text-left text-body-sm font-body-sm p-2 rounded-lg bg-surface hover:bg-surface-container transition-all flex items-center justify-between text-on-surface cursor-pointer"
                    onClick={() => setMaxPrice(2500000)}
                    type="button"
                  >
                    <span>Trên 1.200.000đ</span>
                    <span className="text-label-sm text-outline">Sự kiện cao cấp</span>
                  </button>
                </div>
              </div>

              {/* 3. Chủ Đề Thiết Kế (Theme) */}
              <div className="flex flex-col gap-2.5">
                <label className="font-label-lg text-label-lg text-primary flex items-center justify-between">
                  <span>Phong cách &amp; Chủ đề</span>
                  <span className="font-label-sm text-outline">(8)</span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {[
                    'Minimalist Hàn Quốc (Pastel)',
                    'Nhân vật hoạt hình & 3D Fondant',
                    'Phong cách Vintage Pháp (Chantilly)',
                    'Trừu tượng hiện đại (Modern Abstract)',
                    'Vương miện & Công chúa lộng lẫy',
                    'Hoa tươi & Trái cây tự nhiên',
                    'Bento Cake ngộ nghĩnh 10cm',
                    'Luxury Gold & Metallic Dát Vàng',
                  ].map((themeName) => (
                    <label
                      key={themeName}
                      className="flex items-center gap-2.5 cursor-pointer text-body-sm font-body-sm text-on-surface hover:text-primary"
                    >
                      <input
                        checked={selectedThemes.includes(themeName)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedThemes((prev) => [...prev, themeName])
                          } else {
                            setSelectedThemes((prev) =>
                              prev.filter((t) => t !== themeName)
                            )
                          }
                        }}
                        className="accent-secondary w-4 h-4 rounded cursor-pointer"
                        type="checkbox"
                      />
                      <span>{themeName}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Dịp Kỷ Niệm (Occasion) */}
              <div className="flex flex-col gap-2.5">
                <label className="font-label-lg text-label-lg text-primary">
                  Dịp tổ chức tiệc
                </label>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {[
                    'Sinh nhật bé trai / bé gái',
                    'Sinh nhật người lớn & Gia đình',
                    'Kỷ niệm ngày cưới & Tình yêu',
                    'Tiệc cưới & Lễ đính hôn',
                    'Thôi nôi & Tiệc đầy tháng',
                    'Khai trương & Kỷ niệm công ty',
                    'Ngày lễ (Valentine, 8/3, 20/10)',
                  ].map((occ) => (
                    <label
                      key={occ}
                      className="flex items-center gap-2.5 cursor-pointer text-body-sm font-body-sm text-on-surface hover:text-primary"
                    >
                      <input
                        checked={selectedOccasions.includes(occ)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOccasions((prev) => [...prev, occ])
                          } else {
                            setSelectedOccasions((prev) =>
                              prev.filter((o) => o !== occ)
                            )
                          }
                        }}
                        className="accent-secondary w-4 h-4 rounded cursor-pointer"
                        type="checkbox"
                      />
                      <span>{occ}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 5. Tông Màu Chủ Đạo (Color Swatches) */}
              <div className="flex flex-col gap-2.5">
                <label className="font-label-lg text-label-lg text-primary">
                  Bảng màu chủ đạo
                </label>
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {[
                    { name: 'Hồng', bg: 'bg-[#fed7e2]', ring: 'text-primary' },
                    { name: 'Trắng', bg: 'bg-white', ring: 'text-primary' },
                    { name: 'Vàng', bg: 'bg-[#fde68a]', ring: 'text-primary' },
                    { name: 'Xanh', bg: 'bg-[#bfdbfe]', ring: 'text-primary' },
                    { name: 'Đỏ', bg: 'bg-[#e11d48]', ring: 'text-white' },
                    { name: 'Tím', bg: 'bg-[#e9d5ff]', ring: 'text-primary' },
                    { name: 'Matcha', bg: 'bg-[#bbf7d0]', ring: 'text-primary' },
                    { name: 'Cacao', bg: 'bg-[#451a03]', ring: 'text-white' },
                  ].map((col) => {
                    const isSelected = selectedColor === col.name
                    return (
                      <button
                        key={col.name}
                        className="group flex flex-col items-center gap-1 focus:outline-none cursor-pointer"
                        onClick={() =>
                          setSelectedColor(isSelected ? '' : col.name)
                        }
                        title={col.name}
                        type="button"
                      >
                        <span
                          className={`w-8 h-8 rounded-full ${col.bg} shadow-sm flex items-center justify-center ring-2 ${isSelected ? 'ring-secondary' : 'ring-transparent group-hover:ring-secondary'
                            }`}
                        >
                          <span
                            className={`material-symbols-outlined text-xs ${col.ring} ${isSelected
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                              }`}
                          >
                            check
                          </span>
                        </span>
                        <span
                          className={`text-xs line-clamp-1 mt-0.5 ${isSelected
                              ? 'font-bold text-primary'
                              : 'font-medium text-on-surface'
                            }`}
                        >
                          {col.name}
                        </span>
                      </button>
                    )
                  })}
                  <button
                    className="group flex flex-col items-center gap-1 focus:outline-none col-span-2 cursor-pointer"
                    onClick={() =>
                      setSelectedColor(selectedColor === 'Rainbow' ? '' : 'Rainbow')
                    }
                    title="Đa Sắc Rainbow"
                    type="button"
                  >
                    <span
                      className={`w-full h-8 rounded-full bg-gradient-to-r from-pink-300 via-amber-200 to-sky-300 shadow-sm flex items-center justify-center ring-2 ${selectedColor === 'Rainbow'
                          ? 'ring-secondary'
                          : 'ring-transparent group-hover:ring-secondary'
                        }`}
                    >
                      <span className="text-xs font-bold text-primary">
                        Rainbow
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* 6. Khu Vực Tiệm Bánh (Location) */}
              <div className="flex flex-col gap-2.5">
                <label className="font-label-lg text-label-lg text-primary">
                  Khu vực tiệm bánh
                </label>
                <select
                  className="w-full bg-surface text-primary font-body-sm text-body-sm p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option>Tất cả quận / TP. Hồ Chí Minh</option>
                  <option>Quận 1 - Bến Nghé, Bến Thành</option>
                  <option>Quận 2 (Thủ Đức) - Thảo Điền</option>
                  <option>Quận 3 - Võ Thị Sáu, Lý Chính Thắng</option>
                  <option>Quận 7 - Phú Mỹ Hưng, Tân Phong</option>
                  <option>Quận 10 - 3 Tháng 2, Tô Hiến Thành</option>
                  <option>Quận Bình Thạnh - Phan Xích Long</option>
                </select>
              </div>

              {/* Actions in Filter */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-lg text-label-lg hover:bg-secondary transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => setShowMobileFilter(false)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">filter_alt</span>
                  <span>Áp Dụng Bộ Lọc</span>
                </button>
              </div>
            </aside>

            {/* RIGHT COLUMN: MAIN PRODUCT GRID & PROMO CALLOUT */}
            <div className="lg:col-span-9 flex flex-col gap-space-lg">
              {/* ACTIVE FILTER CHIPS */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider mr-1">
                  Đang lọc:
                </span>
                {maxPrice < 2500000 && (
                  <span className="inline-flex items-center gap-1.5 bg-surface-container-high text-primary font-label-sm text-label-sm px-3 py-1 rounded-full">
                    Dưới {(maxPrice / 1000).toLocaleString('vi-VN')}k
                    <button
                      className="hover:text-error material-symbols-outlined text-xs cursor-pointer"
                      onClick={() => handleRemoveChip('price')}
                    >
                      close
                    </button>
                  </span>
                )}
                {selectedThemes.slice(0, 2).map((theme) => (
                  <span
                    key={theme}
                    className="inline-flex items-center gap-1.5 bg-surface-container-high text-primary font-label-sm text-label-sm px-3 py-1 rounded-full"
                  >
                    {theme}
                    <button
                      className="hover:text-error material-symbols-outlined text-xs cursor-pointer"
                      onClick={() => handleRemoveChip('theme', theme)}
                    >
                      close
                    </button>
                  </span>
                ))}
                {selectedOccasions.slice(0, 1).map((occ) => (
                  <span
                    key={occ}
                    className="inline-flex items-center gap-1.5 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-3 py-1 rounded-full"
                  >
                    {occ}
                    <button
                      className="hover:text-error material-symbols-outlined text-xs cursor-pointer"
                      onClick={() => handleRemoveChip('occasion', occ)}
                    >
                      close
                    </button>
                  </span>
                ))}
                <button
                  className="font-label-sm text-label-sm text-secondary hover:underline ml-2 cursor-pointer"
                  onClick={handleResetFilters}
                  type="button"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>

              {/* CAKE PRODUCT GRID */}
              <div id="cakeGridContainer" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
                {paginatedCakes.map((cake) => {
                  const isFavorited = wishlist[cake.id]
                  const defaultSizeObj = cake.sizes
                    ? cake.sizes.find((s) => s.price === cake.price) || cake.sizes[0]
                    : null
                  const currentSize = cake.sizes
                    ? cake.sizes.find((s) => s.size === selectedSizes[cake.id]) || defaultSizeObj
                    : null
                  const currentPrice = currentSize ? currentSize.price : cake.price
                  const cakeToOrder = {
                    ...cake,
                    price: currentPrice,
                    selectedSize: currentSize ? currentSize.size : (cake.sizeSpec || 'Size tiêu chuẩn'),
                    sizeSpec: currentSize
                      ? `Size ${currentSize.size} • ${currentSize.guests}`
                      : cake.sizeSpec,
                  }

                  return (
                    <article
                      key={cake.id}
                      className="group bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div
                          className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-surface-container mb-3 cursor-pointer"
                          onClick={() => onNavigate && onNavigate('product-detail', cakeToOrder)}
                        >
                          <img
                            alt={cake.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            src={cake.image}
                          />
                          {/* Badges */}
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
                            {cake.badges && cake.badges.map((badge, idx) => (
                              <span
                                key={badge}
                                className={`font-label-sm text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-sm ${idx === 0
                                    ? 'bg-secondary text-on-secondary text-[11px]'
                                    : 'bg-surface/90 backdrop-blur-md text-primary font-semibold'
                                  }`}
                              >
                                {badge}
                              </span>
                            ))}
                          </div>

                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                            <span className="bg-primary/80 backdrop-blur-md text-on-primary text-[11px] font-label-sm px-2 py-0.5 rounded-md">
                              {currentSize ? currentSize.size : cake.sizeSpec}
                            </span>
                          </div>
                        </div>

                        {/* Vendor Info */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center text-[9px] font-bold text-secondary">
                            {cake.vendorInitial || 'SC'}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                            {cake.vendor}
                          </span>
                        </div>

                        {/* Cake Title */}
                        <h3
                          className="font-headline-sm text-[18px] leading-snug text-primary font-semibold group-hover:text-secondary transition-colors line-clamp-2 cursor-pointer"
                          onClick={() => onNavigate && onNavigate('product-detail', cakeToOrder)}
                        >
                          {cake.title}
                        </h3>

                        {/* Size Selector */}
                        {cake.sizes && cake.sizes.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-dashed border-outline-variant/30">
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-[11px] font-label-md text-on-surface-variant font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-secondary">
                                  straighten
                                </span>
                                Chọn size:
                              </span>
                              {currentSize?.guests && (
                                <span className="text-[10px] text-secondary font-medium">
                                  {currentSize.guests}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {cake.sizes.map((s) => {
                                const isSelected = currentSize?.size === s.size
                                return (
                                  <button
                                    key={s.size}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedSizes((prev) => ({
                                        ...prev,
                                        [cake.id]: s.size,
                                      }))
                                    }}
                                    className={`px-2 py-0.5 text-[11px] rounded-lg font-medium transition-all cursor-pointer ${isSelected
                                        ? 'bg-secondary text-on-secondary font-bold shadow-xs'
                                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary'
                                      }`}
                                  >
                                    {s.size}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Price & Actions */}
                      <div className="pt-3 mt-2 border-t-0 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                            {currentPrice.toLocaleString('vi-VN')}đ
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onAddToCart && onAddToCart(cakeToOrder)}
                            className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-primary hover:text-secondary transition-colors cursor-pointer"
                            title="Thêm vào giỏ hàng"
                          >
                            <span className="material-symbols-outlined text-lg">
                              add_shopping_cart
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickBiddingOrder(cakeToOrder)}
                            className="px-3.5 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-secondary transition-all shadow-sm cursor-pointer flex items-center gap-1"
                            title="Đặt nhanh để chuyển thẳng sang sàn đấu giá nhận báo giá từ các tiệm bánh"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              bolt
                            </span>
                            <span>Đặt nhanh</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* ELEGANT DYNAMIC PAGINATION */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-outline-variant/30">
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center md:text-left whitespace-nowrap shrink-0">
                  Hiển thị{' '}
                  <span className="font-semibold text-primary">
                    {filteredCakes.length > 0 ? startIndex + 1 : 0} - {endIndex}
                  </span>{' '}
                  trong số{' '}
                  <span className="font-semibold text-primary">{filteredCakes.length}</span> mẫu bánh
                </p>
                <div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-end">
                  <button
                    className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">
                      chevron_left
                    </span>
                  </button>
                  {(() => {
                    const getPageNumbers = (current, total) => {
                      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
                      if (current <= 3) return [1, 2, 3, 4, '...', total]
                      if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total]
                      return [1, '...', current - 1, current, current + 1, '...', total]
                    }
                    return getPageNumbers(currentPage, totalPages).map((item, idx) => {
                      if (item === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="w-8 text-center text-on-surface-variant font-bold">
                            ...
                          </span>
                        )
                      }
                      return (
                        <button
                          key={item}
                          className={`w-10 h-10 rounded-xl font-label-md text-label-md font-bold transition-colors cursor-pointer ${
                            currentPage === item
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'bg-surface-container hover:bg-surface-container-high text-primary'
                          }`}
                          onClick={() => handlePageChange(item)}
                          type="button"
                        >
                          {item}
                        </button>
                      )
                    })
                  })()}
                  <button
                    className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>

              {/* AI CALLOUT BANNER AT BOTTOM */}
              <div className="relative overflow-hidden bg-primary-container text-on-primary rounded-2xl p-space-lg shadow-md mt-4">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-space-md">
                  <div className="flex items-start gap-space-md">
                    <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">
                        auto_awesome
                      </span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary-fixed uppercase tracking-wider font-semibold">
                        Chưa tìm thấy mẫu ưng ý hoàn hảo?
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-on-primary mt-0.5">
                        Tự Thiết Kế Mẫu Bánh Theo Trí Tưởng Tượng
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-primary-container mt-1 max-w-xl">
                        Chỉ cần nhập mô tả ý tưởng hoặc tải ảnh phác thảo, hệ thống sẽ thiết
                        kế 3D độc bản và gửi đấu thầu tới 300+ tiệm bánh trong 15 phút!
                      </p>
                    </div>
                  </div>
                  <a
                    className="shrink-0 bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary px-space-lg py-3 rounded-xl font-label-lg text-label-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    href="/ai-studio"
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate && onNavigate('ai-studio')
                    }}
                  >
                    <span>Bắt đầu tự thiết kế bánh</span>
                    <span className="material-symbols-outlined text-lg">
                      arrow_forward
                    </span>
                  </a>
                </div>
                {/* Subtle decorative ambient circle */}
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-secondary/15 rounded-full blur-2xl pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

export default ExploreCakesPage
