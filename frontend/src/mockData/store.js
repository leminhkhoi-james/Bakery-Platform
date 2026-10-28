import { createSeed, createCustomerAddresses, demoId, DEMO_STORAGE_KEY, isDemoId, stamp } from './seed.js'

export class DemoError extends Error {
  constructor(message, status = 422) { super('DEMO: ' + message); this.status = status }
}
const validSave = (value) => value?.version === 2 && Number.isInteger(value.nextId) && value.nextId >= 1000 && value.actors && typeof value.actors === 'object' && !Array.isArray(value.actors) && ['addresses', 'users', 'bakeries', 'categories', 'products', 'requests', 'offers', 'orders', 'plans', 'subscriptionOrders', 'payments', 'conversations', 'messages', 'subscriptions', 'jobs', 'designs', 'addOns', 'members'].every((key) => Array.isArray(value[key]))
export function createDemoStore(storage) {
  let state
  try { const saved = JSON.parse(storage?.getItem(DEMO_STORAGE_KEY) || 'null'); if (validSave(saved)) state = saved } catch { /* A corrupt demo save is discarded; auth storage is never read. */ }
  state ||= createSeed()
  const listeners = new Set()
  const notify = () => { for (const fn of listeners) fn() }
  const save = () => { try { storage?.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)) } catch { /* Quota/private mode: demo remains in memory. */ } notify() }
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
    if (!has(user, 'BAKERY_OWNER', 'BAKERY_STAFF') || !(bakery?.ownerId === user.id || member && (!edit || ['OWNER', 'MANAGER'].includes(member.memberRole)))) throw new DemoError('Không có quyền với tiệm DEMO này.', 403)
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
    const slot = has(user, 'ADMIN') ? 'admin' : has(user, 'BAKERY_OWNER') ? 'vendor' : has(user, 'BAKERY_STAFF') ? 'staff' : has(user, 'CUSTOMER') ? 'customer' : null
    if (!slot || state.actors[slot]) { if (ensureAddresses()) save(); return }
    if (slot === 'staff') {
      state.actors.staff = user.id
      state.users.push({ id: user.id, name: 'Nhân viên · DEMO', email: user.email || 'staff@demo.invalid', roles: [...roles(user)], status: 'ACTIVE' })
      for (const bakery of state.bakeries) state.members.push({ id: id(), bakeryId: bakery.id, userId: user.id, memberRole: 'STAFF', status: 'ACTIVE' })
      for (const chat of state.conversations) chat.participants.push({ userId: user.id, participantType: 'BAKERY' })
      ensureAddresses(); save(); return
    }
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
    if (slot === 'vendor') for (const bakery of state.bakeries) state.members.push({ id: id(), bakeryId: bakery.id, userId: user.id, memberRole: has(user, 'BAKERY_OWNER') ? 'OWNER' : 'STAFF', status: 'ACTIVE', displayNameSnapshot: user.fullName || old.name })
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
    const order = { id: id(), customerId: user.id, bakeryId, bakeryName: bakery.name, customerName: user.displayName || user.fullName || user.name || 'Khách', customerPhone: address.recipientPhone, orderNumber: 'MẪU-' + state.nextId, orderSource: offer ? 'ACCEPTED_OFFER' : 'DIRECT_CATALOG', status: 'PENDING', currency: 'VND', subtotal, deliveryFee, totalAmount: subtotal + deliveryFee, neededAt: input.requestedDeliveryAt || (offer && find('requests', offer.cakeRequestId).neededAt) || new Date(Date.now() + 7 * 86400000).toISOString(), customerNote: input.customerNote || '', createdAt: stamp(), items: [{ id: id(), sourceProductId: product?.id || null, name: product?.name || find('requests', offer.cakeRequestId).title, quantity, unitPrice: subtotal / quantity, lineTotal: subtotal, itemType: offer ? 'CUSTOM_CAKE' : 'CATALOG_PRODUCT', configuration: { optionSelections: input.optionSelections || [], addOns: input.addOns || [] } }], statusHistory: [], review: null, deliveryAddress: structuredClone(address) }
    state.orders.unshift(order)
    if (offer) { offer.status = 'ACCEPTED'; const request = find('requests', offer.cakeRequestId); request.status = 'OFFER_SELECTED'; for (const other of state.offers) if (other.cakeRequestId === request.id && other.id !== offer.id && other.status === 'PENDING') other.status = 'REJECTED'; for (const chat of state.conversations) if (chat.cakeRequestId === request.id && chat.bakeryId === bakeryId) chat.orderId = order.id }
    return order
  }
  function transitionOrder(user, orderId, targetStatus, scope = 'bakery') {
    const order = find('orders', orderId)
    const transitions = { PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['BAKING', 'CANCELLED'], BAKING: ['READY'], READY: ['DELIVERING'], DELIVERING: ['COMPLETED'], COMPLETED: [], CANCELLED: [] }
    if (has(user, 'CUSTOMER') && order.customerId === user.id && !has(user, 'ADMIN')) { if (targetStatus !== 'CANCELLED') throw new DemoError('Khách chỉ được hủy đơn.', 403) }
    else { if (scope === 'all') requireUser(user, 'ADMIN'); else bakeryAccess(user, order.bakeryId) }
    if (!transitions[order.status]?.includes(targetStatus)) throw new DemoError('Chuyển trạng thái không hợp lệ.', 409)
    order.statusHistory.push({ fromStatus: order.status, toStatus: targetStatus, changedAt: stamp(), note: 'Thao tác DEMO' }); order.status = targetStatus
    if (targetStatus === 'COMPLETED') order.completedAt = stamp()
    return order
  }
  return {
    get state() { return state }, id, save, bind, find, has, requireUser, bakeryAccess, own, createOrder, transitionOrder,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    reset() { state = createSeed(); save() },
    sync(value) { try { const next = JSON.parse(value); if (validSave(next)) { state = next; notify() } } catch { /* Ignore corrupt cross-tab demo state. */ } },
    isRecord(value) { return isDemoId(value) },
  }
}
