import React, { useState } from 'react'
import { dateTime } from '../../services/managementModels.js'
import { formatOrderDate } from '../../services/orderPresentation.js'

const participantLabel = (type) => ({ CUSTOMER: 'Khách hàng', BAKERY_OWNER: 'Chủ tiệm', BAKERY: 'Chủ tiệm' }[type] || 'Thành viên hội thoại')
function Attachment({ attachment }) {
  const [broken, setBroken] = useState(false)
  return <div className="mt-2 rounded-xl border border-outline-variant/30 bg-surface p-3 text-on-surface"><p className="break-all text-sm">{attachment.originalFileName || 'Tệp đính kèm'} · {attachment.mediaType || 'Chưa rõ loại'} · {attachment.fileSize === null ? 'Chưa có dung lượng' : attachment.fileSize.toLocaleString('vi-VN') + ' byte'}</p>
    {attachment.url ? <><a href={attachment.url} target="_blank" rel="noreferrer" className="text-sm underline">Mở tệp đính kèm</a>{attachment.mediaType?.startsWith('image/') && !broken && <img src={attachment.url} alt={attachment.originalFileName || 'Ảnh đính kèm'} loading="lazy" onError={() => setBroken(true)} className="mt-2 max-h-72 max-w-full rounded-xl object-contain" />}{broken && <p className="mt-2 text-xs">Không tải được ảnh. Tải lại hội thoại để lấy URL mới nếu URL đã hết hạn.</p>}</> : <p className="text-xs">Tệp đính kèm hiện chưa thể tải. Vui lòng thử lại sau.</p>}
  </div>
}

export function ChatMessages({ items, conversation, user, busy, onDelete, compact = false }) {
  const formatTime = compact ? formatOrderDate : dateTime
  if (!items.length) return <p className="p-8 text-center text-on-surface-variant">Hội thoại chưa có tin nhắn.</p>
  return <ol aria-label="Tin nhắn" className="space-y-5">{items.toReversed().map((message) => {
    const own = message.senderId === user.id
    const participant = conversation.participants.find((item) => item.userId === message.senderId)
    return <li key={message.id} className={'flex flex-col ' + (own ? 'items-end' : 'items-start')}>
      <p className="max-w-full break-all text-xs text-on-surface-variant">{own ? 'Bạn' : message.messageType === 'SYSTEM' && !message.senderId ? 'Hệ thống' : participantLabel(participant?.participantType)}</p>
      <div className={'mt-1 max-w-[95%] break-words rounded-2xl p-4 sm:max-w-[85%] ' + (own ? 'rounded-br-none bg-primary text-on-primary' : 'rounded-bl-none bg-surface-container-high text-on-surface')}>
        {message.deleted ? <p className="italic">Tin nhắn đã được xóa.</p> : <>{message.content && <p className="whitespace-pre-wrap">{message.content}</p>}{!message.content && !message.attachments.length && <p>Chưa thể tải nội dung tin nhắn.</p>}{message.attachments.map((attachment) => <Attachment key={attachment.id + ':' + attachment.url} attachment={attachment} />)}</>}
      </div><p className="mt-1 text-xs text-on-surface-variant">{formatTime(message.createdAt)}{message.editedAt ? ' · Đã sửa: ' + formatTime(message.editedAt) : ''}</p>
      {own && !message.deleted && onDelete && <button disabled={busy} onClick={() => onDelete(message.id)} className="mt-1 text-xs underline disabled:opacity-40">Xóa tin nhắn của tôi</button>}
    </li>
  })}</ol>
}

export function ChatReadStatus({ conversation, userId }) {
  return <details className="rounded-xl border border-outline-variant/30 p-3 text-xs text-on-surface-variant"><summary className="cursor-pointer">Mốc đọc của hội thoại</summary><p className="mt-2">Bạn đã đọc đến: {conversation.currentUserLastReadAt ? dateTime(conversation.currentUserLastReadAt) : 'Chưa có mốc đọc'}</p><ul className="mt-2 space-y-1">{conversation.participants.filter((participant) => participant.userId !== userId).map((participant) => <li key={participant.userId} className="break-all">{participantLabel(participant.participantType)}: {participant.lastReadAt ? dateTime(participant.lastReadAt) : 'Chưa có mốc đọc'}</li>)}</ul><p className="mt-2">Mốc đọc áp dụng cho cả cuộc trò chuyện.</p></details>
}
