import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { formatOrderDate, formatOrderMoney, configurationEntries } from '../src/services/orderPresentation.js'
import { order as fixture } from './fixtures/vendorOrder.js'

let vite, View, Progress, Detail
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'tracking-presentation-fixture', enforce: 'pre', load(id) {
    const path = id.replaceAll('\\', '/')
    if (path.endsWith('/src/context/useAuth.js')) return 'export const useAuth = () => globalThis.__trackingAuth'
    if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export const useCatalogResource = () => ({ status: "ready", data: globalThis.__trackingOrder, reload() {} })'
  } }] })
  const views = await vite.ssrLoadModule('/src/components/orders/OrderTrackingView.jsx')
  View = views.default; Progress = views.OrderProgress
  Detail = (await vite.ssrLoadModule('/src/components/orders/OrderViews.jsx')).OrderDetail
})
after(async () => { await vite?.close(); delete globalThis.__trackingAuth; delete globalThis.__trackingOrder })

for (const [index, status] of ['PENDING', 'CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED'].entries()) test('Tracking stage ' + status + ' shows the actual step without advancing the order', () => {
  const order = { ...fixture, status }
  const html = render(Progress, { order })
  assert.equal((html.match(/aria-current="step"/g) || []).length, 1)
  assert.equal((html.match(/class="is-complete"/g) || []).length, index)
  assert.equal((html.match(/<li\b/g) || []).length, 6)
  assert.match(html, /Tiến trình giao nhận/)
  assert.doesNotMatch(html, /<button/)
  assert.equal(order.status, status)
})
test('Cancelled orders have a separate stopped state and preserve the cancellation reason', () => {
  const html = render(View, { order: { ...fixture, status: 'CANCELLED', statusHistory: [{ toStatus: 'CANCELLED', changedAt: '2026-10-28T03:05:00Z', note: 'Khách đổi lịch nhận bánh' }] } })
  assert.match(html, /Quy trình giao nhận đã dừng/)
  assert.match(html, /Khách đổi lịch nhận bánh/)
  assert.doesNotMatch(html, /class="sc-order-progress"/)
  assert.doesNotMatch(html, /Thanh toán thành công|Hoàn tiền thành công/)
})
test('History is collapsed with real timestamps/notes, and configuration displays values without raw IDs/JSON', () => {
  const html = render(View, { order: { ...fixture, items: [{ ...fixture.items[0], configuration: { options: ['Vani nguyên chất'], productId: fixture.id } }] } })
  assert.match(html, /<details class="sc-order-history">/)
  assert.match(html, /26\/10\/2026 07:00/)
  assert.match(html, /Created/)
  assert.match(html, /Vani nguyên chất/)
  assert.doesNotMatch(html, /<pre|productId|DEMO|backend|dữ liệu mẫu/)
  assert.ok(!html.includes(fixture.id))
  assert.match(html, /Tổng tiền đơn hàng không phải là xác nhận đã thanh toán/)
})
test('The order dialog has one compact order header and Admin cannot fulfil or cancel orders', () => {
  globalThis.__trackingOrder = fixture
  globalThis.__trackingAuth = { user: { id: 'admin', roles: ['ADMIN'] }, roles: ['ADMIN'] }
  const html = render(Detail, { orderId: fixture.id, scope: 'all', onClose() {} })
  assert.match(html, /<dialog[^>]*sc-order-dialog/)
  assert.equal((html.match(/ORD-FIXTURE/g) || []).length, 1)
  assert.equal((html.match(/Tiệm snapshot/g) || []).length, 1)
  assert.doesNotMatch(html, /SweetCake · Chi tiết|>Chi tiết đơn hàng<|Cập nhật trạng thái|Xác nhận đơn hàng|Hủy đơn hàng/)
})
test('Customers only follow progress while Owner retains the valid next-step controls', () => {
  globalThis.__trackingOrder = fixture
  globalThis.__trackingAuth = { user: { id: fixture.customerId, roles: ['CUSTOMER'] }, roles: ['CUSTOMER'] }
  let html = render(Detail, { orderId: fixture.id })
  assert.doesNotMatch(html, /Thao tác đơn hàng|>Hủy đơn hàng<|>Xác nhận đơn hàng</)
  globalThis.__trackingAuth = { user: { id: 'owner', roles: ['BAKERY_OWNER'] }, roles: ['BAKERY_OWNER'] }
  html = render(Detail, { orderId: fixture.id, scope: 'bakery', bakeryId: fixture.bakeryId })
  assert.match(html, /Xác nhận đơn hàng/)
  globalThis.__trackingAuth = { user: { id: 'staff', roles: ['BAKERY_STAFF'] }, roles: ['BAKERY_STAFF'] }
  html = render(Detail, { orderId: fixture.id, scope: 'bakery', bakeryId: fixture.bakeryId })
  assert.doesNotMatch(html, />Xác nhận đơn hàng<|>Hủy đơn hàng</)
})
test('Money and dates use Vietnamese presentation and do not invent missing fees or payment confirmations', () => {
  assert.equal(formatOrderDate('2026-10-28T03:05:00Z'), '28/10/2026 10:05')
  assert.equal(formatOrderDate('bad'), 'Chưa có thời gian')
  assert.equal(formatOrderMoney(220000, 'VND').replaceAll('\u00a0', ' '), '220.000 ₫')
  assert.equal(formatOrderMoney(null, 'VND'), 'Chưa có thông tin giá')
  assert.equal(formatOrderMoney('', 'VND'), 'Chưa có thông tin giá')
  assert.equal(formatOrderMoney(100, null), 'Chưa có thông tin giá')
  assert.deepEqual(configurationEntries({}), [])
})

test('Owner actions appear immediately below the progress and before products in the order popup', () => {
  globalThis.__trackingOrder = fixture
  globalThis.__trackingAuth = { user: { id: 'owner', roles: ['BAKERY_OWNER'] }, roles: ['BAKERY_OWNER'] }
  const html = render(Detail, { orderId: fixture.id, scope: 'bakery', bakeryId: fixture.bakeryId, onClose() {} })
  const progress = html.indexOf('aria-label="Tiến trình giao nhận"'), actions = html.indexOf('aria-label="Thao tác đơn hàng"'), products = html.indexOf('Sản phẩm trong đơn')
  assert.ok(progress >= 0 && actions > progress && products > actions)
  assert.match(html, /Xác nhận đơn hàng/)
  assert.match(html, /Từ chối đơn hàng/)
  assert.doesNotMatch(html, /<select/)
})
