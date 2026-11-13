import { useId } from 'react'

export default function GiftAccessoryPicker({ value, onChange }) {
  const id = useId()
  return <fieldset className="mt-3 space-y-2">
    <legend className="text-sm font-semibold text-wine">Chọn nến tặng kèm</legend>
    <div className="flex flex-wrap gap-2">
      {[['STRAIGHT', 'Nến thẳng'], ['NUMBER', 'Nến số']].map(([type, label]) => (
        <label key={type} className={'inline-flex min-h-10 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-sm text-wine cursor-pointer ' + (value.candleType === type ? 'border-primary bg-primary/5' : 'border-primary/20 bg-white')}>
          <input type="radio" name={id + '-candle'} value={type} checked={value.candleType === type}
            onChange={() => onChange({ candleType: type, candleNumber: type === 'NUMBER' ? value.candleNumber : '' })} className="h-4 w-4 shrink-0 accent-primary" />
          {label}
        </label>
      ))}
    </div>
    {value.candleType === 'NUMBER' && <div className="space-y-1">
      <label htmlFor={id + '-number'} className="block text-sm text-wine">Số tuổi trên nến <span aria-hidden="true">*</span></label>
      <input id={id + '-number'} type="text" inputMode="numeric" pattern="[0-9]{1,3}" maxLength={3} required
        autoComplete="off" placeholder="Ví dụ: 18" value={value.candleNumber} onChange={event => onChange({ ...value, candleNumber: event.target.value })}
        className="w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-base tabular-nums text-wine focus:outline-2 focus:outline-primary" />
    </div>}
    <p className="text-xs text-wine/80">Đã bao gồm trong giá bánh.</p>
  </fieldset>
}
