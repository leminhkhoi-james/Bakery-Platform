import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { randomUUID } from 'node:crypto'
import { mapConversation, mapMessage } from '../src/services/chatModels.js'
import { customerId, conversationId, bakeryId, conversation, message, olderMessage, summary, conversationPage } from './fixtures/chat.js'

let vite, AuthContext, ChatMessages, ChatReadStatus, ConversationList, Composer, EntryModal, CustomerPage, VendorPage
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } })
  ;({ AuthContext } = await vite.ssrLoadModule('/src/context/useAuth.js'))
  ;({ ChatMessages, ChatReadStatus } = await vite.ssrLoadModule('/src/components/chat/ChatMessages.jsx'))
  ;({ default: ConversationList } = await vite.ssrLoadModule('/src/components/chat/ConversationList.jsx'))
  ;({ default: Composer } = await vite.ssrLoadModule('/src/components/chat/MessageComposer.jsx'))
  ;({ default: EntryModal } = await vite.ssrLoadModule('/src/components/chat/ChatEntryModal.jsx'))
  ;({ CustomerChatPage: CustomerPage, VendorChatPage: VendorPage } = await vite.ssrLoadModule('/src/pages/chat/ChatPage.jsx'))
})
after(async () => { await vite?.close() })
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
const user = { id: customerId, displayName: 'Tài khoản thật', roles: ['CUSTOMER'] }
const withUser = (Component, props, roles = ['CUSTOMER']) => renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user: { ...user, roles }, roles } }, React.createElement(Component, props)))

