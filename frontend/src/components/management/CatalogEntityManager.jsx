import React, { useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadVendorMembership } from '../../services/vendorManagementService.js'
import { loadCatalogEntities, vendorCatalogService } from '../../services/vendorCatalogService.js'
import { canManageEntity } from '../../services/vendorCatalogModels.js'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from './ApiState.jsx'
const titles = { categories: 'Danh mục', 'add-ons': 'Phụ kiện bánh', members: 'Nhân sự tiệm' }
export function CatalogEntityForm({ kind, row, actor, busy, onSave, onClose }) {
  const [values, setValues] = useState(row || { name: '', slug: '', displayOrder: 0, active: true, description: '', category: '', price: '', userId: '', memberRole: 'STAFF', status: 'ACTIVE' })
  const field = (key) => ({ value: values[key] ?? '', onChange: (event) => setValues((current) => ({ ...current, [key]: event.target.value })) })
  const roles = actor?.memberRole === 'MANAGER' ? ['STAFF'] : row?.memberRole === 'OWNER' ? ['OWNER', 'MANAGER', 'STAFF'] : ['MANAGER', 'STAFF']
  return <form className={panelClass} onSubmit={(event) => { event.preventDefault(); onSave(values) }}><h3 className="font-bold">{row ? 'Sửa' : 'Thêm'} {titles[kind]}</h3><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
    {kind === 'members' ? <>{!row && <label>User ID đã có Bakery role<input required {...field('userId')} className={inputClass} /></label>}<label>Quyền trong tiệm<select {...field('memberRole')} className={inputClass}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>{row && <label>Trạng thái<select {...field('status')} className={inputClass}>{['INVITED', 'ACTIVE', 'INACTIVE'].map((status) => <option key={status}>{status}</option>)}</select></label>}<p className="text-sm">Không tạo tài khoản hoặc cấp platform role. Backend xác minh user và bảo toàn owner cuối.</p></> : <><label>Tên<input required maxLength={kind === 'categories' ? 120 : 160} {...field('name')} className={inputClass} /></label>{kind === 'categories' ? <><label>Slug<input required maxLength={140} {...field('slug')} className={inputClass} /></label><label>Thứ tự<input required type="number" min="0" step="1" {...field('displayOrder')} className={inputClass} /></label></> : <><label>Nhóm phụ kiện<input required maxLength={80} {...field('category')} className={inputClass} /></label><label>Giá (VND)<input required type="number" min="0" step="0.01" {...field('price')} className={inputClass} /></label><label>Mô tả<textarea {...field('description')} className={inputClass} /></label></>}<label className="flex gap-2"><input type="checkbox" checked={values.active === true} onChange={(event) => setValues((current) => ({ ...current, active: event.target.checked }))} />Hoạt động</label></>}
    <div className="flex gap-3"><button className={buttonClass}>Lưu</button><button type="button" onClick={onClose} className="underline">Đóng</button></div>
  </fieldset></form>
}
export default function CatalogEntityManager({ bakeryId, kind }) {
  const { user, roles } = useAuth()
  const resource = useCatalogResource(loadCatalogEntities, { bakeryId, kind })
  const membership = useCatalogResource(loadVendorMembership, { bakeryId, userId: user.id })
  const [editing, setEditing] = useState(null), [adding, setAdding] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(''), [confirmId, setConfirm] = useState(''), [media, setMedia] = useState(null)
  const editable = (row) => membership.status === 'ready' && canManageEntity(membership.data, roles, kind, row, kind === 'members' ? resource.data || [] : [])
  async function mutate(action) {
    if (busy) return
    setBusy(true); setError(null); setNotice('')
    try { await action(); setEditing(null); setAdding(false); setConfirm(''); setNotice('Backend đã xác nhận; danh sách được tải lại.'); resource.reload(); membership.reload() }
    catch (failure) { setError(failure); if (![400, 422].includes(failure.status)) { resource.reload(); membership.reload() } }
    finally { setBusy(false) }
  }
  return <div className="space-y-4"><section className={panelClass}><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold text-primary">{titles[kind]}</h2><button disabled={busy || !editable()} className={buttonClass} onClick={() => { setAdding(true); setEditing(null); setError(null) }}>Thêm {titles[kind]}</button><button className="underline" onClick={resource.reload}>Tải lại</button></div>
    {membership.error && <ApiErrorMessage error={membership.error} retry={membership.reload} />}
    <ApiState resource={resource}>{resource.data && (resource.data.length ? <div className="grid gap-4 lg:grid-cols-2">{resource.data.map((row) => <article key={row.id} className="space-y-3 rounded-xl border p-4"><h3 className="font-bold">{row.name || row.displayNameSnapshot || row.userId}</h3><p className="break-all text-xs">{row.id}</p>{kind === 'members' ? <p>{row.memberRole} · {row.status}</p> : <p>{row.active ? 'Hoạt động' : 'Ngừng hoạt động'}{kind === 'add-ons' ? ' · ' + row.price + ' VND · ' + row.category : ' · ' + row.slug}</p>}<div className="flex flex-wrap gap-3"><button disabled={busy || !editable(row)} onClick={() => { setEditing(row); setAdding(false); setError(null) }} className={buttonClass}>Sửa</button><label className="flex items-center gap-2"><input type="checkbox" checked={confirmId === row.id} disabled={busy || !editable(row)} onChange={(event) => setConfirm(event.target.checked ? row.id : '')} />{kind === 'add-ons' ? 'Xác nhận ngừng bán' : 'Xác nhận xóa'}</label><button disabled={busy || confirmId !== row.id || !editable(row)} className="underline disabled:opacity-40" onClick={() => mutate(() => vendorCatalogService.remove(bakeryId, kind, row.id))}>{kind === 'add-ons' ? 'Ngừng bán' : 'Xóa'}</button></div>
      {kind === 'add-ons' && editable(row) && <label className="block text-sm">Upload ảnh PNG/JPEG/WebP ≤5 MiB<input type="file" disabled={busy} accept="image/png,image/jpeg,image/webp" className={inputClass} onChange={(event) => { const file = event.target.files[0]; event.target.value = ''; if (file) void mutate(async () => { const result = await vendorCatalogService.uploadAddOn(bakeryId, row.id, file); setMedia({ id: row.id, url: result.url }) }) }} /></label>}{media?.id === row.id && /^https?:\/\//i.test(media.url) && <a className="underline" target="_blank" rel="noreferrer" href={media.url}>Xem ảnh backend vừa xác nhận</a>}
    </article>)}</div> : <p>Chưa có {titles[kind].toLowerCase()} từ backend.</p>)}</ApiState>
    {kind === 'categories' && <p className="text-sm">Xóa danh mục sẽ gỡ liên kết danh mục trên sản phẩm; không xóa sản phẩm.</p>}
    {kind === 'add-ons' && <p className="text-sm">DELETE ngừng bán phụ kiện. DTO danh sách chưa có URL ảnh; chỉ xem URL từ lần upload được backend xác nhận.</p>}
  </section>{(adding || editing) && editable(editing) && <CatalogEntityForm key={editing?.id || 'new'} kind={kind} row={editing} actor={membership.data} busy={busy} onClose={() => { setAdding(false); setEditing(null) }} onSave={(input) => mutate(() => vendorCatalogService.save(bakeryId, kind, editing?.id, input))} />}
  {error && <ApiErrorMessage error={error} />}{notice && <p role="status">{notice}</p>}</div>
}

