import { simulationStore } from './runtime.js'
import { DemoError } from '../store.js'

export async function businessRequestChange(action, id, input, user) {
  const store = simulationStore()
  if (!store) throw new DemoError('Chức năng chỉ dùng trong không gian thực hành.', 403)
  if (store.inTransaction) throw new DemoError('Đang lưu thay đổi khác. Vui lòng thử lại.', 409)
  store.requireUser(user, 'ADMIN'); store.reload()
  const before = structuredClone(store.state), now = new Date().toISOString()
  try {
    let request = id ? store.find('requests', id) : null
    if (action === 'create') {
      const customer = store.find('users', input.customerId)
      if (!customer.roles.includes('CUSTOMER') || customer.roles.includes('BAKERY_OWNER') || !input.title?.trim() || input.title.length > 180 || !(Number(input.budgetMin) >= 0) || !(Number(input.budgetMax) >= Number(input.budgetMin)) || Date.parse(input.neededAt) <= Date.now() || !Number.isFinite(Date.parse(input.neededAt)) || Date.parse(input.offerDeadline) >= Date.parse(input.neededAt) || !(Date.parse(input.offerDeadline) > Date.now())) throw new DemoError('Kiểm tra khách hàng, ngân sách và thời hạn yêu cầu.', 422)
      request = { id: store.id(), customerId: customer.id, requestType: 'OPEN_CUSTOM', title: input.title.trim(), description: input.description?.trim() || 'Khách cần tiệm tư vấn mẫu bánh và lịch giao phù hợp.', occasion: 'Tiệc gia đình', servingSize: 8, budgetMin: Number(input.budgetMin), budgetMax: Number(input.budgetMax), neededAt: new Date(input.neededAt).toISOString(), offerDeadline: new Date(input.offerDeadline).toISOString(), deliveryDistrict: 'Quận 1', deliveryCity: 'TP. Hồ Chí Minh', status: 'DRAFT', preference: { cakeSize: '20 cm', flavor: 'Vanilla' }, images: [], optionSelections: [], statusHistory: [], createdAt: now, updatedAt: now }
      store.state.requests.unshift(request)
    } else if (action === 'publish') {
      if (request.status !== 'DRAFT' || Date.parse(request.offerDeadline) <= Date.now()) throw new DemoError('Chỉ mở yêu cầu nháp còn hạn nhận báo giá.', 409)
      request.statusHistory.push({ fromStatus: request.status, toStatus: 'OPEN', changedAt: now, reason: 'Đã xác nhận thông tin với khách.' }); request.status = 'OPEN'
    } else if (action === 'cancel') {
      if (!['DRAFT', 'OPEN'].includes(request.status) || !input.reason?.trim()) throw new DemoError('Cần lý do hủy yêu cầu đang mở hoặc bản nháp.', 422)
      request.statusHistory.push({ fromStatus: request.status, toStatus: 'CANCELLED', changedAt: now, reason: input.reason.trim() }); request.status = 'CANCELLED'
      store.state.offers.filter(offer => offer.cakeRequestId === id && offer.status === 'PENDING').forEach(offer => { offer.status = 'REJECTED' })
    } else throw new DemoError('Thao tác yêu cầu không hợp lệ.', 422)
    request.updatedAt = now; await store.save(); return request
  } catch (error) { Object.assign(store.state, before); throw error }
}
