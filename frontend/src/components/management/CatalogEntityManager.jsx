import { useViewportPageSize } from '../../hooks/useViewportPageSize.js'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import { vendorMoney, vendorName } from '../../services/vendorPresentation.js'
import { ModalFormState } from '../common/ModalSurface.jsx'
import { uiLabel, cleanPresentationLabel } from '../../services/uiLabels.js'
import React, { useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadVendorMembership } from '../../services/vendorManagementService.js'
import { loadCatalogEntities, vendorCatalogService } from '../../services/vendorCatalogService.js'
import { canManageEntity } from '../../services/vendorCatalogModels.js'
import { DetailDrawer, StatusBadge, Icon, DataTable, EmptyPanel } from '../common/WorkspaceUI.jsx'
import { VendorActionMenu, VendorImage } from '../common/VendorUi.jsx'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from './ApiState.jsx'
const titles = { categories: 'Danh mục', 'add-ons': 'Phụ kiện bánh', members: 'Chủ tiệm' }
export function CatalogEntityForm({ kind, row, busy, onSave, onClose, error, onUpload, image, kicker }) {
  const [values, setValues] = useState(row || { name: '', slug: '', displayOrder: 0, active: true, description: '', category: '', price: '', stockQuantity: 0 })
  const field = (key) => ({ value: values[key] ?? '', onChange: (event) => setValues((current) => ({ ...current, [key]: event.target.value })) })
  return <DetailDrawer className="sc-vendor-drawer" kicker={kicker} title={(row ? 'Chỉnh sửa ' : 'Thêm ') + titles[kind].toLowerCase()} onClose={onClose} busy={busy} footer={<><button type="button" data-modal-close disabled={busy} className="sc-button sc-action-button--secondary">Hủy</button><button type="submit" form="vendor-entity-form" disabled={busy} className={buttonClass}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button></>}><form id="vendor-entity-form" onSubmit={(event) => { event.preventDefault(); onSave(values) }}><ModalFormState value={values} busy={busy} /><fieldset disabled={busy} className="sc-vendor-form-grid">
    <label>Tên *<input required maxLength={kind === 'categories' ? 120 : 160} {...field('name')} className={inputClass} /></label><label className="flex gap-2"><input type="checkbox" checked={values.active === true} onChange={(event) => setValues((current) => ({ ...current, active: event.target.checked }))} />Đang cung cấp</label>
    {kind === 'categories' ? <details open={!row} className="sm:col-span-2"><summary>Cấu hình nâng cao</summary><div className="sc-vendor-form-grid"><label>Đường dẫn danh mục (slug) *<input required maxLength={140} {...field('slug')} className={inputClass} /></label><label>Thứ tự hiển thị<input required type="number" min="0" step="1" {...field('displayOrder')} className={inputClass} /></label></div></details> : <><label>Nhóm phụ kiện *<input required maxLength={80} {...field('category')} className={inputClass} /></label><label>Giá (đ) *<input required type="number" min="0" step="0.01" {...field('price')} className={inputClass} /></label><label>Tồn kho có thể bán *<input required type="number" min="0" max="2147483647" step="1" {...field('stockQuantity')} className={inputClass} /><span className="block text-sm">Đặt đơn tự trừ; hủy đơn tự hoàn. Nhập số còn có thể bán.</span></label><label className="sm:col-span-2">Mô tả<textarea {...field('description')} rows={3} className={inputClass} /></label></>}
  </fieldset></form>{kind === 'add-ons' && <section className="sc-vendor-editor-section"><h3>Hình ảnh phụ kiện</h3><VendorImage src={image || row?.imageUrl} alt={vendorName(row?.name)} />{row ? <label>Thay ảnh PNG/JPEG/WebP, tối đa 5 MiB<input type="file" disabled={busy} accept="image/png,image/jpeg,image/webp" className={inputClass} onChange={event => { const file = event.target.files[0]; event.target.value = ''; if (file) onUpload(file) }} /></label> : <p>Lưu phụ kiện trước khi tải ảnh.</p>}</section>}{error && <ApiErrorMessage error={error} />}</DetailDrawer>
}
export default function CatalogEntityManager({ bakeryId, kind, bakeryName }) {
  const { user, roles } = useAuth()
  const resource = useCatalogResource(loadCatalogEntities, { bakeryId, kind })
  const membership = useCatalogResource(loadVendorMembership, { bakeryId, userId: user.id })
  const [editing, setEditing] = useState(null), [adding, setAdding] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(''), [media, setMedia] = useState({})
  const [page, setPage] = useState(1)
  const { containerRef, pageSize } = useViewportPageSize(() => setPage(1), kind !== 'add-ons')
  const total = resource.data?.length || 0, pages = Math.ceil(total / pageSize)
  const currentPage = Math.min(page, Math.max(1, pages))
  const pagedEntries = resource.data?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || []
  const inFlight = useRef(false)
  const editable = (row) => membership.status === 'ready' && canManageEntity(membership.data, roles, kind, row, kind === 'members' ? resource.data || [] : [])
  async function mutate(action, close = true) {
    if (busy || inFlight.current || !editable()) return false
    inFlight.current = true; setBusy(true); setError(null); setNotice('')
    try { await action(); if (close) { setEditing(null); setAdding(false) } setNotice('Đã lưu thay đổi.'); resource.reload(); membership.reload(); return true }
    catch (failure) { setError(failure); if (![400, 422].includes(failure.status)) { resource.reload(); membership.reload() } return false }
    finally { inFlight.current = false; setBusy(false) }
  }
  const actions = row => kind === 'members' ? [] : [
    { key: 'edit', direct: true, label: 'Chỉnh sửa', icon: 'edit', disabled: !editable(row) },
    ...(kind === 'add-ons' ? [{ key: 'stop', label: 'Ngừng bán', icon: 'block', disabled: true, disabledReason: 'Chức năng ngừng bán riêng cho phụ kiện chưa được hỗ trợ.' }] : []),
    ...(kind === 'add-ons' ? [{ key: 'toggle', label: row.active ? 'Tạm ẩn' : 'Hiển thị lại', icon: row.active ? 'pause_circle' : 'storefront', disabled: !editable(row), description: row.active ? 'Ngừng nhận đặt mới phụ kiện này. Thông tin các đơn đã đặt được giữ nguyên.' : 'Cho phép khách chọn phụ kiện này trong đơn mới.' }] : [{ key: 'delete', label: 'Xóa danh mục', icon: 'delete', tone: 'danger', disabled: !editable(row), description: 'Danh mục sẽ được xóa và gỡ khỏi sản phẩm liên quan. Sản phẩm không bị xóa.' }]),
  ]
  const handle = (row, key) => { if (key === 'edit') { setEditing(row); setAdding(false); setError(null); return } return mutate(() => key === 'toggle' ? vendorCatalogService.save(bakeryId, kind, row.id, { ...row, active: !row.active }) : vendorCatalogService.remove(bakeryId, kind, row.id)) }
  return <div ref={containerRef} className="space-y-4"><section className={panelClass}><div className="sc-toolbar-actions"><h2>{titles[kind]}</h2>{kind !== 'members' && <button disabled={busy || !editable()} className={buttonClass} onClick={() => { setAdding(true); setEditing(null); setError(null) }}><Icon name="add" />Thêm {titles[kind].toLowerCase()}</button>}</div>
    {membership.error && !resource.error && <ApiErrorMessage error={membership.error} retry={membership.reload} />}
    <ApiState resource={resource}>{resource.data && (resource.data.length ? kind === 'add-ons' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{resource.data.map(row => <article key={row.id} className="sc-panel sc-vendor-product-card"><VendorImage src={media[row.id] || row.imageUrl} alt={vendorName(row.name)} /><div className="sc-vendor-product-body"><StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} /><h3>{vendorName(row.name)}</h3><strong>{Number(row.price) === 0 ? 'Miễn phí' : vendorMoney(row.price)}</strong><p>{vendorName(row.category)}</p><p>{row.stockQuantity == null ? 'Chưa nhập tồn kho' : row.stockQuantity === 0 ? 'Hết hàng' : 'Còn ' + row.stockQuantity + ' cái'}</p><div className="sc-vendor-card-actions"><button type="button" className={buttonClass} disabled={busy || !editable(row)} onClick={() => handle(row, 'edit')}>Chỉnh sửa</button><VendorActionMenu inline error={error && <ApiErrorMessage error={error} />} actions={actions(row).filter(action => action.key !== 'edit')} busy={busy} onConfirm={key => handle(row, key)} /></div></div></article>)}</div> : <DataTable label={titles[kind]}><thead><tr><th style={{ width: '60px', textAlign: 'center' }}>STT</th><th>{kind === 'members' ? 'Họ tên' : 'Tên danh mục'}</th>{kind === 'members' && <th>Vai trò</th>}<th>Trạng thái</th>{kind !== 'members' && <th className="sc-table-actions">Thao tác</th>}</tr></thead><tbody>{pagedEntries.map((row, index) => <tr key={row.id}><td data-label="STT" style={{ width: '60px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-muted, #64748b)' }}>{(currentPage - 1) * pageSize + index + 1}</td><td>{vendorName(cleanPresentationLabel(kind === 'members' ? row.displayNameSnapshot : row.name, kind === 'members' ? 'Chưa cập nhật tên' : 'Chưa cập nhật'))}</td>{kind === 'members' && <td>{uiLabel(row.memberRole)}</td>}<td><StatusBadge status={kind === 'members' ? row.status : row.active ? 'ACTIVE' : 'INACTIVE'} /></td>{kind !== 'members' && <td className="sc-table-actions"><VendorActionMenu inline={kind === 'categories'} error={error && <ApiErrorMessage error={error} />} actions={actions(row)} busy={busy} onConfirm={key => handle(row, key)} /></td>}</tr>)}</tbody></DataTable> : <EmptyPanel title={'Chưa có ' + titles[kind].toLowerCase()} />)}</ApiState>
    {kind !== 'add-ons' && total > 0 && <CatalogPagination meta={{ page: currentPage, pageSize, pages, total }} onPage={setPage} />}
  </section>{(adding || editing) && editable(editing) && <CatalogEntityForm key={editing?.id || 'new'} kind={kind} row={editing} kicker={bakeryName ? `${bakeryName} · Chi tiết` : 'Chi tiết'} busy={busy} error={error} image={media[editing?.id]} onUpload={file => mutate(async () => { const result = await vendorCatalogService.uploadAddOn(bakeryId, editing.id, file); setMedia(current => ({ ...current, [editing.id]: result.url })) }, false)} onClose={() => { setAdding(false); setEditing(null) }} onSave={input => mutate(() => vendorCatalogService.save(bakeryId, kind, editing?.id, input))} />}
  {error && !adding && !editing && <ApiErrorMessage error={error} />}{notice && <p role="status">{notice}</p>}</div>
}
