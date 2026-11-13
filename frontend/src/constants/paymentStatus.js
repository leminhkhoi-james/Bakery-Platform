export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  ESCROW_HOLDING: 'ESCROW_HOLDING',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
}

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Chờ thanh toán',
  [PAYMENT_STATUS.ESCROW_HOLDING]: 'Escrow tạm giữ cọc',
  [PAYMENT_STATUS.RELEASED]: 'Đã giải ngân cho tiệm',
  [PAYMENT_STATUS.REFUNDED]: 'Đã hoàn tiền cho khách',
}
