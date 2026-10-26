import React from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { aiService } from '../../services/aiService.js'
import { ApiState, panelClass } from '../management/ApiState.jsx'
import CatalogImage from '../catalog/CatalogImage.jsx'
const loadDesign = ({ id }, options) => aiService.getDesign(id, options)
export default function DesignDetail({ id, jobId }) {
  const resource = useCatalogResource(loadDesign, { id })
  return <section className={panelClass}><h3 className="font-bold">Chi tiết thiết kế</h3><ApiState resource={resource}>{resource.data && (jobId && resource.data.generationJobId !== jobId ? <p role="alert">Thiết kế không thuộc job đang xem.</p> : <><p className="break-all">{resource.data.id}</p><p>{resource.data.moderationStatus} · {resource.data.moderationReason}</p>{resource.data.imageUrl ? <CatalogImage key={resource.data.imageUrl} src={resource.data.imageUrl} alt="Thiết kế đã được backend duyệt" className="max-h-96 w-full rounded-xl object-contain" /> : <p>Backend chưa cung cấp ảnh được duyệt.</p>}<p>{resource.data.width ?? '—'} × {resource.data.height ?? '—'}</p></>)}</ApiState><button className="underline" onClick={resource.reload}>Tải lại thiết kế</button></section>
}

