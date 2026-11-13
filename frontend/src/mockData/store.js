import { createSeed, createCustomerAddresses, demoId, DEMO_STORAGE_KEY, isDemoId, stamp, future } from './seed.js'

export class DemoError extends Error {
  constructor(message, status = 422) { super('DEMO: ' + message); this.status = status }
}
export const validSave = (value) => value?.version === 2 && Number.isInteger(value.nextId) && value.nextId >= 1000 && value.actors && typeof value.actors === 'object' && !Array.isArray(value.actors) && ['addresses', 'users', 'bakeries', 'categories', 'products', 'requests', 'offers', 'orders', 'plans', 'subscriptionOrders', 'payments', 'conversations', 'messages', 'subscriptions', 'jobs', 'designs', 'addOns', 'members'].every((key) => Array.isArray(value[key]))

export function migrateDemoState(state) {
  let changed = false
  // Repair legacy fixture mapping only; keep IDs, actors and user edits intact.
  for (const request of state.requests || []) {
    if (request.legacyId && request.deliveryDistrict?.includes(',')) {
      request.deliveryDistrict = request.deliveryDistrict.split(',').at(-1).trim()
      changed = true
    }
  }
  for (const bakery of state.bakeries || []) {
    for (const area of bakery.operations?.serviceAreas || []) {
      if (!Object.hasOwn(area, 'active')) { area.active = true; changed = true }
    }
    for (const address of bakery.operations?.addresses || []) {
      if (!Object.hasOwn(address, 'isPrimary') && typeof address.primary === 'boolean') {
        address.isPrimary = address.primary
        changed = true
      }
    }
    for (const hour of bakery.operations?.businessHours || []) {
      if (!Object.hasOwn(hour, 'opensAt') && typeof hour.openTime === 'string') { hour.opensAt = hour.openTime; changed = true }
      if (!Object.hasOwn(hour, 'closesAt') && typeof hour.closeTime === 'string') { hour.closesAt = hour.closeTime; changed = true }
    }
  }

  // Ensure initial seed payments are present if missing from older local storage
  const seed = createSeed()
  for (const seedPayment of seed.payments || []) {
    if (!state.payments.some((p) => p.id === seedPayment.id)) {
      const seedOrder = seed.subscriptionOrders.find((o) => o.id === seedPayment.subscriptionOrderId)
      if (seedOrder && !state.subscriptionOrders.some((o) => o.id === seedOrder.id)) {
        state.subscriptionOrders.push(seedOrder)
      }
      state.payments.push(seedPayment)
      changed = true
    }
  }

  // Ensure active partner subscriptions are present if missing from older local storage
  if (!state.subscriptions) state.subscriptions = []
  for (const seedSub of seed.subscriptions || []) {
    const existing = state.subscriptions.find((s) => s.bakeryId === seedSub.bakeryId)
    if (!existing) {
      state.subscriptions.push(seedSub)
      changed = true
    } else if (existing.bakeryId === seed.bakeries[4]?.id) {
      existing.planCode = 'PREMIUM'
      existing.planName = 'Cao cấp'
      existing.planId = seedSub.planId
      existing.periodStart = seedSub.periodStart
      existing.periodEnd = seedSub.periodEnd
      existing.featuresSnapshot = seedSub.featuresSnapshot
      existing.status = 'ACTIVE'
      changed = true
    }
  }

  // Update state.plans to match seed plans if older demo codes exist
  if (state.plans?.some((p) => p.code?.startsWith('DEMO_'))) {
    state.plans = seed.plans
    changed = true
  }

  // Keep payment and subscription order amounts aligned with current plan prices for pending reviews
  for (const order of state.subscriptionOrders || []) {
    if (order.status === 'PAYMENT_REVIEW') {
      const match = state.plans.find((p) => p.id === order.planId)
      if (match && order.totalAmount !== match.monthlyPrice) {
        order.totalAmount = match.monthlyPrice
        const p = state.payments.find((pay) => pay.subscriptionOrderId === order.id)
        if (p && p.amount !== match.monthlyPrice) {
          p.amount = match.monthlyPrice
        }
        changed = true
      }
    }
  }

  // Ensure submittedByName is populated on all payments
  for (const payment of state.payments || []) {
    if (!payment.submittedByName) {
      const bakery = state.bakeries.find((b) => b.id === payment.bakeryId)
      const user = state.users.find((u) => u.id === payment.submittedByUserId || u.id === bakery?.ownerId)
      payment.submittedByName = user?.name || bakery?.name || 'Chủ tiệm'
      changed = true
    }
  }

  // Ensure seed customer orders are distributed to shops (e.g. Artisan Sweet Atelier) across older client saves
  for (const seedOrder of seed.orders || []) {
    const existing = (state.orders || []).find((o) => o.id === seedOrder.id)
    if (existing) {
      if (existing.bakeryId !== seedOrder.bakeryId) {
        existing.bakeryId = seedOrder.bakeryId
        changed = true
      }
    } else {
      if (!state.orders) state.orders = []
      state.orders.push(seedOrder)
      changed = true
    }
  }

  return changed
}

