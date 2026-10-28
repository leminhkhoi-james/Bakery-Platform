import { displayReference } from '../../services/displayReference.js'
import RefreshButton from '../common/RefreshButton.jsx'
import EntityActionButtons from '../common/EntityActionButtons.jsx'
import { uiLabel } from '../../services/uiLabels.js'
import React, { useState } from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { useAuth } from '../../context/useAuth.js'
import { loadManagedProducts, loadManagedCategories, loadVendorMembership, vendorManagementService } from '../../services/vendorManagementService.js'
import { memberCanEdit, productActions } from '../../services/managementModels.js'
import { formatCatalogPrice } from '../../services/catalogModels.js'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from './ApiState.jsx'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import ProductAssets from './ProductAssets.jsx'
import { DetailDrawer, EmptyPanel, Icon, StatusBadge } from '../common/WorkspaceUI.jsx'

const productActionLabel = { publish: 'Kích hoạt bán', hide: 'Ẩn sản phẩm', archive: 'Lưu trữ' }
const productActionItems = (product, canEdit) => productActions(product.status).map((action) => ({ key: action, label: productActionLabel[action],
  icon: { publish: 'storefront', hide: 'visibility_off', archive: 'archive' }[action], tone: { publish: 'primary', hide: 'warning', archive: 'danger' }[action],
  disabled: !canEdit, disabledReason: 'Cần quyền chủ tiệm.',
  description: { publish: 'Mẫu bánh sẽ hiển thị để khách đặt hàng khi đủ điều kiện mở bán.', hide: 'Mẫu bánh tạm ngừng hiển thị để đặt mới. Các đơn đã đặt vẫn được giữ.', archive: 'Lưu trữ mẫu bánh này. Các đơn đã đặt vẫn giữ nguyên thông tin.' }[action],
}))

export function CategoryForm({ busy, onSave }) {
  const [name, setName] = useState(''), [slug, setSlug] = useState(''), [displayOrder, setOrder] = useState('0'), [active, setActive] = useState(true)
  return <form className={panelClass} onSubmit={(event) => { event.preventDefault(); onSave({ name, slug, displayOrder, active }) }}><h3 className="font-bold">Tạo danh mục của tiệm</h3><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2"><label>Tên danh mục<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label><label>Slug danh mục<input required maxLength={140} value={slug} onChange={(event) => setSlug(event.target.value)} className={inputClass} /></label><label>Thứ tự hiển thị<input required type="number" min="0" step="1" value={displayOrder} onChange={(event) => setOrder(event.target.value)} className={inputClass} /></label><label className="flex items-center gap-2"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />Đang hoạt động</label><button className={buttonClass}>Lưu danh mục</button></fieldset><p className="text-sm">Sau khi lưu, bạn có thể chọn danh mục này khi thêm hoặc sửa sản phẩm.</p></form>
}

export function ProductForm({ product, categories = [], busy, onSave, onClose }) {
  const [values, setValues] = useState(product || { name: '', slug: '', description: '', basePrice: '', customizable: false, defaultServingSize: '', minimumNoticeHours: '', categoryId: '' })
  const field = (key) => ({ value: values[key] ?? '', onChange: (event) => setValues((current) => ({ ...current, [key]: event.target.value })) })
  return <form onSubmit={(event) => { event.preventDefault(); onSave(values) }} className={panelClass}><h3 className="sr-only">{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
    <label>Tên sản phẩm<input required maxLength={180} {...field('name')} className={inputClass} /></label><label>Slug<input required maxLength={200} {...field('slug')} className={inputClass} /></label>
    <label>Giá cơ bản (VND)<input required type="number" min="0" step="0.01" {...field('basePrice')} className={inputClass} /></label><label>Danh mục<select {...field('categoryId')} className={inputClass}><option value="">{product?.categoryId ? 'Giữ danh mục hiện tại' : 'Không chọn danh mục'}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name || displayReference(category.id, 'CAT')}{category.active === false ? ' (không hoạt động)' : ''}</option>)}</select></label>
    <label>Số người dùng mặc định<input type="number" min="1" step="1" {...field('defaultServingSize')} className={inputClass} /></label><label>Thời gian chuẩn bị tối thiểu (giờ)<input type="number" min="0" step="1" {...field('minimumNoticeHours')} className={inputClass} /></label><label className="sm:col-span-2">Mô tả<textarea {...field('description')} className={inputClass} /></label><label className="flex items-center gap-2"><input type="checkbox" checked={values.customizable === true} onChange={(event) => setValues((current) => ({ ...current, customizable: event.target.checked }))} />Cho phép tùy chỉnh</label>
  </fieldset><p className="text-sm">Sản phẩm mới được lưu thành bản nháp. Để mở bán, cần ảnh chính, tiệm đang hoạt động và gói dịch vụ còn hiệu lực.</p><div className="flex flex-wrap gap-3"><button disabled={busy} className={buttonClass}>{busy ? 'Đang lưu…' : 'Lưu sản phẩm'}</button><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border px-4 py-2">Đóng</button></div></form>
}

