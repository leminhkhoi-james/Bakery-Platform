import React from 'react'
import { dashboardNumber } from '../../../services/adminDashboardModels.js'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import './admin-dashboard.css'

export function StatusDistribution({ title, items, icon, value, scopeNote, loading, onNavigate, actionLabel, children }) {
  const total = items?.reduce((sum, item) => sum + item.count, 0) || 0
  return <section className="sc-panel sc-dashboard-distribution">
    <header className="sc-activity-heading">
      <span className="sc-kpi-icon-wrap"><Icon name={icon} /></span>
      <h3>{title}{scopeNote && <small className="sc-activity-scope-note"> ({scopeNote})</small>}</h3>
    <strong className="sc-activity-total" aria-label={loading ? 'Đang tải số liệu' : value === '—' ? 'Chưa có số liệu' : undefined}>{loading ? '…' : value}</strong>
    </header>
    {!loading && !children && (
      items == null ? <p className="sc-dashboard-muted">Chưa có số liệu.</p> :
        <ul>{items.map((item) => <li key={item.status}>
          <div><span>{item.label}</span><strong>{dashboardNumber(item.count)}</strong></div>
          <meter min="0" max={Math.max(total, 1)} value={item.count} aria-label={item.label + ': ' + item.count} />
        </li>)}</ul>
    )}
    {!loading && children}
    <button type="button" className="sc-button sc-record-action" onClick={onNavigate}>{actionLabel || 'Xem ' + title.toLocaleLowerCase('vi')}</button>
  </section>
}
