import { displayReference } from '../../services/displayReference.js'
import { uiLabel } from '../../services/uiLabels.js'
import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useChatThread } from '../../hooks/useChatThread.js'
import { ApiState, ApiErrorMessage, buttonClass, panelClass } from '../management/ApiState.jsx'
import { ChatMessages, ChatReadStatus } from './ChatMessages.jsx'
import MessageComposer from './MessageComposer.jsx'
import CloseConversation from './CloseConversation.jsx'
import { Icon } from '../common/WorkspaceUI.jsx'
import RefreshButton from '../common/RefreshButton.jsx'
import ChatFeedback from './ChatFeedback.jsx'
import { chatCustomerLabel, chatRequestLabel } from '../../services/chatPresentation.js'

export default function ChatThread({ conversationId, viewer, onChanged, compact = false, summary, onBack, onNavigate }) {
  const { user } = useAuth()
  const [autoRefresh, setAutoRefresh] = useState(true), [notice, setNotice] = useState(''), [error, setError] = useState(null)
  const { state, store } = useChatThread(conversationId, viewer, autoRefresh, onChanged)
  const busy = state.mutationBusy || state.refreshing || state.loadingOlder
  const messages = useRef(null), follow = useRef(true), optionPanel = useRef(null)
  const latestId = state.items[0]?.id, latestSender = state.items[0]?.senderId
  useEffect(() => {
    if (!compact || state.hasLoadedOlder || !messages.current) return
    if (follow.current || latestSender === user.id) messages.current.scrollTop = messages.current.scrollHeight
  }, [compact, latestId, latestSender, state.hasLoadedOlder, user.id])
  useEffect(() => {
    if (!compact || !messages.current || typeof ResizeObserver === 'undefined') return
    const element = messages.current
    const observer = new ResizeObserver(() => { if (follow.current && !state.hasLoadedOlder) element.scrollTop = element.scrollHeight })
    observer.observe(element)
    return () => observer.disconnect()
  }, [compact, state.hasLoadedOlder])
  useEffect(() => {
    if (!compact) return
    const outside = (event) => { const panel = optionPanel.current; if (panel?.open && !panel.contains(event.target)) panel.open = false }
    const escape = (event) => { const panel = optionPanel.current; if (event.key === 'Escape' && panel?.open) { panel.open = false; panel.querySelector('summary')?.focus() } }
    document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', escape) }
  }, [compact])
  async function action(operation, message) {
    setError(null); setNotice('')
    try { await operation(); setNotice(message); onChanged() }
    catch (failure) { setError(failure) }
  }
  if (compact) return <section className="sc-owner-thread" aria-label="Nội dung hội thoại"><header className="sc-owner-thread-header"><button type="button" className="sc-icon-button sc-chat-back" aria-label="Quay lại danh sách hội thoại" onClick={onBack}><Icon name="arrow_back" /></button><div className="sc-owner-thread-person"><h2>{chatCustomerLabel({ ...summary, ...state.conversation })}</h2>{state.conversation && <button className="sc-chat-context-link" onClick={() => onNavigate('vendor-quote-submit?' + new URLSearchParams({ bakeryId: state.conversation.bakeryId, cakeRequestId: state.conversation.cakeRequestId }))}>{chatRequestLabel({ ...summary, ...state.conversation })}<Icon name="open_in_new" /></button>}</div><RefreshButton aria-label="Tải lại tin nhắn" disabled={busy} onClick={() => { void store.refresh(true); onChanged() }}>Tải lại</RefreshButton>{state.conversation && <details ref={optionPanel} className="sc-owner-thread-options"><summary aria-label="Tùy chọn hội thoại"><Icon name="more_horiz" /></summary><div className="sc-owner-thread-options-body"><p>{uiLabel(state.conversation.status)}</p><label><input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} /> Tự cập nhật tin nhắn</label>{state.hasLoadedOlder && <p>Đang xem tin cũ; tải lại để trở về tin mới nhất.</p>}<ChatReadStatus conversation={state.conversation} userId={user.id} /><button disabled={busy || !state.items.length} className="sc-button" onClick={() => action(() => store.markRead(), 'Đã đánh dấu đã đọc.')}>Đánh dấu đã đọc</button>{state.conversation.status === 'OPEN' && <CloseConversation conversation={state.conversation} user={user} busy={busy} onClose={(reason) => store.close(reason)} />}</div></details>}</header>
    <div ref={messages} className="sc-owner-thread-messages" onScroll={() => { const element = messages.current; if (element) follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 64 }}>
      {state.status === 'loading' ? <p role="status" className="sc-chat-state">Đang tải tin nhắn…</p> : state.error ? <ChatFeedback error={state.error} retry={() => store.refresh(true)} /> : state.conversation && <>{state.hasMore && <button disabled={busy} onClick={() => store.loadOlder()} className="sc-chat-older">{state.loadingOlder ? 'Đang tải…' : 'Xem tin nhắn cũ hơn'}</button>}{state.olderError && <ChatFeedback error={state.olderError} retry={() => store.loadOlder()} />}<ChatMessages compact items={state.items} conversation={state.conversation} user={user} busy={busy} onDelete={(id) => action(() => store.deleteMessage(id), 'Đã xóa tin nhắn.')} /></>}
    </div>{error && !state.error && <ChatFeedback error={error} />}{notice && !state.error && <p role="status" className="sc-chat-notice">{notice}</p>}{state.conversation && !state.error && (state.conversation.status === 'OPEN' ? <MessageComposer compact busy={busy} onSend={(request) => store.send(request)} onSent={() => { setNotice('Đã gửi tin nhắn.'); onChanged() }} /> : <p className="sc-chat-closed">Hội thoại đã đóng, chỉ có thể xem tin nhắn.</p>)}
  </section>
  return <section className={panelClass}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold text-primary">Nội dung trao đổi</h2><button disabled={busy} onClick={() => { void store.refresh(true); onChanged() }} className={buttonClass}>Tải mới nhất</button></div><p className="text-xs text-on-surface-variant">Bấm Tải mới nhất để cập nhật cuộc trò chuyện.</p><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />Tự tải mới nhất mỗi 15 giây khi tab hiển thị</label>{state.hasLoadedOlder && <p className="text-xs">Đang xem lịch sử cũ; tạm dừng tự tải để giữ lịch sử. Bấm Tải mới nhất để cập nhật.</p>}
    <ApiState resource={{ ...state, reload: () => store.refresh(true) }}>{state.conversation && <>
      <div className="space-y-1 break-all text-xs text-on-surface-variant"><p>Hội thoại: {displayReference(state.conversation.id, 'CHAT')} · {uiLabel(state.conversation.status)}</p><p>Yêu cầu báo giá: {displayReference(state.conversation.cakeRequestId, 'RFQ')}</p>{state.conversation.orderId && <p>Đơn hàng: {displayReference(state.conversation.orderId, 'ORD')}</p>}{state.conversation.closeReason && <p>Lý do đóng: {state.conversation.closeReason}</p>}</div>
      <ChatReadStatus conversation={state.conversation} userId={user.id} />{state.hasMore && <button disabled={busy} onClick={() => store.loadOlder()} className="text-sm underline disabled:opacity-40">{state.loadingOlder ? 'Đang tải…' : 'Tải tin nhắn cũ hơn'}</button>}{state.olderError && <ApiErrorMessage error={state.olderError} retry={() => store.loadOlder()} />}
      <div className="max-h-[65vh] overflow-y-auto rounded-xl bg-surface-container-lowest p-2 sm:p-4"><ChatMessages items={state.items} conversation={state.conversation} user={user} busy={busy} onDelete={(id) => action(() => store.deleteMessage(id), 'Đã xác nhận xóa; dữ liệu đã được tải lại.')} /></div>
      <button disabled={busy || !state.items.length} className="text-sm underline disabled:opacity-40" onClick={() => action(() => store.markRead(), 'Đã xác nhận mốc đọc; đang đồng bộ số tin chưa đọc.')}>Đánh dấu đã đọc đến tin mới nhất đã tải</button>
      <CloseConversation conversation={state.conversation} user={user} busy={busy} onClose={(reason) => store.close(reason)} /><MessageComposer disabled={state.conversation.status !== 'OPEN'} busy={busy} onSend={(request) => store.send(request)} onSent={() => { setNotice('Đã xác nhận gửi. Tin nhắn được đọc lại từ nguồn dữ liệu của hội thoại.'); onChanged() }} />
    </>}</ApiState>{error && <ApiErrorMessage error={error} />}{notice && <p role="status" className="text-sm">{notice}</p>}
  </section>
}
