import { displayReference } from '../src/services/displayReference.js'
// Controlled hook harness: exercises actual component event handlers without browser/live writes.
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { createServer } from 'vite'
import { vendorRoute } from '../src/routes/catalogNavigation.js'
let vite, ProductManager, VendorPage, OrderDetail, PaymentsPage, CreateBakery, vendor, subscription
const bakeryId = randomUUID(), userId = randomUUID(), productId = randomUUID(), orderId = randomUUID()
const ready = (data) => ({ status: 'ready', data, error: null, reload() {} })
const list = { result: [], meta: { page: 1, pageSize: 20, pages: 0, total: 0 } }
const resources = {
  loadManagedProducts: ready(list), loadManagedCategories: ready([]),
  loadVendorMembership: ready({ userId, memberRole: 'OWNER', status: 'ACTIVE' }),
  loadSubscriptionPlans: ready([]), loadBakerySubscription: ready({ bakeryId }), loadSubscriptionOrders: ready(list),
}
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{
    name: 'publication-interaction-fixture-only', enforce: 'pre',
    load(id) {
      const path = id.replaceAll('\\', '/')
      if (path.endsWith('/src/context/useAuth.js')) return 'export function useAuth() { return { user: { id: "' + userId + '" }, roles: ["BAKERY_OWNER"] }; }'
      if (path.endsWith('/src/hooks/useVendorBakery.js')) return 'export function useVendorBakery(search = "") { const [bakeryId, selectBakery] = globalThis.__flowUseState(() => new URLSearchParams(search).get("bakeryId") || ""); return { bakeryId, selectBakery }; }'
      if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export function useCatalogResource(load, params) { globalThis.__flowResourceCalls.push({ name: load.name, params }); return globalThis.__flowResources[load.name] || { status: "loading", data: null, error: null, reload() {} }; }'
    },
    transform(code, id) {
      const path = id.replaceAll('\\', '/').split('?')[0]
      if (['ProductManager.jsx', 'VendorSubscriptionPage.jsx', 'SubscriptionOrderDetail.jsx', 'AdminPaymentsPage.jsx', 'BakeryManager.jsx'].some((name) => path.endsWith('/' + name))) {
        return code.replace(/import React, \{ ([^}]+) \} from 'react'/, (_, hooks) => "import React from 'react'\n" + hooks.split(',').map((hook) => hook.trim() === 'useRef' ? 'const useRef = (value) => globalThis.__flowUseState({ current: value })[0]' : 'const useState = (value) => globalThis.__flowUseState(value)').join('\n'))
      }
    },
  }] })
  ProductManager = (await vite.ssrLoadModule('/src/components/management/ProductManager.jsx')).default
  VendorPage = (await vite.ssrLoadModule('/src/pages/vendor/subscription/VendorSubscriptionPage.jsx')).default
  OrderDetail = (await vite.ssrLoadModule('/src/pages/vendor/subscription/SubscriptionOrderDetail.jsx')).default
  PaymentsPage = (await vite.ssrLoadModule('/src/pages/admin/vendors/AdminPaymentsPage.jsx')).default
  CreateBakery = (await vite.ssrLoadModule('/src/components/management/BakeryManager.jsx')).CreateBakery
  vendor = (await vite.ssrLoadModule('/src/services/vendorManagementService.js')).vendorManagementService
  subscription = (await vite.ssrLoadModule('/src/services/subscriptionService.js')).subscriptionService
})
after(async () => { await vite?.close(); for (const key of ['__flowResources', '__flowResourceCalls', '__flowUseState']) delete globalThis[key] })
function harness(Component, props = {}) {
  const slots = []; let cursor = 0
  globalThis.__flowResources = { ...resources }; globalThis.__flowResourceCalls = []
  globalThis.__flowUseState = (initial) => {
    const index = cursor++
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
    return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }]
  }
  return () => { cursor = 0; return Component(props) }
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  if (!tree || typeof tree !== 'object' || !tree.props) return []
  return [tree, ...nodes(tree.props.children)]
}
const text = (tree) => Array.isArray(tree) ? tree.map(text).join('') : tree && typeof tree === 'object' ? text(tree.props?.children) : String(tree ?? '')
const button = (tree, label) => nodes(tree).find((node) => (node.type === 'button' || node.type?.name === 'RefreshButton') && text(node.props.children) === label)

