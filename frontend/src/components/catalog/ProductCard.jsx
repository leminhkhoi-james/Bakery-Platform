import { useState } from 'react'
import { loadProduct } from '../../services/cakeService.js'
import { userFeedback, cleanPresentationLabel, publicCopy } from '../../services/uiLabels.js'
import { catalogCategoryLabel, isCatalogId, formatCatalogPrice } from '../../services/catalogModels.js'
import { ProductDetails } from '../../pages/customer/catalog/ProductDetailPage.jsx'
import ModalSurface from '../common/ModalSurface.jsx'
import CatalogImage from './CatalogImage.jsx'

function AddProductButton({ product, onAddToCart }) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)
  const [configuration, setConfiguration] = useState(null)
  const add = async () => {
    if (adding) return
    setAdding(true)
    setError(null)
    try {
      // List responses may omit option groups. Check the detail before adding.
      const detail = await loadProduct({ id: product.id })
      const needsOptions = detail.optionGroups.some(group => (group.minimumSelections ?? (group.required ? 1 : 0)) > 0)
      if (needsOptions) setConfiguration(detail)
      else if (detail.price === null || !isCatalogId(detail.bakeryId)) setError('Chưa đủ thông tin để thêm bánh vào giỏ.')
      else onAddToCart({ ...detail, quantity: 1, optionSelections: [], addOns: [] })
    } catch (failure) {
      setError(userFeedback(failure))
    } finally {
      setAdding(false)
    }
  }
  const label = 'Thêm vào giỏ: ' + product.title
  return <>
    <button type="button" onClick={add} disabled={adding} aria-busy={adding} className="sc-button sc-action-button--secondary size-10 shrink-0 !p-0" aria-label={label} title={label}>
      <span aria-hidden="true" className="material-symbols-outlined text-xl">shopping_cart</span>
    </button>
    {error && <p role="alert" className="col-span-3 text-xs text-red-700">{error}</p>}
    {configuration && <ModalSurface label="Chọn tùy chọn bánh" guardChanges={false} onClose={() => setConfiguration(null)} className="sc-chat-entry-dialog">
      <header className="mb-3 flex items-start justify-between gap-3">
        <h2 className="font-bold text-primary">Chọn tùy chọn bánh</h2>
        <button type="button" data-modal-close className="sc-icon-button" aria-label="Đóng">
          <span aria-hidden="true" className="material-symbols-outlined">close</span>
        </button>
      </header>
      <ProductDetails product={configuration} cartOnly onAddToCart={item => { onAddToCart(item); setConfiguration(null) }} />
    </ModalSurface>}
  </>
}

export default function ProductCard({ product, onNavigate, onAddToCart, variant = 'catalog' }) {
  const open = () => onNavigate?.('product-detail', product)
  const canAdd = onAddToCart && product.catalogSource === 'backend' && isCatalogId(product.bakeryId) && product.price !== null
  return <article className={variant === 'home' ? 'dome-cake-card group flex h-full flex-col overflow-hidden bg-white' : 'sc-catalog-card group hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between'}>
    <button onClick={open} className="relative mb-4 block aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#faf8f8]" aria-label={'Xem ' + cleanPresentationLabel(product.title, 'mẫu bánh')}>
      <CatalogImage src={product.image} alt={cleanPresentationLabel(product.title, 'Mẫu bánh')} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
    </button>
    <div className={variant === 'home' ? 'flex flex-1 flex-col p-5' : 'flex flex-1 flex-col'}>

      {product.vendor && <button className="mb-1 text-left text-xs text-on-surface-variant" onClick={() => onNavigate?.('bakery-detail', { id: product.bakeryId })}>{cleanPresentationLabel(product.vendor)}</button>}
      <h3 className="font-headline-sm mb-3 line-clamp-2 text-[18px] font-bold leading-snug text-primary"><button className="text-left hover:text-primary-container" onClick={open}>{cleanPresentationLabel(product.title, 'Mẫu bánh')}</button></h3>
      <p className="mb-4 line-clamp-2 text-xs text-on-surface-variant">{publicCopy(product.description, 'Chưa có mô tả sản phẩm.')}</p>
      {product.category && <p className="mb-2 text-xs text-outline">{catalogCategoryLabel(product.category)}</p>}
      <div className={'mt-auto grid items-center gap-2 border-t border-[#9f1e31]/15 pt-3 ' + (canAdd ? 'grid-cols-[minmax(0,1fr)_auto_auto]' : 'grid-cols-[minmax(0,1fr)_auto]')}>
        <span className="font-savoure break-words text-base font-bold text-primary">{formatCatalogPrice(product.price)}</span>
        <button onClick={open} className="sc-button whitespace-nowrap !px-2.5">Xem chi tiết</button>
        {canAdd && <AddProductButton product={product} onAddToCart={onAddToCart} />}
      </div>
    </div>
  </article>
}
