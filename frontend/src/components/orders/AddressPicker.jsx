import React from 'react'
import { ADDRESS_BLOCKER } from '../../services/checkoutService.js'
import { panelClass } from '../management/ApiState.jsx'

export default function AddressPicker() {
  return <section className={panelClass}><h3 className="font-bold">Địa chỉ giao hàng</h3><p role="status">{ADDRESS_BLOCKER}</p></section>
}
