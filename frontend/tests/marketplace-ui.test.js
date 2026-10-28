import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { mapRequest, mapOffer } from '../src/services/marketplaceModels.js'
import { mapJobDetail } from '../src/services/aiModels.js'
import { request, offer, detail, user, page, bakeryId, requestId } from './fixtures/marketplace.js'

let vite, AuthContext, Views, State, RequestForm, OfferForm, OfferInfo, Ai, Vendor, Quote
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } })
  ;({ AuthContext } = await vite.ssrLoadModule('/src/context/useAuth.js'))
  Views = await vite.ssrLoadModule('/src/components/marketplace/MarketplaceViews.jsx')
  ;({ default: State } = await vite.ssrLoadModule('/src/components/marketplace/MarketplaceState.jsx'))
  ;({ default: RequestForm } = await vite.ssrLoadModule('/src/components/marketplace/RequestForm.jsx'))
  ;({ default: OfferForm, OfferInfo } = await vite.ssrLoadModule('/src/components/marketplace/OfferForm.jsx'))
  Ai = await vite.ssrLoadModule('/src/pages/customer/ai-studio/AiCakeStudioPage.jsx')
  ;({ default: Vendor } = await vite.ssrLoadModule('/src/pages/vendor/rfq/VendorRfqMarketplacePage.jsx'))
  ;({ default: Quote } = await vite.ssrLoadModule('/src/pages/customer/bidding/BakerQuoteDetailPage.jsx'))
})
after(async () => { await vite?.close() })
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
const withUser = (Component, props, roles = user.roles) => renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user: { ...user, roles }, roles } }, React.createElement(Component, props)))
const ready = (result) => ({ status: 'ready', data: page(result), reload: () => {} })
test('RFQ list renders actual data, pagination and empty without sample counts', () => {
  const empty = render(Views.RequestListView, { resource: ready([]) })
  assert.match(empty, /Chưa có yêu cầu phù hợp/); assert.doesNotMatch(empty, /Pikachu|Jean|15 yêu cầu|OPEN_CUSTOM/)
  const html = render(Views.RequestListView, { resource: ready([mapRequest(request)]), onOpen: () => {}, onPage: () => {} })
  assert.match(html, /Yêu cầu fixture/); assert.match(html, /DRAFT/); assert.match(html, /Quận fixture/); assert.match(html, /Trang 1/)
})
test('Marketplace/AI loading and all error codes do not reveal fake content', () => {
  assert.match(render(State, { resource: { status: 'loading' } }), /role="status"/)
  for (const status of [400, 401, 403, 404, 409, 500, 0]) {
    const html = render(State, { kind: 'Cake AI', resource: { status: 'error', error: { status, message: 'Fixture error' }, reload: () => {} } })
    assert.match(html, /role="alert"/); assert.match(html, /Fixture error/)
    if (status === 0 || status >= 500) { assert.match(html, /BLOCKED/); assert.match(html, /provider\/Firebase/) }
    assert.doesNotMatch(html, /<img|Jean|Escrow/)
  }
})
test('RFQ form preserves styling, exact types, required fields and disabled writes while blocked', () => {
  const html = render(RequestForm, { disabled: true, onSave: () => {} })
  assert.match(html, /OPEN_CUSTOM/); assert.match(html, /TARGETED_PRODUCT_CUSTOM/); assert.match(html, /maxLength="10000"/)
  assert.match(html, /fieldset disabled/); assert.match(html, /sm:grid-cols-2/); assert.match(html, /lưu DRAFT/)
  assert.doesNotMatch(html, /value="OPEN"|mock|fallback/)
})
test('RFQ detail displays preference, snapshots and missing-image state safely', () => {
  const html = render(Views.RequestInfo, { request: { ...mapRequest(request, true), optionSelections: [{ optionGroupId: 'group', optionValueId: 'value', groupNameSnapshot: 'Nhóm snapshot', valueNameSnapshot: 'Vị snapshot', quantity: 2 }] } })
  assert.match(html, /Không đậu phộng/); assert.match(html, /Nhóm snapshot: Vị snapshot/)
  assert.match(render(Views.ReferenceImage, { url: null }), /Ảnh không khả dụng/)
})
test('Offers render exact prices/conditions/snapshots and empty, never ratings or payment success', () => {
  const html = render(OfferInfo, { offer: mapOffer(offer, true) })
  assert.match(html, /220.000 VND/); assert.match(html, /Điều kiện fixture/); assert.match(html, /Nến fixture/)
  assert.doesNotMatch(html, /4\.9|escrow|Thanh toán thành công|Hoàn tiền/)
  assert.match(render(Views.OfferCards, { resource: ready([]) }), /Chưa có báo giá/)
  assert.match(render(OfferForm, { bakeryId, disabled: true }), /fieldset disabled/)
})
test('AI generation form disables submit until services/RFQ ready and uses contract fields only', () => {
  const html = render(Ai.GenerationForm, { cakeRequestId: requestId, disabled: true })
  assert.match(html, /maxLength="4000"/); assert.match(html, /max="4"/); assert.match(html, /10 MiB/); assert.match(html, /fieldset disabled/)
  assert.doesNotMatch(html, /<img|sample|Tạo thành công|value="gemini/)
})
test('AI results never show unapproved image URLs and select is locked until SUCCEEDED', () => {
  const hidden = mapJobDetail({ ...detail, generatedDesigns: [{ ...detail.generatedDesigns[0], moderationStatus: 'PENDING' }] }, user)
  const html = render(Ai.DesignResults, { detail: hidden, onSelect: () => {} })
  assert.doesNotMatch(html, /fixture.invalid|<img/); assert.match(html, /disabled/)
  const approved = render(Ai.DesignResults, { detail: mapJobDetail(detail, user), onSelect: () => {} })
  assert.match(approved, /fixture.invalid\/design.png/); assert.doesNotMatch(approved, /button[^>]* disabled=""/)
  assert.match(render(Ai.DesignResults, { detail: { ...detail, job: { ...detail.job, status: 'PROCESSING' } }, onSelect: () => {} }), /button[^>]* disabled=""/)
})
test('Customer/Vendor page entry states use true identity, real API loading and no legacy demo payload', () => {
  const customer = withUser(Views.CustomerRequests, { onNavigate: () => {} })
  assert.match(customer, /Yêu cầu bánh của tôi/); assert.match(customer, /Đang tải/)
  const vendor = withUser(Vendor, { routeSearch: '?bakeryId=' + bakeryId, onNavigate: () => {} }, ['BAKERY_OWNER'])
  assert.match(vendor, /Fixture customer/); assert.match(vendor, /tất cả membership/); assert.match(vendor, /Đang tải/)
  const ai = withUser(Ai.default, { onNavigate: () => {} })
  assert.match(ai, /Chọn yêu cầu/); assert.match(ai, /Đang tải/)
  const quote = withUser(Quote, { routeSearch: '?id=invalid', onNavigate: () => {} })
  assert.match(quote, /Đang tải/)
  for (const html of [customer, vendor, ai, quote]) assert.doesNotMatch(html, /Pikachu|Chef Jean|46\.7M|localStorage|Thanh toán thành công/)
})
