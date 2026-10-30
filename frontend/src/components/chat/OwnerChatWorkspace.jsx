import React, { useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadConversations } from '../../services/chatService.js'
import { CHAT_STATUSES } from '../../services/chatModels.js'
import { chatCustomerLabel, searchConversations } from '../../services/chatPresentation.js'
import { cleanPresentationLabel, uiLabel } from '../../services/uiLabels.js'
import { formatOrderDate } from '../../services/orderPresentation.js'
import { isCatalogId } from '../../services/catalogModels.js'
import { Icon } from '../common/WorkspaceUI.jsx'
import RefreshButton from '../common/RefreshButton.jsx'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import ChatFeedback from './ChatFeedback.jsx'
import ChatThread from './ChatThread.jsx'
import './owner-chat.css'

export default function OwnerChatWorkspace({ bakeryId, routeSearch, onNavigate }) {
  const { user, roles } = useAuth()
  const [status, setStatus] = useState(''), [page, setPage] = useState(1), [search, setSearch] = useState('')
  const query = new URLSearchParams(routeSearch)
  const selectedId = !query.get('bakeryId') || query.get('bakeryId') === bakeryId ? query.get('conversationId') || '' : ''
  const viewer = { userId: user.id, roles, bakeryId }
  const resource = useCatalogResource(loadConversations, { viewer, page, size: 10, status, bakeryId })
  const select = (id) => onNavigate('vendor-chat?' + new URLSearchParams({ bakeryId, ...(id ? { conversationId: id } : {}) }), null, { replace: true })
  const loading = resource.status === 'loading' || resource.refreshing
  const rows = resource.data ? searchConversations(resource.data.result, search) : []
  return <div className={'sc-owner-chat-shell' + (selectedId ? ' has-selection' : '')}>
    <section className="sc-owner-chat-list" aria-label="Danh sách hội thoại"><header><h2>Hội thoại</h2><RefreshButton aria-label="Tải lại hội thoại" disabled={loading} onClick={resource.reload}>Tải lại</RefreshButton></header><div className="sc-owner-chat-filters"><label className="sc-chat-search"><span className="sr-only">Tìm hội thoại trong trang</span><input className="sc-input" type="search" placeholder="Tìm tên hoặc tin nhắn trong trang" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label><span className="sr-only">Trạng thái hội thoại</span><select className="sc-input" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">Tất cả trạng thái</option>{CHAT_STATUSES.map((value) => <option key={value} value={value}>{uiLabel(value)}</option>)}</select></label></div>
      <div className="sc-owner-conversations">{loading ? <p role="status" className="sc-chat-state">Đang tải hội thoại…</p> : resource.error ? <ChatFeedback error={resource.error} retry={resource.reload} /> : !rows.length ? <p role="status" className="sc-chat-state">{search ? 'Không tìm thấy trong trang này.' : 'Chưa có hội thoại phù hợp.'}</p> : <ul>{rows.map((conversation) => <li key={conversation.id}><button className={'sc-owner-conversation' + (selectedId === conversation.id ? ' is-selected' : '')} aria-pressed={selectedId === conversation.id} onClick={() => select(conversation.id)}><span className="sc-chat-person-icon"><Icon name="person" /></span><span className="sc-chat-conversation-copy"><strong>{chatCustomerLabel(conversation)}</strong><span>{cleanPresentationLabel(conversation.lastMessagePreview, 'Chưa có tin nhắn')}</span><small>{formatOrderDate(conversation.lastMessageAt)}</small></span>{conversation.unreadCount > 0 && <span className="sc-chat-unread" aria-label={conversation.unreadCount + ' tin chưa đọc'}>{conversation.unreadCount}</span>}</button></li>)}</ul>}</div>
      {!loading && !resource.error && resource.data?.meta.pages > 1 && <footer><CatalogPagination meta={resource.data.meta} onPage={setPage} /></footer>}
    </section>
    <div className="sc-owner-chat-pane">{selectedId ? isCatalogId(selectedId) ? <ChatThread compact key={JSON.stringify([user.id, roles, bakeryId, selectedId])} conversationId={selectedId} viewer={viewer} onChanged={resource.reload} summary={resource.data?.result.find((row) => row.id === selectedId)} onBack={() => select('')} onNavigate={onNavigate} /> : <><button className="sc-button" onClick={() => select('')}>Quay lại hội thoại</button><ChatFeedback error={{ status: 400 }} /></> : <div className="sc-chat-placeholder"><Icon name="forum" /><p>Chọn một hội thoại để bắt đầu trao đổi.</p></div>}</div>
  </div>
}
