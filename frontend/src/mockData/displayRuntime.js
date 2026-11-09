import { createDemoStore, DemoError } from './store.js'
import { createSeed, demoId, isDemoId } from './seed.js'
import { collectionPaths, readBody, routeDemo } from './router.js'
import { createUserDirectory } from './admin/userDirectoryStore.js'
import { simulationEnabled } from './business/runtime.js'

export let displayRuntime = null
const unwrap = (body) => body && Object.hasOwn(body, 'data') ? body.data : body
const uuidValues = (value) => JSON.stringify(value ?? '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || []
function listState(data) {
  if (Array.isArray(data)) return data.length ? 'real' : 'empty'
  if (Array.isArray(data?.result) && ['page', 'pageSize', 'pages', 'total'].every((key) => Number.isInteger(data.meta?.[key])) && data.meta.page >= 1 && data.meta.pageSize > 0 && data.meta.pages >= 0 && data.meta.total >= 0) return data.result.length || data.meta.total ? 'real' : 'empty'
  if (Array.isArray(data?.content) && ['page', 'size', 'totalElements', 'totalPages'].every((key) => Number.isInteger(data[key])) && data.page >= 0 && data.size > 0 && data.totalElements >= 0 && data.totalPages >= 0) return data.content.length || data.totalElements ? 'real' : 'empty'
  return 'invalid'
}
const slot = (user) => user?.roles?.includes('ADMIN') ? 'admin' : user?.roles?.includes('BAKERY_OWNER') ? 'vendor' : 'customer'
const role = (name) => ({ admin: 'ADMIN', vendor: 'BAKERY_OWNER', customer: 'CUSTOMER' }[name])

const response = (data, status = 200) => Response.json(status < 400 ? { data } : { message: data }, { status, headers: { 'X-SweetCake-Source': 'DEMO' } })

// Display only: never restores mock auth, writes storage, syncs, or executes a mock mutation.
export function createDisplayTransport({ fetch: realFetch, storage, getSession = () => ({}), emptyDemo = false, origin = 'http://localhost', baseUrl = '/api/v1' }) {
  const original = createDemoStore(storage, { readOnly: true })
  const store = { ...original, get state() { return original.state }, bind() {}, reload() {}, save() { throw new DemoError('Bản xem DEMO chỉ đọc.', 422) } }
  const base = new URL(baseUrl.replace(/\/$/, '') + '/', origin)
  const sources = new Map(), listeners = new Set()
  let revision = 0, actor = ''
  const emit = () => { revision++; listeners.forEach((listener) => listener()) }
  const mark = (key, source) => { if (sources.get(key) !== source) { sources.set(key, source); emit() } }
  const userDirectory = createUserDirectory({ storage, seedUsers: store.state.users, protectedIds: Object.values(store.state.actors), linkedIds: [...store.state.orders.map((row) => row.customerId), ...store.state.bakeries.map((row) => row.ownerId)], onChange: emit })
  const viewer = (user) => {
    if (!user) return null
    const name = slot(user)
    const id = store.state.actors[name] || store.state.users.find((person) => person.roles?.includes(role(name)))?.id
    return { ...user, id: id || user.id }
  }
  const readDemo = (path, params = {}) => {
    const user = getSession().user, local = viewer(user)
    let data
    const membership = /^\/bakeries\/([^/]+)\/members$/.exec(path)
    if (path === '/admin/users') {
      store.requireUser(user, 'ADMIN')
      data = userDirectory.list(Object.fromEntries(new URLSearchParams(params)))
    } else if (membership) {
      const shop = store.find('bakeries', membership[1])
      store.bakeryAccess(local, shop.id)
      data = store.state.members.filter((member) => member.bakeryId === shop.id)
      if (!data.some((member) => member.userId === shop.ownerId) && shop.ownerId) data = [...data, { id: demoId(800000 + store.state.bakeries.indexOf(shop)), bakeryId: shop.id, userId: shop.ownerId, memberRole: 'OWNER', status: 'ACTIVE', displayNameSnapshot: store.state.users.find((person) => person.id === shop.ownerId)?.name }]
    } else if (path === '/bakeries/onboarding') data = store.state.bakeries.find((shop) => shop.ownerId === local?.id) || null
    else if (path === '/sample-addresses') data = store.state.addresses.filter((address) => address.customerId === local?.id)
    else data = routeDemo(store, path, 'GET', {}, new URLSearchParams(params), local)
    // Ownership in the display DTO follows the viewer; the saved graph stays untouched.
    const project = (item) => Array.isArray(item) ? item.map(project) : item && typeof item === 'object' ? Object.fromEntries(Object.entries(item).map(([key, value]) => [key, project(value)])) : user && local?.id !== user.id && item === local?.id ? user.id : item
    return project(data)
  }
  const keyFor = (path, query) => {
    return path + (query.get('scope') ? ':scope=' + query.get('scope') : '')
  }
  async function fetchDisplay(input, options = {}) {
    const url = new URL(input instanceof Request ? input.url : String(input), origin)
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return realFetch(input, options)
    const path = '/' + url.pathname.slice(base.pathname.length)
    const method = (options.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
    if (/^\/(?:auth|users|roles)(?:\/|$)/.test(path)) return realFetch(input, options)
    const session = getSession(), identity = (session.source || 'real') + ':' + (session.user?.id || '') + ':' + (session.user?.roles || []).join(',')
    if (actor !== identity) { actor = identity; sources.clear(); emit() }
    const preview = session.source === 'demo'
    const key = keyFor(path, url.searchParams)
    // A real customer's requests and an owner's offers must share the server's
    // graph, even when the public/demo catalog is empty in this browser.
    if (!preview && (options.allowMockFallback === false || /^\/(?:cake-requests|offers)(?:\/|$)/.test(path))) {
      const upstream = await realFetch(input, options)
      mark(key, upstream.ok ? 'real' : 'error')
      return upstream
    }
    const references = uuidValues(path + url.search)
    const demoReference = references.some(isDemoId)
    const privateRead = !/^\/(?:products(?:\/[^/]+)?|bakeries(?:\/[^/]+)?|subscription-plans(?:\/[^/]+)?)$/.test(path) || path === '/bakeries/onboarding'
    const localResponse = () => {
      options.signal?.throwIfAborted()
      try { const data = readDemo(path, url.searchParams); mark(key, 'demo'); return response(data) }
      catch (error) { if (!(error instanceof DemoError)) throw error; return response(error.message, error.status) }
    }
    if (method !== 'GET' && method !== 'HEAD') {
      const body = await readBody(options.body)
      if (preview || demoReference || uuidValues(body).some(isDemoId) || sources.get(key) === 'demo' || [...sources].some(([name, source]) => source === 'demo' && name.startsWith(path + ':scope='))) return response('DEMO chỉ dùng để xem dữ liệu. Thao tác chưa được gửi hoặc lưu trên Backend.', 422)
      return realFetch(input, options)
    }
    if (demoReference || preview && privateRead) return localResponse()
    const upstream = await realFetch(input, options)
    // Only this known missing collection gets a 404/405/501 display replacement.
    if (path === '/admin/users' && [404, 405, 501].includes(upstream.status)) return localResponse()
    if (!upstream.ok) { mark(key, 'error'); return upstream }
    if (!collectionPaths.test(path)) { mark(key, 'real'); return upstream }
    let state
    try { state = listState(unwrap(await upstream.clone().json())) } catch { return upstream }
    if (state !== 'empty' || !emptyDemo || references.length || sources.get(key) === 'real') { if (state === 'real') mark(key, 'real'); return upstream }
    const firstPage = path === '/generation-jobs' ? 0 : 1
    if (Number(url.searchParams.get('page') ?? firstPage) > firstPage && sources.get(key) !== 'demo') return upstream
    const filtered = [...url.searchParams.keys()].some((param) => !['page', 'size', 'sort', 'scope'].includes(param))
    if (filtered) {
      const probe = new URL(url)
      for (const param of [...probe.searchParams.keys()]) if (param !== 'scope') probe.searchParams.delete(param)
      probe.searchParams.set('page', String(firstPage)); probe.searchParams.set('size', '1')
      const verified = await realFetch(probe.href, options)
      if (!verified.ok) return verified
      let rootState
      try { rootState = listState(unwrap(await verified.clone().json())) } catch { return upstream }
      if (rootState !== 'empty') { if (rootState === 'real') mark(key, 'real'); return upstream }
    }
    return localResponse()
  }

  return {
    fetch: fetchDisplay, read: readDemo, store, sources, emptyDemo, userDirectory,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) }, getSnapshot: () => revision,
    previewUser(value) {
      if (!emptyDemo || !['CUSTOMER', 'BAKERY_OWNER', 'ADMIN'].includes(value)) throw new Error('Chỉ bật xem role khi đã cấu hình DEMO.')
      const name = slot({ roles: [value] })
      const person = store.state.users.find((user) => user.id === store.state.actors[name]) || store.state.users.find((user) => user.roles?.includes(value)) || createSeed().users.find((user) => user.roles.includes(value))
      return { ...person, displayName: person.displayName || person.name, roles: [value] }
    },
  }
}

export function installDisplayData(getSession, configuration = {}) {
  if (displayRuntime || typeof window === 'undefined') return displayRuntime
  let storage
  try { storage = window.localStorage } catch { /* Display can use the original seed in memory. */ }
  displayRuntime = createDisplayTransport({ fetch: window.fetch.bind(window), storage, getSession, origin: window.location.origin, baseUrl: import.meta.env?.VITE_API_BASE_URL || '/api/v1', emptyDemo: import.meta.env?.VITE_DEMO_EMPTY_DATA === 'true', ...configuration })
  window.fetch = displayRuntime.fetch
  return displayRuntime
}
export const displayDataSource = (data) => simulationEnabled() ? 'simulation' : displayRuntime && (uuidValues(data).some(isDemoId) || data?.localCrud && displayRuntime.sources.get('/admin/users') === 'demo') ? 'demo' : 'real'
export function readPreviewBakeries() {
  return displayRuntime?.read('/bakeries', { page: '1', size: '100' }).result || []
}
