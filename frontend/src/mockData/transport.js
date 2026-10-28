import { collectionPaths, readBody, routeDemo } from './router.js'
import { createDemoStore, DemoError } from './store.js'
import { isDemoId } from './seed.js'

const ids = (value) => typeof value === 'string' ? value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || [] : []
const unwrap = (json) => json && Object.hasOwn(json, 'data') ? json.data : json
function listState(value) {
  if (Array.isArray(value)) return value.length ? 'real' : 'empty'
  if (Array.isArray(value?.result) && value.meta && ['page', 'pageSize', 'pages', 'total'].every((key) => Number.isInteger(value.meta[key])) && value.meta.page > 0 && value.meta.pageSize > 0 && value.meta.total >= 0 && value.meta.pages >= 0) return value.result.length || value.meta.total > 0 ? 'real' : 'empty'
  if (Array.isArray(value?.content) && Number.isInteger(value.totalElements)) return value.content.length || value.totalElements > 0 ? 'real' : 'empty'
  return 'invalid'
}
export function createDemoTransport({ fetch: realFetch, getUser = () => null, store = createDemoStore(), baseUrl = '/api/v1', origin = 'http://localhost', fallbackOnGatewayError = false }) {
  const base = new URL(baseUrl.replace(/\/$/, '') + '/', origin)
  const sources = new Map(), listeners = new Set()
  let revision = 0
  const emit = () => { revision++; for (const fn of listeners) fn() }
  const mark = (key, source) => { if (sources.get(key) !== source) { sources.set(key, source); emit() } }
  store.subscribe(emit)
  const respond = (data, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { 'Content-Type': 'application/json', 'X-SweetCake-Source': 'DEMO' } })
  const run = async (path, method, body, query, signal, headers) => {
    signal?.throwIfAborted()
    try {
      const token = new Headers(headers).get('Idempotency-Key')
      const receiptKey = token && method !== 'GET' ? `${getUser()?.id}:${method}:${path}:${token}` : null
      const fingerprint = JSON.stringify(body)
      const receipt = receiptKey && store.state.receipts?.[receiptKey]
      if (receipt) { store.requireUser(getUser()); if (receipt.roles !== [...(getUser()?.roles || [])].sort().join(',')) throw new DemoError('Quyền tài khoản đã thay đổi.', 403); if (receipt.fingerprint !== fingerprint) throw new DemoError('Khóa idempotency đã dùng với dữ liệu khác.', 409); return respond(receipt.result) }
      const result = routeDemo(store, path, method, body, query, getUser())
      if (receiptKey) { store.state.receipts ||= {}; store.state.receipts[receiptKey] = { fingerprint, result, roles: [...(getUser()?.roles || [])].sort().join(',') }; store.save() }
      signal?.throwIfAborted(); return respond(result)
    }
    catch (error) { if (!(error instanceof DemoError)) throw error; return new Response(JSON.stringify({ message: error.message }), { status: error.status, headers: { 'Content-Type': 'application/json', 'X-SweetCake-Source': 'DEMO' } }) }
  }
  async function fetchWithDemo(input, options = {}) {
    const url = new URL(input instanceof Request ? input.url : String(input), origin)
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return realFetch(input, options)
    const path = '/' + url.pathname.slice(base.pathname.length), method = (options.method || input.method || 'GET').toUpperCase(), get = method === 'GET'
    // Authentication, sessions and permissions: try real backend first; fallback to demo accounts if backend unreachable
    if (/^\/(auth|users|roles)(\/|$)/.test(path)) {
      try {
        const response = await realFetch(input, options)
        if (response.status < 500 && response.status !== 0) return response
      } catch {
        // Backend unavailable, fall through to demo fallback
      }
      if (path === '/auth/login' && method === 'POST') {
        const creds = await readBody(options.body)
        const email = String(creds.email || creds.phone || '').trim().toLowerCase()
        const password = String(creds.password || '')

        const DEMO_ACCOUNTS = {
          'customer@sweetcake.local': { role: 'CUSTOMER', pass: 'Customer@123', name: 'Hân Mai (Customer)', id: 'de000000-0000-4000-8000-000000000001' },
          'owner@sweetcake.local': { role: 'BAKERY_OWNER', pass: 'Owner@123', name: 'Chef Jean-Luc (Owner)', id: 'de000000-0000-4000-8000-000000000002' },
          'admin@sweetcake.local': { role: 'ADMIN', pass: 'Admin@123', name: 'Master Admin', id: 'de000000-0000-4000-8000-000000000003' },
        }

        const account = DEMO_ACCOUNTS[email] ||
          (email.includes('admin') ? DEMO_ACCOUNTS['admin@sweetcake.local'] :
           email.includes('owner') ? DEMO_ACCOUNTS['owner@sweetcake.local'] :
           email.includes('customer') ? DEMO_ACCOUNTS['customer@sweetcake.local'] : null)

        const cleanPassword = password.trim()
        const isMatch = account && (
          !account.pass ||
          cleanPassword === account.pass ||
          cleanPassword.toLowerCase() === account.pass.toLowerCase()
        )

        if (!account || !isMatch) {
          return new Response(JSON.stringify({ message: 'Email hoặc mật khẩu không chính xác.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', 'X-SweetCake-Source': 'DEMO' },
          })
        }

        const mockUser = {
          id: account.id,
          email,
          displayName: account.name,
          roles: [account.role],
          status: 'ACTIVE',
        }
        try { window?.sessionStorage?.setItem('sweetcake_demo_auth_user', JSON.stringify(mockUser)) } catch {}
        store.bind(mockUser)
        return respond({
          accessToken: `demo-jwt-${account.role.toLowerCase()}-${Date.now()}`,
          tokenType: 'Bearer',
          expiresIn: 3600,
        })
      }

      if (path === '/auth/me' && method === 'GET') {
        let savedUser = null
        try { savedUser = JSON.parse(window?.sessionStorage?.getItem('sweetcake_demo_auth_user') || 'null') } catch {}
        const user = savedUser || getUser()
        if (!user?.id) {
          return new Response(JSON.stringify({ message: 'Chưa đăng nhập.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', 'X-SweetCake-Source': 'DEMO' },
          })
        }
        store.bind(user)
        return respond(user)
      }

      if (path === '/auth/refresh' && method === 'POST') {
        let savedUser = null
        try { savedUser = JSON.parse(window?.sessionStorage?.getItem('sweetcake_demo_auth_user') || 'null') } catch {}
        const user = savedUser || getUser()
        if (!user?.id) {
          return new Response(JSON.stringify({ message: 'Phiên đăng nhập đã kết thúc.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', 'X-SweetCake-Source': 'DEMO' },
          })
        }
        return respond({
          accessToken: `demo-jwt-refreshed-${Date.now()}`,
          tokenType: 'Bearer',
          expiresIn: 3600,
        })
      }

      if (path === '/auth/logout' && method === 'POST') {
        try { window?.sessionStorage?.removeItem('sweetcake_demo_auth_user') } catch {}
        return respond(null)
      }

      return new Response(JSON.stringify({ message: 'Backend xác thực không phản hồi.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const body = get ? {} : await readBody(options.body)
    const pathIds = ids(path + url.search), bodyIds = ids(JSON.stringify(body, (key, value) => key === 'clientMessageId' ? undefined : value))
    const demoReference = [...pathIds, ...bodyIds].some(isDemoId)
    const collection = collectionPaths.test(path)
    const key = path + (url.searchParams.get('scope') ? ':scope=' + url.searchParams.get('scope') : '')
    if (path.startsWith('/admin/users/') && sources.get('/admin/users') === 'demo') return run(path, method, body, url.searchParams, options.signal, options.headers)
    if (demoReference) {
      const files = options.body instanceof FormData && [...options.body.entries()].some(([name, value]) => !['metadata', 'request'].includes(name) && value instanceof Blob && value.size > 0)
      if (files) return new Response(JSON.stringify({ message: 'Dữ liệu mẫu chưa hỗ trợ lưu tệp; sử dụng ảnh có sẵn hoặc dữ liệu API thật để upload.' }), { status: 422, headers: { 'Content-Type': 'application/json', 'X-SweetCake-Source': 'DEMO' } })
      // Mixed graphs must never attach a real product/bakery/address to a DEMO record.
      const actorIds = new Set(Object.values(store.state.actors))
      if ([...pathIds, ...bodyIds].some((id) => !isDemoId(id) && !actorIds.has(id) && id !== getUser()?.id)) return new Response(JSON.stringify({ message: 'DEMO: Không kết hợp ID thật và DEMO.' }), { status: 422, headers: { 'Content-Type': 'application/json', 'X-SweetCake-Source': 'DEMO' } })
      mark(key, 'demo')
      return run(path, method, body, url.searchParams, options.signal, options.headers)
    }
    // New records enter DEMO only after this exact collection has fallen back.
    if (!get && collection && (sources.get(key) === 'demo' || sources.get(path + ':scope=mine') === 'demo' || sources.get(path) === 'demo')) {
      if (bodyIds.some((id) => !isDemoId(id))) return new Response(JSON.stringify({ message: 'DEMO: Không gắn dữ liệu thật vào bản ghi DEMO.' }), { status: 422, headers: { 'Content-Type': 'application/json' } })
      return run(path, method, body, url.searchParams, options.signal, options.headers)
    }
    let response
    try {
      response = await realFetch(input, options)
    } catch (err) {
      if (fallbackOnGatewayError) {
        mark(key, 'demo')
        return run(path, method, body, url.searchParams, options.signal, options.headers)
      }
      throw err
    }
    if (fallbackOnGatewayError && [502, 503, 504].includes(response.status)) {
      mark(key, 'demo')
      return run(path, method, body, url.searchParams, options.signal, options.headers)
    }
    if (!get && collection && [404, 405].includes(response.status)) {
      mark(key, 'demo')
      return run(path, method, body, url.searchParams, options.signal, options.headers)
    }
    if (!get || !collection) return response
    // No network errors, 401/403, 5xx, malformed payloads or real mutations are masked.
    if (![404, 405].includes(response.status) && !response.ok) return response
    let state = 'unsupported'
    if (response.ok) { try { state = listState(unwrap(await response.clone().json())) } catch { return response } }
    if (state === 'invalid') return response
    if (state === 'real') { mark(key, 'real'); return response }
    // A filtered empty result/page is not evidence that the real collection is empty.
    const filtered = [...url.searchParams.keys()].some((param) => !['page', 'size', 'sort', 'scope'].includes(param))
    const firstPage = path === '/generation-jobs' ? 0 : 1
    const laterPage = Number(url.searchParams.get('page') ?? firstPage) > firstPage
    if (sources.get(key) === 'real' || state === 'empty' && laterPage && sources.get(key) !== 'demo') return response
    if (state === 'empty' && (filtered || laterPage)) {
      // Some screens initially filter SUBMITTED/OPEN. Verify that the entire real
      // collection is empty before substituting a filtered demonstration result.
      const probe = new URL(url)
      for (const param of [...probe.searchParams.keys()]) if (param !== 'scope') probe.searchParams.delete(param)
      probe.searchParams.set('page', String(firstPage)); probe.searchParams.set('size', '1')
      const verified = await realFetch(probe.href, options)
      if (!verified.ok) return verified
      let rootState
      try { rootState = listState(unwrap(await verified.clone().json())) } catch { return response }
      if (rootState === 'real') { mark(key, 'real'); return response }
      if (rootState !== 'empty') return response
    }
    mark(key, 'demo')
    return run(path, method, body, url.searchParams, options.signal)
  }
  return { fetch: fetchWithDemo, store, sources, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }, getSnapshot: () => revision, runLocal(path, method, body = {}, params = {}) { const result = routeDemo(store, path, method, body, new URLSearchParams(params), getUser()); emit(); return result } }
}
