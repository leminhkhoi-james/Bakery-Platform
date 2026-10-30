import React, { useRef, useState } from 'react'
import { ApiErrorMessage, buttonClass, inputClass } from '../management/ApiState.jsx'
import { messageRequest } from '../../services/chatModels.js'
import ChatFeedback from './ChatFeedback.jsx'

export default function MessageComposer({ disabled, busy, onSend, onSent, compact = false }) {
  const [content, setContent] = useState(''), [messageType, setType] = useState('TEXT'), [files, setFiles] = useState([])
  const [attempt, setAttempt] = useState(null), [error, setError] = useState(null), [sending, setSending] = useState(false), [fileRevision, setFileRevision] = useState(0)
  const locked = busy || sending || disabled
  const inFlight = useRef(false)
  async function submit(event) {
    event.preventDefault()
    if (locked || inFlight.current) return
    setError(null)
    let request
    try { request = attempt || { clientMessageId: crypto.randomUUID(), messageType, content, files: [...files] }; messageRequest(request) }
    catch (failure) { setError(failure); return }
    inFlight.current = true; setAttempt(request); setSending(true)
    try {
      await onSend(request)
      setContent(''); setFiles([]); setAttempt(null); setFileRevision((value) => value + 1); onSent()
    } catch (failure) { setError(failure); if ([400, 422].includes(failure.status)) setAttempt(null) }
    finally { inFlight.current = false; setSending(false) }
  }
  if (compact) return <form onSubmit={submit} className="sc-chat-composer"><div className="sc-chat-compose-row"><label><span className="sr-only">Nội dung tin nhắn</span><textarea disabled={locked || Boolean(attempt)} value={content} maxLength={10000} rows={2} onChange={(event) => setContent(event.target.value)} className={inputClass} placeholder="Nhập tin nhắn…" /></label><button className={buttonClass} aria-label="Gửi tin nhắn" disabled={locked || messageType === 'TEXT' && !content.trim()}>{sending ? 'Đang gửi…' : busy ? 'Đang cập nhật…' : attempt ? 'Thử lại' : 'Gửi'}</button></div><details className="sc-chat-attachments"><summary>Đính kèm & tùy chọn</summary><fieldset disabled={locked || Boolean(attempt)}><label>Loại tin<select className={inputClass} value={messageType} onChange={(event) => { setType(event.target.value); setFiles([]); setFileRevision((value) => value + 1) }}><option value="TEXT">Văn bản</option><option value="IMAGE">Ảnh</option><option value="FILE">Tệp / ảnh</option></select></label>{messageType !== 'TEXT' && <label>Tệp đính kèm<input key={fileRevision} type="file" multiple accept={messageType === 'IMAGE' ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf'} onChange={(event) => setFiles([...event.target.files])} />{files.length > 0 && <span>{files.map((file) => file.name).join(', ')}</span>}</label>}<p>Tối đa 10000 ký tự; 1–5 tệp JPEG/PNG/WebP/PDF, tối đa 10 MiB mỗi tệp.</p></fieldset></details>{attempt && <p className="sc-chat-retry-note">Thử lại sẽ giữ nguyên nội dung để tránh gửi trùng.</p>}{error && <ChatFeedback error={error} />}</form>
  return <form onSubmit={submit} className="space-y-3 border-t border-outline-variant/30 pt-4"><h3 className="font-bold">Gửi tin nhắn</h3><fieldset disabled={locked || Boolean(attempt)} className="space-y-3"><label className="block text-sm">Loại tin<select value={messageType} onChange={(event) => { setType(event.target.value); setFiles([]); setFileRevision((value) => value + 1) }} className={inputClass}><option value="TEXT">Văn bản</option><option value="IMAGE">Ảnh</option><option value="FILE">Tệp / ảnh</option></select></label><label className="block text-sm">Nội dung<textarea value={content} maxLength={10000} rows={3} onChange={(event) => setContent(event.target.value)} className={inputClass} placeholder="Nhập nội dung gửi tới hội thoại đang mở…" /></label>{messageType !== 'TEXT' && <label className="block text-sm">Tệp đính kèm<input key={fileRevision} type="file" multiple accept={messageType === 'IMAGE' ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf'} onChange={(event) => setFiles([...event.target.files])} className="mt-2 block max-w-full" />{files.length > 0 && <span className="mt-2 block break-all">{files.map((file) => file.name).join(', ')}</span>}</label>}</fieldset>
    <p className="text-xs text-on-surface-variant">Tối đa 10000 ký tự. Có thể đính kèm 1–5 tệp JPEG/PNG/WebP/PDF, tối đa 10 MiB mỗi tệp.</p>
    {attempt && <p className="text-xs">Khi thử lại, giữ nguyên nội dung và tệp để tránh gửi trùng.</p>}{error && <ApiErrorMessage error={error} />}
    <button className={buttonClass} disabled={locked}>{sending || busy ? 'Đang upload / xử lý…' : attempt ? 'Thử gửi lại cùng yêu cầu' : 'Gửi tin nhắn'}</button>{disabled && <p className="text-sm">Chỉ có thể gửi tin nhắn khi cuộc trò chuyện còn mở.</p>}
  </form>
}
