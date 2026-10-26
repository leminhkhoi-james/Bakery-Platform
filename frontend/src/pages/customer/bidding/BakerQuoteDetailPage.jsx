import React, { useState } from 'react'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadOffer, loadRfq } from '../../../services/rfqService.js'
import { acceptableOffer, ownsRequest } from '../../../services/marketplaceModels.js'
import { ADDRESS_BLOCKER } from '../../../services/checkoutService.js'
import VerifiedCheckout from '../../../components/orders/VerifiedCheckout.jsx'
import MarketplaceState from '../../../components/marketplace/MarketplaceState.jsx'
import { ChatForRequest } from '../../../components/marketplace/MarketplaceViews.jsx'
import { OfferInfo } from '../../../components/marketplace/OfferForm.jsx'
import { panelClass } from '../../../components/management/ApiState.jsx'

function QuoteContext({ offer, onNavigate }) {
  const { user } = useAuth(), resource = useCatalogResource(loadRfq, { id: offer.cakeRequestId })
  const [now] = useState(() => Date.now())
  return <MarketplaceState resource={resource}>{resource.data && (ownsRequest(resource.data, user) ? <><OfferInfo offer={offer} /><section className={panelClass}><h2 className="text-xl font-bold">Chấp nhận báo giá / tạo Order</h2><p>{ADDRESS_BLOCKER}</p><p>Accept → Order đang BLOCKED vì thiếu API địa chỉ Customer ở backend gốc. Vẫn có thể xem báo giá; chưa có API từ chối từng báo giá.</p><VerifiedCheckout offerId={offer.id} disabled={!acceptableOffer(offer, resource.data, user)} onNavigate={onNavigate} /></section>{(offer.status === 'ACCEPTED' || (offer.status === 'PENDING' && Date.parse(offer.expiresAt) > now)) && <ChatForRequest request={resource.data} bakeryId={offer.bakeryId} onNavigate={onNavigate} />}<button className="underline" onClick={() => onNavigate('bidding?cakeRequestId=' + offer.cakeRequestId)}>← Các báo giá của yêu cầu</button></> : <p role="alert">Không có quyền xem báo giá của tài khoản khác.</p>)}</MarketplaceState>
}
export default function BakerQuoteDetailPage({ routeSearch = '', onNavigate }) {
  const id = new URLSearchParams(routeSearch).get('id'), resource = useCatalogResource(loadOffer, { id })
  return <main className="sc-customer mx-auto max-w-6xl space-y-6 px-4 py-8"><div className="sc-customer-heading"><p className="sc-kicker">Báo giá từ tiệm</p><h1 className="font-serif text-3xl font-semibold text-primary">Chi tiết báo giá</h1></div><MarketplaceState resource={resource}>{resource.data && <QuoteContext offer={resource.data} onNavigate={onNavigate} />}</MarketplaceState></main>
}
