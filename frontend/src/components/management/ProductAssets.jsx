import MoneyInput from '../common/MoneyInput.jsx'
import { ModalFormState } from '../common/ModalSurface.jsx'
import { uiLabel } from '../../services/uiLabels.js'
import { VendorImage, VendorConfirm } from '../common/VendorUi.jsx'
import { vendorMoney } from '../../services/vendorPresentation.js'
import { useEffect } from 'react'
import React, { useRef, useState } from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadProductSnapshot, vendorCatalogService } from '../../services/vendorCatalogService.js'
import { vendorManagementService } from '../../services/vendorManagementService.js'
import { ApiErrorMessage, inputClass, buttonClass, panelClass } from './ApiState.jsx'
import { Icon } from '../common/WorkspaceUI.jsx'

export function OptionsEditor({ options, busy, onSave }) {
  const [values, setValues] = useState(() => structuredClone(options)), [confirmed, setConfirmed] = useState(false), [removing, setRemoving] = useState(null)
  const setGroup = (index, key, value) => setValues(current => ({ ...current, groups: current.groups.map((group, i) => i === index ? { ...group, [key]: value } : group) }))
  const setValue = (index, vi, key, value) => setValues(current => ({ ...current, groups: current.groups.map((group, i) => i === index ? { ...group, values: group.values.map((item, j) => vi === j ? { ...item, [key]: value } : item) } : group) }))

  return (
    <form
      id="vendor-options-form"
      className={panelClass + ' space-y-5'}
      onSubmit={(event) => {
        event.preventDefault()
        if (confirmed && !busy) onSave(values)
      }}
    >
      <ModalFormState value={values} busy={busy} />
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-primary/10">
        <div>
          <h3 className="font-bold text-lg text-primary flex items-center gap-2">
            <Icon name="tune" className="text-secondary" />
            <span>Tùy chọn sản phẩm</span>
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Lưu sẽ thay thế toàn bộ nhóm và lựa chọn theo cấu hình dưới đây. Những dòng không chỉnh sửa được giữ nguyên.
          </p>
        </div>
        <button
          type="button"
          className="sc-button sc-action-button--secondary text-xs flex items-center gap-1.5 cursor-pointer"
          onClick={() =>
            setValues((current) => ({
              ...current,
              groups: [
                ...current.groups,
                {
                  name: '',
                  selectionType: 'SINGLE',
                  required: false,
                  minimumSelections: 0,
                  maximumSelections: 1,
                  displayOrder: current.groups.length,
                  values: [],
                },
              ],
            }))
          }
        >
          <Icon name="add" className="text-sm" />
          <span>Thêm nhóm tùy chọn</span>
        </button>
      </div>

      <fieldset disabled={busy} className="space-y-4">
        {values.groups.map((group, index) => (
          <details
            key={group.id || index}
            open={!group.id || index === 0}
            className="sc-vendor-option-group sc-popup-group rounded-2xl border border-primary/15 bg-white p-4 sm:p-5 shadow-2xs space-y-4"
          >
            <summary className="font-bold text-sm sm:text-base text-primary flex items-center justify-between cursor-pointer select-none pb-2 border-b border-primary/10">
              <span className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary-fixed/40 text-secondary flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span>{group.name || 'Nhóm mới'}</span>
                <span className="text-xs font-normal text-on-surface-variant">
                  · {uiLabel(group.selectionType)}
                  {group.required ? ' · Bắt buộc' : ''}
                </span>
              </span>
            </summary>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <label className="text-xs font-semibold text-slate-700">
                <span>Tên nhóm *</span>
                <input
                  required
                  maxLength={120}
                  className={inputClass + ' mt-1'}
                  placeholder="Ví dụ: Kích thước, Hương vị, Nhân bánh..."
                  value={group.name}
                  onChange={(event) => setGroup(index, 'name', event.target.value)}
                />
              </label>

              <label className="text-xs font-semibold text-slate-700">
                <span>Kiểu chọn</span>
                <select
                  className={inputClass + ' mt-1 cursor-pointer'}
                  value={group.selectionType}
                  onChange={(event) => setGroup(index, 'selectionType', event.target.value)}
                >
                  <option value="SINGLE">Chọn một (Chỉ được chọn 1 mục)</option>
                  <option value="MULTIPLE">Chọn nhiều (Được chọn nhiều mục)</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 py-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={group.required}
                  onChange={(event) => setGroup(index, 'required', event.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span>Bắt buộc chọn khi đặt bánh</span>
              </label>

              <button
                type="button"
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                onClick={() => setRemoving({ group: index })}
              >
                <Icon name="delete" className="text-sm" />
                <span>Xóa nhóm</span>
              </button>
            </div>

            <details className="text-xs text-slate-600 bg-slate-50/80 rounded-xl p-3 border border-slate-200/80">
              <summary className="font-semibold cursor-pointer select-none">
                Giới hạn lựa chọn & thứ tự · {group.minimumSelections}–{group.maximumSelections} lựa chọn
              </summary>
              <div className="grid gap-3 sm:grid-cols-3 mt-3">
                {[
                  ['minimumSelections', 'Số chọn tối thiểu'],
                  ['maximumSelections', 'Số chọn tối đa'],
                  ['displayOrder', 'Thứ tự hiển thị'],
                ].map(([key, label]) => (
                  <label key={key} className="space-y-1">
                    <span className="text-[11px] font-medium text-slate-600">{label}</span>
                    <input
                      required
                      className={inputClass}
                      type="number"
                      min="0"
                      step="1"
                      value={group[key]}
                      onChange={(event) => setGroup(index, key, event.target.value)}
                    />
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Nhóm bắt buộc có số chọn tối thiểu từ 1. Kiểu chọn một có số chọn tối đa không quá 1.
              </p>
            </details>

            {/* Danh sách các lựa chọn trong nhóm */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                  Danh sách lựa chọn ({group.values.length})
                </h4>
                <button
                  type="button"
                  className="px-3 py-1 rounded-full border border-primary/20 bg-primary-fixed/20 hover:bg-primary-fixed/40 text-xs font-semibold text-primary transition-all flex items-center gap-1 cursor-pointer"
                  onClick={() =>
                    setGroup(index, 'values', [
                      ...group.values,
                      {
                        name: '',
                        description: '',
                        priceAdjustment: 0,
                        active: true,
                        displayOrder: group.values.length,
                      },
                    ])
                  }
                >
                  <Icon name="add" className="text-xs" />
                  <span>Thêm lựa chọn</span>
                </button>
              </div>

              {group.values.map((value, vi) => (
                <div
                  key={value.id || vi}
                  className="sc-popup-group rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3.5 shadow-2xs hover:border-primary/30 transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                    {/* Tên lựa chọn */}
                    <div className="md:col-span-5 min-w-0">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Tên lựa chọn <span className="text-rose-600 font-bold">*</span>
                      </label>
                      <input
                        required
                        maxLength={120}
                        value={value.name}
                        placeholder="Ví dụ: 14cm, Vani Pháp, Ít ngọt..."
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 bg-white text-slate-900 transition-all placeholder:text-slate-400"
                        onChange={(event) => setValue(index, vi, 'name', event.target.value)}
                      />
                    </div>

                    {/* Điều chỉnh giá */}
                    <div className="md:col-span-4 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Điều chỉnh giá (đ)
                        </label>
                        <span className="text-[11px] font-bold tabular-nums text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {Number(value.priceAdjustment) > 0 ? '+' : ''}
                          {vendorMoney(value.priceAdjustment)}
                        </span>
                      </div>
                      <MoneyInput
                        required
                        step="0.01"
                        value={value.priceAdjustment}
                        placeholder="0"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 bg-white text-slate-900 font-medium transition-all"
                        onChange={(event) => setValue(index, vi, 'priceAdjustment', event.target.value)}
                      />
                    </div>

                    {/* Nút xóa */}
                    <div className="md:col-span-3 flex justify-end">
                      <button
                        type="button"
                        className="w-full md:w-auto h-10 px-3.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        title="Xóa lựa chọn này"
                        onClick={() => setRemoving({ group: index, value: vi })}
                      >
                        <Icon name="delete" className="text-base text-rose-600" />
                        <span>Xóa lựa chọn</span>
                      </button>
                    </div>
                  </div>

                  {/* Thông tin khác: Mô tả, Thứ tự, Trạng thái */}
                  <details className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <summary className="cursor-pointer font-medium hover:text-slate-800 select-none py-1 flex items-center gap-1 text-xs">
                      <span>▶ Thông tin khác</span>
                      <span className="text-[11px] text-slate-400 font-normal">(Mô tả, thứ tự, trạng thái cung cấp)</span>
                    </summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 pt-2.5 border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Mô tả lựa chọn
                        </label>
                        <input
                          value={value.description || ''}
                          placeholder="Mô tả phụ nếu có"
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500/30"
                          onChange={(event) => setValue(index, vi, 'description', event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Thứ tự
                        </label>
                        <input
                          required
                          type="number"
                          min="0"
                          step="1"
                          value={value.displayOrder}
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 tabular-nums focus:outline-none focus:ring-1 focus:ring-rose-500/30"
                          onChange={(event) => setValue(index, vi, 'displayOrder', event.target.value)}
                        />
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 mt-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={value.active}
                        onChange={(event) => setValue(index, vi, 'active', event.target.checked)}
                        className="rounded text-wine focus:ring-wine w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 font-medium">Đang cung cấp</span>
                    </label>
                  </details>
                </div>
              ))}
            </div>
          </details>
        ))}

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
          <label className="flex items-start gap-2.5 text-xs font-semibold text-amber-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <span>Xác nhận lưu toàn bộ tùy chọn theo các dòng hiện tại.</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className={buttonClass}
              disabled={!confirmed || busy}
            >
              {busy ? 'Đang lưu…' : 'Lưu tùy chọn'}
            </button>
            <span className="text-xs text-amber-800/80">
              {!confirmed && '(Vui lòng tích chọn xác nhận trước khi lưu)'}
            </span>
          </div>
        </div>
      </fieldset>

      {removing && (
        <VendorConfirm
          title={removing.value === undefined ? 'Xóa nhóm tùy chọn' : 'Xóa lựa chọn'}
          label="Xóa khỏi cấu hình"
          danger
          onClose={() => setRemoving(null)}
          onConfirm={() => {
            setValues((current) => ({
              ...current,
              groups:
                removing.value === undefined
                  ? current.groups.filter((_, i) => i !== removing.group)
                  : current.groups.map((group, i) =>
                      i === removing.group
                        ? { ...group, values: group.values.filter((_, vi) => vi !== removing.value) }
                        : group
                    ),
            }))
            setRemoving(null)
          }}
        >
          <p>Chỉ áp dụng khi lưu toàn bộ tùy chọn. Dữ liệu của các đơn đã đặt được giữ nguyên.</p>
        </VendorConfirm>
      )}
    </form>
  )
}
function FilePreview({ file }) {
  const [url] = useState(() => URL.createObjectURL(file))
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return <VendorImage src={url} alt={file.name} />
}
export default function ProductAssets({ bakeryId, product, initialSnapshot, onSnapshot, onChanged, onBusy, activeTab = 'all' }) {
  const resource = useCatalogResource(loadProductSnapshot, { bakeryId, productId: product.id, fresh: Boolean(initialSnapshot) })
  const [confirmed, setConfirmed] = useState(initialSnapshot || null), [revision, setRevision] = useState(0), [files, setFiles] = useState([]), [primary, setPrimary] = useState(''), [orders, setOrders] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(''), [deleteId, setDelete] = useState('')
  const inFlight = useRef(false)
  const snapshot = confirmed || resource.data
  function remember(next, optionsChanged = false) { setConfirmed(next); onSnapshot(next); if (optionsChanged) setRevision((value) => value + 1) }
  async function mutate(action) {
    if (busy || inFlight.current) return
    inFlight.current = true
    setBusy(true); onBusy?.(true); setError(null); setNotice('')
    try { await action(); setNotice('Đã lưu và đồng bộ thông tin sản phẩm.'); onChanged(); resource.reload() }
    catch (failure) { setError(failure); resource.reload() } finally { inFlight.current = false; setBusy(false); onBusy?.(false) }
  }
  return <div className="space-y-4"><ModalFormState value={{ files: files.map((file) => [file.name, file.size, file.lastModified]), primary, orders }} busy={busy} /><section className={panelClass + ' sc-vendor-product-images' + (activeTab === 'options' ? ' hidden' : ' block')}><h3 className="font-bold text-base text-primary flex items-center gap-2">Ảnh sản phẩm</h3>
    {resource.status === 'loading' && !snapshot && <p>Đang tải ảnh và tùy chọn…</p>}
    {resource.error && (resource.error.status === 404 ? <p role="status">Chưa tải được đầy đủ ảnh và tùy chọn sản phẩm.</p> : <ApiErrorMessage error={resource.error} retry={resource.reload} />)}
    <p className="text-sm">Ảnh PNG/JPEG/WebP, tối đa 5 MiB mỗi ảnh và 10 ảnh mỗi sản phẩm. Chọn ảnh chính cho các ảnh mới tải lên.</p>
    <form onSubmit={(event) => { event.preventDefault(); if (files.length) void mutate(async () => { const result = await vendorManagementService.uploadProductImages(bakeryId, product.id, files, { displayOrder: orders.map(Number), ...(primary !== '' ? { primaryIndex: Number(primary) } : {}) }); remember({ ...snapshot, images: [...(snapshot?.images || []), ...result] }); setFiles([]); setPrimary(''); setOrders([]) }) }} className="space-y-3"><fieldset disabled={busy}>
      <label>Chọn ảnh<input type="file" accept="image/png,image/jpeg,image/webp" multiple className={inputClass} onChange={(event) => { const chosen = Array.from(event.target.files); event.target.value = ''; setFiles(chosen); setOrders(chosen.map((_, i) => i)); setPrimary('') }} /></label>
      {files.map((file, index) => <label key={file.name + file.lastModified + file.size + index}><FilePreview file={file} />{file.name} — thứ tự<input type="number" min="0" required step="1" value={orders[index]} onChange={(event) => setOrders((current) => current.map((value, i) => i === index ? event.target.value : value))} className={inputClass} /></label>)}
      <label>Ảnh chính trong lần tải lên<select value={primary} disabled={snapshot?.images?.some((image) => image.primary)} onChange={(event) => setPrimary(event.target.value)} className={inputClass}><option value="">Giữ ảnh chính hiện tại</option>{files.map((file, i) => <option key={i} value={i}>{file.name}</option>)}</select></label><button className={buttonClass} disabled={!files.length}>Tải ảnh lên</button>
    </fieldset></form>
    {snapshot?.images?.length ? <ul className="grid gap-3 sm:grid-cols-2">{snapshot.images.map(image => <li key={image.id} className="space-y-2"><VendorImage src={image.url} alt={image.primary ? 'Ảnh chính sản phẩm' : 'Ảnh sản phẩm'} /><p className="text-sm">{image.primary ? 'Ảnh chính' : 'Ảnh bổ sung'}</p><div className="sc-actions">{/^https?:\/\//i.test(image.url || '') && <a className="sc-button sc-button--secondary" href={image.url} target="_blank" rel="noreferrer">Xem ảnh</a>}<button type="button" disabled={busy} className="sc-button sc-button--secondary" onClick={() => setDelete(image.id)}>Xóa ảnh</button></div></li>)}</ul> : <p>Chưa có ảnh sản phẩm.</p>}
    {deleteId && <VendorConfirm title="Xóa ảnh sản phẩm" label="Xác nhận xóa" danger busy={busy} error={error && <ApiErrorMessage error={error} />} onClose={() => setDelete('')} onConfirm={() => mutate(async () => { await vendorCatalogService.deleteImage(bakeryId, product.id, deleteId); remember({ ...snapshot, images: snapshot.images.filter(item => item.id !== deleteId) }); setDelete('') })}><p>{snapshot.images.find(image => image.id === deleteId)?.primary ? 'Đây là ảnh chính của sản phẩm. Kiểm tra điều kiện mở bán trước khi xóa.' : 'Ảnh này sẽ được xóa khỏi sản phẩm.'}</p></VendorConfirm>}
  </section><div className={activeTab === 'images' ? 'hidden' : 'block'}>{snapshot?.options ? <OptionsEditor key={revision} options={snapshot.options} busy={busy} onSave={(input) => mutate(async () => { const options = await vendorCatalogService.saveOptions(bakeryId, product.id, input); remember({ ...snapshot, options }, true) })} /> : <p>Chưa tải đủ tùy chọn.</p>}</div>{error && <ApiErrorMessage error={error} />}{notice && <p role="status">{notice}</p>}</div>
}

