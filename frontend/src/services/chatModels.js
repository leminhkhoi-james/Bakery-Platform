import { ApiError } from './apiClient.js'
import { isCatalogId, mapCatalogPage } from './catalogModels.js'
import { requireId, text } from './managementModels.js'

export const CHAT_STATUSES = ['OPEN', 'CLOSED', 'ARCHIVED']
export const MESSAGE_TYPES = ['TEXT', 'IMAGE', 'FILE', 'SYSTEM']
export const CHAT_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const CHAT_CONTEXT_GUIDANCE = 'Mở hội thoại từ yêu cầu bánh hoặc báo giá hợp lệ. Backend xác minh RFQ, cửa hàng và quyền trao đổi trước khi tạo hội thoại.'
const fail = (message) => { throw new ApiError(message, 502) }
export const safeChatUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null

export function mapConversation(dto, detail = false) {
  if (!dto || !['id', 'customerId', 'bakeryId', 'cakeRequestId'].every((key) => isCatalogId(dto[key]))) fail('Conversation DTO thiếu ID hợp lệ.')
  const result = { id: dto.id, customerId: dto.customerId, bakeryId: dto.bakeryId, cakeRequestId: dto.cakeRequestId, orderId: isCatalogId(dto.orderId) ? dto.orderId : null }
  for (const key of ['status', 'lastMessageAt', 'lastMessagePreview', 'createdAt', 'closeReason', 'currentUserLastReadAt']) result[key] = text(dto[key])
  result.unreadCount = Number.isSafeInteger(dto.unreadCount) && dto.unreadCount >= 0 ? dto.unreadCount : null
  if (detail) {
    if (!Array.isArray(dto.participants)) fail('Conversation detail thiếu participants.')
    result.participants = dto.participants.map((participant) => {
      if (!isCatalogId(participant?.userId)) fail('Participant DTO không hợp lệ.')
      return { userId: participant.userId, participantType: text(participant.participantType), joinedAt: text(participant.joinedAt), lastReadAt: text(participant.lastReadAt) }
    })
  }
  return result
}
export function assertChatAccess(conversation, viewer) {
  if (!viewer?.userId) throw new ApiError('Cần phiên đăng nhập để xem hội thoại.', 401)
  if (viewer.bakeryId && conversation.bakeryId !== viewer.bakeryId) throw new ApiError('Hội thoại không thuộc cửa hàng đã chọn.', 403)
  if (conversation.customerId !== viewer.userId && !viewer.roles?.some((role) => ['BAKERY_OWNER', 'BAKERY_STAFF'].includes(role))) throw new ApiError('Hội thoại không thuộc tài khoản hiện tại.', 403)
  if (conversation.participants && !conversation.participants.some((participant) => participant.userId === viewer.userId)) throw new ApiError('Backend chưa xác nhận bạn là participant của hội thoại.', 403)
  return conversation
}
export function mapConversationPage(dto, viewer) {
  return mapCatalogPage(dto, (item) => assertChatAccess(mapConversation(item), viewer))
}
export function mapMessage(dto) {
  if (!isCatalogId(dto?.id) || !isCatalogId(dto?.clientMessageId) || !Array.isArray(dto?.attachments) || typeof dto.deleted !== 'boolean') fail('Message DTO không hợp lệ.')
  return {
    id: dto.id, clientMessageId: dto.clientMessageId, senderId: isCatalogId(dto.senderId) ? dto.senderId : null,
    messageType: text(dto.messageType), content: dto.deleted ? null : text(dto.content), createdAt: text(dto.createdAt), editedAt: text(dto.editedAt), deleted: dto.deleted,
    attachments: dto.deleted ? [] : dto.attachments.map((attachment) => {
      if (!isCatalogId(attachment?.id)) fail('Attachment DTO không hợp lệ.')
      return { id: attachment.id, originalFileName: text(attachment.originalFileName), mediaType: text(attachment.mediaType), fileSize: Number.isSafeInteger(attachment.fileSize) && attachment.fileSize >= 0 ? attachment.fileSize : null, url: safeChatUrl(attachment.url) }
    }),
  }
}
export function mapMessagePage(dto) {
  if (!Array.isArray(dto?.items) || typeof dto.hasMore !== 'boolean' || !(dto.nextCursor === null || typeof dto.nextCursor === 'string') || (dto.hasMore && (!dto.items.length || !dto.nextCursor))) fail('Message page phải có items/nextCursor/hasMore hợp lệ.')
  return { items: dto.items.map(mapMessage), nextCursor: dto.nextCursor, hasMore: dto.hasMore }
}
// Page order stays as returned by backend (createdAt DESC, UUID DESC), including microseconds.
export function mergeOlderMessages(current, older) {
  const known = new Set(current.map((message) => message.id))
  return [...current, ...older.filter((message) => { if (known.has(message.id)) return false; known.add(message.id); return true })]
}
export function messageRequest(input) {
  const clientMessageId = requireId(input.clientMessageId, 'clientMessageId')
  const files = input.files || []
  const content = input.content ?? ''
  if (!['TEXT', 'IMAGE', 'FILE'].includes(input.messageType) || typeof content !== 'string' || content.length > 10000) throw new ApiError('Loại tin hoặc nội dung không hợp lệ (tối đa 10000 ký tự).', 422)
  if (!Array.isArray(files)) throw new ApiError('Danh sách file không hợp lệ.', 422)
  if (input.messageType === 'TEXT' ? (!content.trim() || files.length > 0) : (files.length < 1 || files.length > 5)) throw new ApiError('TEXT cần nội dung và không có file; IMAGE/FILE cần 1–5 tệp.', 422)
  for (const file of files) if (!CHAT_FILE_TYPES.includes(file.type) || file.size < 1 || file.size > 10 * 1024 * 1024 || (input.messageType === 'IMAGE' && !file.type.startsWith('image/'))) throw new ApiError('Tệp phải là JPEG/PNG/WebP/PDF, tối đa 10 MiB/tệp; IMAGE chỉ nhận ảnh.', 422)
  return { clientMessageId, messageType: input.messageType, content: content.trim() ? content : null, files: [...files] }
}
export async function messageFormData(input) {
  const request = messageRequest(input)
  const body = new FormData()
  body.append('metadata', new Blob([JSON.stringify({ clientMessageId: request.clientMessageId, messageType: request.messageType, content: request.content })], { type: 'application/json' }))
  for (const file of request.files) {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const ascii = (from, to) => String.fromCharCode(...bytes.slice(from, to))
    const type = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? 'image/jpeg' : [0x89, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value) ? 'image/png' : ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' ? 'image/webp' : ascii(0, 5) === '%PDF-' ? 'application/pdf' : null
    if (type !== file.type) throw new ApiError('Nội dung tệp không khớp loại MIME đã khai báo.', 422)
    body.append('files', file)
  }
  return body
}
