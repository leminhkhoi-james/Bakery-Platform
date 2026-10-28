import { displayReference } from '../../services/displayReference.js'
import React, { useState } from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadRfqs } from '../../services/rfqService.js'
import { ApiState, buttonClass, panelClass } from '../management/ApiState.jsx'
import { EmptyPanel, SectionHeading, StatusBadge } from '../common/WorkspaceUI.jsx'
import CatalogPagination from '../catalog/CatalogPagination.jsx'

export default function RequestPicker({ onSelect, allowedStatuses, title = 'Chọn yêu cầu bánh' }) {
  const [page, setPage] = useState(1)
  const resource = useCatalogResource(loadRfqs, { scope: 'mine', page, size: 6, sort: 'createdAt,desc' })
  return <section className={panelClass}><SectionHeading title={title} description="Danh sách yêu cầu thuộc tài khoản của bạn." icon="cake" />
    <ApiState resource={resource}>{resource.data && <>{resource.data.result.length ? <div className="grid gap-3 sm:grid-cols-2">{resource.data.result.map((request) => <article key={request.id} className="rounded-xl border border-outline-variant/30 p-4"><div className="mb-3 flex items-start justify-between gap-2"><h3 className="font-semibold text-primary">{request.title || displayReference(request.id, 'RFQ')}</h3><StatusBadge status={request.status} /></div><button className={buttonClass} disabled={allowedStatuses && !allowedStatuses.includes(request.status)} onClick={() => onSelect(request.id)}>Chọn yêu cầu</button>{allowedStatuses && !allowedStatuses.includes(request.status) && <p className="mt-2 text-xs text-on-surface-variant">Trạng thái này chưa cho phép thao tác.</p>}</article>)}</div> : <EmptyPanel title="Chưa có yêu cầu bánh." description="Tạo RFQ trước khi sử dụng chức năng này." />}
      <CatalogPagination meta={resource.data.meta} onPage={setPage} /></>}</ApiState>
  </section>
}
