import { useViewportPageSize } from '../../../hooks/useViewportPageSize.js'
import { maskedEmail, UserRoles } from './userDisplay.jsx'
import UserRowActions from './UserRowActions.jsx'
import React, { useRef, useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import { ModalFormState } from '../../../components/common/ModalSurface.jsx'
import { DataTable, StatusBadge, Icon, EmptyPanel } from '../../../components/common/WorkspaceUI.jsx'
import { AdminReviewDialog, ReviewField } from '../../../components/management/AdminReviewUI.jsx'
import { reviewText, reviewError } from '../../../services/adminPresentation.js'
import { ApiState, ApiErrorMessage, panelClass, inputClass, buttonClass } from '../../../components/management/ApiState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { useAuth } from '../../../context/useAuth.js'
import { uiLabel } from '../../../services/uiLabels.js'
import { loadUsers, userName, userStatus, userRestriction, roleErrors, updateUserRoles, deleteUser, changeUserStatus, PLATFORM_ROLES } from '../../../services/adminUserService.js'

import { localUserDirectory } from '../../../mockData/admin/userManagement.js'
import { LocalUserDirectory } from './LocalUserDirectory.jsx'
import './admin-users.css'

const sameRoles = (a, b) => a.length === b.length && a.every((role) => b.includes(role))

export function RoleForm({ person, busy, error, onClose, onSave }) {
  const initial = person.roles.filter((role) => PLATFORM_ROLES.includes(role))
  const [roles, setRoles] = useState(() => initial)
  const invalid = roleErrors(roles), changed = !sameRoles(roles, initial)
  const formId = 'admin-role-form-' + person.id
  const toggle = (role) => setRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role])
  const footer = <div className="sc-action-row">
    <button type="button" className="sc-button sc-action-button--secondary" disabled={busy} data-modal-close>Hủy</button>
    <button type="submit" form={formId} disabled={busy || Boolean(invalid) || !changed} title={!changed ? 'Chưa có thay đổi để lưu.' : invalid || undefined} className={buttonClass}><Icon name="save" />{busy ? 'Đang lưu…' : 'Lưu vai trò'}</button>
  </div>
  return <AdminReviewDialog compact className="sc-user-form-dialog" title="Phân quyền người dùng" busy={busy} footer={footer} onClose={onClose}>
    <form id={formId} className="sc-user-form" noValidate onSubmit={(event) => { event.preventDefault(); if (!busy && !invalid && changed) onSave(roles) }}>
      <ModalFormState value={roles} busy={busy} />
      <dl className="sc-review-fields"><ReviewField label="Họ tên" value={reviewText(userName(person))} fallback="Chưa cập nhật tên" /><ReviewField label="Email" value={maskedEmail(person.email)} fallback="Chưa có email" /></dl>
      <fieldset disabled={busy}>
        <legend>Vai trò</legend>
        {PLATFORM_ROLES.map((role) => <label key={role}><input type="checkbox" name="roles" value={role} checked={roles.includes(role)} onChange={() => toggle(role)} /> {uiLabel(role)}</label>)}
      </fieldset>
      {invalid && <p role="alert" className="sc-field-error">{invalid}</p>}
      <p className="sc-review-help">Danh sách này thay thế toàn bộ vai trò hiện tại của người dùng.</p>
      {error && <ApiErrorMessage error={error} />}
    </form>
  </AdminReviewDialog>
}

export function UserDecision({ person, action, busy, error, onClose, onConfirm, disabledReason }) {
  const deleting = action === 'delete', blocking = person.status === 'ACTIVE'
  const title = deleting ? 'Xác nhận xóa người dùng' : blocking ? 'Khóa người dùng' : 'Mở khóa người dùng'
  const label = deleting ? 'Xác nhận xóa' : blocking ? 'Khóa tài khoản' : 'Mở khóa'
  const nextStatus = deleting ? 'DELETED' : blocking ? 'BLOCKED' : 'ACTIVE'
  const help = deleting ? 'Tài khoản chuyển sang trạng thái Đã xóa, mọi phiên đăng nhập bị thu hồi và không thể khôi phục tại đây.'
    : blocking ? 'Người dùng không thể đăng nhập và mọi phiên đăng nhập hiện tại bị thu hồi. Bạn có thể mở khóa khi cần.'
      : 'Khôi phục quyền đăng nhập của người dùng.'
  const footer = <div className="sc-action-row">
    <button type="button" className="sc-button sc-action-button--secondary" disabled={busy} data-modal-close>Hủy</button>
    <button type="button" className={'sc-button ' + (deleting ? 'sc-user-delete-confirm' : '')} disabled={busy || Boolean(disabledReason)} onClick={onConfirm}><Icon name={deleting ? 'delete' : blocking ? 'lock' : 'lock_open'} />{busy ? 'Đang xử lý…' : label}</button>
  </div>
  return <AdminReviewDialog compact className="sc-user-decision-dialog" title={title} footer={footer} onClose={onClose} busy={busy}>
    <div className="sc-user-decision-content">
      <dl className="sc-review-fields">
        <ReviewField label="Họ tên" value={reviewText(userName(person))} fallback="Chưa cập nhật tên" />
        <ReviewField label="Email" value={maskedEmail(person.email)} fallback="Chưa có email" />
        <ReviewField label="Trạng thái sau xử lý" value={userStatus(nextStatus)} />
      </dl>
      <p className={deleting ? 'sc-user-delete-warning' : 'sc-review-help'}>{help}</p>
      {disabledReason && <p role="alert" className="sc-field-error">{disabledReason}</p>}
      {error && <ApiErrorMessage error={error} />}
    </div>
  </AdminReviewDialog>
}

