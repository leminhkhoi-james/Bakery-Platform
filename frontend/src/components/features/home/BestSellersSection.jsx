import ScrollReveal from '../../common/ScrollReveal.jsx'
import { loadProducts } from '../../../services/cakeService.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import CatalogState from '../../catalog/CatalogState.jsx'
import ProductCard from '../../catalog/ProductCard.jsx'

export const BestSellersSection = ({ onNavigate }) => {
  const resource = useCatalogResource(loadProducts, { page: 1, size: 4, sort: 'createdAt,desc' })
  return (
    <section className="snap-section scroll-mt-24 sm:scroll-mt-28 py-20 bg-[#fffaf3] border-b-2 border-[#9f1e31]" id="mau-banh-ban-chay">
      <div className="max-w-[1220px] mx-auto px-6">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="dotted-frame-badge">Mẫu bánh từ các tiệm</span>
              <h2 className="font-savoure text-4xl sm:text-5xl font-bold text-primary">Mẫu Bánh Mới Nhất</h2>
            </div>
            <button className="text-primary font-extrabold text-base underline underline-offset-4 hover:text-primary-container transition-colors flex items-center gap-1" onClick={() => onNavigate?.('explore')}>Xem tất cả mẫu bánh <span aria-hidden="true">↗</span></button>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          <CatalogState {...resource} empty={!resource.data?.result.length} emptyText="Chưa có mẫu bánh công khai." onRetry={resource.reload} onNavigate={onNavigate} />
          {resource.data?.result.map((product) => <ProductCard key={product.id} product={product} onNavigate={onNavigate} variant="home" />)}
        </div>
      </div>
    </section>
  )
}
export default BestSellersSection
