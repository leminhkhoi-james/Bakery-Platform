import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { chromium } from 'playwright'

test('User actions stay compact, keyboard accessible and require confirmation before changes', async () => {
  const server = await createServer({ configFile: false, plugins: [react(), tailwindcss(), {
    name: 'user-actions-preview', transformIndexHtml: html => html.replace('/src/main.jsx', '/tests/fixtures/admin-users-preview-entry.jsx'),
  }], server: { host: '127.0.0.1', port: 0, hmr: false } })
  let browser
  try {
    await server.listen()
    browser = await chromium.launch({ channel: 'chrome', headless: true })
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(server.resolvedUrls.local[0])
    const row = page.getByRole('row').filter({ hasText: 'Nguyễn Minh Anh' })
    await row.waitFor()
    assert.equal(await row.getByRole('button').count(), 1)
    const trigger = row.getByRole('button', { name: 'Chỉnh sửa người dùng' })
    const offset = await trigger.evaluate(button => {
      const buttonRect = button.getBoundingClientRect(), cellRect = button.closest('td').getBoundingClientRect()
      return Math.abs((buttonRect.left + buttonRect.right - cellRect.left - cellRect.right) / 2)
    })
    assert.ok(offset < 2)
    await trigger.focus(); await page.keyboard.press('Enter')
    const editor = page.getByRole('dialog', { name: 'Chỉnh sửa người dùng' })
    await editor.getByRole('button', { name: 'Tạm ngưng', exact: true }).click()
    const confirmation = page.getByRole('dialog', { name: 'Tạm ngưng người dùng' })
    await confirmation.waitFor()
    assert.equal(await page.evaluate(() => window.__userWrites.length), 0)
    await confirmation.getByRole('button', { name: 'Hủy', exact: true }).click()
    await editor.getByRole('checkbox', { name: 'Khách hàng', exact: true }).waitFor()
    assert.equal(await editor.getByRole('button', { name: 'Lưu thay đổi', exact: true }).isDisabled(), true)
    await editor.getByRole('button', { name: 'Xóa người dùng', exact: true }).click()
    await page.getByRole('dialog', { name: 'Xác nhận xóa người dùng' }).getByRole('button', { name: 'Hủy', exact: true }).click()
    await editor.getByRole('button', { name: 'Hủy', exact: true }).click()
    await page.setViewportSize({ width: 390, height: 844 })
    // Adaptive pagination remounts rows after resize; locator.click retries that
    // transition and performs the scrolling without retaining a detached node.
    await trigger.click()
    const bounds = await editor.boundingBox()
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390)
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 844)
    assert.equal(await page.evaluate(() => window.__userWrites.length), 0)
  } finally { await browser?.close(); await server.close() }
})
