import MoneyInput from '../common/MoneyInput.jsx'
import { useViewportPageSize } from '../../hooks/useViewportPageSize.js'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import { vendorMoney, vendorName } from '../../services/vendorPresentation.js'
import { ModalFormState } from '../common/ModalSurface.jsx'
import { uiLabel, cleanPresentationLabel } from '../../services/uiLabels.js'
import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadVendorMembership, loadManagedProducts, vendorManagementService } from '../../services/vendorManagementService.js'
import { loadCatalogEntities, vendorCatalogService } from '../../services/vendorCatalogService.js'
import { ApiError } from '../../services/apiClient.js'
import { readDashboardPages } from '../../services/adminDashboardService.js'
import { recordSource } from '../../services/unifiedDataService.js'
import { validateImage } from '../../services/managementModels.js'
import { canManageEntity, catalogEntityPayload, categoryNameKey, groupProductCategories } from '../../services/vendorCatalogModels.js'
import { DetailDrawer, StatusBadge, Icon, DataTable, EmptyPanel } from '../common/WorkspaceUI.jsx'
import { VendorActionMenu, VendorImage } from '../common/VendorUi.jsx'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from './ApiState.jsx'
const titles = { categories: 'Danh mục', 'add-ons': 'Phụ kiện bánh', members: 'Chủ tiệm' }
const categorySlug = name => categoryNameKey(name).normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const loadCategoryProducts = ({ bakeryId }, options) => readDashboardPages(
  (page, request) => loadManagedProducts({ bakeryId, ...page }, request), options,
)

