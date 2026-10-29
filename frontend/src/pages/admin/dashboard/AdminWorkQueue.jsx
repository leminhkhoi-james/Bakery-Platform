import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import React from 'react'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import { dashboardNumber } from '../../../services/adminDashboardModels.js'

export default function AdminWorkQueue({ groups, loading, onNavigate }) {
  const visible = groups.filter((group) => group.items?.length > 0)
    .sort((a, b) => (b.items?.length || 0) - (a.items?.length || 0))
  return <div className="sc-admin-work-list" aria-label="Công việc quản trị">
    {loading ? <p role="status" className="sc-admin-work-empty">Đang tải công việc…</p> : !visible.length ? <p role="status" className="sc-admin-work-empty">{groups.some((group) => group.items == null) ? 'Chưa tải đủ công việc. Vui lòng làm mới để cập nhật.' : 'Không có công việc đang chờ xử lý.'}</p> : visible.map((group) => <section key={group.key} className="sc-panel sc-admin-work-group" aria-label={group.title}>
      <div className="sc-admin-work-heading"><span className="sc-dashboard-icon"><Icon name={group.icon} /></span><h3>{group.title}</h3><span className="sc-admin-work-count" aria-label={'Số công việc: ' + (group.items == null ? 'chưa có số liệu' : group.items.length)}>{dashboardNumber(group.items?.length)}</span></div>
      {!!group.items?.length && <ul>{group.items.slice(0, 3).map((item) => <li key={item.key}><span>{cleanPresentationLabel(item.name)}{item.detail && <small>{item.detail}</small>}</span><button className="sc-dashboard-link" onClick={() => onNavigate(item.route)} aria-label={'Xem ' + cleanPresentationLabel(item.name)}>Xem<Icon name="chevron_right" /></button></li>)}</ul>}
      <button className="sc-dashboard-link sc-admin-work-all" onClick={() => onNavigate(group.route)}>Xem tất cả<Icon name="arrow_forward" /></button>
    </section>)}
  </div>
}
