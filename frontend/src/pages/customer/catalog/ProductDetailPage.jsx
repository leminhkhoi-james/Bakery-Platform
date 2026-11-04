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
  return (
    <div className="sc-customer sc-catalog w-full">
      <div className="relative w-full max-w-[1360px] mx-auto px-4 sm:px-6 pt-2 pb-6">
        <CatalogState {...resource} onRetry={resource.reload} onNavigate={onNavigate} />
        {resource.status === 'ready' && (
          <ProductDetails
            key={resource.data.id}
            product={resource.data}
            onAddToCart={onAddToCart}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  )
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

  return (
    <>
      {/* Compact Top Bar */}
      <div className="mb-2.5">
        <button
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-primary/20 text-xs font-bold text-wine shadow-xs hover:bg-white hover:text-secondary hover:shadow transition-all cursor-pointer"
          onClick={() => onNavigate?.('explore')}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Quay lại danh sách bánh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Gallery Showcase Card (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="relative rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md border border-primary/15 shadow-md p-2">
            <div className="relative aspect-square w-full max-h-[360px] lg:max-h-[380px] overflow-hidden bg-surface-container rounded-xl">
              <CatalogImage
                src={product.images[imageIndex]?.url || product.image}
                alt={product.title}
                className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
              />
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id || image.url}
                  aria-label={'Xem ảnh ' + (index + 1)}
                  className={'aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-white cursor-pointer ' + (imageIndex === index ? 'border-primary ring-2 ring-primary/30 shadow-xs' : 'border-outline-variant/30 hover:border-primary/50 opacity-80')}
                  onClick={() => setImageIndex(index)}
                >
                  <CatalogImage src={image.url} alt={product.title} className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Product Details & Configuration Card (7 cols on lg - Compact & Ergonomic) */}
        <div className="lg:col-span-7 flex flex-col space-y-3 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-primary/15 shadow-md">
          {/* Header Row: Tags & Bakery */}
          <div className="flex items-center justify-between gap-2">
            {product.category && (
              <span className="inline-block px-2.5 py-0.5 bg-primary-fixed/80 rounded-full text-[11px] text-primary font-bold border border-primary/20">
                {product.category}
              </span>
            )}
            {product.vendor && (
              <button
                className="text-xs font-bold text-secondary uppercase tracking-wider hover:underline cursor-pointer ml-auto"
                onClick={() => onNavigate?.('bakery-detail', { id: product.bakeryId })}
              >
                Tiệm: {product.vendor}
              </button>
            )}
          </div>

          {/* Title & Price Header */}
          <div className="space-y-1.5">
            <h1 className="font-savoure text-2xl sm:text-3xl text-wine font-bold tracking-normal leading-tight">
              {product.title}
            </h1>
            <div className="bg-[#fff8fa] px-3.5 py-1.5 rounded-xl border border-primary/15 flex items-baseline justify-between shadow-2xs">
              <span id="display-price" className="font-headline-md text-2xl sm:text-3xl font-bold text-wine">
                {formatCatalogPrice(unitPrice === null ? null : Math.round(unitPrice * 100) * quantity / 100)}
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Giá theo cấu hình đã chọn
              </span>
            </div>
          </div>

          {/* Description (Concise & Legible) */}
          <p className="text-xs sm:text-sm text-on-surface leading-relaxed line-clamp-2">
            {product.description || 'Tiệm chưa cung cấp mô tả sản phẩm.'}
          </p>

          {/* Specs Badges (Compact Pill Row) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-wine font-semibold">
            {product.defaultServingSize !== null && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#fff8fa] border border-primary/10 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">group</span>
                <span>{product.defaultServingSize} người</span>
              </span>
            )}
            {product.minimumNoticeHours !== null && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#fff8fa] border border-primary/10 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">schedule</span>
                <span>Đặt trước {product.minimumNoticeHours} giờ</span>
              </span>
            )}
            {product.customizable !== null && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#fff8fa] border border-primary/10 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">palette</span>
                <span>{product.customizable ? 'Có thể tùy biến' : 'Theo mẫu có sẵn'}</span>
              </span>
            )}
          </div>

          {/* Option Groups (Sizes / Flavors - Compact Chips) */}
          {groups.map((group) => (
            <fieldset key={group.id} className="space-y-1.5 rounded-xl border border-primary/15 bg-[#fff8fa] p-2.5">
              <div className="flex items-center justify-between">
                <legend className="font-bold text-wine text-xs px-1">{group.name}{group.required ? ' *' : ''}</legend>
                <span className="text-[11px] text-on-surface-variant">
                  Chọn {group.minimumSelections ?? (group.required ? 1 : 0)}–{group.maximumSelections ?? (group.values || []).length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(group.values || []).filter((value) => value.active !== false).map((value) => (
                  <button
                    key={value.id}
                    aria-pressed={(selections[group.id] || []).includes(value.id)}
                    onClick={() => selectValue(group, value)}
                    className={'rounded-lg border px-3 py-1 text-xs font-bold transition-all cursor-pointer ' + ((selections[group.id] || []).includes(value.id) ? 'border-primary bg-primary text-on-primary shadow-xs' : 'border-outline-variant/40 bg-white text-primary hover:bg-surface-container')}
                  >
                    {value.name} · {formatCatalogPrice(catalogMoney(value.priceAdjustment))}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          {/* Add-ons (Accessories - 2-Column Compact Grid) */}
          {product.addOns.length > 0 && (
            <fieldset className="space-y-1.5 rounded-xl border border-primary/15 bg-[#fff8fa] p-2.5">
              <legend className="font-bold text-wine text-xs px-1">Phụ kiện từ tiệm</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 max-h-24 overflow-y-auto pr-1">
                {product.addOns.map((addon) => (
                  <label key={addon.id} className="flex items-center gap-2 text-xs text-wine font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addons.includes(addon.id)}
                      onChange={() => setAddons((current) => current.includes(addon.id) ? current.filter((id) => id !== addon.id) : [...current, addon.id])}
                      className="w-3.5 h-3.5 accent-primary rounded cursor-pointer"
                    />
                    <span className="truncate">{addon.name} · {formatCatalogPrice(catalogMoney(addon.price))}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Validation Message if Incomplete */}
          {!canAdd && (
            <p role="status" className="text-xs font-semibold text-wine/80 bg-primary-fixed/40 p-2 rounded-lg border border-primary/20">
              {!validOptions ? 'Vui lòng chọn đủ tùy chọn bắt buộc.' : 'Chưa đủ thông tin giá hoặc cửa hàng để thêm vào giỏ.'}
            </p>
          )}

          {/* Quantity & Action Buttons Row (Unified single line!) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5">
            {/* Quantity Stepper */}
            <div className="flex items-center justify-between border-2 border-primary/25 rounded-xl bg-white px-2 py-1 shrink-0 w-full sm:w-28 shadow-2xs">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-6 h-6 flex items-center justify-center font-bold text-primary hover:bg-primary-fixed-dim rounded-md text-sm cursor-pointer"
              >
                -
              </button>
              <span className="font-bold text-wine text-sm px-1">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-6 h-6 flex items-center justify-center font-bold text-primary hover:bg-primary-fixed-dim rounded-md text-sm cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Add to Cart */}
            <button
              disabled={!canAdd}
              onClick={() => add(false)}
              className="flex-1 rounded-xl border-2 border-primary bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-primary shadow-xs hover:bg-primary-fixed-dim disabled:opacity-40 transition-all cursor-pointer whitespace-nowrap"
            >
              Thêm vào giỏ hàng
            </button>

            {/* Quick Order */}
            <button
              disabled={!canAdd}
              onClick={() => add(true)}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-on-primary shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-base">bolt</span>
              <span>Đặt nhanh</span>
            </button>
          </div>

          {/* Bottom Secondary Actions */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {product.customizable === true && product.bakeryId ? (
              <button
                className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                onClick={() => onNavigate?.(targetedRequestRoute(product))}
              >
                <span>Yêu cầu báo giá riêng</span>
                <span className="material-symbols-outlined text-xs">arrow_outward</span>
              </button>
            ) : <span />}

            <button
              className="text-secondary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              onClick={() => onNavigate?.('ai-studio')}
            >
              <span>Thiết kế bánh theo ý tưởng</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductDetailPage
