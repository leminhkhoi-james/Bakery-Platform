import { cleanPresentationLabel, publicCopy } from '../../../services/uiLabels.js'
import { useState } from 'react'
import { loadBakery } from '../../../services/vendorService.js'
import { loadProducts } from '../../../services/cakeService.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import CatalogImage from '../../../components/catalog/CatalogImage.jsx'
import CatalogState from '../../../components/catalog/CatalogState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import ProductCard from '../../../components/catalog/ProductCard.jsx'

export default function BakeryDetailPage({ routeSearch = '', onNavigate }) {
  const id = new URLSearchParams(routeSearch).get('id') || ''
  const resource = useCatalogResource(loadBakery, { id })
  return <div className="sc-catalog w-full min-h-screen">
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
      <button className="text-secondary underline" onClick={() => onNavigate?.('stores')}>← Danh sách cửa hàng</button>
      <div className="mt-6"><CatalogState {...resource} onRetry={resource.reload} onNavigate={onNavigate} /></div>
      {resource.status === 'ready' && <>
        <BakeryDetails bakery={resource.data} />
        <BakeryMenu key={id} bakeryId={id} onNavigate={onNavigate} />
      </>}
    </div>
  </div>
}

export function BakeryDetails({ bakery }) {
  return <section className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-6 shadow-sm">
    {bakery.coverUrl && <CatalogImage src={bakery.coverUrl} alt={cleanPresentationLabel(bakery.name, 'Tiệm bánh')} className="mb-6 h-48 w-full rounded-2xl object-cover sm:h-64" />}
    <div className="flex flex-col sm:flex-row items-start gap-6">
      <CatalogImage src={bakery.logoUrl} alt={cleanPresentationLabel(bakery.name, 'Tiệm bánh')} className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
      <div>
        <h1 className="font-headline-lg text-3xl sm:text-4xl text-primary font-bold">{cleanPresentationLabel(bakery.name, 'Tiệm bánh')}</h1>
        <p className="mt-2 text-sm text-outline">{bakery.location || 'Tiệm chưa cung cấp địa chỉ.'}</p>
        <p className="mt-4 whitespace-pre-line text-on-surface-variant">{publicCopy(bakery.description, 'Tiệm chưa cung cấp mô tả.')}</p>
      </div>
    </div>
    {(bakery.operations?.businessHours || []).length > 0 && <details className="mt-6 text-primary">
      <summary className="cursor-pointer font-bold">Giờ hoạt động</summary>
      <ul className="mt-3 space-y-1 text-sm">{bakery.operations.businessHours.map((hour) => <li key={hour.dayOfWeek}>{hour.dayOfWeek === 7 ? 'Chủ nhật' : 'Thứ ' + (hour.dayOfWeek + 1)}: {hour.closed ? 'Đóng cửa' : hour.opensAt && hour.closesAt ? hour.opensAt + ' – ' + hour.closesAt : 'Chưa có giờ mở cửa'}</li>)}</ul>
    </details>}
  </section>
}

function BakeryMenu({ bakeryId, onNavigate }) {
  const [page, setPage] = useState(1)
  const resource = useCatalogResource(loadProducts, { bakeryId, page, size: 6, sort: 'createdAt,desc' })
  return <section className="mt-10">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h2 className="font-headline-md text-2xl text-primary font-bold">Menu &amp; Mẫu Bánh</h2>
      <button className="text-secondary underline" onClick={() => onNavigate?.('explore', { bakeryId })}>Tìm kiếm trong menu →</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
      <CatalogState {...resource} empty={!resource.data?.result.length} emptyText="Tiệm chưa có sản phẩm công khai." onRetry={resource.reload} onNavigate={onNavigate} />
      {resource.data?.result.map((product) => <ProductCard key={product.id} product={product} onNavigate={onNavigate} />)}
    </div>
    {resource.status === 'ready' && <CatalogPagination meta={resource.data.meta} onPage={setPage} />}
  </section>
}
