import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
after(() => server.close())
const { default: Detail } = await server.ssrLoadModule('/src/pages/admin/orders/AdminOrderDetailModal.jsx')
const { default: Dashboard } = await server.ssrLoadModule('/src/pages/admin/dashboard/AdminDashboardPage.jsx')
const { INITIAL_ADMIN_ORDERS } = await server.ssrLoadModule('/src/mockData/admin/orders.js')
const { INITIAL_ESCROW_AUDIT_ORDERS } = await server.ssrLoadModule('/src/mockData/admin/dashboard.js')
const { getAdminOrderStatus } = await server.ssrLoadModule('/src/pages/admin/orders/adminOrderStatus.js')
const { default: Badge } = await server.ssrLoadModule('/src/pages/admin/orders/OrderStatusBadge.jsx')
const { default: Orders } = await server.ssrLoadModule('/src/pages/admin/orders/AdminOrdersEscrowPage.jsx')
const { AppDataProvider } = await server.ssrLoadModule('/src/context/AppDataContext.jsx')
const renderDetail = (order) => renderToStaticMarkup(createElement(Detail, { order, onClose() {} }))

test('dashboard exposes four columns and never treats legacy escrow labels as order status', () => {
  const html = renderToStaticMarkup(createElement(Dashboard))
  assert.equal((html.match(/<th scope=/g) || []).length, 4)
  assert.equal((html.match(/Xem chi tiết đơn hàng/g) || []).length, 4)
  assert.match(html, /Trạng thái đơn hàng/)
  assert.doesNotMatch(html, /Khóa cọc 100%|Chờ giải ngân|Giải ngân ngay|Kiểm toán giao dịch/)
  assert.doesNotMatch(html, /Chưa có dữ liệu/)
  for (const dashboardOrder of INITIAL_ESCROW_AUDIT_ORDERS) {
    const source = INITIAL_ADMIN_ORDERS.find((order) => order.id === dashboardOrder.id.replace(/^#/, ''))
    assert.ok(source, `Missing admin order source: ${dashboardOrder.id}`)
    const badge = renderToStaticMarkup(createElement(Badge, { status: getAdminOrderStatus(source) }))
    const row = html.match(new RegExp(`<tr[^>]*>[\\s\\S]*?${dashboardOrder.id}[\\s\\S]*?</tr>`))?.[0]
    assert.ok(row?.includes(badge), `Missing lifecycle badge: ${dashboardOrder.id}`)
  }
  assert.equal((html.match(/Đang làm bánh/g) || []).length, 2)
  assert.equal((html.match(/Đang giao xe lạnh/g) || []).length, 1)
  assert.equal((html.match(/Đã giao thành công/g) || []).length, 1)
})

test('admin lifecycle resolver prefers explicit status and never uses financial or vehicle data', () => {
  assert.equal(getAdminOrderStatus({ status: 'CANCELLED', progressStage: 'completed' }), 'CANCELLED')
  assert.equal(getAdminOrderStatus({ progressStage: 'baking', escrowStatus: 'released' }), 'BAKING')
  assert.equal(getAdminOrderStatus({ escrowStatus: 'released', isDelivered: true, deliveryVehicle: 'Van' }), undefined)
  assert.equal(getAdminOrderStatus({ progressStage: 'unknown' }), undefined)
  assert.equal(getAdminOrderStatus(undefined), undefined)
})

test('every admin fixture has a Vietnamese lifecycle badge with the expected color', () => {
  for (const order of INITIAL_ADMIN_ORDERS) {
    const badge = renderToStaticMarkup(createElement(Badge, { status: getAdminOrderStatus(order) }))
    assert.doesNotMatch(badge, /Chưa có dữ liệu|Khóa|Giải Ngân|Chờ Khách/)
  }
  assert.match(renderToStaticMarkup(createElement(Badge, { status: 'BAKING' })), /bg-secondary-fixed/)
  assert.match(renderToStaticMarkup(createElement(Badge, { status: 'DELIVERING' })), /bg-sky-100/)
  assert.match(renderToStaticMarkup(createElement(Badge, { status: 'COMPLETED' })), /bg-emerald-100/)
  assert.match(renderToStaticMarkup(createElement(Badge, { status: 'CANCELLED' })), /bg-rose-100/)
})

test('detail displays original order fields and ignores conflicting financial/delivery statuses', () => {
  const html = renderDetail({
    id: 'order-test', status: 'CANCELLED', customerName: 'Khách kiểm thử',
    vendor: 'Tiệm kiểm thử', amount: 3850000,
    escrowStatus: 'released', progressStage: 'completed',
  })
  assert.match(html, /Đã hủy đơn/)
  assert.match(html, /3\.850\.000₫/)
  assert.match(html, /Khách kiểm thử/)
  assert.match(html, /Tiệm kiểm thử/)
  assert.match(html, /Thanh toán \/ Ký quỹ/)
  assert.doesNotMatch(html, /Đã giải ngân|Đã giao thành công|VAULT-|Xuất biên lai|Giải ngân cọc/)
})

test('missing financial data never fabricates transaction IDs, dates, amounts or actions', () => {
  const html = renderDetail({ id: 'order-test' })
  assert.match(html, /Chưa có dữ liệu giao dịch được xác thực/)
  assert.doesNotMatch(html, /NaN|undefined|null|Ngày thanh toán|Ngày giải ngân|VAULT-|Xuất biên lai/)
})

test('zero order value stays zero; existing admin detail fields remain available', () => {
  const html = renderDetail({ id: 'order-test', cakePrice: 0, cakeTitle: 'Bánh kiểm thử',
    customerAddress: 'Địa chỉ kiểm thử', stageLabel: 'Tiến độ kiểm thử', escrowPledge: '100.000đ' })
  assert.match(html, />0₫</)
  assert.match(html, /Địa chỉ kiểm thử/)
  assert.match(html, /Tiến độ kiểm thử/)
  assert.match(html, /Ký quỹ \(demo\)/)
  assert.match(html, /100\.000đ/)
})

test('orders table keeps seven essential columns and only detail actions', () => {
  const html = renderToStaticMarkup(createElement(AppDataProvider, null, createElement(Orders)))
  const table = html.match(/<table[\s\S]*?<\/table>/)?.[0]
  assert.ok(table)
  assert.equal((table.match(/<th scope="col"/g) || []).length, 7)
  for (const label of ['Mã đơn', 'Khách hàng', 'Tiệm bánh', 'Sản phẩm / Giá trị', 'Trạng thái', 'Ký quỹ', 'Thao tác']) {
    assert.ok(table.includes(label))
  }
  const rows = table.match(/<tbody[\s\S]*?<\/tbody>/)[0]
  assert.equal((rows.match(/<button/g) || []).length, (rows.match(/<tr/g) || []).length)
  assert.equal((rows.match(/>Chi tiết<\/button>/g) || []).length, (rows.match(/<tr/g) || []).length)
  assert.doesNotMatch(rows, /share_location|paid|progressPercent|thermostat|Giai đoạn|Smart Contract|undefined|NaN/)
  for (const order of INITIAL_ADMIN_ORDERS) {
    assert.ok(rows.includes(order.id))
    assert.ok(rows.includes(order.cakePriceFormatted))
    assert.ok(rows.includes(order.cakeTitle.replaceAll('&', '&amp;')))
    assert.ok(rows.includes(order.customerPhone))
    assert.ok(!rows.includes(order.customerAddress))
  }
})

test('detail retains relocated actions according to existing order conditions', () => {
  const actions = { onClose() {}, onDisburse() {}, onTrackDelivery() {} }
  const delivering = INITIAL_ADMIN_ORDERS.find((order) => order.progressStage === 'delivering')
  const html = renderToStaticMarkup(createElement(Detail, { order: delivering, ...actions }))
  assert.match(html, /Giải ngân ký quỹ/)
  assert.match(html, /Theo dõi GPS/)
  assert.ok(html.includes(delivering.customerPhone))
  assert.ok(html.includes(delivering.escrowContractId))
  const completed = INITIAL_ADMIN_ORDERS.find((order) => order.escrowStatus === 'released')
  const completedHtml = renderToStaticMarkup(createElement(Detail, { order: completed, ...actions }))
  assert.doesNotMatch(completedHtml, /Giải ngân ký quỹ<\/button>|Theo dõi GPS/)
})
