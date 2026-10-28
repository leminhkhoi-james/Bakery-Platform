import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { setAuthToken } from '../src/services/apiClient.js'
import { chatService as service } from '../src/services/chatService.js'
import { assertChatAccess, mapConversation, mapConversationPage, mapMessage, mapMessagePage, mergeOlderMessages, messageRequest, messageFormData, safeChatUrl } from '../src/services/chatModels.js'
import { canAccess, requiredRoles } from '../src/routes/routeAccess.js'
import { viewer, customerId, otherUserId, bakeryId, conversationId, conversation, summary, message, olderMessage, messagePage, cursor, conversationPage, pngFile, pdfFile, reply } from './fixtures/chat.js'

const nativeFetch = globalThis.fetch
let calls, handler
beforeEach(() => { setAuthToken('chat-fixture-token'); calls = []; handler = () => { throw new Error('Unexpected request') }; globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options) } })
after(() => { globalThis.fetch = nativeFetch; setAuthToken(null) })
test('Conversation DTO uses real IDs/preview/unread and does not invent names, avatar or online state', () => {
  const result = mapConversation(summary)
  assert.equal(result.id, conversationId); assert.equal(result.unreadCount, 2); assert.equal(result.lastMessagePreview, summary.lastMessagePreview)
  for (const field of ['name', 'avatar', 'online', 'typing']) assert.equal(result[field], undefined)
  assert.equal(mapConversation({ ...summary, unreadCount: undefined }).unreadCount, null)
  assert.throws(() => mapConversation({ id: '#fake' }), { status: 502 })
})
test('Empty conversations preserve result/meta; wrong plural results shape fails', () => {
  assert.deepEqual(mapConversationPage(conversationPage([]), viewer).result, [])
  assert.throws(() => mapConversationPage({ results: [summary] }, viewer), { status: 502 })
})
test('Customer cannot render another customer conversation; vendor scope and participants fail closed', () => {
  assert.throws(() => assertChatAccess(mapConversation({ ...summary, customerId: otherUserId }), viewer), { status: 403 })
  const vendor = { userId: otherUserId, roles: ['BAKERY_OWNER'], bakeryId: randomUUID() }
  assert.throws(() => assertChatAccess(mapConversation(conversation, true), vendor), { status: 403 })
  assert.throws(() => assertChatAccess(mapConversation({ ...conversation, participants: [] }, true), viewer), { status: 403 })
  assert.equal(assertChatAccess(mapConversation(conversation, true), { ...vendor, bakeryId }).id, conversationId)
})
test('Chat routes require a session; Vendor chat inherits actual vendor role guard', () => {
  assert.deepEqual(requiredRoles('chat'), []); assert.equal(canAccess('chat', null), false)
  assert.equal(canAccess('vendor-chat', { roles: ['CUSTOMER'] }), false)
  assert.equal(canAccess('vendor-chat', { roles: ['BAKERY_STAFF'] }), true)
})
test('Message mapper preserves raw timestamps, sender IDs, editedAt and attachment metadata', () => {
  const result = mapMessage({ ...message, editedAt: '2026-10-26T02:00:00Z', attachments: [{ id: randomUUID(), originalFileName: 'proof.pdf', mediaType: 'application/pdf', fileSize: 123, url: 'https://fixture.invalid/proof' }] })
  assert.equal(result.createdAt, message.createdAt); assert.equal(result.senderId, otherUserId); assert.equal(result.attachments[0].fileSize, 123)
  assert.equal(result.read, undefined); assert.equal(result.delivered, undefined)
})
test('Deleted messages always hide stale content and attachments; unsafe attachment URLs are not used', () => {
  const result = mapMessage({ ...message, deleted: true, attachments: [{ id: randomUUID(), url: 'https://fixture.invalid/deleted' }] })
  assert.equal(result.content, null); assert.deepEqual(result.attachments, [])
  assert.equal(safeChatUrl('javascript:alert(1)'), null); assert.equal(safeChatUrl('data:text/html,test'), null)
})
test('Cursor page strictly reads items/nextCursor/hasMore and keeps newest-first microsecond order', () => {
  const result = mapMessagePage({ ...messagePage, items: [message, olderMessage] })
  assert.deepEqual(result.items.map((item) => item.id), [message.id, olderMessage.id]); assert.equal(result.nextCursor, cursor)
  assert.deepEqual(mapMessagePage({ items: [], nextCursor: null, hasMore: false }).items, [])
  for (const page of [{ result: [] }, { items: [], nextCursor: null, hasMore: true }, { items: [], hasMore: false }, { items: [message], nextCursor: '', hasMore: true }]) assert.throws(() => mapMessagePage(page), { status: 502 })
})
test('Older-page merge deduplicates IDs without sorting through millisecond timestamps', () => {
  assert.deepEqual(mergeOlderMessages([message], [message, olderMessage, olderMessage]).map((item) => item.id), [message.id, olderMessage.id])
})
test('Conversation requests use JWT, real result/meta and only supported filters', async () => {
  handler = () => reply(conversationPage())
  const result = await service.getConversations({ page: 2, size: 10, status: 'OPEN', sort: 'ignore' }, viewer)
  assert.equal(result.result[0].unreadCount, 2)
  const query = new URL(calls[0].url, 'http://fixture').searchParams
  assert.equal(query.get('page'), '2'); assert.equal(query.get('status'), 'OPEN'); assert.equal(query.has('sort'), false)
  assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer chat-fixture-token'); assert.equal(calls[0].options.credentials, 'include')
})
test('Conversation detail validates ID and participant instead of reading a cached mock', async () => {
  handler = () => reply(conversation); assert.equal((await service.getConversation(conversationId, viewer)).participants.length, 2)
  handler = () => reply({ ...conversation, id: randomUUID() }); await assert.rejects(service.getConversation(conversationId, viewer), { status: 502 })
})
test('Message pagination uses before/limit, treats cursor as opaque and never uses page number', async () => {
  handler = () => reply(messagePage)
  await service.getMessages(conversationId, { before: 'opaque+cursor/=', limit: 30, page: 99 })
  const query = new URL(calls[0].url, 'http://fixture').searchParams
  assert.equal(query.get('before'), 'opaque+cursor/='); assert.equal(query.get('limit'), '30'); assert.equal(query.has('page'), false)
})
test('TEXT metadata validation rejects blank, SYSTEM, overlong content or attachments', () => {
  const base = { clientMessageId: randomUUID(), messageType: 'TEXT', content: 'Nội dung thật' }
  for (const patch of [{ content: ' ' }, { content: 'x'.repeat(10001) }, { messageType: 'SYSTEM' }, { files: [pngFile()] }]) assert.throws(() => messageRequest({ ...base, ...patch }), { status: 422 })
})
test('IMAGE/FILE validates count, MIME, size and magic bytes before HTTP', async () => {
  const base = { clientMessageId: randomUUID(), messageType: 'IMAGE', content: '' }
  for (const files of [[], [pdfFile()], Array.from({ length: 6 }, pngFile), [new File([], 'empty.png', { type: 'image/png' })], [{ size: 10 * 1024 * 1024 + 1, type: 'image/png' }]]) assert.throws(() => messageRequest({ ...base, files }), { status: 422 })
  await assert.rejects(messageFormData({ ...base, files: [new File(['fake image'], 'fake.png', { type: 'image/png' })] }), { status: 422 })
  assert.equal(calls.length, 0)
})
test('Sending uses multipart metadata JSON/files and does not manually set a boundary or Idempotency-Key', async () => {
  const request = { clientMessageId: randomUUID(), messageType: 'FILE', files: [pngFile(), pdfFile()] }
  handler = () => reply({ ...message, clientMessageId: request.clientMessageId, senderId: customerId, messageType: 'FILE', content: null }, 201)
  assert.equal((await service.sendMessage(conversationId, request)).senderId, customerId)
  const options = calls[0].options
  assert.equal(options.headers.has('Content-Type'), false); assert.equal(options.headers.has('Idempotency-Key'), false)
  assert.deepEqual(JSON.parse(await options.body.get('metadata').text()), { clientMessageId: request.clientMessageId, messageType: 'FILE', content: null })
  assert.equal(options.body.get('metadata').type, 'application/json'); assert.equal(options.body.getAll('files').length, 2)
})
test('Lost send response retries same clientMessageId and identical metadata, never returns a fake message', async () => {
  const request = { clientMessageId: randomUUID(), messageType: 'TEXT', content: 'Tin cần gửi' }
  handler = () => { throw new TypeError('Network offline') }; await assert.rejects(service.sendMessage(conversationId, request), { status: 0 })
  handler = () => reply({ ...message, clientMessageId: request.clientMessageId }, 200)
  await service.sendMessage(conversationId, request)
  assert.equal(await calls[0].options.body.get('metadata').text(), await calls[1].options.body.get('metadata').text())
})
test('Mark-read sends actual throughMessageId and accepts only server-confirmed read timestamp', async () => {
  handler = () => reply({ conversationId, lastReadAt: message.createdAt })
  const result = await service.markRead(conversationId, message.id)
  assert.deepEqual(JSON.parse(calls[0].options.body), { throughMessageId: message.id }); assert.equal(result.lastReadAt, message.createdAt)
  handler = () => reply({ conversationId: randomUUID(), lastReadAt: message.createdAt }); await assert.rejects(service.markRead(conversationId, message.id), { status: 502 })
})
test('Create conversation body uses real cakeRequestId/bakeryId only and does not invent IDs', async () => {
  handler = () => reply(conversation, 201)
  await service.createConversation({ cakeRequestId: conversation.cakeRequestId, bakeryId, customerId: 'must-not-send' }, viewer)
  assert.deepEqual(JSON.parse(calls[0].options.body), { cakeRequestId: conversation.cakeRequestId, bakeryId })
  await assert.rejects(service.createConversation({ cakeRequestId: '#RFQ-demo', bakeryId }, viewer), { status: 400 })
})
for (const status of [400, 401, 403, 404, 409, 422, 500, 503]) test('Chat HTTP ' + status + ' is exposed without empty/mock fallback', async () => {
  handler = () => reply(null, status)
  await assert.rejects(service.getConversations({}, viewer, { retryAuth: false }), { status })
  await assert.rejects(service.getMessages(conversationId, {}, { retryAuth: false }), { status })
})
test('Missing real conversation ID and offline requests cannot become demo chat', async () => {
  await assert.rejects(service.getMessages('#chat-demo'), { status: 400 })
  handler = () => { throw new TypeError('Offline') }
  await assert.rejects(service.getConversations({}, viewer), { status: 0 })
  assert.equal(calls.length, 1)
})
