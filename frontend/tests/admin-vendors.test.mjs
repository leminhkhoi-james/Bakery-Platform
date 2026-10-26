import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// Exercise the page's real event handlers without adding a DOM/test dependency.
// Only this page's hooks are replaced; child components still use React normally.
let slots = [], cursor = 0
globalThis.__vendorPageHooks = {
  useState(initial) {
    const slot = cursor++
    if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial
    return [slots[slot], (value) => {
      slots[slot] = typeof value === 'function' ? value(slots[slot]) : value
    }]
  },
  useMemo: (calculate) => calculate(),
}
const server = await createServer({
  server: { middlewareMode: true, hmr: false }, appType: 'custom',
  plugins: [{ name: 'vendor-page-events', enforce: 'pre', transform(code, id) {
    if (!id.replaceAll('\\', '/').endsWith('/admin/vendors/AdminVendorsPage.jsx')) return
    return code.replace("import React, { useState, useMemo } from 'react'",
      "import React from 'react'; const { useState, useMemo } = globalThis.__vendorPageHooks")
  } }],
})
after(async () => { await server.close(); delete globalThis.__vendorPageHooks })
const { default: Page } = await server.ssrLoadModule('/src/pages/admin/vendors/AdminVendorsPage.jsx')
const { INITIAL_VENDORS, VENDOR_OVERVIEW_METRICS } = await server.ssrLoadModule('/src/mockData/admin/vendors.js')
let tree
function render(reset = false) {
  if (reset) slots = []
  cursor = 0
  tree = Page({})
  return tree
}
function elements(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => elements(child, predicate))
  if (!node || typeof node !== 'object') return []
  return [...(predicate(node) ? [node] : []), ...elements(node.props?.children, predicate)]
}
const find = (predicate, root = tree) => {
  const element = elements(root, predicate)[0]
  assert.ok(element, 'Expected control is available')
  return element
}
const content = (node) => {
  if (Array.isArray(node)) return node.map(content).join('')
  return node && typeof node === 'object' ? content(node.props?.children) : String(node ?? '')
}
const button = (label, root = tree) => find((node) => node.type === 'button' && content(node).trim().endsWith(label), root)
const click = (label, root) => { button(label, root).props.onClick(); render() }
const change = (label, value) => {
  find((node) => node.props?.['aria-label'] === label).props.onChange({ target: { value } })
  render()
}
const rows = () => elements(find((node) => node.type === 'tbody'), (node) => node.type === 'tr')
const row = (id) => find((node) => node.type === 'tr' && content(node).includes(id))
const headerActions = () => find((node) => node.props?.topActions).props.topActions
const markup = () => renderToStaticMarkup(tree)

test('six columns retain identity, status and actions; counters match the source', () => {
  render(true)
  assert.equal(elements(tree, (node) => node.type === 'th').length, 6)
  assert.equal(rows().length, INITIAL_VENDORS.length)
  assert.match(markup(), /Tất cả \(6\)/)
  assert.match(markup(), /Hoạt động \(3\)/)
  assert.match(content(headerActions()), /Duyệt hồ sơ \(2\)/)
  for (const vendor of INITIAL_VENDORS) {
    const text = content(row(vendor.id))
    for (const value of [vendor.name, vendor.chef, vendor.statusLabel, vendor.legalBadge]) assert.ok(text.includes(value))
    assert.ok(!text.includes(vendor.rating))
    assert.ok(!text.includes(vendor.certification))
    assert.ok(!text.includes(vendor.slaOnTime))
    const actions = elements(row(vendor.id), (node) => node.type === 'button')
    assert.equal(actions.length, ['pending', 'needs_info'].includes(vendor.status) ? 2 : 3)
    const expectedIcon = vendor.status === 'pending' ? 'visibility' : vendor.status === 'needs_info' ? 'drafts' : 'soup_kitchen'
    assert.ok(text.includes(expectedIcon))
    for (const action of actions) assert.equal(typeof action.props.onClick, 'function')
  }
})

test('four compact KPI cards preserve the existing overview demo data', () => {
  render(true)
  const section = find((node) => node.type === 'section' && content(node).includes('Tiệm hoạt động'))
  const cards = section.props.children.filter((node) => node?.type === 'div')
  assert.equal(cards.length, 4)
  assert.match(content(cards[2]), /Đánh giá tốt/)
  assert.ok(content(cards[2]).includes(VENDOR_OVERVIEW_METRICS.goodRatingPercent.toFixed(1)))
  assert.match(content(cards[3]), /Giao đúng hạn/)
  assert.ok(content(cards[3]).includes(VENDOR_OVERVIEW_METRICS.onTimeDeliveryPercent.toFixed(1)))
  for (const card of cards) assert.match(card.props.className, /p-3/)
})

