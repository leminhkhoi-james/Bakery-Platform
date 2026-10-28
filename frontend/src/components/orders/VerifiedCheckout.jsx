import React from 'react'
import { useAuth } from '../../context/useAuth.js'
import { buttonClass } from '../management/ApiState.jsx'
import AddressPicker from './AddressPicker.jsx'
import { demoRuntime } from '../../mockData/runtime.js'
import { isDemoId } from '../../mockData/seed.js'
import MockCheckout from '../../mockData/MockCheckout.jsx'

export default function VerifiedCheckout({ offerId, items = [], ...props }) {
  const { user } = useAuth()
  if (demoRuntime && (isDemoId(offerId) || items.length > 0 && items.every((item) => isDemoId(item.productId) && isDemoId(item.bakeryId)))) return <MockCheckout key={user?.id || 'anonymous'} {...props} offerId={offerId} items={items} />
  return <section className="space-y-4"><AddressPicker />{!user?.roles?.includes('CUSTOMER') && <p>Vui lòng đăng nhập tài khoản khách hàng để tiếp tục. Hiện chưa thể xác nhận đơn hàng.</p>}<button type="button" disabled className={buttonClass}>{offerId ? 'Chưa thể chấp nhận báo giá' : 'Chưa thể đặt hàng'}</button></section>
}
