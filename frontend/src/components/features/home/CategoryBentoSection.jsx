import { BENTO_CATEGORIES } from '../../../mockData/customer/cakes.js'
import ScrollReveal from '../../common/ScrollReveal.jsx'

export const CategoryBentoSection = () => {
  return (
    <section className="snap-section scroll-mt-24 sm:scroll-mt-28 py-20 bg-[#fff7ed] bg-[radial-gradient(#f4c7c9_1.7px,transparent_1.7px)] bg-[size:24px_24px] border-b-2 border-wine" id="danh-muc-banh">
      <div className="max-w-[1220px] mx-auto px-6 text-center">
        <ScrollReveal animation="fade-up">
          <span className="dotted-frame-badge">Một chút cảm hứng ngọt ngào</span>
          <h2 className="font-savoure text-4xl sm:text-5xl font-bold text-wine mb-4">
            Bạn thích loại bánh nào?
          </h2>
          <p className="text-[#6d3c45] text-base sm:text-lg max-w-2xl mx-auto mb-12">
            Khám phá bộ sưu tập bánh nghệ nhân từ bánh sinh nhật, mousse tan mịn đến bento cake xinh xắn.
          </p>
        </ScrollReveal>

        {/* Dome Top Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENTO_CATEGORIES.map((cat, idx) => (
            <ScrollReveal key={cat.id} animation="fade-up" delay={idx * 100}>
              <div className="dome-cake-card group h-full flex flex-col justify-between text-left">
                <div className="h-64 overflow-hidden relative border-b-2 border-wine bg-[#fff0e6]">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={cat.title}
                    src={cat.image}
                  />
                  <span className="absolute top-4 left-4 bg-paper/90 border border-wine text-wine font-extrabold text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    {cat.tag}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between bg-paper">
                  <div>
                    <h3 className="font-savoure text-2xl font-bold italic text-wine mb-2">
                      {cat.title}
                    </h3>
                    <p className="text-[#704350] text-sm leading-relaxed mb-6">
                      {cat.desc}
                    </p>
                  </div>

                  <a
                    className="inline-flex items-center gap-1 text-wine font-extrabold text-base hover:text-[#b8273b] transition-colors group/link"
                    href="/explore"
                  >
                    <span className="hover:underline">Khám phá danh mục này</span>
                    <span className="material-symbols-outlined text-base no-underline transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">arrow_outward</span>
                  </a>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategoryBentoSection
