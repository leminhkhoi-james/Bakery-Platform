import React from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { panelClass } from '../../../components/management/ApiState.jsx'
import { EmptyPanel } from '../../../components/common/WorkspaceUI.jsx'
export default function AdminUsersPage({ onNavigate }) {
  return <AdminFrame title="Người dùng" activeTab="admin-users" onNavigate={onNavigate}><section className={panelClass}><EmptyPanel title="Chờ API quản lý người dùng" description="Chưa thể liệt kê, chỉnh sửa, khóa tài khoản hoặc cấp platform role từ giao diện." icon="manage_accounts" /><p className="sc-note">Identity hiện chưa có public/admin API quản lý người dùng. Tài khoản Vendor/Admin phải được nhóm backend cấp theo quy trình quản trị hợp lệ.</p></section></AdminFrame>
}
