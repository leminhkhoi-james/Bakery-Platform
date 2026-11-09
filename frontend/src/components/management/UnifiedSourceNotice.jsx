import React, { useEffect, useState } from 'react'
import { unifiedIssues, unifiedEnabled } from '../../services/unifiedDataService.js'
export default function UnifiedSourceNotice() {
  const [,update] = useState(0)
  useEffect(() => { const refresh=()=>update(value=>value+1); window.addEventListener('sweetcake:unified-updated',refresh);return()=>window.removeEventListener('sweetcake:unified-updated',refresh) },[])
  if(!unifiedEnabled())return null
  const issues=unifiedIssues()
  const failedApi = issues.some(issue => issue.source === 'api')
  return issues.length ? <div role="alert" className="sc-unified-issue"><span className="material-symbols-outlined" aria-hidden="true">info</span><div><p>{failedApi ? 'API thật chưa tải đầy đủ. Danh sách có thể thiếu bản ghi Backend.' : 'Chưa tải được dữ liệu trình duyệt. Danh sách API vẫn khả dụng.'}</p><details><summary>Xem nguồn chưa tải được ({issues.length})</summary>{issues.map(issue=><p key={issue.source + issue.path}>{issue.path} · {issue.status || 'Mất kết nối'}</p>)}</details></div><button type="button" className="sc-button sc-action-button--secondary" onClick={()=>window.location.reload()}>Thử lại</button></div> : null
}
