import React from 'react'
import { ApiState, ApiErrorMessage, panelClass } from '../management/ApiState.jsx'

export function ServiceBlocked({ error, retry, kind = 'Marketplace' }) {
  return <section className={panelClass}><h2 className="text-xl font-bold text-primary">{kind === 'Cake AI' ? 'Thiết kế AI' : 'Yêu cầu và báo giá'} tạm chưa khả dụng</h2><p>{kind === 'Cake AI' ? 'Chưa thể tạo thiết kế lúc này. Vui lòng thử lại sau.' : 'Chưa tải được yêu cầu và báo giá. Vui lòng thử lại sau.'}</p><ApiErrorMessage error={error} retry={retry} /></section>
}
export default function MarketplaceState({ resource, kind, children }) {
  if (resource.error && (resource.error.status === 0 || resource.error.status >= 500)) return <ServiceBlocked kind={kind} error={resource.error} retry={resource.reload} />
  return <ApiState resource={resource}>{children}</ApiState>
}
