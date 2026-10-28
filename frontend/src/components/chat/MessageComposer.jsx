import React, { useState } from 'react'
import { ApiErrorMessage, buttonClass, inputClass } from '../management/ApiState.jsx'
import { messageRequest } from '../../services/chatModels.js'

export default function MessageComposer({ disabled, busy, onSend, onSent }) {
  const [content, setContent] = useState(''), [messageType, setType] = useState('TEXT'), [files, setFiles] = useState([])
  const [attempt, setAttempt] = useState(null), [error, setError] = useState(null), [sending, setSending] = useState(false), [fileRevision, setFileRevision] = useState(0)
  const locked = busy || sending || disabled
  async function submit(event) {
    event.preventDefault()
    if (locked) return
    setError(null)
    let request
    try { request = attempt || { clientMessageId: crypto.randomUUID(), messageType, content, files: [...files] }; messageRequest(request) }
    catch (failure) { setError(failure); return }
    setAttempt(request); setSending(true)
    try {
      await onSend(request)
      setContent(''); setFiles([]); setAttempt(null); setFileRevision((value) => value + 1); onSent()
    } catch (failure) { setError(failure); if ([400, 422].includes(failure.status)) setAttempt(null) }
    finally { setSending(false) }
  }
  return <form onSubmit={submit} className="space-y-3 border-t border-outline-variant/30 pt-4"><h3 className="font-bold">Gửi tin nhắn</h3><fieldset disabled={locked || Boolean(attempt)} className="space-y-3"><label className="block text-sm">Loại tin<select value={messageType} onChange={(event) => { setType(event.target.value); setFiles([]); setFileRevision((value) => value + 1) }} className={inputClass}><option value="TEXT">Văn bản</option><option value="IMAGE">Ảnh</option><option value="FILE">Tệp / ảnh</option></select></label><label className="block text-sm">Nội dung<textarea value={content} maxLength={10000} rows={3} onChange={(event) => setContent(event.target.value)} className={inputClass} placeholder="Nhập nội dung gửi tới hội thoại đang mở…" /></label>{messageType !== 'TEXT' && <label className="block text-sm">Tệp đính kèm<input key={fileRevision} type="file" multiple accept={messageType === 'IMAGE' ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf'} onChange={(event) => setFiles([...event.target.files])} className="mt-2 block max-w-full" />{files.length > 0 && <span className="mt-2 block break-all">{files.map((file) => file.name).join(', ')}</span>}</label>}</fieldset>
    <p className="text-xs text-on-surface-variant">Tối đa 10000 ký tự. IMAGE/FILE: 1–5 tệp JPEG/PNG/WebP/PDF, ≤10 MiB mỗi tệp; IMAGE chỉ nhận ảnh. Backend kiểm tra nội dung và quyền truy cập.</p>
    {attempt && <p className="text-xs">Thử lại giữ nguyên clientMessageId, nội dung và tệp để tránh gửi trùng khi mất phản hồi.</p>}{error && <ApiErrorMessage error={error} />}
    <button className={buttonClass} disabled={locked}>{sending || busy ? 'Đang upload / xử lý…' : attempt ? 'Thử gửi lại cùng yêu cầu' : 'Gửi tin nhắn'}</button>{disabled && <p className="text-sm">Chỉ hội thoại OPEN, đã được backend xác minh quyền mới có thể gửi.</p>}
  </form>
}
