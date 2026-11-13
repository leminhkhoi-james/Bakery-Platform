import React, { useState } from 'react'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import ProductManager from '../../../components/management/ProductManager.jsx'
import CatalogEntityManager from '../../../components/management/CatalogEntityManager.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'

export default function VendorMenuCatalogPage({ onNavigate, routeSearch }) {
  const owner = useVendorBakery(routeSearch)
  const { bakeryId } = owner
  const bakery = owner.available?.data?.find(b => b.id === bakeryId) || owner.bakery
  const [tab, setTab] = useState('products')
  const navigation = (
    <nav aria-label="Quản lý cửa hàng" className="sc-tabs">
      {[['products', 'Sản phẩm'], ['categories', 'Danh mục'], ['add-ons', 'Phụ kiện']].map(([value, label]) => (
        <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)} className="transition-colors">
          {label}
        </button>
      ))}
    </nav>
  )
  const showProducts = bakeryId && tab === 'products'
  return (
    <VendorFrame owner={owner} title="Quản lý mẫu bánh" activeTab="menu" bakeryId={bakeryId} onNavigate={onNavigate}>
      {showProducts ? (
        <ProductManager key={'products:' + bakeryId} bakeryId={bakeryId} navigation={navigation} bakeryName={bakery?.name} />
      ) : bakeryId ? (
        <CatalogEntityManager key={bakeryId + tab} kind={tab} navigation={navigation} bakeryId={bakeryId} bakeryName={bakery?.name} />
      ) : (
        <>
          {navigation}
          <p>Chọn cửa hàng để quản lý mẫu bánh.</p>
        </>
      )}
    </VendorFrame>
  )
}
