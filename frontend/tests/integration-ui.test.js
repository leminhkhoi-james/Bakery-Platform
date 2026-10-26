import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
let vite, Review, Close, Workspace, Design, Plans, EntityManager, EntityForm, Assets, Options, VendorMenu
let AdminPlans, AdminPlanForm, AdminOrders, AdminModeration, DesignModeration, ReviewModeration
const userId = randomUUID(), bakeryId = randomUUID(), id = randomUUID(), ready = (data) => ({ data, status: 'ready', error: null, reload() {} })
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'integration-ui-fixture-only', enforce: 'pre', load(id) {
    const path = id.replaceAll('\\', '/')
    if (path.endsWith('/src/context/useAuth.js')) return 'export function useAuth() { return { user: globalThis.__integrationUser, roles: globalThis.__integrationUser.roles }; }'
    if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export function useCatalogResource(load, params) { globalThis.__integrationCalls.push({ name: load.name, params }); return globalThis.__integrationResources[load.name] || { status: "loading", data: null, error: null, reload() {} }; }'
  } }] })
  Review = (await vite.ssrLoadModule('/src/components/orders/OrderReview.jsx')).default
  Close = (await vite.ssrLoadModule('/src/components/chat/CloseConversation.jsx')).default
  Workspace = (await vite.ssrLoadModule('/src/components/chat/ChatWorkspace.jsx')).default
  Design = (await vite.ssrLoadModule('/src/components/marketplace/DesignDetail.jsx')).default
  Plans = (await vite.ssrLoadModule('/src/pages/customer/subscription/SubscriptionPlansPage.jsx')).default
  const catalog = await vite.ssrLoadModule('/src/components/management/CatalogEntityManager.jsx')
  EntityManager = catalog.default; EntityForm = catalog.CatalogEntityForm
  const assets = await vite.ssrLoadModule('/src/components/management/ProductAssets.jsx')
  Assets = assets.default; Options = assets.OptionsEditor
  VendorMenu = (await vite.ssrLoadModule('/src/pages/vendor/catalog/VendorMenuCatalogPage.jsx')).default
  const adminPlans = await vite.ssrLoadModule('/src/pages/admin/vendors/AdminPlansPage.jsx')
  AdminPlans = adminPlans.default; AdminPlanForm = adminPlans.AdminPlanForm
  AdminOrders = (await vite.ssrLoadModule('/src/pages/admin/orders/AdminOrdersEscrowPage.jsx')).default
  const moderation = await vite.ssrLoadModule('/src/pages/admin/vendors/AdminModerationPage.jsx')
  AdminModeration = moderation.default; DesignModeration = moderation.DesignModeration
  ReviewModeration = (await vite.ssrLoadModule('/src/components/orders/ReviewModeration.jsx')).default
})
after(async () => { await vite?.close(); for (const key of ['__integrationUser', '__integrationCalls', '__integrationResources']) delete globalThis[key] })
function setup(resources = {}, roles = ['CUSTOMER']) {
  globalThis.__integrationUser = { id: userId, roles }
  globalThis.__integrationCalls = []; globalThis.__integrationResources = resources
}
const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, { onNavigate() {}, ...props }))
test('Customer review controls are attached to actual order UI, only owner COMPLETED can create', () => {
  setup()
  const order = { id, customerId: userId, status: 'COMPLETED', review: null }
  const html = render(Review, { order, onChanged() {} })
  assert.match(html, /Gửi đánh giá/); assert.match(html, /maxLength="5000"/)
  assert.doesNotMatch(render(Review, { order: { ...order, status: 'PENDING' } }), /Gửi đánh giá/)
  setup({}, ['BAKERY_OWNER']); assert.doesNotMatch(render(Review, { order }), /Gửi đánh giá/)
  setup(); assert.doesNotMatch(render(Review, { order: { ...order, customerId: randomUUID() } }), /Gửi đánh giá/)
})
test('Existing review displays real DTO, status gates editing/deletion including HIDDEN/DELETED', () => {
  setup(); const review = { orderId: id, customerId: userId, rating: 3, comment: 'Actual fixture review', status: 'PUBLISHED' }, order = { id, customerId: userId, status: 'COMPLETED', review }
  assert.match(render(Review, { order }), /Lưu đánh giá/); assert.match(render(Review, { order }), /Actual fixture review/)
  const hidden = render(Review, { order: { ...order, review: { ...review, status: 'HIDDEN' } } })
  assert.doesNotMatch(hidden, /Lưu đánh giá/); assert.match(hidden, /Xóa đánh giá/)
  const deleted = render(Review, { order: { ...order, review: { ...review, status: 'DELETED' } } })
  assert.doesNotMatch(deleted, /Lưu đánh giá|Xóa đánh giá|Actual fixture review/)
})
test('Inbox no longer claims Marketplace unavailable and offers real RFQ navigation', () => {
  setup()
  const html = render(Workspace, { onNavigate() {} })
  assert.match(html, /Chọn yêu cầu để mở Chat/); assert.doesNotMatch(html, /Marketplace chưa sẵn sàng|Tạo hội thoại — cần Marketplace/)
})
test('Close UI requires loaded manager/customer permission and explicit confirmation', () => {
  setup({ loadPermission: ready(true) })
  const props = { conversation: { id, customerId: userId, bakeryId, status: 'OPEN' }, user: globalThis.__integrationUser }
  assert.match(render(Close, props), /Đóng cuộc trò chuyện/)
  setup({ loadPermission: ready(false) }); assert.doesNotMatch(render(Close, props), /Đóng cuộc trò chuyện/)
  setup(); assert.match(render(Close, props), /Đang tải/)
  setup({ loadPermission: { status: 'error', error: { status: 403 }, data: null, reload() {} } }); assert.match(render(Close, props), /Thử lại/)
})
test('AI design UI uses real detail DTO, loading/error handling and does not reveal unapproved images', () => {
  setup({ loadDesign: ready({ id, generationJobId: id, moderationStatus: 'PENDING', imageUrl: null }) })
  assert.match(render(Design, { id, jobId: id }), /Backend chưa cung cấp ảnh/)
  setup(); assert.match(render(Design, { id }), /Đang tải/)
  setup({ loadDesign: { status: 'error', data: null, error: { status: 500, message: 'Fixture failure' }, reload() {} } })
  assert.match(render(Design, { id }), /Thử lại/)
})
test('Public plan cards offer detail controls with server names and empty/error states', () => {
  setup({ loadSubscriptionPlans: ready([{ id, code: 'FIXTURE', name: 'API plan fixture', status: 'ACTIVE', monthlyPrice: 321000, currency: 'VND', features: {} }]) })
  assert.match(render(Plans), /Chi tiết API plan fixture/)
  setup({ loadSubscriptionPlans: ready([]) }); assert.match(render(Plans), /Chưa có gói/)
})