test('search, combined region/specialty, tabs, empty results and reset work', () => {
  render(true)
  change('Tìm tiệm bánh', '  vend-01  ')
  assert.equal(rows().length, 1)
  assert.match(content(rows()), /La Crème/)
  change('Tìm tiệm bánh', 'Kim Min-seo')
  assert.match(content(rows()), /Sweet Mochi/)
  change('Tìm tiệm bánh', '')
  change('Khu vực', 'q1')
  change('Chuyên môn', 'french')
  assert.equal(rows().length, 2)
  click('Hoạt động (3)')
  assert.equal(rows().length, 1)
  change('Tìm tiệm bánh', 'no-such-bakery')
  assert.match(content(rows()), /Không tìm thấy tiệm bánh/)
  assert.equal(find((node) => node.type === 'td').props.colSpan, 6)
  assert.match(content(tree), /0–0/)
  click('Xóa bộ lọc')
  assert.equal(rows().length, 6)
})

test('approval picks the next pending record and disables when none remain', () => {
  render(true)
  click('Phê Duyệt Ngay', row('VEND-88'))
  assert.match(content(row('VEND-88')), /Đang mở lò/)
  assert.match(content(headerActions()), /Duyệt hồ sơ \(1\)/)
  click('Duyệt hồ sơ (1)', headerActions())
  assert.match(content(find((node) => node.type === 'h2')), /Dark Velvet/)
  click('Phê duyệt')
  assert.equal(button('Duyệt hồ sơ (0)', headerActions()).props.disabled, true)
  assert.match(markup(), /Hoạt động \(5\)/)
})

test('active/suspended actions, fee changes, requests and detail data remain available', () => {
  render(true)
  find((node) => node.props?.['aria-label'] === 'Tạm khóa La Crème Pâtisserie').props.onClick()
  render()
  click('Tạm ngưng (1)')
  assert.equal(rows().length, 1)
  assert.match(content(rows()), /Tạm ngưng nhận đơn/)
  find((node) => node.props?.['aria-label'] === 'Mở khóa La Crème Pâtisserie').props.onClick()
  render()
  click('Tất cả (6)')
  find((node) => node.props?.['aria-label'] === 'Cấu hình phí La Crème Pâtisserie').props.onClick()
  render()
  find((node) => node.type === 'select' && node.props.value === '5.0%').props.onChange({ target: { value: '8.0%' } })
  render()
  find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
  render()
  find((node) => node.props?.['aria-label'] === 'Xem chi tiết La Crème Pâtisserie').props.onClick()
  render()
  assert.match(content(tree), /Le Cordon Bleu Paris/)
  assert.match(content(tree), /99.5% đúng hẹn/)
  assert.match(content(tree), /8.0%/)
  click('Thẩm tra lại')
  assert.match(content(row('VEND-01')), /Yêu cầu thẩm tra lại/)
  click('Gửi Yêu Cầu', row('VEND-45'))
  assert.match(content(tree), /Đã gửi SMS/)
})

test('restored detail icons open each original profile and pending activation keeps its button', () => {
  render(true)
  assert.ok(button('Duyệt Mở Sàn', row('VEND-92')))
  for (const id of ['VEND-88', 'VEND-45', 'VEND-01']) {
    const record = INITIAL_VENDORS.find((vendor) => vendor.id === id)
    const details = elements(row(id), (node) => node.type === 'button')
      .find((node) => /visibility|drafts|soup_kitchen/.test(content(node)))
    details.props.onClick()
    render()
    assert.equal(content(find((node) => node.type === 'h2')), record.name)
    assert.ok(content(tree).includes(record.certification))
    click('Đóng')
  }
  click('Duyệt Mở Sàn', row('VEND-92'))
  assert.match(content(row('VEND-92')), /Đang mở lò/)
})

test('inviting a seventh bakery enables pagination and filters reset the page', () => {
  render(true)
  click('Mời tiệm bánh', headerActions())
  for (const [placeholder, value] of [['Ví dụ: Maison Des Fleurs Pâtisserie', 'Tiệm kiểm thử'], ['0912 345 678', '0900000000']]) {
    find((node) => node.props?.placeholder === placeholder).props.onChange({ target: { value } })
    render()
  }
  find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
  render()
  assert.match(markup(), /Tất cả \(7\)/)
  assert.equal(rows().length, 6)
  find((node) => node.props?.['aria-label'] === 'Trang sau').props.onClick()
  render()
  assert.equal(rows().length, 1)
  assert.match(content(tree), /7–7/)
  assert.equal(find((node) => node.props?.['aria-label'] === 'Trang sau').props.disabled, true)
  change('Khu vực', 'q1')
  assert.match(content(tree), /1–3/)
})
