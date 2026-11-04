import React from 'react'
import { CustomerRequests, Offers } from '../../../components/marketplace/MarketplaceViews.jsx'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'

export default function BiddingComparisonPage({ routeSearch = '', onNavigate }) {
  const id = new URLSearchParams(routeSearch).get('cakeRequestId')
  if (!id) return <CustomerRequests onNavigate={onNavigate} />
  return (
    <main className="sc-customer mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="sc-customer-heading flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="sc-kicker">Lựa chọn tiệm phù hợp</p>
          <h1 className="font-serif text-3xl font-semibold text-primary">So sánh báo giá</h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            So sánh giá, thời gian hoàn thành và trao đổi trực tiếp để chọn tiệm phù hợp nhất.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline cursor-pointer"
            onClick={() => onNavigate('request-detail?id=' + id)}
          >
            ← Chi tiết yêu cầu
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/25 bg-surface px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/5 cursor-pointer"
            onClick={() => onNavigate('ai-studio?cakeRequestId=' + id)}
          >
            <Icon name="auto_awesome" className="text-sm text-secondary" />
            Thiết kế 3D & AI cho yêu cầu này
          </button>
        </div>
      </div>

      <Offers
        key={id}
        scope="received"
        cakeRequestId={id}
        onOpen={(offerId) => onNavigate('baker-quote?id=' + offerId)}
      />
    </main>
  )
}
