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
export function OptionsEditor({ options, busy, onSave }) {
  const [values, setValues] = useState(() => structuredClone(options)), [confirmed, setConfirmed] = useState(false), [removing, setRemoving] = useState(null)
  const setGroup = (index, key, value) => setValues(current => ({ ...current, groups: current.groups.map((group, i) => i === index ? { ...group, [key]: value } : group) }))
  const setValue = (index, vi, key, value) => setValues(current => ({ ...current, groups: current.groups.map((group, i) => i === index ? { ...group, values: group.values.map((item, j) => vi === j ? { ...item, [key]: value } : item) } : group) }))
  return <form className={panelClass} onSubmit={event => { event.preventDefault(); if (confirmed && !busy) onSave(values) }}><ModalFormState value={values} busy={busy} /><h3>Tùy chọn sản phẩm</h3><p className="text-sm">Lưu sẽ thay thế toàn bộ nhóm và lựa chọn theo cấu hình dưới đây. Những dòng không chỉnh sửa được giữ nguyên.</p><fieldset disabled={busy} className="space-y-3">
    {values.groups.map((group,index) => <details key={group.id || index} open={!group.id || index === 0} className="sc-vendor-option-group"><summary className="font-bold">{group.name || 'Nhóm mới'} · {uiLabel(group.selectionType)}{group.required ? ' · Bắt buộc' : ''}</summary>
      <div className="sc-vendor-form-grid"><label>Tên nhóm *<input required maxLength={120} className={inputClass} value={group.name} onChange={event => setGroup(index,'name',event.target.value)} /></label><label>Kiểu chọn<select className={inputClass} value={group.selectionType} onChange={event => setGroup(index,'selectionType',event.target.value)}><option value="SINGLE">Chọn một</option><option value="MULTIPLE">Chọn nhiều</option></select></label></div>
      <label className="flex gap-2 my-2"><input type="checkbox" checked={group.required} onChange={event => setGroup(index,'required',event.target.checked)} />Bắt buộc chọn</label>
      <details className="mb-3"><summary>Giới hạn lựa chọn &amp; thứ tự · {group.minimumSelections}–{group.maximumSelections} lựa chọn</summary><div className="sc-vendor-form-grid">{[['minimumSelections','Số chọn tối thiểu'],['maximumSelections','Số chọn tối đa'],['displayOrder','Thứ tự hiển thị']].map(([key,label]) => <label key={key}>{label}<input required className={inputClass} type="number" min="0" step="1" value={group[key]} onChange={event => setGroup(index,key,event.target.value)} /></label>)}</div><p className="text-xs">Nhóm bắt buộc có số chọn tối thiểu từ 1. Kiểu chọn một có số chọn tối đa không quá 1.</p></details>
      {group.values.map((value,vi) => <div key={value.id || vi} className="sc-vendor-option-value"><label>Tên lựa chọn *<input required maxLength={120} value={value.name} className={inputClass} onChange={event => setValue(index,vi,'name',event.target.value)} /></label><label>Điều chỉnh giá (đ)<input required type="number" step="0.01" value={value.priceAdjustment} className={inputClass} onChange={event => setValue(index,vi,'priceAdjustment',event.target.value)} /><small>{Number(value.priceAdjustment) > 0 ? '+' : ''}{vendorMoney(value.priceAdjustment)}</small></label><button type="button" className="sc-button sc-action-button--secondary" onClick={() => setRemoving({ group:index, value:vi })}>Xóa lựa chọn</button>
        <details className="sc-vendor-option-more"><summary>Thông tin khác</summary><div className="sc-vendor-form-grid"><label>Mô tả<input value={value.description || ''} className={inputClass} onChange={event => setValue(index,vi,'description',event.target.value)} /></label><label>Thứ tự<input required type="number" min="0" step="1" className={inputClass} value={value.displayOrder} onChange={event => setValue(index,vi,'displayOrder',event.target.value)} /></label></div><label className="flex gap-2"><input type="checkbox" checked={value.active} onChange={event => setValue(index,vi,'active',event.target.checked)} />Đang cung cấp</label></details>
      </div>)}
      <div className="sc-actions"><button type="button" className="sc-button sc-action-button--secondary" onClick={() => setGroup(index,'values',[...group.values,{name:'',description:'',priceAdjustment:0,active:true,displayOrder:group.values.length}])}>Thêm lựa chọn</button><button type="button" className="sc-button sc-action-button--secondary" onClick={() => setRemoving({ group:index })}>Xóa nhóm</button></div>
    </details>)}
    <button type="button" className="sc-button sc-action-button--secondary" onClick={() => setValues(current => ({ ...current, groups:[...current.groups,{ name:'',selectionType:'SINGLE',required:false,minimumSelections:0,maximumSelections:1,displayOrder:current.groups.length,values:[] }] }))}>Thêm nhóm tùy chọn</button>
    <label className="flex gap-2"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />Xác nhận lưu toàn bộ tùy chọn theo các dòng hiện tại.</label><button className={buttonClass} disabled={!confirmed || busy}>{busy ? 'Đang lưu…' : 'Lưu tùy chọn'}</button>
  </fieldset>{removing && <VendorConfirm title={removing.value === undefined ? 'Xóa nhóm tùy chọn' : 'Xóa lựa chọn'} label="Xóa khỏi cấu hình" danger onClose={() => setRemoving(null)} onConfirm={() => { setValues(current => ({ ...current, groups:removing.value === undefined ? current.groups.filter((_,i) => i !== removing.group) : current.groups.map((group,i) => i === removing.group ? { ...group, values:group.values.filter((_,vi) => vi !== removing.value) } : group) })); setRemoving(null) }}><p>Chỉ áp dụng khi lưu toàn bộ tùy chọn. Dữ liệu của các đơn đã đặt được giữ nguyên.</p></VendorConfirm>}</form>
}
function FilePreview({ file }) {
  const [url] = useState(() => URL.createObjectURL(file))
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return <VendorImage src={url} alt={file.name} />
}
export default function ProductAssets({ bakeryId, product, initialSnapshot, onSnapshot, onChanged, onBusy }) {
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
  return <div className="space-y-4"><ModalFormState value={{ files: files.map((file) => [file.name, file.size, file.lastModified]), primary, orders }} busy={busy} /><section className={panelClass}><h3 className="font-bold">Ảnh sản phẩm</h3>
    {resource.status === 'loading' && !snapshot && <p>Đang tải ảnh và tùy chọn…</p>}
    {resource.error && (resource.error.status === 404 ? <p role="status">Chưa tải được đầy đủ ảnh và tùy chọn sản phẩm. Vui lòng tải lại trước khi chỉnh sửa.</p> : <ApiErrorMessage error={resource.error} retry={resource.reload} />)}
    <p className="text-sm">Ảnh PNG/JPEG/WebP, tối đa 5 MiB mỗi ảnh và 10 ảnh mỗi sản phẩm. Chọn ảnh chính cho các ảnh mới tải lên.</p>
    <form onSubmit={(event) => { event.preventDefault(); if (files.length) void mutate(async () => { const result = await vendorManagementService.uploadProductImages(bakeryId, product.id, files, { displayOrder: orders.map(Number), ...(primary !== '' ? { primaryIndex: Number(primary) } : {}) }); remember({ ...snapshot, images: [...(snapshot?.images || []), ...result] }); setFiles([]); setPrimary(''); setOrders([]) }) }} className="space-y-3"><fieldset disabled={busy}>
      <label>Chọn ảnh<input type="file" accept="image/png,image/jpeg,image/webp" multiple className={inputClass} onChange={(event) => { const chosen = Array.from(event.target.files); event.target.value = ''; setFiles(chosen); setOrders(chosen.map((_, i) => i)); setPrimary('') }} /></label>
      {files.map((file, index) => <label key={file.name + file.lastModified + file.size + index}><FilePreview file={file} />{file.name} — thứ tự<input type="number" min="0" required step="1" value={orders[index]} onChange={(event) => setOrders((current) => current.map((value, i) => i === index ? event.target.value : value))} className={inputClass} /></label>)}
      <label>Ảnh chính trong lần tải lên<select value={primary} disabled={snapshot?.images?.some((image) => image.primary)} onChange={(event) => setPrimary(event.target.value)} className={inputClass}><option value="">Giữ ảnh chính hiện tại</option>{files.map((file, i) => <option key={i} value={i}>{file.name}</option>)}</select></label><button className={buttonClass} disabled={!files.length}>Tải ảnh lên</button>
    </fieldset></form>
    {snapshot?.images?.length ? <ul className="grid gap-3 sm:grid-cols-2">{snapshot.images.map(image => <li key={image.id} className="space-y-2"><VendorImage src={image.url} alt={image.primary ? 'Ảnh chính sản phẩm' : 'Ảnh sản phẩm'} /><p className="text-sm">{image.primary ? 'Ảnh chính' : 'Ảnh bổ sung'}</p><div className="sc-actions">{/^https?:\/\//i.test(image.url || '') && <a className="sc-button sc-button--secondary" href={image.url} target="_blank" rel="noreferrer">Xem ảnh</a>}<button type="button" disabled={busy} className="sc-button sc-button--secondary" onClick={() => setDelete(image.id)}>Xóa ảnh</button></div></li>)}</ul> : <p>Chưa có ảnh sản phẩm.</p>}
    {deleteId && <VendorConfirm title="Xóa ảnh sản phẩm" label="Xác nhận xóa" danger busy={busy} error={error && <ApiErrorMessage error={error} />} onClose={() => setDelete('')} onConfirm={() => mutate(async () => { await vendorCatalogService.deleteImage(bakeryId, product.id, deleteId); remember({ ...snapshot, images: snapshot.images.filter(item => item.id !== deleteId) }); setDelete('') })}><p>{snapshot.images.find(image => image.id === deleteId)?.primary ? 'Đây là ảnh chính của sản phẩm. Kiểm tra điều kiện mở bán trước khi xóa.' : 'Ảnh này sẽ được xóa khỏi sản phẩm.'}</p></VendorConfirm>}
  </section>{snapshot?.options ? <OptionsEditor key={revision} options={snapshot.options} busy={busy} onSave={(input) => mutate(async () => { const options = await vendorCatalogService.saveOptions(bakeryId, product.id, input); remember({ ...snapshot, options }, true) })} /> : <p>Chưa tải đủ tùy chọn. Vui lòng tải lại trước khi chỉnh sửa.</p>}{error && <ApiErrorMessage error={error} />}{notice && <p role="status">{notice}</p>}</div>
}

