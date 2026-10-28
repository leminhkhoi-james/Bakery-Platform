import { displayReference } from '../src/services/displayReference.js'
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let vite, ui, state, Dashboard, Profile, Vendors, Revenue, Header, AdminPlanForm, CatalogForm, WorkQueue, AdminFrame
const id = '11111111-1111-4111-8111-111111111111'
const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, props))
const ready = (data) => ({ status: 'ready', data, error: null, reload() {} })
const page = (result, total = result.length) => ({ result, meta: { page: 1, pageSize: 20, pages: total ? 1 : 0, total } })
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'ui-restoration-fixtures', enforce: 'pre', load(id) {
    const path = id.replaceAll('\\', '/')
    if (path.endsWith('/src/context/useAuth.js')) return 'export function useAuth() { return globalThis.__restorationAuth; }'
    if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export function useCatalogResource(load) { return globalThis.__restorationResources[load.name] || { status: "loading", data: null, error: null, reload() {} }; }'
  } }] })
  ui = await vite.ssrLoadModule('/src/components/common/WorkspaceUI.jsx')
  state = await vite.ssrLoadModule('/src/components/management/ApiState.jsx')
  Dashboard = (await vite.ssrLoadModule('/src/pages/admin/dashboard/AdminDashboardPage.jsx')).default
  WorkQueue = (await vite.ssrLoadModule('/src/pages/admin/dashboard/AdminWorkQueue.jsx')).default
  AdminFrame = (await vite.ssrLoadModule('/src/components/management/AdminFrame.jsx')).default
  Profile = (await vite.ssrLoadModule('/src/pages/customer/profile/CustomerProfilePage.jsx')).default
  Vendors = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminVendorsPage.jsx')).default
  Revenue = (await vite.ssrLoadModule('/src/pages/vendor/revenue/VendorRevenueEscrowPage.jsx')).default
  Header = (await vite.ssrLoadModule('/src/layouts/customer/Header.jsx')).default
  AdminPlanForm = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminPlansPage.jsx')).AdminPlanForm
  CatalogForm = (await vite.ssrLoadModule('/src/components/management/CatalogEntityManager.jsx')).CatalogEntityForm
})
after(async () => { await vite?.close(); delete globalThis.__restorationAuth; delete globalThis.__restorationResources })
function setup(resources = {}, roles = ['ADMIN']) {
  globalThis.__restorationAuth = { user: { id, displayName: 'UI fixture identity', email: 'ui@example.invalid', roles }, roles, logout() {} }
  globalThis.__restorationResources = resources
}
test('Shared tables expose a labelled keyboard-scroll region and semantic caption', () => {
  const html = render(ui.DataTable, { label: 'Dữ liệu thật', children: React.createElement('tbody', null, React.createElement('tr', null, React.createElement('td', null, 'Record'))) })
  assert.match(html, /role="region"/); assert.match(html, /tabindex="0"/)
  assert.match(html, /<caption class="sr-only">Dữ liệu thật<\/caption>/)
})
test('Status badges retain real enum/label and do not invent a known state for missing data', () => {
  assert.match(render(ui.StatusBadge, { status: 'PENDING', label: 'Chờ xác nhận' }), /sc-status--amber/)
  assert.match(render(ui.StatusBadge, { status: 'UNKNOWN_SERVER_STATE' }), /UNKNOWN_SERVER_STATE/)
  assert.match(render(ui.StatusBadge), /Chưa có trạng thái/)
})
test('Drawer has native focus containment semantics, labelled title and disabled close while busy', () => {
  const html = render(ui.DetailDrawer, { title: 'Hồ sơ', busy: true, onClose() {}, children: 'Content' })
  assert.match(html, /<dialog/); assert.match(html, /aria-labelledby=/)
  assert.match(html, /disabled=""[^>]*aria-label="Đóng bảng chi tiết"/)
  assert.match(html, /Content/)
})
test('Portal header uses authenticated identity and no mock notifications or receiving-order toggle', () => {
  const html = render(ui.PortalHeader, { title: 'Catalog', portal: 'Đối tác', user: { displayName: 'Real identity' }, onMenu() {} })
  assert.match(html, /Real identity/); assert.match(html, /Mở menu/); assert.match(html, /Đến nội dung chính/)
  assert.doesNotMatch(html, /La Crème|Jean-Luc|notifications|Đang mở lò/)
})
test('Loading and errors conceal stale children and retain retry rather than showing an empty result', () => {
  const loading = render(state.ApiState, { resource: { status: 'loading' }, children: 'stale-data' })
  assert.match(loading, /role="status"/); assert.match(loading, /Đang tải/); assert.doesNotMatch(loading, /stale-data/)
  const failed = render(state.ApiState, { resource: { status: 'error', error: { status: 403 }, reload() {} }, children: 'stale-data' })
  assert.match(failed, /role="alert"/); assert.match(failed, /Thử lại/); assert.doesNotMatch(failed, /stale-data/)
})
test('Admin metrics use complete source collections, preserve counts and remove dashboard guidance', () => {
  setup({ loadAdminDashboard: ready({ bakeries: { state: 'ready', rows: Array.from({ length: 37 }, (_, i) => ({ id: 'b' + i, name: 'Tiệm ' + i, status: 'PENDING_APPROVAL' })) }, payments: { state: 'ready', rows: Array.from({ length: 12 }, (_, i) => ({ id: 'p' + i, subscriptionOrderId: 's' + i, status: 'SUBMITTED' })) } }) })
  const html = render(Dashboard, { onNavigate() {} })
  assert.match(html, /sc-metric-value">37<\/strong>/); assert.match(html, /sc-metric-value">12<\/strong>/)
  assert.doesNotMatch(html, /Điều kiện xuất hiện|Phạm vi dữ liệu|Giải ngân|DEMO|backend/); assert.equal((html.match(/sc-dashboard-kpi-footer/g) || []).length, 10); assert.match(html, /Tình hình hoạt động/); assert.match(html, /Việc cần xử lý/); assert.match(html, /Hoạt động gần đây/)
})
test('Restored Admin table displays backend records with status, ID and original review action', () => {
  setup({ loadAdminBakeries: ready(page([{ id, name: 'Fixture API bakery', status: 'PENDING_APPROVAL' }])) })
  const html = render(Vendors, { onNavigate() {} })
  assert.match(html, /<table/); assert.match(html, /Fixture API bakery/); assert.match(html, /PENDING_APPROVAL/)
  assert.match(html, /Xem \/ duyệt hồ sơ/); assert.ok(html.includes(displayReference(id, 'SHOP'))); assert.ok(!html.includes(id))
})
test('Customer profile shows real identity and preserves role-gated portal links', () => {
  setup({ loadOrders: ready(page([])) }, ['CUSTOMER'])
  const customer = render(Profile, { onNavigate() {} })
  assert.match(customer, /UI fixture identity/); assert.match(customer, /ui@example.invalid/)
  assert.doesNotMatch(customer, /Quản trị hệ thống|Quản lý tiệm bánh|Điểm thưởng/)
  setup({ loadOrders: ready(page([])) }, ['CUSTOMER', 'BAKERY_OWNER', 'ADMIN'])
  const privileged = render(Profile, { onNavigate() {} })
  assert.match(privileged, /Quản trị hệ thống/); assert.match(privileged, /Quản lý tiệm bánh/)
})
test('Unavailable revenue screen stays honest after visual restoration', () => {
  setup({}, ['BAKERY_OWNER'])
  const html = render(Revenue, { onNavigate() {}, routeSearch: '' })
  assert.match(html, /Chưa có số liệu doanh thu đã đối soát/); assert.match(html, /giao dịch đã đối soát/)
  assert.doesNotMatch(html, /Rút tiền|Giải ngân thành công|120.000.000/)
})
test('Customer navigation has an accessible mobile toggle and uses initials instead of a sample avatar', () => {
  setup({}, ['CUSTOMER'])
  const html = render(Header, { onNavigate() {} })
  assert.match(html, /aria-label="Mở điều hướng" aria-expanded="false"/)
  assert.match(html, /aria-controls="customer-mobile-navigation"/)
  assert.match(html, /aria-label="Tài khoản khách hàng"/)
  assert.doesNotMatch(html, /alt="Avatar khách hàng"/)
})
test('Admin plan and Vendor catalog errors remain visible inside the modal form', () => {
  const error = { status: 409, message: 'UI conflict fixture' }
  for (const [Component, props] of [[AdminPlanForm, {}], [CatalogForm, { kind: 'categories', actor: { memberRole: 'OWNER' } }]]) {
    const html = render(Component, { ...props, error, onSave() {}, onClose() {} })
    assert.match(html, /<dialog[\s\S]*role="alert"[\s\S]*UI conflict fixture[\s\S]*<\/dialog>/)
  }
})

