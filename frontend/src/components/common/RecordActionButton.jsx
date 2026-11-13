import React from 'react'

const labels = { view: 'Xem chi tiết', edit: 'Chỉnh sửa', delete: 'Xóa' }
export function RecordActionIcon({ action }) {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {action === 'view' ? <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></> : action === 'edit' ? <><path d="m16 3 5 5-12 12H4v-5L16 3Z" /><path d="m14 5 5 5" /></> : <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>}
  </svg>
}

export default function RecordActionButton({ action, label, className = '', title, ...props }) {
  const description = label || labels[action]
  return <button {...props} aria-label={props['aria-label'] || description} title={title || description} className={className + ' sc-record-icon-action sc-record-icon-action--' + action}><RecordActionIcon action={action} /></button>
}
