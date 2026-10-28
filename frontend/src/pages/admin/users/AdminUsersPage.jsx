import RefreshButton from '../../../components/common/RefreshButton.jsx'
import EntityActionButtons, { ChoiceButtons } from '../../../components/common/EntityActionButtons.jsx'
import { DataTable, StatusBadge, Icon } from '../../../components/common/WorkspaceUI.jsx'
import { uiLabel, cleanPresentationLabel } from '../../../services/uiLabels.js'
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
  const resource = useCatalogResource(loadUsers, { page, size: 12 }), [selected, setSelected] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false), [deleting, setDeleting] = useState(null), [notice, setNotice] = useState('')
  const local = demoRuntime.sources.get('/admin/users') === 'demo'
  const mutate = async (action, message = 'Đã lưu thông tin người dùng.') => { if (busy) return false; setBusy(true); setError(null); setNotice(''); try { await action(); setSelected(null); setDeleting(null); setNotice(message); resource.reload(); return true } catch (failure) { setError(failure); return false } finally { setBusy(false) } }
  return <section className={panelClass}><div className="flex flex-wrap gap-3"><button className={buttonClass} disabled={!local || busy} onClick={() => setSelected({ name: '', email: '', status: 'ACTIVE' })}>Thêm người dùng</button><RefreshButton className="underline" onClick={resource.reload}>Tải lại</RefreshButton></div>{local && <p className="text-xs text-on-surface-variant">Thông tin hồ sơ tại đây không cấp hoặc thay đổi quyền đăng nhập.</p>}{selected && <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); mutate(() => selected.id ? api.patch('/admin/users/' + selected.id, selected) : api.post('/admin/users', selected)) }}><label>Họ tên<input required maxLength={100} className={inputClass} value={selected.name} onChange={(e) => setSelected({ ...selected, name: e.target.value })} /></label><label>Email<input required type="email" className={inputClass} value={selected.email} onChange={(e) => setSelected({ ...selected, email: e.target.value })} /></label><ChoiceButtons label="Trạng thái" value={selected.status} disabled={busy} options={['ACTIVE', 'SUSPENDED']} onChange={(status) => setSelected({ ...selected, status })} /><div className="flex items-end gap-3"><button disabled={busy} className={buttonClass}>Lưu người dùng</button><button type="button" onClick={() => setSelected(null)}>Hủy</button></div></form>}{error && <ApiErrorMessage error={error} />}<ApiState resource={resource}>{resource.data?.result.length ? <DataTable label="Danh sách người dùng"><thead><tr><th>Người dùng</th><th>Liên hệ</th><th>Vai trò</th><th>Trạng thái</th><th className="sc-table-actions" scope="col">Thao tác</th></tr></thead><tbody>{resource.data.result.map((person) => <tr key={person.id}><td><strong>{cleanPresentationLabel(person.name)}</strong></td><td>{person.email}</td><td>{person.roles.map(uiLabel).join(', ')}</td><td><StatusBadge status={person.status} /></td><td className="sc-table-actions"><div className="sc-action-row"><button disabled={!local || !isDemoId(person.id) || busy} className="sc-button sc-action-button sc-action-button--secondary" onClick={() => { setSelected(person); setDeleting(null) }}><Icon name="edit" />Sửa</button><button disabled={!local || !isDemoId(person.id) || busy} className="sc-button sc-action-button sc-action-button--danger" onClick={() => { setDeleting(person); setSelected(null) }}><Icon name="delete" />Xóa</button></div></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Chưa có người dùng phù hợp." icon="group" />}{resource.data?.meta && <CatalogPagination meta={resource.data.meta} onPage={setPage} />}</ApiState>{deleting && <EntityActionButtons key={deleting.id} title={'Xóa thông tin: ' + deleting.name} busy={busy} actions={[{ key: 'delete', label: 'Xóa người dùng', icon: 'delete', tone: 'danger', description: 'Chỉ xóa được thông tin chưa có đơn hàng hoặc tiệm liên kết. Thao tác này không cấp hay thay đổi quyền đăng nhập.' }]} onConfirm={() => mutate(() => api.delete('/admin/users/' + deleting.id), 'Đã xóa thông tin người dùng.')} />}{notice && <p role="status" className="sc-feedback">{notice}</p>}</section>
}
export default function AdminUsersPage({ onNavigate }) {
  if (demoRuntime) return <AdminFrame activeTab="admin-users" onNavigate={onNavigate}><UserDirectory /></AdminFrame>
  return <AdminFrame activeTab="admin-users" onNavigate={onNavigate}><section className={panelClass}><EmptyPanel title="Quản lý người dùng chưa khả dụng" description="Chưa thể chỉnh sửa tài khoản hoặc cấp quyền tại đây." icon="manage_accounts" /><p className="sc-note">Chưa thể quản lý tài khoản tại đây. Liên hệ quản trị viên để cấp hoặc thay đổi quyền truy cập.</p></section></AdminFrame>
}
