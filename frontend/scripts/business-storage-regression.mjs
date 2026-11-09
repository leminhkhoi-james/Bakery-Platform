import { chromium } from 'playwright'
import { createBusinessSeed, BUSINESS_STORAGE_KEY } from '../src/mockData/business/seed.js'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'
const base=process.env.SWEETCAKE_BASE_URL||'http://localhost:5173',output=path.resolve(process.env.SWEETCAKE_QA_OUTPUT||'test-results/storage-regression')
assert(process.env.SWEETCAKE_OWNER_PASSWORD&&process.env.SWEETCAKE_ADMIN_PASSWORD,'Set Owner/Admin password environment variables')
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:process.env.HEADED!=='1',...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})})
const report={checks:[],errors:[],writes:[],wrongSource:[],consoleErrors:[],requests:[],counts:{}}
let page
const read=()=>page.evaluate(async key=>{const db=await new Promise((ok,no)=>{const q=indexedDB.open('sweetcake-business-simulation',1);q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});try{return await new Promise((ok,no)=>{const q=db.transaction('state').objectStore('state').get(key);q.onsuccess=()=>ok(JSON.parse(q.result));q.onerror=()=>no(q.error)})}finally{db.close()}},BUSINESS_STORAGE_KEY)
async function login(role){await page.goto(base+'/login');await page.locator('input[type=email]').fill(role==='admin'?'admin@sweetcake.local':'owner@sweetcake.local');await page.locator('input[type=password]').fill(process.env[role==='admin'?'SWEETCAKE_ADMIN_PASSWORD':'SWEETCAKE_OWNER_PASSWORD']);await page.getByRole('button',{name:/Đăng Nhập Vào Tài Khoản/i}).click();await page.waitForURL(u=>!u.pathname.includes('login'))}
async function logout(){
  await page.waitForFunction(() => !document.querySelector('main [aria-busy="true"]'))
  const trigger = page.getByRole('button',{name:/^Tài khoản /})
  await trigger.focus()
  await trigger.press('ArrowDown')
  await page.getByRole('menuitem',{name:/Đăng xuất/}).press('Enter')
  await page.waitForURL(u=>u.pathname==='/login')
}
async function ready(route){await page.goto(base+route);await page.locator('[data-business-metric="Tổng đơn"]').waitFor();assert.equal(await page.locator('[data-business-metric="Đơn trình duyệt"]').innerText(),route.includes('vendor')?'34':'54')}
try{
 for(const legacy of [false,true]){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});page=await context.newPage();page.on('response',r=>{if(r.status()>=400)report.requests.push({url:r.url(),status:r.status()})});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('401'))report.consoleErrors.push(m.text())});page.on('request',r=>{if(r.url().includes('/api/v1/')&&/(?:5c000000|de000000)-0000-4000-8000-/.test(r.url()+(r.postData()||'')))report.wrongSource.push(r.url());if(r.url().includes('/api/v1/')&&!r.url().includes('/auth/')&&!['GET','HEAD'].includes(r.method()))report.writes.push({url:r.url(),method:r.method()})})
  await page.goto(base+'/business-simulation/cake-01.jpeg')
  let original=null
  if(legacy){const state=createBusinessSeed();const image='data:image/jpeg;base64,'+(await readFile(new URL('../public/business-simulation/cake-01.jpeg',import.meta.url))).toString('base64');state.products[0].images[0].url=image;state.receipts.fixture={fingerprint:'old-duplicate-image',result:{url:image}};state.orders[0].customerNote='Ghi chú cũ phải được giữ';original=JSON.stringify(state)}
  const pressure=await page.evaluate(({key,original})=>{if(original)localStorage.setItem(key,original);let low=0,high=6*1024*1024;while(low+1<high){const mid=Math.floor((low+high)/2);try{localStorage.setItem('qa-storage-pressure','x'.repeat(mid));low=mid}catch{high=mid}}let reproduced=false;try{localStorage.setItem('qa-extra-write','x'.repeat(350000))}catch(e){reproduced=e.name==='QuotaExceededError'}return{reproduced,characters:low}}, {key:BUSINESS_STORAGE_KEY,original});assert(pressure.reproduced,'Fixture reproduces exhausted localStorage before app startup');report.checks.push({name:legacy?'Legacy migration with full storage':'Seed while localStorage is full',pressure})
  await login('admin');await ready('/admin-dashboard');let state=await read();assert.equal(state.orders.length,54);assert.equal(state.bakeries.length,3);assert.equal(state.products.length,46);report.counts={orders:state.orders.length,products:state.products.length,shops:state.bakeries.length,users:state.users.length};assert.equal(JSON.stringify(state).includes(';base64,'),false)
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),BUSINESS_STORAGE_KEY),original,'Never changes original localStorage data')
  if(legacy){assert.equal(state.orders[0].customerNote,'Ghi chú cũ phải được giữ');assert(state.products[0].images[0].url.startsWith('sc-business-media:'));const info=await page.evaluate(async()=>{const db=await new Promise(ok=>{const q=indexedDB.open('sweetcake-business-simulation');q.onsuccess=()=>ok(q.result)});try{return await new Promise(ok=>{const tx=db.transaction(['backups','media']);const q=tx.objectStore('backups').get('localStorage-v1-original'),n=tx.objectStore('media').count();tx.oncomplete=()=>ok({backup:q.result.raw,blobs:n.result})})}finally{db.close()}});assert.equal(info.backup,original);assert.equal(info.blobs,1);report.checks.push('Legacy raw backup verified; duplicate base64 becomes one Blob')}
  for(let i=0;i<3;i++){await page.reload();await page.locator('[data-business-metric="Tổng đơn"]').waitFor();const refreshed=await read();assert.equal(refreshed.orders.length,54);assert.deepEqual(refreshed.orders.map(o=>o.id),state.orders.map(o=>o.id));assert.equal(refreshed.anchor,state.anchor)}report.checks.push('Three refreshes: 54 unique orders, stable IDs')
  if(legacy){await context.close();continue}
  await page.screenshot({path:path.join(output,'admin-dashboard.png')});await page.goto(base+'/admin-orders');await page.getByRole('table').waitFor();const body=await page.locator('main').innerText();for(const status of ['Chờ xác nhận','Đã xác nhận','Đang làm bánh','Sẵn sàng giao','Đang giao'])assert(body.includes(status),status)
  const first = await page.locator('table tbody tr').first().innerText()
  await page.getByRole('button',{name:'Trang sau',exact:true}).click()
  await page.waitForFunction(previous => document.querySelector('table tbody tr')?.innerText && document.querySelector('table tbody tr').innerText !== previous, first)
  await page.locator('select').filter({has:page.locator('option[value=PENDING]')}).selectOption('PENDING')
  await page.waitForFunction(() => { const rows = [...document.querySelectorAll('table tbody tr')]; return rows.length && rows.every(row => row.innerText.includes('Chờ xác nhận')) })
  report.checks.push('Admin order pagination and status filter')

  await page.goto(base+'/admin-revenue');await page.locator('[data-business-metric="Doanh thu bán bánh mô phỏng"]').waitFor();assert.notEqual(await page.locator('[data-business-metric="Doanh thu bán bánh mô phỏng"]').innerText(),'0 VND');report.checks.push('Admin Orders statuses and nonzero Revenue KPIs render')
  await logout();await login('owner');await ready('/vendor-dashboard');const owner=await page.locator('[data-business-metric]').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.dataset.businessMetric,n.textContent])));await page.screenshot({path:path.join(output,'owner-dashboard.png')})
  await page.goto(base+'/vendor-orders?bakeryId=5c000000-0000-4000-8000-000000000010&orderId=5c000000-0000-4000-8000-000000100000');await page.getByRole('button',{name:'Xác nhận đơn hàng',exact:true}).click();await page.getByRole('button',{name:'Xác nhận cập nhật',exact:true}).click();await page.waitForFunction(async()=>{const db=await new Promise(ok=>{let q=indexedDB.open('sweetcake-business-simulation');q.onsuccess=()=>ok(q.result)});return await new Promise(ok=>{const q=db.transaction('state').objectStore('state').get('sweetcake.business-simulation.v1');q.onsuccess=()=>{db.close();ok(JSON.parse(q.result).orders[0].status==='CONFIRMED')}})});await page.reload();assert.equal((await read()).orders[0].status,'CONFIRMED');await ready('/vendor-dashboard')
  await logout();await login('admin');await ready('/admin-dashboard');await page.getByLabel('Phạm vi tiệm',{exact:true}).selectOption('91cdf727-8303-4282-83ad-1e1626738509');const admin=await page.locator('[data-business-metric]').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.dataset.businessMetric,n.textContent])));for(const k of ['Tổng đơn','Doanh thu bán bánh mô phỏng','Giá trị đơn hàng'])assert.equal(admin[k],owner[k]);assert.equal((await read()).orders[0].status,'CONFIRMED');report.checks.push('Owner changes order; Admin sees persisted update after logout/login; scoped KPI matches')
  const reviewOrder = (await read()).orders.find(order => order.review?.status === 'PUBLISHED')
  await page.goto(base+'/admin-moderation?kind=review&id='+reviewOrder.id)
  await page.getByRole('checkbox',{name:/Tôi đã kiểm tra đánh giá/}).check()
  await page.getByRole('button',{name:'Ẩn đánh giá',exact:true}).click()
  await page.getByRole('button',{name:'Công khai đánh giá',exact:true}).waitFor()
  assert.equal((await read()).orders.find(order => order.id === reviewOrder.id).review.status, 'HIDDEN')
  report.checks.push('Admin review moderation writes to IndexedDB')

  await context.close()
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.writes,[]);assert.deepEqual(report.wrongSource, [], 'No private IDs sent to API');assert(report.consoleErrors.every(message=>message.includes('Failed to load resource')),'No application console exceptions');console.log(JSON.stringify(report))
}catch(e){report.failure=e.message;if(page&&!page.isClosed()){report.body=await page.locator('body').innerText();await page.screenshot({path:path.join(output,'failure.png')})}console.error(e.message);process.exitCode=1}finally{await writeFile(path.join(output,'result.json'),JSON.stringify(report,null,2));await browser.close()}
