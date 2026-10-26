import React, { useState } from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadRfqs } from '../../../services/rfqService.js'
import { RequestFilters, RequestListView, Offers } from '../../../components/marketplace/MarketplaceViews.jsx'

export default function VendorRfqMarketplacePage({ onNavigate, routeSearch = '' }) {
  const { bakeryId, selectBakery } = useVendorBakery(routeSearch)
  const [filters, setFilters] = useState({ scope: 'available', page: 1, size: 12, sort: 'createdAt,desc' })
  const resource = useCatalogResource(loadRfqs, filters)
  return <VendorFrame title="RFQ Marketplace" activeTab="rfq" bakeryId={bakeryId} onNavigate={onNavigate}><BakerySelector bakeryId={bakeryId} onSelect={selectBakery} /><p>Danh sách do backend lọc theo tất cả membership và khu vực phục vụ của tài khoản. Cửa hàng chọn ở trên dùng cho thao tác báo giá, không phải bộ lọc RFQ.</p><RequestFilters filters={filters} onChange={setFilters} /><RequestListView resource={resource} onPage={(page) => setFilters({ ...filters, page })} onOpen={(id) => onNavigate('vendor-quote-submit?cakeRequestId=' + id + (bakeryId ? '&bakeryId=' + bakeryId : ''))} />{bakeryId && <><h2 className="text-2xl font-bold">Báo giá đã gửi của tiệm</h2><Offers key={bakeryId} scope="sent" bakeryId={bakeryId} onOpen={(id) => onNavigate('vendor-quote-submit?offerId=' + id + '&bakeryId=' + bakeryId)} /></>}</VendorFrame>
}
