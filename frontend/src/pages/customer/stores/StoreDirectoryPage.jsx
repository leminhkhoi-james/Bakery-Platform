import { useState, useEffect } from 'react'

import { STORES } from '../../../mockData/customer/stores.js'

export const StoreDirectoryPage = ({
  customCake = null,
  onClearCustomCake,
  onAddToCart,
  onNavigate,
}) => {
  const [selectedCity, setSelectedCity] = useState('all') // 'all' | 'hcm' | 'hn'
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStores = STORES.filter((store) => {
    const matchesCity = selectedCity === 'all' || store.city === selectedCity
    const matchesSearch =
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.chef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCity && matchesSearch
  })

  const handleSelectStoreForCake = (store) => {
    const cakePrice = customCake?.price || 950000
    const cakeTitle =
      customCake?.title || 'Bánh Kem Nghệ Thuật Thiết Kế Độc Bản'

    if (onAddToCart) {
      onAddToCart({
        id: `direct-order-${store.id}-${Date.now()}`,
        title: `${cakeTitle} • ${store.name}`,
        price: cakePrice,
        bakery: `${store.name} (${store.chef.split('&')[0].trim()})`,
        image:
          customCake?.image ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ',
        sizeSpec: customCake?.selectedSize || '2 Tầng • Thiết kế riêng',
        flavor: customCake?.flavor || 'Chiffon Vani Dâu Tây Hữu Cơ',
        quantity: 1,
        deliveryDate: customCake?.deliveryDate || 'Hôm nay, 20/09/2026',
        deliveryAddress:
          customCake?.deliveryAddress || 'Giao xe lạnh tận nơi theo yêu cầu',
      })
    }

    if (onNavigate) {
      onNavigate('cart')
    }
  }

  return (
    <div className="w-full striped-candy-bg min-h-screen">
      {/* Top Hero Section */}
      <div className="bg-transparent border-b border-outline-variant/10 py-6 sm:py-8 px-4 sm:px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
          {/* Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-[44px] text-primary font-bold tracking-tight drop-shadow-sm">
                Danh Sách Cửa Hàng Bánh
              </h1>
            </div>

            {/* AI Custom Cake Flash Banner if coming from Studio */}
            {customCake && (
              <div className="p-4 rounded-2xl bg-primary text-on-primary shadow-lg max-w-md w-full border border-secondary/30 shrink-0">
                <div className="flex items-start gap-3">
                  {customCake.image && (
                    <img
                      src={customCake.image}
                      alt="Mẫu bánh vừa tạo"
                      className="w-14 h-14 rounded-xl object-cover border border-on-primary/20 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-secondary-fixed text-label-xs font-bold uppercase tracking-wider block">
                        🎂 Mẫu bánh bạn đã chọn
                      </span>
                      {onClearCustomCake && (
                        <button
                          type="button"
                          onClick={onClearCustomCake}
                          className="text-surface-variant hover:text-white text-xs underline cursor-pointer"
                        >
                          ✕ Hủy chọn
                        </button>
                      )}
                    </div>
                    <h4 className="font-label-md font-bold text-on-primary truncate">
                      {customCake.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1 text-label-sm">
                      <span className="text-surface-variant">
                        {customCake.selectedSize || 'Size đã chọn'}
                      </span>
                      <span className="font-semibold text-secondary-fixed">
                        Chọn tiệm bên dưới để đặt
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            {/* City Tabs - TP. Hồ Chí Minh strictly */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCity('all')}
                className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm whitespace-nowrap cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm text-secondary-container">
                  location_on
                </span>
                <span>TP. Hồ Chí Minh ({STORES.length} tiệm bánh)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tiệm, quận, bếp trưởng..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-surface border border-outline-variant/30 text-primary placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Store Cards Grid */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="rounded-3xl bg-surface-container-low border border-outline-variant/15 p-6 md:p-8 hover:shadow-xl hover:border-secondary/30 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Store Top Header: Photo, Name, Location */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={store.image}
                      alt={store.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">
                      {store.name}
                    </h3>

                    <div className="flex items-center gap-1.5 mt-2 text-label-xs text-outline">
                      <span className="material-symbols-outlined text-sm text-secondary">
                        location_on
                      </span>
                      <span className="truncate">{store.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-5 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center gap-3">
                {customCake ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSelectStoreForCake(store)}
                      className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-secondary transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-lg"
                    >
                      <span className="material-symbols-outlined text-lg text-secondary-container">
                        shopping_bag
                      </span>
                      <span>Đặt Bánh Tại Tiệm Này</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('explore')}
                      className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-surface-container-high text-primary hover:bg-surface-container-highest font-label-md text-label-md font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Xem Menu Tiệm</span>
                      <span className="material-symbols-outlined text-base">
                        arrow_forward
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('explore')}
                      className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-secondary transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-lg"
                    >
                      <span className="material-symbols-outlined text-lg text-secondary-container">
                        restaurant_menu
                      </span>
                      <span>Xem Menu &amp; Mẫu Bánh</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('ai-studio')}
                      className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-surface-container-high text-primary hover:bg-surface-container-highest font-label-md text-label-md font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-secondary">
                        auto_awesome
                      </span>
                      <span>Tự Thiết Kế Bánh</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StoreDirectoryPage
