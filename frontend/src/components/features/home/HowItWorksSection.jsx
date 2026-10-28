import { HOW_IT_WORKS_STEPS } from '../../../mockData/customer/home.js'
import ScrollReveal from '../../common/ScrollReveal.jsx'

export const HowItWorksSection = ({ onNavigate }) => {
  return (
    <>
      {/* Step Cards Section */}
      <section className="snap-section scroll-mt-24 sm:scroll-mt-28 py-20 bg-pink-light border-b-2 border-wine relative" id="cach-hoat-dong">
        <div className="max-w-[1220px] mx-auto px-6 text-center">
          <ScrollReveal animation="fade-up">
            <span className="dotted-frame-badge">Từ ý tưởng đến chiếc bánh thật</span>
            <h2 className="font-savoure text-4xl sm:text-5xl font-bold text-wine mb-4">
              Quy trình đặt bánh đơn giản.
            </h2>
            <p className="text-on-surface-variant text-base sm:text-lg max-w-xl mx-auto mb-12">
              Dù bạn chọn bánh có sẵn hay đặt thiết kế riêng, quy trình luôn rõ ràng và minh bạch.
            </p>
          </ScrollReveal>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {HOW_IT_WORKS_STEPS.map((step, idx) => (
              <ScrollReveal key={step.stepNum} animation="fade-up" delay={idx * 120}>
                <div className="bg-paper border-2 border-wine rounded-2xl p-6 shadow-[5px_6px_0_#e1a0af] flex flex-col justify-between h-full">
                  <div>
                    {/* Dotted Circle Step Number */}
                    <div className="font-savoure italic text-2xl font-bold text-wine w-14 h-14 rounded-full border-2 border-dashed border-wine bg-butter flex items-center justify-center mb-5 shadow-xs">
                      {step.stepNum < 10 ? `0${step.stepNum}` : step.stepNum}
                    </div>

                    <h3 className="font-savoure text-xl font-bold text-wine mb-2">
                      {step.title}
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-wine/10 text-wine text-xs font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">{step.tagIcon || 'check_circle'}</span>
                    <span>{step.tagLabel}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-10">
            <a
              className="cakematch-btn-secondary"
              href="/ai-studio"
              onClick={(e) => {
                e.preventDefault()
                onNavigate && onNavigate('ai-studio')
              }}
            >
              <span>Viết ý tưởng của bạn</span>
              <span className="material-symbols-outlined text-base">arrow_outward</span>
            </a>
          </div>
        </div>
      </section>

      {/* Heart Promise & Assurance Section */}
      <section className="snap-section scroll-mt-24 sm:scroll-mt-28 py-20 striped-assurance-bg border-b-2 border-wine relative overflow-hidden">
        {/* Top Scalloped Ruffle Lace Edge */}
        <div className="absolute top-0 left-0 right-0 h-3 overflow-hidden pointer-events-none select-none z-10 opacity-90">
          <div
            className="w-full h-full bg-repeat-x"
            style={{
              backgroundImage: 'radial-gradient(circle at 12px 0px, #ffc6db 8px, transparent 9px)',
              backgroundSize: '24px 10px',
            }}
          />
        </div>

        {/* Ambient Decorative Floating Sparkles & Hearts */}
        <div className="absolute top-16 right-1/4 text-wine/35 font-bold text-2xl pointer-events-none select-none">✦</div>
        <div className="absolute bottom-16 left-1/5 text-primary/30 font-bold text-xl pointer-events-none select-none">✧</div>
        <div className="absolute top-1/3 left-6 text-secondary/70 font-bold text-lg pointer-events-none select-none">★</div>
        <div className="absolute bottom-10 right-1/3 text-wine/30 font-bold text-base pointer-events-none select-none">♥</div>

        {/* Floating Top-Left Decorative Cloud Cluster (Mint Dots + Strawberry) */}
        <div className="absolute -top-4 -left-10 sm:left-4 md:left-8 pointer-events-none select-none opacity-85 scale-75 sm:scale-85 md:scale-95 z-0">
          <div className="relative w-44 h-24">
            <div className="absolute inset-0 rounded-full pattern-dots-mint border-2 border-wine shadow-[3px_3px_0_#9f1e31]"></div>
            <div className="absolute -top-4 left-6 w-20 h-20 rounded-full pattern-dots-mint border-t-2 border-l-2 border-wine"></div>
            <div className="absolute -bottom-2 right-6 bg-[#be4876] text-white rounded-full w-7 h-7 flex items-center justify-center border border-wine text-xs shadow-xs">
              🍓
            </div>
          </div>
        </div>

        {/* Floating Bottom-Right Decorative Cloud Cluster (Pink Dots + Star) */}
        <div className="absolute -bottom-6 -right-10 sm:right-6 md:right-10 pointer-events-none select-none opacity-90 scale-75 sm:scale-85 md:scale-95 z-0">
          <div className="relative w-48 h-24">
            <div className="absolute inset-0 rounded-full pattern-dots-pink border-2 border-wine shadow-[3px_3px_0_#9f1e31]"></div>
            <div className="absolute -top-5 right-8 w-20 h-20 rounded-full pattern-dots-pink border-t-2 border-r-2 border-wine"></div>
            <div className="absolute bottom-2 left-6 text-wine font-bold text-sm">★</div>
            <div className="absolute -top-2 left-8 bg-[#ffe4a6] text-wine rounded-full w-6 h-6 flex items-center justify-center border border-wine text-xs font-bold shadow-xs">
              ♥
            </div>
          </div>
        </div>

        <div className="max-w-[1220px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Promise Card with Stamp */}
            <div className="lg:col-span-5 flex justify-center">
              <ScrollReveal animation="zoom-in" delay={150}>
                <div className="relative group max-w-sm w-full">
                  {/* Decorative Ribbon Bow Seal on Top of Arch */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                    <div className="w-12 h-12 bg-primary text-white rounded-full border-2 border-wine shadow-[2px_3px_0_#741329] flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110">
                      🎀
                    </div>
                  </div>

                  {/* Main Arch Card */}
                  <div className="bg-[#fff3e5] border-3 border-wine rounded-[160px_160px_32px_32px] p-7 sm:p-9 shadow-[10px_10px_0_#6fb9c6] text-center w-full transition-transform duration-300 group-hover:-translate-y-1">
                    {/* Inner Stitched Dotted Border */}
                    <div className="border-2 border-dashed border-wine/30 rounded-[135px_135px_22px_22px] px-5 py-7 bg-[#fffaf3]/85 flex flex-col items-center">
                      {/* Illustrated Heart Icon with Sparkles */}
                      <div className="relative mb-3 flex items-center justify-center">
                        <span className="text-wine/30 absolute -top-1 -right-3 text-sm">✦</span>
                        <span className="text-wine/30 absolute -bottom-1 -left-3 text-xs">✧</span>
                        <div className="w-16 h-16 rounded-full bg-primary-fixed border-2 border-wine flex items-center justify-center shadow-xs">
                          <span className="font-savoure italic font-bold text-4xl text-wine leading-none">
                            ♥
                          </span>
                        </div>
                      </div>

                      {/* Quote Text */}
                      <p className="font-savoure italic font-bold text-xl sm:text-2xl text-wine leading-snug mb-5">
                        Ngọt ngào cả ở cách chúng mình chăm chút từng đơn hàng.
                      </p>

                      {/* Bakery Assurance Seal Badge */}
                      <div className="w-full pt-4 border-t border-dashed border-wine/25 flex flex-col items-center gap-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-butter border border-wine/40 rounded-full text-[11px] font-bold text-wine shadow-xs">
                          <span>★</span>
                          <span className="uppercase tracking-wider">SweetCake Assurance</span>
                          <span>★</span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant italic mt-0.5 font-medium">
                          100% Chăm chút tận tâm • Trao gửi trọn vẹn
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Promise List */}
            <div className="lg:col-span-7">
              <ScrollReveal animation="fade-up" delay={200}>
                <span className="dotted-frame-badge mb-3">Yên tâm chọn bánh</span>
                <h2 className="font-savoure text-4xl sm:text-5xl font-bold text-wine mb-6 leading-tight">
                  Rõ ràng từ lúc chọn<br />đến lúc nhận.
                </h2>

                <ul className="space-y-4">
                  {/* Item 1 */}
                  <li className="bg-surface-bright/95 backdrop-blur-xs border-2 border-wine rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0_#9f1e31] transition-all duration-300 hover:translate-x-1.5 hover:shadow-[6px_6px_0_#9f1e31] flex items-start gap-4">
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-[#ffe4a6] border-2 border-wine flex items-center justify-center text-wine shadow-xs mt-0.5">
                      <span className="material-symbols-outlined text-2xl">palette</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <strong className="text-wine font-bold text-base sm:text-lg">
                          Tiệm nghệ nhân xác nhận mẫu
                        </strong>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffc6db] border border-wine/30 text-wine">
                          Chuẩn xác
                        </span>
                      </div>
                      <p className="text-on-surface text-sm leading-relaxed">
                        Ảnh và mẫu AI là ý tưởng tham khảo; tiệm sẽ xác nhận chi tiết bánh thực tế tốt nhất trước khi làm.
                      </p>
                    </div>
                  </li>

                  {/* Item 2 */}
                  <li className="bg-surface-bright/95 backdrop-blur-xs border-2 border-wine rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0_#9f1e31] transition-all duration-300 hover:translate-x-1.5 hover:shadow-[6px_6px_0_#9f1e31] flex items-start gap-4">
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-[#ffc6db] border-2 border-wine flex items-center justify-center text-wine shadow-xs mt-0.5">
                      <span className="material-symbols-outlined text-2xl">schedule</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <strong className="text-wine font-bold text-base sm:text-lg">
                          Hẹn giờ &amp; Báo giá cụ thể
                        </strong>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-butter border border-wine/30 text-wine">
                          Minh bạch
                        </span>
                      </div>
                      <p className="text-on-surface text-sm leading-relaxed">
                        Bạn luôn biết chính xác mức giá và thời gian hoàn thành trước khi xác nhận thanh toán.
                      </p>
                    </div>
                  </li>

                  {/* Item 3 */}
                  <li className="bg-surface-bright/95 backdrop-blur-xs border-2 border-wine rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0_#9f1e31] transition-all duration-300 hover:translate-x-1.5 hover:shadow-[6px_6px_0_#9f1e31] flex items-start gap-4">
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-[#d7e9e7] border-2 border-wine flex items-center justify-center text-wine shadow-xs mt-0.5">
                      <span className="material-symbols-outlined text-2xl">verified_user</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <strong className="text-wine font-bold text-base sm:text-lg">
                          Đảm bảo quyền lợi khách hàng
                        </strong>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d7e9e7] border border-wine/30 text-wine">
                          100% An tâm
                        </span>
                      </div>
                      <p className="text-on-surface text-sm leading-relaxed">
                        Nền tảng hỗ trợ phản hồi, đền bù 100% nếu giao trễ hoặc sản phẩm không đúng cam kết.
                      </p>
                    </div>
                  </li>
                </ul>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default HowItWorksSection
