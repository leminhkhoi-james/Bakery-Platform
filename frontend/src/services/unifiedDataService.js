import { readBody } from '../mockData/router.js'
import { businessMetrics } from '../mockData/business/metrics.js'

const privateId = value => /^(?:5c000000|de000000)-0000-4000-8000-/.test(String(value || ''))
const ownedRole = session => session?.user?.roles?.some(role => ['ADMIN', 'BAKERY_OWNER'].includes(role))
const sessionKey = session => [session?.user?.id || '', ...(session?.user?.roles || []).slice().sort()].join(':')
const businessPath = /^\/(?:bakeries|products|orders|cake-requests|offers|conversations|subscription-plans|subscription-orders|admin)(?:\/|$)/
let active = null
const emit = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('sweetcake:unified-updated')) }
export const unifiedEnabled = () => Boolean(active && ownedRole(active.session()))
export const unifiedIssues = () => { active?.ensureActor(); return unifiedEnabled() ? [...active.issues.values()] : [] }
export const recordSource = row => row?._origin?.source || (active?.apiIds.has(row?.id) ? 'api' : privateId(row?.id) ? 'local' : 'api')
export const canonicalBakeryId = id => active?.aliases().toApi.get(id) || id
export const localBakeryId = id => active?.aliases().toLocal.get(id) || id
export function localBakeryFor(id) {
  const store = unifiedEnabled() ? active.getStore() : null
  if (!store) return null
  const localId = localBakeryId(id)
  try {
    store.bakeryAccess(active.session().user, localId)
    return { ...store.find('bakeries', localId), id: canonicalBakeryId(localId) }
  } catch { return null }
}
export function localSubscriptionFor(id) {
  if (!localBakeryFor(id)) return null
  const now = Date.now()
  return active.getStore().state.subscriptions.find(period => period.bakeryId === localBakeryId(id) &&
    period.status === 'ACTIVE' && Date.parse(period.periodStart) <= now && Date.parse(period.periodEnd) > now) || null
}

