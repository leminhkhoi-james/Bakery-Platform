import { displayReference } from '../../services/displayReference.js'
import { uiLabel } from '../../services/uiLabels.js'
import React from 'react'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import { ApiState, panelClass } from '../management/ApiState.jsx'
import { dateTime } from '../../services/managementModels.js'

export default function ConversationList({ resource, selectedId, onSelect, onPage }) {
  return <section className={panelClass}><h2 className="text-xl font-bold text-primary">Hội thoại</h2><ApiState resource={resource}>{resource.data && <>{resource.data.result.length ? <ul className="space-y-3">{resource.data.result.map((conversation) => <li key={conversation.id}><button className={'w-full space-y-1 rounded-xl border p-3 text-left ' + (conversation.id === selectedId ? 'border-primary bg-primary-fixed/30' : 'border-outline-variant/30')} onClick={() => onSelect(conversation.id)}><span className="block break-all text-sm font-bold">Hội thoại {displayReference(conversation.id, 'CHAT')}</span><span className="block break-all text-xs">Cửa hàng: {displayReference(conversation.bakeryId, 'SHOP')}</span><span className="block text-sm">{conversation.lastMessagePreview || 'Chưa có nội dung xem trước'}</span><span className="block text-xs text-on-surface-variant">{uiLabel(conversation.status, 'Chưa có trạng thái')} · {dateTime(conversation.lastMessageAt)}</span><span className="block text-xs">{conversation.unreadCount === null ? 'Chưa có số tin chưa đọc' : 'Chưa đọc: ' + conversation.unreadCount}</span></button></li>)}</ul> : <p>Chưa có hội thoại phù hợp.</p>}<CatalogPagination meta={resource.data.meta} onPage={onPage} /></>}</ApiState></section>
}