test('Message UI reverses newest-first pages into reading order without changing sender/content/time', () => {
  const html = render(ChatMessages, { items: [mapMessage(message), mapMessage(olderMessage)], conversation, user })
  assert.ok(html.indexOf('Tin cũ hơn') < html.indexOf('Nội dung backend mới nhất'))
  assert.ok(!html.includes(message.senderId)); assert.match(html, /Chủ tiệm/)
  assert.doesNotMatch(html, /Chef Jean|Trực tuyến|Đã xem|Đang nhập|10:05/)
})
test('Empty history displays no sample messages', () => {
  const html = render(ChatMessages, { items: [], conversation, user })
  assert.match(html, /chưa có tin nhắn/); assert.doesNotMatch(html, /Chào bạn|Pikachu|Jean-Luc/)
})
test('Own messages show a readable sender and deletion only for own undeleted message', () => {
  const html = render(ChatMessages, { items: [mapMessage({ ...message, senderId: customerId })], conversation, user, onDelete: () => {} })
  assert.match(html, /Bạn/); assert.match(html, /Xóa tin nhắn của tôi/)
  assert.doesNotMatch(render(ChatMessages, { items: [mapMessage(message)], conversation, user, onDelete: () => {} }), /Xóa tin nhắn của tôi/)
})
test('Tombstones do not render deleted message content or attachment URLs', () => {
  const item = mapMessage({ ...message, content: 'SHOULD_STAY_HIDDEN', deleted: true, attachments: [{ id: randomUUID(), url: 'https://fixture.invalid/secret' }] })
  const html = render(ChatMessages, { items: [item], conversation, user })
  assert.match(html, /đã được xóa/); assert.doesNotMatch(html, /SHOULD_STAY_HIDDEN|fixture.invalid/)
})
test('Attachment UI uses only DTO filename/type/size and valid backend URL', () => {
  const item = mapMessage({ ...message, messageType: 'FILE', attachments: [{ id: randomUUID(), originalFileName: 'chung-tu.pdf', mediaType: 'application/pdf', fileSize: 12, url: 'https://fixture.invalid/attachment' }] })
  const html = render(ChatMessages, { items: [item], conversation, user })
  assert.match(html, /chung-tu.pdf/); assert.match(html, /12 byte/); assert.match(html, /href="https:\/\/fixture.invalid\/attachment"/)
  const unsafe = mapMessage({ ...message, attachments: [{ id: randomUUID(), url: 'javascript:alert(1)' }] })
  assert.doesNotMatch(render(ChatMessages, { items: [unsafe], conversation, user }), /href="javascript/)
})
test('Read UI displays only server timestamps and never invents per-message seen/online flags', () => {
  const html = render(ChatReadStatus, { conversation: mapConversation(conversation, true), userId: customerId })
  assert.match(html, /Chưa có mốc đọc/); assert.match(html, /Mốc đọc của hội thoại/)
  assert.doesNotMatch(html, /Đã xem|Trực tuyến|Vừa đọc/)
})
test('Conversation list renders empty, loading and errors without fake unread badges', () => {
  const empty = render(ConversationList, { resource: { status: 'ready', data: conversationPage([]) }, onPage: () => {} })
  assert.match(empty, /Chưa có hội thoại/); assert.doesNotMatch(empty, /Chưa đọc: [1-9]/)
  assert.match(render(ConversationList, { resource: { status: 'loading' } }), /Đang tải/)
  for (const status of [400, 401, 403, 404, 409, 500, 0]) {
    const html = render(ConversationList, { resource: { status: 'error', error: { status, message: 'API failed' }, reload: () => {} } })
    assert.match(html, /role="alert"/); assert.match(html, status >= 500 || status === 0 ? /Kết nối đang gián đoạn/ : /Chưa thể thực hiện thao tác/); assert.doesNotMatch(html, /Nội dung từ backend/)
  }
})
test('List shows exact backend unreadCount including zero, and no default when missing', () => {
  const props = { resource: { status: 'ready', data: conversationPage([{ ...summary, unreadCount: 0 }]) }, onPage: () => {} }
  assert.match(render(ConversationList, props), /Chưa đọc: 0/)
  props.resource.data.result[0].unreadCount = null
  assert.match(render(ConversationList, props), /Chưa có số tin chưa đọc/)
})
test('Composer has actual TEXT/IMAGE/FILE contract, limits and locked sending/closed states', () => {
  const html = render(Composer, { disabled: true })
  assert.match(html, /maxLength="10000"/i); assert.match(html, /1–5 tệp/); assert.match(html, /10 MiB/)
  assert.match(html, /value="IMAGE"/); assert.doesNotMatch(html, /value="SYSTEM"|attachmentUrls/); assert.match(html, /disabled=""/)
})
test('Legacy Chat entry explicitly blocks missing Marketplace context and opens the real inbox', () => {
  const html = render(EntryModal, { onClose: () => {}, onNavigate: () => {} })
  assert.match(html, /role="dialog"/); assert.match(html, /yêu cầu bánh/); assert.match(html, /Mở hộp thư/)
  assert.doesNotMatch(html, /Chef Jean|Đã xem|Trực tuyến|10:05|Pikachu/)
  let route
  const tree = EntryModal({ vendor: true, onClose: () => {}, onNavigate: (value) => { route = value } })
  tree.props.children({ requestClose: () => true }).props.children.at(-1).props.onClick()
  assert.equal(route, 'vendor-chat')
  route = null
  tree.props.children({ requestClose: () => false }).props.children.at(-1).props.onClick()
  assert.equal(route, null, 'blocked close cannot navigate behind the modal')
})
test('Customer and Vendor chat pages use protected identity and real loading states without demo data', () => {
  const customer = withUser(CustomerPage, { routeSearch: '?conversationId=' + conversationId, onNavigate: () => {} })
  assert.match(customer, /Đang tải/); assert.match(customer, /yêu cầu bánh/); assert.match(customer, /Bấm Tải mới nhất/)
  const vendor = withUser(VendorPage, { routeSearch: '?bakeryId=' + bakeryId, onNavigate: () => {} }, ['BAKERY_OWNER'])
  assert.match(vendor, /Tài khoản thật/); assert.match(vendor, /các hội thoại thuộc tiệm đã chọn/)
  for (const html of [customer, vendor]) assert.doesNotMatch(html, /46\.7M|15 đơn|Chef Jean|Chào bạn Hân/)
})
test('Invalid conversation URL cannot mount a timeline or silently invent a conversationId', () => {
  const html = withUser(CustomerPage, { routeSearch: '?conversationId=RFQ-DEMO', onNavigate: () => {} })
  assert.match(html, /Mã cuộc trò chuyện không hợp lệ/); assert.doesNotMatch(html, /Gửi tin nhắn|clientMessageId/)
})
