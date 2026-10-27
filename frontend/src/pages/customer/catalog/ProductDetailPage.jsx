import { useState } from 'react'
import { targetedRequestRoute } from '../../../services/requestContextModels.js'
import { loadProduct } from '../../../services/cakeService.js'
import { catalogMoney, formatCatalogPrice } from '../../../services/catalogModels.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import CatalogImage from '../../../components/catalog/CatalogImage.jsx'
import CatalogState from '../../../components/catalog/CatalogState.jsx'

export const ProductDetailPage = ({ routeSearch = '', onAddToCart, onNavigate }) => {
  const id = new URLSearchParams(routeSearch).get('id') || ''
  const resource = useCatalogResource(loadProduct, { id })
  return <div className="sc-customer sc-catalog w-full min-h-[calc(100vh-20rem)]">
    <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pt-6 pb-20">
      <CatalogState {...resource} onRetry={resource.reload} onNavigate={onNavigate} />
      {resource.status === 'ready' && <ProductDetails key={resource.data.id} product={resource.data} onAddToCart={onAddToCart} onNavigate={onNavigate} />}
    </div>
  </div>
}

export function ProductDetails({ product, onAddToCart, onNavigate }) {
  const [imageIndex, setImageIndex] = useState(() => Math.max(0, product.images.findIndex((image) => image.primary)))
  const [selections, setSelections] = useState({})
  const [addons, setAddons] = useState([])
  const [quantity, setQuantity] = useState(1)
  const groups = product.optionGroups
  const selectedValues = groups.flatMap((group) => (group.values || []).filter((value) => (selections[group.id] || []).includes(value.id)))
  const selectedAddons = product.addOns.filter((addon) => addons.includes(addon.id))
  const amounts = [product.price, ...selectedValues.map((value) => catalogMoney(value.priceAdjustment)), ...selectedAddons.map((addon) => catalogMoney(addon.price))]
  const unitPrice = amounts.some((amount) => amount === null) ? null : amounts.reduce((sum, amount) => sum + Math.round(amount * 100), 0) / 100
  const validOptions = groups.every((group) => {
    const count = (selections[group.id] || []).length
    const min = group.minimumSelections ?? (group.required ? 1 : 0)
    const max = group.maximumSelections ?? (group.selectionType === 'SINGLE' ? 1 : Infinity)
    return count >= min && count <= max
  })
  const canAdd = validOptions && unitPrice !== null && unitPrice >= 0 && Boolean(product.bakeryId)
  const selectValue = (group, value) => setSelections((current) => {
    const selected = current[group.id] || []
    const next = selected.includes(value.id) ? selected.filter((id) => id !== value.id) : group.selectionType === 'SINGLE' ? [value.id] : [...selected, value.id]
    return next.length <= (group.maximumSelections ?? Infinity) ? { ...current, [group.id]: next } : current
  })
  const add = (quick) => {
    if (!canAdd) return
    const configuration = groups.map((group) => ({ optionGroupId: group.id, optionValueIds: selections[group.id] || [] })).filter((group) => group.optionValueIds.length)
    onAddToCart?.({
      ...product,
      quantity,
      price: unitPrice,
      optionSelections: configuration,
      addOns: selectedAddons.map((addon) => ({ addOnId: addon.id, quantity: 1 })),
      selectedSize: selectedValues.map((value) => value.name).join(', '),
      sizeSpec: selectedValues.map((value) => value.name).join(', '),
    })
    if (quick) {
      try { localStorage.setItem('sweetcake_direct_checkout', 'true') } catch { /* Optional demo checkout flag. */ }
    }
    onNavigate?.('cart')
  }

  return <>
    <button className="text-sm text-secondary underline" onClick={() => onNavigate?.('explore')}>← Quay lại danh sách bánh</button>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter lg:gap-12 mt-8 items-start">
      <div className="lg:col-span-6 space-y-4">
        <div className="relative rounded-2xl overflow-hidden bg-surface/60 backdrop-blur-md border border-outline-variant/20 shadow-xl shadow-primary/5 group">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-container rounded-2xl">
            <CatalogImage src={product.images[imageIndex]?.url || product.image} alt={product.title} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
          </div>
        </div>
        {product.images.length > 1 && <div className="grid grid-cols-4 gap-3">
          {product.images.map((image, index) => <button key={image.id || image.url} aria-label={'Xem ảnh ' + (index + 1)} className={'aspect-square rounded-xl overflow-hidden border ' + (imageIndex === index ? 'ring-2 ring-primary' : 'opacity-70')} onClick={() => setImageIndex(index)}>
            <CatalogImage src={image.url} alt={product.title} className="w-full h-full object-cover" />
          </button>)}
        </div>}
      </div>
      <div className="lg:col-span-6 flex flex-col space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            {product.category && <span className="inline-block px-3 py-1 bg-surface/80 rounded-full text-xs text-primary font-bold border border-outline-variant/30">{product.category}</span>}
            {product.vendor && <button className="text-xs font-bold text-secondary uppercase tracking-wider" onClick={() => onNavigate?.('bakery-detail', { id: product.bakeryId })}>{product.vendor}</button>}
          </div>
          <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-[38px] text-primary font-bold tracking-normal">{product.title}</h1>
        </div>
        <div className="bg-surface-container p-4 rounded-xl shadow-sm">
          <span id="display-price" className="font-headline-md text-primary font-bold">{formatCatalogPrice(unitPrice === null ? null : Math.round(unitPrice * 100) * quantity / 100)}</span>
          <p className="font-body-sm text-xs text-on-surface-variant mt-1">Giá hiển thị theo cấu hình đã chọn; đơn hàng sẽ được kiểm tra lại khi đặt.</p>
        </div>
        <p className="text-body-sm text-on-surface-variant whitespace-pre-line">{product.description || 'Tiệm chưa cung cấp mô tả sản phẩm.'}</p>
        <dl className="grid grid-cols-2 gap-3 text-sm text-primary">
          {product.defaultServingSize !== null && <div><dt className="text-outline">Khẩu phần mặc định</dt><dd>{product.defaultServingSize} người</dd></div>}
          {product.minimumNoticeHours !== null && <div><dt className="text-outline">Đặt trước tối thiểu</dt><dd>{product.minimumNoticeHours} giờ</dd></div>}
          {product.customizable !== null && <div><dt className="text-outline">Tùy biến</dt><dd>{product.customizable ? 'Có thể tùy biến' : 'Theo mẫu có sẵn'}</dd></div>}
        </dl>
        {groups.map((group) => <fieldset key={group.id} className="space-y-3 rounded-xl border border-outline-variant/30 p-4">
          <legend className="font-label-md text-primary font-semibold">{group.name}{group.required ? ' *' : ''}</legend>
          <p className="text-xs text-outline">Chọn {group.minimumSelections ?? (group.required ? 1 : 0)}–{group.maximumSelections ?? (group.values || []).length} lựa chọn</p>
          <div className="flex flex-wrap gap-2">
            {(group.values || []).filter((value) => value.active !== false).map((value) => <button key={value.id} aria-pressed={(selections[group.id] || []).includes(value.id)} onClick={() => selectValue(group, value)} className={'rounded-xl border px-4 py-2 text-sm ' + ((selections[group.id] || []).includes(value.id) ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/30 bg-surface text-primary')}>
              {value.name} · {formatCatalogPrice(catalogMoney(value.priceAdjustment))}
            </button>)}
          </div>
        </fieldset>)}
        {product.addOns.length > 0 && <fieldset className="space-y-3 rounded-xl border border-outline-variant/30 p-4">
          <legend className="font-label-md text-primary font-semibold">Phụ kiện từ tiệm</legend>
          {product.addOns.map((addon) => <label key={addon.id} className="flex items-center gap-3 text-sm text-primary">
            <input type="checkbox" checked={addons.includes(addon.id)} onChange={() => setAddons((current) => current.includes(addon.id) ? current.filter((id) => id !== addon.id) : [...current, addon.id])} />
            {addon.name} · {formatCatalogPrice(catalogMoney(addon.price))}
          </label>)}
        </fieldset>}
        <label className="flex items-center gap-4 text-primary">Số lượng
          <input aria-label="Số lượng" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.floor(Number(event.target.value)) || 1))} className="w-24 rounded-xl border border-outline-variant/30 bg-surface px-4 py-2" />
        </label>
        {!canAdd && <p role="status" className="text-sm text-outline">{!validOptions ? 'Vui lòng chọn đủ tùy chọn bắt buộc.' : 'Chưa đủ thông tin giá hoặc cửa hàng để thêm vào giỏ.'}</p>}
        <div className="flex flex-col sm:flex-row gap-3">
          <button disabled={!canAdd} onClick={() => add(false)} className="flex-1 rounded-xl border-2 border-primary px-5 py-3 font-bold text-primary disabled:opacity-40">Thêm vào giỏ hàng</button>
          <button disabled={!canAdd} onClick={() => add(true)} className="flex-1 rounded-xl bg-primary px-5 py-3 font-bold text-on-primary disabled:opacity-40">Đặt nhanh</button>
        </div>
        {product.customizable === true && product.bakeryId && <button className="sc-button" onClick={() => onNavigate?.(targetedRequestRoute(product))}>Yêu cầu báo giá riêng từ tiệm</button>}
        <button className="text-left text-secondary underline" onClick={() => onNavigate?.('ai-studio')}>Thiết kế bánh theo ý tưởng của bạn →</button>
      </div>
    </div>
  </>
}

export default ProductDetailPage
