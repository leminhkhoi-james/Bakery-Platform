import React, { useState } from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import ProductManager from '../../../components/management/ProductManager.jsx'
import CatalogEntityManager from '../../../components/management/CatalogEntityManager.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
export default function VendorMenuCatalogPage({ onNavigate, routeSearch }) {
  const { bakeryId, selectBakery } = useVendorBakery(routeSearch)
  const [tab, setTab] = useState('products')
  return <VendorFrame title="Quản lý mẫu bánh" activeTab="menu" bakeryId={bakeryId} onNavigate={onNavigate}><BakerySelector key={'selector:' + bakeryId} bakeryId={bakeryId} onSelect={selectBakery} />
    <nav aria-label="Quản lý cửa hàng" className="sc-tabs">{[['products', 'Sản phẩm'], ['categories', 'Danh mục'], ['add-ons', 'Phụ kiện'], ['members', 'Chủ tiệm']].map(([value, label]) => <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)} className="transition-colors">{label}</button>)}</nav>
    {bakeryId ? tab === 'products' ? <ProductManager key={'products:' + bakeryId} bakeryId={bakeryId} /> : <CatalogEntityManager key={bakeryId + tab} kind={tab} bakeryId={bakeryId} /> : <p>Chọn cửa hàng để quản lý mẫu bánh.</p>}
  </VendorFrame>
}
