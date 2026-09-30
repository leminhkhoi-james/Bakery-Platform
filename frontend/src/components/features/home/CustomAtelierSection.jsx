import { useState } from 'react'
import { CUSTOM_ATELIER_STEPS } from '../../../mockData/customer/home.js'
import ScrollReveal from '../../common/ScrollReveal.jsx'

export const CustomAtelierSection = ({ onNavigate }) => {
  const [ideaText, setIdeaText] = useState('')
  const [selectedTone, setSelectedTone] = useState('Hồng dịu')
  const [showPreview, setShowPreview] = useState(false)

  const tones = [
    { name: 'Hồng dịu', bg: '#ffbad1', cakePos: '0% center' },
    { name: 'Xanh pastel', bg: '#d7e9e7', cakePos: '50% center' },
    { name: 'Nâu cacao', bg: '#e5c3b2', cakePos: '100% center' },
    { name: 'Vàng bơ', bg: '#ffe4a6', cakePos: '25% center' },
  ]

  const handlePreviewClick = () => {
    if (!ideaText.trim()) {
      setIdeaText('Bánh sinh nhật 2 tầng màu hồng pastel, gắn nơ xinh và trang trí dâu tươi...')
    }
    setShowPreview(true)
  }

  return (
    <section className="snap-section scroll-mt-24 sm:scroll-mt-28 py-20 striped-idea-bg border-b-2 border-wine relative" id="tao-banh-theo-y">
      <div className="max-w-[1220px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Story & Steps */}
          <div className="lg:col-span-6 flex flex-col">
            <ScrollReveal animation="fade-up" delay={100}>
              <span className="dotted-frame-badge mb-4">Bánh riêng cho câu chuyện của bạn</span>
              <h2 className="font-savoure text-4xl sm:text-5xl font-bold text-wine mb-4 leading-tight">
                Bạn kể ý tưởng.<br />
                <em className="font-normal italic text-[#be4876]">Bánh sẽ thành hình.</em>
              </h2>
              <p className="text-[#52202b] text-base sm:text-lg bg-[#fffaf3]/90 backdrop-blur-sm p-4 rounded-xl border border-wine/20 max-w-xl mb-8 leading-relaxed">
                “Con tôi thích màu hồng, các vì sao và vị dâu tây...” Chỉ cần bắt đầu như thế! Bạn có thể chọn thêm cốt bánh bông mềm, kem cheese mịn màng hay thông điệp ý nghĩa.
              </p>
            </ScrollReveal>

            {/* Steps Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {CUSTOM_ATELIER_STEPS.map((step, idx) => (
                <ScrollReveal key={idx} animation="fade-up" delay={150 + idx * 80}>
                  <div className="bg-paper border-2 border-wine/40 p-4 rounded-xl flex items-start gap-3 shadow-xs">
                    <span className="material-symbols-outlined text-wine text-xl shrink-0 mt-0.5">
                      {step.icon || 'star'}
                    </span>
                    <div>
                      <h4 className="font-savoure text-lg font-bold text-wine">
                        {step.title}
                      </h4>
                      <p className="text-[#704350] text-xs leading-normal">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal animation="fade-up" delay={400}>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  className="cakematch-btn"
                  href="/ai-studio"
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate && onNavigate('ai-studio')
                  }}
                >
                  <span>Mở SweetAI Studio đầy đủ</span>
                  <span className="material-symbols-outlined text-base">arrow_outward</span>
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Retro Interactive Idea Card */}
          <div className="lg:col-span-6 relative">
            <ScrollReveal animation="zoom-in" delay={250}>
              <div className="relative bg-paper border-3 border-wine rounded-2xl p-7 shadow-[9px_10px_0_#f2abc4]">
                {/* Overlapping Floating Badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-wine text-white rounded-full px-5 py-1.5 text-xs font-extrabold uppercase tracking-widest shadow-sm whitespace-nowrap -rotate-1">
                  ✦ THỬ LÊN Ý TƯỞNG ✦
                </div>

                <div className="mt-3 mb-6">
                  <label htmlFor="cake-idea-text" className="block font-bold text-wine text-sm mb-2">
                    Chiếc bánh bạn mong muốn trông như thế nào?
                  </label>
                  <textarea
                    id="cake-idea-text"
                    rows={4}
                    maxLength={400}
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    placeholder="Ví dụ: Bánh sinh nhật cho bé gái 5 tuổi, màu hồng pastel, có hoa cúc nhỏ và vị dâu..."
                    className="w-full border-2 border-[#bd6e7e] rounded-xl p-4 text-sm text-[#52202b] bg-[#fffdfa] focus:outline-none focus:border-wine transition-colors"
                  ></textarea>
                </div>

                {/* Color Tone Chips */}
                <div className="mb-6">
                  <span className="block font-bold text-wine text-xs uppercase tracking-wider mb-2">
                    Thêm một chút màu sắc
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tones.map((t) => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => setSelectedTone(t.name)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${selectedTone === t.name
                          ? 'bg-wine text-white border-wine shadow-sm'
                          : 'bg-[#fff7f3] text-wine border-[#d4a3aa] hover:bg-wine/10'
                          }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePreviewClick}
                    className="cakematch-btn text-sm"
                  >
                    <span>Xem ý tưởng minh họa</span>
                    <span className="material-symbols-outlined text-base">arrow_outward</span>
                  </button>

                  <a
                    className="cakematch-btn-secondary text-sm"
                    href="/ai-studio"
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate && onNavigate('ai-studio')
                    }}
                  >
                    <span>Đặt mẫu custom</span>
                  </a>
                </div>

                <p className="text-xs text-[#7e5760] mt-4">
                  Tiếp tục để chọn vị bánh, trang trí và gửi yêu cầu đến các tiệm nghệ nhân.
                </p>

                {/* Live Preview Sketch Result */}
                {showPreview && (
                  <div className="mt-6 pt-5 border-t-2 dashed border-[#e4a4b5] animate-fade-in flex items-center gap-4 bg-[#fff6ed] p-4 rounded-xl border border-wine/20">
                    <div className="w-20 h-20 rounded-lg border-2 border-wine overflow-hidden shrink-0">
                      <img
                        alt="Minh họa ý tưởng bánh"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAz3L8kKnfuSKlDjAaJObSn8OAEAElIZ_S4_ldaIr7AcZD7DBadskF-ZDJjk4kiqQYS66NaoD1C6ZYN8wguCBT3TPitEZH5nPX9CLZiD6mxbWpueSpAoDir3LkyqYVRSjOX_KgkA7UKkn29JXQeZeubCQ8woq3KNEQhglsikNCNbFNnkD5D-leFqnHyCy5joy1Fzl2K1tliyOcyqOM1HLH30qIQy-Juj6x9ARXf66qUVJ5raEQ8OjR9"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-savoure text-lg font-bold text-wine italic mb-1">
                        Phác thảo ý tưởng bánh ({selectedTone})
                      </h4>
                      <p className="text-xs text-[#52202b] line-clamp-2">
                        “{ideaText}”
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CustomAtelierSection
