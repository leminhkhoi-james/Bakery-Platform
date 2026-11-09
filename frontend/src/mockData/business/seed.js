import catalog from './catalogReference.json' with { type: 'json' }
import menu from './menuReference.json' with { type: 'json' }
import { createSeed } from '../seed.js'

export const businessId = (n) => '5c000000-0000-4000-8000-' + String(n).padStart(12, '0')
export const isBusinessId = (id) => /^5c000000-0000-4000-8000-\d{12}$/.test(id || '')
// Fix only the original RFQ seed event, whose fixed timestamp predates some requests.
export function repairSeedRequestDates(state) {
  const originalEventTime = Date.parse(state.anchor) - 3 * 86400000
  const seedRequestIds = new Set(Array.from({ length: 20 }, (_, index) => businessId(200000 + index)))
  let changed = false
  for (const request of state.requests || []) {
    const event = request.statusHistory?.[0]
    if (!seedRequestIds.has(request.id) || event?.fromStatus !== 'DRAFT' ||
        event.reason !== 'Khách đã gửi yêu cầu.' || Date.parse(event.changedAt) !== originalEventTime ||
        Date.parse(event.changedAt) >= Date.parse(request.createdAt)) continue
    event.changedAt = request.createdAt
    changed = true
  }
  return changed
}

export const BUSINESS_STORAGE_KEY = 'sweetcake.business-simulation.v1'
export const BUSINESS_MODE_KEY = 'sweetcake.business-simulation.enabled'
const day = 86400000
const nextMonth = iso => { const date = new Date(iso), originalDay = date.getUTCDate(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 1); date.setUTCDate(Math.min(originalDay, new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate())); return date.toISOString() }
const names = ['Nguyễn Minh Anh', 'Trần Bảo Ngọc', 'Lê Hoàng Nam', 'Phạm Thu Hà', 'Võ Gia Hân', 'Đặng Quang Huy', 'Bùi Ngọc Linh', 'Đỗ Thanh Tâm', 'Huỳnh Phương Thảo', 'Ngô Anh Khoa', 'Vũ Khánh Ly', 'Dương Đức Minh', 'Lý Thanh Mai', 'Phan Tuấn Anh', 'Trịnh Ngọc Ánh', 'Mai Nhật Linh', 'Hồ Hải Yến', 'Cao Bảo An', 'Tạ Hương Giang', 'Đinh Minh Quân', 'Lâm Diệu My', 'Châu Khánh Duy']
const ownerNames = ['Nguyễn Thanh Phương', 'Trần Gia Bảo', 'Lê Thảo Nguyên']
const shopNames = ['La Crème Pâtisserie', 'Atelier Sucré', 'Maison Fleur']

