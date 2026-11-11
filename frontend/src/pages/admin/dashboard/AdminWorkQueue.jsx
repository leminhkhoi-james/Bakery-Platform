import RecordActionButton from '../../../components/common/RecordActionButton.jsx'
import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import React, { useState } from 'react'
import { BakeryReview } from '../vendors/AdminVendorsPage.jsx'
import { ReviewLookup, DesignModeration } from '../vendors/AdminModerationPage.jsx'
import { AdminReviewDialog } from '../../../components/management/AdminReviewUI.jsx'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import { dashboardNumber } from '../../../services/adminDashboardModels.js'

export default function AdminWorkQueue({ groups, loading, onNavigate }) {
  const [detail, setDetail] = useState(null)
  const openDetail = route => {
    const [path, search] = route.split('?'), params = new URLSearchParams(search)
    if (path === 'admin-vendors' && params.get('bakeryId')) setDetail({ kind: 'bakery', id: params.get('bakeryId') })
    else if (path === 'admin-moderation' && params.get('id')) setDetail({ kind: params.get('kind') === 'design' ? 'design' : 'review', id: params.get('id') })
    else onNavigate(route)
  }
  const visible = groups.filter((group) => group.items?.length > 0)
    .sort((a, b) => (b.items?.length || 0) - (a.items?.length || 0))
  return <><div className="sc-admin-work-list" aria-label="Công việc quản trị">
    {loading ? <p role="status" className="sc-admin-work-empty">Đang tải công việc…</p> : !visible.length ? <p role="status" className="sc-admin-work-empty">{groups.some((group) => group.items == null) ? 'Chưa tải đủ công việc. Vui lòng làm mới để cập nhật.' : 'Không có công việc đang chờ xử lý.'}</p> : visible.map((group) => <section key={group.key} className="sc-panel sc-admin-work-group" aria-label={group.title}>
      <div className="sc-admin-work-heading"><span className="sc-dashboard-icon"><Icon name={group.icon} /></span><h3>{group.title}</h3><span className="sc-admin-work-count" aria-label={'Số công việc: ' + (group.items == null ? 'chưa có số liệu' : group.items.length)}>{dashboardNumber(group.items?.length)}</span></div>
      {!!group.items?.length && <ul>{group.items.slice(0, 3).map((item) => <li key={item.key}><span>{cleanPresentationLabel(item.name)}{item.detail && <small>{item.detail}</small>}</span><RecordActionButton className="sc-button sc-record-action shrink-0" onClick={() => openDetail(item.route)} aria-label={'Xem chi tiết ' + cleanPresentationLabel(item.name)} action="view" /></li>)}</ul>}
      <button className="sc-button sc-record-action sc-admin-work-all" onClick={() => onNavigate(group.route)}>Xem tất cả</button>
    </section>)}
  </div>
    {detail?.kind === 'bakery' && <BakeryReview id={detail.id} onClose={() => setDetail(null)} onNavigate={onNavigate} onChanged={() => {}} />}
    {detail && detail.kind !== 'bakery' && <AdminReviewDialog title={detail.kind === 'design' ? 'Kiểm duyệt thiết kế' : 'Kiểm duyệt đánh giá'} onClose={() => setDetail(null)}>{detail.kind === 'design' ? <DesignModeration id={detail.id} /> : <ReviewLookup orderId={detail.id} />}</AdminReviewDialog>}
  </>
}
