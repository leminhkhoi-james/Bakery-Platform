import React from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { panelClass } from '../../../components/management/ApiState.jsx'
export default function AdminUsersPage({ onNavigate }) {
  return <AdminFrame title="Người dùng" activeTab="admin-users" onNavigate={onNavigate}><section className={panelClass}><h2 className="font-bold">Chờ API quản lý người dùng</h2><p>Identity hiện chưa có public/admin API liệt kê, chỉnh sửa, khóa tài khoản hoặc cấp platform role. Không dùng danh sách demo hoặc gọi internal API từ trình duyệt.</p><p>Tài khoản Vendor/Admin phải được nhóm backend cấp theo quy trình quản trị hợp lệ.</p></section></AdminFrame>
}
