import { useEffect, useRef } from 'react'
import OrderStatusBadge from './OrderStatusBadge'
import { getAdminOrderStatus } from './adminOrderStatus'

const formatAmount = (amount) =>
  Number.isFinite(amount) ? `${amount.toLocaleString('vi-VN')}₫` : 'Chưa có dữ liệu'

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-on-surface sm:text-right">{children}</dd>
    </div>
  )
}

// Shared by the dashboard and the existing admin order list. Neither source
// currently provides a verified payment transaction or a receipt API.
export default function AdminOrderDetailModal({ order, onClose, onDisburse, onTrackDelivery }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const amount = order.amount ?? order.cakePrice
  const title = order.cakeType ?? order.cakeTitle
  const metadata = [order.time, order.orderTypeLabel].filter(Boolean).join(' · ')

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="admin-order-detail-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-surface-container-lowest p-0 text-admin-body text-on-surface shadow-2xl backdrop:bg-modal-overlay backdrop:backdrop-blur-sm"
    >
      <header className="flex items-start justify-between gap-3 border-b border-outline-variant/30 px-5 py-4">
        <div className="min-w-0">
          <h2 id="admin-order-detail-title" className="font-serif text-admin-heading font-bold text-primary">Chi tiết đơn hàng</h2>
          <p className="mt-1 break-words font-semibold">{order.id}</p>
          {metadata && <p className="mt-1 text-on-surface-variant">{metadata}</p>}
        </div>
        <button type="button" autoFocus onClick={onClose} aria-label="Đóng chi tiết đơn hàng" className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <span aria-hidden="true" className="material-symbols-outlined text-xl">close</span>
        </button>
      </header>

      <div className="space-y-5 p-5">
        <section aria-label="Thông tin đơn hàng">
          <p className="text-on-surface-variant">Giá trị đơn hàng</p>
          <p className="mt-1 font-serif text-admin-metric font-bold tabular-nums text-primary">{formatAmount(amount)}</p>
          <div className="mt-3"><OrderStatusBadge status={getAdminOrderStatus(order)} /></div>
          {title && <div className="mt-4 flex items-start gap-3">
            {order.cakeImage && <img src={order.cakeImage} alt="" className="size-14 rounded-lg object-cover" />}
            <div className="min-w-0"><p className="font-semibold">{title}</p>{order.cakeSpec && <p className="mt-1 text-on-surface-variant">{order.cakeSpec}</p>}</div>
          </div>}
          <dl className="mt-3 divide-y divide-outline-variant/20">
            <DetailRow label="Khách hàng">{order.customerName || 'Chưa có dữ liệu'}{order.customerTier && ` (${order.customerTier})`}</DetailRow>
            {order.customerPhone && <DetailRow label="Điện thoại">{order.customerPhone}</DetailRow>}
            <DetailRow label="Tiệm bánh">{order.vendor ?? order.vendorName ?? 'Chưa có dữ liệu'}{order.chef && ` (${order.chef})`}</DetailRow>
            {order.customerAddress && <DetailRow label="Địa chỉ giao">{order.customerAddress}</DetailRow>}
            {order.stageLabel && <DetailRow label="Tiến độ">{[order.stageLabel, order.stageStep].filter(Boolean).join(' · ')}</DetailRow>}
            {order.telemetryInfo && <DetailRow label="Cập nhật">{order.telemetryInfo}</DetailRow>}
          </dl>
        </section>

        <section aria-labelledby="admin-order-payment-title" className="border-t border-outline-variant/30 pt-4">
          <h3 id="admin-order-payment-title" className="font-semibold text-primary">Thanh toán / Ký quỹ</h3>
          <p className="mt-2 leading-relaxed text-on-surface-variant">Chưa có dữ liệu giao dịch được xác thực.</p>
          {!onDisburse && <p className="mt-1 leading-relaxed text-on-surface-variant">Chưa thể xác nhận thanh toán, giải ngân hoặc hoàn tiền cho đơn hàng này.</p>}
          {onDisburse && <dl className="mt-2">
            <DetailRow label="Trạng thái (demo)">{order.escrowStatusLabel || 'Chưa có dữ liệu'}</DetailRow>
            {order.escrowContractId && <DetailRow label="Thông tin ký quỹ">{order.escrowContractId}</DetailRow>}
          </dl>}
          {order.escrowPledge && <dl className="mt-2"><DetailRow label="Ký quỹ (demo)">{order.escrowPledge}</DetailRow></dl>}
          {onDisburse && order.escrowStatus !== 'released' && (
            <button type="button" onClick={() => onDisburse(order.id)} className="mt-3 min-h-10 rounded-xl bg-primary-container px-4 py-2 font-semibold text-on-primary hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Giải ngân ký quỹ</button>
          )}
        </section>
        {onTrackDelivery && order.progressStage === 'delivering' && (
          <section aria-label="Giao hàng" className="border-t border-outline-variant/30 pt-4">
            <button type="button" onClick={() => onTrackDelivery(order)} className="min-h-10 rounded-xl bg-surface-container px-4 py-2 font-semibold text-primary hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Theo dõi GPS</button>
          </section>
        )}
      </div>
      <footer className="flex justify-end border-t border-outline-variant/30 px-5 py-3">
        <button type="button" onClick={onClose} className="min-h-11 cursor-pointer rounded-xl bg-primary px-5 font-semibold text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Đóng</button>
      </footer>
    </dialog>
  )
}
