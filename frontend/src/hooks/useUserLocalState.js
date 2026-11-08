import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { browserUserData, userDataKey } from '../services/userLocalData.js'

export function useUserLocalState(feature) {
  const { user } = useAuth(), userId = user?.id || null
  const restore = useCallback(() => {
    try { return { userId, value: userId ? browserUserData().read(userId, feature, []) : [], error: null, dirty: false } }
    catch (error) { return { userId, value: [], error, dirty: false } }
  }, [userId, feature])
  const [state, setState] = useState(restore)
  if (state.userId !== userId) setState(restore())
  const current = state.userId === userId ? state : { value: [], error: null }
  useEffect(() => {
    if (!userId || state.userId !== userId || !state.dirty || state.error) return
    try { browserUserData().write(userId, feature, state.value) }
    catch (error) { setState(value => value.userId === userId ? { ...value, error, dirty: false } : value) }
  }, [state, userId, feature])
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return
    const sync = event => { if (event.key === userDataKey(userId, feature)) setState(restore()) }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [userId, feature, restore])
  const update = useCallback(next => setState(value => {
    if (value.userId !== userId || value.error) return value
    const updated = typeof next === 'function' ? next(value.value) : next
    return Object.is(updated, value.value) ? value : { ...value, value: updated, dirty: true }
  }), [userId])
  return [current.value, update, current.error]
}