test('Vendor routes preserve real bakery UUID, existing order query and do not leak bakery IDs into customer routes', () => {
  assert.equal(vendorRoute('vendor-menu', bakeryId), 'vendor-menu?bakeryId=' + bakeryId)
  const url = new URL(vendorRoute('vendor-orders?orderId=' + orderId, bakeryId), 'http://fixture')
  assert.equal(url.searchParams.get('orderId'), orderId); assert.equal(url.searchParams.get('bakeryId'), bakeryId)
  assert.equal(vendorRoute('home', bakeryId), 'home'); assert.equal(vendorRoute('vendor-menu', 'invalid'), 'vendor-menu')
})
test('Actual Subscription sidebar navigation carries bakeryId even when entering directly from URL', () => {
  const calls = [], render = harness(VendorPage, { routeSearch: '?bakeryId=' + bakeryId, onNavigate: (route) => calls.push(route) })
  const sidebar = nodes(render()).find((node) => node.type?.name === 'VendorSidebar')
  sidebar.props.onNavigate('vendor-menu')
  assert.deepEqual(calls, ['vendor-menu?bakeryId=' + bakeryId]); assert.equal(sidebar.props.showMockBadges, false)
})
test('Created DRAFT stays editable/uploadable/publishable even when current product filter hides drafts', async () => {
  const original = vendor.saveProduct, saved = { id: productId, name: 'Fixture created', status: 'DRAFT', basePrice: 1 }
  vendor.saveProduct = async () => saved
  try {
    const render = harness(ProductManager, { bakeryId })
    const statusSelect = nodes(render()).find((node) => node.type === 'select' && nodes(node).some((option) => option.type === 'option' && option.props.value === 'PUBLISHED'))
    statusSelect.props.onChange({ target: { value: 'PUBLISHED' } })
    button(render(), 'Thêm sản phẩm').props.onClick()
    let form = nodes(render()).find((node) => node.type?.name === 'ProductForm')
    await form.props.onSave({ name: 'Fixture created' })
    const tree = render()
    form = nodes(tree).find((node) => node.type?.name === 'ProductForm')
    assert.equal(form.props.product.id, productId)
    assert.ok(nodes(tree).some((node) => node.type?.name === 'ProductAssets' && node.props.initialSnapshot?.options?.groups.length === 0))
    const lifecycle = nodes(tree).find((node) => node.type?.name === 'EntityActionButtons'); assert.equal(lifecycle.props.actions.find((action) => action.key === 'publish').disabled, false)
    assert.match(text(tree), new RegExp(displayReference(productId, 'PRD')))
  } finally { vendor.saveProduct = original }
})
test('Successful bakery creation stops the original form from resubmitting the same bakery inadvertently', async () => {
  const original = vendor.createBakery, confirmed = { id: bakeryId, name: 'Fixture created', status: 'DRAFT' }, received = []
  vendor.createBakery = async () => confirmed
  try {
    const render = harness(CreateBakery, { onCreated: (value) => received.push(value) })
    const form = nodes(render()).find((node) => node.type?.name === 'BakeryProfileForm')
    await form.props.onSave({ name: 'Fixture', phoneNumber: 'Fixture' })
    assert.deepEqual(received, [confirmed])
    assert.equal(nodes(render()).some((node) => node.type?.name === 'BakeryProfileForm'), false)
    button(render(), 'Tạo một tiệm khác').props.onClick()
    assert.ok(nodes(render()).some((node) => node.type?.name === 'BakeryProfileForm'))
  } finally { vendor.createBakery = original }
})
test('Admin payment navigation query is applied to actual API loader filters', () => {
  const render = harness(PaymentsPage, { routeSearch: '?bakeryId=' + bakeryId, onNavigate() {} })
  render()
  assert.equal(globalThis.__flowResourceCalls.find((call) => call.name === 'loadPaymentDirectory').params.bakeryId, bakeryId)
})
test('Subscription refresh reloads current order details as well as periods/history', () => {
  const page = harness(VendorPage, { routeSearch: '?bakeryId=' + bakeryId, onNavigate() {} })()
  const workspaceElement = nodes(page).find((node) => node.type?.name === 'BakeryWorkspace')
  const render = harness(workspaceElement.type, workspaceElement.props)
  // Select an existing order to open its detail.
  globalThis.__flowResources.loadSubscriptionOrders = ready({ ...list, result: [{ id: orderId }] })
  const orderButton = nodes(render()).find((node) => node.type === 'button' && text(node).includes(displayReference(orderId, 'SUB')))
  orderButton.props.onClick()
  const before = nodes(render()).find((node) => node.type === OrderDetail).props.revision
  button(render(), 'Làm mới').props.onClick()
  assert.equal(nodes(render()).find((node) => node.type === OrderDetail).props.revision, before + 1)
})
test('A rejected payment can be corrected with a fresh request after backend returns PENDING_PAYMENT', async () => {
  const nativeFormData = globalThis.FormData, original = subscription.submitPayment, calls = []
  globalThis.FormData = class { get(name) { return { paymentMethod: 'Fixture transfer', paymentReference: 'Fixture corrected', proof: null }[name] } }
  subscription.submitPayment = async (request) => { calls.push(request); return { id: randomUUID(), status: 'SUBMITTED' } }
  try {
    const render = harness(OrderDetail, { bakeryId, orderId, roles: ['BAKERY_OWNER'], onChanged() {}, onBusy() {} })
    const due = { id: orderId, bakeryId, status: 'PENDING_PAYMENT', expiresAt: '2099-01-01T00:00:00Z', totalAmount: 199000, currency: 'VND', featuresSnapshot: {}, payments: [] }
    globalThis.__flowResources.loadSubscriptionOrder = ready(due)
    await nodes(render()).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
    globalThis.__flowResources.loadSubscriptionOrder = ready({ ...due, payments: [{ id: randomUUID(), status: 'REJECTED' }] })
    await nodes(render()).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
    assert.equal(calls.length, 2); assert.notEqual(calls[0].key, calls[1].key)
    button(render(), 'Tải lại chi tiết đơn').props.onClick()
  } finally { globalThis.FormData = nativeFormData; subscription.submitPayment = original }
})