test('Vendor management tabs provide actual categories/add-ons/members screens in existing catalog route', () => {
  setup({ loadVendorMembership: ready({ memberRole: 'OWNER', status: 'ACTIVE' }), loadManagedProducts: ready({ result: [], meta: { page: 1, pageSize: 12, total: 0, pages: 0 } }), loadManagedCategories: ready([]) }, ['BAKERY_OWNER'])
  const html = render(VendorMenu, { routeSearch: '?bakeryId=' + bakeryId })
  for (const text of ['Sản phẩm', 'Danh mục', 'Phụ kiện', 'Nhân sự']) assert.ok(html.includes(text))
})
test('Vendor list empty/error/loading and STAFF controls follow membership resource, not mock fallback', () => {
  setup({ loadCatalogEntities: ready([]), loadVendorMembership: ready({ memberRole: 'OWNER', status: 'ACTIVE' }) }, ['BAKERY_OWNER'])
  assert.match(render(EntityManager, { bakeryId, kind: 'categories' }), /Chưa có danh mục từ backend/)
  setup({ loadCatalogEntities: ready([{ id, name: 'Backend fixture category' }]), loadVendorMembership: ready({ memberRole: 'STAFF', status: 'ACTIVE' }) }, ['BAKERY_STAFF'])
  const html = render(EntityManager, { bakeryId, kind: 'categories' })
  assert.match(html, /Backend fixture category/); assert.match(html, /<button disabled=""[^>]*>Sửa/)
  setup({ loadCatalogEntities: { status: 'error', error: { status: 403 }, data: null, reload() {} } }, ['BAKERY_STAFF'])
  assert.match(render(EntityManager, { bakeryId, kind: 'members' }), /Thử lại/)
  setup(); assert.match(render(EntityManager, { bakeryId, kind: 'categories' }), /Đang tải/)
})
test('Vendor forms match DTO fields, manager cannot assign manager/owner, add-on category required', () => {
  setup()
  const members = render(EntityForm, { kind: 'members', actor: { memberRole: 'MANAGER' }, onSave() {}, onClose() {} })
  assert.match(members, /User ID đã có Bakery role/); assert.doesNotMatch(members, /<option[^>]*>OWNER|<option[^>]*>MANAGER/)
  const addon = render(EntityForm, { kind: 'add-ons', actor: {}, onSave() {}, onClose() {} })
  assert.match(addon, /Nhóm phụ kiện/); assert.match(addon, /maxLength="80"/)
})
test('Draft asset resume with no snapshot shows BLOCKED and never renders replace-options form', () => {
  setup({ loadProductSnapshot: { status: 'error', error: { status: 404 }, data: null, reload() {} } }, ['BAKERY_OWNER'])
  const html = render(Assets, { bakeryId, product: { id }, onSnapshot() {}, onChanged() {} })
  assert.match(html, /BLOCKED chỉnh options/); assert.doesNotMatch(html, /Lưu tùy chọn/)
  assert.match(html, /Upload ảnh/)
})
test('Known asset snapshot renders real image IDs and confirmable options editor; no invented persisted IDs', () => {
  setup({ loadProductSnapshot: ready(null) }, ['BAKERY_OWNER'])
  const snapshot = { images: [{ id, displayOrder: 2, primary: true }], options: { groups: [] } }
  const html = render(Assets, { bakeryId, product: { id }, initialSnapshot: snapshot, onSnapshot() {}, onChanged() {} })
  assert.ok(html.includes(id)); assert.match(html, /Xóa ảnh/); assert.match(html, /Lưu tùy chọn/)
  assert.match(render(Options, { options: { groups: [] }, onSave() {} }), /Xác nhận thay toàn bộ options/)
})

