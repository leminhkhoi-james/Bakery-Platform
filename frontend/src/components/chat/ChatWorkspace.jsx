import RefreshButton from '../common/RefreshButton.jsx'
import { uiLabel } from '../../services/uiLabels.js'
import React, { useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadConversations } from '../../services/chatService.js'
import { CHAT_STATUSES, CHAT_CONTEXT_GUIDANCE } from '../../services/chatModels.js'
import { isCatalogId } from '../../services/catalogModels.js'
import { ApiErrorMessage, inputClass, buttonClass, panelClass } from '../management/ApiState.jsx'
import ConversationList from './ConversationList.jsx'
import ChatThread from './ChatThread.jsx'

export default function ChatWorkspace({ bakeryId = '', routeSearch = '', baseRoute = 'chat', onNavigate }) {
  const { user, roles } = useAuth()
  const [status, setStatus] = useState(''), [page, setPage] = useState(1)
  const [selectedId, setSelected] = useState(new URLSearchParams(routeSearch).get('conversationId') || '')
  const viewer = { userId: user.id, roles, ...(bakeryId ? { bakeryId } : {}) }
  const conversations = useCatalogResource(loadConversations, { viewer, page, size: 10, status, ...(bakeryId ? { bakeryId } : {}) })
  const select = (id) => {
    setSelected(id)
    const query = new URLSearchParams({ conversationId: id })
    if (bakeryId) query.set('bakeryId', bakeryId)
    onNavigate(baseRoute + '?' + query)
  }
  return <div className="space-y-5"><section className={panelClass}><h2 className="font-bold">Tin nhắn của bạn</h2><p className="text-sm">{CHAT_CONTEXT_GUIDANCE}</p>{roles.includes('CUSTOMER') && baseRoute === 'chat' ? <button onClick={() => onNavigate('rfqs')} className={buttonClass}>Chọn yêu cầu để nhắn tin</button> : roles.some((role) => ['BAKERY_OWNER'].includes(role)) ? <><p className="text-sm">Khách hàng mở hội thoại từ yêu cầu báo giá; cửa hàng truy cập các hội thoại được phân quyền.</p><button onClick={() => onNavigate('vendor-rfq' + (bakeryId ? '?bakeryId=' + bakeryId : ''))} className={buttonClass}>Xem yêu cầu liên quan</button></> : null}<div className="sc-toolbar-actions"><label className="text-sm">Trạng thái<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className={inputClass}><option value="">Tất cả</option>{CHAT_STATUSES.map((value) => <option key={value} value={value}>{uiLabel(value)}</option>)}</select></label><RefreshButton onClick={conversations.reload} className={buttonClass}>Tải lại hộp thư</RefreshButton></div></section><div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><ConversationList resource={conversations} selectedId={selectedId} onSelect={select} onPage={setPage} />{selectedId ? isCatalogId(selectedId) ? <ChatThread key={JSON.stringify([user.id, roles, bakeryId, selectedId])} conversationId={selectedId} viewer={viewer} onChanged={conversations.reload} /> : <ApiErrorMessage error={{ status: 400, message: 'Mã cuộc trò chuyện không hợp lệ.' }} /> : <section className={panelClass}><p>Chọn hội thoại để tải tin nhắn theo quyền của tài khoản hiện tại.</p></section>}</div></div>
}
