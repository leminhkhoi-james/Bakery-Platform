import RefreshButton from '../common/RefreshButton.jsx'
import { uiLabel, publicCopy } from '../../services/uiLabels.js'
import React from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { aiService } from '../../services/aiService.js'
import { ApiState, panelClass } from '../management/ApiState.jsx'
import CatalogImage from '../catalog/CatalogImage.jsx'
const loadDesign = ({ id }, options) => aiService.getDesign(id, options)
export default function DesignDetail({ id, jobId }) {
  const resource = useCatalogResource(loadDesign, { id })
  return <section className={panelClass}><h3 className="font-bold">Chi tiết thiết kế</h3><ApiState resource={resource}>{resource.data && (jobId && resource.data.generationJobId !== jobId ? <p role="alert">Thiết kế không thuộc lượt tạo đang xem.</p> : <><p>{uiLabel(resource.data.moderationStatus)}{publicCopy(resource.data.moderationReason) && <> · {publicCopy(resource.data.moderationReason)}</>}</p>{resource.data.imageUrl ? <CatalogImage key={resource.data.imageUrl} src={resource.data.imageUrl} alt="Thiết kế đã được duyệt" className="max-h-96 w-full rounded-xl object-contain" /> : <p>Chưa có ảnh được duyệt.</p>}<p>{resource.data.width ?? '—'} × {resource.data.height ?? '—'}</p></>)}</ApiState><RefreshButton className="underline" onClick={resource.reload}>Tải lại thiết kế</RefreshButton></section>
}

