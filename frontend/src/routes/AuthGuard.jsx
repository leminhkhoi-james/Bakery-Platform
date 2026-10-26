import { useEffect } from 'react'
import { useAuth } from '../context/useAuth.js'
import { canAccess, requiredRoles } from './routeAccess.js'

export default function AuthGuard({ page, onNavigate, children }) {
  const { user, status, error, restoreSession } = useAuth()
  const protectedPage = requiredRoles(page) !== null
  useEffect(() => {
    if (protectedPage && status === 'anonymous') onNavigate('login')
    if (page === 'login' && status === 'authenticated') onNavigate('profile')
  }, [page, protectedPage, status, onNavigate])

  if (page === 'login' && status === 'authenticated') return null
  if (!protectedPage) return children
  if (status === 'loading') return <p role="status" className="p-8 text-center text-primary">Đang khôi phục phiên đăng nhập…</p>
  if (status === 'anonymous') return null
  if (status === 'error') return (
    <div role="alert" className="p-8 text-center text-error">
      <p>{error?.message}</p>
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
