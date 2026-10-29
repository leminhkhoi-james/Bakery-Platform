import { demoRuntime } from '../runtime.js'
import { isDemoId } from '../seed.js'

export const localUserDirectory = () => demoRuntime?.sources.get('/admin/users') === 'demo'
export function localUserRestriction(person) {
  if (!localUserDirectory() || !isDemoId(person?.id)) return null
  const state = demoRuntime.store.state
  if (Object.values(state.actors).includes(person.id)) return 'Tài khoản đang được sử dụng để đăng nhập được bảo vệ.'
  if (state.orders.some((order) => order.customerId === person.id) || state.bakeries.some((bakery) => bakery.ownerId === person.id)) return 'Người dùng đang có đơn hàng hoặc tiệm bánh liên kết, không thể xóa.'
  return null
}
