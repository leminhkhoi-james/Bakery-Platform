import { BEST_SELLERS, BEST_SELLER_SIZES as SIZES } from '../../../mockData/customer/cakes.js'
import { useState } from 'react'
import ScrollReveal from '../../common/ScrollReveal.jsx'

export const BestSellersSection = ({ onAddToCart, onNavigate }) => {
  const [selectedSizes, setSelectedSizes] = useState({
    'best-seller-1': '14cm',
    'best-seller-2': '14cm',
    'best-seller-3': '14cm',
    'best-seller-4': '14cm',
  })

  const setSizeForProduct = (productId, size) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: size,
    }))
  }

  const getCalculatedPrice = (cake, productId) => {
    const currentSize = selectedSizes[productId] || '14cm'
    if (cake && cake.sizes && Array.isArray(cake.sizes)) {
      const foundSize = cake.sizes.find(sz => (sz.size || sz.label) === currentSize)
      if (foundSize && foundSize.price) {
        return foundSize.price
      }
    }
    const basePrice = cake.basePrice || cake.price || 0
    const sizeObj = SIZES.find((s) => (s.size || s.label) === currentSize)
    const multiplier = sizeObj ? (sizeObj.multiplier ?? sizeObj.priceMultiplier ?? 1) : 1
    return Math.round(Number(basePrice) * multiplier)
  }

  const handleQuickBiddingOrder = (cake, currentSize, calculatedPrice) => {
    const cakeToOrder = {
      ...cake,
      selectedSize: currentSize,
      sizeSpec: currentSize,
      price: calculatedPrice || cake.price,
    }

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

  return (
    <section className="snap-section scroll-mt-24 sm:scroll-mt-28 py-20 bg-[#fffaf3] border-b-2 border-[#9f1e31]" id="mau-banh-ban-chay">
      <div className="max-w-[1220px] mx-auto px-6">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="dotted-frame-badge">Mẫu bánh nổi bật</span>
              <h2 className="font-savoure text-4xl sm:text-5xl font-bold text-[#9f1e31]">
                Bán Chạy Nhất Tuần
              </h2>
            </div>

            <a
              className="text-[#9f1e31] font-extrabold text-base underline underline-offset-4 hover:text-[#b8273b] transition-colors flex items-center gap-1 cursor-pointer"
              href="/explore"
              onClick={(e) => {
                e.preventDefault()
                onNavigate && onNavigate('explore')
              }}
            >
              <span className="hover:underline">Xem tất cả mẫu bánh</span>
              <span className="material-symbols-outlined text-lg no-underline transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">arrow_outward</span>
            </a>
          </div>
        </ScrollReveal>

        {/* Cake Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {BEST_SELLERS.map((cake, idx) => {
            const currentSize = selectedSizes[cake.id] || '14cm'
            const calculatedPrice = getCalculatedPrice(cake, cake.id)
            const availableSizes = (cake.sizes && cake.sizes.length > 0) ? cake.sizes : SIZES

            return (
              <ScrollReveal key={cake.id} animation="fade-up" delay={idx * 100}>
                <div className="dome-cake-card group flex flex-col h-full bg-[#fffaf3]">
                  {/* Card Image */}
                  <div
                    className="relative aspect-square overflow-hidden bg-[#fff0e6] border-b-2 border-[#9f1e31] cursor-pointer"
                    onClick={() =>
                      onNavigate &&
                      onNavigate('product-detail', {
                        ...cake,
                        price: calculatedPrice,
                        selectedSize: currentSize,
                      })
                    }
                  >
                    <img
                      alt={cake.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={cake.image}
                    />
                    <span className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#9f1e31] text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap z-10">
                      {cake.tag || 'Hot'}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1 bg-[#fffaf3] justify-between">
                    <div>
                      <h3
                        className="font-savoure text-xl font-bold italic text-[#9f1e31] mb-2 line-clamp-1 cursor-pointer hover:text-[#b8273b] transition-colors"
                        onClick={() =>
                          onNavigate &&
                          onNavigate('product-detail', {
                            ...cake,
                            price: calculatedPrice,
                            selectedSize: currentSize,
                          })
                        }
                      >
                        {cake.title}
                      </h3>

                      <p className="text-[#704350] text-xs leading-relaxed mb-4 line-clamp-2">
                        {cake.description}
                      </p>
                    </div>

                    <div>
                      {/* Size Selector Buttons */}
                      <div className="mb-4">
                        <span className="text-[11px] font-extrabold text-[#9f1e31] uppercase tracking-wider block mb-1.5">
                          Chọn kích thước:
                        </span>
                        <div className="flex items-center justify-between gap-1.5 p-1 bg-[#ffe2e9] border border-[#9f1e31]/40 rounded-xl">
                          {availableSizes.map((s) => {
                            const sizeLabel = typeof s === 'string' ? s : (s.size || s.label || '')
                            const isSelected = currentSize === sizeLabel

                            return (
                              <button
                                key={sizeLabel}
                                type="button"
                                onClick={() => setSizeForProduct(cake.id, sizeLabel)}
                                className={`flex-1 py-1.5 px-1 text-center text-xs font-extrabold rounded-lg transition-all cursor-pointer ${isSelected
                                  ? 'bg-[#9f1e31] text-white shadow-md scale-[1.03]'
                                  : 'text-[#9f1e31] bg-white/70 hover:bg-[#9f1e31]/20'
                                  }`}
                              >
                                {sizeLabel}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Price & Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#9f1e31]/15">
                        <div>
                          <span className="font-savoure text-xl font-bold text-[#9f1e31]">
                            {calculatedPrice.toLocaleString('vi-VN')}đ
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onAddToCart &&
                              onAddToCart({
                                ...cake,
                                selectedSize: currentSize,
                                price: calculatedPrice,
                              })
                            }
                            className="w-9 h-9 rounded-full border-2 border-[#9f1e31] bg-[#fffaf3] text-[#9f1e31] hover:bg-[#9f1e31] hover:text-white transition-colors cursor-pointer flex items-center justify-center font-extrabold text-base shadow-xs"
                            title="Thêm vào giỏ hàng"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickBiddingOrder(cake, currentSize, calculatedPrice)}
                            className="px-3.5 py-2 rounded-full bg-[#9f1e31] text-white font-bold text-xs hover:bg-[#b8273b] active:bg-[#741329] transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 border border-[#9f1e31]"
                            title="Đặt nhanh"
                          >
                            <span>Đặt nhanh</span>
                            <span className="material-symbols-outlined text-xs">arrow_outward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default BestSellersSection
