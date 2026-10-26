import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { createChatThread, shouldPollChat } from '../services/chatThreadStore.js'

export function useChatThread(conversationId, viewer, autoRefresh, onRefreshed) {
  const key = JSON.stringify({ conversationId, viewer })
  const store = useMemo(() => createChatThread(JSON.parse(key)), [key])
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  useEffect(() => { store.start(); return () => store.stop() }, [store])
  useEffect(() => {
    if (!autoRefresh) return
    let stopped = false, timer
    const tick = async () => {
      if (shouldPollChat(store.getSnapshot(), !document.hidden) && await store.refresh()) onRefreshed?.()
      if (!stopped) timer = setTimeout(tick, 15000)
    }
    timer = setTimeout(tick, 15000)
    return () => { stopped = true; clearTimeout(timer) }
  }, [store, autoRefresh, onRefreshed])
  return { state, store }
}
