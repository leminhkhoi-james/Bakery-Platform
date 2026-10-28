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
  return <section className="space-y-4"><AddressPicker />{!user?.roles?.includes('CUSTOMER') && <p>Đăng nhập tài khoản Customer để xem đơn hàng. Checkout hiện chưa khả dụng.</p>}<button type="button" disabled className={buttonClass}>{offerId ? 'Chấp nhận báo giá — BLOCKED' : 'Đặt hàng — BLOCKED'}</button></section>
}
