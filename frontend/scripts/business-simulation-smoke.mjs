import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const base = process.env.SWEETCAKE_BASE_URL || 'http://localhost:5173'
const output = path.resolve(process.env.SWEETCAKE_QA_OUTPUT || 'test-results/business-simulation')
const accounts = [
  { role: 'owner', email: process.env.SWEETCAKE_OWNER_EMAIL || 'owner@sweetcake.local', password: process.env.SWEETCAKE_OWNER_PASSWORD, routes: ['vendor-dashboard', 'vendor-menu', 'vendor-orders', 'vendor-rfq', 'vendor-chat', 'vendor-subscription', 'vendor-revenue', 'vendor-profile'] },
  { role: 'admin', email: process.env.SWEETCAKE_ADMIN_EMAIL || 'admin@sweetcake.local', password: process.env.SWEETCAKE_ADMIN_PASSWORD, routes: ['admin-dashboard', 'admin-users', 'admin-vendors', 'admin-orders', 'admin-payments', 'admin-plans', 'admin-revenue', 'admin-moderation', 'admin-rfq'] },
]
assert(accounts.every(actor => actor.password), 'Set both SWEETCAKE_OWNER_PASSWORD and SWEETCAKE_ADMIN_PASSWORD.')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: process.env.HEADED !== '1', ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) })

async function savedGraph(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const query = indexedDB.open('sweetcake-business-simulation', 1); query.onsuccess = () => resolve(query.result); query.onerror = () => reject(query.error) })
    try { return await new Promise((resolve, reject) => { const query = db.transaction('state').objectStore('state').get('sweetcake.business-simulation.v1'); query.onsuccess = () => resolve(query.result); query.onerror = () => reject(query.error) }) } finally { db.close() }
  })
}

const result = { pages: [], errors: [], network: [], expectedUnauthenticatedRefresh: [], writes: [], wrongSource: [], kpi: {} }
try {
  for (const actor of accounts) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    let authenticated = false
    page.on('pageerror', error => result.errors.push({ role: actor.role, message: error.message }))
    page.on('request', request => {
      if (request.url().includes('/api/v1/') && /(?:5c000000|de000000)-0000-4000-8000-/.test(request.url() + (request.postData() || ''))) {
        result.wrongSource.push(request.url())
      }
      if (request.url().includes('/api/v1/') && !request.url().includes('/auth/') && !['GET', 'HEAD'].includes(request.method())) result.writes.push({ method: request.method(), url: request.url() })
    })
    page.on('response', response => {
      if (!authenticated && response.url().endsWith('/api/v1/auth/refresh') && response.status() === 401) { result.expectedUnauthenticatedRefresh.push({ role: actor.role, status: 401 }); return }
      if (response.url().includes('/api/v1/') && response.status() >= 400) result.network.push({ status: response.status(), url: response.url() })
    })
    await page.goto(base + '/login')
    await page.locator('input[type=email]').fill(actor.email)
    await page.locator('input[type=password]').fill(actor.password)
    await page.getByRole('button', { name: /Đăng Nhập Vào Tài Khoản/i }).click()
    await page.waitForURL(url => !url.pathname.includes('login'))
    authenticated = true
    for (const route of actor.routes) {
      await page.goto(base + '/' + route)
      await page.getByRole('button', { name: /^Tài khoản / }).waitFor()
      await page.waitForFunction(() => !document.querySelector('main [aria-busy="true"]'))
      result.pages.push({ role: actor.role, route, alerts: await page.getByRole('alert').allTextContents() })
      if (route.endsWith('dashboard')) {
        await page.locator('[data-business-metric]').first().waitFor()
        if (actor.role === 'admin') await page.getByLabel('Phạm vi tiệm', { exact: true }).selectOption('91cdf727-8303-4282-83ad-1e1626738509')
        result.kpi[actor.role] = await page.locator('[data-business-metric]').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.dataset.businessMetric, node.textContent])))
        const snapshot = await savedGraph(page)
        assert(snapshot, 'Persistent store must exist')
        await page.reload()
        await page.getByRole('button', { name: /^Tài khoản / }).waitFor()
        assert.equal(await savedGraph(page), snapshot, 'Reload preserves stored graph')
        await page.screenshot({ path: path.join(output, actor.role + '-desktop.png') })
        await page.setViewportSize({ width: 390, height: 844 })
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No page-level mobile overflow')
        await page.screenshot({ path: path.join(output, actor.role + '-mobile.png') })
        await page.setViewportSize({ width: 1440, height: 1000 })
      }
    }
    await context.close()
  }
  for (const metric of ['Tổng đơn', 'Hoàn thành', 'Đã hủy', 'Doanh thu bán bánh mô phỏng', 'Doanh thu gói mô phỏng']) {
    assert.equal(result.kpi.owner[metric], result.kpi.admin[metric], 'Identical bakery scope gives identical ' + metric)
  }
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.wrongSource, [], 'No private IDs sent to API')
  if (result.network.length) console.log('Backend HTTP responses recorded in result.json')
  assert.deepEqual(result.writes, [])
  console.log('PASS: routes, persistence, mobile, scoped KPIs and source routing')
} finally {
  await writeFile(path.join(output, 'result.json'), JSON.stringify(result, null, 2))
  await browser.close()
}
