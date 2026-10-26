import React from 'react'
import { useAuth } from '../../context/useAuth.js'
import { buttonClass } from '../management/ApiState.jsx'
import AddressPicker from './AddressPicker.jsx'

export default function VerifiedCheckout({ offerId }) {
  const { user } = useAuth()
  return <section className="space-y-4"><AddressPicker />{!user?.roles?.includes('CUSTOMER') && <p>Đăng nhập tài khoản Customer để xem đơn hàng. Checkout hiện chưa khả dụng.</p>}<button type="button" disabled className={buttonClass}>{offerId ? 'Chấp nhận báo giá — BLOCKED' : 'Đặt hàng — BLOCKED'}</button></section>
}
