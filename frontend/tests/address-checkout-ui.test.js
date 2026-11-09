import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
let vite, AuthContext, Picker, Checkout, Cart
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, ws: false, hmr: false } })
  ;({ AuthContext } = await vite.ssrLoadModule('/src/context/useAuth.js'))
  ;({ default: Picker } = await vite.ssrLoadModule('/src/components/orders/AddressPicker.jsx'))
  ;({ default: Checkout } = await vite.ssrLoadModule('/src/components/orders/VerifiedCheckout.jsx'))
  ;({ default: Cart } = await vite.ssrLoadModule('/src/pages/customer/checkout/CartCheckoutPage.jsx'))
})
after(async () => { await vite?.close() })
const render = (component, props, user) => renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user } }, React.createElement(component, props)))
test('Address picker shows the empty address state and allows adding an address', () => {
  const html = render(Picker, { resource: { data: [], status: 'ready' } })
  assert.match(html, /Chưa có địa chỉ nhận bánh/)
  assert.match(html, /Thêm địa chỉ/)
})
test('Checkout requires a customer and a verified address before ordering', () => {
  const item = { catalogSource: 'backend', productId: 'a1000000-0000-4000-8000-000000000001', bakeryId: 'a1000000-0000-4000-8000-000000000002' }
  assert.match(render(Checkout, { items: [item] }, { id: 'owner', roles: ['BAKERY_OWNER'] }), /đăng nhập tài khoản khách hàng/)
  const customer = { id: 'customer', roles: ['CUSTOMER'] }
  assert.match(render(Checkout, { items: [] }, customer), /Chưa có sản phẩm hoặc báo giá API hợp lệ/)
  assert.match(render(Checkout, { items: [item] }, customer), /<button disabled=""[^>]*>Đặt hàng/)
})
test('Empty cart retains its catalog entry without the obsolete address blocker', () => {
  const html = render(Cart, { cartItems: [], onNavigate() {} })
  assert.match(html, /Giỏ hàng đang trống/)
  assert.match(html, /Khám phá bánh/)
  assert.doesNotMatch(html, /Hiện chưa thể chọn địa chỉ/)
})