export function mergeDemoStates(local, remote) {
  if (!validSave(remote)) return local
  if (!validSave(local)) return remote

  const actors = { ...(remote.actors || {}), ...(local.actors || {}) }

  const plans = (local.plans || []).map((lp) => {
    const rp = (remote.plans || []).find((p) => p.id === lp.id)
    if (!rp) return lp
    const lpTime = lp.updatedAt ? Date.parse(lp.updatedAt) : 0
    const rpTime = rp.updatedAt ? Date.parse(rp.updatedAt) : 0
    if (lpTime > rpTime) return lp
    if (rpTime > lpTime) return rp
    if (lp.monthlyPrice !== 49000 && lp.code === 'DEMO_0') return lp
    if (rp.monthlyPrice !== 49000 && rp.code === 'DEMO_0') return rp
    return rp
  })
  for (const rp of remote.plans || []) {
    if (!plans.some((p) => p.id === rp.id)) plans.push(rp)
  }

  const orderMap = new Map()
  for (const o of [...(local.subscriptionOrders || []), ...(remote.subscriptionOrders || [])]) {
    if (!orderMap.has(o.id)) orderMap.set(o.id, o)
  }
  const subscriptionOrders = Array.from(orderMap.values())

  const paymentMap = new Map()
  for (const p of [...(local.payments || []), ...(remote.payments || [])]) {
    if (!paymentMap.has(p.id)) paymentMap.set(p.id, p)
  }
  const payments = Array.from(paymentMap.values())

  const bakeryMap = new Map()
  for (const b of [...(local.bakeries || []), ...(remote.bakeries || [])]) {
    if (!bakeryMap.has(b.id)) bakeryMap.set(b.id, b)
  }
  const bakeries = Array.from(bakeryMap.values())

  const memberMap = new Map()
  for (const m of [...(local.members || []), ...(remote.members || [])]) {
    if (!memberMap.has(m.id)) memberMap.set(m.id, m)
  }
  const members = Array.from(memberMap.values())

  const subMap = new Map()
  for (const s of [...(local.subscriptions || []), ...(remote.subscriptions || [])]) {
    if (!subMap.has(s.id)) subMap.set(s.id, s)
  }
  const subscriptions = Array.from(subMap.values())

  const nextId = Math.max(local.nextId || 1000000, remote.nextId || 1000000)

  return {
    version: 2,
    actors,
    addressOwners: [...new Set([...(local.addressOwners || []), ...(remote.addressOwners || [])])],
    users: local.users || remote.users,
    bakeries,
    categories: local.categories || remote.categories,
    products: local.products || remote.products,
    requests: local.requests || remote.requests,
    offers: local.offers || remote.offers,
    orders: local.orders || remote.orders,
    plans,
    subscriptionOrders,
    payments,
    conversations: local.conversations || remote.conversations,
    messages: local.messages || remote.messages,
    addresses: local.addresses || remote.addresses,
    subscriptions,
    jobs: local.jobs || remote.jobs,
    designs: local.designs || remote.designs,
    addOns: local.addOns || remote.addOns,
    members,
    nextId
  }
}

