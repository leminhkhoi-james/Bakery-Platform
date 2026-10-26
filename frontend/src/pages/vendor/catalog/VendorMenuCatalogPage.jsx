import React, { useState } from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import ProductManager from '../../../components/management/ProductManager.jsx'
import CatalogEntityManager from '../../../components/management/CatalogEntityManager.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
export default function VendorMenuCatalogPage({ onNavigate, routeSearch }) {
  const { bakeryId, selectBakery } = useVendorBakery(routeSearch)
  const [tab, setTab] = useState('products')
  return <VendorFrame title="Quản lý mẫu bánh" activeTab="menu" bakeryId={bakeryId} onNavigate={onNavigate}><BakerySelector key={bakeryId} bakeryId={bakeryId} onSelect={selectBakery} />
    <nav aria-label="Quản lý cửa hàng" className="flex flex-wrap gap-3">{[['products', 'Sản phẩm'], ['categories', 'Danh mục'], ['add-ons', 'Phụ kiện'], ['members', 'Nhân sự']].map(([value, label]) => <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)} className={'rounded-xl border px-4 py-2 ' + (tab === value ? 'bg-primary text-on-primary' : '')}>{label}</button>)}</nav>
    {bakeryId ? tab === 'products' ? <ProductManager key={bakeryId} bakeryId={bakeryId} /> : <CatalogEntityManager key={bakeryId + tab} kind={tab} bakeryId={bakeryId} /> : <p>Chọn cửa hàng để tải dữ liệu thật.</p>}
  </VendorFrame>
}
