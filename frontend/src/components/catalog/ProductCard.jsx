import { formatCatalogPrice } from '../../services/catalogModels.js'
import CatalogImage from './CatalogImage.jsx'
import { isMockRecord } from '../../mockData/runtime.js'

export default function ProductCard({ product, onNavigate, variant = 'catalog' }) {
  const open = () => onNavigate?.('product-detail', product)
  return <article className={variant === 'home' ? 'dome-cake-card group flex h-full flex-col overflow-hidden bg-[#fffaf3]' : 'sc-catalog-card group hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between'}>
    <button onClick={open} className="relative mb-4 block aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#faf8f8]" aria-label={'Xem ' + product.title}>
      <CatalogImage src={product.image} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
    </button>
    <div className={variant === 'home' ? 'flex flex-1 flex-col p-5' : 'flex flex-1 flex-col'}>
      {isMockRecord(product.id) && <span className="mb-1 text-xs text-on-surface-variant">Dữ liệu mẫu</span>}
      {product.vendor && <button className="mb-1 text-left text-xs text-on-surface-variant" onClick={() => onNavigate?.('bakery-detail', { id: product.bakeryId })}>{product.vendor}</button>}
      <h3 className="font-headline-sm mb-3 line-clamp-2 text-[18px] font-bold leading-snug text-primary"><button className="text-left hover:text-primary-container" onClick={open}>{product.title}</button></h3>
      <p className="mb-4 line-clamp-2 text-xs text-on-surface-variant">{product.description || 'Chưa có mô tả sản phẩm.'}</p>
      {product.category && <p className="mb-2 text-xs text-outline">{product.category}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#9f1e31]/15 pt-3">
        <span className="font-savoure text-xl font-bold text-primary">{formatCatalogPrice(product.price)}</span>
        <button onClick={open} className="sc-button">Xem chi tiết <span aria-hidden="true">↗</span></button>
      </div>
    </div>
  </article>
}
