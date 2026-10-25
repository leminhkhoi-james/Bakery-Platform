import { api } from './apiClient.js'

export const chatService = {
  /**
   * List conversations
   * Calls GET /api/v1/conversations
   */
  async getConversations(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.status) queryParams.set('status', params.status)
    if (params.bakeryId) queryParams.set('bakeryId', params.bakeryId)
    if (params.page) queryParams.set('page', params.page)
    if (params.size) queryParams.set('size', params.size)

    const qs = queryParams.toString()
    try {
      const response = await api.get(`/conversations${qs ? `?${qs}` : ''}`)
      return response?.results || []
    } catch {
      return []
    }
  },

  /**
   * Get messages for conversation
   * Calls GET /api/v1/conversations/{id}/messages
   */
  async getMessages(conversationId, params = {}) {
    const queryParams = new URLSearchParams(params)
    const qs = queryParams.toString()
    try {
      const response = await api.get(`/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`)
      return response?.results || []
    } catch {
      return []
    }
  },

  /**
   * Send message in conversation
   * Calls POST /api/v1/conversations/{id}/messages
   */
  async sendMessage(conversationId, content, attachmentUrls = []) {
    return api.post(`/conversations/${conversationId}/messages`, {
      content,
      attachmentUrls,
    })
  },
}
