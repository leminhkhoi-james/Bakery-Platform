import { createUnifiedDataService } from '../../services/unifiedDataService.js'
import { openBusinessPersistence, persistBusinessFile, storageMessage } from './persistence.js'
import { createDemoStore, DemoError, validSave } from '../store.js'
import { routeDemo, readBody } from '../router.js'
import { createBusinessSeed, BUSINESS_STORAGE_KEY, BUSINESS_MODE_KEY, isBusinessId } from './seed.js'
import { businessUserDirectory } from './userDirectory.js'
import { businessAttachments, attachBusinessProof, businessMediaView, businessMediaUrl } from './media.js'

let runtime = null
const eligible = (session) => session?.user?.roles?.some(role => ['ADMIN', 'BAKERY_OWNER'].includes(role))
const reply = (data, status = 200) => Response.json(status < 400 ? { data } : { message: data }, { status, headers: { 'X-SweetCake-Source': 'SIMULATION', 'Cache-Control': 'no-store' } })
export function createBusinessStore(storage) {
  if (!storage?.getItem || !storage?.setItem) throw new Error('Trình duyệt chưa cho phép lưu dữ liệu thực hành. Không có thay đổi nào được lưu.')
  let raw = storage?.getItem(BUSINESS_STORAGE_KEY)
  if (raw) {
    const saved = JSON.parse(raw)
    if (!validSave(saved) || saved.businessVersion !== 1) throw new Error('Không thể đọc dữ liệu thực hành đã lưu. Dữ liệu được giữ nguyên.')
  } else raw = JSON.stringify(createBusinessSeed())
  const base = createDemoStore({ getItem: () => raw }, { readOnly: true })
  const listeners = new Set()
  const store = { ...base,
    reload() {
      if (store.inTransaction) return
      const value = storage?.getItem(BUSINESS_STORAGE_KEY)
      if (value) { const data = JSON.parse(value); if (!validSave(data) || data.businessVersion !== 1) throw new DemoError('Không thể đọc dữ liệu đã lưu.', 409); Object.assign(base.state, data) }
    },
    async refresh() { await store.pendingSave; await storage.refresh?.(); store.reload() },
    bind(user) {
      base.requireUser(user)
      if (user.roles.includes('ADMIN')) {
        base.state.actors.admin = user.id
        if (!base.state.users.some(person => person.id === user.id)) base.state.users.push({ ...user, displayName: user.displayName || user.name, name: user.displayName || user.name, status: 'ACTIVE' })
      }
    },
    save() {
      if (store.inTransaction) return
      const saved = storage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(base.state))
      const notify = () => { store.reload(); listeners.forEach(fn => fn()); if (typeof window !== 'undefined') window.dispatchEvent(new Event('sweetcake:api-mutated')) }
      if (!saved?.then) return notify()
      store.pendingSave = saved.then(notify).finally(() => { store.pendingSave = null })
      return store.pendingSave
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    createOrder(user, input, offer) {
      const order = base.createOrder(user, input, offer)
      order.orderNumber = 'SC-' + base.state.nextId
      order.paymentStatus = 'UNPAID'
      base.state.salesPayments.push({ id: base.id(), orderId: order.id, bakeryId: order.bakeryId, amount: order.totalAmount, currency: order.currency, status: 'PENDING', createdAt: order.createdAt })
      return order
    },
  }
  if (!storage.initialized) store.save()
  return store
}

