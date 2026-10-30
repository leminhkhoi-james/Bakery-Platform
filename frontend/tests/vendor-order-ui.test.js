import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { mapOrder } from '../src/services/orderModels.js'
import { bakeryId, customerId, managedProduct, cartItem, order, operations } from './fixtures/vendorOrder.js'

let vite, AuthContext, OrderSnapshot, OrderList, ProductForm, BakeryProfileForm, OperationsForm, Cart, Payment, Profile, VendorDashboard, ProductManager, VendorSettings, ApiState
before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, logLevel: 'error' })
  ;({ AuthContext } = await vite.ssrLoadModule('/src/context/useAuth.js'))
  ;({ OrderSnapshot, OrderList } = await vite.ssrLoadModule('/src/components/orders/OrderViews.jsx'))
  ;({ default: ProductManager, ProductForm } = await vite.ssrLoadModule('/src/components/management/ProductManager.jsx'))
  ;({ BakeryProfileForm } = await vite.ssrLoadModule('/src/components/management/BakeryManager.jsx'))
  ;({ default: OperationsForm } = await vite.ssrLoadModule('/src/components/management/BakeryOperationsForm.jsx'))
  ;({ default: Cart } = await vite.ssrLoadModule('/src/pages/customer/checkout/CartCheckoutPage.jsx'))
  ;({ default: Payment } = await vite.ssrLoadModule('/src/pages/customer/checkout/PaymentGatewayPage.jsx'))
  ;({ default: Profile } = await vite.ssrLoadModule('/src/pages/customer/profile/CustomerProfilePage.jsx'))
  ;({ default: VendorDashboard } = await vite.ssrLoadModule('/src/pages/vendor/dashboard/VendorDashboardPage.jsx'))
  ;({ default: VendorSettings } = await vite.ssrLoadModule('/src/pages/vendor/settings/VendorSettingsPage.jsx'))
  ;({ ApiState } = await vite.ssrLoadModule('/src/components/management/ApiState.jsx'))
})
after(async () => { await vite?.close() })
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
const user = { id: customerId, displayName: 'Tên tài khoản thật', email: 'fixture@example.invalid', roles: ['CUSTOMER'], phoneNumber: '' }
const authenticated = (Component, props, roles = ['CUSTOMER']) => renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user: { ...user, roles }, roles, logout: () => {} } }, React.createElement(Component, props)))

