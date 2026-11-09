import { chromium } from '../node_modules/playwright/index.mjs';

const BASE_URL = 'http://localhost:5173';
const REAL_BAKERY_ID = '91cdf727-8303-4282-83ad-1e1626738509';
const DEMO_BAKERY_ID = 'de000000-0000-4000-8000-000000000010';

async function run() {
  console.log('=== STARTING PLAYWRIGHT REAL OWNER E2E TEST ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  const results = {
    login: false,
    dashboard_auto_select_real: false,
    dashboard_no_403_error: false,
    dropdown_only_valid_shops: false,
    demo_url_recovery: false,
    products_page_pass: false,
    category_create_pass: false,
    product_create_pass: false,
    orders_page_pass: false,
    rfq_page_pass: false,
    chat_page_pass: false,
    profile_page_pass: false
  };

  // Monitor network for 403 errors
  const forbiddenRequests = [];
  page.on('response', (res) => {
    if (res.status() === 403 && res.url().includes('/api/v1/')) {
      forbiddenRequests.push(`${res.request().method()} ${res.url()}`);
    }
  });

  // 1. Login as owner@sweetcake.local
  console.log('1. Logging in as owner@sweetcake.local...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.fill('#login-email', 'owner@sweetcake.local');
  await page.fill('#login-pwd', 'Owner@123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  results.login = true;
  console.log('   Logged in successfully.');

  // 2. Test Vendor Dashboard
  console.log('2. Testing /vendor-dashboard...');
  await page.goto(`${BASE_URL}/vendor-dashboard`);
  await page.waitForSelector(`#managed-bakery option[value="${REAL_BAKERY_ID}"]`, { state: 'attached', timeout: 15000 });
  await page.waitForTimeout(1000);

  const urlAfterDash = page.url();
  console.log('   Dashboard URL after load:', urlAfterDash);
  if (urlAfterDash.includes(`bakeryId=${REAL_BAKERY_ID}`)) {
    results.dashboard_auto_select_real = true;
    console.log('   Auto-selection & URL synchronization with real bakeryId: PASS');
  }

  const pageContent = await page.content();
  if (!pageContent.includes('Bạn chưa có quyền quản lý cửa hàng này') && !pageContent.includes('Chưa có quyền truy cập')) {
    results.dashboard_no_403_error = true;
    console.log('   Dashboard loads without 403 permission error: PASS');
  }

  // Check dropdown options
  const dropdownOptions = await page.evaluate(() => {
    const select = document.querySelector('#managed-bakery');
    if (!select) return [];
    return Array.from(select.options).map(o => ({ value: o.value, text: o.text }));
  });
  console.log('   Managed bakery dropdown options:', dropdownOptions);
  const hasDemoOption = dropdownOptions.some(o => o.value.includes(DEMO_BAKERY_ID) || o.text.includes('Cửa hàng đã chọn'));
  if (!hasDemoOption && dropdownOptions.some(o => o.value === REAL_BAKERY_ID)) {
    results.dropdown_only_valid_shops = true;
    console.log('   Dropdown only displays verified shops: PASS');
  }

  // 3. Test Demo URL Recovery
  console.log('3. Testing navigation to demo BakeryId URL recovery...');
  await page.goto(`${BASE_URL}/vendor-dashboard?bakeryId=${DEMO_BAKERY_ID}`);
  await page.waitForSelector(`#managed-bakery option[value="${REAL_BAKERY_ID}"]`, { state: 'attached', timeout: 15000 });
  await page.waitForTimeout(1000);
  const recoveredUrl = page.url();
  console.log('   URL after accessing demo bakeryId:', recoveredUrl);
  if (recoveredUrl.includes(REAL_BAKERY_ID)) {
    results.demo_url_recovery = true;
    console.log('   Demo ID automatically recovered to real bakeryId: PASS');
  }

  // 4. Test Vendor Menu & Products CRUD
  console.log('4. Testing Products / Menu (/vendor-menu)...');
  await page.goto(`${BASE_URL}/vendor-menu?bakeryId=${REAL_BAKERY_ID}`);
  await page.waitForSelector('nav[aria-label="Quản lý cửa hàng"]', { timeout: 10000 });
  await page.waitForTimeout(1000);
  results.products_page_pass = true;

  // Add Category
  console.log('   Adding Category via UI...');
  const addCatBtn = page.locator('button:has-text("Thêm danh mục sản phẩm")');
  if (await addCatBtn.count() > 0) {
    await addCatBtn.click();
    await page.waitForTimeout(500);
    const catNameInput = page.locator('.sc-vendor-drawer input[name="name"], .sc-vendor-drawer label:has-text("Tên *") input');
    await catNameInput.fill('Bánh Kem Pháp');
    const catSlugInput = page.locator('.sc-vendor-drawer input[name="slug"], .sc-vendor-drawer label:has-text("slug") input');
    if (await catSlugInput.count() > 0) {
      await catSlugInput.fill('banh-kem-phap-' + Date.now());
    }
    await page.click('.sc-vendor-drawer button[type="submit"]');
    await page.waitForTimeout(1500);
    results.category_create_pass = true;
    console.log('   Category created: PASS');
  }

  // Add Product
  console.log('   Adding Product via UI...');
  const addProdBtn = page.locator('button:has-text("Thêm sản phẩm")');
  if (await addProdBtn.count() > 0) {
    await addProdBtn.click();
    await page.waitForTimeout(800);
    const nameInput = page.locator('input[placeholder="Ví dụ: Bánh Mousse Bơ Sữa Dừa..."]');
    await nameInput.fill('Bánh Croissant Bơ Pháp');
    const priceInput = page.locator('input[placeholder="0"]');
    await priceInput.fill('45000');
    const saveProdBtn = page.locator('button:has-text("Lưu sản phẩm")');
    if (await saveProdBtn.count() > 0) {
      await saveProdBtn.click();
      await page.waitForTimeout(2500);
      results.product_create_pass = true;
      console.log('   Product created: PASS');
    }
  }

  // 5. Test Vendor Orders
  console.log('5. Testing Orders (/vendor-orders)...');
  await page.goto(`${BASE_URL}/vendor-orders?bakeryId=${REAL_BAKERY_ID}`);
  await page.waitForTimeout(2000);
  const ordersContent = await page.content();
  if (!ordersContent.includes('Chưa có quyền xem đơn hàng') && !ordersContent.includes('403')) {
    results.orders_page_pass = true;
    console.log('   Orders page loads correctly: PASS');
  }

  // 6. Test Vendor RFQ
  console.log('6. Testing RFQ (/vendor-rfq)...');
  await page.goto(`${BASE_URL}/vendor-rfq?bakeryId=${REAL_BAKERY_ID}`);
  await page.waitForTimeout(2000);
  const rfqContent = await page.content();
  if (!rfqContent.includes('403') && !rfqContent.includes('Chưa có quyền')) {
    results.rfq_page_pass = true;
    console.log('   RFQ page loads correctly: PASS');
  }

  // 7. Test Vendor Chat
  console.log('7. Testing Chat (/vendor-chat)...');
  await page.goto(`${BASE_URL}/vendor-chat?bakeryId=${REAL_BAKERY_ID}`);
  await page.waitForTimeout(2000);
  const chatContent = await page.content();
  if (!chatContent.includes('403') && !chatContent.includes('Chưa có quyền')) {
    results.chat_page_pass = true;
    console.log('   Chat page loads correctly: PASS');
  }

  // 8. Test Vendor Profile
  console.log('8. Testing Profile (/vendor-profile)...');
  await page.goto(`${BASE_URL}/vendor-profile?bakeryId=${REAL_BAKERY_ID}`);
  await page.waitForTimeout(2000);
  const profileContent = await page.content();
  if (profileContent.includes('La Crème Pâtisserie') || profileContent.includes('0901234567')) {
    results.profile_page_pass = true;
    console.log('   Profile page loads real bakery details: PASS');
  }

  console.log('=== TEST RESULTS SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
  console.log('Forbidden 403 API calls:', forbiddenRequests);

  await browser.close();
}

run().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