function CategoryProducts({ bakeryId, row, ids, editable, busy, onLink }) {
  const products = useCatalogResource(loadCategoryProducts, { bakeryId })
  const [selected, setSelected] = useState('')
  const rows = products.data?.rows || []
  const linked = rows.filter(product => ids.includes(product.categoryId))
  const unassigned = rows.filter(product => !product.categoryId && recordSource(product) === recordSource(row))
  return <ApiState resource={products}>
    {linked.length ? <ul>{linked.map(product => <li key={product.id}>{product.name}</li>)}</ul> : <p>Danh mục chưa có bánh.</p>}
    {editable && row.active && unassigned.length > 0 && <div className="sc-toolbar-actions">
      <label>Bánh chưa có danh mục<select className={inputClass} value={selected} onChange={event => setSelected(event.target.value)}>
        <option value="">Chọn bánh</option>
        {unassigned.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
      </select></label>
      <button type="button" className={buttonClass} disabled={busy || !selected} onClick={async () => {
        if (await onLink(selected)) { setSelected(''); products.reload() }
      }}>Liên kết bánh</button>
    </div>}
  </ApiState>
}

export function CatalogEntityForm({ kind, row, busy, onSave, onClose, error, onUpload, image, kicker, nextOrder = 0, groups = [] }) {
  const [values, setValues] = useState(row || { name: '', slug: '', displayOrder: nextOrder, active: true, description: '', category: '', price: '' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [imageError, setImageError] = useState(null)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  function selectImage(event) {
    const selected = event.target.files[0]
    event.target.value = ''
    if (!selected) return
    setImageError(null)
    try {
      validateImage(selected)
      if (row) onUpload(selected)
      else {
        setFile(selected)
        setPreview(URL.createObjectURL(selected))
      }
    } catch (failure) {
      setFile(null)
      setPreview(null)
      setImageError(failure)
    }
  }
  const field = (key) => ({ value: values[key] ?? '', onChange: (event) => setValues((current) => ({ ...current, [key]: event.target.value })) })
  return <DetailDrawer className="sc-vendor-drawer" kicker={kicker} title={(row ? 'Chỉnh sửa ' : 'Thêm ') + titles[kind].toLowerCase()} onClose={onClose} busy={busy} footer={<><button type="button" data-modal-close disabled={busy} className="sc-button sc-action-button--secondary">Hủy</button><button type="submit" form="vendor-entity-form" disabled={busy} className={buttonClass}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button></>}><form id="vendor-entity-form" onSubmit={(event) => { event.preventDefault(); onSave(values, file) }}><ModalFormState value={values} busy={busy} /><fieldset disabled={busy} className="sc-vendor-form-grid">
    <label>Tên *<input required maxLength={kind === 'categories' ? 120 : 160} {...field('name')} className={inputClass} /></label>
    <label>Trạng thái<select value={String(values.active)} onChange={event => setValues(current => ({ ...current, active: event.target.value === 'true' }))} className={inputClass}>
      <option value="true">{kind === 'categories' ? 'Đang hoạt động' : 'Đang bán'}</option>
      <option value="false">{kind === 'categories' ? 'Ngừng hoạt động' : 'Ngừng bán'}</option>
    </select></label>
    {kind === 'categories' ? <label>Thứ tự hiển thị<input required type="number" min="0" step="1" {...field('displayOrder')} className={inputClass} /></label> : <><label>Nhóm phụ kiện *<select required {...field('category')} className={inputClass}><option value="">Chọn nhóm</option>{[...new Set([values.category, ...groups, 'Trang trí', 'Nến', 'Thiệp', 'Khác'].filter(Boolean))].map(group => <option key={group}>{group}</option>)}</select></label><label>Giá (đ) *<MoneyInput required min="0" step="0.01" {...field('price')} className={inputClass} /></label><label className="sm:col-span-2">Mô tả<textarea {...field('description')} rows={3} className={inputClass} /></label></>}
  </fieldset></form>{kind === 'add-ons' && <section className="sc-vendor-editor-section">
    <h3>Hình ảnh phụ kiện</h3>
    <VendorImage src={preview || image || row?.imageUrl} alt={vendorName(values.name)} />
    <label>{row ? 'Thay ảnh' : 'Chọn ảnh'} PNG/JPEG/WebP, tối đa 5 MiB<input type="file" disabled={busy} accept="image/png,image/jpeg,image/webp" className={inputClass} onChange={selectImage} /></label>
    {file && <p>{file.name}</p>}
    {imageError && <ApiErrorMessage error={imageError} />}
  </section>}{error && <ApiErrorMessage error={error} />}</DetailDrawer>
}
export default function CatalogEntityManager({ bakeryId, kind, bakeryName, navigation }) {
  const { user, roles } = useAuth()
  const resource = useCatalogResource(loadCatalogEntities, { bakeryId, kind })
  const membership = useCatalogResource(loadVendorMembership, { bakeryId, userId: user.id })
  const [editing, setEditing] = useState(null), [adding, setAdding] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(''), [media, setMedia] = useState({})
  const [page, setPage] = useState(1)
  const { containerRef, pageSize } = useViewportPageSize(() => setPage(1), kind !== 'add-ons')
  const categoryGroups = groupProductCategories(kind === 'categories' ? resource.data || [] : [])
  const entries = kind === 'categories' ? [...categoryGroups.values()].map(group => group[0]) : resource.data || []
  const [expanded, setExpanded] = useState(null)
  const createdAddOn = useRef(null)
  const total = entries.length, pages = Math.ceil(total / pageSize)
  const currentPage = Math.min(page, Math.max(1, pages))
  const pagedEntries = entries.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const inFlight = useRef(false)
  const editable = (row) => membership.status === 'ready' && canManageEntity(membership.data, roles, kind, row, kind === 'members' ? resource.data || [] : [])
  async function mutate(action, close = true) {
    if (busy || inFlight.current || !editable()) return false
    inFlight.current = true; setBusy(true); setError(null); setNotice('')
    try { await action(); if (close) { setEditing(null); setAdding(false) } setNotice('Đã lưu thay đổi.'); resource.reload(); membership.reload(); return true }
    catch (failure) { setError(failure); if (![400, 422].includes(failure.status)) { resource.reload(); membership.reload() } return false }
    finally { inFlight.current = false; setBusy(false) }
  }
  const actions = row => kind === 'add-ons' ? [{
    key: 'toggle', label: row.active ? 'Ngừng bán' : 'Mở bán lại',
    icon: row.active ? 'pause_circle' : 'storefront', disabled: !editable(row),
    description: row.active ? 'Khách sẽ không thể chọn phụ kiện này cho đơn mới.' : 'Cho phép khách chọn phụ kiện này trong đơn mới.',
  }] : []
  const handle = (row, key) => {
    if (key === 'edit') {
      setEditing(row); setAdding(false); setError(null); return
    }
    return mutate(() => vendorCatalogService.save(bakeryId, kind, row.id, { ...row, active: !row.active }))
  }
  const save = (input, file) => mutate(async () => {
    if (kind === 'add-ons') {
      if (file) validateImage(file)
      const saved = await vendorCatalogService.save(bakeryId, kind, editing?.id || createdAddOn.current, input)
      if (!editing) createdAddOn.current = saved.id
      if (file) {
        const result = await vendorCatalogService.uploadAddOn(bakeryId, saved.id, file)
        setMedia(current => ({ ...current, [saved.id]: result.url }))
      }
      createdAddOn.current = null
      return
    }
    const rows = resource.data || []
    const name = input.name.trim()
    if (rows.some(row => row.id !== editing?.id && categoryNameKey(row.name) === categoryNameKey(name)) &&
        (!editing || categoryNameKey(name) !== categoryNameKey(editing.name))) {
      throw new ApiError('Tên danh mục này đã có.', 400)
    }
    const displayOrder = Number(input.displayOrder)
    const slug = editing?.slug || categorySlug(name).slice(0, 140)
    if (!slug || input.displayOrder === '' || !Number.isSafeInteger(displayOrder) || displayOrder < 0 || displayOrder > 2147483647) {
      throw new ApiError('Kiểm tra tên danh mục và thứ tự hiển thị.', 400)
    }
    const values = catalogEntityPayload(kind, { ...input, slug, displayOrder })
    if (!editing && rows.some(row => row.slug === slug)) throw new ApiError('Tên danh mục này tạo mã trùng với danh mục hiện có.', 400)
    if (editing?.displayOrder === displayOrder) return vendorCatalogService.save(bakeryId, kind, editing.id, values)
    let next = displayOrder
    const shifts = []
    for (const row of rows.filter(row => row.id !== editing?.id).sort((a, b) => a.displayOrder - b.displayOrder)) {
      if (row.displayOrder < displayOrder) continue
      if (row.displayOrder > next) break
      if (next === 2147483647) throw new ApiError('Thứ tự hiển thị vượt giới hạn.', 400)
      shifts.push({ ...row, displayOrder: ++next })
    }
    for (const row of shifts.reverse()) await vendorCatalogService.setCategoryOrder(bakeryId, row.id, row.displayOrder)
    await vendorCatalogService.save(bakeryId, kind, editing?.id, values)
  })
  return <div ref={containerRef} className="space-y-4"><section className={panelClass + ' sc-vendor-menu-panel'}><div className="sc-toolbar-actions">{navigation}{kind !== 'members' && <button disabled={busy || !editable()} className={buttonClass + ' ml-auto shrink-0'} onClick={() => { createdAddOn.current = null; setAdding(true); setEditing(null); setError(null) }}><Icon name="add" />Thêm {titles[kind].toLowerCase()}</button>}</div>
    {membership.error && !resource.error && <ApiErrorMessage error={membership.error} retry={membership.reload} />}
    <ApiState resource={resource}>{resource.data && (resource.data.length ? kind === 'add-ons' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{resource.data.map(row => <article key={row.id} className="sc-panel sc-vendor-product-card"><VendorImage src={media[row.id] || row.imageUrl} alt={vendorName(row.name)} /><div className="sc-vendor-product-body"><div><StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} label={row.active ? 'Đang bán' : 'Ngừng bán'} /></div><h3>{vendorName(row.name)}</h3><strong>{Number(row.price) === 0 ? 'Miễn phí' : vendorMoney(row.price)}</strong><p>{vendorName(row.category)}</p><div className="sc-vendor-card-actions"><button type="button" className={buttonClass} disabled={busy || !editable(row)} onClick={() => handle(row, 'edit')}>Chỉnh sửa</button><VendorActionMenu inline error={error && <ApiErrorMessage error={error} />} actions={actions(row).filter(action => action.key !== 'edit')} busy={busy} onConfirm={key => handle(row, key)} /></div></div></article>)}</div> : <DataTable label={titles[kind]}><thead><tr><th style={{ width: '60px', textAlign: 'center' }}>STT</th><th>{kind === 'members' ? 'Họ tên' : 'Tên danh mục'}</th>{kind === 'members' && <th>Vai trò</th>}<th>Trạng thái</th>{kind !== 'members' && <th className="sc-table-actions">Thao tác</th>}</tr></thead><tbody>{pagedEntries.map((row, index) => <React.Fragment key={row.id}><tr><td data-label="STT" style={{ width: '60px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-muted, #64748b)' }}>{(currentPage - 1) * pageSize + index + 1}</td><td>{vendorName(cleanPresentationLabel(kind === 'members' ? row.displayNameSnapshot : row.name, kind === 'members' ? 'Chưa cập nhật tên' : 'Chưa cập nhật'))}</td>{kind === 'members' && <td>{uiLabel(row.memberRole)}</td>}<td><StatusBadge status={kind === 'members' ? row.status : row.active ? 'ACTIVE' : 'INACTIVE'} /></td>{kind !== 'members' && <td className="sc-table-actions"><button type="button" className={buttonClass} disabled={!editable(row) || busy} onClick={() => handle(row, 'edit')}>Chỉnh sửa</button><button type="button" className="sc-button sc-action-button--secondary" aria-expanded={expanded === row.id} onClick={() => setExpanded(expanded === row.id ? null : row.id)}>{expanded === row.id ? 'Thu gọn' : 'Xem bánh'}</button></td>}</tr>{expanded === row.id && <tr><td colSpan={4}><CategoryProducts bakeryId={bakeryId} row={row} ids={(categoryGroups.get(categoryNameKey(row.name) || row.id) || [row]).map(item => item.id)} editable={editable(row)} busy={busy} onLink={id => mutate(() => vendorManagementService.saveProduct(bakeryId, id, { categoryId: row.id }), false)} />{categoryGroups.get(categoryNameKey(row.name) || row.id)?.slice(1).map(duplicate => <div key={duplicate.id} className="sc-toolbar-actions"><span>Danh mục cùng tên · {duplicate.active ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span><button type="button" className={buttonClass} disabled={!editable(duplicate) || busy} onClick={() => handle(duplicate, 'edit')}>Chỉnh sửa</button></div>)}</td></tr>}</React.Fragment>)}</tbody></DataTable> : <EmptyPanel title={'Chưa có ' + titles[kind].toLowerCase()} />)}</ApiState>
    {kind !== 'add-ons' && total > 0 && <CatalogPagination meta={{ page: currentPage, pageSize, pages, total }} onPage={setPage} />}
  </section>{(adding || editing) && editable(editing) && <CatalogEntityForm key={editing?.id || 'new'} kind={kind} row={editing} kicker={bakeryName ? `${bakeryName} · Chi tiết` : 'Chi tiết'} busy={busy} error={error} image={media[editing?.id]} onUpload={file => mutate(async () => { const result = await vendorCatalogService.uploadAddOn(bakeryId, editing.id, file); setMedia(current => ({ ...current, [editing.id]: result.url })) }, false)} onClose={() => { setAdding(false); setEditing(null) }} nextOrder={Math.max(-1, ...(resource.data || []).map(row => row.displayOrder ?? -1)) + 1} groups={(resource.data || []).map(row => row.category).filter(Boolean)} onSave={save} />}
  {error && !adding && !editing && <ApiErrorMessage error={error} />}{notice && <p role="status">{notice}</p>}</div>
}
