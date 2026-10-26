import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let vite, ui, state, Dashboard, Profile, Vendors, Revenue, Header, AdminPlanForm, CatalogForm
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
test('Admin metrics use API meta.total rather than current-page length or mock statistics', () => {
  setup({ loadAdminBakeries: ready(page([], 37)), loadAdminPayments: ready(page([], 12)) })
  const html = render(Dashboard, { onNavigate() {} })
  assert.match(html, /sc-metric-value">37<\/p>/); assert.match(html, /sc-metric-value">12<\/p>/)
  assert.doesNotMatch(html, /Doanh thu theo danh mục|Giải ngân/)
})
test('Restored Admin table displays backend records with status, ID and original review action', () => {
  setup({ loadAdminBakeries: ready(page([{ id, name: 'Fixture API bakery', status: 'PENDING_APPROVAL' }])) })
  const html = render(Vendors, { onNavigate() {} })
  assert.match(html, /<table/); assert.match(html, /Fixture API bakery/); assert.match(html, /PENDING_APPROVAL/)
  assert.match(html, /Xem \/ duyệt hồ sơ/); assert.ok(html.includes(id))
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
  assert.match(html, /Chưa có API thống kê doanh thu/); assert.match(html, /không theo dõi thanh toán bánh/)
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
