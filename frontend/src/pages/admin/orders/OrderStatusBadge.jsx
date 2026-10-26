import { ORDER_STATUS_LABELS } from '../../../constants/orderStatus'

const STATUS_COLORS = {
  NEW: 'bg-amber-100 text-amber-900',
  CONFIRMED: 'bg-sky-100 text-sky-900',
  PROCESSING: 'bg-secondary-fixed text-on-secondary-fixed',
  BAKING: 'bg-secondary-fixed text-on-secondary-fixed',
  READY: 'bg-teal-100 text-teal-900',
  DELIVERING: 'bg-sky-100 text-sky-900',
  COMPLETED: 'bg-emerald-100 text-emerald-900',
  CANCELLED: 'bg-rose-100 text-rose-900',
}

const COMPACT_LABELS = {
  BAKING: 'Đang làm',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Đã giao',
  CANCELLED: 'Đã hủy',
}

export default function OrderStatusBadge({ status, compact = false }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-admin-body ${compact ? 'font-label-sm font-semibold' : 'font-medium'} ${STATUS_COLORS[status] || 'bg-surface-container text-on-surface'}`}>
      {(compact && COMPACT_LABELS[status]) || ORDER_STATUS_LABELS[status] || status || 'Chưa có dữ liệu'}
    </span>
  )
}
