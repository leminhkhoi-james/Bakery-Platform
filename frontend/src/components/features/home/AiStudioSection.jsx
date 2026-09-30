import { AI_SHOWCASE_DATA } from '../../../mockData/customer/aiDesigns.js'

export const AiStudioSection = () => {
  const { promptText, extractedTags, metrics, conceptImage, liveQuotes, valuePillars } =
    AI_SHOWCASE_DATA

  return (
    <section className="w-full py-16 lg:py-24 bg-surface-container-low relative">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container mb-4">
            <span className="material-symbols-outlined text-base text-secondary">
              auto_awesome
            </span>
            <span className="font-label-md text-label-md uppercase tracking-wider font-bold">
              ĐỘC QUYỀN SWEET CAKE - BẮT ĐẦU TỰ THIẾT KẾ BÁNH
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
            Biến Trí Tưởng Tượng Thành Chiếc Bánh Kem Có Thật Trong 30 Giây
          </h2>
        </div>

        {/* AI Interactive Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          {/* Left: Prompt Simulator Card */}
          <div className="lg:col-span-6 bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-[0_8px_24px_-4px_rgba(45,30,24,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  magic_button
                </span>
                <span className="font-label-lg text-label-lg text-primary">
                  Mô phỏng Prompt Thiết Kế Bánh
                </span>
              </div>
              <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-primary text-on-primary">
                SweetAI v3.2
              </span>
            </div>

            {/* Prompt Box */}
            <div className="bg-surface-container p-4 rounded-xl mb-4 text-on-surface font-body-md text-body-md leading-relaxed relative">
              <span className="text-secondary font-semibold">"</span>
              {promptText}
              <span className="text-secondary font-semibold">"</span>
            </div>

            {/* Tags Extracted by AI */}
            <div className="flex flex-wrap gap-2 mb-6">
              {extractedTags.map((tag, idx) => (
                <span
                  key={idx}
                  className={`font-label-sm text-label-sm px-3 py-1 rounded-full flex items-center gap-1 ${
                    tag.isHighlight
                      ? 'bg-secondary-fixed/40 text-on-secondary-container'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {tag.icon && (
                    <span className="material-symbols-outlined text-xs">{tag.icon}</span>
                  )}
                  {tag.label}
                </span>
              ))}
            </div>

            {/* AI Metric Analysis Bar */}
            <div className="bg-surface-container-low p-4 rounded-xl mb-6 space-y-3">
              <div className="flex justify-between items-center font-label-md text-label-md">
                <span className="text-on-surface-variant">Độ phức tạp tạo hình:</span>
                <span className="text-secondary font-bold">
                  {metrics.complexityScore}
                </span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2">
                <div
                  className="bg-secondary h-2 rounded-full"
                  style={{ width: metrics.complexityPercent }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">
                    Ước tính khoảng giá:
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    {metrics.priceEstimate}
                  </span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">
                    Thời gian chế tác:
                  </span>
                  <span className="font-label-lg text-label-lg text-primary font-semibold">
                    {metrics.craftTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                className="flex-1 py-3 px-5 bg-primary text-on-primary rounded-full font-label-lg text-label-lg text-center hover:bg-secondary transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                href="/ai-studio"
              >
                <span className="material-symbols-outlined text-base">
                  auto_fix_high
                </span>
                <span>Bắt đầu tự thiết kế bánh 🪄</span>
              </a>
              <a
                className="flex-1 py-3 px-5 bg-secondary-container/40 text-on-secondary-container rounded-full font-label-lg text-label-lg text-center hover:bg-secondary-container transition-all flex items-center justify-center gap-2 cursor-pointer"
                href="/bidding"
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>Đăng Lên Sàn Báo Giá 🚀</span>
              </a>
            </div>
          </div>

          {/* Right: Showcase Result Card with Live Bakery Quotes */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="relative bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_16px_36px_-6px_rgba(45,30,24,0.08)] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
                  <span className="font-label-lg text-label-lg text-primary">
                    Phác Thảo AI 3D Render &amp; Đấu Thầu Trực Tiếp
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
                  {liveQuotes.length} Tiệm vừa chào giá
                </span>
              </div>

              {/* Visual Concept Render */}
              <div className="relative h-64 rounded-xl overflow-hidden bg-surface-container mb-4">
                <img
                  className="w-full h-full object-cover"
                  alt={conceptImage.alt}
                  src={conceptImage.url}
                />
                <div className="absolute top-3 right-3 bg-primary/80 backdrop-blur-md text-on-primary px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">3d_rotation</span>
                  <span>360° AI View</span>
                </div>
                <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-secondary text-sm">
                    verified
                  </span>
                  <span>{conceptImage.matchCommitment}</span>
                </div>
              </div>

              {/* Live Bakery Quotes Feed */}
              <div className="space-y-2.5">
                {liveQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">store</span>
                      <div>
                        <h5 className="font-label-lg text-label-lg text-primary">
                          {q.bakery}
                        </h5>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {q.rating} • {q.sla}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-label-lg text-label-lg text-secondary font-bold">
                        {q.price}
                      </div>
                      <button className="font-label-sm text-label-sm text-primary hover:underline font-semibold cursor-pointer">
                        Chọn tiệm này
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3 AI Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mt-12">
          {valuePillars.map((pillar, idx) => (
            <div key={idx} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-secondary-container/40 flex items-center justify-center text-secondary mb-4">
                <span className="material-symbols-outlined text-2xl">{pillar.icon}</span>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-primary mb-2">
                {pillar.title}
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AiStudioSection
