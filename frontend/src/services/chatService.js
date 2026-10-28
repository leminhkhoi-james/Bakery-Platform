import { api, ApiError } from './apiClient.js'
import { catalogQuery } from './catalogModels.js'
import { requireId } from './managementModels.js'
import { assertChatAccess, mapConversation, mapConversationPage, mapMessage, mapMessagePage, messageFormData } from './chatModels.js'

const path = (id) => '/conversations/' + requireId(id, 'Hội thoại')
export const chatService = {
  async getConversations(params, viewer, options = {}) {
    const query = { ...params }
    if (query.bakeryId) query.bakeryId = requireId(query.bakeryId, 'Cửa hàng')
    return mapConversationPage(await api.get('/conversations' + catalogQuery(query, ['status', 'bakeryId', 'page', 'size']), options), viewer)
  },
  async getConversation(conversationId, viewer, options = {}) {
    const id = requireId(conversationId)
    const conversation = assertChatAccess(mapConversation(await api.get(path(id), options), true), viewer)
    if (conversation.id !== id) throw new ApiError('Conversation trả về sai ID.', 502)
    return conversation
  },
  async getMessages(conversationId, params = {}, options = {}) {
    return mapMessagePage(await api.get(path(conversationId) + '/messages' + catalogQuery(params, ['before', 'limit']), options))
  },
  async sendMessage(conversationId, request, options = {}) {
    const body = await messageFormData(request)
    const response = mapMessage(await api.post(path(conversationId) + '/messages', body, options))
    if (response.clientMessageId !== request.clientMessageId.toLowerCase()) throw new ApiError('Message trả về sai clientMessageId.', 502)
    return response
  },
  async markRead(conversationId, throughMessageId) {
    const id = requireId(conversationId)
    const data = await api.post(path(id) + '/read', { throughMessageId: requireId(throughMessageId, 'Tin nhắn') })
    if (data?.conversationId !== id || typeof data.lastReadAt !== 'string' || !Number.isFinite(Date.parse(data.lastReadAt))) throw new ApiError('Read response không hợp lệ.', 502)
    return { conversationId: data.conversationId, lastReadAt: data.lastReadAt }
  },
  async createConversation({ cakeRequestId, bakeryId }, viewer) {
    const request = { cakeRequestId: requireId(cakeRequestId, 'Cake request'), bakeryId: requireId(bakeryId, 'Cửa hàng') }
    return assertChatAccess(mapConversation(await api.post('/conversations', request), true), viewer)
  },
  async closeConversation(conversationId, reason = '') {
    if (typeof reason !== 'string' || reason.length > 500) throw new ApiError('Lý do đóng hội thoại tối đa 500 ký tự.', 400)
    const conversation = mapConversation(await api.post(path(conversationId) + '/close', { reason }), true)
    if (conversation.id !== conversationId.toLowerCase() || conversation.status !== 'CLOSED') throw new ApiError('Backend chưa xác nhận đóng hội thoại.', 502)
    return conversation
  },
  deleteMessage(conversationId, messageId) { return api.delete(path(conversationId) + '/messages/' + requireId(messageId, 'Tin nhắn')) },
}

export const loadConversations = ({ viewer, ...params }, options) => chatService.getConversations(params, viewer, options)
