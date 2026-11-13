import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { chromium } from 'playwright'
import { startVnpayPreview } from './fixtures/vnpay-preview.mjs'

let server, browser, base
before(async () => {
  server = await startVnpayPreview()
  base = server.resolvedUrls.local[0]
  browser = await chromium.launch({ channel: 'chrome', headless: true })
})
after(async () => { await browser?.close(); await server?.close() })

test('Checkout button redirects to VNPay Sandbox and retains order context without posting an amount', async () => {
  const page = await browser.newPage()
  try {
    await page.route('https://sandbox.vnpayment.vn/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>VNPay test destination</h1>' }))
    await page.goto(base)
    const button = page.getByRole('button', { name: /qua VNPay/ })
    await button.waitFor()
    await button.click()
    await page.waitForURL('https://sandbox.vnpayment.vn/**')
    await page.goto(base)
    const context = await page.evaluate(() => JSON.parse(sessionStorage.getItem('bakery-vnpay-30000000-0000-4000-8000-000000000003')))
    assert.equal(context.orderId, '10000000-0000-4000-8000-000000000001')
  } finally { await page.close() }
})

test('Unconfigured gateway explains recovery and keeps manual evidence available without invented bank details', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  try {
    await page.goto(base + '?scenario=unconfigured')
    await page.getByRole('button', { name: /qua VNPay/ }).click()
    await page.getByRole('alert').filter({ hasText: 'VNPay hiện chưa sẵn sàng' }).waitFor()
    await page.getByText('Gửi chứng từ chuyển khoản', { exact: true }).click()
    await page.getByText(/Chưa có thông tin tài khoản nhận tiền/).waitFor()
    assert.equal(await page.locator('body').innerText().then(text => text.includes('1029384756')), false)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    const requests = await page.evaluate(() => window.__vnpayRequests.filter(request => request.url.includes('/vnpay/checkout')))
    assert.equal(requests.length, 1)
    assert.equal(requests[0].body, undefined)
  } finally { await page.close() }
})

test('Return polls backend state before announcing success and handles cancellation, review and verification failure', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  try {
    await page.goto(base + '?scenario=poll')
    await page.getByRole('heading', { name: 'Đang chờ xác nhận thanh toán' }).waitFor()
    await page.getByRole('heading', { name: 'Thanh toán thành công', exact: true }).waitFor({ timeout: 12000 })
    await page.waitForFunction(() => new URLSearchParams(window.__vnpayNavigation?.split('?')[1]).get('returnTo')?.startsWith('/subscription-plans?tracking=1&orderId='))
    for (const [scenario, title] of [['cancelled', 'Bạn đã hủy thanh toán'], ['review', 'Giao dịch cần được đối soát'], ['invalid', 'Chưa xác minh được thanh toán']]) {
      await page.goto(base + '?scenario=' + scenario)
      await page.getByRole('heading', { name: title, exact: true }).waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      const calls = await page.evaluate(() => window.__vnpayRequests)
      assert.ok(calls.every(call => call.method === 'GET' && !call.url.includes('/ipn')))
    }
  } finally { await page.close() }
})
