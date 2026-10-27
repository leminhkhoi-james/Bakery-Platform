import { useEffect, useState } from 'react'
import { loadProducts } from '../../../services/cakeService.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import CatalogState from '../../../components/catalog/CatalogState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import ProductCard from '../../../components/catalog/ProductCard.jsx'

function initialFilters(search) {
  const params = new URLSearchParams(search)
  let categorySearch = ''
  try {
    categorySearch = localStorage.getItem('explore_initial_category') || ''
    localStorage.removeItem('explore_initial_category')
  } catch { /* Storage is optional. */ }
  return {
    query: params.get('query') || categorySearch,
    bakeryId: params.get('bakeryId') || '',
    categoryId: params.get('categoryId') || '',
    city: params.get('city') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    customizable: params.get('customizable') || '',
    page: Math.max(1, Number(params.get('page')) || 1),
    size: Number(params.get('size')) || 12,
    sort: params.get('sort') || 'createdAt,desc',
  }
}

export const ExploreCakesPage = ({ onNavigate, routeSearch = '' }) => {
  const [filters, setFilters] = useState(() => initialFilters(routeSearch))
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const resource = useCatalogResource(loadProducts, filters)
  const products = resource.data?.result || []
  const meta = resource.data?.meta
  const categories = [...new Map(products.filter((product) => product.categoryId && product.category).map((product) => [product.categoryId, product.category])).entries()]
  const update = (name, value) => setFilters((current) => ({ ...current, [name]: value, page: 1 }))
  const reset = () => setFilters({ query: '', bakeryId: '', categoryId: '', city: '', minPrice: '', maxPrice: '', customizable: '', page: 1, size: 12, sort: 'createdAt,desc' })

  useEffect(() => {
    const handler = (event) => {
      setFilters((current) => ({ ...current, query: event.detail?.category || '', categoryId: '', page: 1 }))
    }
    window.addEventListener('sweetcake_filter_category', handler)
    return () => window.removeEventListener('sweetcake_filter_category', handler)
  }, [])
  useEffect(() => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) if (String(value) !== '') params.set(key, String(value))
    window.history.replaceState(window.history.state, '', '/explore?' + params.toString())
  }, [filters])

  const fieldClass = 'w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-primary outline-none focus:ring-2 focus:ring-secondary/30'
  return (
    <div className="sc-catalog w-full min-h-screen">
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pt-8">
        <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-[40px] text-primary mt-1 font-bold tracking-normal">Khám Phá &amp; Đặt Bánh Kem Nghệ Nhân</h1>
        <div className="mt-6 bg-surface/60 backdrop-blur-md rounded-2xl p-space-md shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
            <div className="relative flex-1 max-w-xl">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
              <input id="cakeSearchInput" aria-label="Tìm theo tên bánh" className={fieldClass + ' pl-12'} placeholder="Tìm theo tên bánh..." value={filters.query} onChange={(event) => update('query', event.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-label-lg text-primary">{meta ? meta.total + ' mẫu bánh' : 'Đang tải…'}</span>
              <select aria-label="Sắp xếp sản phẩm" className={fieldClass + ' sm:w-auto'} value={filters.sort} onChange={(event) => update('sort', event.target.value)}>
                <option value="createdAt,desc">Mới nhất</option>
                <option value="name,asc">Tên A–Z</option>
                <option value="name,desc">Tên Z–A</option>
                <option value="basePrice,asc">Giá tăng dần</option>
                <option value="basePrice,desc">Giá giảm dần</option>
              </select>
              <button className="lg:hidden flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-label-lg" onClick={() => setShowMobileFilter((value) => !value)}>Lọc bánh</button>
            </div>
          </div>
          <div className="pt-3 border-t border-outline-variant/30 flex items-center gap-2.5 overflow-x-auto pb-1">
            <button className="rounded-xl bg-primary px-4 py-2 text-on-primary whitespace-nowrap" onClick={() => update('categoryId', '')}>Tất cả danh mục</button>
            {categories.map(([id, name]) => <button key={id} className="rounded-xl border border-outline-variant/30 bg-surface px-4 py-2 text-primary whitespace-nowrap" onClick={() => update('categoryId', id)}>{name}</button>)}
          </div>
        </div>
      </section>
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <aside id="filterSidebar" className={'lg:col-span-3 bg-surface-container-low p-space-lg rounded-2xl shadow-sm flex-col gap-space-lg ' + (showMobileFilter ? 'flex' : 'hidden lg:flex')}>
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-primary">Bộ Lọc Chi Tiết</h2>
              <button className="text-secondary underline text-sm" onClick={reset}>Xóa tất cả</button>
            </div>
            <label className="text-primary text-sm">Thành phố
              <input className={fieldClass + ' mt-2'} placeholder="Nhập đúng tên thành phố" value={filters.city} onChange={(event) => update('city', event.target.value)} />
            </label>
            <label className="text-primary text-sm">Giá từ
              <input type="number" min="0" step="1000" className={fieldClass + ' mt-2'} placeholder="Không giới hạn" value={filters.minPrice} onChange={(event) => update('minPrice', event.target.value)} />
            </label>
            <label className="text-primary text-sm">Giá đến
              <input type="number" min="0" step="1000" className={fieldClass + ' mt-2'} placeholder="Không giới hạn" value={filters.maxPrice} onChange={(event) => update('maxPrice', event.target.value)} />
            </label>
            <label className="text-primary text-sm">Tùy biến sản phẩm
              <select className={fieldClass + ' mt-2'} value={filters.customizable} onChange={(event) => update('customizable', event.target.value)}>
                <option value="">Tất cả</option><option value="true">Có thể tùy biến</option><option value="false">Mẫu có sẵn</option>
              </select>
            </label>
            <label className="text-primary text-sm">Số mẫu mỗi trang
              <select className={fieldClass + ' mt-2'} value={filters.size} onChange={(event) => update('size', Number(event.target.value))}>
                <option value="12">12</option><option value="24">24</option><option value="48">48</option>
              </select>
            </label>
            {(filters.bakeryId || filters.categoryId) && <div className="text-sm text-primary">
              <p>Đang lọc theo {filters.bakeryId ? 'cửa hàng' : 'danh mục'} đã chọn.</p>
              <button className="mt-2 underline" onClick={() => setFilters((current) => ({ ...current, bakeryId: '', categoryId: '', page: 1 }))}>Bỏ giới hạn này</button>
            </div>}
          </aside>
          <div className="lg:col-span-9">
            <div id="cakeGridContainer" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
              <CatalogState {...resource} empty={products.length === 0} emptyText="Chưa có mẫu bánh phù hợp. Hãy thử thay đổi bộ lọc." onRetry={resource.reload} onNavigate={onNavigate} />
              {resource.status === 'ready' && products.map((product) => <ProductCard key={product.id} product={product} onNavigate={onNavigate} />)}
            </div>
            {resource.status === 'ready' && <CatalogPagination meta={meta} onPage={(page) => setFilters((current) => ({ ...current, page }))} />}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ExploreCakesPage
