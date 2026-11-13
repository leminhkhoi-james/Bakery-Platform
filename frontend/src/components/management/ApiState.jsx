import { userFeedback } from '../../services/uiLabels.js'
import React from 'react'
import { useManualRefresh } from '../../context/ManualRefreshContext.js'

export function ApiErrorMessage({ error, retry }) {
  const manualRefresh = useManualRefresh()
  const feedback = userFeedback(error)
  const isGeneric = !feedback || feedback === 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
  const description = isGeneric
    ? ({
        400: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.',
        401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        403: 'Bạn không có quyền thực hiện thao tác này.',
        404: 'Không tìm thấy thông tin yêu cầu.',
        409: manualRefresh ? 'Dữ liệu đã có thay đổi. Vui lòng tải lại trang.' : 'Dữ liệu đã thay đổi. Hãy kiểm tra thông tin trước khi tiếp tục.',
        422: 'Vui lòng kiểm tra lại các thông tin bắt buộc.',
        500: 'Hệ thống đang bận. Vui lòng thử lại sau ít phút.',
        0: 'Không thể kết nối máy chủ. Vui lòng kiểm tra đường truyền mạng.',
      }[error?.status] || 'Không thể xử lý yêu cầu. Vui lòng thử lại.')
    : feedback

  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 text-xs sm:text-sm space-y-1">
      <div className="flex items-center gap-1.5 font-bold">
        <span className="material-symbols-outlined text-base">error</span>
        <span>Thông báo</span>
      </div>
      <p className="break-words leading-relaxed">{description}</p>
      {manualRefresh && retry && (
        <button type="button" className="mt-2 text-xs font-semibold underline cursor-pointer block" onClick={retry}>
          Thử lại
        </button>
      )}
    </div>
  )
}
export function ApiState({ resource, children }) {
  if (resource.status === 'loading') return <div role="status" aria-live="polite" className="space-y-3 py-4"><p className="text-sm text-on-surface-variant">Đang tải dữ liệu…</p><div aria-hidden="true" className="space-y-2 motion-safe:animate-pulse">{[0, 1, 2].map((line) => <div key={line} className="h-3 rounded bg-surface-container" style={{ width: [70, 95, 55][line] + '%' }} />)}</div></div>
  if (resource.error) return <ApiErrorMessage error={resource.error} retry={resource.reload} />
  return <>{children}</>
}
export const inputClass = 'sc-input'
export const buttonClass = 'sc-button'
export const panelClass = 'sc-panel space-y-4'
