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
            <p className="text-[#704651] text-base sm:text-lg max-w-xl mx-auto mb-12">
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
                    <p className="text-[#704651] text-sm leading-relaxed mb-4">
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
      <section className="snap-section scroll-mt-24 sm:scroll-mt-28 py-20 bg-paper border-b-2 border-wine">
        <div className="max-w-[1220px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Promise Card with Stamp */}
            <div className="lg:col-span-5 flex justify-center">
              <ScrollReveal animation="zoom-in" delay={150}>
                <div className="bg-[#fff3e5] border-3 border-wine rounded-[160px_160px_28px_28px] p-10 shadow-[10px_10px_0_#6fb9c6] text-center max-w-sm w-full">
                  <div className="font-savoure italic font-bold text-7xl text-wine leading-none mb-3">
                    ♡
                  </div>
                  <p className="font-savoure italic font-bold text-xl text-wine leading-snug">
                    Ngọt ngào cả ở cách chúng mình chăm chút từng đơn hàng.
                  </p>
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
                  <li className="bg-[#fff6ed] border-b-2 border-[#e4a8ae] p-4 pl-12 relative rounded-r-xl">
                    <span className="absolute left-4 top-4 text-wine font-bold text-lg">♥</span>
                    <strong className="text-wine font-bold text-base block mb-0.5">Tiệm nghệ nhân xác nhận mẫu:</strong>
                    <span className="text-[#52202b] text-sm">Ảnh và mẫu AI là ý tưởng tham khảo; tiệm sẽ xác nhận chi tiết bánh thực tế tốt nhất trước khi làm.</span>
                  </li>
                  <li className="bg-[#fff6ed] border-b-2 border-[#e4a8ae] p-4 pl-12 relative rounded-r-xl">
                    <span className="absolute left-4 top-4 text-wine font-bold text-lg">♥</span>
                    <strong className="text-wine font-bold text-base block mb-0.5">Hẹn giờ &amp; Báo giá cụ thể:</strong>
                    <span className="text-[#52202b] text-sm">Bạn luôn biết chính xác mức giá và thời gian hoàn thành trước khi xác nhận thanh toán.</span>
                  </li>
                  <li className="bg-[#fff6ed] border-b-2 border-[#e4a8ae] p-4 pl-12 relative rounded-r-xl">
                    <span className="absolute left-4 top-4 text-wine font-bold text-lg">♥</span>
                    <strong className="text-wine font-bold text-base block mb-0.5">Đảm bảo quyền lợi khách hàng:</strong>
                    <span className="text-[#52202b] text-sm">Nền tảng hỗ trợ phản hồi, đền bù 100% nếu giao trễ hoặc sản phẩm không đúng cam kết.</span>
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
