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
    assert.equal(await row.getByRole('button').count(), 2)
    const trigger = row.getByRole('button', { name: /Thao tác khác/ })
    await trigger.click()
    await page.getByRole('button', { name: 'Khóa tài khoản', exact: true }).waitFor()
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('.sc-user-actions-popover:popover-open').count(), 0)
    await trigger.focus(); await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Khóa tài khoản', exact: true }).click()
    await page.getByRole('dialog').waitFor()
    assert.equal(await page.evaluate(() => window.__userWrites.length), 0)
    await page.getByRole('dialog').getByRole('button', { name: 'Hủy', exact: true }).click()
    await row.getByRole('button', { name: 'Phân quyền', exact: true }).click()
    await page.getByRole('dialog').getByRole('checkbox', { name: 'Khách hàng', exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Lưu vai trò', exact: true }).isDisabled(), true)
    await page.getByRole('dialog').getByRole('button', { name: 'Hủy', exact: true }).click()
    await page.screenshot({ path: 'tests/fixtures/admin-users-desktop.png' })
    await page.setViewportSize({ width: 390, height: 844 })
    await trigger.scrollIntoViewIfNeeded(); await trigger.click()
    const bounds = await page.locator('.sc-user-actions-popover:popover-open').boundingBox()
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390)
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 844)
    await page.screenshot({ path: 'tests/fixtures/admin-users-mobile.png' })
    assert.equal(await page.evaluate(() => window.__userWrites.length), 0)
  } finally { await browser?.close(); await server.close() }
})
