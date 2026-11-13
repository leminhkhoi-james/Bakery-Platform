import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { chatService } from '../src/services/chatService.js'
import { createDemoTransport } from '../src/mockData/transport.js'
import { createDemoStore } from '../src/mockData/store.js'
import { chatCustomerLabel, searchConversations, chatErrorText } from '../src/services/chatPresentation.js'
import { conversation, summary, customerId, bakeryId, conversationId } from './fixtures/chat.js'
let vite, Workspace, Thread, AuthContext
const originalFetch = globalThis.fetch
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'owner-chat-state', enforce: 'pre', load(id) {
    const path = id.replaceAll('\\', '/')
    if (path.endsWith('/src/hooks/useCatalogResource.js')) return 'export function useCatalogResource(){return globalThis.__ownerChatResource}'
    if (path.endsWith('/src/hooks/useChatThread.js')) return 'export function useChatThread(){return globalThis.__ownerChatThread}'
  } }] })
  AuthContext = (await vite.ssrLoadModule('/src/context/useAuth.js')).AuthContext
  Workspace = (await vite.ssrLoadModule('/src/components/chat/OwnerChatWorkspace.jsx')).default
  Thread = (await vite.ssrLoadModule('/src/components/chat/ChatThread.jsx')).default
})
after(async () => { globalThis.fetch = originalFetch; await vite?.close(); delete globalThis.__ownerChatResource; delete globalThis.__ownerChatThread })
const user = { id: customerId, roles: ['BAKERY_OWNER'], displayName: 'Chủ tiệm' }
const render = (Component, props) => renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user, roles: user.roles } }, React.createElement(Component, props)))

test('Owner list distinguishes API errors from empty and loading without duplicate introduction', () => {
  for (const status of [0, 401, 403, 500, 503]) {
    globalThis.__ownerChatResource = { status: 'error', error: { status }, reload() {} }
    const html = render(Workspace, { bakeryId, routeSearch: '', onNavigate() {} })
    assert.match(html, /role="alert"/); assert.doesNotMatch(html, /Chưa có hội thoại|Tin nhắn của bạn/)
  }
  globalThis.__ownerChatResource = { status: 'ready', data: { result: [], meta: { pages: 0 } } }
  assert.match(render(Workspace, { bakeryId, routeSearch: '', onNavigate() {} }), /Chưa có hội thoại/)
})

test('Owner list shows supplied name, preview, exact unread count and hides unnecessary pagination', () => {
  globalThis.__ownerChatResource = { status: 'ready', data: { result: [{ ...summary, customerName: 'Khách được cung cấp', unreadCount: 3 }], meta: { pages: 1 } } }
  const html = render(Workspace, { bakeryId, routeSearch: '?bakeryId=' + bakeryId, onNavigate() {} })
  assert.match(html, /Khách được cung cấp/); assert.match(html, /3 tin chưa đọc/)
  assert.doesNotMatch(html, /aria-label="Phân trang"/)
  assert.equal(chatCustomerLabel({ customerName: customerId }), 'Khách hàng')
  assert.equal(searchConversations([{ customerName: 'Mai', lastMessagePreview: 'Bánh cưới' }], 'bánh').length, 1)
  assert.notEqual(chatErrorText({ status: 0 }), chatErrorText({ status: 403 }))
})

test('Compact thread has no composer on closed/error and keeps compose fields only for open participant conversation', () => {
  const base = { status: 'ready', items: [], conversation, mutationBusy: false, refreshing: false, loadingOlder: false, hasMore: false, hasLoadedOlder: false, error: null }
  globalThis.__ownerChatResource = { status: 'ready', data: false }
  const props = { compact: true, conversationId, viewer: { userId: user.id }, onChanged() {}, onBack() {}, onNavigate() {} }
  for (const status of ['OPEN', 'CLOSED', 'ARCHIVED']) {
    globalThis.__ownerChatThread = { state: { ...base, conversation: { ...conversation, status } }, store: {} }
    const html = render(Thread, props)
    assert.equal(html.includes('sc-chat-composer'), status === 'OPEN')
    assert.match(html, /Quay lại danh sách hội thoại/)
  }
  globalThis.__ownerChatThread = { state: { ...base, conversation: null, status: 'error', error: { status: 403 } }, store: {} }
  assert.doesNotMatch(render(Thread, props), /sc-chat-composer/)
})

test('Real bakery conversation empty result is authoritative; connection and permission failures are not mock fallback', async () => {
  const viewer = { userId: customerId, bakeryId, roles: ['BAKERY_OWNER'] }
  let status = 200, calls = 0
  const runtime = createDemoTransport({ getUser: () => user, fetch: async () => { calls++; return Response.json(status === 200 ? { data: { result: [], meta: { page: 1, pageSize: 10, pages: 0, total: 0 } } } : { message: 'denied' }, { status }) } })
  globalThis.fetch = runtime.fetch
  assert.equal((await chatService.getConversations({ bakeryId }, viewer)).meta.total, 0); assert.equal(calls, 1)
  for (status of [401, 403, 500]) await assert.rejects(chatService.getConversations({ bakeryId }, viewer, { retryAuth: false }), { status })
  globalThis.fetch = async () => { throw new TypeError('offline') }
  await assert.rejects(chatService.getConversations({ bakeryId }, viewer), { status: 0 })
})

test('Existing mock conversation sends once, persists message and does not contact backend', async () => {
  const store = createDemoStore(), owner = { id: user.id, roles: ['BAKERY_OWNER'] }; store.bind(owner)
  const chat = store.state.conversations[0], viewer = { userId: owner.id, roles: owner.roles, bakeryId: chat.bakeryId }
  const runtime = createDemoTransport({ store, getUser: () => owner, fetch: async () => { throw new Error('unexpected upstream') } })
  globalThis.fetch = runtime.fetch
  const request = { clientMessageId: crypto.randomUUID(), messageType: 'TEXT', content: 'Kiểm tra tin nhắn', files: [] }
  const first = await chatService.sendMessage(chat.id, request), replay = await chatService.sendMessage(chat.id, request)
  assert.equal(first.id, replay.id)
  assert.equal((await chatService.getMessages(chat.id)).items.filter((row) => row.content === request.content).length, 1)
  assert.ok((await chatService.getConversation(chat.id, viewer)).customerName)
})
