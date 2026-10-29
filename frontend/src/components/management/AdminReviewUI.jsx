import React from 'react'
import { DetailDrawer } from '../common/WorkspaceUI.jsx'
import './admin-review.css'

export function ReviewField({ label, value, fallback = 'Chưa cung cấp' }) {
  const missing = value == null || value === '' || typeof value === 'string' && value.startsWith('Chưa ')
  return <div><dt>{label}</dt><dd className={missing ? 'is-missing' : ''}>{value == null || value === '' ? fallback : value}</dd></div>
}
export function ReviewSection({ title, description, children, action = false }) {
  return <section className={'sc-review-section' + (action ? ' sc-review-section--action' : '')}><header><h3>{title}</h3>{description && <p>{description}</p>}</header>{children}</section>
}
export function AdminReviewDialog({ title, children, compact = false, className = '', ...props }) {
  return <DetailDrawer {...props} title={title} headerContent={<h2>{title}</h2>} className={'sc-review-dialog' + (compact ? ' sc-review-dialog--compact' : '') + (className ? ' ' + className : '')}>{children}</DetailDrawer>
}
