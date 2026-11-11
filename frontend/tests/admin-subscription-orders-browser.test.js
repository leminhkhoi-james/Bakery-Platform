import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { chromium } from 'playwright'
import { startAdminOrdersPreview } from './fixtures/admin-orders-preview.mjs'

let browser, server, base
before(async () => {
  server = await startAdminOrdersPreview()
  base = server.resolvedUrls.local[0]
  browser = await chromium.launch({ channel: 'chrome', headless: true })
})
after(async () => { await browser?.close(); await server?.close() })

test('Default directory includes pending 499k orders; details explain why approval is blocked', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    await page.goto(base, { waitUntil: 'commit', timeout: 20000 })
    const row = page.getByRole('row').filter({ hasText: 'SUB-10FE239D' })
    await row.waitFor({ timeout: 60000 })
    assert.match(await row.innerText(), /499\.000/)
    assert.equal(await row.getByRole('button', { name: 'Đối chiếu để duyệt' }).isDisabled(), true)
    await row.getByRole('button', { name: 'Xem đơn', exact: true }).click()
    await page.getByRole('heading', { name: 'Chi tiết đơn mua gói', exact: true }).waitFor()
    await page.getByText('Khách chưa gửi chứng từ và hệ thống chưa ghi nhận thanh toán thành công.').waitFor()
    assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'Đối chiếu để duyệt' }).isDisabled(), true)
    assert.equal(await page.evaluate(() => window.__adminOrderRequests.some(item => item.method === 'POST')), false)
  } catch (error) { console.error(error.message); throw error }
  finally { await page.close() }
})

test('Eligibility filter reaches API and opens the existing confirmation flow only for matching evidence', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    await page.goto(base, { waitUntil: 'commit', timeout: 20000 })
    await page.getByRole('row').filter({ hasText: 'SUB-10FE239D' }).waitFor({ timeout: 60000 })
    await page.getByLabel('Điều kiện duyệt', { exact: true }).selectOption('ready')
    await page.getByRole('button', { name: 'Lọc', exact: true }).click()
    await page.getByText('1 đơn mua gói theo bộ lọc', { exact: true }).waitFor()
    assert.equal(await page.getByRole('row').filter({ hasText: 'SUB-10FE239D' }).count(), 0)
    await page.getByRole('button', { name: 'Đối chiếu để duyệt', exact: true }).click()
    await page.getByRole('heading', { name: 'Đối chiếu chứng từ mua gói', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Phê duyệt thanh toán' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Phê duyệt thanh toán' }).isDisabled(), false)
    const requests = await page.evaluate(() => window.__adminOrderRequests)
    assert.ok(requests.some(item => item.query.includes('eligibleForApproval=true')))
    assert.ok(requests.every(item => item.method === 'GET'))
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  } catch (error) { console.error(error.message); throw error }
  finally { await page.close() }
})
