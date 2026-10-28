import React, { useState } from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadRfqs } from '../../../services/rfqService.js'
import { RequestFilters, RequestListView, Offers } from '../../../components/marketplace/MarketplaceViews.jsx'
import { SectionHeading } from '../../../components/common/WorkspaceUI.jsx'

export default function VendorRfqMarketplacePage({ onNavigate, routeSearch = '' }) {
  const { bakeryId, selectBakery } = useVendorBakery(routeSearch)
  const [filters, setFilters] = useState({ scope: 'available', page: 1, size: 12, sort: 'createdAt,desc' })
  const resource = useCatalogResource(loadRfqs, filters)
  return <VendorFrame title="Yêu cầu báo giá" activeTab="rfq" bakeryId={bakeryId} onNavigate={onNavigate}><SectionHeading title="Tìm ý tưởng, gửi báo giá" description="Khám phá yêu cầu bánh phù hợp với cửa hàng." icon="storefront" /><BakerySelector bakeryId={bakeryId} onSelect={selectBakery} /><p className="sc-note">Yêu cầu được hiển thị theo khu vực phục vụ của các tiệm bạn tham gia. Chọn cửa hàng để gửi báo giá.</p><RequestFilters filters={filters} onChange={setFilters} /><RequestListView resource={resource} onPage={(page) => setFilters({ ...filters, page })} onOpen={(id) => onNavigate('vendor-quote-submit?cakeRequestId=' + id + (bakeryId ? '&bakeryId=' + bakeryId : ''))} />{bakeryId && <><h2 className="text-2xl font-bold">Báo giá đã gửi của tiệm</h2><Offers key={bakeryId} scope="sent" bakeryId={bakeryId} onOpen={(id) => onNavigate('vendor-quote-submit?offerId=' + id + '&bakeryId=' + bakeryId)} /></>}</VendorFrame>
}
