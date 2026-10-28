import { ApiError } from './apiClient.js'
import { chatService } from './chatService.js'
import { mergeOlderMessages } from './chatModels.js'

const initial = () => ({ status: 'loading', conversation: null, items: [], nextCursor: null, hasMore: false, hasLoadedOlder: false, refreshing: false, loadingOlder: false, mutationBusy: false, error: null, olderError: null })
const denied = (error) => [401, 403, 404].includes(error?.status)
export const shouldPollChat = (state, visible) => visible && state.status === 'ready' && !state.hasLoadedOlder && !state.refreshing && !state.loadingOlder && !state.mutationBusy

// A store belongs to one authenticated viewer/conversation. No localStorage or optimistic messages.
export function createChatThread({ conversationId, viewer, service = chatService }) {
  let state = initial(), active = false, epoch = 0, refreshPromise = null, mainAbort, olderAbort
  const listeners = new Set()
  const publish = (patch) => { state = { ...state, ...patch }; listeners.forEach((listener) => listener()) }
  const clear = (error) => publish({ ...initial(), status: 'error', error })
  const store = {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    getSnapshot() { return state },
    start() { active = true; void store.refresh(true) },
    stop() { active = false; epoch += 1; mainAbort?.abort(); olderAbort?.abort(); refreshPromise = null },
    refresh(force = false) {
      if (!active) return Promise.resolve(false)
      if (refreshPromise && !force) return refreshPromise
      const ticket = ++epoch
      mainAbort?.abort(); olderAbort?.abort()
      const controller = new AbortController(); mainAbort = controller
      publish({ refreshing: true, loadingOlder: false, olderError: null })
      const task = (async () => {
        try {
          const conversation = await service.getConversation(conversationId, viewer, { signal: controller.signal })
          if (!active || epoch !== ticket || controller.signal.aborted) return false
          const page = await service.getMessages(conversationId, { limit: 30 }, { signal: controller.signal })
          if (!active || epoch !== ticket) return false
          publish({ status: 'ready', conversation, items: page.items, nextCursor: page.nextCursor, hasMore: page.hasMore, hasLoadedOlder: false, error: null })
          return true
        } catch (error) {
          if (active && epoch === ticket && !controller.signal.aborted) clear(error)
          return false
        } finally { if (active && epoch === ticket) publish({ refreshing: false }) }
      })()
      refreshPromise = task
      void task.finally(() => { if (refreshPromise === task) refreshPromise = null })
      return task
    },
    async loadOlder() {
      if (!active || state.status !== 'ready' || !state.hasMore || state.loadingOlder || state.refreshing || state.mutationBusy) return
      const ticket = epoch, cursor = state.nextCursor, controller = new AbortController()
      olderAbort = controller; publish({ loadingOlder: true, olderError: null })
      try {
        const page = await service.getMessages(conversationId, { limit: 30, before: cursor }, { signal: controller.signal })
        if (!active || epoch !== ticket) return
        if (page.hasMore && page.nextCursor === cursor) throw new ApiError('Cursor không tiến tới trang cũ hơn.', 502)
        publish({ items: mergeOlderMessages(state.items, page.items), nextCursor: page.nextCursor, hasMore: page.hasMore, hasLoadedOlder: true })
      } catch (error) {
        if (active && epoch === ticket && !controller.signal.aborted) {
          if (denied(error)) clear(error)
          else publish({ olderError: error })
        }
      } finally { if (active && epoch === ticket) publish({ loadingOlder: false }) }
    },
    async mutate(action) {
      if (!active || state.status !== 'ready' || state.mutationBusy || state.refreshing || state.loadingOlder) throw new ApiError('Hội thoại đang tải hoặc xử lý yêu cầu khác.', 409)
      publish({ mutationBusy: true })
      try { const response = await action(); if (active) await store.refresh(true); return response }
      catch (error) {
        if (active && denied(error)) clear(error)
        else if (active && error.status === 409) await store.refresh(true)
        throw error
      }
      finally { if (active) publish({ mutationBusy: false }) }
    },
    send(request) {
      if (state.conversation?.status !== 'OPEN') return Promise.reject(new ApiError('Chỉ được gửi vào hội thoại OPEN.', 409))
      return store.mutate(() => service.sendMessage(conversationId, request))
    },
    markRead() {
      const through = state.items[0]?.id
      if (!through) return Promise.reject(new ApiError('Không có tin nhắn từ backend để đánh dấu đã đọc.', 400))
      return store.mutate(() => service.markRead(conversationId, through))
    },
    deleteMessage(messageId) {
      const message = state.items.find((item) => item.id === messageId)
      if (!message || message.senderId !== viewer.userId) return Promise.reject(new ApiError('Chỉ được xóa tin nhắn của chính bạn.', 403))
      return store.mutate(() => service.deleteMessage(conversationId, messageId))
    },
    close(reason) {
      if (state.conversation?.status !== 'OPEN') return Promise.reject(new ApiError('Chỉ đóng hội thoại OPEN.', 409))
      return store.mutate(() => service.closeConversation(conversationId, reason))
    },
  }
  return store
}
