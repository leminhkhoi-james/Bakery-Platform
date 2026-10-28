import React from 'react'
import { CHAT_CONTEXT_GUIDANCE } from '../../services/chatModels.js'
import { buttonClass } from '../management/ApiState.jsx'

// Legacy RFQ/quote screens have no authenticated conversationId; never convert mock context IDs.
export default function ChatEntryModal({ onClose, onNavigate, vendor = false }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="chat-entry-title" className="w-full max-w-lg space-y-5 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-2xl"><div className="flex items-center justify-between gap-4"><h2 id="chat-entry-title" className="text-xl font-bold text-primary">Trao đổi với tiệm</h2><button aria-label="Đóng Chat" onClick={onClose} className="rounded-full border px-3 py-1">×</button></div><p>{CHAT_CONTEXT_GUIDANCE}</p><p className="text-sm text-on-surface-variant">Mở cuộc trò chuyện từ yêu cầu báo giá hoặc đơn hàng của bạn.</p><button className={buttonClass} onClick={() => { onClose(); onNavigate(vendor ? 'vendor-chat' : 'chat') }}>Mở hộp thư</button></section></div>
}
