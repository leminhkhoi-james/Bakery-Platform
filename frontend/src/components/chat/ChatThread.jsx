import { displayReference } from '../../services/displayReference.js'
import { uiLabel } from '../../services/uiLabels.js'
import React, { useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useChatThread } from '../../hooks/useChatThread.js'
import { ApiState, ApiErrorMessage, buttonClass, panelClass } from '../management/ApiState.jsx'
import { ChatMessages, ChatReadStatus } from './ChatMessages.jsx'
import MessageComposer from './MessageComposer.jsx'
import CloseConversation from './CloseConversation.jsx'

export default function ChatThread({ conversationId, viewer, onChanged }) {
  const { user } = useAuth()
  const [autoRefresh, setAutoRefresh] = useState(true), [notice, setNotice] = useState(''), [error, setError] = useState(null)
  const { state, store } = useChatThread(conversationId, viewer, autoRefresh, onChanged)
  const busy = state.mutationBusy || state.refreshing || state.loadingOlder
  async function action(operation, message) {
    setError(null); setNotice('')
    try { await operation(); setNotice(message); onChanged() }
    catch (failure) { setError(failure) }
  }
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
