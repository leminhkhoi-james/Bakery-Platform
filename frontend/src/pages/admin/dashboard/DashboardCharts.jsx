import React from 'react'
import { dashboardNumber } from '../../../services/adminDashboardModels.js'

export function StatusDistribution({ title, items, icon, onNavigate }) {
  const total = items?.reduce((sum, item) => sum + item.count, 0) || 0
  return <section className="sc-panel sc-dashboard-distribution"><h3>{title}</h3>{items == null ? <p className="sc-dashboard-muted">Chưa có số liệu.</p> : !total ? <p className="sc-dashboard-muted">Chưa có dữ liệu thống kê.</p> : <ul>{items.map((item) => <li key={item.status}><div><span>{item.label}</span><strong>{dashboardNumber(item.count)} <small>({Math.round(item.count / total * 100)}%)</small></strong></div><meter min="0" max={total} value={item.count} aria-label={item.label + ': ' + item.count} /></li>)}</ul>}<button className="sc-dashboard-link" onClick={onNavigate}>Xem {icon}<span aria-hidden="true"> →</span></button></section>
}