const kindFor = path => /\/bakery-payments(?:\/|$)/.test(path) ? 'payments' : /\/subscription-plans(?:\/|$)/.test(path) ? 'plans' : /\/cake-requests(?:\/|$)/.test(path) ? 'requests' : /\/subscription-orders(?:\/|$)/.test(path) ? 'subscriptionOrders' : /\/users(?:\/|$)/.test(path) ? 'users' : /\/categories(?:\/|$)/.test(path) ? 'categories' : /\/products(?:\/|$)/.test(path) ? 'products' : /\/offers(?:\/|$)/.test(path) ? 'offers' : /\/orders(?:\/|$)/.test(path) ? 'orders' : /\/conversations(?:\/|$)/.test(path) ? 'conversations' : 'bakeries'
const listPath = path => /^\/(?:products|bakeries|orders|cake-requests|offers|conversations|subscription-plans|admin\/(?:bakeries|users|bakery-payments|subscription-plans))$/.test(path) || /^\/bakeries\/[^/]+\/(?:products|categories|members|add-ons|offers|subscription-orders)$/.test(path)
const unpack = raw => raw && Object.hasOwn(raw, 'data') ? raw.data : raw
const respond = (data, sources, status = 200) => Response.json({ data, ...(sources ? { sources } : {}) }, { status, headers: { 'X-SweetCake-Source': 'UNIFIED', 'Cache-Control': 'no-store' } })
const failure = (message, status = 422) => Response.json({ message }, { status })
export function mergeSourceRows(apiRows, localRows, identity = row => row?.id || row?.product?.id) {
  const rows = new Map()
  for (const row of localRows) rows.set(identity(row), row)
  for (const row of apiRows) rows.set(identity(row), row)
  return [...rows.values()]
}
export function createUnifiedDataService({ realFetch, local, getSession, origin = 'http://localhost', fallbackFetch = realFetch }) {
  const issues = new Map(), apiIds = new Set(), cache = new Map(), complete = new Set()
  let actor = ''
  const aliases = () => {
    const state = local.getStore()?.state, toApi = new Map(), toLocal = new Map()
    for (const [key, field] of [['bakeries','sourceBakeryId'],['plans','sourcePlanId']]) for (const row of state?.[key] || []) if (row[field]) { toApi.set(row.id,row[field]); toLocal.set(row[field],row.id) }
    return { toApi, toLocal }
  }
  const transform = (value, map, source, kind, key = '') => {
    if (typeof value === 'string') return ['bakeryId','targetBakeryId','sourceBakeryId'].includes(key) ? map.toApi.get(value) || value : value
    if (Array.isArray(value)) return value.map(row => transform(row,map,source,kind))
    if (!value || typeof value !== 'object') return value
    const result = Object.fromEntries(Object.entries(value).map(([field,child]) => [field,transform(child,map,source,kind,field)]))
    if (result.id) {
      if (source === 'api') apiIds.add(result.id)
      result._origin = { source, id: result.id }
      if (kind === 'bakeries' && map.toApi.has(result.id)) result.id = map.toApi.get(result.id)
      if (kind === 'payments' && result.amount != null && Number.isFinite(Number(result.amount))) result.amount = Number(result.amount)
    }
    return result
  }
  const rewrite = (value, map) => {
    if (typeof value === 'string') return map.get(value) || value
    if (Array.isArray(value)) return value.map(row => rewrite(row,map))
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,row]) => [key,rewrite(row,map)]))
    return value
  }
  function localUrl(url, map) { const result = new URL(url); result.pathname = result.pathname.split('/').map(id => map.toLocal.get(id) || id).join('/'); for (const [key,value] of result.searchParams) result.searchParams.set(key,map.toLocal.get(value)||value); return result }
  function realUrl(url, map) { const result = new URL(url); result.pathname = result.pathname.split('/').map(id => map.toApi.get(id) || id).join('/'); for (const [key,value] of result.searchParams) result.searchParams.set(key,map.toApi.get(value)||value); return result }
  function optionsBody(options, body, map) {
    const original = JSON.stringify(body)
    const serialized = JSON.stringify(rewrite(body, map))
    if (serialized === original) return options
    if (options.body instanceof FormData) {
      const form = new FormData()
      for (const [key, value] of options.body) {
        if (!['metadata', 'request'].includes(key)) form.append(key, value)
        else if (value instanceof Blob) form.append(key, new Blob([serialized], { type: value.type || 'application/json' }), value.name)
        else form.append(key, serialized)
      }
      return { ...options, body: form }
    }
    return typeof options.body === 'string' ? { ...options, body: serialized } : options
  }
  function resetActor() { const id = sessionKey(getSession()); if (actor !== id) { actor = id; issues.clear(); apiIds.clear(); cache.clear(); complete.clear() } }
  function note(path, error, source = 'api') { issues.set(source + ':' + path, { path, source, status: error.status || 0 }); emit() }
  function resolved(path, source = 'api') { if (issues.delete(source + ':' + path)) emit() }
  function remember(kind,rows) { const values = cache.get(kind)||new Map(); for (const row of rows) { const item=row.product?{...row.product,bakeryId:row.bakeryId,images:row.images,options:row.options,_origin:row._origin}:row; if (item.id) values.set(item.id,item) } cache.set(kind,values); emit() }
  async function collect(fetch,url,options) {
    const first = new URL(url); first.searchParams.set('page','1'); first.searchParams.set('size','100')
    let data,rows=[],shape='array',seen=new Set()
    for (let page=1,pages=1;page<=pages;page++) {
      first.searchParams.set('page',String(page))
      const response=await fetch(first.href,options)
      if (!response.ok) { const error=new Error('API collection failed'); error.status=response.status; error.response=response; throw error }
      data=unpack(await response.json())
      if (Array.isArray(data)) return { rows:data,shape:'array' }
      if (!Array.isArray(data?.result)||!data.meta||data.meta.page!==page||!Number.isInteger(data.meta.pages)||data.meta.pages>500) throw Object.assign(new Error('Invalid collection response'),{status:502})
      shape='page'; pages=data.meta.pages
      for (const row of data.result) { const id=row.id||row.product?.id; if (!id||seen.has(id)) throw Object.assign(new Error('Repeated or invalid collection IDs'),{status:502}); seen.add(id); rows.push(row) }
      if (page<pages&&!data.result.length) throw Object.assign(new Error('Incomplete API pages'),{status:502})
      if (page>=pages&&rows.length!==data.meta.total) throw Object.assign(new Error('Inconsistent API total'),{status:409})
    }
    return {rows,shape}
  }
  const identity = (row,map,kind) => { const entity=row.product||row,id=entity.id; return ['bakeries','plans'].includes(kind)?map.toApi.get(id)||id:id }
  async function mergedList(url, path, options, map, actorId) {
    const kind = kindFor(path)
    const remoteUrl = realUrl(url, map)
    const savedUrl = localUrl(url, map)
    const userSearch = kind === 'users' ? (url.searchParams.get('email') || '').toLocaleLowerCase('vi') : ''
    if (kind === 'users') {
      remoteUrl.searchParams.delete('email')
      if (remoteUrl.searchParams.get('status') === 'SUSPENDED') remoteUrl.searchParams.set('status', 'BLOCKED')
      if (savedUrl.searchParams.get('status') === 'BLOCKED') savedUrl.searchParams.set('status', 'SUSPENDED')
    }
    const [remote, saved] = await Promise.allSettled([
      collect(realFetch, remoteUrl, options),
      collect(local.fetch, savedUrl, options),
    ])
    options.signal?.throwIfAborted()
    if (sessionKey(getSession()) !== actorId) return failure('Phiên đăng nhập đã thay đổi.', 409)
    if (remote.status === 'rejected' && [401, 403].includes(remote.reason.status)) {
      return remote.reason.response || failure('Không đủ quyền truy cập API thật.', remote.reason.status)
    }
    if (remote.status === 'rejected') note(path, remote.reason)
    else resolved(path)
    if (saved.status === 'rejected' && remote.status !== 'fulfilled') note(path, saved.reason, 'local')
    else resolved(path, 'local')
    if (remote.status === 'rejected' && saved.status === 'rejected') {
      return remote.reason.response || failure('Chưa tải được các nguồn dữ liệu.', 503)
    }
    const apiRows = remote.status === 'fulfilled' ? transform(remote.value.rows, map, 'api', kind) : []
    const localRows = saved.status === 'fulfilled' ? transform(saved.value.rows, map, 'local', path.startsWith('/admin/bakeries') ? 'adminBakeries' : kind) : []
    if (remote.status === 'fulfilled' && !path.endsWith('/add-ons')) {
      if ([...url.searchParams.keys()].every(key => ['page', 'size', 'sort', 'scope'].includes(key))) {
        cache.delete(kind)
        complete.add(kind)
      }
      remember(kind, apiRows)
    }
    const scopedLocalRows = localRows.filter(row => {
      if (remote.status !== 'fulfilled') return true
      if (kind === 'users') return privateId(row.id)
      if (path === '/subscription-plans') return !map.toApi.has(row.id)
      if (path === '/admin/bakeries' && url.searchParams.has('status')) return !map.toApi.has(row.id)
      return true
    })
    const rows = mergeSourceRows(apiRows, scopedLocalRows, row => identity(row, map, kind))
      .filter(row => !userSearch || [row.displayName, row.name, row.email].join(' ').toLocaleLowerCase('vi').includes(userSearch))
    const sources = { api: remote.status === 'fulfilled' ? 'ready' : 'error', local: saved.status === 'fulfilled' ? 'ready' : 'error' }
    const shape = remote.status === 'fulfilled' ? remote.value.shape : saved.value.shape
    if (shape === 'array') return respond(rows, sources)
    const [field, direction] = (url.searchParams.get('sort') || 'createdAt,desc').split(',')
    rows.sort((a, b) => {
      const x = a.product?.[field] ?? a[field] ?? '', y = b.product?.[field] ?? b[field] ?? ''
      const compare = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
      return compare * (direction === 'asc' ? 1 : -1) || String(a.id || a.product?.id).localeCompare(String(b.id || b.product?.id))
    })
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const size = Math.min(100, Math.max(1, Number(url.searchParams.get('size')) || 20))
    return respond({ result: rows.slice((page - 1) * size, page * size), meta: { page, pageSize: size, total: rows.length, pages: Math.ceil(rows.length / size) } }, sources)
  }
  const containsLocalId = value => (String(value).match(/(?:5c000000|de000000)-0000-4000-8000-[0-9a-f]{12}/gi) || []).some(id => !apiIds.has(id))
  async function fetchUnified(input, options = {}) {
    resetActor()
    const url = new URL(input instanceof Request ? input.url : String(input), origin)
    const path = url.pathname.slice('/api/v1'.length)
    const method = (options.method || 'GET').toUpperCase()
    // Explicit API requests must bypass simulation, aliases and merged local records,
    // while still indexing returned API records so unifiedSnapshot() & unifiedMetrics() stay accurate.
    if (url.origin === origin && url.pathname.startsWith('/api/v1/') && options.allowMockFallback === false) {
      try {
        const response = await realFetch(input, options)
        if (!response.ok) {
          if (response.status >= 500) note(path, { status: response.status })
          return response
        }
        resolved(path)
        if (method === 'GET') {
          const raw = await response.clone().json().catch(() => null)
          const unpacked = unpack(raw)
          if (listPath(path)) {
            const rows = Array.isArray(unpacked) ? unpacked : Array.isArray(unpacked?.result) ? unpacked.result : null
            if (rows) {
              const kind = kindFor(path)
              const apiRows = transform(rows, aliases(), 'api', kind)
              const unfiltered = [...url.searchParams.keys()].every(key => ['page', 'size', 'sort', 'scope'].includes(key))
              const singlePage = Array.isArray(unpacked) || (unpacked?.meta?.page === 1 && unpacked?.meta?.pages <= 1)
              if (unfiltered && singlePage) {
                cache.delete(kind)
                complete.add(kind)
              } else if (unfiltered && unpacked?.meta?.page >= unpacked?.meta?.pages) {
                complete.add(kind)
              }
              remember(kind, apiRows)
            }
          } else if (unpacked?.id) {
            const kind = kindFor(path)
            remember(kind, [transform(unpacked, aliases(), 'api', kind)])
          }
        }
        return response
      } catch (error) {
        if (options.signal?.aborted || error.name === 'AbortError') throw error
        note(path, error)
        throw error
      }
    }
    if (url.origin !== origin || !url.pathname.startsWith('/api/v1/') || !businessPath.test(path) || !ownedRole(getSession())) {
      return fallbackFetch(input, options)
    }
    const map = aliases()
    const parts = path.split('/').filter(Boolean)
    const actorId = sessionKey(getSession())
    const localRecord = parts.some((id, index) => privateId(id) && !apiIds.has(id) &&
      !(index === 1 && parts[0] === 'bakeries' && map.toApi.has(id)))
    const destination = realUrl(url, map)
    const localScope = containsLocalId(destination.search)
    try {
      const body = await readBody(options.body)
      const localReference = [body.cakeRequestId, body.offerId, body.subscriptionOrderId, path.endsWith('/subscription-orders') ? body.planId : null].some(id => privateId(id) && !apiIds.has(id))
      if (method === 'GET' && listPath(path) && !path.endsWith('/members') && !localRecord && !localScope) {
        return await mergedList(url, path, options, map, actorId)
      }
      if (localRecord || localScope || method !== 'GET' && localReference) {
        const response = await local.fetch(localUrl(url, map).href, optionsBody(options, body, map.toLocal))
        if (!response.ok || response.status === 204) return response
        const data = transform(unpack(await response.json()), map, 'local', path.startsWith('/admin/bakeries/') ? 'adminBakeries' : kindFor(path))
        emit()
        return respond(data, undefined, response.status)
      }
      const request = optionsBody(options, body, map.toApi)
      const serialized = request.body instanceof FormData
        ? JSON.stringify(rewrite(body, map.toApi)) + ' ' + [...request.body.values()].filter(value => typeof value === 'string').join(' ')
        : request.body || ''
      if (containsLocalId(destination.href) || containsLocalId(serialized)) {
        return failure('Không thể dùng tham chiếu trình duyệt trong thao tác Backend.')
      }
      const response = await realFetch(destination.href, request)
      options.signal?.throwIfAborted()
      if (sessionKey(getSession()) !== actorId) return failure('Phiên đăng nhập đã thay đổi.', 409)
      if (!response.ok) {
        if (response.status >= 500) note(path, { status: response.status })
        return response
      }
      resolved(path)
      const raw = await response.clone().json().catch(() => null)
      const kind = kindFor(path)
      const data = transform(unpack(raw), map, 'api', kind)
      if (method !== 'GET') {
        cache.delete(kind)
        complete.delete(kind)
        emit()
      }
      return raw ? respond(data, undefined, response.status) : response
    } catch (error) {
      if (options.signal?.aborted || error.name === 'AbortError') throw error
      note(path, error)
      return failure('Chưa thể tải nguồn dữ liệu. Vui lòng thử lại.', error.status || 503)
    }
  }
  const service={ensureActor:resetActor,fetch:fetchUnified,session:getSession,issues,apiIds,cache,complete,aliases,getStore:local.getStore,enabled:()=>ownedRole(getSession()),getError:local.getError,isUnified:true}
  active=service
  return service
}
export function unifiedSnapshot() {
  if(!unifiedEnabled())return null
  active.ensureActor()
  const store=active.getStore();if(!store)return null;store.reload()
  const state=structuredClone(store.state),map=active.aliases()
  for(const kind of ['orders','offers','requests','products','bakeries','categories','plans','payments','users','subscriptionOrders','conversations']) {
    const rows=(state[kind]||[]).map(row=>({...row,bakeryId:map.toApi.get(row.bakeryId)||row.bakeryId,...(kind==='bakeries'?{id:map.toApi.get(row.id)||row.id}:{}),_origin:{source:'local',id:row.id}}))
    const apiRows=[...(active.cache.get(kind)?.values()||[])].map(row=>kind==='payments'&&!row.bakeryId?{...row,bakeryId:active.cache.get('subscriptionOrders')?.get(row.subscriptionOrderId)?.bakeryId}:row)
    state[kind]=mergeSourceRows(apiRows,rows,row=>['products','categories','plans'].includes(kind)?map.toApi.get(row.id)||row.id:row.id)
  }
  state.apiPaymentsComplete = active.complete.has('payments') && !active.issues.has('api:/admin/bakery-payments')
  state.salesPayments=state.salesPayments.map(row=>({...row,bakeryId:map.toApi.get(row.bakeryId)||row.bakeryId}))
  return state
}
export function unifiedMetrics(state,scope) {
  const all=businessMetrics(state,scope),local={...state,orders:state.orders.filter(row=>recordSource(row)==='local'),payments:state.payments.filter(row=>recordSource(row)==='local')},api={...state,orders:state.orders.filter(row=>recordSource(row)==='api'),payments:state.payments.filter(row=>recordSource(row)==='api'),salesPayments:[]}
  const mock=businessMetrics(local,scope),real=businessMetrics(api,scope)
  return {...all,salesRevenue:mock.salesRevenue,subscriptionRevenue:state.apiPaymentsComplete === false ? null : real.subscriptionRevenue,simulationSalesRevenue:mock.salesRevenue,simulationSettledCount:mock.settledCount,simulationSubscriptionRevenue:mock.subscriptionRevenue,realSalesRevenue:null,apiOrders:real.orders,localOrders:mock.orders}
}
