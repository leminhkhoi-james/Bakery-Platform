import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { chromium } from 'playwright'

test('Partner checkout cannot create an order until refreshed profile is approved', async () => {
  const server = await createServer({ configFile: false, plugins: [react(), tailwindcss(), {
    name: 'approval-preview', transformIndexHtml: html => html.replace('/src/main.jsx', '/tests/fixtures/partner-approval-preview-entry.jsx'),
  }], server: { host: '127.0.0.1', port: 0, hmr: false } })
  let browser
  try {
    await server.listen()
    browser = await chromium.launch({ channel: 'chrome', headless: true })
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    await page.goto(server.resolvedUrls.local[0], { waitUntil: 'domcontentloaded' })
    const create = page.getByRole('button', { name: 'Tạo đơn đăng ký gói', exact: true })
    await create.waitFor()
    assert.equal(await create.isDisabled(), true)
    await page.getByText('Chờ hồ sơ được duyệt', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => window.__writes.length), 0)
    await page.screenshot({ path: 'tests/fixtures/partner-approval-pending.png' })
    await page.evaluate(() => { window.__profileStatus = 'ACTIVE' })
    await page.getByRole('button', { name: 'Kiểm tra trạng thái duyệt', exact: true }).click()
    await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(button => button.textContent.includes('Tạo đơn đăng ký gói'))?.disabled)
    await create.click()
    await page.waitForFunction(() => window.__writes.length === 1)
    assert.match(await page.evaluate(() => window.__writes[0]), /subscription-orders/)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: 'tests/fixtures/partner-approval-mobile.png' })
  } finally { await browser?.close(); await server.close() }
})