export function createBusinessTransport({ fetch: fallbackFetch, realFetch = fallbackFetch, getSession, storage, defaultEnabled = false, businessStorage = storage, storageError = null, origin = 'http://localhost' }) {
  let store = null
  let initializationError = storageError
  const enabled = () => { try { const setting = storage?.getItem(BUSINESS_MODE_KEY); return eligible(getSession()) && (setting === 'on' || setting === null && defaultEnabled) } catch (error) { initializationError = error; return false } }
  const getStore = () => { if (!enabled()) return null; try { if (initializationError) throw initializationError; store ||= createBusinessStore(businessStorage); return store } catch (error) { initializationError = error; return null } }
  const businessPath = /^\/(?:bakeries|products|orders|cake-requests|offers|conversations|subscription-plans|subscription-orders|admin)(?:\/|$)/
  async function fetchBusiness(input, options = {}) {
    const url = new URL(input instanceof Request ? input.url : String(input), origin)
    if (url.origin !== origin || !url.pathname.startsWith('/api/v1/')) return fallbackFetch(input, options)
    const path = url.pathname.slice('/api/v1'.length), method = (options.method || 'GET').toUpperCase()
    if (!businessPath.test(path)) return fallbackFetch(input, options)
    if (!eligible(getSession())) {
      if (/5c000000-0000-4000-8000-/.test(path + url.search + (typeof options.body === 'string' ? options.body : ''))) return reply('Dữ liệu thực hành không được gửi đến Backend.', 422)
      return fallbackFetch(input, options)
    }
    if (!enabled()) {
      if (/(?:5c000000|de000000)-0000-4000-8000-/.test(path + url.search + (typeof options.body === 'string' ? options.body : ''))) return reply('Bản ghi thuộc không gian mô phỏng. Vui lòng tải lại dữ liệu thật.', 422)
      return realFetch(input, options)
    }
    let snapshot
    try {
      const current = getStore(), user = getSession().user
      if (!current) throw initializationError || new Error('Không thể mở dữ liệu thực hành.')
      await current.refresh(); current.bind(user)
      const body = await readBody(options.body)
      const idempotency = new Headers(options.headers).get('Idempotency-Key')
      const receiptKey = idempotency && method !== 'GET' ? user.id + ':' + method + ':' + path + ':' + idempotency : null
      const fileSignatures = []
      if (receiptKey && options.body instanceof FormData) for (const [name, file] of options.body.entries()) if (file instanceof Blob && !['metadata', 'request'].includes(name)) {
        const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
        fileSignatures.push([name, file.name, file.type, [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')])
      }
      const fingerprint = JSON.stringify([body, fileSignatures]), existing = receiptKey && current.state.receipts[receiptKey]
      if (existing) { if (existing.fingerprint !== fingerprint) throw new DemoError('Mã yêu cầu đã dùng với nội dung khác.', 409); return reply(businessMediaView(existing.result)) }
      snapshot = structuredClone(current.state)
      current.inTransaction = true
      const segments = path.split('/').filter(Boolean)
      if (method === 'DELETE' && segments[0] === 'bakeries' && segments[2] === 'categories' && current.state.products.some(product => product.categoryId === segments[3])) throw new DemoError('Danh mục còn sản phẩm. Chuyển sản phẩm sang danh mục khác trước khi xóa.', 409)
      if (method === 'POST' && (segments[0] === 'bakeries' && segments[4] === 'publish' || segments[0] === 'cake-requests' && segments[2] === 'offers')) {
        const bakeryId = segments[0] === 'bakeries' ? segments[1] : body.bakeryId
        current.bakeryAccess(user, bakeryId, true)
        if (current.find('bakeries', bakeryId).status !== 'ACTIVE' || !current.state.subscriptions.some(period => period.bakeryId === bakeryId && period.status === 'ACTIVE' && Date.parse(period.periodStart) <= Date.now() && Date.parse(period.periodEnd) > Date.now())) throw new DemoError('Tiệm cần gói dịch vụ đang hiệu lực.', 422)
        if (segments[0] === 'bakeries') { const product = current.find('products', segments[3]); if (product.bakeryId !== bakeryId || !(product.basePrice >= 0) || !product.images?.some(image => image.primary || image.isPrimary)) throw new DemoError('Sản phẩm cần giá hợp lệ và ảnh chính trước khi mở bán.', 422) }
      }
      if (method === 'POST' && segments[0] === 'subscription-orders' && segments[2] === 'payments') {
        const order = current.find('subscriptionOrders', segments[1])
        if (Number(body.amount) !== order.totalAmount || body.currency !== order.currency || Date.parse(order.expiresAt) <= Date.now() || !body.paymentMethod || (!body.paymentReference?.trim() && !options.body?.get?.('proof')?.size)) throw new DemoError('Kiểm tra số tiền, thời hạn và thông tin phiếu thu.', 422)
      }
      let data
      if (path === '/bakeries/onboarding' && method === 'GET') data = current.state.bakeries.find(b => b.ownerId === user.id) || null
      else if (path === '/admin/users' && method === 'GET') { current.requireUser(user, 'ADMIN'); data = businessUserDirectory(current).list(Object.fromEntries(url.searchParams)) }
      else if (path === '/subscription-plans/payment-options' && method === 'GET') data = { sandboxEnabled: false, bankTransfer: { bankName: 'Sổ thu nội bộ', accountNumber: 'Không chuyển tiền', accountName: 'SweetCake — thực hành' } }
      else if (segments[0] === 'bakeries' && segments[2] === 'subscription' && method === 'GET') {
        const bakeryId = segments[1]; current.bakeryAccess(user, bakeryId)
        const periods = current.state.subscriptions.filter(period => period.bakeryId === bakeryId)
        const active = periods.find(period => period.status === 'ACTIVE' && Date.parse(period.periodEnd) > Date.now()) || null
        data = { bakeryId, currentSubscription: active, scheduledSubscription: periods.find(period => period.status === 'SCHEDULED') || null, features: active?.featuresSnapshot || {} }
      }
      else if (segments[0] === 'bakeries' && segments[2] === 'products' && segments[4] === 'images' && method === 'POST') {
        current.bakeryAccess(user, segments[1], true)
        const product = current.find('products', segments[3]), files = options.body?.getAll?.('files') || []
        if (product.bakeryId !== segments[1]) throw new DemoError('Sản phẩm không thuộc cửa hàng.', 403)
        if (!files.length || (product.images || []).length + files.length > 10) throw new DemoError('Tối đa 10 ảnh mỗi sản phẩm.', 422)
        data = []
        for (const [index, file] of files.entries()) {
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) throw new DemoError('Ảnh PNG/JPEG/WebP tối đa 5 MiB.', 422)
          data.push({ id: current.id(), url: await persistBusinessFile(file), primary: !(product.images || []).some(image => image.primary) && index === Number(url.searchParams.get('primaryIndex') || 0), displayOrder: (product.images || []).length + index, mediaType: file.type })
        }
        product.images = [...(product.images || []), ...data]
      }
      else if (/^\/bakeries\/[^/]+\/products\/[^/]+$/.test(path) && method === 'GET') {
        const [, , bakeryId, , productId] = path.split('/'), product = current.find('products', productId)
        current.bakeryAccess(user, bakeryId)
        if (product.bakeryId !== bakeryId) throw new DemoError('Sản phẩm không thuộc cửa hàng.', 403)
        data = { bakeryId, product, images: product.images || [], options: product.options || { groups: [] } }
      } else data = await businessAttachments(current, path, method, body, options.body, user) ?? routeDemo(current, path, method, body, url.searchParams, user)
      await attachBusinessProof(current, data, path, method, options.body)
      if (method === 'POST' && segments[0] === 'bakeries' && segments[2] === 'subscription-orders' && data?.id) {
        data.orderNumber = 'SUB-' + current.state.nextId
        current.find('subscriptionOrders', data.id).orderNumber = data.orderNumber
      }
      if (method === 'POST' && segments[0] === 'orders' && segments[2] === 'status-transitions' && data?.status === 'CANCELLED') {
        const order = current.find('orders', segments[1])
        if (order.paymentStatus === 'UNPAID') { order.paymentStatus = 'CANCELLED'; current.state.salesPayments.filter(payment => payment.orderId === order.id && payment.status === 'PENDING').forEach(payment => { payment.status = 'CANCELLED' }) }
      }
      if (method !== 'GET') {
        if (receiptKey) current.state.receipts[receiptKey] = { fingerprint, result: structuredClone(data) }
        current.inTransaction = false
        await current.save()
      }
      return reply(businessMediaView(data), method === 'POST' && !/\/(?:approve|reject|accept|status-transitions|publish|read|close|withdraw)$/.test(path) ? 201 : 200)
    } catch (error) {
      if (snapshot && store) Object.assign(store.state, snapshot)
      return reply(error.name === 'QuotaExceededError' || error === initializationError ? storageMessage(error) : (error.message || 'Không thể xử lý thao tác.').replace(/DEMO/g, 'thực hành'), error.status || 500)
    } finally { if (store) store.inTransaction = false }
  }
  let queue = Promise.resolve()
  const serialFetch = (input, options) => {
    if (!enabled()) return fetchBusiness(input, options)
    const run = () => fetchBusiness(input, options)
    if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request('sweetcake-business-simulation', run)
    queue = queue.catch(() => {}).then(run); return queue
  }
  return { fetch: serialFetch, enabled, getStore, getError: () => initializationError ? 'Chưa thể mở sổ kinh doanh. Dữ liệu cũ vẫn được giữ nguyên; vui lòng tải lại để khôi phục.' : null, setEnabled(value) { if (!storage?.setItem) throw new Error('Trình duyệt chưa cho phép lưu chế độ thực hành.'); storage.setItem(BUSINESS_MODE_KEY, value ? 'on' : 'off') } }
}

export async function installBusinessSimulation(getSession, realFetch) {
  if (runtime || typeof window === 'undefined') return runtime
  let storage
  try { storage = window.localStorage } catch { /* Real APIs remain available without browser persistence. */ }
  let businessStorage, storageError
  try { businessStorage = await openBusinessPersistence(storage) } catch (error) { storageError = error; storageMessage(error) }
  const legacyFetch = window.fetch.bind(window)
  const localStorageSettings = { getItem: key => key === BUSINESS_MODE_KEY ? 'on' : storage?.getItem(key), setItem: (key,value) => storage?.setItem(key,value) }
  const local = createBusinessTransport({ businessStorage, storageError, fetch: legacyFetch, realFetch, getSession, storage: localStorageSettings, origin: window.location.origin, defaultEnabled: true })
  runtime = createUnifiedDataService({ realFetch, local, getSession, origin: window.location.origin, fallbackFetch: local.fetch })
  window.fetch = runtime.fetch
  window.addEventListener('storage', event => { if ([BUSINESS_STORAGE_KEY, BUSINESS_MODE_KEY].includes(event.key)) window.dispatchEvent(new Event('sweetcake:api-mutated')) })
  return runtime
}
export const simulationEnabled = () => Boolean(runtime?.enabled())
export const simulationFailure = () => runtime?.getError() || null
export const simulationStore = () => runtime?.getStore() || null
export const simulationMediaUrl = value => simulationEnabled() ? businessMediaUrl(value) : null
export function changeBusinessMode(value) {
  runtime?.setEnabled(value)
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    for (const key of ['bakeryId', 'orderId', 'offerId', 'cakeRequestId', 'conversationId', 'paymentId', 'planId']) url.searchParams.delete(key)
    window.location.replace(url.pathname + url.search)
  }
}
export { isBusinessId }
