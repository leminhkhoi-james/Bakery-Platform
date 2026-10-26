import React from 'react'

export function ApiErrorMessage({ error, retry }) {
  const description = { 400: 'Yêu cầu không hợp lệ.', 401: 'Vui lòng đăng nhập lại.', 403: 'Bạn không có quyền với cửa hàng hoặc đơn hàng này.', 404: 'Không tìm thấy dữ liệu.', 409: 'Dữ liệu hoặc trạng thái đã thay đổi. Hãy tải lại trước khi thử tiếp.', 422: 'Dữ liệu chưa đáp ứng điều kiện nghiệp vụ.', 500: 'Backend gặp lỗi.', 0: 'Không thể kết nối backend.' }[error?.status]
  return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"><p>{description || 'Không thể xử lý yêu cầu.'}</p><p className="break-words text-sm">{error?.message}</p>{retry && <button className="mt-3 underline" onClick={retry}>Thử lại</button>}</div>
}
export function ApiState({ resource, children }) {
  if (resource.status === 'loading') return <div role="status" aria-live="polite" className="space-y-3 py-4"><p className="text-sm text-on-surface-variant">Đang tải dữ liệu…</p><div aria-hidden="true" className="space-y-2 motion-safe:animate-pulse">{[0, 1, 2].map((line) => <div key={line} className="h-3 rounded bg-surface-container" style={{ width: [70, 95, 55][line] + '%' }} />)}</div></div>
  if (resource.error) return <ApiErrorMessage error={resource.error} retry={resource.reload} />
  return children
}
export const inputClass = 'sc-input'
export const buttonClass = 'sc-button'
export const panelClass = 'sc-panel space-y-4'