test('Order detail renders backend snapshots, correct status history and monetary values', () => {
  const html = render(OrderSnapshot, { order: mapOrder(order, true) }).replaceAll('\u00a0', ' ')
  for (const value of ['ORD-FIXTURE', 'Tiệm snapshot', 'Khách snapshot', 'Bánh snapshot', 'Vani snapshot', 'Địa chỉ snapshot', '220.000 ₫', '10.000 ₫', 'Chờ xác nhận']) assert.ok(html.includes(value), value)
  assert.doesNotMatch(html, /Đã thanh toán thành công|Ký quỹ thành công|950\.000|Pikachu/)
})
test('Missing order amounts/address do not become zero-fee delivery or invented payment state', () => {
  const html = render(OrderSnapshot, { order: mapOrder({ ...order, subtotal: null, totalAmount: null, deliveryFee: null, deliveryAddress: null }, true) })
  assert.match(html, /Chưa có thông tin giá/); assert.match(html, /Chưa có thông tin địa chỉ/); assert.doesNotMatch(html, />0 VND</)
})
test('Order list starts loading with actual enum filters and no mock Kanban rows', () => {
  const html = authenticated(OrderList, { onNavigate: () => {} })
  assert.match(html, /Đang tải/); assert.match(html, /value="PENDING"/); assert.match(html, /value="BAKING"/)
  assert.doesNotMatch(html, /value="NEW"|#ORD-2025|Pikachu|ORD-FIXTURE/)
})
test('Product form has real DTO fields, required validation and immutable status guidance', () => {
  const html = render(ProductForm, { product: managedProduct, onSave: () => {}, onClose: () => {} })
  assert.match(html, /Sản phẩm backend/); assert.match(html, /san-pham-backend/); assert.match(html, /min="0"/); assert.match(html, /maxLength="180"/i)
  assert.match(html, /Ảnh và tùy chọn được lưu riêng/); assert.doesNotMatch(html, /<select[^>]*>[^]*Công khai[^]*Đã ẩn/); assert.doesNotMatch(html, /69\.0%|cost|Lợi nhuận|480\.000/)
})
test('Bakery form never prefills demo contact/owner and create requires name/phone', () => {
  const html = render(BakeryProfileForm, { create: true, onSave: () => {} })
  assert.match(html, /<input(?=[^>]*name="name")(?=[^>]*required="")[^>]*>/); assert.match(html, /<input(?=[^>]*name="phoneNumber")(?=[^>]*required="")[^>]*>/)
  assert.doesNotMatch(html, /La Crème|0918|ownerUserId|value="ACTIVE"/)
})
test('Operations form preserves full server rows and requires confirmation before replace', () => {
  const html = render(OperationsForm, { operations, onSave: () => {} })
  assert.match(html, /Địa chỉ nhập thật/); assert.match(html, /12000\.00/); assert.match(html, /thay thế toàn bộ/)
  assert.match(html, /disabled=""/)
})
test('Empty cart is empty and checkout is blocked without a verified deliveryAddressId', () => {
  const html = render(Cart, { cartItems: [], onNavigate: () => {} })
  assert.match(html, /Giỏ hàng đang trống/); assert.match(html, /Hiện chưa thể chọn địa chỉ/); assert.match(html, /disabled=""/)
  assert.doesNotMatch(html, /Pikachu|950\.000|Saigon Pearl|Đã đặt hàng thành công/)
})
test('Populated local cart preserves item controls but requires revalidation and shows no fake totals', () => {
  const html = authenticated(Cart, { cartItems: [cartItem], onNavigate: () => {}, onUpdateQuantity: () => {}, onRemoveItem: () => {} })
  assert.match(html, /Kiểm tra lại sản phẩm/); assert.match(html, /Số lượng: 2/); assert.match(html, /Mỗi sản phẩm được đặt thành một đơn riêng/)
  assert.doesNotMatch(html, /Miễn phí giao hàng|Đã thanh toán|Voucher đã áp dụng/)
})
test('Payment page explicitly reports unsupported functionality and never offers fake success', () => {
  const html = render(Payment, { onNavigate: () => {} })
  assert.match(html, /không thu tiền hoặc xác nhận giao dịch/); assert.doesNotMatch(html, /Đã thanh toán thành công|Mô phỏng|Tôi đã chuyển khoản/)
})
test('Legacy RFQ/demo cart lines cannot display mock prices or enter direct checkout', () => {
  const html = render(Cart, { cartItems: [{ id: 'demo-legacy', title: 'Pikachu demo', price: 950000 }], onNavigate: () => {} })
  assert.match(html, /Sản phẩm chưa khả dụng/)
  assert.doesNotMatch(html, /950\.000|Pikachu demo|Kiểm tra lại sản phẩm/)
})
test('Customer profile order panel renders backend loading with real identity and no legacy completion code', () => {
  const html = authenticated(Profile, { onNavigate: () => {} })
  assert.match(html, /Tên tài khoản thật/); assert.match(html, /Đang tải/); assert.match(html, /Lịch sử đơn hàng/)
  assert.doesNotMatch(html, /#ORD-2025|Pikachu|1 đang giao|Xác nhận đã nhận bánh|isCurrentOrderDelivered/)
})
test('Vendor dashboard starts loading real counts and hides shared mock badges', () => {
  const html = authenticated(VendorDashboard, { routeSearch: '?bakeryId=' + bakeryId, onNavigate: () => {} }, ['BAKERY_OWNER'])
  assert.match(html, /Đang xác minh quyền quản lý/); assert.doesNotMatch(html, /sc-vendor-kpi-value/)
  assert.doesNotMatch(html, /46\.7M|15 đơn|78%|#ORD-2025/)
})
test('Vendor settings initializes from actual bakery selector and does not display fake saved settings', () => {
  const html = authenticated(VendorSettings, { routeSearch: '?bakeryId=' + bakeryId, onNavigate: () => {} }, ['BAKERY_OWNER'])
  assert.match(html, /Đang tải/); assert.match(html, /Tạo tiệm mới/)
  assert.doesNotMatch(html, /La Crème|Jean-Luc|46\.7M|Thông tin đã lưu thành công/)
})
test('Vendor product list cannot expose editing controls before membership has been confirmed', () => {
  const html = authenticated(ProductManager, { bakeryId }, ['BAKERY_OWNER'])
  assert.match(html, /Đang xác minh quyền quản lý/); assert.match(html, /disabled=""/); assert.match(html, /Đang tải/)
  assert.doesNotMatch(html, /Pikachu|480\.000|Đã đồng bộ/)
})
test('400/401/403/404/409/500/network/loading states replace stale data and offer retry', () => {
  for (const status of [400, 401, 403, 404, 409, 500, 0]) {
    const html = render(ApiState, { resource: { status: 'error', error: { status, message: 'Backend error detail' }, reload: () => {} }, children: 'STALE_DATA' })
    assert.match(html, /role="alert"/); assert.match(html, /Thử lại/); assert.doesNotMatch(html, /STALE_DATA/)
  }
  assert.doesNotMatch(render(ApiState, { resource: { status: 'loading' }, children: 'STALE_DATA' }), /STALE_DATA/)
})
