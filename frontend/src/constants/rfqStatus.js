export const RFQ_STATUS = {
  OPEN: 'OPEN',
  QUOTED: 'QUOTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
}

export const RFQ_STATUS_LABELS = {
  [RFQ_STATUS.OPEN]: 'Đang nhận báo giá',
  [RFQ_STATUS.QUOTED]: 'Đã có báo giá',
  [RFQ_STATUS.ACCEPTED]: 'Khách đã chốt tiệm',
  [RFQ_STATUS.REJECTED]: 'Tiệm từ chối',
  [RFQ_STATUS.CANCELLED]: 'Khách hủy yêu cầu',
  [RFQ_STATUS.EXPIRED]: 'Hết hạn báo giá',
}
