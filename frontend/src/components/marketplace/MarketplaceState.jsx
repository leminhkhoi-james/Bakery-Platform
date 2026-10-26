import React from 'react'
import { ApiState, ApiErrorMessage, panelClass } from '../management/ApiState.jsx'

export function ServiceBlocked({ error, retry, kind = 'Marketplace' }) {
  return <section className={panelClass}><h2 className="text-xl font-bold text-primary">BLOCKED — {kind} tạm chưa khả dụng</h2><p>{kind === 'Cake AI' ? 'Dịch vụ AI chưa phản hồi hoặc thiếu cấu hình provider/Firebase. Không có ảnh mẫu được dùng làm kết quả.' : 'Chưa truy cập được Marketplace. Cần service hoạt động và các dependency được cấu hình trước khi tạo RFQ hoặc báo giá.'}</p><ApiErrorMessage error={error} retry={retry} /></section>
}
export default function MarketplaceState({ resource, kind, children }) {
  if (resource.error && (resource.error.status === 0 || resource.error.status >= 500)) return <ServiceBlocked kind={kind} error={resource.error} retry={resource.reload} />
  return <ApiState resource={resource}>{children}</ApiState>
}
