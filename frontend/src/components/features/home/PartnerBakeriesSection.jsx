import { PARTNER_BAKERIES as BAKERIES } from '../../../mockData/customer/stores.js'
import { useState } from 'react'
import ScrollReveal from '../../common/ScrollReveal.jsx'

export const PartnerBakeriesSection = ({ onNavigate }) => {
  const [selectedCity, setSelectedCity] = useState('all')

  const filteredBakeries =
    selectedCity === 'all'
      ? BAKERIES
      : BAKERIES.filter((b) => b.city === selectedCity)

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
                <em className="font-normal italic text-[#be4876]">thêm nhiều câu chuyện.</em>
              </h2>
              <p className="text-[#52202b] text-sm sm:text-base mb-4 leading-relaxed max-w-xl">
                Mở gian hàng trên SweetCake, giới thiệu những mẫu bánh tuyệt phẩm và nhận yêu cầu thiết kế custom phù hợp với khả năng của tiệm.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="cakematch-btn py-2 px-5 text-sm"
                  href="/vendor-dashboard"
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate && onNavigate('vendor-dashboard')
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
                <ul className="space-y-2 text-xs text-[#71404b] font-bold text-left pt-2 border-t border-dashed border-[#d899a5]">
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
                <span className="dotted-frame-badge text-xs px-3 py-1 mb-0">Đối tác xuất sắc</span>
                <h3 className="font-savoure text-2xl sm:text-3xl font-bold text-wine">
                  Top Tiệm Bánh Đối Tác Nổi Bật
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-wine uppercase tracking-wider">Khu vực:</span>
                <button
                  type="button"
                  onClick={() => setSelectedCity('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${selectedCity === 'all'
                    ? 'bg-wine text-white border-wine'
                    : 'bg-paper text-wine border-wine/30 hover:bg-wine/10'
                    }`}
                >
                  Tất cả TP.HCM
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Bakery Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredBakeries.map((bakery, idx) => (
              <ScrollReveal key={bakery.id} animation="fade-up" delay={idx * 100}>
                <div className="dome-cake-card group flex flex-col h-full">
                  <div className="h-32 sm:h-36 overflow-hidden relative border-b-2 border-wine bg-[#fff0e6]">
                    <img
                      alt={bakery.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={bakery.image}
                    />
                    <span className="absolute top-2.5 right-2.5 bg-wine text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      {bakery.location}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between bg-paper">
                    <div>
                      <span className="text-wine text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                        {bakery.subtitle}
                      </span>
                      <h4 className="font-savoure text-lg font-bold italic text-wine mb-1">
                        {bakery.name}
                      </h4>
                      <p className="text-[#704350] text-xs leading-relaxed mb-3 line-clamp-2">
                        {bakery.description}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-wine/10 flex items-center justify-between">
                      <span className="text-xs text-wine font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">{bakery.perkIcon || 'verified'}</span>
                        {bakery.perk}
                      </span>
                      <a
                        className="text-wine font-extrabold text-xs underline underline-offset-4 hover:text-[#b8273b] transition-colors"
                        href="/explore"
                        onClick={(e) => {
                          e.preventDefault()
                          onNavigate && onNavigate('explore')
                        }}
                      >
                        <span className="hover:underline">Xem Menu</span>
                        <span className="material-symbols-outlined text-xs inline-block align-middle ml-0.5 no-underline">arrow_outward</span>
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
