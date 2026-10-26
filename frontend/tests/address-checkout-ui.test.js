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
test('Address picker reports the missing original API and exposes no input or write control', () => {
  const html = render(Picker, {})
  assert.match(html, /BLOCKED/); assert.match(html, /role="status"/)
  assert.doesNotMatch(html, /<select|<form|<input|<button/)
})
test('Checkout and accept remain disabled for anonymous, Vendor and Customer users', () => {
  for (const user of [null, { id: 'vendor', roles: ['BAKERY_OWNER'] }, { id: 'customer', roles: ['CUSTOMER'] }]) {
    for (const props of [{ offerId: 'existing-offer' }, { items: [] }]) {
      const html = render(Checkout, props, user)
      assert.match(html, /BLOCKED/); assert.match(html, /disabled=""/)
      assert.doesNotMatch(html, /<form|<input|<select|Thử lại cùng yêu cầu|Thanh toán thành công/)
    }
  }
})
test('Cart retains its empty/catalog entry UI while explicitly blocking checkout', () => {
  const html = render(Cart, { cartItems: [], onNavigate() {} })
  assert.match(html, /Giỏ hàng đang trống/); assert.match(html, /Khám phá bánh/); assert.match(html, /BLOCKED/)
})
