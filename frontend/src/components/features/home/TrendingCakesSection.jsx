import { TRENDING_FILTER_TAGS as FILTER_TAGS, TRENDING_CAKES as CAKES } from '../../../mockData/customer/cakes.js'
import { useState } from 'react'





export const TrendingCakesSection = ({ onAddToCart }) => {
  const [activeFilter, setActiveFilter] = useState('Tất cả (48)')
  const [favorites, setFavorites] = useState([1])

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <section className="w-full py-16 lg:py-24 bg-surface">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Section Header with Category Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-secondary font-label-md text-label-md uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-base">
                local_fire_department
              </span>
              <span>Bán chạy nhất tuần qua</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
              Top Bánh Kem Nổi Bật Được Yêu Thích Nhất
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl">
              Tuyển chọn các tác phẩm bánh kem nghệ thuật thủ công tinh tế, bán chạy nhất tuần qua từ các xưởng bánh uy tín trên sàn.
            </p>
          </div>
          <a
            className="inline-flex items-center gap-1 text-secondary font-label-lg text-label-lg hover:underline cursor-pointer"
            href="/explore"
          >
            <span>Xem tất cả 1.200+ mẫu bánh</span>
            <span className="material-symbols-outlined text-base">east</span>
          </a>
        </div>

        {/* Filter Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveFilter(tag)}
              className={`px-4 py-2 rounded-full font-label-md text-label-md shrink-0 transition-all cursor-pointer ${
                activeFilter === tag
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* 4 Curated Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {CAKES.map((cake) => {
            const isFav = favorites.includes(cake.id)
            return (
              <div
                key={cake.id}
                className="group bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_8px_24px_-4px_rgba(45,30,24,0.04)] hover:shadow-[0_16px_36px_-6px_rgba(45,30,24,0.1)] transition-all flex flex-col"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-surface-container">
                  <img
                    alt={cake.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={cake.image}
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {cake.isAiTrending ? (
                      <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          auto_awesome
                        </span>
                        {cake.tag}
                      </span>
                    ) : (
                      cake.tag && (
                        <span className="px-2.5 py-1 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm">
                          {cake.tag}
                        </span>
                      )
                    )}
                    {cake.subTag && (
                      <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-label-sm text-label-sm">
                        {cake.subTag}
                      </span>
                    )}
                  </div>


                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm mb-1">
                      <span>{cake.vendor || cake.bakeryName || 'SweetCake Studio'}</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary group-hover:text-secondary transition-colors line-clamp-1">
                      {cake.title}
                    </h3>
                    <p className="font-body-sm text-body-sm text-outline mt-1 line-clamp-1">
                      {cake.description || cake.sizeSpec || 'Bánh làm tươi trong ngày'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">
                        Giá chuẩn
                      </span>
                      <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                        {typeof cake.price === 'number'
                          ? `${cake.price.toLocaleString('vi-VN')}đ`
                          : (cake.price || '520.000đ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        className="p-2 rounded-full bg-surface-container text-primary hover:bg-secondary-container transition-colors cursor-pointer"
                        href="/ai-studio"
                        title="Bắt đầu tự thiết kế bánh"
                      >
                        <span className="material-symbols-outlined text-base">
                          auto_fix_high
                        </span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          if (onAddToCart) onAddToCart(cake)
                          try {
                            localStorage.setItem('sweetcake_direct_checkout', 'true')
                          } catch {}
                          if (onNavigate) onNavigate('cart')
                        }}
                        className="px-3 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-secondary transition-colors cursor-pointer"
                      >
                        Đặt nhanh
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default TrendingCakesSection
