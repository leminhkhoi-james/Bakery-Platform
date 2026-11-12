import MoneyInput from '../common/MoneyInput.jsx'
import { recordSource, unifiedEnabled } from '../../services/unifiedDataService.js'
import { vendorMoney, vendorName } from '../../services/vendorPresentation.js'
import { ModalFormState } from '../common/ModalSurface.jsx'
import { displayReference } from '../../services/displayReference.js'
import EntityActionButtons from '../common/EntityActionButtons.jsx'
import { VendorImage, VendorConfirm } from '../common/VendorUi.jsx'
import { loadProductSnapshot } from '../../services/vendorCatalogService.js'
import { categoryTagLabel, categoryNameKey, groupProductCategories } from '../../services/vendorCatalogModels.js'
import { readDashboardPages } from '../../services/adminDashboardService.js'
import React, { useRef, useState } from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { useAuth } from '../../context/useAuth.js'
import { loadOwnerBakery } from '../../services/vendorDashboardService.js'
import { loadManagedProducts, loadManagedCategories, loadVendorMembership, vendorManagementService } from '../../services/vendorManagementService.js'
import { memberCanEdit, productActions } from '../../services/managementModels.js'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from './ApiState.jsx'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import ProductAssets from './ProductAssets.jsx'
import { DetailDrawer, EmptyPanel, Icon, StatusBadge } from '../common/WorkspaceUI.jsx'

const productStatusLabel = { DRAFT: 'Bản nháp', PUBLISHED: 'Đang bán', HIDDEN: 'Tạm ẩn', ARCHIVED: 'Đã lưu trữ' }
const productActionLabel = { publish: 'Mở bán trên cửa hàng', hide: 'Tạm ẩn sản phẩm', archive: 'Lưu trữ sản phẩm' }
const productActionItems = (product, canEdit) => productActions(product.status).map((action) => ({ key: action, label: action === 'publish' && product.status === 'HIDDEN' ? 'Mở bán lại' : productActionLabel[action],
  icon: { publish: 'storefront', hide: 'visibility_off', archive: 'archive' }[action], tone: { publish: 'primary', hide: 'warning', archive: 'danger' }[action],
  disabled: !canEdit, disabledReason: 'Cần quyền chủ tiệm.',
  description: { publish: 'Mẫu bánh sẽ hiển thị trên cửa hàng để khách hàng có thể tìm thấy và đặt mua khi tiệm đang mở cửa.', hide: 'Tạm ngừng hiển thị mẫu bánh này trên cửa hàng. Các đơn đã đặt trước đó vẫn được giữ nguyên.', archive: 'Mẫu bánh đã lưu trữ sẽ ngừng bán. Để bán lại, hãy tạo bản nháp mới từ mẫu này.' }[action],
}))

async function loadProductList({ categoryIds, page, size, ...params }, options) {
  if (categoryIds.length <= 1) {
    return loadManagedProducts({ ...params, page, size, categoryId: categoryIds[0] }, options)
  }
  const { rows } = await readDashboardPages(
    (pagination, request) => loadManagedProducts({ ...pagination, ...params }, request), options,
  )
  const ids = new Set(categoryIds)
  const matches = rows.filter(product => ids.has(product.categoryId))
  const pages = Math.ceil(matches.length / size)
  const currentPage = Math.min(page, Math.max(1, pages))
  return {
    result: matches.slice((currentPage - 1) * size, currentPage * size),
    meta: { page: currentPage, pageSize: size, pages, total: matches.length },
  }
}

