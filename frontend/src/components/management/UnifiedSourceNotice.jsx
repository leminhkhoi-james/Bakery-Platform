import React, { useEffect, useState } from 'react'
import { unifiedIssues } from '../../services/unifiedDataService.js'

export default function UnifiedSourceNotice() {
  const [, refresh] = useState(0)
  useEffect(() => {
    const update = () => refresh(value => value + 1)
    window.addEventListener('sweetcake:unified-updated', update)
    return () => window.removeEventListener('sweetcake:unified-updated', update)
  }, [])

  if (!unifiedIssues().length) return null

  return <div role="alert" className="sc-unified-issue">
    <span className="material-symbols-outlined" aria-hidden="true">info</span>
    <div><p>Một số dữ liệu chưa tải được. Vui lòng thử lại.</p></div>
    <button type="button" className="sc-button sc-action-button--secondary" onClick={() => window.location.reload()}>Thử lại</button>
  </div>
}
