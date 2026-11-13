import MoneyInput from '../common/MoneyInput.jsx'
import { uiLabel } from '../../services/uiLabels.js'
import React, { useCallback, useEffect, useState } from 'react'
import { validTargetedSelection } from '../../services/requestContextModels.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadProduct } from '../../services/cakeService.js'
import { loadAddresses } from '../../services/addressService.js'
import { isCatalogId } from '../../services/catalogModels.js'
import { REQUEST_TYPES, toLocalInput, rfqPayload } from '../../services/marketplaceModels.js'
import { ApiState, buttonClass, inputClass, panelClass } from '../management/ApiState.jsx'
import { consumeStudioRfqDraft } from '../../pages/customer/ai-studio/Cake3DBuilder.jsx'
import ThreeCakeCanvas from '../../pages/customer/ai-studio/ThreeCakeCanvas.jsx'

function ProductSelections({ id, selections, onChange, onProduct }) {
  const resource = useCatalogResource(loadProduct, { id })
  useEffect(() => { onProduct(resource.status === 'ready' ? resource.data : null) }, [resource.status, resource.data, onProduct])
  return <section className="space-y-3 sm:col-span-2"><h4 className="font-bold">Tùy chọn sản phẩm</h4><ApiState resource={resource}>{resource.data && <><p>{resource.data.title}</p>{resource.data.optionGroups.map((group) => <fieldset key={group.id} className="space-y-2 rounded-xl border border-outline-variant/30 p-3"><legend>{group.name} ({group.minimumSelections}–{group.maximumSelections})</legend>{group.values.filter((value) => value.active !== false).map((value) => <label key={value.id} className="flex items-center gap-2"><input type="checkbox" checked={selections.some((item) => item.optionGroupId === group.id && item.optionValueId === value.id)} onChange={(event) => onChange(event.target.checked ? [...selections.filter((item) => group.selectionType !== 'SINGLE' || item.optionGroupId !== group.id), { optionGroupId: group.id, optionValueId: value.id, quantity: 1 }] : selections.filter((item) => item.optionValueId !== value.id))} />{value.name}</label>)}</fieldset>)}</>}</ApiState></section>
}

