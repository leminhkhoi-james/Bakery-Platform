import { addressPayload, normalizeAddressDefault } from './addressModels.js'
import { DemoError } from './store.js'
import { future, stamp } from './seed.js'
import { AI_RENDER_IMAGES } from './customer/aiDesigns.js'

export const collectionPaths = /^\/(products|bakeries|cake-requests|offers|orders|conversations|subscription-plans|generation-jobs|admin\/bakeries|admin\/bakery-payments|admin\/subscription-plans|admin\/users)$/
const clone = (value) => structuredClone(value)
export async function readBody(body) {
  if (body instanceof FormData) {
    const metadata = body.get('metadata') || body.get('request')
    return metadata ? JSON.parse(typeof metadata === 'string' ? metadata : await metadata.text()) : {}
  }
  return typeof body === 'string' && body ? JSON.parse(body) : body || {}
}
export function routeDemo(store, path, method, body, query, user) {
  store.bind(user)
  const s = store.state, get = method === 'GET', parts = path.split('/').filter(Boolean)
  const { find, requireUser, bakeryAccess, own, has } = store
  const page = (items) => {
    let result = items.filter((row) => {
      for (const key of ['status', 'bakeryId', 'categoryId', 'requestType', 'cakeRequestId', 'orderSource', 'city', 'district']) {
        const value = query.get(key)
        if (value && String(row[key] ?? row.primaryAddress?.[key] ?? (key === 'district' ? row.deliveryDistrict : key === 'city' ? row.deliveryCity : '') ?? '').toLocaleLowerCase('vi') !== ({ hcm: 'tp. hồ chí minh', hn: 'hà nội' }[value.toLowerCase()] || value.toLocaleLowerCase('vi'))) return false
      }
      const needle = (query.get('query') || query.get('search') || '').toLocaleLowerCase('vi')
      if (needle && ![row.name, row.title, row.description, row.orderNumber].join(' ').toLocaleLowerCase('vi').includes(needle)) return false
      for (const [param, field, direction] of [['createdFrom', 'createdAt', 1], ['createdTo', 'createdAt', -1], ['neededFrom', 'neededAt', 1], ['neededTo', 'neededAt', -1], ['submittedFrom', 'submittedAt', 1], ['submittedTo', 'submittedAt', -1]]) if (query.get(param) && direction * (Date.parse(row[field]) - Date.parse(query.get(param))) < 0) return false
      if (query.has('customizable') && String(row.product?.customizable ?? row.customizable) !== query.get('customizable')) return false
      if (query.get('minPrice') && row.basePrice < Number(query.get('minPrice'))) return false
      if (query.get('maxPrice') && row.basePrice > Number(query.get('maxPrice'))) return false
      return true
    })
    const [sort, direction] = (query.get('sort') || 'createdAt,desc').split(',')
    result = result.toSorted((a, b) => (typeof a[sort] === 'number' ? a[sort] - b[sort] : String(a[sort] || '').localeCompare(String(b[sort] || ''))) * (direction === 'asc' ? 1 : -1) || a.id.localeCompare(b.id))
    const current = Math.max(1, Number(query.get('page')) || 1), size = Math.min(100, Math.max(1, Number(query.get('size')) || 20))
    return { result: result.slice((current - 1) * size, current * size), meta: { page: current, pageSize: size, total: result.length, pages: Math.ceil(result.length / size) } }
  }
  const productDto = (p) => ({ product: p, bakeryId: p.bakeryId, bakeryName: find('bakeries', p.bakeryId).name, city: find('bakeries', p.bakeryId).primaryAddress?.city, district: find('bakeries', p.bakeryId).primaryAddress?.district, category: s.categories.find((c) => c.id === p.categoryId), images: p.images || [], options: p.options || { groups: [] }, addOns: s.addOns.filter((a) => a.bakeryId === p.bakeryId) })
  const requestDto = (r) => ({ ...r, offers: s.offers.filter((o) => o.cakeRequestId === r.id) })
  const subOrderDto = (o) => ({ ...o, payments: s.payments.filter((p) => p.subscriptionOrderId === o.id) })
  const priceOffer = (input, bakeryId) => {
    const seen = new Set()
    const items = (input.items || []).map((item) => { const addOn = find('addOns', item.addOnId); if (seen.has(addOn.id) || addOn.bakeryId !== bakeryId || !addOn.active || !Number.isInteger(item.quantity) || item.quantity < 1) throw new DemoError('Phụ kiện báo giá không hợp lệ.'); seen.add(addOn.id); return { ...item, id: store.id(), name: addOn.name, unitPrice: addOn.price, lineTotal: addOn.price * item.quantity } })
    const addOnTotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    return { ...input, items, addOnTotal, totalPrice: Number(input.cakePrice) + Number(input.deliveryFee) + addOnTotal }
  }
  const create = (kind, data) => { const item = { ...data, id: store.id(), createdAt: stamp(), updatedAt: stamp() }; s[kind].unshift(item); return item }
  const update = (item, data) => Object.assign(item, data, { id: item.id, updatedAt: stamp() })
  const chatDto = (chat) => { const lastReadAt = chat.participants.find((participant) => participant.userId === user?.id)?.lastReadAt || null; return { ...chat, currentUserLastReadAt: lastReadAt, unreadCount: s.messages.filter((message) => message.conversationId === chat.id && message.senderId !== user?.id && !message.deleted && (!lastReadAt || Date.parse(message.createdAt) > Date.parse(lastReadAt))).length } }
  const chatAccess = (chat) => { requireUser(user); if (chat.customerId !== user.id) bakeryAccess(user, chat.bakeryId); if (!chat.participants.some((p) => p.userId === user.id)) throw new DemoError('Không tham gia hội thoại.', 403) }
  let result
  if (parts[0] === 'admin') {
    requireUser(user, 'ADMIN')
    if (parts[1] === 'bakeries') {
      if (!parts[2] && get) result = page(s.bakeries)
      else { const bakery = find('bakeries', parts[2]); if (get) result = { bakery, operations: bakery.operations, members: s.members.filter((m) => m.bakeryId === bakery.id) }; else if (parts[3] === 'status' && method === 'PATCH') { const allowed = { DRAFT: ['CLOSED'], PENDING_APPROVAL: ['ACTIVE', 'DRAFT', 'CLOSED'], ACTIVE: ['SUSPENDED', 'CLOSED'], SUSPENDED: ['ACTIVE', 'CLOSED'], CLOSED: [] }; if (!allowed[bakery.status]?.includes(body.status)) throw new DemoError('Trạng thái không hợp lệ.', 409); result = update(bakery, { status: body.status }) } }
    } else if (parts[1] === 'users') {
      if (!parts[2] && get) result = page(s.users)
      else if (!parts[2] && method === 'POST') result = create('users', { ...body, roles: ['CUSTOMER'], status: 'ACTIVE' })
      else { const person = find('users', parts[2]); if (Object.values(s.actors).includes(person.id)) throw new DemoError('Không thay đổi tài khoản đăng nhập thật từ dữ liệu mẫu.', 403); if (method === 'PATCH') result = update(person, { name: body.name ?? person.name, email: body.email ?? person.email, status: body.status ?? person.status }); else if (method === 'DELETE') { if (s.orders.some((o) => o.customerId === person.id) || s.bakeries.some((b) => b.ownerId === person.id)) throw new DemoError('Người dùng có dữ liệu liên kết.', 409); s.users = s.users.filter((p) => p.id !== person.id); result = null } }
    } else if (parts[1] === 'generated-designs' && method === 'PATCH' && parts[3] === 'moderation') {
      const design = find('designs', parts[2]); if (!['APPROVED', 'REJECTED'].includes(body.moderationStatus)) throw new DemoError('Trạng thái duyệt không hợp lệ.'); result = update(design, { moderationStatus: body.moderationStatus })
    } else if (parts[1] === 'subscription-plans') {
      if (!parts[2]) { if (get) result = s.plans; else if (method === 'POST') result = create('plans', { ...body, name: body.name + ' · DEMO' }) }
      else { const plan = find('plans', parts[2]); if (method === 'PATCH') { if (body.code !== plan.code && s.subscriptionOrders.some((o) => o.planId === plan.id)) throw new DemoError('Không đổi mã gói đã có đơn mua.', 409); result = update(plan, body) } else if (method === 'POST' && parts[3] === 'archive') result = update(plan, { status: 'ARCHIVED' }) }
    } else if (parts[1] === 'reviews' && method === 'PATCH') {
      const order = find('orders', parts[2]); if (!order.review || !['PUBLISHED', 'HIDDEN'].includes(body.status)) throw new DemoError('Đánh giá/trạng thái không hợp lệ.'); order.review.status = body.status; result = order.review
    } else if (parts[1] === 'bakery-payments') {
      if (!parts[2] && get) result = page(s.payments)
      else {
        const payment = find('payments', parts[2]), order = find('subscriptionOrders', payment.subscriptionOrderId)
        if (method === 'POST' && ['approve', 'reject'].includes(parts[3])) {
          if (payment.status !== 'SUBMITTED' || order.status !== 'PAYMENT_REVIEW') throw new DemoError('Chứng từ đã được xử lý.', 409)
          const approved = parts[3] === 'approve'
          if (approved && (payment.amount !== order.totalAmount || payment.currency !== order.currency)) throw new DemoError('Chứng từ không khớp.')
          if (!approved && !body.reviewNote?.trim()) throw new DemoError('Cần lý do từ chối.')
          payment.status = approved ? 'APPROVED' : 'REJECTED'; payment.reviewNote = body.reviewNote
          order.status = approved ? 'COMPLETED' : 'PENDING_PAYMENT'
          const subscription = approved ? create('subscriptions', { bakeryId: order.bakeryId, planId: order.planId, planCode: order.planCodeSnapshot, status: 'ACTIVE', periodStart: stamp(), periodEnd: future(30) }) : null
          order.period = subscription
          result = { payment, order: subOrderDto(order), subscription }
        }
      }
    }
  } else if (parts[0] === 'products' && get) {
    result = parts[1] ? productDto(find('products', parts[1])) : page(s.products.filter((p) => p.status === 'PUBLISHED').map(productDto).map((dto) => ({ ...dto, id: dto.product.id, name: dto.product.name, basePrice: dto.product.basePrice, categoryId: dto.product.categoryId })))
  } else if (parts[0] === 'bakeries') {
    if (!parts[1]) {
      if (get) result = page(s.bakeries.filter((b) => b.status === 'ACTIVE'))
      else if (method === 'POST') { requireUser(user, 'BAKERY_OWNER'); result = create('bakeries', { ...body, name: body.name + ' · DEMO', ownerId: user.id, status: 'DRAFT', operations: { addresses: [], serviceAreas: [], businessHours: [] } }); s.members.push({ id: store.id(), bakeryId: result.id, userId: user.id, memberRole: 'OWNER', status: 'ACTIVE' }) }
    } else {
      const bakery = find('bakeries', parts[1]), kind = parts[2]
      if (!kind && get) result = bakery
      else {
        bakeryAccess(user, bakery.id, !get)
        if (!kind && method === 'PATCH') result = update(bakery, body)
        else if (kind === 'submit-for-approval' && method === 'POST') result = update(bakery, { status: 'PENDING_APPROVAL' })
        else if (kind === 'operations') { if (get) result = bakery.operations; else if (method === 'PUT') { bakery.operations = body; bakery.primaryAddress = body.addresses.find((a) => a.primary) || body.addresses[0]; result = body } }
        else if (kind === 'subscription' && get) result = { bakeryId: bakery.id, currentSubscription: s.subscriptions.find((p) => p.bakeryId === bakery.id && p.status === 'ACTIVE') || null, scheduledSubscription: null, features: {} }
        else if (kind === 'subscription-orders') {
          if (get) result = page(s.subscriptionOrders.filter((o) => o.bakeryId === bakery.id).map(subOrderDto))
          else if (method === 'POST') { requireUser(user, 'BAKERY_OWNER'); const plan = find('plans', body.planId); result = create('subscriptionOrders', { bakeryId: bakery.id, planId: plan.id, orderNumber: 'DEMO-SUB-' + s.nextId, planNameSnapshot: plan.name, planCodeSnapshot: plan.code, featuresSnapshot: plan.features, billingPeriodMonths: plan.billingPeriodMonths, totalAmount: plan.monthlyPrice, currency: plan.currency, status: 'PENDING_PAYMENT', expiresAt: future(3), payments: [] }) }
        } else if (kind === 'products') {
          if (!parts[3]) { if (get) result = page(s.products.filter((p) => p.bakeryId === bakery.id)); else if (method === 'POST') result = create('products', { ...body, bakeryId: bakery.id, status: 'DRAFT', images: [], options: { groups: [] } }) }
          else {
            const product = find('products', parts[3]); if (product.bakeryId !== bakery.id) throw new DemoError('Sản phẩm sai tiệm.', 403)
            if (!parts[4] && method === 'PATCH') result = update(product, body)
            else if (parts[4] === 'options' && method === 'PUT') { product.options = { groups: body.groups.map((group) => ({ ...group, id: group.id || store.id(), values: group.values.map((value) => ({ ...value, id: value.id || store.id() })) })) }; result = product.options }
            else if (method === 'POST' && ['publish', 'hide', 'archive'].includes(parts[4])) { const allowed = { DRAFT: ['publish', 'archive'], PUBLISHED: ['hide', 'archive'], HIDDEN: ['publish', 'archive'], ARCHIVED: [] }; if (!allowed[product.status]?.includes(parts[4])) throw new DemoError('Trạng thái bánh không hợp lệ.', 409); result = update(product, { status: { publish: 'PUBLISHED', hide: 'HIDDEN', archive: 'ARCHIVED' }[parts[4]] }) }
            else if (parts[4] === 'images' && method === 'DELETE') { product.images = product.images.filter((image) => image.id !== parts[5]); result = null }
          }
        } else if (['categories', 'add-ons', 'members'].includes(kind)) {
          if (kind === 'members' && !get) throw new DemoError('Chủ tiệm được tạo cùng tiệm.', 403)
          const key = kind === 'add-ons' ? 'addOns' : kind
          if (get) result = s[key].filter((item) => item.bakeryId === bakery.id)
          else if (!parts[3] && method === 'POST') {
            result = create(key, { ...body, bakeryId: bakery.id })
          }
          else { const item = find(key, parts[3]); if (item.bakeryId !== bakery.id) throw new DemoError('Sai tiệm.', 403); if (method === 'PATCH') result = update(item, body); if (method === 'DELETE') { if (kind === 'members' && item.memberRole === 'OWNER') throw new DemoError('Không xóa chủ tiệm.', 409); if (kind === 'categories' && s.products.some((p) => p.categoryId === item.id)) throw new DemoError('Danh mục đang có sản phẩm.', 409); s[key] = s[key].filter((row) => row.id !== item.id); result = null } }
        }
      }
    }
  } else if (parts[0] === 'cake-requests') {
    requireUser(user)
    if (!parts[1]) {
      if (get) { const scope = query.get('scope'); if (scope === 'all') requireUser(user, 'ADMIN'); result = page(s.requests.filter((r) => scope === 'mine' ? r.customerId === user.id : scope === 'all' || r.status === 'OPEN')) }
      else if (method === 'POST') { requireUser(user, 'CUSTOMER'); result = create('requests', { ...body, customerId: user.id, status: 'DRAFT', images: [], optionSelections: body.optionSelections || [], statusHistory: [], offers: [] }) }
    } else {
      const request = find('requests', parts[1])
      if (parts[2] === 'offers' && method === 'POST') { bakeryAccess(user, body.bakeryId); if (request.status !== 'OPEN' || Date.parse(request.offerDeadline) < Date.now()) throw new DemoError('RFQ không nhận báo giá.', 409); result = create('offers', { ...priceOffer(body, body.bakeryId), cakeRequestId: request.id, status: 'PENDING', statusHistory: [] }) }
      else if (get) { if (request.status !== 'OPEN' && !has(user, 'ADMIN')) own(user, request); result = requestDto(request) }
      else { own(user, request); if (method === 'PATCH' && !parts[2]) { if (request.status !== 'DRAFT') throw new DemoError('Chỉ sửa bản nháp.', 409); result = update(request, body) } else if (method === 'POST' && ['publish', 'cancel'].includes(parts[2])) { if (parts[2] === 'publish' && request.status !== 'DRAFT' || parts[2] === 'cancel' && !['DRAFT', 'OPEN'].includes(request.status)) throw new DemoError('Trạng thái RFQ không hợp lệ.', 409); result = update(request, { status: parts[2] === 'publish' ? 'OPEN' : 'CANCELLED' }) } else if (method === 'PUT' && parts[2] === 'selected-design') { const design = find('designs', body.generatedDesignId), job = find('jobs', design.generationJobId); if (job.cakeRequestId !== request.id || job.status !== 'SUCCEEDED' || design.moderationStatus !== 'APPROVED' || !['DRAFT', 'OPEN'].includes(request.status)) throw new DemoError('Thiết kế không hợp lệ cho yêu cầu này.', 409); result = update(request, { selectedDesignId: design.id }) } }
    }
    if (result?.id) result = requestDto(result)
  } else if (parts[0] === 'offers') {
    requireUser(user)
    if (!parts[1] && get) result = page(s.offers.filter((o) => { const request = find('requests', o.cakeRequestId); if (request.customerId === user.id || has(user, 'ADMIN')) return true; try { bakeryAccess(user, o.bakeryId); return true } catch { return false } }))
    else {
      const offer = find('offers', parts[1]), request = find('requests', offer.cakeRequestId)
      if (get) { if (request.customerId !== user.id && !has(user, 'ADMIN')) bakeryAccess(user, offer.bakeryId); result = offer }
      else if (parts[2] === 'accept' && method === 'POST') { const order = store.createOrder(user, { ...body, offerId: offer.id, requestedDeliveryAt: request.neededAt }); result = { offerId: offer.id, orderId: order.id, orderNumber: order.orderNumber, offerStatus: 'ACCEPTED' } }
      else { bakeryAccess(user, offer.bakeryId); if (offer.status !== 'PENDING') throw new DemoError('Báo giá đã xử lý.', 409); if (method === 'PATCH') result = update(offer, priceOffer(body, offer.bakeryId)); if (method === 'POST' && parts[2] === 'withdraw') result = update(offer, { status: 'WITHDRAWN' }) }
    }
  } else if (parts[0] === 'orders') {
    requireUser(user)
    if (!parts[1] && get) { const scope = query.get('scope') || 'mine'; if (scope === 'all') requireUser(user, 'ADMIN'); if (scope === 'bakery') bakeryAccess(user, query.get('bakeryId')); result = page(s.orders.filter((o) => scope === 'all' || (scope === 'bakery' ? o.bakeryId === query.get('bakeryId') : o.customerId === user.id))) }
    else if (parts[1] === 'direct' && method === 'POST') result = store.createOrder(user, body)
    else {
      const order = find('orders', parts[1]); if (!has(user, 'ADMIN') && order.customerId !== user.id) bakeryAccess(user, order.bakeryId)
      if (get) result = order
      else if (parts[2] === 'status-transitions' && method === 'POST') result = store.transitionOrder(user, order.id, body.targetStatus, 'bakery', body.reason || '')
      else if (parts[2] === 'review') { own(user, order); if (method === 'DELETE') { if (order.review) order.review.status = 'DELETED'; result = null } else { if (order.status !== 'COMPLETED' || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) throw new DemoError('Đơn phải hoàn tất và đánh giá từ 1–5 sao.'); order.review = { ...body, orderId: order.id, customerId: user.id, status: 'PUBLISHED', createdAt: stamp(), updatedAt: stamp() }; result = order.review } }
    }
  } else if (parts[0] === 'conversations') {
    requireUser(user)
    if (!parts[1]) { if (get) result = page(s.conversations.filter((c) => { try { chatAccess(c); return true } catch { return false } }).map(chatDto)); else if (method === 'POST') { const request = find('requests', body.cakeRequestId); if (request.customerId !== user.id) bakeryAccess(user, body.bakeryId); const bakery = find('bakeries', body.bakeryId); result = s.conversations.find((c) => c.cakeRequestId === request.id && c.bakeryId === bakery.id) || create('conversations', { ...body, customerId: request.customerId, participants: [{ userId: request.customerId, participantType: 'CUSTOMER' }, { userId: bakery.ownerId, participantType: 'BAKERY' }], status: 'OPEN', unreadCount: 0 }) } }
    else {
      const chat = find('conversations', parts[1]); chatAccess(chat)
      if (!parts[2] && get) result = chatDto(chat)
      else if (parts[2] === 'messages') {
        if (get) { const items = s.messages.filter((m) => m.conversationId === chat.id).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)); const start = query.get('before') ? items.findIndex((m) => m.id === query.get('before')) + 1 : 0; const limit = Math.min(100, Number(query.get('limit')) || 30), slice = items.slice(start, start + limit); result = { items: slice, hasMore: start + limit < items.length, nextCursor: start + limit < items.length ? slice.at(-1).id : null } }
        else if (method === 'POST') { if (chat.status !== 'OPEN') throw new DemoError('Hội thoại đã đóng.', 409); if (body.messageType !== 'TEXT') throw new DemoError('DEMO hỗ trợ tin nhắn chữ; tệp cần storage thật.'); result = s.messages.find((m) => m.clientMessageId === body.clientMessageId && m.conversationId === chat.id) || create('messages', { ...body, conversationId: chat.id, senderId: user.id, deleted: false, attachments: [] }); chat.lastMessagePreview = result.content; chat.lastMessageAt = result.createdAt }
        else if (method === 'DELETE') { const message = find('messages', parts[3]); if (message.senderId !== user.id || message.conversationId !== chat.id) throw new DemoError('Chỉ xóa tin của mình.', 403); message.deleted = true; message.content = null; if (chat.lastMessageAt === message.createdAt) chat.lastMessagePreview = 'Tin nhắn đã được xóa'; result = null }
      } else if (parts[2] === 'read' && method === 'POST') { const message = find('messages', body.throughMessageId); if (message.conversationId !== chat.id) throw new DemoError('Tin không thuộc hội thoại.', 403); const lastReadAt = stamp(); chat.participants.find((participant) => participant.userId === user.id).lastReadAt = lastReadAt; result = { conversationId: chat.id, lastReadAt } }
      else if (parts[2] === 'close' && method === 'POST') result = update(chat, { status: 'CLOSED', closeReason: body.reason })
    }
  } else if (parts[0] === 'subscription-plans' && get) result = parts[1] ? find('plans', parts[1]) : s.plans.filter((p) => p.status === 'ACTIVE')
  else if (parts[0] === 'subscription-orders') {
    const order = find('subscriptionOrders', parts[1]); bakeryAccess(user, order.bakeryId)
    if (get) result = subOrderDto(order)
    else if (parts[2] === 'payments' && method === 'POST') { requireUser(user, 'BAKERY_OWNER'); if (order.status !== 'PENDING_PAYMENT') throw new DemoError('Đơn không chờ thanh toán.', 409); result = create('payments', { ...body, bakeryId: order.bakeryId, subscriptionOrderId: order.id, status: 'SUBMITTED', submittedAt: stamp() }); order.status = 'PAYMENT_REVIEW' }
  } else if (parts[0] === 'generation-jobs') {
    requireUser(user, 'CUSTOMER', 'ADMIN')
    if (!parts[1] && get) { const current = Math.max(0, Number(query.get('page')) || 0); query.set('page', String(current + 1)); const listed = page(s.jobs.filter((job) => job.customerId === user.id || has(user, 'ADMIN'))); result = { content: listed.result, page: current, size: listed.meta.pageSize, totalElements: listed.meta.total, totalPages: listed.meta.pages } }
    else {
      const job = parts[1] ? find('jobs', parts[1]) : null
      if (job && !has(user, 'ADMIN')) own(user, job)
      if (!get) {
        requireUser(user, 'CUSTOMER')
        if (job) own(user, job)
        if (parts[2] === 'cancel') { if (!['QUEUED', 'PROCESSING'].includes(job.status)) throw new DemoError('Job đã kết thúc.', 409); result = update(job, { status: 'CANCELLED' }) }
        else if (method === 'POST') {
          const request = find('requests', job?.cakeRequestId || body.cakeRequestId); own(user, request)
          if (!['DRAFT', 'OPEN'].includes(request.status)) throw new DemoError('Yêu cầu không còn cho chỉnh sửa.', 409)
          const revision = (job?.currentRevision || 0) + 1, promptRevision = { id: store.id(), revisionNumber: revision, prompt: body.prompt, negativePrompt: body.negativePrompt }
          result = job ? update(job, { status: 'QUEUED', currentRevision: revision, startedAt: stamp(), completedAt: null, promptRevisions: [...job.promptRevisions, promptRevision] }) : create('jobs', { customerId: user.id, cakeRequestId: request.id, status: 'QUEUED', modelName: 'Mẫu dựng sẵn · không gọi AI provider', currentRevision: revision, startedAt: stamp(), promptRevisions: [promptRevision], sourceImages: [] })
          for (let i = 0; i < (body.generationParameters?.numberOfDesigns || 1); i++) create('designs', { generationJobId: result.id, imageUrl: AI_RENDER_IMAGES[i % AI_RENDER_IMAGES.length], thumbnailUrl: AI_RENDER_IMAGES[i % AI_RENDER_IMAGES.length], moderationStatus: 'APPROVED', moderationReason: 'Ảnh mockdata có sẵn, không phải ảnh AI tạo từ prompt.', width: 1024, height: 1024 })
        }
      } else {
        if (['QUEUED', 'PROCESSING'].includes(job.status)) { const elapsed = Date.now() - Date.parse(job.startedAt); const status = elapsed > 3000 ? 'SUCCEEDED' : elapsed > 1000 ? 'PROCESSING' : 'QUEUED'; if (status !== job.status) { update(job, { status, ...(status === 'SUCCEEDED' ? { completedAt: stamp() } : {}) }); store.save() } }
        result = { job, currentRevision: job.currentRevision, promptRevisions: job.promptRevisions, sourceImages: job.sourceImages, generatedDesigns: s.designs.filter((design) => design.generationJobId === job.id) }
      }
    }
  } else if (parts[0] === 'generated-designs' && get) { const design = find('designs', parts[1]), job = find('jobs', design.generationJobId); if (!has(user, 'ADMIN')) own(user, job); result = design }
  else if (parts[0] === 'sample-addresses') {
    requireUser(user, 'CUSTOMER')
    if (get) result = s.addresses.filter((address) => address.customerId === user.id)
    else if (method === 'POST') {
      const payload = addressPayload(body)
      result = create('addresses', { ...payload, customerId: user.id })
      normalizeAddressDefault(s.addresses, user.id, payload.primary ? result.id : undefined)
    } else {
      const address = find('addresses', parts[1]); own(user, address)
      if (method === 'PATCH') {
        const payload = addressPayload({ ...address, ...body })
        const nextDefault = address.primary && !payload.primary ? s.addresses.find((row) => row.customerId === user.id && row.id !== address.id)?.id : undefined
        result = update(address, { ...payload, customerId: user.id })
        normalizeAddressDefault(s.addresses, user.id, payload.primary ? address.id : nextDefault)
      }
      if (method === 'DELETE') {
        s.addresses = s.addresses.filter((row) => row.id !== address.id)
        normalizeAddressDefault(s.addresses, user.id)
        result = null
      }
    }
  }
  if (result === undefined) throw new DemoError('Thao tác này chưa hỗ trợ trong DEMO; không gọi backend hoặc báo thành công giả.', 422)
  if (!get) store.save()
  return clone(result)
}