export function ProductForm({ product, draft, categories = [], busy, onSave, onClose, footerExternal = false }) {
  const [values, setValues] = useState(product || draft || { name: '', slug: '', description: '', basePrice: '', customizable: false, defaultServingSize: '', minimumNoticeHours: '', categoryId: '' })
  const categoryOptions = [...groupProductCategories(categories).values()].map(group =>
    group.find(category => category.id === values.categoryId) || group[0],
  )
  const field = (key) => ({ 'aria-label': ({ name: 'Tên mẫu bánh', categoryId: 'Danh mục sản phẩm', description: 'Mô tả sản phẩm', basePrice: 'Giá bán cơ bản', defaultServingSize: 'Khẩu phần mặc định', minimumNoticeHours: 'Thời gian đặt trước' })[key] || key, value: values[key] ?? '', onChange: (event) => setValues((current) => ({ ...current, [key]: event.target.value })) })

  return (
    <form
      id={footerExternal ? "vendor-product-form" : undefined}
      onSubmit={(event) => {
        event.preventDefault()
        const slug = values.slug || (values.name ? values.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '')
        onSave({ ...values, slug })
      }}
      className="space-y-5"
    >
      <ModalFormState value={values} busy={busy} />
      <input type="hidden" {...field('slug')} />

      <section className="sc-popup-group space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100/80 flex items-center justify-center text-rose-700">
              <Icon name="cake" className="text-base" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Thông tin cơ bản</h3>
            </div>
          </div>
        </div>

        <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tên sản phẩm */}
          <div className="sm:col-span-1">
            <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Tên sản phẩm <span className="text-rose-600">*</span></span>
              <span className="text-[11px] font-normal text-slate-400">Tối đa 180 ký tự</span>
            </label>
            <input
              required
              maxLength={180}
              placeholder="Ví dụ: Bánh Mousse Bơ Sữa Dừa..."
              {...field('name')}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 bg-white text-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Giá cơ bản */}
          <div className="sm:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Giá cơ bản (VND) <span className="text-rose-600">*</span>
              </label>
              <span className="text-xs font-bold tabular-nums text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-md">
                {vendorMoney(values.basePrice || 0)}
              </span>
            </div>
            <MoneyInput
              required
              min="0"
              step="0.01"
              placeholder="0"
              {...field('basePrice')}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 bg-white text-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Danh mục */}
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Danh mục
            </label>
            <div className="relative">
              <select
                {...field('categoryId')}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 bg-white text-slate-900 transition-all appearance-none cursor-pointer pr-10"
              >
                <option value="">{product?.categoryId ? 'Giữ danh mục hiện tại' : 'Không chọn danh mục'}</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name || displayReference(category.id, 'CAT')}
                    {category.active === false ? ' (không hoạt động)' : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <Icon name="expand_more" className="text-lg" />
              </div>
            </div>
          </div>

          {/* Số người dùng mặc định */}
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Số người dùng mặc định
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Ví dụ: 4 - 6 người"
              {...field('defaultServingSize')}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 bg-white text-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Thời gian chuẩn bị tối thiểu */}
          <div className="sm:col-span-2">
            <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Thời gian chuẩn bị tối thiểu (giờ)</span>
              <span className="text-[11px] font-normal text-slate-400">Khoảng thời gian cần báo trước để tiệm kịp làm bánh</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="24"
              {...field('minimumNoticeHours')}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 bg-white text-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Mô tả */}
          <div className="sm:col-span-2">
            <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Mô tả</span>
              <span className="text-[11px] font-normal text-slate-400">Hương vị, phong cách, nguyên liệu...</span>
            </label>
            <textarea
              rows={3}
              placeholder="Mô tả chi tiết chiếc bánh để thu hút khách hàng..."
              {...field('description')}
              className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 bg-white text-slate-900 transition-all placeholder:text-slate-400 resize-y min-h-[96px]"
            />
          </div>

          {/* Cho phép tùy chỉnh */}
          <div className="sm:col-span-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50/70 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={values.customizable === true}
                  onChange={(event) => setValues((current) => ({ ...current, customizable: event.target.checked }))}
                  className="w-4 h-4 rounded text-rose-700 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-rose-950 transition-colors">Cho phép tùy chỉnh</span>
                  <p className="text-xs text-slate-500">Khách có thể yêu cầu đổi màu kem, chữ viết trên bánh hoặc phụ kiện</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${values.customizable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {values.customizable ? 'Đang bật' : 'Tắt'}
              </span>
            </label>
          </div>
        </fieldset>
      </section>

      {/* Card 3: Action buttons khi footerExternal = false */}
      {!footerExternal && (
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={busy}
            data-modal-close
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            disabled={busy}
            className="sc-button px-5 py-2.5 rounded-xl bg-rose-700 text-white text-sm font-semibold hover:bg-rose-800 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            {busy ? 'Đang lưu…' : 'Lưu sản phẩm'}
          </button>
        </div>
      )}
    </form>
  )
}

