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
    <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
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
    <div className="mb-6">
      <button
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 border border-primary/20 text-xs font-bold text-wine shadow-xs hover:bg-white hover:text-secondary hover:shadow transition-all cursor-pointer"
        onClick={() => onNavigate?.('explore')}
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>Quay lại danh sách bánh</span>
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
      {/* Left Gallery Showcase Card */}
      <div className="lg:col-span-6 space-y-4">
        <div className="relative rounded-3xl overflow-hidden bg-white/95 backdrop-blur-md border border-primary/15 shadow-xl p-3">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-container rounded-2xl">
            <CatalogImage
              src={product.images[imageIndex]?.url || product.image}
              alt={product.title}
              className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
            />
          </div>
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {product.images.map((image, index) => (
              <button
                key={image.id || image.url}
                aria-label={'Xem ảnh ' + (index + 1)}
                className={'aspect-square rounded-2xl overflow-hidden border-2 transition-all p-1 bg-white cursor-pointer ' + (imageIndex === index ? 'border-primary ring-2 ring-primary/30 shadow-md' : 'border-outline-variant/30 hover:border-primary/50 opacity-80')}
                onClick={() => setImageIndex(index)}
              >
                <CatalogImage src={image.url} alt={product.title} className="w-full h-full object-cover rounded-xl" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Product Details & Configuration Card */}
      <div className="lg:col-span-6 flex flex-col space-y-6 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-primary/15 shadow-xl">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <span className="inline-block px-3 py-1 bg-primary-fixed/80 rounded-full text-xs text-primary font-bold border border-primary/20">
                {product.category}
              </span>
            )}
            {product.vendor && (
              <button
                className="text-xs font-bold text-secondary uppercase tracking-wider hover:underline cursor-pointer"
                onClick={() => onNavigate?.('bakery-detail', { id: product.bakeryId })}
              >
                Tiệm: {product.vendor}
              </button>
            )}
          </div>
          <h1 className="font-savoure text-3xl sm:text-4xl lg:text-[40px] text-wine font-bold tracking-normal leading-tight">
            {product.title}
          </h1>
        </div>

        {/* Price Card */}
        <div className="bg-[#fff8fa] p-4 sm:p-5 rounded-2xl border border-primary/15 shadow-xs">
          <span id="display-price" className="font-headline-md text-3xl font-bold text-wine">
            {formatCatalogPrice(unitPrice === null ? null : Math.round(unitPrice * 100) * quantity / 100)}
          </span>
          <p className="font-body-sm text-xs text-on-surface-variant mt-1">
            Giá hiển thị theo cấu hình đã chọn; đơn hàng sẽ được kiểm tra lại khi đặt.
          </p>
        </div>

        {/* Description */}
        <p className="text-body-sm text-on-surface text-sm sm:text-base leading-relaxed whitespace-pre-line">
          {product.description || 'Tiệm chưa cung cấp mô tả sản phẩm.'}
        </p>

        {/* Specs Overview */}
        <dl className="grid grid-cols-2 gap-3 text-sm text-wine bg-[#fff8fa] p-4 rounded-2xl border border-primary/10">
          {product.defaultServingSize !== null && (
            <div>
              <dt className="text-on-surface-variant text-xs">Khẩu phần mặc định</dt>
              <dd className="font-bold text-sm">{product.defaultServingSize} người</dd>
            </div>
          )}
          {product.minimumNoticeHours !== null && (
            <div>
              <dt className="text-on-surface-variant text-xs">Đặt trước tối thiểu</dt>
              <dd className="font-bold text-sm">{product.minimumNoticeHours} giờ</dd>
            </div>
          )}
          {product.customizable !== null && (
            <div className="col-span-2">
              <dt className="text-on-surface-variant text-xs">Tùy biến</dt>
              <dd className="font-bold text-sm">{product.customizable ? 'Có thể tùy biến theo yêu cầu' : 'Theo mẫu có sẵn'}</dd>
            </div>
          )}
        </dl>

        {/* Option Groups (Size, Flavor, etc.) */}
        {groups.map((group) => (
          <fieldset key={group.id} className="space-y-3 rounded-2xl border border-primary/15 bg-[#fff8fa] p-4">
            <legend className="font-bold text-wine text-sm px-1">{group.name}{group.required ? ' *' : ''}</legend>
            <p className="text-xs text-on-surface-variant">
              Chọn {group.minimumSelections ?? (group.required ? 1 : 0)}–{group.maximumSelections ?? (group.values || []).length} lựa chọn
            </p>
            <div className="flex flex-wrap gap-2">
              {(group.values || []).filter((value) => value.active !== false).map((value) => (
                <button
                  key={value.id}
                  aria-pressed={(selections[group.id] || []).includes(value.id)}
                  onClick={() => selectValue(group, value)}
                  className={'rounded-xl border px-4 py-2 text-sm font-semibold transition-all cursor-pointer ' + ((selections[group.id] || []).includes(value.id) ? 'border-primary bg-primary text-on-primary shadow-xs' : 'border-outline-variant/40 bg-white text-primary hover:bg-surface-container')}
                >
                  {value.name} · {formatCatalogPrice(catalogMoney(value.priceAdjustment))}
                </button>
              ))}
            </div>
          </fieldset>
        ))}

        {/* Add-ons */}
        {product.addOns.length > 0 && (
          <fieldset className="space-y-3 rounded-2xl border border-primary/15 bg-[#fff8fa] p-4">
            <legend className="font-bold text-wine text-sm px-1">Phụ kiện từ tiệm</legend>
            <div className="space-y-2">
              {product.addOns.map((addon) => (
                <label key={addon.id} className="flex items-center gap-3 text-sm text-wine font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addons.includes(addon.id)}
                    onChange={() => setAddons((current) => current.includes(addon.id) ? current.filter((id) => id !== addon.id) : [...current, addon.id])}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <span>{addon.name} · {formatCatalogPrice(catalogMoney(addon.price))}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* Quantity */}
        <div className="flex items-center gap-4 text-wine font-bold">
          <span className="text-sm">Số lượng:</span>
          <input
            aria-label="Số lượng"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.floor(Number(event.target.value)) || 1))}
            className="w-24 rounded-xl border border-primary/30 bg-white px-4 py-2 font-bold text-wine text-center outline-none focus:border-primary shadow-xs"
          />
        </div>

        {/* Validation hint */}
        {!canAdd && (
          <p role="status" className="text-sm font-semibold text-wine/80 bg-primary-fixed/40 p-3 rounded-xl border border-primary/20">
            {!validOptions ? 'Vui lòng chọn đủ tùy chọn bắt buộc.' : 'Chưa đủ thông tin giá hoặc cửa hàng để thêm vào giỏ.'}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            disabled={!canAdd}
            onClick={() => add(false)}
            className="flex-1 rounded-2xl border-2 border-primary bg-white px-5 py-3.5 font-bold text-primary shadow-xs hover:bg-primary-fixed-dim disabled:opacity-40 transition-all cursor-pointer"
          >
            Thêm vào giỏ hàng
          </button>
          <button
            disabled={!canAdd}
            onClick={() => add(true)}
            className="flex-1 rounded-2xl bg-primary px-5 py-3.5 font-bold text-on-primary shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 transition-all cursor-pointer"
          >
            Đặt nhanh
          </button>
        </div>

        {product.customizable === true && product.bakeryId && (
          <button
            className="sc-button w-full cursor-pointer"
            onClick={() => onNavigate?.(targetedRequestRoute(product))}
          >
            Yêu cầu báo giá riêng từ tiệm
          </button>
        )}

        <button
          className="text-left text-secondary text-sm font-bold hover:underline cursor-pointer"
          onClick={() => onNavigate?.('ai-studio')}
        >
          Thiết kế bánh theo ý tưởng của bạn →
        </button>
      </div>
    </div>
  </>
}

export default ProductDetailPage
