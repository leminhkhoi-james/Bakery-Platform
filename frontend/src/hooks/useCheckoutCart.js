import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth.js'

const prefix = 'sweetcake.checkout-cart.v1:'
function read(key) {
  try { const saved = JSON.parse(sessionStorage.getItem(prefix + key) || '{}'); return { key, items: Array.isArray(saved.items) ? saved.items : [], selected: Array.isArray(saved.selected) ? saved.selected : [] } }
  catch { return { key, items: [], selected: [] } }
}
export function useCheckoutCart() {
  const { user, status } = useAuth()
  const [state, setState] = useState(() => read('guest'))
  const key = status === 'loading' ? state.key : user?.id || 'guest'
  useEffect(() => {
    if (state.key === key) return
    const next = read(key)
    if (state.key === 'guest' && user?.roles?.includes('CUSTOMER')) {
      const guestIds = new Set(state.items.map(item => item.id))
      next.items = [...state.items, ...next.items.filter(row => !guestIds.has(row.id))]
      if (state.items.length) next.selected = state.selected
      // Guest cart has been handed to this account; other accounts remain untouched.
      try { sessionStorage.setItem(prefix + 'guest', JSON.stringify({ items: [], selected: [] })) } catch { /* In-memory cart remains usable. */ }
    }
    setState(next)
  }, [key, state, user])
  useEffect(() => {
    if (state.key !== key) return
    try {
      const items = state.items.map(item => ({ ...item, image: typeof item.image === 'string' && !item.image.startsWith('data:') ? item.image : undefined, images: undefined, photos: undefined, optionGroups: undefined }))
      sessionStorage.setItem(prefix + key, JSON.stringify({ items, selected: state.selected }))
    } catch (error) { console.warn('Unable to persist checkout cart', error) }
  }, [key, state])
  const setItems = change => setState(current => ({ ...current, items: typeof change === 'function' ? change(current.items) : change }))
  const setSelected = change => setState(current => ({ ...current, selected: typeof change === 'function' ? change(current.selected) : change }))
  return { cartItems: state.key === key ? state.items : [], setCartItems: setItems, selectedCartIds: state.key === key ? state.selected : [], setSelectedCartIds: setSelected }
}
