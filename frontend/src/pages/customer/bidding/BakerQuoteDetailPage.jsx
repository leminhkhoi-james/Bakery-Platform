import { demoRuntime } from '../../../mockData/runtime.js'
import { isDemoId } from '../../../mockData/seed.js'
import React, { useState } from 'react'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadOffer, loadRfq } from '../../../services/rfqService.js'
import { acceptableOffer, ownsRequest, moneyVnd } from '../../../services/marketplaceModels.js'
import { ADDRESS_BLOCKER } from '../../../services/checkoutService.js'
import VerifiedCheckout from '../../../components/orders/VerifiedCheckout.jsx'
import MarketplaceState from '../../../components/marketplace/MarketplaceState.jsx'
import { ChatForRequest } from '../../../components/marketplace/MarketplaceViews.jsx'
import { OfferInfo } from '../../../components/marketplace/OfferForm.jsx'
import { ApiErrorMessage } from '../../../components/management/ApiState.jsx'
import { Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'

function formatRfqDate(isoString) {
  if (!isoString) return 'Chưa xác định'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  } catch {
    return isoString
  }
}

function QuoteContext({ offer, onNavigate }) {
  const { user } = useAuth()
  const resource = useCatalogResource(loadRfq, { id: offer.cakeRequestId })
  const [now] = useState(() => Date.now())

  if (resource.status === 'loading') {
    return (
      <div className="py-12 text-center text-sm text-on-surface-variant">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent mb-3" />
        <p>Đang tải thông tin yêu cầu bánh…</p>
      </div>
    )
  }

  if (resource.error) {
    return <ApiErrorMessage error={resource.error} retry={resource.reload} />
  }

  const rfq = resource.data
  if (!rfq || !ownsRequest(rfq, user)) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Không có quyền xem báo giá của tài khoản khác.
      </div>
    )
  }

  const canAccept = acceptableOffer(offer, rfq, user)
  const designPreviewUrl =
    rfq.preference?.extraOptions?.cake3DSnapshotUrl ||
    rfq.preference?.extraOptions?.selectedAiImageUrl ||
    rfq.images?.[0]?.url ||
    null

  return (
    <div className="space-y-6">
      {/* Top back navigation button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('bidding?cakeRequestId=' + offer.cakeRequestId)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline transition-colors"
        >
          <Icon name="arrow_back" className="text-base" /> Quay lại danh sách so sánh báo giá
        </button>
        <button
          type="button"
          onClick={() => onNavigate('request-detail?id=' + offer.cakeRequestId)}
          className="inline-flex items-center gap-1 text-xs text-outline hover:text-primary hover:underline transition-colors"
        >
          <Icon name="visibility" className="text-sm" /> Xem yêu cầu đặt bánh gốc
        </button>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left column: Offer details & RFQ preview */}
        <div className="space-y-6 lg:col-span-7">
          <OfferInfo offer={offer} />

          {/* Associated RFQ summary card */}
          <section className="space-y-4 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="cake" className="text-primary text-xl" />
                <h3 className="font-serif text-lg font-bold text-primary">Mẫu bánh & Yêu cầu đặt bánh gốc</h3>
              </div>
              <StatusBadge status={rfq.status} />
            </div>

            {designPreviewUrl && (
              <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-surface-container-low p-3">
                <img
                  src={designPreviewUrl}
                  alt="Mẫu bánh đã chọn"
                  className="max-h-56 w-full rounded-xl object-contain"
                />
              </div>
            )}

            <div className="space-y-2 text-sm">
              <h4 className="text-base font-bold text-on-surface">{rfq.title || 'Yêu cầu làm bánh'}</h4>
              {rfq.description && (
                <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">{rfq.description}</p>
              )}
              <div className="grid gap-2 sm:grid-cols-2 pt-2 text-xs">
                <p className="flex items-center gap-1 text-outline">
                  <Icon name="location_on" className="text-xs text-secondary" /> Khu vực nhận:{' '}
                  <strong className="text-on-surface font-medium">{rfq.deliveryDistrict}, {rfq.deliveryCity}</strong>
                </p>
                <p className="flex items-center gap-1 text-outline">
                  <Icon name="calendar_today" className="text-xs text-primary" /> Cần bánh lúc:{' '}
                  <strong className="text-on-surface font-medium">{formatRfqDate(rfq.neededAt)}</strong>
                </p>
              </div>
            </div>

            {rfq.images && rfq.images.length > 1 && (
              <div className="pt-2 border-t border-outline-variant/20">
                <p className="text-xs font-semibold text-outline mb-2">Ảnh đính kèm:</p>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {rfq.images.slice(0, 4).map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt="Ảnh mẫu"
                      className="h-20 w-20 shrink-0 rounded-2xl object-cover border border-outline-variant/30 shadow-xs"
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Chat with baker */}
          {(offer.status === 'ACCEPTED' || (offer.status === 'PENDING' && Date.parse(offer.expiresAt) > now)) && (
            <section className="space-y-3 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Icon name="chat" className="text-primary text-xl" />
                <h3 className="font-serif text-lg font-bold text-primary">Trao đổi trực tiếp với tiệm bánh</h3>
              </div>
              <p className="text-xs text-on-surface-variant">
                Bạn có thể nhắn tin với tiệm để thống nhất chi tiết kem phủ, hương vị, kích thước hoặc phương thức giao nhận trước khi xác nhận đặt đơn cuối cùng.
              </p>
              <ChatForRequest request={rfq} bakeryId={offer.bakeryId} onNavigate={onNavigate} />
            </section>
          )}
        </div>

        {/* Right column: Sticky Final Order Confirmation Panel (Section 5.3) */}
        <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-24">
          <section className="space-y-5 rounded-3xl border-2 border-primary/15 bg-surface p-6 shadow-md">
            <div className="border-b border-outline-variant/20 pb-4">
              <p className="sc-kicker text-xs">Bước xác nhận cuối cùng</p>
              <h2 className="font-serif text-2xl font-bold text-primary">Chấp nhận báo giá & Tạo đơn</h2>
              <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                Kiểm tra lại giá đề xuất, thời gian hoàn thành, chọn địa chỉ nhận bánh và xác nhận cuối cùng để tạo đơn hàng chính thức (các báo giá khác của yêu cầu này sẽ tự động đóng).
              </p>
            </div>

            {/* Agreed Price & Timeline Summary Box */}
            <div className="space-y-2 rounded-2xl bg-surface-container-low p-4 text-sm border border-outline-variant/20">
              <div className="flex justify-between text-on-surface-variant">
                <span>Giá bánh tiệm đề xuất:</span>
                <span className="font-semibold text-on-surface">{moneyVnd(offer.cakePrice)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Phí giao hàng:</span>
                <span className="font-semibold text-on-surface">{moneyVnd(offer.deliveryFee)}</span>
              </div>
              {offer.addOnTotal > 0 && (
                <div className="flex justify-between text-on-surface-variant">
                  <span>Phụ kiện đi kèm:</span>
                  <span className="font-semibold text-on-surface">{moneyVnd(offer.addOnTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-on-surface-variant pt-1 border-t border-outline-variant/20">
                <span>Dự kiến hoàn thành:</span>
                <span className="font-semibold text-on-surface">{formatRfqDate(offer.estimatedCompletionAt)}</span>
              </div>
              <div className="border-t border-outline-variant/30 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-on-surface">Tổng giá trị thống nhất:</span>
                <span className="font-serif text-2xl font-bold text-primary">{moneyVnd(offer.totalPrice)}</span>
              </div>
            </div>

            {!(demoRuntime && isDemoId(offer.id)) && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
                <p className="font-bold">{ADDRESS_BLOCKER}</p>
                <p>Chưa thể hoàn tất đặt hàng lúc này. Vui lòng liên hệ tiệm để được hỗ trợ.</p>
              </div>
            )}

            {/* Verified Checkout & Delivery Address Selector */}
            <VerifiedCheckout
              offerId={offer.id}
              disabled={!canAccept}
              onNavigate={onNavigate}
            />
          </section>
        </div>
      </div>
    </div>
  )
}

export default function BakerQuoteDetailPage({ routeSearch = '', onNavigate }) {
  const id = new URLSearchParams(routeSearch).get('id')
  const resource = useCatalogResource(loadOffer, { id })

  return (
    <main className="sc-customer mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="sc-customer-heading">
        <p className="sc-kicker">SweetCake Bidding</p>
        <h1 className="font-serif text-3xl font-semibold text-primary">Chi tiết báo giá từ tiệm</h1>
      </div>
      <MarketplaceState resource={resource}>
        {resource.data && <QuoteContext offer={resource.data} onNavigate={onNavigate} />}
      </MarketplaceState>
    </main>
  )
}
