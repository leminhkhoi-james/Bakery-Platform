// Backend lifecycle values shared by filters and status summaries.
export const BAKERY_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'CLOSED']
export const USER_STATUSES = ['PENDING', 'ACTIVE', 'BLOCKED', 'DELETED']
export const USER_STATUS_LABELS = {
  PENDING: 'Chờ kích hoạt',
  ACTIVE: 'Đang hoạt động',
  BLOCKED: 'Tạm ngưng',
  DELETED: 'Đã xóa',
}
