import React, { useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadInboxConversations } from '../../services/chatService.js'
import { CHAT_STATUSES } from '../../services/chatModels.js'
import { chatInboxTitle, searchConversations } from '../../services/chatPresentation.js'
import { cleanPresentationLabel, uiLabel } from '../../services/uiLabels.js'
import { formatOrderDate } from '../../services/orderPresentation.js'
import { isCatalogId } from '../../services/catalogModels.js'
import { Icon, StatusBadge } from '../common/WorkspaceUI.jsx'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import ChatFeedback from './ChatFeedback.jsx'
import ChatThread from './ChatThread.jsx'
import './owner-chat.css'

export default function ChatWorkspace({ bakeryId, routeSearch, onNavigate }) {
  const { user, roles } = useAuth()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const query = new URLSearchParams(routeSearch)
  const selectedId = !bakeryId || !query.get('bakeryId') || query.get('bakeryId') === bakeryId
    ? query.get('conversationId') || '' : ''
  const viewer = { userId: user.id, roles, ...(bakeryId ? { bakeryId } : {}) }
  const resource = useCatalogResource(loadInboxConversations, { viewer, page, size: 10, status, bakeryId })
  const select = (id) => {
    const nextQuery = new URLSearchParams()
    if (bakeryId) nextQuery.set('bakeryId', bakeryId)
    if (id) nextQuery.set('conversationId', id)
    const route = bakeryId ? 'vendor-chat' : 'chat'
    onNavigate(nextQuery.size ? route + '?' + nextQuery : route)
  }
  const rows = searchConversations(resource.data?.result ?? [], search)
  const summary = resource.data?.result.find((row) => row.id === selectedId)

  return <div className={'sc-owner-chat-shell' + (selectedId ? ' has-selection' : '')}>
    <section className="sc-owner-chat-list" aria-label="Danh sách hội thoại">
      <header>
        <h2>Hội thoại</h2>
        <button type="button" className="sc-icon-button" aria-label="Tải lại hộp thư" onClick={resource.reload}><Icon name="refresh" /></button>
      </header>
      <div className="sc-owner-chat-filters">
        <input className="sc-input" type="search" aria-label="Tìm hội thoại trong trang" placeholder="Tìm hội thoại trong trang" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="sc-input" aria-label="Trạng thái hội thoại" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
          <option value="">Tất cả trạng thái</option>
          {CHAT_STATUSES.map((value) => <option key={value} value={value}>{uiLabel(value)}</option>)}
        </select>
      </div>
      <div className="sc-owner-conversations">
        {resource.status === 'loading' ? <p role="status" className="sc-chat-state">Đang tải hội thoại…</p>
          : resource.error ? <ChatFeedback error={resource.error} retry={resource.reload} />
            : !rows.length ? <p className="sc-chat-state">{search ? 'Không tìm thấy trong trang này.' : 'Chưa có hội thoại phù hợp.'}</p>
              : <ul>{rows.map((conversation) => (
                <li key={conversation.id}>
                  <button type="button" className={'sc-owner-conversation' + (selectedId === conversation.id ? ' is-selected' : '')}
                    aria-pressed={selectedId === conversation.id} onClick={() => select(conversation.id)}>
                    <span className="sc-chat-person-icon"><Icon name={bakeryId ? 'person' : 'storefront'} /></span>
                    <span className="sc-chat-conversation-copy">
                      <strong>{chatInboxTitle(conversation, Boolean(bakeryId))}</strong>
                      {!bakeryId && conversation.ownerName && conversation.bakeryName && <small>{conversation.ownerName}</small>}
                      {conversation.status !== 'OPEN' && <StatusBadge status={conversation.status} />}
                      <span>{cleanPresentationLabel(conversation.lastMessagePreview, 'Chưa có tin nhắn')}</span>
                      {conversation.lastMessageAt && <small>{formatOrderDate(conversation.lastMessageAt)}</small>}
                    </span>
                    {conversation.unreadCount > 0 && <span className="sc-chat-unread" aria-label={conversation.unreadCount + ' tin chưa đọc'}>{conversation.unreadCount}</span>}
                  </button>
                </li>
              ))}</ul>}
      </div>
      {resource.data?.meta.pages > 1 && <footer><CatalogPagination meta={resource.data.meta} onPage={setPage} /></footer>}
      {!bakeryId && <footer><button type="button" className="sc-chat-context-link" onClick={() => onNavigate('rfqs')}>Xem yêu cầu bánh của tôi</button></footer>}
    </section>
    <div className="sc-owner-chat-pane">
      {!selectedId ? <div className="sc-chat-placeholder"><Icon name="forum" /><p>Chọn hội thoại để xem tin nhắn.</p></div>
        : isCatalogId(selectedId) ? <ChatThread key={JSON.stringify([user.id, roles, bakeryId, selectedId])} conversationId={selectedId}
          viewer={viewer} onChanged={resource.reload} summary={summary} onBack={() => select('')} onNavigate={onNavigate} />
          : <><button className="sc-button" onClick={() => select('')}>Quay lại hội thoại</button><p className="sc-chat-feedback" role="alert">Mã cuộc trò chuyện không hợp lệ.</p></>}
    </div>
  </div>
}
