import { INITIAL_CAKES } from './customer/cakes.js'
import { STORES } from './customer/stores.js'
import { DEFAULT_CART_ITEMS, CHECKOUT_ACCESSORIES } from './customer/cart.js'
import { DEFAULT_PAST_ORDERS } from './customer/orders.js'
import { BIDS_DATA } from './customer/quotes.js'
import { AI_RENDER_IMAGES, AI_SHOWCASE_DATA } from './customer/aiDesigns.js'
import { INITIAL_VENDOR_CAKES } from './vendor/catalog.js'
import { INITIAL_RFQS } from './vendor/rfqs.js'
import { INITIAL_KANBAN_ORDERS } from './vendor/orders.js'
import { DEFAULT_VENDOR_SETTINGS } from './vendor/settings.js'
import { INITIAL_USERS } from './admin/users.js'
import { INITIAL_PENDING_BAKERIES } from './admin/dashboard.js'
import { DEFAULT_CUSTOMER_PROFILE, DEFAULT_SAVED_ADDRESSES } from './shared/users.js'
import { DEFAULT_BAKER_CHAT_MESSAGES } from './shared/conversations.js'

// Reserved UUID namespace: never sent to the real API.
export const demoId = (n) => `de000000-0000-4000-8000-${String(n).padStart(12, '0')}`
export const isDemoId = (id) => /^de000000-0000-4000-8000-\d{12}$/.test(id || '')
export const DEMO_STORAGE_KEY = 'sweetcake.demo.v2'
export const future = (days) => new Date(Date.now() + days * 86400000).toISOString()
export const stamp = () => new Date().toISOString()
export const cakeImage = INITIAL_CAKES[0].image