test('Dashboard shows three status cards with counts and progress, without timeline charts or raw UUIDs', () => {
  const today = new Date().toISOString()
  setup({ loadAdminDashboard: ready({ orders: { state: 'ready', rows: [{ id, orderNumber: 'ORD-101', bakeryName: 'Tiệm đang hoạt động', status: 'CONFIRMED', totalAmount: 400000, currency: 'VND', createdAt: today, neededAt: today }] }, payments: { state: 'ready', rows: [] } }) })
  const html = render(Dashboard, { onNavigate() {} })
  assert.equal((html.match(/sc-panel sc-dashboard-distribution/g) || []).length, 3)
  assert.match(html, /<meter[^>]*value="1"/)
  assert.match(html, /100%/ )
  for (const label of ['Trạng thái đơn hàng', 'Trạng thái tiệm bánh', 'Trạng thái người dùng', 'Xem đơn hàng', 'Xem tiệm bánh', 'Xem người dùng']) assert.ok(html.includes(label))
  assert.match(html, /ORD-101/)
  assert.doesNotMatch(html, /<svg|Khoảng thời gian|Đơn hàng theo thời gian|Xu hướng hoạt động|7 ngày|30 ngày|90 ngày/)
  assert.match(html, /Xem chi tiết ORD-101/)
  assert.ok(!html.includes(id))
})

