import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { ApiError } from '../src/services/apiClient.js'
import { createChatThread, shouldPollChat } from '../src/services/chatThreadStore.js'
import { viewer, conversationId, conversation, message, olderMessage, messagePage } from './fixtures/chat.js'

const stores = []
afterEach(() => { stores.splice(0).forEach((store) => store.stop()) })
const defer = () => { let resolve; const promise = new Promise((done) => { resolve = done }); return { promise, resolve } }
const flush = () => new Promise((resolve) => setImmediate(resolve))
function fixture(overrides = {}) {
  const calls = []
  const methods = {
    getConversation: async () => structuredClone(conversation),
    getMessages: async (_id, params) => structuredClone(params.before ? { items: [olderMessage], nextCursor: null, hasMore: false } : messagePage),
    sendMessage: async (_id, request) => ({ ...message, clientMessageId: request.clientMessageId }),
    markRead: async () => ({ conversationId, lastReadAt: message.createdAt }),
    deleteMessage: async () => null,
    ...overrides,
  }
  const service = Object.fromEntries(Object.entries(methods).map(([name, method]) => [name, (...args) => { calls.push({ name, args }); return method(...args) }]))
  const store = createChatThread({ conversationId, viewer, service }); stores.push(store)
  return { store, calls }
}
const ready = async (store) => { store.start(); await store.refresh() }