test('Admin plan management renders real records, empty/error/loading and DTO form fields', () => {
  setup({ loadAdminPlans: ready([{ id, code: 'SERVER', name: 'Backend plan fixture', status: 'INACTIVE', monthlyPrice: 321000, currency: 'VND' }]) }, ['ADMIN'])
  assert.match(render(AdminPlans), /Backend plan fixture/); assert.match(render(AdminPlans), /Sửa gói/)
  assert.match(render(AdminPlanForm, { onSave() {}, onClose() {} }), /Xác nhận lưu/)
  setup({ loadAdminPlans: ready([]) }, ['ADMIN']); assert.match(render(AdminPlans), /Chưa có gói dịch vụ trong backend/)
  setup({ loadAdminPlans: { status: 'error', error: { status: 403 }, data: null, reload() {} } }, ['ADMIN']); assert.match(render(AdminPlans), /Thử lại/)
  setup({}, ['ADMIN']); assert.match(render(AdminPlans), /Đang tải/)
})
test('Admin Orders page loads all scope, contains no mock escrow statistics and supports review details', () => {
  setup({ loadOrders: ready({ result: [], meta: { page: 1, pageSize: 10, total: 0, pages: 0 } }) }, ['ADMIN'])
  const html = render(AdminOrders)
  assert.match(html, /Chưa có đơn hàng phù hợp/); assert.doesNotMatch(html, /Giải ngân|Khóa cọc|1.250.000/)
  assert.equal(globalThis.__integrationCalls.find((call) => call.name === 'loadOrders').params.scope, 'all')
})
test('Moderation UI operates by real UUID only, no fake queue, states and role gates are explicit', () => {
  setup({}, ['ADMIN']); assert.match(render(AdminModeration), /Backend chưa có danh sách chờ duyệt/)
  setup({ loadModerationDesign: ready({ id, generationJobId: id, moderationStatus: 'PENDING', imageUrl: null }) }, ['ADMIN'])
  assert.match(render(DesignModeration, { id }), /Xác nhận kiểm duyệt thiết kế/)
  setup({ loadModerationDesign: ready({ id, generationJobId: id, moderationStatus: 'APPROVED' }) }, ['ADMIN'])
  assert.doesNotMatch(render(DesignModeration, { id }), /Xác nhận kiểm duyệt thiết kế/)
  const review = { orderId: id, status: 'PUBLISHED' }
  assert.match(render(ReviewModeration, { review }), /Ẩn đánh giá/)
  setup({}, ['CUSTOMER']); assert.equal(render(ReviewModeration, { review }), '')
})
