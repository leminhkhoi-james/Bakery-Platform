import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import React, { useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { panelClass } from '../../../components/management/ApiState.jsx'
import { EmptyPanel } from '../../../components/common/WorkspaceUI.jsx'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { demoRuntime } from '../../../mockData/runtime.js'
import { isDemoId } from '../../../mockData/seed.js'
import { api, ApiError } from '../../../services/apiClient.js'
import { ApiState, ApiErrorMessage, buttonClass, inputClass } from '../../../components/management/ApiState.jsx'

const loadUsers = async (params, options) => {
  const data = await api.get('/admin/users?' + new URLSearchParams(params), options)
  if (!Array.isArray(data?.result) || data.result.some((row) => !row?.id || !Array.isArray(row.roles))) throw new ApiError('Danh sách người dùng không đúng định dạng.', 502)
  return data
}
function UserDirectory() {
  const [page, setPage] = useState(1)
  const resource = useCatalogResource(loadUsers, { page, size: 12 }), [selected, setSelected] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false)
  const local = demoRuntime.sources.get('/admin/users') === 'demo'
  const mutate = async (action) => { setBusy(true); setError(null); try { await action(); setSelected(null); resource.reload() } catch (failure) { setError(failure) } finally { setBusy(false) } }
  return <section className={panelClass}><div className="flex flex-wrap gap-3"><button className={buttonClass} disabled={!local || busy} onClick={() => setSelected({ name: '', email: '', status: 'ACTIVE' })}>Thêm người dùng</button><button className="underline" onClick={resource.reload}>Tải lại</button></div>{local && <p className="text-xs text-on-surface-variant">Dữ liệu mẫu; chỉnh sửa ở đây không tạo tài khoản đăng nhập hoặc cấp quyền thật.</p>}{selected && <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); mutate(() => selected.id ? api.patch('/admin/users/' + selected.id, selected) : api.post('/admin/users', selected)) }}><label>Họ tên<input required maxLength={100} className={inputClass} value={selected.name} onChange={(e) => setSelected({ ...selected, name: e.target.value })} /></label><label>Email<input required type="email" className={inputClass} value={selected.email} onChange={(e) => setSelected({ ...selected, email: e.target.value })} /></label><label>Trạng thái<select className={inputClass} value={selected.status} onChange={(e) => setSelected({ ...selected, status: e.target.value })}><option>ACTIVE</option><option>SUSPENDED</option></select></label><div className="flex items-end gap-3"><button disabled={busy} className={buttonClass}>Lưu người dùng</button><button type="button" onClick={() => setSelected(null)}>Hủy</button></div></form>}{error && <ApiErrorMessage error={error} />}<ApiState resource={resource}><div className="grid gap-4 md:grid-cols-2">{resource.data?.result.map((person) => <article className="sc-panel space-y-3" key={person.id}><h2 className="font-bold">{person.name}</h2><p className="break-all">{person.email}</p><p>{person.roles.join(', ')} · {person.status}</p><div className="flex flex-wrap gap-3"><button disabled={!local || !isDemoId(person.id) || busy} className={buttonClass} onClick={() => setSelected(person)}>Sửa</button><button disabled={!local || !isDemoId(person.id) || busy} className="underline" onClick={() => mutate(() => api.delete('/admin/users/' + person.id))}>Xóa</button></div></article>)}</div>{resource.data?.meta && <CatalogPagination meta={resource.data.meta} onPage={setPage} />}</ApiState></section>
}
export default function AdminUsersPage({ onNavigate }) {
  if (demoRuntime) return <AdminFrame title="Người dùng" activeTab="admin-users" onNavigate={onNavigate}><UserDirectory /></AdminFrame>
  return <AdminFrame title="Người dùng" activeTab="admin-users" onNavigate={onNavigate}><section className={panelClass}><EmptyPanel title="Chờ API quản lý người dùng" description="Chưa thể liệt kê, chỉnh sửa, khóa tài khoản hoặc cấp platform role từ giao diện." icon="manage_accounts" /><p className="sc-note">Identity hiện chưa có public/admin API quản lý người dùng. Tài khoản Vendor/Admin phải được nhóm backend cấp theo quy trình quản trị hợp lệ.</p></section></AdminFrame>
}
