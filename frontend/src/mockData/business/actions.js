import { simulationStore } from './runtime.js'
import { routeDemo } from '../router.js'
import { DemoError } from '../store.js'

export async function businessAction(type, id, user, note = '') {
  const store = simulationStore()
  if (!store) throw new DemoError('Thao tác chỉ dùng trong không gian thực hành.', 403)
  if (store.inTransaction) throw new DemoError('Đang lưu thay đổi khác. Vui lòng thử lại sau giây lát.', 409)
  await store.refresh(); store.requireUser(user, 'BAKERY_OWNER', 'ADMIN')
  const before = structuredClone(store.state)
  store.inTransaction = true
  try {
    if (type === 'rejectOffer') {
      store.requireUser(user, 'BAKERY_OWNER')
      if (user.roles.includes('ADMIN')) throw new DemoError('Chỉ chủ tiệm được từ chối báo giá.', 403)
      const offer = store.find('offers', id)
      store.bakeryAccess(user, offer.bakeryId, true)
      if (offer.status !== 'PENDING' || !note.trim()) throw new DemoError('Cần lý do từ chối báo giá đang chờ.', 422)
      offer.status = 'REJECTED'; offer.updatedAt = new Date().toISOString()
      store.inTransaction = false; await store.save(); return offer
    }
    if (type === 'acceptOffer') {
      const offer = store.find('offers', id), request = store.find('requests', offer.cakeRequestId)
      store.bakeryAccess(user, offer.bakeryId)
      const customer = store.find('users', request.customerId), address = store.state.addresses.find(item => item.customerId === customer.id)
      if (!address || !customer.roles.includes('CUSTOMER')) throw new DemoError('Khách hàng chưa có địa chỉ hợp lệ.', 422)
      const data = routeDemo(store, '/offers/' + id + '/accept', 'POST', { deliveryAddressId: address.id, customerNote: note }, new URLSearchParams(), customer)
      if (!store.state.conversations.some(chat => chat.cakeRequestId === request.id && chat.bakeryId === offer.bakeryId)) {
        const bakery = store.find('bakeries', offer.bakeryId), createdAt = new Date().toISOString(), chatId = store.id()
        store.state.conversations.push({ id: chatId, cakeRequestId: request.id, bakeryId: bakery.id, customerId: customer.id, customerName: customer.name, bakeryName: bakery.name, requestTitle: request.title, orderId: data.orderId, status: 'OPEN', createdAt, lastMessageAt: createdAt, lastMessagePreview: 'Mình đã đồng ý báo giá. Tiệm giúp mình chốt lịch giao nhé.', participants: [{ userId: customer.id, participantType: 'CUSTOMER', joinedAt: createdAt }, { userId: bakery.ownerId, participantType: 'BAKERY', joinedAt: createdAt }] })
        store.state.messages.push({ id: store.id(), clientMessageId: store.id(), conversationId: chatId, senderId: customer.id, messageType: 'TEXT', content: 'Mình đã đồng ý báo giá. Tiệm giúp mình chốt lịch giao nhé.', attachments: [], deleted: false, createdAt })
      }
      store.inTransaction = false; await store.save(); return data
    }
    const order = store.find('orders', id)
    store.bakeryAccess(user, order.bakeryId)
    if (type === 'collect') {
      if (order.status !== 'COMPLETED' || order.paymentStatus === 'PAID') throw new DemoError('Chỉ ghi thu đơn hoàn tất chưa thanh toán.', 409)
      order.paymentStatus = 'PAID'
      const pending = store.state.salesPayments.find(payment => payment.orderId === id && payment.status === 'PENDING')
      if (pending) Object.assign(pending, { status: 'COMPLETED', createdAt: new Date().toISOString() })
      else store.state.salesPayments.push({ id: store.id(), orderId: id, bakeryId: order.bakeryId, amount: order.totalAmount, currency: order.currency, status: 'COMPLETED', createdAt: new Date().toISOString() })
    } else if (type === 'resolve') {
      if (order.issueStatus !== 'DISPUTED' || !note.trim()) throw new DemoError('Cần ghi chú kết quả xử lý phản ánh.', 422)
      order.issueStatus = 'RESOLVED'
    } else throw new DemoError('Thao tác không hợp lệ.', 422)
    order.statusHistory.push({ fromStatus: order.status, toStatus: order.status, note: note || 'Đã ghi nhận thu tiền.', changedAt: new Date().toISOString(), changedBy: user.id, changedByName: user.displayName })
    store.inTransaction = false; await store.save(); return order
  } catch (error) { Object.assign(store.state, before); throw error }
  finally { store.inTransaction = false }
}
