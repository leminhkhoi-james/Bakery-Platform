import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import { useState } from 'react'
import { loadBakeries } from '../../../services/vendorService.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import CatalogState from '../../../components/catalog/CatalogState.jsx'
import CatalogImage from '../../../components/catalog/CatalogImage.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'

export const StoreDirectoryPage = ({
  customCake = null,
  onClearCustomCake,
  onAddToCart,
  onNavigate,
}) => {
  const [selectedCity, setSelectedCity] = useState('all') // 'all' | 'hcm' | 'hn'
  const [searchQuery, setSearchQuery] = useState('')
  const [district, setDistrict] = useState('')
  const [sort, setSort] = useState('name,asc')
  const [page, setPage] = useState(1)
  const resource = useCatalogResource(loadBakeries, { query: searchQuery, city: selectedCity === 'all' ? '' : selectedCity, district, sort, page, size: 6 })
  const filteredStores = resource.data?.result || []

  const handleSelectStoreForCake = (store) => {
    const cakePrice = customCake?.price || 950000
    const cakeTitle =
      customCake?.title || 'Bánh Kem Nghệ Thuật Thiết Kế Độc Bản'

    if (onAddToCart) {
      onAddToCart({
        id: `direct-order-${store.id}-${Date.now()}`,
        title: `${cakeTitle} • ${cleanPresentationLabel(store.name, 'Tiệm bánh')}`,
        price: cakePrice,
        bakery: store.name,
        image:
          customCake?.image ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ',
        sizeSpec: customCake?.selectedSize || '2 Tầng • Thiết kế riêng',
        flavor: customCake?.flavor || 'Chiffon Vani Dâu Tây Hữu Cơ',
        quantity: 1,
        deliveryDate: customCake?.deliveryDate || 'Hôm nay, 20/09/2026',
        deliveryAddress:
          customCake?.deliveryAddress || 'Giao hàng tận nơi theo yêu cầu',
      })
    }

    if (onNavigate) {
      onNavigate('cart')
    }
  }

  return (
    <div className="sc-catalog w-full min-h-screen py-4 sm:py-6 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Hero & Filter Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-primary/15 shadow-sm p-5 sm:p-7 md:p-8 space-y-5">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/50 text-secondary text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">storefront</span>
                <span>Hệ thống tiệm bánh đối tác</span>
              </div>
              <h1 className="font-savoure text-2xl sm:text-3xl lg:text-4xl font-bold text-wine tracking-normal">
                Danh Sách Cửa Hàng Bánh
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                Khám phá các nghệ nhân làm bánh kem tài hoa và tiệm bánh nghệ thuật được kiểm định chất lượng trên toàn quốc.
              </p>
            </div>

            {!customCake && (
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('subscription-plans')}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs sm:text-sm shadow-xs hover:bg-secondary-hover transition-all cursor-pointer shrink-0 self-start md:self-center"
              >
                <span className="material-symbols-outlined text-base">storefront</span>
                <span>Trở thành đối tác tiệm bánh</span>
              </button>
            )}

            {/* AI Custom Cake Flash Banner if coming from Studio */}
            {customCake && (
              <div className="p-4 rounded-2xl bg-wine text-white shadow-md max-w-md w-full border border-secondary/30 shrink-0">
                <div className="flex items-start gap-3">
                  {customCake.image && (
                    <img
                      src={customCake.image}
                      alt="Mẫu bánh vừa tạo"
                      className="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-secondary-fixed text-[11px] font-bold uppercase tracking-wider block">
                        🎂 Mẫu bánh bạn đã chọn
                      </span>
                      {onClearCustomCake && (
                        <button
                          type="button"
                          onClick={onClearCustomCake}
                          className="text-white/80 hover:text-white text-xs underline cursor-pointer"
                        >
                          ✕ Hủy chọn
                        </button>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white truncate mt-0.5">
                      {customCake.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-white/80">
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

          {/* Unified Filter & Search Toolbar */}
          <div className="bg-[#fafafc] border border-primary/10 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center gap-3">
            {/* All Bakeries Chip */}
            <button
              type="button"
              onClick={() => { setSelectedCity('all'); setDistrict(''); setPage(1) }}
              className={`px-4 py-2 rounded-full font-bold text-xs shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 transition-all ${
                selectedCity === 'all' && !district
                  ? 'bg-wine text-white'
                  : 'bg-white text-wine border border-primary/20 hover:bg-primary-fixed-dim'
              }`}
            >
              <span className="material-symbols-outlined text-sm">storefront</span>
              <span>Tất cả ({resource.data?.meta.total ?? 0} tiệm bánh)</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-base pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                placeholder="Tìm theo tên tiệm..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-primary/20 text-xs sm:text-sm text-wine placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-2xs"
              />
            </div>

            {/* City Input */}
            <div className="relative w-full sm:w-40">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none">
                location_city
              </span>
              <input
                aria-label="Thành phố cửa hàng"
                placeholder="Thành phố"
                value={selectedCity === 'all' ? '' : selectedCity}
                onChange={(event) => { setSelectedCity(event.target.value || 'all'); setPage(1) }}
                className="w-full pl-8 pr-3 py-2 rounded-full bg-white border border-primary/20 text-xs sm:text-sm text-wine placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-2xs"
              />
            </div>

            {/* District Input */}
            <div className="relative w-full sm:w-40">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none">
                explore
              </span>
              <input
                aria-label="Quận huyện cửa hàng"
                placeholder="Quận / huyện"
                value={district}
                onChange={(event) => { setDistrict(event.target.value); setPage(1) }}
                className="w-full pl-8 pr-3 py-2 rounded-full bg-white border border-primary/20 text-xs sm:text-sm text-wine placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-2xs"
              />
            </div>

            {/* Sort Select */}
            <div className="relative w-full sm:w-auto">
              <select
                aria-label="Sắp xếp cửa hàng"
                value={sort}
                onChange={(event) => { setSort(event.target.value); setPage(1) }}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-white border border-primary/20 text-xs sm:text-sm font-semibold text-wine focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-2xs cursor-pointer"
              >
                <option value="name,asc">Tên A–Z</option>
                <option value="name,desc">Tên Z–A</option>
                <option value="createdAt,desc">Mới nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Store Cards Grid */}
        <div>
          <CatalogState
            {...resource}
            empty={filteredStores.length === 0}
            emptyText="Chưa có cửa hàng phù hợp. Hãy thử thay đổi bộ lọc."
            onRetry={resource.reload}
            onNavigate={onNavigate}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {filteredStores.map((store) => {
              return (
                <div
                  key={store.id}
                  className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-primary/12 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-primary/25 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Store Top Header: Photo, Name, Badges, Location */}
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Photo Thumbnail with Rating Badge */}
                      <div className="relative shrink-0 w-full sm:w-28 sm:h-28 h-40 rounded-2xl overflow-hidden shadow-sm border border-primary/10 bg-primary-fixed/20">
                        <CatalogImage
                          src={store.image}
                          alt={cleanPresentationLabel(store.name, 'Tiệm bánh')}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onNavigate?.(`bakery-detail?id=${store.id}&view=reviews`)
                          }}
                          className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-wine shadow-xs flex items-center gap-1 hover:bg-amber-50 hover:scale-105 transition-all cursor-pointer z-10"
                          title="Bấm để xem đánh giá của tiệm bánh"
                        >
                          <span className="text-amber-500 text-xs leading-none">★</span>
                          <span>Đánh giá</span>
                        </button>
                      </div>

                      {/* Store Info */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed/40 text-secondary text-[10px] font-bold uppercase tracking-wider">
                            Tiệm bánh đối tác
                          </span>
                        </div>

                        <h3 className="font-savoure text-lg sm:text-xl font-bold text-wine mt-1 group-hover:text-secondary transition-colors">
                          <button
                            type="button"
                            className="text-left hover:underline cursor-pointer"
                            onClick={() => onNavigate?.('bakery-detail', { id: store.id })}
                          >
                            {cleanPresentationLabel(store.name, 'Tiệm bánh')}
                          </button>
                        </h3>

                        {/* Tagline / Specialty */}
                        <p className="text-xs text-on-surface-variant font-medium mt-1 line-clamp-1">
                          {store.description}
                        </p>

                        {/* Location */}
                        <div className="flex items-start gap-1.5 mt-2 text-xs text-outline">
                          <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">
                            location_on
                          </span>
                          <span className="line-clamp-2 text-on-surface-variant/90 font-normal">
                            {store.location || 'Tiệm chưa cung cấp địa chỉ.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Features Strip */}
                    <div className="mt-4 pt-3 border-t border-primary/8 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fafafc] border border-primary/10 text-on-surface-variant font-medium">
                        <span translate="no" className="material-symbols-outlined notranslate text-xs text-secondary shrink-0" aria-hidden="true">local_shipping</span>
                        <span>Xem khu vực giao hàng trong hồ sơ tiệm</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fafafc] border border-primary/10 text-on-surface-variant font-medium">
                        <svg className="w-3.5 h-3.5 text-secondary shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                        </svg>
                        <span>Trao đổi với tiệm về điều kiện đặt bánh</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-primary/10 flex flex-col sm:flex-row items-center gap-2.5">
                    {customCake ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSelectStoreForCake(store)}
                          className="w-full sm:flex-1 py-2.5 px-4 rounded-full bg-wine text-white font-bold text-xs sm:text-sm shadow-xs hover:bg-wine-dark transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">shopping_bag</span>
                          <span>Đặt Bánh Tại Tiệm Này</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigate?.('bakery-detail', { id: store.id })}
                          className="w-full sm:w-auto py-2.5 px-4 rounded-full bg-white border border-primary/20 text-wine hover:bg-primary-fixed-dim font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>Xem Menu Tiệm</span>
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onNavigate?.('bakery-detail', { id: store.id })}
                          className="w-full sm:flex-1 py-2.5 px-4 rounded-full bg-wine text-white font-bold text-xs sm:text-sm shadow-xs hover:bg-wine-dark transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">restaurant_menu</span>
                          <span>Xem Menu &amp; Mẫu Bánh</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigate && onNavigate('ai-studio')}
                          className="w-full sm:w-auto py-2.5 px-4 rounded-full bg-white border border-primary/20 text-wine hover:bg-primary-fixed-dim font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-base text-secondary">auto_awesome</span>
                          <span>Tự Thiết Kế Bánh</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {resource.status === 'ready' && <CatalogPagination meta={resource.data.meta} onPage={setPage} />}
        </div>
      </div>
    </div>
  )
}

export default StoreDirectoryPage
