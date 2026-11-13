// HTTP integration: real multipart and Vite routing, all writes in an isolated fixture server.
import assert from 'node:assert/strict'
import { before, beforeEach, after, test } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { createServer, loadConfigFromFile } from 'vite'
import { chatService } from '../src/services/chatService.js'
import { setAuthToken } from '../src/services/apiClient.js'
import { createChatThread } from '../src/services/chatThreadStore.js'
import { viewer, customerId, otherUserId, bakeryId, conversationId, conversation, summary, message, olderMessage, pngFile, pdfFile, conversationPage } from './fixtures/chat.js'

let vite, server, origin, fixtureOrigin, calls, messages, byClientId, files, readAt, failure, disconnect
const nativeFetch = globalThis.fetch
const respond = (response, status, data) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ statusCode: status, message: status >= 400 ? 'Fixture chat failure' : 'Success', data })) }
const encode = (item) => Buffer.from(item.createdAt + '|' + item.id).toString('base64url')
async function fixture(request, response) {
  const url = new URL(request.url, fixtureOrigin)
  if (url.pathname.startsWith('/fixture-attachments/')) {
    const file = files.get(url.pathname.split('/').at(-1))
    if (!file) return respond(response, 404, null)
    response.writeHead(200, { 'Content-Type': file.type }); response.end(file.bytes); return
  }
  const chunks = []; for await (const chunk of request) chunks.push(chunk)
  const raw = Buffer.concat(chunks)
  calls.push({ path: url.pathname, query: url.searchParams, method: request.method, headers: request.headers, raw })
  if (disconnect) { request.socket.destroy(); return }
  if (failure) return respond(response, failure, null)
  const token = request.headers.authorization
  if (!['Bearer chat-http-customer', 'Bearer chat-http-owner', 'Bearer chat-http-wrong-member'].includes(token)) return respond(response, 401, null)
  if (token === 'Bearer chat-http-wrong-member') return respond(response, 404, null)
  const actor = token === 'Bearer chat-http-owner' ? otherUserId : customerId
  const base = '/api/v1/conversations'
  if (url.pathname === base && request.method === 'GET') {
    if (url.searchParams.has('bakeryId') && actor === customerId) return respond(response, 403, null)
    return respond(response, 200, conversationPage([{ ...summary, unreadCount: readAt ? 0 : 2 }], { page: Number(url.searchParams.get('page') || 1) }))
  }
  if (!url.pathname.startsWith(base + '/' + conversationId)) return respond(response, 404, null)
  if (url.pathname === base + '/' + conversationId && request.method === 'GET') return respond(response, 200, { ...conversation, currentUserLastReadAt: readAt, participants: conversation.participants.map((participant) => ({ ...participant, lastReadAt: participant.userId === actor ? readAt : participant.lastReadAt })) })
  if (url.pathname.endsWith('/messages') && request.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') || 30)
    const before = url.searchParams.get('before')
    let offset = 0
    if (before) {
      const id = Buffer.from(before, 'base64url').toString().split('|')[1]
      const index = messages.findIndex((item) => item.id === id)
      if (index < 0) return respond(response, 400, null)
      offset = index + 1
    }
    const items = messages.slice(offset, offset + limit), hasMore = messages.length > offset + limit
    return respond(response, 200, { items, nextCursor: hasMore ? encode(items.at(-1)) : null, hasMore })
  }
  if (url.pathname.endsWith('/messages') && request.method === 'POST') {
    const body = await new Request(url, { method: 'POST', headers: request.headers, body: raw, duplex: 'half' }).formData()
    const metadata = JSON.parse(await body.get('metadata').text())
    const attached = await Promise.all(body.getAll('files').map(async (file) => ({ name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) })))
    const fingerprint = JSON.stringify([metadata.messageType, metadata.content, attached.map((file) => [file.name, file.type, file.bytes.toString('base64')])])
    const previous = byClientId.get(metadata.clientMessageId)
    if (previous) return respond(response, previous.fingerprint === fingerprint ? 200 : 409, previous.fingerprint === fingerprint ? previous.message : null)
    const attachments = attached.map((file) => { const id = randomUUID(); files.set(id, file); return { id, originalFileName: file.name, mediaType: file.type, fileSize: file.bytes.length, url: fixtureOrigin + '/fixture-attachments/' + id } })
    const created = { id: randomUUID(), clientMessageId: metadata.clientMessageId, senderId: actor, messageType: metadata.messageType, content: metadata.content, createdAt: '2026-10-26T01:02:04Z', editedAt: null, deleted: false, attachments }
    byClientId.set(metadata.clientMessageId, { fingerprint, message: created }); messages.unshift(created)
    return respond(response, 201, created)
  }
  if (url.pathname.endsWith('/read') && request.method === 'POST') {
    const metadata = JSON.parse(raw.toString())
    const through = messages.find((item) => item.id === metadata.throughMessageId)
    if (!through) return respond(response, 404, null)
    readAt = through.createdAt
    return respond(response, 200, { conversationId, lastReadAt: readAt })
  }
  if (url.pathname.includes('/messages/') && request.method === 'DELETE') {
    const item = messages.find((item) => item.id === url.pathname.split('/').at(-1))
    if (!item) return respond(response, 404, null)
    if (item.senderId !== actor) return respond(response, 403, null)
    Object.assign(item, { deleted: true, content: null, attachments: [] }); response.writeHead(204); response.end(); return
  }
  return respond(response, 404, null)
}
before(async () => {
  server = createHttpServer((request, response) => { void fixture(request, response).catch(() => respond(response, 500, null)) })
  server.listen(0, '127.0.0.1'); await once(server, 'listening'); fixtureOrigin = 'http://127.0.0.1:' + server.address().port
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' })
  const proxy = Object.fromEntries(Object.entries(loaded.config.server.proxy).map(([pattern, options]) => [pattern, pattern.includes('conversations') ? { ...options, target: fixtureOrigin } : options]))
  vite = await createServer({ ...loaded.config, configFile: false, logLevel: 'silent', server: { ...loaded.config.server, host: '127.0.0.1', port: 0, strictPort: false, hmr: false, ws: false, proxy } })
  await vite.listen(); origin = 'http://127.0.0.1:' + vite.httpServer.address().port
  globalThis.fetch = (url, options) => nativeFetch(new URL(url, origin), options)
})
beforeEach(() => { calls = []; messages = structuredClone([message, olderMessage]); byClientId = new Map(); files = new Map(); readAt = null; failure = null; disconnect = false; setAuthToken('chat-http-customer') })
after(async () => { globalThis.fetch = nativeFetch; setAuthToken(null); await vite?.close(); server?.closeAllConnections(); if (server) await new Promise((resolve) => server.close(resolve)) })

