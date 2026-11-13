import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createUnifiedDataService, unifiedIssues, mergeSourceRows, unifiedMetrics } from '../src/services/unifiedDataService.js'
import { createBusinessTransport } from '../src/mockData/business/runtime.js'
import { createBusinessSeed, businessId } from '../src/mockData/business/seed.js'
const realShop='91cdf727-8303-4282-83ad-1e1626738509', realId='a9000000-0000-4000-8000-000000000001'
const response=data=>Response.json({data})
function setup(upstream, owner=false){const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},seed=createBusinessSeed();let user=owner?seed.users.find(u=>u.roles.includes('BAKERY_OWNER')):{id:realId,roles:['ADMIN'],name:'Admin'};const session=()=>({user});const calls=[];const realFetch=async(url,options={})=>{calls.push({url,options});return upstream(new URL(url),options)};const local=createBusinessTransport({storage,getSession:session,defaultEnabled:true,fetch:()=>{throw Error('Local ID leaked upstream')}});const service=createUnifiedDataService({realFetch,local,getSession:session});return{service,calls,seed,user,local,api:async(method,path,body)=>{const r=await service.fetch('/api/v1'+path,{method,...(body===undefined?{}:{body:JSON.stringify(body)})});return{status:r.status,raw:await r.json()}}}}

test('Unified list merges all pages, API wins duplicate IDs, canonical bakery scope and pagination stay coherent',async()=>{const remote={...createBusinessSeed().orders[0],id:realId,bakeryId:realShop,orderNumber:'API-ORDER'},duplicate={...createBusinessSeed().orders[1],bakeryId:realShop,customerName:'API priority'};const f=setup(()=>response({result:[remote,duplicate],meta:{page:1,pageSize:100,pages:1,total:2}}));let r=await f.api('GET','/orders?scope=all&page=1&size=100');assert.equal(r.status,200);assert.equal(r.raw.data.meta.total,55);assert.equal(new Set(r.raw.data.result.map(x=>x.id)).size,55);assert.equal(r.raw.data.result.find(x=>x.id===duplicate.id).customerName,'API priority');assert.equal(r.raw.data.result.find(x=>x.id===duplicate.id)._origin.source,'api');r=await f.api('GET','/orders?scope=all&page=2&size=10');assert.equal(r.raw.data.result.length,10);assert.equal(r.raw.data.meta.pages,6);assert(f.calls.every(c=>!c.url.includes('5c000000')))} )

test('Local order writes never call API; Backend order writes always call API',async()=>{const f=setup((_url,opts)=>response({id:realId,status:JSON.parse(opts.body).targetStatus}));let r=await f.api('POST','/orders/'+businessId(100000)+'/status-transitions',{targetStatus:'CONFIRMED'});assert.equal(r.status,200);assert.equal(f.calls.length,0);assert.equal(f.local.getStore().state.orders[0].status,'CONFIRMED');r=await f.api('POST','/orders/'+realId+'/status-transitions',{targetStatus:'CONFIRMED'});assert.equal(r.status,200);assert.equal(f.calls.length,1);assert(!f.calls[0].url.includes('5c000000'))})

test('API failure is explicitly partial with source error; unauthorized API list is never replaced by local success',async()=>{let status=502;const f=setup(()=>Response.json({message:'API failure'},{status}));let r=await f.api('GET','/orders?scope=all&page=1&size=100');assert.equal(r.raw.sources.api,'error');assert.equal(r.raw.data.meta.total,54);assert.equal(unifiedIssues()[0].status,502);status=403;r=await f.api('GET','/orders?scope=all');assert.equal(r.status,403);assert.equal(r.raw.data,undefined)})

test('API-only creation is not redirected to local and local references are canonicalized only for local actions',async()=>{const f=setup(()=>response({id:realId}));await f.api('POST','/orders/direct',{bakeryId:realShop,items:[]});assert.equal(f.calls.length,1);const r=await f.api('POST','/cake-requests/'+businessId(200013)+'/offers',{bakeryId:realShop,cakePrice:650000,deliveryFee:30000,estimatedCompletionAt:new Date(Date.now()+4*86400000).toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString(),message:'Báo giá thử theo nguồn',items:[]});assert.equal(r.status,201);assert.equal(f.calls.length,1);assert.equal(f.local.getStore().state.offers.length,27)})

test('Owner query maps real shop to local scope without sending local IDs to Backend',async()=>{const f=setup(()=>response({result:[],meta:{page:1,pageSize:100,pages:0,total:0}}),true);const r=await f.api('GET','/orders?scope=bakery&bakeryId='+realShop+'&size=100');assert.equal(r.raw.data.meta.total,34);assert(r.raw.data.result.every(x=>x.bakeryId===realShop));assert(f.calls.every(c=>!c.url.includes('5c000000')))})

test('Financial metrics never add local revenue to real receipts',()=>{const state=createBusinessSeed();state.payments.push({id:realId,bakeryId:businessId(10),status:'APPROVED',amount:100000,reviewedAt:new Date().toISOString(),_origin:{source:'api'}});const m=unifiedMetrics(state,{});assert.equal(m.subscriptionRevenue,100000);assert.equal(m.simulationSubscriptionRevenue,629000);assert.equal(m.realSalesRevenue,null);assert.equal(m.orders,54);assert.equal(mergeSourceRows([{id:realId,value:2}],[{id:realId,value:1}])[0].value,2)})

test('Explicit API-only onboarding moderation never merges simulation or replaces an API error', async () => {
  let status = 200
  const f = setup(() => status === 200 ? response({ result: [], meta: { page: 1, pageSize: 10, pages: 0, total: 0 } }) : Response.json({ message: 'Unavailable' }, { status }))
  const options = { method: 'GET', allowMockFallback: false }
  const result = await f.service.fetch('http://localhost/api/v1/admin/bakeries?page=1&size=10', options)
  assert.deepEqual((await result.json()).data.result, [])
  assert.equal(f.calls.length, 1)
  assert.equal(f.calls[0].url, 'http://localhost/api/v1/admin/bakeries?page=1&size=10')
  status = 503
  assert.equal((await f.service.fetch('http://localhost/api/v1/admin/bakeries', options)).status, 503)
})