function userRow({ person, actor, disabled, onChoose, stt }) {
  const restriction = userRestriction(person, actor)
  const toggleable = ['ACTIVE', 'BLOCKED'].includes(person.status)
  return <tr key={person.id}>
    <td data-label="STT" style={{ width: '60px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-muted, #64748b)' }}>{stt}</td>
    <td data-label="Người dùng"><strong>{reviewText(userName(person)) || 'Chưa cập nhật tên'}</strong>{restriction && <small>{restriction}</small>}</td>
    <td data-label="Liên hệ">{maskedEmail(person.email) || 'Chưa có email'}</td>
    <td data-label="Vai trò">{<UserRoles roles={person.roles} />}</td>
    <td data-label="Trạng thái"><StatusBadge status={person.status} label={userStatus(person.status)} /></td>
    <td className="sc-table-actions"><UserRowActions person={person} disabled={disabled || Boolean(restriction)}
      roles={{ label: 'Phân quyền', icon: 'manage_accounts', onClick: () => onChoose(person, 'roles') }}
      status={toggleable ? { label: person.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản', icon: person.status === 'ACTIVE' ? 'lock' : 'lock_open', onClick: () => onChoose(person, 'status') } : null}
      remove={{ label: 'Xóa người dùng', icon: 'delete', danger: true, onClick: () => onChoose(person, 'delete') }} /></td>
  </tr>
}

export function UserDirectory() {
  const { user, roles } = useAuth(), [page, setPage] = useState(1), [draft, setDraft] = useState({ email: '', role: '', status: '' }), [filters, setFilters] = useState({})
  const { containerRef, pageSize } = useViewportPageSize(() => setPage(1))
  const resource = useCatalogResource(loadUsers, { page, size: pageSize, sort: 'displayName,asc', ...filters }), [editor, setEditor] = useState(null), [decision, setDecision] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  const inFlight = useRef(false), canManage = roles.includes('ADMIN'), locked = busy || Boolean(resource.refreshing)
  async function mutate(action, message) {
    if (inFlight.current || busy || !canManage) return false
    inFlight.current = true; setBusy(true); setError(null); setNotice('')
    try { await action(); setEditor(null); setDecision(null); setNotice(message); setPage(1); resource.reload(); return true }
    catch (failure) { setError(reviewError(failure)); if (failure.status === 409) resource.reload(); return false }
    finally { inFlight.current = false; setBusy(false) }
  }
  function choose(person, action) { if (locked || !canManage) return; setError(null); setNotice(''); if (action === 'roles') setEditor({ person }); else setDecision({ person, action }) }
  function confirmDecision() {
    const { person, action } = decision
    if (action === 'delete') return mutate(() => deleteUser(person, user), 'Đã xóa người dùng.')
    return mutate(() => changeUserStatus(person, user, person.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'), 'Đã cập nhật trạng thái người dùng.')
  }
  if (localUserDirectory()) return <LocalUserDirectory />
  const field = (key) => ({ value: draft[key], onChange: (event) => { const next = { ...draft, [key]: event.target.value }; setDraft(next); setFilters(next); setPage(1) } })
  return <section ref={containerRef} className={panelClass}>
    
    <form className="sc-user-filters" onSubmit={(event) => { event.preventDefault(); setFilters({ ...draft, email: draft.email.trim() }); setPage(1) }}>
      <label>Email<input className={inputClass} {...field('email')} placeholder="Tìm theo email" /></label>
      <label>Vai trò<select className={inputClass} {...field('role')}><option value="">Tất cả vai trò</option>{PLATFORM_ROLES.map((role) => <option key={role} value={role}>{uiLabel(role)}</option>)}</select></label>
      <label>Trạng thái<select className={inputClass} {...field('status')}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="BLOCKED">Đã khóa</option><option value="DELETED">Đã xóa</option></select></label>
      <span className="sc-filter-count">{resource.data?.meta.total ?? '—'} người dùng</span>
    </form>
    <ApiState resource={resource}>{resource.data && (resource.data.result.length ? <DataTable label="Danh sách người dùng" className="sc-admin-fixed-table sc-admin-users-table"><colgroup><col style={{ width: '60px' }} />{[23, 25, 18, 16, 18].map((width, index) => <col key={index} style={{ width: width + '%' }} />)}</colgroup><thead><tr><th style={{ width: '60px', textAlign: 'center' }}>STT</th><th>Người dùng</th><th>Liên hệ</th><th>Vai trò</th><th>Trạng thái</th><th className="sc-table-actions">Thao tác</th></tr></thead><tbody>
      {resource.data.result.map((person, index) => userRow({ person, actor: user, disabled: locked || !canManage, onChoose: choose, stt: ((resource.data.meta?.page || 1) - 1) * (resource.data.meta?.pageSize || pageSize) + index + 1 }))}
    </tbody></DataTable> : <EmptyPanel title="Chưa có người dùng phù hợp." icon="group" />)}{resource.data?.meta && <CatalogPagination meta={resource.data.meta} onPage={setPage} />}</ApiState>
    {editor && canManage && <RoleForm key={editor.person.id} person={editor.person} busy={busy} error={error} onClose={() => { setEditor(null); setError(null) }} onSave={(next) => mutate(() => updateUserRoles(editor.person, next, user), 'Đã cập nhật vai trò người dùng.')} />}
    {decision && canManage && <UserDecision person={decision.person} action={decision.action} disabledReason={userRestriction(decision.person, user)} busy={busy} error={error} onClose={() => { setDecision(null); setError(null) }} onConfirm={confirmDecision} />}
    {notice && <p role="status" className="sc-feedback">{notice}</p>}
  </section>
}
export default function AdminUsersPage({ onNavigate }) { return <AdminFrame activeTab="admin-users" onNavigate={onNavigate}><UserDirectory /></AdminFrame> }
