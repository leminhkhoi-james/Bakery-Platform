export const ORDER_STATUS = {
  NEW: 'NEW',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  BAKING: 'BAKING',
  READY: 'READY',
  DELIVERING: 'DELIVERING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.NEW]: 'Chờ xác nhận',
  [ORDER_STATUS.CONFIRMED]: 'Đã xác nhận',
  [ORDER_STATUS.PROCESSING]: 'Đang xử lý',
  [ORDER_STATUS.BAKING]: 'Đang làm bánh',
  [ORDER_STATUS.READY]: 'Bánh hoàn tất',
  [ORDER_STATUS.DELIVERING]: 'Đang giao xe lạnh',
  [ORDER_STATUS.COMPLETED]: 'Đã giao thành công',
  [ORDER_STATUS.CANCELLED]: 'Đã hủy đơn',
}
