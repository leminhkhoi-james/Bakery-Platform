import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let vite, Vendors, BakeryReview, Payments, PaymentReview, Dashboard, CategoryForm, ProductManager, BakeryManager
const bakeryId = randomUUID(), orderId = randomUUID(), userId = randomUUID()
const ready = (data) => ({ status: 'ready', error: null, data, reload() {} })
const page = (result) => ({ result, meta: { page: 1, pageSize: 20, pages: result.length ? 1 : 0, total: result.length } })
const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, { onNavigate() {}, ...props }))
before(async () => {
  vite = await createServer({
    logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [{ name: 'publication-ui-fixture-only', enforce: 'pre', load(id) {
      const path = id.replaceAll('\\', '/')
      if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export function useCatalogResource(load) { return globalThis.__publicationUiResources[load.name] || { status: "loading", data: null, error: null, reload() {} }; }'
      if (path.endsWith('/src/context/useAuth.js')) return 'export function useAuth() { return globalThis.__publicationUiAuth; }'
    } }],
  })
  const vendors = await vite.ssrLoadModule('/src/pages/admin/vendors/AdminVendorsPage.jsx')
  Vendors = vendors.default; BakeryReview = vendors.BakeryReview
  const payments = await vite.ssrLoadModule('/src/pages/admin/vendors/AdminPaymentsPage.jsx')
  Payments = payments.default; PaymentReview = payments.PaymentReview
  Dashboard = (await vite.ssrLoadModule('/src/pages/admin/dashboard/AdminDashboardPage.jsx')).default
  const products = await vite.ssrLoadModule('/src/components/management/ProductManager.jsx')
  CategoryForm = products.CategoryForm; ProductManager = products.default
  BakeryManager = (await vite.ssrLoadModule('/src/components/management/BakeryManager.jsx')).default
})
after(async () => { await vite?.close(); delete globalThis.__publicationUiResources; delete globalThis.__publicationUiAuth })
function fixtures(resources = {}, roles = ['ADMIN']) {
  globalThis.__publicationUiResources = resources
  globalThis.__publicationUiAuth = { user: { id: userId, displayName: 'Fixture administrator' }, roles }
}
test('Admin bakery and subscription screens render genuine empty states; dashboard counts come from APIs', () => {
  fixtures({ loadAdminBakeries: ready(page([])), loadAdminPayments: ready(page([])) })
  assert.match(render(Vendors), /Không có tiệm phù hợp từ backend/)
  assert.match(render(Payments), /Chưa có chứng từ phù hợp từ backend/)
  const html = render(Dashboard)
  assert.match(html, /Tổng từ backend: 0/); assert.match(html, /Tổng chứng từ SUBMITTED từ backend: 0/)
  assert.doesNotMatch(html, /14|Phê duyệt xưởng bánh thành công/)
})
test('Admin list renders backend bakery name/status/ID, not demo rate or specialty', () => {
  fixtures({ loadAdminBakeries: ready(page([{ id: bakeryId, name: 'Named bakery HTTP fixture', status: 'PENDING_APPROVAL' }])) })
  const html = render(Vendors)
  assert.match(html, /Named bakery HTTP fixture/); assert.match(html, /PENDING_APPROVAL/); assert.ok(html.includes(bakeryId))
  assert.doesNotMatch(html, /5.0%|Mời tiệm|Haute Couture/)
})
test('Bakery review differentiates missing entitlement from inactive and validates approval checklist', () => {
  const bakery = { id: bakeryId, name: 'Fixture', status: 'PENDING_APPROVAL', operations: { addresses: [], serviceAreas: [] } }
  fixtures({ loadAdminBakery: ready({ bakery, members: [], subscription: null }) })
  const unknown = render(BakeryReview, { id: bakeryId })
  assert.match(unknown, /Chưa xác minh được/); assert.match(unknown, /value="ACTIVE" disabled/); assert.match(unknown, /Chưa có/)
  fixtures({ loadAdminBakery: ready({ bakery, members: [], subscription: { active: false } }) })
  assert.match(render(BakeryReview, { id: bakeryId }), /Duyệt tiệm không tự kích hoạt Subscription/)
})
test('Payment review uses backend order/bakery values and blocks amount mismatch', () => {
  fixtures({ loadAdminOrder: ready({ id: orderId, bakeryId, status: 'PAYMENT_REVIEW', totalAmount: 199000, currency: 'VND' }) })
  const html = render(PaymentReview, { payment: { id: randomUUID(), subscriptionOrderId: orderId, status: 'SUBMITTED', amount: 1, currency: 'VND' } })
  assert.ok(html.includes(bakeryId)); assert.match(html, /Số tiền\/tiền tệ chưa khớp/)
  assert.match(html, /<button disabled=""[^>]*>Phê duyệt thanh toán/)
  assert.match(html, /Tôi đã đối chiếu/); assert.doesNotMatch(html, /Thanh toán thành công/)
})
test('Vendor category form has real DTO fields and no sample category values', () => {
  fixtures()
  const html = render(CategoryForm, { onSave() {} })
  assert.match(html, /maxLength="120"/); assert.match(html, /maxLength="140"/)
  assert.match(html, /12 sản phẩm công khai mới nhất/); assert.doesNotMatch(html, /Bánh Cưới|Sinh Nhật/)
})
test('New backend-confirmed DRAFT profile can configure operations and submit; unknown profiles cannot overwrite operations', () => {
  const membership = ready({ userId, memberRole: 'OWNER', status: 'ACTIVE' })
  fixtures({ loadVendorMembership: membership, loadVendorProfile: { status: 'error', error: { status: 404 }, data: null } }, ['BAKERY_OWNER'])
  const profile = { id: bakeryId, name: 'Fixture newly created', status: 'DRAFT', operations: { addresses: [], serviceAreas: [], businessHours: [] } }
  const html = render(BakeryManager, { bakeryId, initialProfile: profile })
  assert.match(html, /Vận hành và giao hàng/); assert.match(html, /Gửi yêu cầu duyệt/)
  assert.match(render(BakeryManager, { bakeryId }), /Không tự PUT các danh sách rỗng/)
})
test('Only verified OWNER or MANAGER sees category creation in ProductManager', () => {
  const resources = { loadVendorMembership: ready({ userId, memberRole: 'OWNER', status: 'ACTIVE' }), loadManagedProducts: ready(page([])), loadManagedCategories: ready([]) }
  fixtures(resources, ['BAKERY_OWNER']); assert.match(render(ProductManager, { bakeryId }), /Thêm danh mục sản phẩm/)
  fixtures({ ...resources, loadVendorMembership: ready(null) }, ['BAKERY_STAFF']); assert.doesNotMatch(render(ProductManager, { bakeryId }), /Thêm danh mục sản phẩm/)
})
for (const status of [401, 403, 404, 500, 503, 0]) test('Admin screens expose HTTP/network ' + status + ' as error with retry, never an empty list', () => {
  const resource = { status: 'error', error: { status, message: 'Fixture failure' }, data: null, reload() {} }
  fixtures({ loadAdminBakeries: resource, loadAdminPayments: resource })
  for (const Component of [Vendors, Payments, Dashboard]) {
    const html = render(Component)
    assert.match(html, /role="alert"/); assert.match(html, /Thử lại/); assert.doesNotMatch(html, /Không có tiệm phù hợp|Chưa có chứng từ phù hợp|Tổng từ backend: 0/)
  }
})

test('Public ACTIVE bakery cannot be submitted again; loading Admin APIs do not display empty or fake counts', () => {
  fixtures({ loadVendorMembership: ready({ userId, memberRole: 'OWNER', status: 'ACTIVE' }), loadVendorProfile: ready({ id: bakeryId, name: 'Public fixture' }) }, ['BAKERY_OWNER'])
  assert.match(render(BakeryManager, { bakeryId }), /<button disabled=""[^>]*>Gửi yêu cầu duyệt/)
  fixtures()
  for (const Component of [Vendors, Payments, Dashboard]) {
    const html = render(Component)
    assert.match(html, /Đang tải dữ liệu/)
    assert.doesNotMatch(html, /Không có tiệm phù hợp|Chưa có chứng từ phù hợp|Tổng từ backend: 0/)
  }
})
