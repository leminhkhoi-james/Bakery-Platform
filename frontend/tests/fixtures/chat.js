import { randomUUID } from 'node:crypto'

export const customerId = randomUUID(), otherUserId = randomUUID(), bakeryId = randomUUID(), conversationId = randomUUID(), cakeRequestId = randomUUID()
export const viewer = { userId: customerId, roles: ['CUSTOMER'] }
export const summary = { id: conversationId, cakeRequestId, orderId: null, customerId, bakeryId, status: 'OPEN', lastMessageAt: '2026-10-26T01:02:03.000002Z', unreadCount: 2, lastMessagePreview: 'Nội dung từ backend' }
export const conversation = { ...summary, closeReason: null, createdAt: '2026-10-25T01:00:00Z', currentUserLastReadAt: null, participants: [{ userId: customerId, participantType: 'CUSTOMER', joinedAt: '2026-10-25T01:00:00Z', lastReadAt: null }, { userId: otherUserId, participantType: 'BAKERY_OWNER', joinedAt: '2026-10-25T01:00:00Z', lastReadAt: null }] }
export const message = { id: randomUUID(), clientMessageId: randomUUID(), senderId: otherUserId, messageType: 'TEXT', content: 'Nội dung backend mới nhất', createdAt: '2026-10-26T01:02:03.000002Z', editedAt: null, deleted: false, attachments: [] }
export const olderMessage = { ...message, id: randomUUID(), clientMessageId: randomUUID(), content: 'Tin cũ hơn', createdAt: '2026-10-26T01:02:03.000001Z' }
export const cursor = Buffer.from(message.createdAt + '|' + message.id).toString('base64url')
export const messagePage = { items: [message], nextCursor: cursor, hasMore: true }
export const conversationPage = (items = [summary], meta = {}) => ({ result: items, meta: { page: 1, pageSize: 10, pages: items.length ? 1 : 0, total: items.length, ...meta } })
export const pngFile = () => new File([Uint8Array.from([0x89, 80, 78, 71, 13, 10, 26, 10, 0])], 'ảnh-fixture.png', { type: 'image/png' })
export const pdfFile = () => new File(['%PDF-1.4\nfixture'], 'fixture.pdf', { type: 'application/pdf' })
export const reply = (data, status = 200) => Response.json({ statusCode: status, message: 'Chat fixture response', data }, { status })
