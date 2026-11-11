import React, { useRef, useState } from 'react'
import { subscriptionService } from '../../services/subscriptionService.js'
import { formatSubscriptionMoney } from '../../services/subscriptionModels.js'
import { rememberVnpayCheckout, vnpayCheckoutError } from '../../services/vnpayModels.js'

export default function VnpayCheckout({ order, bakeryId, disabled, onBusy }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)

  async function checkout() {
    if (inFlight.current || disabled) return
    inFlight.current = true
    setBusy(true)
    onBusy(true)
    setError('')
    try {
      const result = await subscriptionService.createVnpayCheckout(order.id)
      rememberVnpayCheckout(result, bakeryId)
      window.location.assign(result.paymentUrl)
    } catch (failure) {
      setError(vnpayCheckoutError(failure))
    } finally {
      inFlight.current = false
      setBusy(false)
      onBusy(false)
    }
  }

  return <div className="space-y-3 border-b border-outline-variant/30 pb-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-base font-bold text-primary">Thanh toán qua VNPay</h4>
      <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs text-on-surface-variant">Môi trường thử nghiệm</span>
    </div>
    <p className="text-sm text-on-surface-variant">Chọn phương thức thanh toán trên VNPay. Gói dịch vụ được cập nhật khi giao dịch được xác nhận.</p>
    <button type="button" onClick={checkout} disabled={disabled || busy} aria-busy={busy}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 active:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">
      <span className="material-symbols-outlined text-lg" aria-hidden="true">{busy ? 'hourglass_top' : 'payments'}</span>
      {busy ? 'Đang mở VNPay…' : `Thanh toán ${formatSubscriptionMoney(order.totalAmount, order.currency)} qua VNPay`}
    </button>
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
  </div>
}