export function createDemoStore(storage, { readOnly = false } = {}) {
  let state
  try { const saved = JSON.parse(storage?.getItem(DEMO_STORAGE_KEY) || 'null'); if (validSave(saved)) state = saved } catch { /* A corrupt demo save is discarded; auth storage is never read. */ }
  state ||= createSeed()
  if (!readOnly) migrateDemoState(state)
  const listeners = new Set()
  const seedPlans = createSeed().plans
  for (const sp of readOnly ? [] : seedPlans) {
    const existing = state.plans.find((p) => p.id === sp.id || p.code === sp.code)
    if (existing) {
      existing.name = sp.name; existing.description = sp.description; existing.monthlyPrice = sp.monthlyPrice; existing.currency = sp.currency; existing.features = { ...sp.features }
    } else state.plans.push(sp)
  }
  const notify = () => { for (const fn of listeners) fn() }
  const broadcastSync = (snapshot) => {
    if (typeof window !== 'undefined' && typeof window.fetch === 'function' && window.location?.origin) {
      try {
        window.fetch('/__sweetcake_demo_sync__', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snapshot),
        }).catch(() => {})
      } catch {}
    }
  }
  const pullSync = async () => {
    if (typeof window !== 'undefined' && typeof window.fetch === 'function' && window.location?.origin) {
      try {
        const res = await window.fetch('/__sweetcake_demo_sync__')
        if (res.ok) {
          const remote = await res.json()
          if (remote && validSave(remote)) {
            const plansDiff = JSON.stringify(state.plans) !== JSON.stringify(remote.plans)
            const ordersDiff = JSON.stringify(state.subscriptionOrders) !== JSON.stringify(remote.subscriptionOrders)
            const customerOrdersDiff = JSON.stringify(state.orders) !== JSON.stringify(remote.orders)
            const paymentsDiff = JSON.stringify(state.payments) !== JSON.stringify(remote.payments)
            const bakeriesDiff = JSON.stringify(state.bakeries) !== JSON.stringify(remote.bakeries)
            if (plansDiff || ordersDiff || customerOrdersDiff || paymentsDiff || bakeriesDiff) {
              const merged = mergeDemoStates(state, remote)
              migrateDemoState(merged)
              state = merged
              try { storage?.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)) } catch {}
              notify()
              broadcastSync(state)
            }
          } else if (!remote && state) {
            broadcastSync(state)
          }
        }
      } catch {}
    }
  }
  const save = () => {
    if (readOnly) return
    try { storage?.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)) } catch { /* Quota/private mode: demo remains in memory. */ }
    notify()
    broadcastSync(state)
  }
  save()
  if (!readOnly) void pullSync()
  if (!readOnly && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    const handleSync = () => {
      if (typeof document === 'undefined' || !document.hidden) {
        void pullSync()
      }
    }
    window.addEventListener('focus', handleSync)
    window.addEventListener('visibilitychange', handleSync)
    if (typeof window.__SWEETCAKE_DEMO_SYNC_TIMER__ !== 'undefined') {
      clearInterval(window.__SWEETCAKE_DEMO_SYNC_TIMER__)
    }
    window.__SWEETCAKE_DEMO_SYNC_TIMER__ = setInterval(handleSync, 3000)
  }
  const id = () => demoId(state.nextId++)
  const roles = (user) => user?.roles || []
  const has = (user, ...allowed) => roles(user).some((role) => allowed.includes(role))
  function requireUser(user, ...allowed) {
    if (!user?.id) throw new DemoError('Cần đăng nhập thật.', 401)
    if (allowed.length && !has(user, ...allowed)) throw new DemoError('Không đủ quyền.', 403)
  }
  function bakeryAccess(user, bakeryId, edit = false) {
    requireUser(user)
    if (has(user, 'ADMIN')) return
    const bakery = state.bakeries.find((item) => item.id === bakeryId)
    const member = state.members.find((item) => item.bakeryId === bakeryId && item.userId === user.id && item.status === 'ACTIVE')
    if (!has(user, 'BAKERY_OWNER') || !(bakery?.ownerId === user.id || member && (!edit || member.memberRole === 'OWNER'))) throw new DemoError('Không có quyền với tiệm DEMO này.', 403)
  }
  function own(user, record) {
    requireUser(user)
    if (record?.customerId !== user.id || !has(user, 'CUSTOMER')) throw new DemoError('Không sở hữu dữ liệu DEMO.', 403)
  }
  function bind(user) {
    if (!user?.id) return
    const ensureAddresses = () => {
      if (!has(user, 'CUSTOMER')) return false
      // Migrate existing saves without restoring addresses a user deleted.
      state.addressOwners ||= [...new Set([...state.addresses.map((address) => address.customerId), state.actors.customer].filter(Boolean))]
      if (state.addressOwners.includes(user.id)) return false
      if (!state.addresses.some((address) => address.customerId === user.id)) state.addresses.push(...createCustomerAddresses(user.id, id, user.displayName || user.fullName || user.name))
      state.addressOwners.push(user.id)
      return true
    }
    const slot = has(user, 'ADMIN') ? 'admin' : has(user, 'BAKERY_OWNER') ? 'vendor' : has(user, 'CUSTOMER') ? 'customer' : null
    if (!slot || state.actors[slot]) { if (ensureAddresses()) save(); return }
    const old = state.users[{ customer: 0, vendor: 1, admin: 2 }[slot]]
    const oldId = old.id
    state.actors[slot] = user.id
    // Replace references only in the DEMO graph, never in auth or API objects.
    const replace = (value) => {
      if (Array.isArray(value)) return value.map(replace)
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replace(child)]))
      return value === oldId ? user.id : value
    }
    state = replace(state)
    Object.assign(state.users.find((item) => item.id === user.id), { name: (user.fullName || user.name || old.name) + ' · DEMO', email: user.email || old.email, roles: [...roles(user)] })
    if (slot === 'vendor') for (const bakery of state.bakeries) state.members.push({ id: id(), bakeryId: bakery.id, userId: user.id, memberRole: 'OWNER', status: 'ACTIVE', displayNameSnapshot: user.fullName || old.name })
    ensureAddresses()
    save()
  }
  function find(kind, value) {
    const item = state[kind]?.find((row) => row.id === value)
    if (!item) throw new DemoError('Không tìm thấy bản ghi DEMO.', 404)
    return item
  }
  function createOrder(user, input) {
    requireUser(user, 'CUSTOMER')
    const product = input.productId ? find('products', input.productId) : null
    const offer = input.offerId ? find('offers', input.offerId) : null
    if (offer) { const request = find('requests', offer.cakeRequestId); own(user, request); if (offer.status !== 'PENDING' || request.status !== 'OPEN' || Date.parse(offer.expiresAt) <= Date.now()) throw new DemoError('Báo giá không còn hiệu lực.', 409) }
    if (product && product.status !== 'PUBLISHED') throw new DemoError('Bánh chưa được xuất bản.', 409)
    if (!product && !offer) throw new DemoError('Chọn bánh/báo giá DEMO.')
    const address = input.deliveryAddressId ? find('addresses', input.deliveryAddressId) : state.addresses.find((item) => item.customerId === user.id)
    if (!address || address.customerId !== user.id) throw new DemoError('Chọn địa chỉ nhận bánh thuộc tài khoản.', 403)
    const bakeryId = product?.bakeryId || offer.bakeryId, quantity = Number(input.quantity || 1)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new DemoError('Số lượng từ 1 đến 100.')
    let unitPrice = product?.basePrice || 0, extras = 0
    if (product) {
      const selections = new Map()
      for (const selected of input.optionSelections || []) { if (selections.has(selected.optionGroupId)) throw new DemoError('Trùng nhóm tùy chọn.'); selections.set(selected.optionGroupId, selected.optionValueIds) }
      for (const group of product.options?.groups || []) {
        const selected = selections.get(group.id) || []
        if (new Set(selected).size !== selected.length || selected.length < group.minimumSelections || selected.length > group.maximumSelections) throw new DemoError('Số tùy chọn không hợp lệ.')
        for (const valueId of selected) { const value = group.values.find((v) => v.id === valueId && v.active); if (!value) throw new DemoError('Tùy chọn không khả dụng.'); unitPrice += Number(value.priceAdjustment) }
        selections.delete(group.id)
      }
      if (selections.size) throw new DemoError('Nhóm tùy chọn không thuộc bánh.')
      const selectedExtras = new Set()
      for (const selected of input.addOns || []) { const addOn = find('addOns', selected.addOnId); if (selectedExtras.has(addOn.id) || addOn.bakeryId !== bakeryId || !addOn.active || !Number.isInteger(selected.quantity) || selected.quantity < 1) throw new DemoError('Phụ kiện không hợp lệ.'); selectedExtras.add(addOn.id); extras += addOn.price * selected.quantity }
    }
    const bakery = find('bakeries', bakeryId), subtotal = product ? unitPrice * quantity + extras : offer.cakePrice + offer.addOnTotal, deliveryFee = offer?.deliveryFee ?? 30000
    const createdAt = stamp(), changedByName = user.displayName || user.fullName || user.name || null
    const order = { id: id(), customerId: user.id, bakeryId, bakeryName: bakery.name, customerName: user.displayName || user.fullName || user.name || 'Khách', customerPhone: address.recipientPhone, orderNumber: 'MẪU-' + state.nextId, orderSource: offer ? 'ACCEPTED_OFFER' : 'DIRECT_CATALOG', status: 'PENDING', currency: 'VND', subtotal, deliveryFee, totalAmount: subtotal + deliveryFee, neededAt: input.requestedDeliveryAt || (offer && find('requests', offer.cakeRequestId).neededAt) || new Date(Date.now() + 7 * 86400000).toISOString(), customerNote: input.customerNote || '', createdAt, items: [{ id: id(), sourceProductId: product?.id || null, name: product?.name || find('requests', offer.cakeRequestId).title, quantity, unitPrice: subtotal / quantity, lineTotal: subtotal, itemType: offer ? 'CUSTOM_CAKE' : 'CATALOG_PRODUCT', configuration: { optionSelections: input.optionSelections || [], addOns: input.addOns || [] } }], statusHistory: [{ fromStatus: null, toStatus: 'PENDING', changedAt: createdAt, changedBy: user.id, changedByName, note: 'Đơn hàng được tạo.' }], review: null, deliveryAddress: structuredClone(address) }
    state.orders.unshift(order)
    if (offer) { offer.status = 'ACCEPTED'; const request = find('requests', offer.cakeRequestId); request.status = 'OFFER_SELECTED'; for (const other of state.offers) if (other.cakeRequestId === request.id && other.id !== offer.id && other.status === 'PENDING') other.status = 'REJECTED'; for (const chat of state.conversations) if (chat.cakeRequestId === request.id && chat.bakeryId === bakeryId) chat.orderId = order.id }
    return order
  }
  function transitionOrder(user, orderId, targetStatus, scope = 'bakery', reason = '') {
    const order = find('orders', orderId)
    const transitions = { PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['BAKING', 'CANCELLED'], BAKING: ['READY'], READY: ['DELIVERING'], DELIVERING: ['COMPLETED'], COMPLETED: [], CANCELLED: [] }
    if (has(user, 'CUSTOMER') && order.customerId === user.id && !has(user, 'ADMIN')) { if (targetStatus !== 'CANCELLED') throw new DemoError('Khách chỉ được hủy đơn.', 403) }
    else { if (scope === 'all') requireUser(user, 'ADMIN'); else bakeryAccess(user, order.bakeryId) }
    if (!transitions[order.status]?.includes(targetStatus)) throw new DemoError('Chuyển trạng thái không hợp lệ.', 409)
    if (order.statusHistory == null) order.statusHistory = []
    if (!Array.isArray(order.statusHistory)) throw new DemoError('Chưa thể đọc lịch sử đơn hàng. Vui lòng tải lại.', 409)
    const changedAt = stamp()
    order.statusHistory.push({ fromStatus: order.status, toStatus: targetStatus, changedAt, note: reason.trim(), changedBy: user.id, changedByName: user.displayName || user.fullName || user.name || null }); order.status = targetStatus
    order.updatedAt = changedAt
    if (targetStatus === 'CONFIRMED') order.acceptedAt = changedAt
    if (targetStatus === 'COMPLETED') order.completedAt = changedAt
    return order
  }
  function reload() {
    try {
      const raw = storage?.getItem(DEMO_STORAGE_KEY)
      if (raw) {
        const next = JSON.parse(raw)
        if (validSave(next)) {
          const plansDiff = JSON.stringify(state.plans) !== JSON.stringify(next.plans)
          const ordersDiff = JSON.stringify(state.subscriptionOrders) !== JSON.stringify(next.subscriptionOrders)
          const paymentsDiff = JSON.stringify(state.payments) !== JSON.stringify(next.payments)
          const bakeriesDiff = JSON.stringify(state.bakeries) !== JSON.stringify(next.bakeries)
          if (plansDiff || ordersDiff || paymentsDiff || bakeriesDiff) {
            migrateDemoState(next)
            state = next
            if (storage) {
              try { storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)) } catch {}
            }
            notify()
            return true
          }
        }
      }
    } catch {}
    void pullSync()
    return false
  }
  function recordPartnerPayment({ plan, bakeryName, phone, district, city, paymentReference, proofUrl }) {
    const nextId = state.nextId || 1000000
    const orderId = demoId(nextId)
    const paymentId = demoId(nextId + 1)
    state.nextId = nextId + 2

    const cleanName = (bakeryName || '').trim() || 'Tiệm Bánh Sweet Home'
    let bakery = state.bakeries.find((b) => b.name.toLowerCase() === cleanName.toLowerCase())
    if (!bakery) {
      const newBakeryId = demoId(state.nextId++)
      const address = {
        id: demoId(state.nextId++),
        recipientName: cleanName,
        recipientPhone: phone || '0901234567',
        addressLine: district ? (district + ', TP. Hồ Chí Minh') : '18 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
        district: district || 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        isPrimary: true
      }
      bakery = {
        id: newBakeryId,
        ownerId: state.users?.[1]?.id || state.users?.[0]?.id,
        name: cleanName,
        slug: 'demo-bakery-' + state.nextId,
        status: 'ACTIVE',
        description: 'Tiệm bánh đối tác đăng ký mới trên nền tảng',
        logoUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
        coverUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
        primaryAddress: address,
        operations: {
          addresses: [address],
          serviceAreas: [{ city: 'TP. Hồ Chí Minh', district: district || 'Quận 1', deliveryFee: 30000, active: true }],
          businessHours: Array.from({ length: 7 }, (_, day) => ({ dayOfWeek: day + 1, opensAt: '08:00', closesAt: '21:00', closed: false }))
        },
        createdAt: stamp()
      }
      state.bakeries.unshift(bakery)
      state.members.push({
        id: demoId(state.nextId++),
        bakeryId: newBakeryId,
        userId: bakery.ownerId,
        memberRole: 'OWNER',
        status: 'ACTIVE',
        displayNameSnapshot: cleanName
      })
    }
    const bakeryId = bakery.id

    const orderNumber = 'SUB-' + Math.floor(100000 + Math.random() * 900000)
    const subOrder = {
      id: orderId,
      bakeryId,
      planId: plan.id,
      orderNumber,
      planNameSnapshot: plan.name,
      planCodeSnapshot: plan.code,
      featuresSnapshot: structuredClone(plan.features || {}),
      billingPeriodMonths: plan.billingPeriodMonths || 1,
      totalAmount: plan.monthlyPrice,
      currency: plan.currency || 'VND',
      status: 'PAYMENT_REVIEW',
      expiresAt: future(3),
      createdAt: stamp(),
      payments: []
    }
    state.subscriptionOrders.unshift(subOrder)

    const payment = {
      id: paymentId,
      bakeryId,
      subscriptionOrderId: orderId,
      amount: plan.monthlyPrice,
      currency: plan.currency || 'VND',
      status: 'SUBMITTED',
      paymentMethod: 'Chuyển khoản Vietcombank (QR)',
      paymentReference: paymentReference || ('FT' + Date.now().toString().slice(-8)),
      submittedByName: cleanName,
      submittedByUserId: bakery.ownerId,
      proofUrl: proofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      submittedAt: stamp()
    }
    state.payments.unshift(payment)
    save()
    return { bakery, subOrder, payment }
  }
  return {
    get state() { return state }, id, save, bind, find, has, requireUser, bakeryAccess, own, createOrder, transitionOrder, reload, recordPartnerPayment,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    reset() { state = createSeed(); save() },
    sync(value) { try { const next = typeof value === 'string' ? JSON.parse(value) : value; if (validSave(next)) { const merged = mergeDemoStates(state, next); migrateDemoState(merged); state = merged; notify() } } catch { /* Ignore corrupt cross-tab demo state. */ } },
    isRecord(value) { return isDemoId(value) },
  }
}