export default function ProductManager({ bakeryId }) {
  const { user, roles } = useAuth()
  const membership = useCatalogResource(loadVendorMembership, { bakeryId, userId: user.id })
  const [page, setPage] = useState(1), [query, setQuery] = useState(''), [status, setStatus] = useState(''), [sort, setSort] = useState('createdAt,desc'), [categoryId, setCategory] = useState('')
  const products = useCatalogResource(loadManagedProducts, { bakeryId, page, size: 12, query, status, sort, categoryId })
  const categories = useCatalogResource(loadManagedCategories, { bakeryId })
  const [editing, setEditing] = useState(null), [adding, setAdding] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(''), [snapshots, setSnapshots] = useState({})
  const canEdit = membership.status === 'ready' && memberCanEdit(membership.data, roles)
  async function mutate(action, keepEditor = false) {
    if (busy || !canEdit) return false
    setBusy(true); setError(null); setNotice('')
    try { const saved = await action(); if (keepEditor && adding) setSnapshots((current) => ({ ...current, [saved.id]: { options: { groups: [] }, images: [] } })); setAdding(false); setEditing(keepEditor ? saved : null); setNotice('Đã lưu thay đổi sản phẩm.'); products.reload(); return true }
    catch (failure) { setError(failure); products.reload(); return false }
    finally { setBusy(false) }
  }
  const changeFilter = (setter) => (event) => { setter(event.target.value); setPage(1) }
  return <div className="space-y-5">
    {canEdit && <details className={panelClass}><summary className="cursor-pointer font-bold">Thêm danh mục sản phẩm</summary><CategoryForm key={bakeryId} busy={busy} onSave={async (input) => {
      if (busy || !canEdit) return
      setBusy(true); setError(null); setNotice('')
      try { await vendorManagementService.createCategory(bakeryId, input); categories.reload(); setNotice('Đã tạo danh mục. Có thể chọn danh mục khi thêm hoặc sửa sản phẩm.') }
      catch (failure) { setError(failure) } finally { setBusy(false) }
    }} /></details>}
    <section className={panelClass}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold text-primary">Mẫu bánh của cửa hàng</h2><button disabled={!canEdit || busy || products.status !== 'ready'} onClick={() => { setAdding(true); setEditing(null); setError(null) }} className={buttonClass}>Thêm sản phẩm</button></div>
      {membership.status === 'loading' ? <p>Đang xác minh quyền quản lý…</p> : membership.error ? <><p className="text-sm">Chưa xác minh được quyền chủ tiệm. Các thao tác thay đổi đang được khóa.</p><ApiErrorMessage error={membership.error} retry={membership.reload} /></> : <p className="text-sm">Vai trò tại cửa hàng: {uiLabel(membership.data?.memberRole, 'Chưa có quyền quản lý')}. Quyền thao tác được xác minh theo tiệm đang quản lý.</p>}
      <div className="sc-toolbar grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label>Tìm sản phẩm<input value={query} onChange={changeFilter(setQuery)} className={inputClass} /></label><label>Trạng thái<select value={status} onChange={changeFilter(setStatus)} className={inputClass}><option value="">Tất cả</option>{['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED'].map((value) => <option key={value} value={value}>{uiLabel(value)}</option>)}</select></label><label>Danh mục<select value={categoryId} onChange={changeFilter(setCategory)} className={inputClass}><option value="">Tất cả</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name || displayReference(category.id, 'CAT')}</option>)}</select></label><label>Sắp xếp<select value={sort} onChange={changeFilter(setSort)} className={inputClass}><option value="createdAt,desc">Mới nhất</option><option value="name,asc">Tên A–Z</option><option value="basePrice,asc">Giá tăng dần</option><option value="basePrice,desc">Giá giảm dần</option></select></label></div>
      {categories.error && <ApiErrorMessage error={categories.error} retry={categories.reload} />}<RefreshButton disabled={busy} onClick={products.reload} className="underline">Tải lại sản phẩm</RefreshButton>
      <ApiState resource={products}>{products.data && <>{products.data.result.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.data.result.map((product) => <article key={product.id} className="sc-product-card"><div className="sc-product-card-heading"><span className="flex items-center gap-2 text-sm text-secondary"><Icon name="cake" /> Mẫu bánh</span><StatusBadge status={product.status} /></div><div className="sc-product-card-body"><h3 className="font-serif text-lg font-semibold text-primary">{product.name || 'Chưa có tên'}</h3><p className="text-lg font-bold text-primary">{formatCatalogPrice(product.basePrice)}</p><p className="line-clamp-2 text-xs text-on-surface-variant">{product.description || 'Chưa có mô tả.'}</p><details className="text-xs text-on-surface-variant"><summary className="cursor-pointer">Mã sản phẩm</summary><p className="mt-2 break-all">{displayReference(product.id, 'PRD')}</p></details><div className="flex flex-wrap gap-2"><button disabled={!canEdit || busy} onClick={() => { setEditing(product); setAdding(false); setError(null) }} className={buttonClass}>Sửa / thêm ảnh</button></div><EntityActionButtons status={product.status} actions={productActionItems(product, canEdit)} busy={busy} refreshing={products.refreshing} onConfirm={(action) => mutate(() => vendorManagementService.changeProduct(bakeryId, product, action))} /></div></article>)}</div> : <EmptyPanel title="Chưa có sản phẩm phù hợp." description="Thêm sản phẩm mới hoặc thay đổi bộ lọc để bắt đầu." icon="cake" />}<CatalogPagination meta={products.data.meta} onPage={setPage} /></>}</ApiState>
    </section>
    {canEdit && (adding || editing) && <DetailDrawer title={editing ? 'Chỉnh sửa mẫu bánh' : 'Thêm mẫu bánh'} busy={busy} onClose={() => { setAdding(false); setEditing(null) }}><ProductForm key={editing?.id || 'new'} product={editing} categories={categories.data || []} busy={busy} onClose={() => { setAdding(false); setEditing(null) }} onSave={(values) => mutate(() => vendorManagementService.saveProduct(bakeryId, editing?.id, values), true)} />
    {editing && <section className={panelClass}><p className="break-all text-sm">{editing.name} · {displayReference(editing.id, 'PRD')} · {uiLabel(editing.status)}</p><EntityActionButtons status={editing.status} actions={productActionItems(editing, canEdit)} busy={busy} refreshing={products.refreshing} onConfirm={(action) => mutate(() => vendorManagementService.changeProduct(bakeryId, editing, action))} /><ProductAssets key={editing.id} bakeryId={bakeryId} product={editing} initialSnapshot={snapshots[editing.id]} onSnapshot={(snapshot) => setSnapshots((current) => ({ ...current, [editing.id]: snapshot }))} onChanged={products.reload} onBusy={setBusy} /></section>}{error && <ApiErrorMessage error={error} />}{notice && <p role="status" className="sc-feedback">{notice}</p>}</DetailDrawer>}
    {!(canEdit && (adding || editing)) && <>{error && <ApiErrorMessage error={error} />}{notice && <p role="status">{notice}</p>}</>}
  </div>
}
