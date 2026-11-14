import { uiLabel } from '../../services/uiLabels.js'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useChatThread } from '../../hooks/useChatThread.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadChatBakeryName } from '../../services/chatService.js'
import { ChatMessages, ChatReadStatus } from './ChatMessages.jsx'
import MessageComposer from './MessageComposer.jsx'
import CloseConversation from './CloseConversation.jsx'
import { Icon, StatusBadge } from '../common/WorkspaceUI.jsx'
import ChatFeedback from './ChatFeedback.jsx'
import { chatInboxTitle, chatRequestLabel } from '../../services/chatPresentation.js'

export default function ChatThread({ conversationId, viewer, onChanged, summary, onBack, onNavigate }) {
  const { user } = useAuth()
  const [autoRefresh, setAutoRefresh] = useState(true), [notice, setNotice] = useState(''), [error, setError] = useState(null)
  const { state, store } = useChatThread(conversationId, viewer, autoRefresh, onChanged)
  const busy = state.mutationBusy || state.refreshing || state.loadingOlder
  const messages = useRef(null), follow = useRef(true), optionPanel = useRef(null)
  const latestId = state.items[0]?.id, latestSender = state.items[0]?.senderId
  useEffect(() => {
    if (state.hasLoadedOlder || !messages.current) return
    if (follow.current || latestSender === user.id) messages.current.scrollTop = messages.current.scrollHeight
  }, [latestId, latestSender, state.hasLoadedOlder, user.id])
  useEffect(() => {
    if (!messages.current || typeof ResizeObserver === 'undefined') return
    const element = messages.current
    const observer = new ResizeObserver(() => { if (follow.current && !state.hasLoadedOlder) element.scrollTop = element.scrollHeight })
    observer.observe(element)
    return () => observer.disconnect()
  }, [state.hasLoadedOlder])
  useEffect(() => {
    const outside = (event) => { const panel = optionPanel.current; if (panel?.open && !panel.contains(event.target)) panel.open = false }
    const escape = (event) => { const panel = optionPanel.current; if (event.key === 'Escape' && panel?.open) { panel.open = false; panel.querySelector('summary')?.focus() } }
    document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', escape) }
  }, [])
  const markedThrough = useRef(null)
  useEffect(() => {
    if (state.status !== 'ready' || !latestId || state.mutationBusy || state.refreshing || state.loadingOlder || state.hasLoadedOlder ||
        !(state.conversation?.unreadCount ?? summary?.unreadCount) || markedThrough.current === latestId) return
    markedThrough.current = latestId
    store.markRead().then(() => { setError(null); onChanged?.() }, failure => {
      markedThrough.current = null
      setError(failure)
    })
  }, [latestId, state.status, state.mutationBusy, state.refreshing, state.loadingOlder, state.hasLoadedOlder, state.conversation?.unreadCount, summary?.unreadCount, store, onChanged])
  async function action(operation, message) {
    setError(null); setNotice('')
    try { await operation(); setNotice(message); onChanged?.() }
    catch (failure) { setError(failure) }
  }
  const historyAnchor = useRef(null)
  useLayoutEffect(() => {
    if (state.loadingOlder || !historyAnchor.current || !messages.current) return
    const { height, top, items } = historyAnchor.current
    if (items !== state.items && state.status === 'ready') {
      messages.current.scrollTop = top + messages.current.scrollHeight - height
    }
    historyAnchor.current = null
  }, [state.loadingOlder, state.items, state.status])

  const loadOlder = () => {
    const element = messages.current
    historyAnchor.current = { height: element.scrollHeight, top: element.scrollTop, items: state.items }
    void store.loadOlder()
  }
  const conversation = state.conversation
  const context = { ...summary, ...conversation }
  const bakeryName = useCatalogResource(loadChatBakeryName, {
    bakeryId: !viewer.bakeryId && !context.bakeryName ? conversation?.bakeryId : undefined,
  })
  context.bakeryName ||= bakeryName.data
  const requestRoute = viewer.bakeryId
    ? 'vendor-quote-submit?' + new URLSearchParams({ bakeryId: viewer.bakeryId, cakeRequestId: context.cakeRequestId })
    : 'request-detail?' + new URLSearchParams({ id: context.cakeRequestId })

  return <section className="sc-owner-thread" aria-label="Nội dung hội thoại">
    <header className="sc-owner-thread-header">
      <button type="button" className="sc-icon-button sc-chat-back" aria-label="Quay lại danh sách hội thoại" onClick={onBack}><Icon name="arrow_back" /></button>
      <div className="sc-owner-thread-person">
        <h2>{chatInboxTitle(context, Boolean(viewer.bakeryId))}</h2>
        {!viewer.bakeryId && context.ownerName && context.bakeryName && <p className="text-xs text-on-surface-variant">{context.ownerName}</p>}
        {conversation && <button type="button" className="sc-chat-context-link" onClick={() => onNavigate(requestRoute)}>
          {viewer.bakeryId ? chatRequestLabel(context) : 'Xem yêu cầu bánh ban đầu'} <Icon name="open_in_new" />
        </button>}
      </div>
      {conversation && conversation.status !== 'OPEN' && <StatusBadge status={conversation.status} />}
      {conversation && <details ref={optionPanel} className="sc-owner-thread-options">
        <summary aria-label="Tùy chọn hội thoại"><Icon name="more_horiz" /></summary>
        <div className="sc-owner-thread-options-body">
          <p>{uiLabel(conversation.status)}</p>
          <button type="button" disabled={busy} className="sc-chat-context-link" onClick={() => {
            optionPanel.current.open = false
            follow.current = true
            void store.refresh(true).then((updated) => {
              if (updated) onChanged?.()
            })
          }}>Tải lại tin nhắn</button>
          <label><input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} /> Tự cập nhật tin nhắn</label>
          <ChatReadStatus conversation={conversation} userId={user.id} />
          {conversation.status === 'OPEN' && <details><summary>Đóng hội thoại</summary>
            <CloseConversation conversation={conversation} user={user} busy={busy} onClose={(reason) => store.close(reason)} />
          </details>}
        </div>
      </details>}
    </header>
    <div ref={messages} className="sc-owner-thread-messages" role="region" tabIndex={0} aria-label="Lịch sử tin nhắn" onScroll={() => {
      const element = messages.current
      follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 64
    }}>
      {state.status === 'loading' ? <p role="status" className="sc-chat-state">Đang tải tin nhắn…</p>
        : state.error ? <ChatFeedback error={state.error} retry={() => store.refresh(true)} />
          : conversation && <>
            {state.hasMore && <button type="button" disabled={busy} onClick={loadOlder} className="sc-chat-older">{state.loadingOlder ? 'Đang tải…' : 'Xem tin nhắn cũ hơn'}</button>}
            {state.olderError && <ChatFeedback error={state.olderError} retry={loadOlder} />}
            <ChatMessages compact items={state.items} conversation={context} user={user} busy={busy}
              onDelete={(id) => action(() => store.deleteMessage(id), 'Đã xóa tin nhắn.')} />
          </>}
    </div>
    {state.hasLoadedOlder && <button type="button" className="sc-chat-latest" disabled={busy} onClick={() => {
      follow.current = true
      void store.refresh(true).then((updated) => {
        if (updated) {
          if (messages.current) messages.current.scrollTop = messages.current.scrollHeight
          onChanged?.()
        }
      })
    }}>Về tin mới nhất</button>}
    {error && !state.error && <ChatFeedback error={error} />}
    {notice && !state.error && <p role="status" className="sc-chat-notice">{notice}</p>}
    {conversation && !state.error && (conversation.status === 'OPEN'
      ? <MessageComposer compact busy={busy} onSend={(request) => store.send(request)} onSent={() => { setNotice(''); onChanged?.() }} />
      : <p className="sc-chat-closed">Hội thoại đã kết thúc. Bạn vẫn có thể xem lịch sử tin nhắn.</p>)}
  </section>
}
