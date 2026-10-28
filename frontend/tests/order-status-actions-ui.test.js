import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { allowedOrderActions } from '../src/services/orderModels.js'

let vite, Actions
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, ws: false, hmr: false } })
  ;({ default: Actions } = await vite.ssrLoadModule('/src/components/orders/OrderStatusActions.jsx'))
})
after(async () => { await vite?.close() })
const render = (status, role, props = {}) => {
  const order = { id: 'order', customerId: 'customer', status }
  const actions = allowedOrderActions(order, { id: role === 'CUSTOMER' ? 'customer' : 'baker', roles: [role] }, role === 'CUSTOMER' ? 'mine' : 'bakery')
  return renderToStaticMarkup(React.createElement(Actions, { order, actions, onConfirm() {}, ...props }))
}
for (const role of ['BAKERY_OWNER']) {
  test(`${role}: only the valid next step is prominent, cancellation ends when baking starts`, () => {
    for (const [status, label] of [['PENDING', 'Xác nhận đơn hàng'], ['CONFIRMED', 'Bắt đầu làm bánh'], ['BAKING', 'Bánh đã sẵn sàng giao'], ['READY', 'Bắt đầu giao hàng'], ['DELIVERING', 'Xác nhận đã giao bánh']]) {
      const html = render(status, role)
      assert.match(html, new RegExp(label)); assert.doesNotMatch(html, /<select/)
      if (status === 'PENDING') assert.match(html, /Từ chối đơn hàng/)
      else if (status === 'CONFIRMED') assert.match(html, /Hủy đơn hàng/)
      else assert.doesNotMatch(html, /Hủy đơn hàng/)
    }
    for (const status of ['COMPLETED', 'CANCELLED']) assert.doesNotMatch(render(status, role), /<button/)
  })
}
test('Customers never see bakery fulfilment actions and controls lock during requests/reloads', () => {
  assert.doesNotMatch(render('PENDING', 'CUSTOMER'), /Xác nhận đơn hàng|Bắt đầu làm bánh/)
  for (const props of [{ busy: true }, { refreshing: true }]) {
    const html = render('CONFIRMED', 'BAKERY_OWNER', props)
    assert.equal((html.match(/<button/g) || []).length, (html.match(/disabled=""/g) || []).length)
    assert.match(html, /aria-busy="true"/)
  }
})

test('Removed staff role cannot confirm or fulfil bakery orders', () => {
  assert.doesNotMatch(render('PENDING', 'BAKERY_STAFF'), /Xác nhận đơn hàng|Hủy đơn hàng/)
  assert.doesNotMatch(render('CONFIRMED', 'BAKERY_STAFF'), /Bắt đầu làm bánh/)
})

test('Admin only monitors orders, including accounts with multiple roles', () => {
  for (const roles of [['ADMIN'], ['ADMIN', 'BAKERY_OWNER'], ['ADMIN', 'CUSTOMER']]) {
    for (const status of ['PENDING', 'CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED']) {
      for (const scope of ['all', 'bakery', 'mine']) assert.deepEqual(allowedOrderActions({ id: 'order', customerId: 'admin', status }, { id: 'admin', roles }, scope), [])
    }
  }
})
