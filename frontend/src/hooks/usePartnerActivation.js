import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { onboardingService } from '../services/onboardingService.js'
import { subscriptionService } from '../services/subscriptionService.js'

// Approval is performed by the backend. This hook only observes it and refreshes the session.
export function usePartnerActivation({ bakeryId, enabled, paused = false, onActivated }) {
  const { user } = useAuth()
  const [state, setState] = useState({ bakery: null, subscription: null, checkedAt: null, checking: false, error: null })
  const [revision, setRevision] = useState(0)
  const onReady = useRef(onActivated)
  useEffect(() => { onReady.current = onActivated }, [onActivated])
  const check = useCallback(() => {
    setState(previous => ({ ...previous, checking: true, error: null }))
    setRevision(value => value + 1)
  }, [])
  const userId = user?.id

  useEffect(() => {
    if (!enabled || !bakeryId || !userId || paused) return
    let cancelled = false, timer, requested = revision > 0
    const controller = new AbortController()
    async function poll() {
      if (cancelled) return
      if (document.hidden && !requested) { timer = setTimeout(poll, 5000); return }
      const manual = requested
      requested = false
      setState(previous => ({ ...previous, checking: manual }))
      try {
        const options = { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) }
        const [bakery, subscription] = await Promise.all([
          onboardingService.get(null, options),
          subscriptionService.getBakerySubscription(bakeryId, options),
        ])
        if (cancelled) return
        if (bakery?.id !== bakeryId) throw new Error('Hồ sơ tiệm đã thay đổi. Vui lòng mở lại trang đăng ký.')
        const checkedAt = Date.now()
        setState({ bakery, subscription, checkedAt, checking: manual, error: null })
        const planActive = subscription?.currentSubscription?.status === 'ACTIVE'
        let activated = null
        if (bakery.status === 'ACTIVE' && planActive) {
          try {
            activated = await onboardingService.complete(bakeryId)
          } catch {
            activated = await onboardingService.syncOwner(userId, options)
          }
        } else if (bakery.status === 'ACTIVE') {
          activated = await onboardingService.syncOwner(userId, options)
        }
        if (!cancelled && activated) {
          setState({ bakery, subscription, checkedAt, checking: false, error: null })
          onReady.current?.(bakery)
          return
        }
        if (!cancelled) setState({ bakery, subscription, checkedAt, checking: false, error: null })
      } catch (error) {
        if (!cancelled) setState(previous => ({ ...previous, checking: false, error }))
        if ([401, 403].includes(error.status)) return
      }
      if (!cancelled) timer = setTimeout(poll, 5000)
    }
    void poll()
    return () => { cancelled = true; controller.abort(); clearTimeout(timer) }
  }, [enabled, bakeryId, userId, paused, revision])

  const matching = state.bakery?.id === bakeryId
  return { ...state, bakery: matching ? state.bakery : null, subscription: matching ? state.subscription : null, checkedAt: matching ? state.checkedAt : null, check }
}
