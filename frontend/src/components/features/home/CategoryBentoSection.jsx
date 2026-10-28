import ScrollReveal from '../../common/ScrollReveal.jsx'
import { loadProducts } from '../../../services/cakeService.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import CatalogState from '../../catalog/CatalogState.jsx'
import CatalogImage from '../../catalog/CatalogImage.jsx'

export const CategoryBentoSection = ({ onNavigate }) => {
  const resource = useCatalogResource(loadProducts, { page: 1, size: 12, sort: 'createdAt,desc' })
  const categories = [...new Map((resource.data?.result || []).filter((product) => product.categoryId && product.category).map((product) => [product.categoryId, { id: product.categoryId, title: product.category, image: product.image }])).values()]
  return (
    <section className="snap-section scroll-mt-24 sm:scroll-mt-28 py-20 bg-[#fff7ed] bg-[radial-gradient(#f4c7c9_1.7px,transparent_1.7px)] bg-[size:24px_24px] border-b-2 border-wine" id="danh-muc-banh">
      <div className="max-w-[1220px] mx-auto px-6 text-center">
        <ScrollReveal animation="fade-up">
          <span className="dotted-frame-badge">Một chút cảm hứng ngọt ngào</span>
          <h2 className="font-savoure text-4xl sm:text-5xl font-bold text-wine mb-4">
            Bạn thích loại bánh nào?
          </h2>
          <p className="text-on-surface-variant text-base sm:text-lg max-w-2xl mx-auto mb-12">
            Khám phá danh mục từ những mẫu bánh mới được các tiệm công khai.
          </p>
        </ScrollReveal>

        {/* Dome Top Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <CatalogState {...resource} empty={categories.length === 0} emptyText="Chưa có danh mục trong các mẫu bánh mới." onRetry={resource.reload} onNavigate={onNavigate} />
          {categories.map((cat, idx) => (
            <ScrollReveal key={cat.id} animation="fade-up" delay={idx * 100}>
              <div className="dome-cake-card group h-full flex flex-col justify-between text-left">
                <div className="h-64 overflow-hidden relative border-b-2 border-wine bg-[#fff0e6]">
                  <CatalogImage
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={'Mẫu bánh thuộc danh mục ' + cat.title}
                    src={cat.image}
                  />
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between bg-paper">
                  <div>
                    <h3 className="font-savoure text-2xl font-bold italic text-wine mb-2">
                      {cat.title}
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                      Xem các mẫu bánh trong danh mục này.
                    </p>
                  </div>

                  <a
                    href={'/explore?categoryId=' + encodeURIComponent(cat.id)}
                    className="inline-flex items-center gap-1 text-wine font-extrabold text-base hover:text-primary-container transition-colors group/link cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault()
                      if (onNavigate) {
                        onNavigate('explore', { categoryId: cat.id })
                      } else {
                        window.location.href = '/explore?categoryId=' + encodeURIComponent(cat.id)
                      }
                    }}
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
