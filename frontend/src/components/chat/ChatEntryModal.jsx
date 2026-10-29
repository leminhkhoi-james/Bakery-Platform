import React from 'react'
import ModalSurface from '../common/ModalSurface.jsx'
import { CHAT_CONTEXT_GUIDANCE } from '../../services/chatModels.js'
import { buttonClass } from '../management/ApiState.jsx'

// Legacy RFQ/quote screens have no authenticated conversationId; never convert mock context IDs.
export default function ChatEntryModal({ onClose, onNavigate, vendor = false }) {
  return <ModalSurface onClose={onClose} labelledBy="chat-entry-title" className="sc-chat-entry-dialog" guardChanges={false}>{({ requestClose }) => <section className="space-y-5"><div className="flex items-center justify-between gap-4"><h2 id="chat-entry-title" className="text-xl font-bold text-primary">Trao đổi với tiệm</h2><button aria-label="Đóng Chat" onClick={requestClose} className="rounded-full border px-3 py-1">×</button></div><p>{CHAT_CONTEXT_GUIDANCE}</p><p className="text-sm text-on-surface-variant">Mở cuộc trò chuyện từ yêu cầu báo giá hoặc đơn hàng của bạn.</p><button className={buttonClass} onClick={() => { if (requestClose()) onNavigate(vendor ? 'vendor-chat' : 'chat') }}>Mở hộp thư</button></section>}</ModalSurface>
}