test('Thread authorizes detail first, then loads cursor history; never sends read/message on mount', async () => {
  const { store, calls } = fixture()
  await ready(store)
  assert.deepEqual(calls.map((call) => call.name), ['getConversation', 'getMessages'])
  assert.equal(store.getSnapshot().status, 'ready'); assert.deepEqual(store.getSnapshot().items, [message])
})
test('Older paging sends server nextCursor once, prevents overlap and preserves newest-first order', async () => {
  const pending = defer()
  const { store, calls } = fixture({ getMessages: async (_id, params) => params.before ? pending.promise : messagePage })
  await ready(store)
  const loading = store.loadOlder(); await store.loadOlder()
  assert.equal(calls.filter((call) => call.name === 'getMessages').length, 2)
  assert.equal(calls.at(-1).args[1].before, messagePage.nextCursor)
  pending.resolve({ items: [message, olderMessage], nextCursor: null, hasMore: false }); await loading
  assert.deepEqual(store.getSnapshot().items.map((item) => item.id), [message.id, olderMessage.id]); assert.equal(store.getSnapshot().hasLoadedOlder, true)
})
test('Repeating cursor fails safely and does not keep requesting the same older page', async () => {
  const { store } = fixture({ getMessages: async () => messagePage })
  await ready(store); await store.loadOlder()
  assert.equal(store.getSnapshot().olderError.status, 502); assert.equal(store.getSnapshot().items.length, 1)
})
test('Forced refresh invalidates late older page and resets history window without gaps', async () => {
  const pending = defer()
  const { store } = fixture({ getMessages: async (_id, params) => params.before ? pending.promise : messagePage })
  await ready(store)
  const older = store.loadOlder(); await store.refresh(true)
  pending.resolve({ items: [olderMessage], nextCursor: null, hasMore: false }); await older
  assert.deepEqual(store.getSnapshot().items, [message]); assert.equal(store.getSnapshot().hasLoadedOlder, false)
})
test('Stopped viewer store cannot publish stale data or fetch messages after a late detail response', async () => {
  const pending = defer()
  const { store, calls } = fixture({ getConversation: () => pending.promise })
  store.start(); const loading = store.refresh(); store.stop(); pending.resolve(conversation); await loading
  assert.equal(store.getSnapshot().conversation, null); assert.equal(calls.length, 1)
})
test('StrictMode stop/start starts a fresh authorized load instead of leaving a disposed store', async () => {
  const { store } = fixture()
  store.start(); store.stop(); store.start(); await store.refresh()
  assert.equal(store.getSnapshot().status, 'ready')
})
test('Permission revoked on refresh clears all messages and conversation details', async () => {
  let denied = false
  const { store } = fixture({ getConversation: async () => { if (denied) throw new ApiError('Access revoked', 404); return conversation } })
  await ready(store); denied = true; await store.refresh(true)
  assert.equal(store.getSnapshot().status, 'error'); assert.deepEqual(store.getSnapshot().items, []); assert.equal(store.getSnapshot().conversation, null)
})
test('Permission denied while loading older pages also clears sensitive cached timeline', async () => {
  const { store } = fixture({ getMessages: async (_id, params) => { if (params.before) throw new ApiError('Forbidden', 403); return messagePage } })
  await ready(store); await store.loadOlder()
  assert.equal(store.getSnapshot().error.status, 403); assert.deepEqual(store.getSnapshot().items, [])
})
test('Send waits for server reload and never appends an optimistic/acknowledgement message', async () => {
  const page = defer(); let getCount = 0
  const request = { clientMessageId: randomUUID(), messageType: 'TEXT', content: 'Draft' }
  const serverMessage = { ...message, id: randomUUID(), clientMessageId: request.clientMessageId, content: 'Authoritative GET content' }
  const { store } = fixture({ sendMessage: async () => ({ ...serverMessage, content: 'ACK SHOULD NOT BE APPENDED' }), getMessages: async () => ++getCount === 1 ? messagePage : page.promise })
  await ready(store)
  const sending = store.send(request); await flush()
  assert.deepEqual(store.getSnapshot().items, [message]); assert.equal(store.getSnapshot().mutationBusy, true)
  page.resolve({ items: [serverMessage, message], nextCursor: null, hasMore: false }); await sending
  assert.equal(store.getSnapshot().items[0].content, 'Authoritative GET content'); assert.equal(store.getSnapshot().mutationBusy, false)
})
test('Failed send cannot create a message and closed conversations cannot be sent to', async () => {
  const { store } = fixture({ sendMessage: async () => { throw new ApiError('Offline', 0) } })
  await ready(store); await assert.rejects(store.send({}), { status: 0 }); assert.deepEqual(store.getSnapshot().items, [message])
  const closed = fixture({ getConversation: async () => ({ ...conversation, status: 'CLOSED' }) })
  await ready(closed.store); await assert.rejects(closed.store.send({}), { status: 409 }); assert.equal(closed.calls.some((call) => call.name === 'sendMessage'), false)
})
test('Mark-read uses newest backend message ID and reloads confirmed read state', async () => {
  let readAt = null
  const { store, calls } = fixture({ getConversation: async () => ({ ...conversation, currentUserLastReadAt: readAt }), markRead: async () => { readAt = message.createdAt; return { conversationId, lastReadAt: readAt } } })
  await ready(store); await store.markRead()
  assert.equal(calls.find((call) => call.name === 'markRead').args[1], message.id)
  assert.equal(store.getSnapshot().conversation.currentUserLastReadAt, message.createdAt)
})
test('No backend message means no invented throughMessageId/read POST', async () => {
  const { store, calls } = fixture({ getMessages: async () => ({ items: [], nextCursor: null, hasMore: false }) })
  await ready(store); await assert.rejects(store.markRead(), { status: 400 })
  assert.equal(calls.some((call) => call.name === 'markRead'), false)
})
test('A send conflict re-reads a conversation closed by another participant and prevents further sends', async () => {
  let closed = false
  const { store } = fixture({ getConversation: async () => ({ ...conversation, status: closed ? 'CLOSED' : 'OPEN' }), sendMessage: async () => { closed = true; throw new ApiError('Conversation closed', 409) } })
  await ready(store); await assert.rejects(store.send({}), { status: 409 })
  assert.equal(store.getSnapshot().conversation.status, 'CLOSED')
  assert.deepEqual(store.getSnapshot().items, [message])
  await assert.rejects(store.send({}), { status: 409 })
})
test('Polling only runs for visible, ready, idle latest windows; it pauses while browsing older history', () => {
  const state = { status: 'ready', hasLoadedOlder: false, refreshing: false, loadingOlder: false, mutationBusy: false }
  assert.equal(shouldPollChat(state, true), true); assert.equal(shouldPollChat(state, false), false)
  for (const patch of [{ status: 'error' }, { hasLoadedOlder: true }, { refreshing: true }, { loadingOlder: true }, { mutationBusy: true }]) assert.equal(shouldPollChat({ ...state, ...patch }, true), false)
})

test('Close mutation refreshes conversation from backend and disables sending after confirmed CLOSED', async () => {
  let status = 'OPEN'
  const { store, calls } = fixture({ getConversation: async () => ({ ...conversation, status }), closeConversation: async () => { status = 'CLOSED'; return { ...conversation, status } } })
  await ready(store)
  await store.close('Fixture closure')
  assert.equal(store.getSnapshot().conversation.status, 'CLOSED')
  assert.deepEqual(calls.slice(-3).map((call) => call.name), ['closeConversation', 'getConversation', 'getMessages'])
  await assert.rejects(store.send({}), { status: 409 })
})
test('Close permission failure never pretends CLOSED and clears denied conversation', async () => {
  const { store } = fixture({ closeConversation: async () => { throw new ApiError('Denied fixture', 403) } })
  await ready(store)
  await assert.rejects(store.close('Fixture'), { status: 403 })
  assert.equal(store.getSnapshot().status, 'error'); assert.equal(store.getSnapshot().conversation, null)
})
