import React, { useState } from 'react'
import { Icon, StatusBadge } from '../common/WorkspaceUI.jsx'
import { buttonClass, inputClass } from '../management/ApiState.jsx'
import { orderStatusLabel } from '../../services/orderModels.js'

const steps = {
  CONFIRMED: { label: 'Xác nhận đơn hàng', icon: 'task_alt', hint: 'Xác nhận mẫu bánh và lịch giao đã thống nhất với khách.' },
  BAKING: { label: 'Bắt đầu làm bánh', icon: 'cake', hint: 'Chuyển đơn sang khâu chuẩn bị và làm bánh.' },
  READY: { label: 'Bánh đã sẵn sàng giao', icon: 'inventory_2', hint: 'Xác nhận bánh đã hoàn thiện và đóng gói.' },
  DELIVERING: { label: 'Bắt đầu giao hàng', icon: 'local_shipping', hint: 'Xác nhận bánh đã được bàn giao để giao tới khách.' },
  COMPLETED: { label: 'Đã nhận được bánh', icon: 'check_circle', hint: 'Xác nhận bạn đã nhận đủ bánh từ tiệm và chính thức hoàn tất đơn hàng.' },
  CANCELLED: { label: 'Hủy đơn hàng', icon: 'cancel', hint: 'Trao đổi với khách trước khi hủy. Thao tác này không hoàn tiền.' },
}

export default function OrderStatusActions({ order, actions, busy = false, refreshing = false, onConfirm }) {
  const [pending, setPending] = useState(null), [reason, setReason] = useState('')
  const locked = busy || refreshing
  const stale = pending && (pending.from !== order.status || !actions.includes(pending.target))
  const next = actions.find((target) => target !== 'CANCELLED')
  const cancellation = pending?.target === 'CANCELLED'
  const isCompleting = pending?.target === 'COMPLETED'
  const cancelLabel = order.status === 'PENDING' ? 'Từ chối đơn hàng' : 'Hủy đơn hàng'
  const actionLabel = (target) => target === 'CANCELLED' ? cancelLabel : target === 'COMPLETED' ? 'Đã nhận được bánh' : steps[target]?.label
  const actionHint = (target) => {
    if (target === 'CANCELLED') return order.status === 'PENDING' ? 'Nêu rõ lý do tiệm hoặc khách không thể tiếp tục đơn.' : steps[target]?.hint
    if (target === 'COMPLETED') return 'Vui lòng chỉ xác nhận sau khi bạn đã kiểm tra và nhận đủ bánh từ shipper/tiệm bánh. Sau khi hoàn tất, bạn có thể gửi đánh giá cho tiệm.'
    return steps[target]?.hint
  }
  async function confirm(event) {
    event.preventDefault()
    if (locked || stale || !pending || cancellation && !reason.trim()) return
    if (await onConfirm(pending.target, reason.trim(), pending.from)) { setPending(null); setReason('') }
  }
  return <section className="sc-order-action-controls space-y-3" aria-label="Thao tác đơn hàng" aria-busy={locked}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold text-primary">Thao tác đơn hàng</h3><div className="flex flex-wrap items-center gap-2 text-sm"><span>Hiện tại:</span><StatusBadge status={order.status} label={orderStatusLabel(order.status)} /></div></div>
    {!pending ? <>
      <p className="text-sm text-on-surface-variant">{next ? steps[next]?.hint : order.status === 'COMPLETED' ? 'Đơn hàng đã hoàn tất.' : order.status === 'CANCELLED' ? 'Đơn hàng đã hủy. Không còn thao tác giao nhận.' : 'Chỉ có thể thực hiện thao tác được phân quyền cho đơn này.'}</p>
      <div className="flex flex-wrap gap-3">
        {next && <button type="button" disabled={locked} className={buttonClass + ' min-h-11 w-full justify-center sm:w-auto font-bold'} onClick={() => setPending({ target: next, from: order.status })}><Icon name={steps[next]?.icon || 'arrow_forward'} />{steps[next]?.label || orderStatusLabel(next)}</button>}
        {actions.includes('CANCELLED') && <button type="button" disabled={locked} className="sc-button sc-order-secondary min-h-11 w-full justify-center sm:w-auto" onClick={() => setPending({ target: 'CANCELLED', from: order.status })}><Icon name="cancel" />{cancelLabel}</button>}
      </div>
    </> : <form onSubmit={confirm} className="space-y-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4" aria-label="Xác nhận chuyển trạng thái">
      <h4 className="font-semibold text-primary">{actionLabel(pending.target)}?</h4>
      <p className="text-sm">{orderStatusLabel(pending.from)} → {orderStatusLabel(pending.target)}</p>
      <p className="text-sm text-on-surface-variant">{actionHint(pending.target)}</p>
      <label className="block space-y-1">{cancellation ? order.status === 'PENDING' ? 'Lý do từ chối đơn hàng' : 'Lý do hủy đơn' : 'Ghi chú cập nhật (tùy chọn)'}<textarea required={cancellation} maxLength={1000} rows={3} disabled={locked} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={isCompleting ? 'Bánh ngon, đúng mẫu...' : ''} className={inputClass + ' w-full'} /></label>
      {stale && <p role="alert" className="text-sm text-primary">Trạng thái đơn đã thay đổi. Vui lòng quay lại và chọn thao tác phù hợp.</p>}
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={locked || !!stale || cancellation && !reason.trim()} className={buttonClass + ' min-h-11 w-full justify-center sm:w-auto font-bold'}>{busy ? 'Đang cập nhật…' : isCompleting ? 'Tôi đã nhận đủ bánh' : 'Xác nhận cập nhật'}</button><button type="button" disabled={locked} className="sc-button sc-order-secondary min-h-11 w-full justify-center sm:w-auto" onClick={() => setPending(null)}>Quay lại</button></div>
    </form>}
  </section>
}