export default function RequestForm({ request, initialValues, busy, disabled, onSave, onClose }) {
  const addresses = useCatalogResource(loadAddresses)
  const [studioSynced, setStudioSynced] = useState(false)
  const [showLive3D, setShowLive3D] = useState(true)
  const [formError, setFormError] = useState(null)
  const [values, setValues] = useState(() => {
    const studioDraft = (!request && !initialValues?.baseProductId) ? consumeStudioRfqDraft() : null
    if (studioDraft) {
      setTimeout(() => setStudioSynced(true), 0)
    }
    const merged = {
      requestType: 'OPEN_CUSTOM',
      title: '',
      description: '',
      occasion: '',
      servingSize: '',
      budgetMin: '',
      budgetMax: '',
      deliveryDistrict: '',
      deliveryCity: '',
      ...(studioDraft || {}),
      ...initialValues,
      ...request,
    }
    return {
      ...merged,
      neededAt: toLocalInput(merged.neededAt),
      offerDeadline: toLocalInput(merged.offerDeadline),
      preference: request?.preference || studioDraft?.preference || {},
      optionSelections: request?.optionSelections || [],
    }
  })

  // Auto-populate deliveryDistrict & deliveryCity from primary saved address if not already set
  useEffect(() => {
    if (addresses.status === 'ready' && addresses.data?.length > 0) {
      const defaultAddr = addresses.data.find(a => a.primary) || addresses.data[0]
      if (defaultAddr) {
        setValues(cur => ({
          ...cur,
          deliveryDistrict: cur.deliveryDistrict || defaultAddr.district || '',
          deliveryCity: cur.deliveryCity || defaultAddr.city || '',
        }))
      }
    }
  }, [addresses.status, addresses.data])

  const [product, setProduct] = useState(null)
  const receiveProduct = useCallback((value) => setProduct(value), [])
  const invalidTarget = values.requestType === 'TARGETED_PRODUCT_CUSTOM' && !validTargetedSelection(product, values)
  const field = (key) => ({ value: values[key] ?? '', onChange: (event) => setValues((current) => ({ ...current, [key]: event.target.value })) })

  const cake3DSnapshotUrl = values.preference?.extraOptions?.cake3DSnapshotUrl
  const cake3DConfig = values.preference?.extraOptions?.cake3DConfig

  function handleSubmit(event) {
    event.preventDefault()
    if (busy || disabled || invalidTarget) return
    setFormError(null)

    const title = (values.title || '').trim()
    const description = (values.description || '').trim()
    const deliveryDistrict = (values.deliveryDistrict || '').trim()
    const deliveryCity = (values.deliveryCity || '').trim()

    if (!title) {
      setFormError('Vui lòng nhập tiêu đề yêu cầu.')
      return
    }
    if (!description) {
      setFormError('Vui lòng nhập mô tả chi tiết yêu cầu bánh.')
      return
    }
    if (!deliveryDistrict || !deliveryCity) {
      setFormError('Vui lòng cung cấp quận/huyện và tỉnh/thành phố nhận bánh để tiệm bánh tính phí và báo giá.')
      return
    }
    if (!values.neededAt || Date.parse(values.neededAt) <= Date.now()) {
      setFormError('Thời gian cần nhận bánh phải ở tương lai.')
      return
    }

    const input = {
      ...values,
      title,
      description,
      deliveryDistrict,
      deliveryCity,
    }
    try {
      rfqPayload(input)
      onSave(input)
    } catch (failure) {
      setFormError(failure.message)
    }
  }

  return <form className={panelClass} onSubmit={handleSubmit}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-xl font-bold">{request ? 'Sửa yêu cầu nháp' : 'Tạo yêu cầu bánh tùy chỉnh'}</h2>
      {studioSynced && (
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-900 border border-rose-300">
          ✨ Đã đính kèm đúng mẫu bánh 3D bạn vừa thiết kế
        </span>
      )}
    </div>

    {(cake3DSnapshotUrl || cake3DConfig) && (
      <div className="my-4 rounded-2xl border border-rose-200 bg-gradient-to-b from-[#fff5f8] to-[#fce7eb] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-800">Mẫu bánh 3D đã thiết kế đính kèm</p>
            <p className="text-xs text-stone-600">Hình bánh 3D này sẽ được gửi trực tiếp tới các tiệm bánh đối tác khi bạn lưu yêu cầu.</p>
          </div>
          {cake3DConfig && (
            <button
              type="button"
              onClick={() => setShowLive3D((v) => !v)}
              className="rounded-full bg-primary hover:bg-wine-dark px-3.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
            >
              {showLive3D ? 'Xem ảnh chụp 3D' : 'Xoay mô hình 3D 360°'}
            </button>
          )}
        </div>
        {showLive3D && cake3DConfig ? (
          <ThreeCakeCanvas
            compact
            config={cake3DConfig}
            spongeColor={cake3DConfig.spongeColor || '#f6e3ba'}
            fillingColor={cake3DConfig.fillingColor || '#e04f6b'}
            autoRotate
          />
        ) : cake3DSnapshotUrl ? (
          <div className="flex justify-center">
            <img
              src={cake3DSnapshotUrl}
              alt="Mẫu bánh 3D đã thiết kế"
              className="max-h-72 rounded-2xl border border-stone-200 object-contain shadow-sm"
            />
          </div>
        ) : null}
      </div>
    )}

    <fieldset disabled={busy || disabled} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-900">Chọn nhanh khoảng ngân sách mong muốn (VNĐ)</p>
            <p className="text-xs text-stone-600">Bấm chọn khoảng giá hoặc nhập trực tiếp số tiền ở 2 ô Ngân sách bên dưới.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '300k – 500k', min: 300000, max: 500000 },
              { label: '500k – 800k', min: 500000, max: 800000 },
              { label: '800k – 1.2Tr', min: 800000, max: 1200000 },
              { label: '1.2Tr – 2.5Tr', min: 1200000, max: 2500000 },
            ].map((preset) => {
              const active = Number(values.budgetMin) === preset.min && Number(values.budgetMax) === preset.max
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setValues((cur) => ({ ...cur, budgetMin: String(preset.min), budgetMax: String(preset.max) }))}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'border-primary bg-primary text-white shadow-xs'
                      : 'border-rose-300 bg-white text-stone-800 hover:border-primary/50'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <label>Loại yêu cầu<select {...field('requestType')} onChange={(event) => setValues((current) => ({ ...current, requestType: event.target.value, targetBakeryId: null, baseProductId: null, optionSelections: [] }))} className={inputClass}>{REQUEST_TYPES.map((type) => <option key={type} value={type}>{uiLabel(type)}</option>)}</select></label><label>Tiêu đề<input required maxLength={180} {...field('title')} className={inputClass} /></label><label className="sm:col-span-2">Mô tả<textarea required maxLength={10000} rows={4} {...field('description')} className={inputClass} /></label>
    {values.requestType === 'TARGETED_PRODUCT_CUSTOM' && <><label>Bakery ID đích (từ Catalog)<input required {...field('targetBakeryId')} className={inputClass} /></label><label>Product ID gốc (từ Catalog)<input required {...field('baseProductId')} className={inputClass} /></label>{isCatalogId(values.baseProductId) && <ProductSelections key={values.baseProductId} id={values.baseProductId} onProduct={receiveProduct} selections={values.optionSelections} onChange={(optionSelections) => setValues((current) => ({ ...current, optionSelections }))} />}</>}
    {[['occasion', 'Dịp', 'text', 100], ['servingSize', 'Khẩu phần', 'number'], ['budgetMin', 'Ngân sách tối thiểu (VND)', 'number'], ['budgetMax', 'Ngân sách tối đa (VND)', 'number'], ['neededAt', 'Ngày/giờ cần bánh', 'datetime-local'], ['offerDeadline', 'Hạn nhận báo giá', 'datetime-local']].map(([key, label, type, max]) => {
      const FieldInput = key.startsWith('budget') ? MoneyInput : 'input'
      return <label key={key}>{label}<FieldInput type={type} maxLength={max} min={key === 'servingSize' ? 1 : type === 'number' ? 0 : undefined} step={key.startsWith('budget') ? '0.01' : undefined} required={key === 'neededAt'} {...field(key)} className={inputClass} /></label>
    })}

    {/* Saved Address Quick Selector for delivery location */}
    {addresses.status === 'ready' && addresses.data?.length > 0 && (
      <div className="sm:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
        <p className="text-xs font-bold text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">location_on</span>
          <span>Điền nhanh khu vực từ sổ địa chỉ đã lưu:</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {addresses.data.map((addr) => {
            const isSelected = values.deliveryDistrict === addr.district && values.deliveryCity === addr.city
            return (
              <button
                key={addr.id}
                type="button"
                disabled={busy || disabled}
                onClick={() => setValues(cur => ({
                  ...cur,
                  deliveryDistrict: addr.district,
                  deliveryCity: addr.city,
                }))}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary text-white font-bold'
                    : 'border-outline-variant/40 bg-white text-stone-800 hover:border-primary/40'
                }`}
              >
                {addr.title || addr.district} ({addr.district}, {addr.city})
              </button>
            )
          })}
        </div>
      </div>
    )}

    {[['deliveryDistrict', 'Quận/huyện giao *', 'text', 120], ['deliveryCity', 'Tỉnh/thành giao *', 'text', 120]].map(([key, label, type, max]) => <label key={key}>{label}<input type={type} maxLength={max} required {...field(key)} className={inputClass} /></label>)}
    {Object.entries({ cakeSize: 'Kích thước', cakeShape: 'Hình dáng', flavor: 'Hương vị', filling: 'Nhân', frosting: 'Kem phủ', colorPalette: 'Bảng màu', decorationNotes: 'Trang trí', allergyNotes: 'Dị ứng' }).map(([key, label]) => <label key={key}>{label}<input value={values.preference[key] || ''} maxLength={key.endsWith('Notes') ? 4000 : key === 'colorPalette' ? 255 : ['cakeSize', 'cakeShape'].includes(key) ? 80 : 120} onChange={(event) => setValues((current) => ({ ...current, preference: { ...current.preference, [key]: event.target.value } }))} className={inputClass} /></label>)}
  </fieldset>
  {formError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 font-medium">{formError}</p>}
  {invalidTarget && <p role="status" className="sc-note">Cần sản phẩm công khai cho phép tùy chỉnh, thuộc đúng tiệm đích và đủ tùy chọn hợp lệ trước khi lưu.</p>}
  <p className="text-sm">Lưu bản nháp để bổ sung ảnh và kiểm tra thông tin trước khi đăng yêu cầu.</p>
  <div className="flex flex-wrap gap-3">
    <button disabled={busy || disabled || invalidTarget} className={buttonClass}>
      {busy ? 'Đang lưu…' : 'Lưu bản nháp'}
    </button>
    {onClose && <button type="button" disabled={busy} onClick={onClose} className="underline">Đóng</button>}
  </div>
</form>
}
