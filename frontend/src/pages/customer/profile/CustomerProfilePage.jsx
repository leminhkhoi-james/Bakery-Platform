import React, { useState } from 'react'
import { useAuth } from '../../../context/useAuth.js'
import { OrderList } from '../../../components/orders/OrderViews.jsx'
import { ADDRESS_BLOCKER } from '../../../services/checkoutService.js'
import { panelClass, buttonClass } from '../../../components/management/ApiState.jsx'
import { EmptyPanel, Icon } from '../../../components/common/WorkspaceUI.jsx'

export default function CustomerProfilePage({ onNavigate }) {
  const { user, roles, logout } = useAuth()
  const canReadOrders = roles.some((role) => ['CUSTOMER', 'ADMIN'].includes(role))
  const [tab, setTab] = useState(canReadOrders ? 'orders' : 'profile'), [error, setError] = useState(null)
  return <main className="sc-customer mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
    <section className="sc-customer-heading flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4"><span className="sc-avatar sc-profile-avatar" aria-hidden="true">{(user.displayName || user.email || '').slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="sc-kicker">Tài khoản SweetCake</p><h1 className="break-words font-serif text-2xl font-semibold text-primary sm:text-3xl">{user.displayName || user.email}</h1><p className="mt-1 break-all text-sm text-on-surface-variant">{user.email}</p></div></div>
      <div className="sc-actions">
        {roles.some((role) => ['BAKERY_OWNER', 'BAKERY_STAFF'].includes(role)) && <button className={buttonClass} onClick={() => onNavigate('vendor-dashboard')}><Icon name="storefront" /> Quản lý tiệm bánh</button>}
        {roles.includes('ADMIN') && <button className={buttonClass} onClick={() => onNavigate('admin-dashboard')}><Icon name="admin_panel_settings" /> Quản trị hệ thống</button>}
        <button className="sc-icon-button" aria-label="Đăng xuất" title="Đăng xuất" onClick={async () => { try { await logout(); onNavigate('home') } catch (failure) { setError(failure.message) } }}><Icon name="logout" /></button>
      </div>
    </section>
    <div className="grid items-start gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Tài khoản cá nhân" className={panelClass + ' sc-profile-nav grid gap-1 md:sticky md:top-28'}>
        <p className="sc-kicker px-3">Không gian của bạn</p>
        {[['orders', 'Lịch sử đơn hàng', 'shopping_bag'], ['profile', 'Thông tin hồ sơ', 'person'], ['addresses', 'Địa chỉ nhận bánh', 'location_on'], ['security', 'Bảo mật', 'shield']].filter(([key]) => key !== 'orders' || canReadOrders).map(([key, label, icon]) => <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}><Icon name={icon} />{label}</button>)}
        <div className="border-t border-outline-variant/30 pt-3 text-xs text-on-surface-variant"><p className="px-3 font-semibold">Quyền tài khoản</p><p className="mt-2 break-words px-3">{roles.join(' · ')}</p></div>
      </nav>
      <section className="min-w-0">{tab === 'orders' && canReadOrders ? <OrderList scope="mine" onNavigate={onNavigate} /> : <div className={panelClass}>
        {tab === 'addresses' ? <><EmptyPanel title="Địa chỉ nhận bánh" description="Chưa thể quản lý địa chỉ giao hàng trên phiên bản backend hiện tại." icon="location_on" /><p className="sc-note">{ADDRESS_BLOCKER}</p></>
          : tab === 'security' ? <><EmptyPanel title="Bảo mật" description="Identity chưa có API đổi mật khẩu hoặc lưu tùy chọn thông báo." icon="shield" /><button disabled className={buttonClass}>Đổi mật khẩu — chờ API</button></>
            : <><h2 className="flex items-center gap-2 text-xl font-bold text-primary"><Icon name="person" /> Thông tin hồ sơ từ Identity</h2><dl className="sc-profile-fields">{[['Tên hiển thị', user.displayName], ['Email', user.email], ['Số điện thoại', user.phoneNumber || 'Chưa có số điện thoại']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="sc-note">Backend chưa cung cấp API cập nhật hồ sơ.</p><button disabled className={buttonClass}>Cập nhật hồ sơ — chờ API</button></>}
      </div>}</section>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
  </main>
}