export function createBusinessSeed(now = Date.now()) {
  const time = (days, hours = 0) => new Date(now + days * day + hours * 3600000).toISOString()
  const state = { ...createSeed(), businessVersion: 1, anchor: new Date(now).toISOString(), nextId: 8000000, actors: {}, receipts: {}, salesPayments: [] }
  for (const key of ['bakeries', 'categories', 'products', 'requests', 'offers', 'orders', 'conversations', 'messages', 'subscriptions', 'subscriptionOrders', 'payments', 'members', 'addresses', 'addOns', 'jobs', 'designs']) state[key] = []
  state.users = names.map((name, i) => ({ id: businessId(100 + i), name, displayName: name, email: 'khach' + (i + 1) + '@example.invalid', phoneNumber: '090' + String(1000000 + i), roles: ['CUSTOMER'], status: i === 21 ? 'BLOCKED' : 'ACTIVE', createdAt: time(-60 - i) }))
  state.plans = catalog.plans.map((plan, i) => ({ ...plan, id: businessId(500 + i), sourcePlanId: plan.id, features: { ...plan.features } }))
  const pro = state.plans.find(p => p.code === 'PRO')
  let productIndex = 0
  for (const [shopIndex, source] of catalog.shops.entries()) {
    const id = businessId(10 + shopIndex), address = { id: businessId(40 + shopIndex), recipientName: ownerNames[shopIndex], recipientPhone: '028382200' + String(10 + shopIndex), addressLine: ['18 Nguyễn Đình Chiểu', '25 Nguyễn Thị Minh Khai', '42 Xuân Thủy'][shopIndex], ward: 'Bến Nghé', district: shopIndex === 2 ? 'Thảo Điền' : 'Quận 1', city: 'TP. Hồ Chí Minh', isPrimary: true }
    state.users.push({ id: source.ownerId, name: ownerNames[shopIndex], displayName: ownerNames[shopIndex], email: source.email, roles: ['BAKERY_OWNER', 'CUSTOMER'], status: 'ACTIVE', createdAt: time(-180) })
    state.bakeries.push({ id, sourceBakeryId: source.sourceId, ownerId: source.ownerId, name: shopNames[shopIndex], slug: 'business-shop-' + shopIndex, status: 'ACTIVE', description: ['Bánh Pháp thủ công, làm mới mỗi ngày theo đơn đặt.', 'Mousse, tart và bánh tiệc với hương vị thanh nhẹ.', 'Bánh hoa nghệ thuật dành cho những dịp đặc biệt.'][shopIndex], phoneNumber: address.recipientPhone, email: source.email, logoUrl: '/business-simulation/scmenu-20261108-01.jpeg', primaryAddress: address, operations: { addresses: [address], serviceAreas: ['Quận 1', 'Thảo Điền', 'Bình Thạnh'].map(district => ({ city: address.city, district, deliveryFee: 30000, active: true })), businessHours: Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i + 1, opensAt: '08:00', closesAt: '21:00', closed: false })) }, createdAt: time(-200) })
    state.members.push({ id: businessId(50 + shopIndex), bakeryId: id, userId: source.ownerId, memberRole: 'OWNER', status: 'ACTIVE', displayNameSnapshot: ownerNames[shopIndex] })
    for (const [ci, cat] of source.categories.entries()) state.categories.push({ ...cat, name: cat.name.replace(/SCQA-\d{8}\s*/g, ''), id: businessId(1000 + shopIndex * 100 + ci), sourceCategoryId: cat.id, bakeryId: id })
    for (const product of source.products) {
      const reference = menu[productIndex % menu.length]
      const category = state.categories.find(c => c.bakeryId === id && c.sourceCategoryId === product.categoryId) || state.categories.find(c => c.bakeryId === id)
      const index = productIndex++, productId = businessId(10000 + index), basePrice = Number(reference.basePrice || reference.price || product.basePrice)
      const sizes = reference.sizes?.length ? reference.sizes : [{ size: '16 cm · 4–6 người', price: basePrice }, { size: '20 cm · 8–10 người', price: basePrice + 150000 }]
      state.products.push({ ...product, id: productId, sourceProductId: product.id, bakeryId: id, categoryId: category.id, name: reference.title, slug: 'business-cake-' + index, description: reference.description || reference.tag || 'Bánh được làm theo đơn, nguyên liệu tươi và độ ngọt vừa phải.', basePrice, status: index === 45 ? 'DRAFT' : index % 15 === 14 ? 'ARCHIVED' : index % 13 === 12 ? 'HIDDEN' : index % 9 === 8 ? 'DRAFT' : 'PUBLISHED', customizable: true, images: index === 45 ? [] : [{ id: businessId(20000 + index), url: reference.image, primary: true, displayOrder: 0 }], options: { groups: [{ id: businessId(30000 + index * 10), name: 'Kích thước', selectionType: 'SINGLE', required: true, minimumSelections: 1, maximumSelections: 1, displayOrder: 0, values: sizes.map((size, i) => ({ id: businessId(30001 + index * 10 + i), name: size.size || size.label, priceAdjustment: Number(size.price) - basePrice, active: true, displayOrder: i })) }] }, createdAt: time(-90 + index % 25) })
    }
    state.addOns.push(...['Nến sinh nhật', 'Thiệp viết tay', 'Dâu tây tươi'].map((name, i) => ({ id: businessId(40000 + shopIndex * 10 + i), bakeryId: id, name, description: ['Bộ nến nhiều màu', 'Lời chúc theo yêu cầu', 'Thêm lớp dâu tươi'][i], category: 'Trang trí', price: [15000, 10000, 35000][i], active: true })))
    state.subscriptions.push({ id: businessId(700 + shopIndex), bakeryId: id, sourceOrderId: businessId(600 + shopIndex), planId: pro.id, planCode: pro.code, planName: pro.name, featuresSnapshot: pro.features, status: shopIndex === 2 ? 'EXPIRED' : 'ACTIVE', periodStart: time(shopIndex === 2 ? -60 : -15), periodEnd: time(shopIndex === 2 ? -30 : 15) })
  }
  state.addresses = state.users.filter(u => u.roles.includes('CUSTOMER') && !u.roles.includes('BAKERY_OWNER')).map((u, i) => ({ id: businessId(200 + i), customerId: u.id, title: i % 3 === 0 ? 'Văn phòng' : 'Nhà riêng', recipientName: u.name, recipientPhone: u.phoneNumber, addressLine: (12 + i * 3) + ' ' + ['Lê Văn Sỹ', 'Nguyễn Văn Trỗi', 'Điện Biên Phủ', 'Phan Xích Long'][i % 4], ward: 'Phường 7', district: 'Quận 1', city: 'TP. Hồ Chí Minh', primary: true }))
  state.addressOwners = state.addresses.map(a => a.customerId)
  const sequence = ['PENDING', 'CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED']
  const distribution = ['PENDING', 'CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED']
  for (let i = 0; i < 54; i++) {
    const shop = state.bakeries[i < 34 ? 0 : i < 44 ? 1 : 2], customer = state.users[i % names.length], product = state.products.filter(p => p.bakeryId === shop.id && p.status === 'PUBLISHED')[i % 5], quantity = i % 5 === 0 ? 2 : 1, subtotal = product.basePrice * quantity, status = distribution[i % distribution.length], createdAt = time(-1 - i % 45), paid = status === 'COMPLETED' && i % 13 !== 0
    const history = (status === 'CANCELLED' ? ['PENDING', 'CANCELLED'] : sequence.slice(0, sequence.indexOf(status) + 1)).map((toStatus, j, values) => ({ fromStatus: j ? values[j - 1] : null, toStatus, changedAt: ['COMPLETED', 'CANCELLED'].includes(status) ? new Date(Date.parse(createdAt) + j * 6 * 3600000).toISOString() : j < 2 ? new Date(Date.parse(createdAt) + j * 3600000).toISOString() : time(0, -2 * (values.length - j)), changedBy: shop.ownerId, changedByName: ownerNames[state.bakeries.indexOf(shop)], note: toStatus === 'CANCELLED' ? 'Khách đã đổi kế hoạch, đơn được hủy theo yêu cầu.' : ['Đã tiếp nhận yêu cầu.', 'Đã xác nhận mẫu bánh và thời gian giao.', 'Bắt đầu làm bánh.', 'Đã hoàn tất trang trí.', 'Đã bàn giao cho người giao hàng.', 'Khách đã nhận đủ bánh.'][j] }))
    const id = businessId(100000 + i), completedAt = status === 'COMPLETED' ? history.at(-1).changedAt : null
    const review = status === 'COMPLETED' && i % 2 ? { id: businessId(150000 + i), orderId: id, customerId: customer.id, rating: i === 51 ? 2 : i % 3 === 0 ? 4 : 5, comment: ['Bánh vừa ngọt, trang trí đẹp và giao đúng giờ.', 'Cả nhà rất thích lớp kem nhẹ, cảm ơn tiệm.', 'Đóng gói cẩn thận, bánh giống mẫu đã thống nhất.'][i % 3], status: 'PUBLISHED', createdAt: completedAt, updatedAt: completedAt } : null
    state.orders.push({ id, bakeryId: shop.id, bakeryName: shop.name, customerId: customer.id, customerName: customer.name, customerPhone: customer.phoneNumber, orderNumber: 'SC-' + String(260900 + i), orderSource: 'DIRECT_CATALOG', status, currency: 'VND', subtotal, deliveryFee: 30000, totalAmount: subtotal + 30000, customerNote: i % 2 ? 'Ít ngọt, vui lòng giữ lạnh trước khi giao.' : 'Viết lời chúc sinh nhật bằng chocolate.', createdAt, updatedAt: history.at(-1).changedAt, acceptedAt: status !== 'PENDING' ? history[1]?.changedAt : null, completedAt, neededAt: [0, 11, 22].includes(i) ? time(-1, 3) : ['PENDING', 'CONFIRMED'].includes(status) ? time(1 + i % 3, i % 7) : ['BAKING', 'READY', 'DELIVERING'].includes(status) ? time(0, 4 + i % 5) : completedAt || new Date(Date.parse(createdAt) + 48 * 3600000).toISOString(), scheduledAt: status === 'CONFIRMED' ? time(2) : null, issueStatus: status === 'COMPLETED' && i % 17 === 0 ? 'DISPUTED' : null, paymentStatus: paid ? 'PAID' : status === 'CANCELLED' ? 'REFUNDED' : 'UNPAID', items: [{ id: businessId(110000 + i), sourceProductId: product.id, name: product.name, itemType: 'CATALOG_PRODUCT', quantity, unitPrice: product.basePrice, lineTotal: subtotal, configuration: { size: product.options.groups[0].values[0].name } }], statusHistory: history, deliveryAddress: structuredClone(state.addresses[i % names.length]), review })
    if (paid) state.salesPayments.push({ id: businessId(120000 + i), orderId: id, bakeryId: shop.id, amount: subtotal + 30000, currency: 'VND', status: 'COMPLETED', createdAt: completedAt })
    else if (status === 'CANCELLED') {
      state.salesPayments.push({ id: businessId(120000 + i), orderId: id, bakeryId: shop.id, amount: subtotal + 30000, currency: 'VND', status: 'COMPLETED', createdAt }, { id: businessId(130000 + i), orderId: id, bakeryId: shop.id, amount: subtotal + 30000, currency: 'VND', status: 'REFUNDED', createdAt: history.at(-1).changedAt })
    } else state.salesPayments.push({ id: businessId(120000 + i), orderId: id, bakeryId: shop.id, amount: subtotal + 30000, currency: 'VND', status: 'PENDING', createdAt })
  }
  for (let i = 0; i < 20; i++) {
    const customer = state.users[i % names.length], product = state.products[(i * 2) % state.products.length], status = i < 15 ? 'OPEN' : i < 16 ? 'DRAFT' : i < 18 ? 'OFFER_SELECTED' : i === 18 ? 'CLOSED' : 'CANCELLED'
    state.requests.push({ id: businessId(200000 + i), customerId: customer.id, customerName: customer.name, requestType: 'OPEN_CUSTOM', title: ['Bánh sinh nhật hoa kem cho mẹ', 'Bánh tiệc công ty tông xanh trắng', 'Bánh kỷ niệm ngày cưới', 'Bánh mừng thôi nôi', 'Bánh tiệc trà cuối tuần'][i % 5] + ' · ' + customer.name.split(' ').at(-1), description: 'Cần bánh làm mới, vị nhẹ, trang trí tinh tế. Mong tiệm tư vấn mẫu và thời gian giao phù hợp.', occasion: i % 2 ? 'Tiệc gia đình' : 'Sinh nhật', neededAt: time(7 + i), offerDeadline: time(3), deliveryDistrict: 'Quận 1', deliveryCity: 'TP. Hồ Chí Minh', servingSize: 6 + i % 4 * 2, budgetMin: 400000, budgetMax: 1200000, status, preference: { cakeSize: '20 cm', flavor: i % 2 ? 'Chocolate' : 'Vanilla', allergyNotes: 'Không đậu phộng' }, images: product.images, optionSelections: [], statusHistory: [{ fromStatus: 'DRAFT', toStatus: status, changedAt: time(-3), reason: 'Khách đã gửi yêu cầu.' }], createdAt: time(-5 + i % 4), updatedAt: time(-1) })
  }
  for (let i = 0; i < 26; i++) {
    const req = state.requests[i % 13], shop = state.bakeries[i < 13 ? 0 : i < 20 ? 1 : 2], status = i >= 23 ? 'EXPIRED' : i >= 20 ? 'REJECTED' : i === 19 ? 'WITHDRAWN' : 'PENDING', cakePrice = 480000 + i % 6 * 50000
    state.offers.push({ id: businessId(300000 + i), cakeRequestId: req.id, bakeryId: shop.id, bakeryName: shop.name, status, cakePrice, deliveryFee: 30000, addOnTotal: 0, totalPrice: cakePrice + 30000, currency: 'VND', estimatedCompletionAt: time(5), expiresAt: status === 'EXPIRED' ? time(-1) : time(2), message: 'Tiệm đề xuất cốt chiffon mềm, kem tươi ít ngọt và trang trí theo tông màu đã chọn. Giá đã gồm hộp và nến.', items: [], statusHistory: [], createdAt: time(-2), updatedAt: time(-1) })
  }
  for (let i = 0; i < 2; i++) {
    const req = state.requests[16 + i], order = state.orders.filter(o => o.status === 'COMPLETED')[i], shop = state.bakeries.find(b => b.id === order.bakeryId), offer = state.offers[18 - i]
    Object.assign(offer, { cakeRequestId: req.id, bakeryId: shop.id, status: 'ACCEPTED', orderId: order.id, cakePrice: order.subtotal, totalPrice: order.totalAmount })
    Object.assign(order, { orderSource: 'ACCEPTED_OFFER', cakeRequestId: req.id, offerId: offer.id })
    Object.assign(req, { customerId: order.customerId, customerName: order.customerName, neededAt: order.neededAt, createdAt: new Date(Date.parse(order.createdAt) - 2 * 3600000).toISOString(), updatedAt: order.acceptedAt })
    Object.assign(offer, { bakeryName: shop.name, createdAt: new Date(Date.parse(order.createdAt) - 3600000).toISOString(), updatedAt: order.acceptedAt, estimatedCompletionAt: order.neededAt, expiresAt: new Date(Date.parse(order.acceptedAt) + day).toISOString() })
    req.selectedOfferId = offer.id
  }
  for (let i = 0; i < 12; i++) {
    const req = state.requests[i], shop = state.bakeries[i < 8 ? 0 : i < 10 ? 1 : 2], customer = state.users.find(u => u.id === req.customerId), id = businessId(400000 + i), createdAt = time(-2, i / 2)
    state.conversations.push({ id, cakeRequestId: req.id, bakeryId: shop.id, customerId: customer.id, customerName: customer.name, bakeryName: shop.name, requestTitle: req.title, orderId: state.orders.find(order => order.bakeryId === shop.id && order.customerId === customer.id)?.id || null, status: i === 11 ? 'CLOSED' : 'OPEN', createdAt, updatedAt: time(-1), lastMessageAt: time(-1), lastMessagePreview: 'Tiệm đã ghi nhận, sẽ chuẩn bị đúng hẹn nhé.', participants: [{ userId: customer.id, joinedAt: createdAt, lastReadAt: createdAt }, { userId: shop.ownerId, joinedAt: createdAt, lastReadAt: createdAt }] })
    for (const [j, content] of ['Chào tiệm, mình muốn bánh ít ngọt và giao trước 17 giờ nhé.', 'Tiệm có thể chuẩn bị đúng giờ. Bạn muốn ghi lời chúc như thế nào?', 'Ghi giúp mình “Chúc mừng sinh nhật” và tên người nhận nhé.', 'Tiệm đã ghi nhận, sẽ chuẩn bị đúng hẹn nhé.'].entries()) state.messages.push({ id: businessId(410000 + i * 10 + j), conversationId: id, clientMessageId: businessId(420000 + i * 10 + j), senderId: j % 2 ? shop.ownerId : customer.id, messageType: 'TEXT', content, attachments: [], deleted: false, createdAt: new Date(Date.parse(createdAt) + j * 600000).toISOString() })
  }
  for (let i = 0; i < 12; i++) {
    const shop = state.bakeries[i % 3], plan = state.plans[i % 3], status = i === 0 ? 'PENDING_PAYMENT' : i === 2 ? 'PAYMENT_REVIEW' : i === 3 ? 'REJECTED' : i === 4 ? 'EXPIRED' : 'COMPLETED', id = businessId(600 + i)
    const createdAt = status === 'COMPLETED' ? time(-120 + i * 5) : ['PENDING_PAYMENT', 'PAYMENT_REVIEW'].includes(status) ? time(-.25) : time(-50 + i * 4)
    const completedAt = status === 'COMPLETED' ? new Date(Date.parse(createdAt) + 6 * 3600000).toISOString() : null
    state.subscriptionOrders.push({ id, bakeryId: shop.id, planId: plan.id, planNameSnapshot: plan.name, planCodeSnapshot: plan.code, featuresSnapshot: plan.features, billingPeriodMonths: 1, totalAmount: plan.monthlyPrice, currency: 'VND', status, orderNumber: 'SUB-' + (260100 + i), createdAt, expiresAt: new Date(Date.parse(createdAt) + day).toISOString(), completedAt })
    if (status !== 'PENDING_PAYMENT' && status !== 'EXPIRED') state.payments.push({ id: businessId(800 + i), bakeryId: shop.id, subscriptionOrderId: id, amount: plan.monthlyPrice, currency: 'VND', paymentMethod: 'BANK_TRANSFER', paymentReference: 'PT-' + (260100 + i), submittedByUserId: shop.ownerId, submittedByName: ownerNames[i % 3], status: status === 'PAYMENT_REVIEW' ? 'SUBMITTED' : status === 'REJECTED' ? 'REJECTED' : 'APPROVED', submittedAt: new Date(Date.parse(createdAt) + 2 * 3600000).toISOString(), reviewedAt: status === 'PAYMENT_REVIEW' ? null : completedAt || new Date(Date.parse(createdAt) + 6 * 3600000).toISOString(), reviewedByAdminId: null, reviewNote: status === 'REJECTED' ? 'Thông tin đối chiếu chưa khớp, vui lòng kiểm tra lại.' : 'Đã đối chiếu phiếu thu nội bộ.' })
  }
  state.users.push({ id: businessId(3), name: 'Phạm Hải Anh', displayName: 'Phạm Hải Anh', email: 'dieu.hanh@example.invalid', roles: ['ADMIN'], status: 'ACTIVE', createdAt: time(-200) })
  for (const payment of state.payments) if (payment.status !== 'SUBMITTED') { payment.reviewedByAdminId = businessId(3); payment.reviewedByName = 'Phạm Hải Anh' }
  for (const [i, period] of state.subscriptions.entries()) {
    period.periodEnd = nextMonth(period.periodStart)
    const id = businessId(900 + i), shop = state.bakeries[i]
    period.sourceOrderId = id
    state.subscriptionOrders.push({ id, bakeryId: shop.id, planId: pro.id, planNameSnapshot: pro.name, planCodeSnapshot: pro.code, featuresSnapshot: pro.features, billingPeriodMonths: 1, totalAmount: pro.monthlyPrice, currency: 'VND', status: 'COMPLETED', orderNumber: 'SUB-26009' + i, createdAt: period.periodStart, completedAt: period.periodStart, expiresAt: new Date(Date.parse(period.periodStart) + day).toISOString(), period: structuredClone(period) })
    state.payments.push({ id: businessId(950 + i), bakeryId: shop.id, subscriptionOrderId: id, amount: pro.monthlyPrice, currency: 'VND', status: 'APPROVED', paymentMethod: 'BANK_TRANSFER', paymentReference: 'PT-26009' + i, submittedByUserId: shop.ownerId, submittedByName: ownerNames[i], submittedAt: period.periodStart, reviewedAt: period.periodStart, reviewNote: 'Đã ghi nhận phiếu thu nội bộ.' })
  }
  for (const [i, product] of state.products.entries()) product.options.groups.push(
    { id: businessId(500000 + i * 20), name: 'Hương vị', selectionType: 'SINGLE', required: false, minimumSelections: 0, maximumSelections: 1, displayOrder: 1, values: [{ id: businessId(500001 + i * 20), name: 'Hương vị nguyên bản', priceAdjustment: 0, active: true, displayOrder: 0 }, { id: businessId(500002 + i * 20), name: 'Chocolate Bỉ', priceAdjustment: 20000, active: true, displayOrder: 1 }] },
    { id: businessId(500010 + i * 20), name: 'Topping', selectionType: 'MULTIPLE', required: false, minimumSelections: 0, maximumSelections: 2, displayOrder: 2, values: [{ id: businessId(500011 + i * 20), name: 'Dâu tây tươi', priceAdjustment: 35000, active: true, displayOrder: 0 }, { id: businessId(500012 + i * 20), name: 'Hạnh nhân lát', priceAdjustment: 25000, active: true, displayOrder: 1 }] }
  )
  for (const [i, order] of state.subscriptionOrders.entries()) if (order.status === 'COMPLETED' && !state.subscriptions.some(period => period.sourceOrderId === order.id)) {
    const period = { id: businessId(170000 + i), bakeryId: order.bakeryId, sourceOrderId: order.id, planId: order.planId, planCode: order.planCodeSnapshot, featuresSnapshot: order.featuresSnapshot, status: 'EXPIRED', periodStart: order.completedAt, periodEnd: nextMonth(order.completedAt) }
    state.subscriptions.push(period); order.period = structuredClone(period)
  }
  for (const chat of state.conversations) chat.lastMessageAt = state.messages.filter(message => message.conversationId === chat.id).at(-1).createdAt
  repairSeedRequestDates(state)
  return state
}
