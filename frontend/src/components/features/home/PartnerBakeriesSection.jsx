import ScrollReveal from '../../common/ScrollReveal.jsx'
import { loadBakeries } from '../../../services/vendorService.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import CatalogState from '../../catalog/CatalogState.jsx'
import CatalogImage from '../../catalog/CatalogImage.jsx'

export const PartnerBakeriesSection = ({ onNavigate }) => {
  const resource = useCatalogResource(loadBakeries, { page: 1, size: 3, sort: 'name,asc' })
  const filteredBakeries = resource.data?.result || []

  return (
    <section id="cho-tiem-banh" className="snap-section scroll-mt-24 sm:scroll-mt-28 py-8 sm:py-12 bg-[#d9ece8] border-t-3 border-b-3 border-wine relative min-h-[calc(100vh-5.5rem)] flex flex-col justify-center">
      <div className="max-w-[1220px] mx-auto px-6 w-full my-auto">
        {/* TOP PART: Intro Copy & Retro Shop Ticket */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-8">
          <div className="lg:col-span-7">
            <ScrollReveal animation="fade-up">
              <span className="dotted-frame-badge mb-2">Dành cho các tiệm bánh nghệ nhân</span>
              <h2 className="font-savoure text-3xl sm:text-4xl font-bold text-wine mb-2.5 leading-tight">
                Tiệm của bạn,<br />
                <em className="font-normal italic text-brand-pink">thêm nhiều câu chuyện.</em>
              </h2>
              <p className="text-on-surface text-sm sm:text-base mb-4 leading-relaxed max-w-xl">
                Mở gian hàng trên SweetCake, giới thiệu những mẫu bánh tuyệt phẩm và nhận yêu cầu thiết kế custom phù hợp với khả năng của tiệm.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="cakematch-btn py-2 px-5 text-sm"
                  href="/vendor-dashboard"
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate?.('vendor-dashboard')
                  }}
                >
                  <span>Đăng Ký Mở Tiệm Bánh</span>
                  <span className="material-symbols-outlined text-base">arrow_outward</span>
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Retro Shop Ticket */}
          <div className="lg:col-span-5 flex justify-center">
            <ScrollReveal animation="zoom-in" delay={200}>
              <div className="retro-shop-ticket py-4 px-6 max-w-sm w-full">
                <div className="font-savoure italic text-xl font-bold text-wine text-center mb-2">
                  Chào mừng tiệm bánh ♡
                </div>
                <ul className="space-y-2 text-xs text-on-surface-variant font-bold text-left pt-2 border-t border-dashed border-[#d899a5]">
                  <li className="flex items-center gap-2">
                    <span className="text-wine">✦</span> Trưng bày bộ sưu tập bánh nghệ nhân của tiệm
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-wine">✦</span> Xem yêu cầu custom theo khu vực TP.HCM
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-wine">✦</span> Chủ động báo giá và thời gian làm bánh
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-wine">✦</span> Quản lý đơn hàng &amp; nhận thanh toán tiện lợi
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* BOTTOM PART: Featured Partner Bakeries List */}
        <div className="pt-6 border-t border-wine/20">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <span className="dotted-frame-badge text-xs px-3 py-1 mb-0">Khám phá tiệm bánh</span>
                <h3 className="font-savoure text-2xl sm:text-3xl font-bold text-wine">
                  Tiệm Bánh Trên SweetCake
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-wine uppercase tracking-wider">Khu vực:</span>
                <button
                  type="button"
                  onClick={() => onNavigate?.('stores')}
                  className="px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer bg-wine text-white border-wine"
                >
                  Tất cả cửa hàng
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Bakery Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CatalogState {...resource} empty={filteredBakeries.length === 0} emptyText="Chưa có tiệm bánh công khai." onRetry={resource.reload} onNavigate={onNavigate} />
            {filteredBakeries.map((bakery, idx) => (
              <ScrollReveal key={bakery.id} animation="fade-up" delay={idx * 100}>
                <div className="dome-cake-card group flex flex-col h-full">
                  <div className="h-32 sm:h-36 overflow-hidden relative border-b-2 border-wine bg-[#fff0e6]">
                    <CatalogImage
                      alt={bakery.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={bakery.image}
                    />
                    <span className="absolute top-2.5 right-2.5 bg-wine text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      {bakery.location || 'Chưa có địa chỉ'}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between bg-paper">
                    <div>
                      <span className="text-wine text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                        {bakery.city}
                      </span>
                      <h4 className="font-savoure text-lg font-bold italic text-wine mb-1">
                        {bakery.name}
                      </h4>
                      <p className="text-on-surface-variant text-xs leading-relaxed mb-3 line-clamp-2">
                        {bakery.description}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-wine/10 flex items-center justify-end">
                      <a
                        className="text-wine font-extrabold text-xs underline underline-offset-4 hover:text-primary-container transition-colors inline-flex items-center gap-1"
                        href={'/bakery-detail?id=' + encodeURIComponent(bakery.id)}
                        onClick={(e) => {
                          e.preventDefault()
                          onNavigate?.('bakery-detail', { id: bakery.id })
                        }}
                      >
                        <span className="hover:underline">Xem Menu</span>
                        <span className="material-symbols-outlined text-xs no-underline">arrow_outward</span>
                      </a>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PartnerBakeriesSection