test('Conversation list/detail cross the actual Chat Vite proxy with Bearer JWT and pagination', async () => {
  const page = await chatService.getConversations({ page: 2, size: 10, status: 'OPEN' }, viewer)
  assert.equal(page.meta.page, 2); assert.equal(page.result[0].id, conversationId)
  assert.equal((await chatService.getConversation(conversationId, viewer)).participants.length, 2)
  assert.equal(calls[0].headers.authorization, 'Bearer chat-http-customer'); assert.equal(calls[0].query.get('status'), 'OPEN')
})
test('Newest-first cursor history loads actual items/nextCursor/hasMore then older page', async () => {
  const first = await chatService.getMessages(conversationId, { limit: 1 })
  assert.equal(first.items[0].id, message.id); assert.equal(first.hasMore, true)
  const older = await chatService.getMessages(conversationId, { limit: 1, before: first.nextCursor })
  assert.equal(older.items[0].id, olderMessage.id); assert.equal(older.hasMore, false); assert.equal(older.nextCursor, null)
  assert.equal(calls[1].query.get('before'), first.nextCursor)
})
test('Empty HTTP message list remains empty', async () => {
  messages = []
  assert.deepEqual(await chatService.getMessages(conversationId), { items: [], nextCursor: null, hasMore: false })
})
test('TEXT multipart metadata is parsed by HTTP server; resend same client ID is idempotent and changed payload is 409', async () => {
  const request = { clientMessageId: randomUUID(), messageType: 'TEXT', content: 'Tin nhắn fixture qua HTTP' }
  const first = await chatService.sendMessage(conversationId, request), replay = await chatService.sendMessage(conversationId, request)
  assert.equal(first.id, replay.id); assert.equal(byClientId.size, 1); assert.equal(messages.length, 3)
  await assert.rejects(chatService.sendMessage(conversationId, { ...request, content: 'Khác payload' }), { status: 409 })
  assert.match(calls[0].headers['content-type'], /multipart\/form-data; boundary=/)
})
test('IMAGE/PDF files cross multipart byte-for-byte and download using the attachment URL returned by fixture', async () => {
  const file = pngFile()
  const image = await chatService.sendMessage(conversationId, { clientMessageId: randomUUID(), messageType: 'IMAGE', content: 'Ảnh fixture', files: [file] })
  assert.equal(image.attachments[0].originalFileName, file.name); assert.equal(image.attachments[0].mediaType, 'image/png')
  const downloaded = await nativeFetch(image.attachments[0].url)
  assert.equal(downloaded.headers.get('content-type'), 'image/png'); assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), Buffer.from(await file.arrayBuffer()))
  const pdf = await chatService.sendMessage(conversationId, { clientMessageId: randomUUID(), messageType: 'FILE', content: '', files: [pdfFile()] })
  assert.equal(pdf.attachments[0].mediaType, 'application/pdf')
})
test('Read request advances only server read timestamps and reloaded unread count, no fake status', async () => {
  assert.equal((await chatService.getConversation(conversationId, viewer)).currentUserLastReadAt, null)
  await chatService.markRead(conversationId, message.id)
  const fresh = await chatService.getConversation(conversationId, viewer)
  assert.equal(fresh.currentUserLastReadAt, message.createdAt)
  assert.equal((await chatService.getConversations({}, viewer)).result[0].unreadCount, 0)
  await assert.rejects(chatService.markRead(conversationId, randomUUID()), { status: 404 })
})
test('Sender can delete own message while another sender message stays protected', async () => {
  await assert.rejects(chatService.deleteMessage(conversationId, message.id), { status: 403 })
  const own = await chatService.sendMessage(conversationId, { clientMessageId: randomUUID(), messageType: 'TEXT', content: 'Có thể xóa' })
  await chatService.deleteMessage(conversationId, own.id)
  const fresh = await chatService.getMessages(conversationId)
  assert.equal(fresh.items[0].deleted, true); assert.equal(fresh.items[0].content, null)
})
test('Customer cannot filter bakery; wrong member or another conversation is concealed by 404', async () => {
  await assert.rejects(chatService.getConversations({ bakeryId }, viewer), { status: 403 })
  await assert.rejects(chatService.getConversation(randomUUID(), viewer), { status: 404 })
  setAuthToken('chat-http-wrong-member')
  await assert.rejects(chatService.getMessages(conversationId), { status: 404 })
})
test('Valid Vendor membership fixture can list bakery conversations and read authorized detail', async () => {
  setAuthToken('chat-http-owner')
  const vendor = { userId: otherUserId, roles: ['BAKERY_OWNER'], bakeryId }
  assert.equal((await chatService.getConversations({ bakeryId }, vendor)).result.length, 1)
  assert.equal((await chatService.getConversation(conversationId, vendor)).id, conversationId)
})
test('Chat store posts a message then reads detail/history through HTTP instead of appending acknowledgement', async () => {
  const store = createChatThread({ conversationId, viewer })
  try {
    store.start(); await store.refresh()
    const id = randomUUID(); await store.send({ clientMessageId: id, messageType: 'TEXT', content: 'Đồng bộ qua GET' })
    assert.equal(store.getSnapshot().items[0].clientMessageId, id)
    assert.deepEqual(calls.slice(-3).map((call) => [call.method, call.path.split('/').at(-1)]), [['POST', 'messages'], ['GET', conversationId], ['GET', 'messages']])
  } finally { store.stop() }
})
for (const status of [400, 401, 403, 404, 409, 500, 503]) test('Real HTTP Chat error ' + status + ' does not become an empty successful inbox', async () => {
  failure = status
  await assert.rejects(chatService.getConversations({}, viewer, { retryAuth: false }), { status })
  await assert.rejects(chatService.getMessages(conversationId, {}, { retryAuth: false }), { status })
})
test('Upstream socket loss is reported as a proxy error, not a fake conversation/message', async () => {
  disconnect = true
  await assert.rejects(chatService.getConversations({}, viewer), (error) => error.status >= 500 || error.status === 0)
  assert.equal(messages.length, 2)
})
