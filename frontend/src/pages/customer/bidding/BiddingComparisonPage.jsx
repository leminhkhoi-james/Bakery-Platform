import React from 'react'
import { CustomerRequests, Offers } from '../../../components/marketplace/MarketplaceViews.jsx'

export default function BiddingComparisonPage({ routeSearch = '', onNavigate }) {
  const id = new URLSearchParams(routeSearch).get('cakeRequestId')
  if (!id) return <CustomerRequests onNavigate={onNavigate} />
  return <main className="sc-customer mx-auto max-w-6xl space-y-6 px-4 py-8"><div className="sc-customer-heading"><p className="sc-kicker">Lựa chọn tiệm phù hợp</p><h1 className="font-serif text-3xl font-semibold text-primary">So sánh báo giá</h1></div><button className="underline" onClick={() => onNavigate('request-detail?id=' + id)}>← Chi tiết yêu cầu</button><p>So sánh giá và thời gian hoàn thành để chọn tiệm phù hợp.</p><Offers key={id} scope="received" cakeRequestId={id} onOpen={(offerId) => onNavigate('baker-quote?id=' + offerId)} /></main>
}