test('Admin task cards prioritize pending groups, hide empty or unknown groups and keep exact navigation', () => {
  const groups = [
    { key: 'empty', title: 'Nhóm đã xử lý', route: 'admin-vendors', items: [] },
    { key: 'unknown', title: 'Kiểm duyệt nội dung', route: 'admin-moderation', items: null },
    { key: 'one', title: 'Duyệt tiệm bánh', route: 'admin-vendors?status=PENDING_APPROVAL', items: [{ key: 'b1', name: 'Tiệm cần duyệt', route: 'admin-vendors?bakeryId=b1' }] },
    { key: 'two', title: 'Duyệt chứng từ', route: 'admin-payments', items: [{ key: 'p1', name: 'Chứng từ một', route: 'admin-payments?paymentId=p1' }, { key: 'p2', name: 'Chứng từ hai', route: 'admin-payments?paymentId=p2' }] },
  ]
  const html = render(WorkQueue, { groups, onNavigate() {} })
  assert.ok(html.indexOf('Duyệt chứng từ') < html.indexOf('Duyệt tiệm bánh'))
  assert.doesNotMatch(html, /Kiểm duyệt nội dung/)
  assert.doesNotMatch(html, /Nhóm đã xử lý/)
  assert.match(html, /Số công việc: 2/)
  assert.doesNotMatch(html, /Chưa có số liệu/)
  assert.equal((html.match(/>Xem tất cả</g) || []).length, 2)
  let destination
  const tree = WorkQueue({ groups: [groups[2]], onNavigate: (route) => { destination = route } })
  const nodes = (node) => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : []
  nodes(tree).find((node) => node.type === 'button' && node.props['aria-label'] === 'Xem Tiệm cần duyệt').props.onClick()
  assert.equal(destination, 'admin-vendors?bakeryId=b1')
  assert.match(render(WorkQueue, { groups: [groups[0]], onNavigate() {} }), /Không có công việc đang chờ xử lý/)
})

test('Admin work area never promotes pending or overdue fulfilment orders into intervention work', () => {
  setup({ loadAdminDashboard: ready({ bakeries: { state: 'ready', rows: [] }, payments: { state: 'ready', rows: [] }, designs: { state: 'ready', rows: [] }, reviews: { state: 'ready', rows: [] }, orders: { state: 'ready', rows: [{ id, status: 'PENDING', neededAt: '2020-01-01T00:00:00Z' }] } }) })
  const html = render(Dashboard, { onNavigate() {} })
  const work = html.slice(html.indexOf('aria-labelledby="dashboard-work"'), html.indexOf('aria-labelledby="dashboard-recent"'))
  assert.match(work, /Không có công việc đang chờ xử lý/)
  assert.doesNotMatch(work, /Đơn hàng cần chú ý|Chờ xác nhận|Quá hẹn giao|admin-orders/)
})

test('All seven Admin pages share a single header title, description and account identity without the portal kicker', () => {
  setup()
  const headings = { 'admin-dashboard': 'Tổng quan hệ thống', 'admin-vendors': 'Quản lý tiệm bánh', 'admin-orders': 'Quản lý đơn hàng', 'admin-plans': 'Quản lý gói dịch vụ', 'admin-payments': 'Duyệt chứng từ', 'admin-moderation': 'Kiểm duyệt nội dung', 'admin-users': 'Quản lý người dùng' }
  for (const [activeTab, title] of Object.entries(headings)) {
    const html = render(AdminFrame, { activeTab, onNavigate() {}, children: 'Nội dung trang' })
    assert.equal((html.match(/<h1\b/g) || []).length, 1)
    assert.match(html, new RegExp('<h1[^>]*>' + title + '</h1>'))
    assert.match(html, /sc-portal-description/)
    assert.match(html, /Tài khoản UI fixture identity/)
    assert.doesNotMatch(html, /SweetCake \/ Quản trị/)
  }
})

test('Dashboard keeps one page title and its refresh action in the header', () => {
  setup()
  const html = render(Dashboard, { onNavigate() {} })
  const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'))
  assert.match(header, /Tổng quan hệ thống/)
  assert.match(header, /Làm mới tổng quan/)
  assert.equal((html.match(/Tổng quan hệ thống/g) || []).length, 1)
  assert.doesNotMatch(html, /SweetCake · Trung tâm vận hành|sc-dashboard-heading/)
})

test('Task cards display at most three records and preserve the full group count and view-all button', () => {
  const html = render(WorkQueue, { groups: [{ key: 'b', title: 'Tiệm chờ duyệt', route: 'admin-vendors', items: Array.from({ length: 5 }, (_, i) => ({ key: i, name: 'Tiệm cần duyệt ' + i, route: 'admin-vendors?bakeryId=' + i })) }], onNavigate() {} })
  assert.equal((html.match(/<li>/g) || []).length, 3)
  assert.match(html, /Số công việc: 5/)
  assert.match(html, /Xem tất cả/)
  assert.doesNotMatch(html, /Tiệm cần duyệt 3|Tiệm cần duyệt 4/)
})
