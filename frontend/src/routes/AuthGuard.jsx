import { userFeedback } from '../services/uiLabels.js'
import { useEffect, useRef } from 'react'
import { useAuth } from '../context/useAuth.js'
import { canAccess, requiredRoles } from './routeAccess.js'
import { sessionIdentity, sessionRedirect } from './sessionNavigation.js'

export default function AuthGuard({ page, onNavigate, children }) {
  const { user, status, error, restoreSession } = useAuth()
  const protectedPage = requiredRoles(page) !== null
  const previous = useRef({})
  const redirect = useRef('')
  useEffect(() => {
    const target = sessionRedirect({ page, status, user }, previous.current)
    if (status !== 'loading' && status !== 'error') previous.current = { status, identity: sessionIdentity(user) }
    const key = target ? `${sessionIdentity(user)}:${page}:${target}` : ''
    if (key && redirect.current !== key) {
      redirect.current = key
      onNavigate(target, null, { replace: true })
    } else if (!target) redirect.current = ''
  }, [page, status, user, onNavigate])

  if (page === 'login' && status === 'authenticated') return null
  if (!protectedPage) return children
  if (status === 'loading') return <p role="status" className="p-8 text-center text-primary">Đang khôi phục phiên đăng nhập…</p>
  if (status === 'anonymous') return null
  if (status === 'error') return (
    <div role="alert" className="p-8 text-center text-error">
      <p>{userFeedback(error)}</p>
      <button onClick={restoreSession} className="mt-4 rounded-lg bg-primary px-6 py-3 text-on-primary">Thử lại</button>
    </div>
  )
  if (!canAccess(page, user)) return (
    <div role="alert" className="p-8 text-center text-primary">
      <p>Bạn không có quyền truy cập trang này.</p>
      <button onClick={() => onNavigate('home')} className="mt-4 rounded-lg bg-primary px-6 py-3 text-on-primary">Về trang chủ</button>
    </div>
  )
  return children
}