function ProductThumbnail({ bakeryId, product, snapshot }) {
  if (snapshot || product.status !== 'PUBLISHED') {
    const images = snapshot?.images || [], image = images.find(item => item.primary) || images[0]
    return <VendorImage src={image?.url} alt={vendorName(product.name)} />
  }
  return <PublishedProductThumbnail bakeryId={bakeryId} product={product} />
}
function PublishedProductThumbnail({ bakeryId, product }) {
  const resource = useCatalogResource(loadProductSnapshot, { bakeryId, productId: product.id })
  const imageRetried = useRef(false)
  const images = resource.data?.images || [], image = images.find(item => item.primary) || images[0]
  return <><VendorImage src={image?.url} alt={vendorName(product.name)} onLoadError={() => { if (!imageRetried.current) { imageRetried.current = true; resource.reload() } }} />{resource.error && resource.error.status !== 404 && <p className="text-xs px-3" role="alert">Chưa tải được hình ảnh.</p>}</>
}

export default function ProductManager({ bakeryId, navigation, bakeryName: initialBakeryName }) {
  const { user, roles } = useAuth()
  const bakeryInfo = useCatalogResource(loadOwnerBakery, { bakeryId, userId: user?.id })
  const bakeryName = initialBakeryName || bakeryInfo.data?.name || ''
  const membership = useCatalogResource(loadVendorMembership, { bakeryId, userId: user.id })
  const [page, setPage] = useState(1), [query, setQuery] = useState(''), [status, setStatus] = useState(''), [categoryId, setCategory] = useState('')
  const categories = useCatalogResource(loadManagedCategories, { bakeryId })
  const categoriesById = new Map((categories.data || []).map(category => [category.id, category]))
  const categoryGroups = groupProductCategories(categories.data || [])
  const categoryIds = (categoryGroups.get(categoryId) || []).map(category => category.id)
  const products = useCatalogResource(loadProductList, { bakeryId, page, size: 12, query, status, sort: 'createdAt,desc', categoryIds })
  const [editing, setEditing] = useState(null), [adding, setAdding] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(''), [snapshots, setSnapshots] = useState({})
  const [draft, setDraft] = useState(null)
  const [editorRevision, setEditorRevision] = useState(0), [pendingAction, setPendingAction] = useState(null)
  const inFlight = useRef(false)
  const canEdit = membership.status === 'ready' && memberCanEdit(membership.data, roles)
  function openCreate(source) {
    const category = categoriesById.get(source?.categoryId)
    setDraft(source ? {
      name: source.name,
      slug: (source.slug || 'mau-banh').slice(0, 190) + '-' + crypto.randomUUID().slice(0, 8),
      description: source.description,
      basePrice: source.basePrice,
      defaultServingSize: source.defaultServingSize,
      minimumNoticeHours: source.minimumNoticeHours,
      categoryId: category?.active ? category.id : '',
      customizable: source.customizable ?? false,
    } : null)
    setAdding(true)
    setEditing(null)
    setError(null)
    setNotice('')
  }
  async function mutate(action, keepEditor = false) {
    if (busy || inFlight.current || !canEdit) return false
    inFlight.current = true
    setBusy(true); setError(null); setNotice('')
    try { const saved = await action(); if (keepEditor && adding) setSnapshots((current) => ({ ...current, [saved.id]: { options: { groups: [] }, images: [] } })); setAdding(false); setEditing(keepEditor ? saved : null); if (keepEditor) setEditorRevision((value) => value + 1); setNotice('Đã lưu thay đổi sản phẩm.'); products.reload(); return true }
    catch (failure) { setError(failure); products.reload(); return false }
    finally { inFlight.current = false; setBusy(false) }
  }
  const changeFilter = (setter) => (event) => { setter(event.target.value); setPage(1) }
  return <div className="space-y-5">
    <section className={panelClass + ' sc-vendor-menu-panel'}>
      {membership.status === 'loading' ? <p>Đang xác minh quyền quản lý…</p> : membership.error ? <><p className="text-sm">Chưa xác minh được quyền chủ tiệm. Các thao tác thay đổi đang được khóa.</p><ApiErrorMessage error={membership.error} retry={membership.reload} /></> : null}
      <div className="sc-vendor-menu-filterbar">{navigation}<div className="sc-toolbar sc-vendor-product-filters"><label>Tìm sản phẩm<input value={query} onChange={changeFilter(setQuery)} className={inputClass} /></label><label>Trạng thái<select value={status} onChange={changeFilter(setStatus)} className={inputClass}><option value="">Tất cả</option>{Object.entries(productStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Danh mục<select value={categoryId} onChange={changeFilter(setCategory)} className={inputClass}><option value="">Tất cả</option>{[...categoryGroups].map(([key, [category]]) => <option key={key} value={key}>{category.name || displayReference(category.id, 'CAT')}</option>)}</select></label></div>
        <button disabled={!canEdit || busy || products.status !== 'ready'} onClick={() => openCreate()} className={buttonClass + ' ml-auto shrink-0'}>Thêm sản phẩm</button>
      </div>
      {categories.error && <ApiErrorMessage error={categories.error} retry={categories.reload} />}
      <ApiState resource={products}>{products.data && <>{products.data.result.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.data.result.map((product) => <article key={product.id} className="sc-panel sc-vendor-product-card">{categoriesById.get(product.categoryId)?.name && <span className="sc-product-category-tag">{categoryTagLabel(categoryGroups.get(categoryNameKey(categoriesById.get(product.categoryId).name))?.[0]?.name || categoriesById.get(product.categoryId).name)}</span>}<ProductThumbnail bakeryId={bakeryId} product={product} snapshot={snapshots[product.id]} /><div className="sc-vendor-product-body"><div><StatusBadge status={product.status} label={productStatusLabel[product.status]} /></div><h3>{vendorName(product.name, 'Chưa có tên')}</h3><p className="text-lg font-bold text-primary">{vendorMoney(product.basePrice)}</p><p className="line-clamp-2 text-xs text-on-surface-variant">{vendorName(product.description, 'Chưa có mô tả')}</p><div className="sc-vendor-card-actions">
                    <button type="button" disabled={!canEdit || busy} onClick={() => { setEditing(product); setAdding(false); setError(null) }} className={buttonClass}>Chỉnh sửa</button>
                    {product.status === 'ARCHIVED' && <button type="button" disabled={!canEdit || busy || categories.status !== 'ready'} className="sc-button sc-action-button--secondary" onClick={() => openCreate(product)}>Tạo bản nháp để bán lại</button>}
                    {productActionItems(product, canEdit).map((action) => (
                      <button
                        key={action.key}
                        type="button"
                        disabled={busy || action.disabled}
                        title={action.description}
                        onClick={() => setPendingAction({ product, action })}
                        className={`sc-button text-xs ${action.tone === 'danger' ? 'sc-action-button--danger' : 'sc-action-button--secondary'}`}
                      >
                        <Icon name={action.icon} />
                        <span>{action.key === 'publish' ? product.status === 'HIDDEN' ? 'Mở bán lại' : 'Mở bán' : action.key === 'hide' ? 'Tạm ẩn' : 'Lưu trữ'}</span>
                      </button>
                    ))}

                  </div></div></article>)}</div> : <EmptyPanel title="Chưa có sản phẩm phù hợp." description="Thêm sản phẩm mới hoặc thay đổi bộ lọc để bắt đầu." icon="cake" />}<CatalogPagination meta={products.data.meta} onPage={setPage} /></>}</ApiState>
    </section>
    {canEdit && (adding || editing) && (
      <DetailDrawer
        className="sc-vendor-drawer"
        kicker={bakeryName ? `${bakeryName} · Chi tiết` : 'Chi tiết'}
        footer={
          <div className="flex items-center justify-between w-full">

            <div className="flex items-center gap-3 ml-auto">
              <button type="button" data-modal-close className="sc-button sc-action-button--secondary" disabled={busy}>
                Đóng
              </button>
              <button form="vendor-product-form" type="submit" className="sc-button" disabled={busy}>
                {busy ? 'Đang lưu…' : 'Lưu sản phẩm'}
              </button>
            </div>
          </div>
        }
        title={editing ? 'Chỉnh sửa mẫu bánh' : 'Thêm mẫu bánh'}
        busy={busy}
        onClose={() => { setAdding(false); setEditing(null) }}
      >
        {editing && (
          <>
            <section className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 mt-2 mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái:</span>
                <StatusBadge status={editing.status} label={productStatusLabel[editing.status]} />
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">({vendorName(editing.name)})</span>
              </div>
              <EntityActionButtons
                showHeading={false}
                status={editing.status}
                actions={productActionItems(editing, canEdit)}
                busy={busy}
                refreshing={products.refreshing}
                onConfirm={(action) => mutate(() => vendorManagementService.changeProduct(bakeryId, editing, action))}
              />
            </section>


          </>
        )}

        {adding && draft && <p className="sc-feedback">Mẫu cũ vẫn được lưu trữ. Thêm ảnh và kiểm tra tùy chọn của bản nháp mới trước khi mở bán.</p>}
        <div className="sc-vendor-product-editor">
          <ProductForm
            footerExternal
            key={(editing?.id || 'new') + ':' + editorRevision}
            product={editing}
            draft={adding ? draft : null}
            categories={(categories.data || []).filter(category => !unifiedEnabled() || recordSource(category) === recordSource(editing || { id: bakeryId }))}
            busy={busy}
            onClose={() => { setAdding(false); setEditing(null) }}
            onSave={(values) => mutate(() => vendorManagementService.saveProduct(bakeryId, editing?.id, values), true)}
          />
          {editing && (
            <ProductAssets
              key={editing.id}
              bakeryId={bakeryId}
              product={editing}
              initialSnapshot={snapshots[editing.id]}
              onSnapshot={(snapshot) => setSnapshots((current) => ({ ...current, [editing.id]: snapshot }))}
              onChanged={products.reload}
              onBusy={setBusy}
            />
          )}
        </div>

        {error && <ApiErrorMessage error={error} />}
        {notice && <p role="status" className="sc-feedback">{notice}</p>}
      </DetailDrawer>
    )}
    {!(canEdit && (adding || editing)) && <>{error && <ApiErrorMessage error={error} />}{notice && <p role="status">{notice}</p>}</>}
    {pendingAction && (
      <VendorConfirm
        title={pendingAction.action.label}
        label={pendingAction.action.label}
        danger={pendingAction.action.tone === 'danger'}
        busy={busy}
        error={error && <ApiErrorMessage error={error} />}
        onClose={() => setPendingAction(null)}
        onConfirm={async () => {
          const ok = await mutate(() => vendorManagementService.changeProduct(bakeryId, pendingAction.product, pendingAction.action.key))
          if (ok !== false) setPendingAction(null)
        }}
      >
        <p>{pendingAction.action.description || 'Xác nhận thực hiện thao tác với mục đã chọn?'}</p>
      </VendorConfirm>
    )}
  </div>
}
