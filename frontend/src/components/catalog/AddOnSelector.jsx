import { addOnDisplayName, addOnLimit, addOnUnit } from '../../services/addOnInventory.js'
import { catalogMoney, formatCatalogPrice } from '../../services/catalogModels.js'
import GiftAccessoryPicker from './GiftAccessoryPicker.jsx'

export default function AddOnSelector({ addOns, selectedIds, quantities, onToggle, onQuantity, giftAccessories, onGiftChange }) {
  return <section aria-label="Phụ kiện cho bánh" className="space-y-4 border-t border-primary/15 pt-4">
    <div className="flex items-start gap-2.5 text-wine">
      <span aria-hidden="true" className="material-symbols-outlined text-xl">redeem</span>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold">Bánh đã có phụ kiện tặng kèm</p>
        <p className="text-sm leading-relaxed">Bộ dĩa/nĩa và nến theo lựa chọn của bạn.</p>
        <GiftAccessoryPicker value={giftAccessories} onChange={onGiftChange} />
      </div>
    </div>
    {addOns.length > 0 && <fieldset>
    <legend className="flex w-full items-baseline justify-between gap-3 pt-2 text-sm font-bold text-wine">
      Mua thêm phụ kiện<span className="text-xs font-normal text-wine/80">Không bắt buộc</span>
    </legend>
    <p className="mt-1 text-xs leading-relaxed text-wine/80">Cần thêm ngoài phần tặng kèm? Tick chọn bên dưới.</p>
    <div className="divide-y divide-primary/10">
      {addOns.map(addOn => {
        const selected = selectedIds.includes(addOn.id), limit = addOnLimit(addOn), quantity = quantities[addOn.id] ?? 1, unit = addOnUnit(addOn), name = addOnDisplayName(addOn)
        return <div key={addOn.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
          <label className="flex min-w-40 flex-1 items-center gap-3 text-sm text-wine cursor-pointer">
            <input type="checkbox" checked={selected} disabled={!selected && limit === 0} onChange={() => onToggle(addOn.id)} className="h-4 w-4 shrink-0 accent-primary" />
            <span className="min-w-0 break-words"><span className="block font-semibold">{name}</span>
              <span className="mt-1 block text-sm text-wine/80">{formatCatalogPrice(catalogMoney(addOn.price))}<span className="ml-1">/ {unit}</span>{limit === 0 && <span className="ml-2">· Tạm chưa có</span>}</span>
            </span>
          </label>
          {selected && <div className="flex shrink-0 flex-col gap-1">
            <span className="text-xs text-wine/80">Số {unit}</span>
            <div className="flex items-center overflow-hidden rounded-lg border border-primary/20 bg-white">
              <button type="button" aria-label={'Giảm số lượng ' + name} disabled={quantity <= 1} onClick={() => onQuantity(addOn.id, Math.max(1, Number(quantity) - 1))} className="h-10 w-10 text-primary disabled:opacity-40 hover:bg-primary-fixed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">−</button>
              <input type="number" min="1" max={limit || 1} step="1" value={quantity} aria-label={'Số lượng ' + name} onChange={event => onQuantity(addOn.id, event.target.value === '' ? '' : Number(event.target.value))} className="w-10 appearance-none bg-white py-2 text-center text-base tabular-nums text-wine [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              <button type="button" aria-label={'Tăng số lượng ' + name} disabled={Number(quantity) >= limit} onClick={() => onQuantity(addOn.id, Math.min(limit, Number(quantity) + 1))} className="h-10 w-10 text-primary disabled:opacity-40 hover:bg-primary-fixed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">+</button>
            </div>
          </div>}
        </div>
      })}
    </div>
    </fieldset>}
  </section>
}
