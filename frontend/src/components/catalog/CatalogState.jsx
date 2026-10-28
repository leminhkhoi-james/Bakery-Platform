import { userFeedback } from '../../services/uiLabels.js'
export default function CatalogState({ status, error, empty, emptyText = 'Chưa có dữ liệu phù hợp.', onRetry, onNavigate }) {
  if (status === 'loading') return <p role="status" className="col-span-full rounded-2xl bg-surface/80 p-8 text-center text-primary">Đang tải dữ liệu…</p>
  if (error) {
    const message = error.status === 401 ? 'Bạn cần đăng nhập để tiếp tục.'
      : error.status === 403 ? 'Bạn không có quyền truy cập dữ liệu này.'
        : error.status === 404 ? 'Không tìm thấy dữ liệu hoặc dữ liệu không còn được công khai.'
          : userFeedback(error)
    return <div role="alert" className="col-span-full rounded-2xl border border-error/20 bg-surface p-8 text-center text-error">
      <p>{message}</p>
      {onRetry && <button className="mt-4 rounded-xl bg-primary px-5 py-2 text-on-primary" onClick={onRetry}>Thử lại</button>}
      {error.status === 401 && onNavigate && <button className="ml-3 underline" onClick={() => onNavigate('login')}>Đăng nhập</button>}
    </div>
  }
  return empty ? <p role="status" className="col-span-full rounded-2xl border border-outline-variant/20 bg-surface/80 p-8 text-center text-on-surface-variant">{emptyText}</p> : null
}