export function createCustomerAddresses(customerId, allocateId, recipientName = DEFAULT_CUSTOMER_PROFILE.fullName) {
  return DEFAULT_SAVED_ADDRESSES.map((source, i) => ({ id: allocateId(i), customerId, title: source.title, recipientName, recipientPhone: source.phone, addressLine: source.address, ward: '', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh', primary: source.isDefault }))
}

export function createSeed() {
  const customerId = demoId(1), ownerId = demoId(2)
  const users = [
    { id: customerId, name: DEFAULT_CUSTOMER_PROFILE.fullName, email: DEFAULT_CUSTOMER_PROFILE.email, roles: ['CUSTOMER'], status: 'ACTIVE' },
    { id: ownerId, name: DEFAULT_VENDOR_SETTINGS.headChef, email: DEFAULT_VENDOR_SETTINGS.email, roles: ['BAKERY_OWNER'], status: 'ACTIVE' },
    { id: demoId(3), name: INITIAL_USERS[0].name, email: INITIAL_USERS[0].email, roles: ['ADMIN'], status: 'ACTIVE' },
  ]
  const bakeries = [...STORES, ...INITIAL_PENDING_BAKERIES].map((source, i) => {
    const name = source.name
    const address = { id: demoId(80 + i), recipientName: 'Minh Anh', recipientPhone: '0901234567', addressLine: source.location, ward: 'Bến Nghé', district: 'Quận 1', city: 'TP. Hồ Chí Minh', primary: true }
    return { id: demoId(10 + i), ownerId, name, slug: `demo-bakery-${i}`, status: i >= STORES.length ? 'PENDING_APPROVAL' : 'ACTIVE', description: source.specialty || source.tagline, logoUrl: source.image, coverUrl: source.image, primaryAddress: address, operations: { addresses: [address], serviceAreas: [{ city: address.city, district: address.district, deliveryFee: 30000 }], businessHours: Array.from({ length: 7 }, (_, day) => ({ dayOfWeek: day + 1, openTime: '08:00', closeTime: '21:00', closed: false })) }, createdAt: stamp() }
  })
  const categories = []
  const categoryFor = (bakeryId, name) => { let category = categories.find((c) => c.bakeryId === bakeryId && c.name === name); if (!category) { category = { id: demoId(40000 + categories.length), bakeryId, name, slug: 'category-' + categories.length, active: true, displayOrder: categories.length }; categories.push(category) } return category.id }
  const catalog = [...INITIAL_CAKES, ...INITIAL_VENDOR_CAKES, ...DEFAULT_CART_ITEMS].filter((p, index, list) => list.findIndex((other) => other.title.toLocaleLowerCase('vi') === p.title.toLocaleLowerCase('vi')) === index)
  const products = catalog.map((source, i) => { const bakeryId = bakeries[i % STORES.length].id, sizes = source.sizes?.length ? source.sizes : [{ size: source.sizeSpec || 'Tiêu chuẩn', price: source.price || source.basePrice || 0 }], basePrice = Number(source.basePrice || source.price || sizes[0].price); return { id: i < 6 ? demoId(100 + i) : demoId(10000 + i), legacyId: source.id, bakeryId, categoryId: categoryFor(bakeryId, source.category || 'Bánh nghệ thuật'), name: source.title, slug: 'sample-product-' + i, description: source.description || source.flavor || '', basePrice, status: source.isOpenForSale === false ? 'HIDDEN' : 'PUBLISHED', customizable: true, defaultServingSize: 6, minimumNoticeHours: 24, images: [{ id: demoId(20000 + i), url: source.image, primary: true, displayOrder: 0 }], options: { groups: [{ id: demoId(30000 + i * 20), name: 'Kích thước', selectionType: 'SINGLE', required: false, minimumSelections: 0, maximumSelections: 1, displayOrder: 0, values: sizes.map((size, j) => ({ id: demoId(30001 + i * 20 + j), name: size.size || size.label, priceAdjustment: Number(size.price) - basePrice, active: true, displayOrder: j })) }] }, createdAt: stamp() } })
  const requests = INITIAL_RFQS.map((source, i) => ({ id: demoId(200 + i), legacyId: source.id, customerId, requestType: 'OPEN_CUSTOM', title: source.title, description: source.description, occasion: source.categoryName, neededAt: future(7 + i), offerDeadline: future(3), deliveryDistrict: source.shortAddress || 'Quận 1', deliveryCity: 'TP. Hồ Chí Minh', budgetMin: Math.round(source.budget * .8), budgetMax: source.budget, servingSize: 12, status: ['OPEN', 'DRAFT', 'CLOSED', 'CANCELLED'].includes(source.status) ? source.status : 'OPEN', preference: { cakeSize: source.sizeRequirement, flavor: source.flavorRequirement }, images: [source.image, ...(source.thumbnails || [])].filter(Boolean).map((url, j) => ({ id: demoId(50000 + i * 20 + j), url, displayOrder: j })), statusHistory: [], optionSelections: [], offers: [], createdAt: stamp(), updatedAt: stamp() }))


  const addOns = bakeries.flatMap((bakery, i) => CHECKOUT_ACCESSORIES.map((source, j) => ({ id: demoId(70000 + i * 100 + j), bakeryId: bakery.id, name: source.name, category: 'Trang trí', price: source.price, active: true, description: source.desc })))
  const offers = BIDS_DATA.map((source, i) => ({ id: demoId(300 + i), cakeRequestId: requests[0].id, bakeryId: bakeries[i % STORES.length].id, status: 'PENDING', cakePrice: source.price, deliveryFee: 30000, addOnTotal: 0, totalPrice: source.price + 30000, estimatedCompletionAt: future(source.durationDays || 2), expiresAt: future(2), message: source.pitchQuote, items: [], statusHistory: [], createdAt: stamp(), updatedAt: stamp() }))
  const stages = { pending: 'PENDING', scheduled: 'CONFIRMED', baking: 'BAKING', delivering: 'DELIVERING', completed: 'COMPLETED' }
  const orderFixtures = [...Object.entries(INITIAL_KANBAN_ORDERS).flatMap(([stage, rows]) => rows.map((row) => ({ ...row, status: stages[stage] }))), ...DEFAULT_PAST_ORDERS.map((row) => ({ ...row, status: 'COMPLETED' }))]
  const orders = orderFixtures.map((source, i) => ({ id: demoId(400 + i), customerId, bakeryId: bakeries[0].id, bakeryName: bakeries[0].name, customerName: source.customer || users[0].name, customerPhone: source.phone || DEFAULT_CUSTOMER_PROFILE.phone, orderNumber: 'MẪU-' + source.id.replace(/^#/, ''), status: source.status, orderSource: 'DIRECT_CATALOG', currency: 'VND', subtotal: source.price, deliveryFee: 30000, totalAmount: source.price + 30000, neededAt: source.status === 'COMPLETED' ? future(-2 - i) : future(2 + i), createdAt: future(-10 - i), completedAt: source.status === 'COMPLETED' ? future(-2 - i + .01) : null, customerNote: source.description || source.subtitle || '', items: [{ id: demoId(80000 + i), sourceProductId: products.find((p) => p.name === source.title)?.id || null, name: source.title, quantity: 1, unitPrice: source.price, lineTotal: source.price, itemType: 'CATALOG_PRODUCT', configuration: {} }], statusHistory: [{ fromStatus: null, toStatus: source.status, changedAt: stamp() }], deliveryAddress: { recipientName: users[0].name, recipientPhone: source.phone || DEFAULT_CUSTOMER_PROFILE.phone, addressLine: source.address || DEFAULT_CUSTOMER_PROFILE.address, district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh' }, review: null }))

  const plans = ['Khởi đầu', 'Nghệ nhân', 'Chuyên nghiệp'].map((name, i) => ({ id: demoId(500 + i), code: 'DEMO_' + i, name, description: 'Gói minh họa; không thu phí.', monthlyPrice: 199000 + i * 200000, currency: 'VND', billingPeriodMonths: 1, status: 'ACTIVE', features: { products: String(20 + i * 30), support: 'Hỗ trợ đối tác' } }))
  const subscriptionOrders = [{ id: demoId(510), bakeryId: bakeries[0].id, planId: plans[1].id, orderNumber: 'DEMO-SUB-101', planNameSnapshot: plans[1].name, planCodeSnapshot: plans[1].code, featuresSnapshot: plans[1].features, billingPeriodMonths: 1, totalAmount: plans[1].monthlyPrice, currency: 'VND', status: 'PAYMENT_REVIEW', expiresAt: future(3), createdAt: stamp() }]
  const payments = [{ id: demoId(520), bakeryId: bakeries[0].id, subscriptionOrderId: demoId(510), amount: plans[1].monthlyPrice, currency: 'VND', status: 'SUBMITTED', paymentMethod: 'BANK_TRANSFER', paymentReference: 'DEMO-ONLY', submittedAt: stamp() }]
  const conversations = [{ id: demoId(600), customerId, bakeryId: bakeries[0].id, cakeRequestId: requests[0].id, status: 'OPEN', unreadCount: 1, lastMessageAt: stamp(), lastMessagePreview: DEFAULT_BAKER_CHAT_MESSAGES[0].text, createdAt: stamp(), participants: [{ userId: customerId, participantType: 'CUSTOMER' }, { userId: ownerId, participantType: 'BAKERY' }] }]
  const messages = DEFAULT_BAKER_CHAT_MESSAGES.map((source, i) => ({ id: demoId(610 + i * 2), conversationId: demoId(600), clientMessageId: demoId(611 + i * 2), senderId: source.sender === 'user' ? customerId : ownerId, messageType: 'TEXT', content: source.text, attachments: [], deleted: false, createdAt: stamp() }))
  const addresses = createCustomerAddresses(customerId, (i) => demoId(90000 + i), users[0].name)
  const jobs = [{ id: demoId(91000), customerId, cakeRequestId: requests[0].id, status: 'SUCCEEDED', modelName: 'Mẫu dựng sẵn · không gọi AI provider', currentRevision: 1, createdAt: stamp(), completedAt: stamp(), updatedAt: stamp(), promptRevisions: [{ id: demoId(92000), revisionNumber: 1, prompt: AI_SHOWCASE_DATA.promptText }], sourceImages: [] }]
  const designs = AI_RENDER_IMAGES.map((url, i) => ({ id: demoId(93000 + i), generationJobId: jobs[0].id, imageUrl: url, thumbnailUrl: url, moderationStatus: 'APPROVED', moderationReason: 'Ảnh mẫu có sẵn trong mockdata, không phải kết quả gọi AI thật.', width: 1024, height: 1024 }))
  users.push(...INITIAL_USERS.slice(1).map((source, i) => ({ ...source, id: demoId(60000 + i), roles: ['CUSTOMER'], status: source.status === 'active' ? 'ACTIVE' : 'SUSPENDED' })))
  return { version: 2, actors: {}, addressOwners: [customerId], users, bakeries, categories, products, requests, offers, orders, plans, subscriptionOrders, payments, conversations, messages, addresses, subscriptions: [], jobs, designs, addOns, members: [], nextId: 1000000 }
}
