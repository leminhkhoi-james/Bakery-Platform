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
import { loadUsers, userName, userStatus, userRestriction, userFieldErrors, saveUser, deleteUser, changeUserStatus } from '../../../services/adminUserService.js'
import { localUserDirectory } from '../../../mockData/admin/userManagement.js'
import { isDemoId } from '../../../mockData/seed.js'

import './admin-users.css'

export function UserForm({ person, busy, error, onClose, onSave }) {
  const initial = { name: reviewText(userName(person)) || '', email: person?.email || '' }
  const [values, setValues] = useState(() => initial), [errors, setErrors] = useState({}), [lastSentEmail, setLastSentEmail] = useState(null)
  const duplicateEmail = error?.status === 409 && /email đã được sử dụng|email already (?:exists|in use)/i.test(error.message || '')
  const emailConflict = duplicateEmail && values.email.trim() === lastSentEmail ? 'Email đã được sử dụng. Vui lòng chọn email khác.' : null
  const emailError = errors.email || emailConflict
  const validation = userFieldErrors(values), valid = !Object.keys(validation).length && !emailConflict
  const changed = !person || values.name.trim() !== initial.name.trim() || values.email.trim() !== initial.email.trim()
  const formId = 'admin-user-form-' + (person?.id || 'new')
  const field = (key) => ({ name: key, value: values[key], 'aria-label': key === 'name' ? 'Họ tên' : 'Email', 'aria-invalid': Boolean(key === 'email' ? emailError : errors[key]), 'aria-describedby': (key === 'email' ? emailError : errors[key]) ? 'user-error-' + key : undefined,
    onBlur: () => setErrors((current) => ({ ...current, [key]: userFieldErrors(values)[key] || null })),
    onChange: (event) => { const next = { ...values, [key]: event.target.value }; setValues(next); setErrors({ ...errors, [key]: userFieldErrors(next)[key] || null }) } })
  const footer = <div className="sc-action-row"><button type="button" className="sc-button sc-action-button--secondary" disabled={busy} data-modal-close>Hủy</button><button type="submit" form={formId} disabled={busy || !valid || !changed} title={!changed ? 'Chưa có thay đổi để lưu.' : !valid ? 'Vui lòng nhập họ tên và email hợp lệ.' : undefined} className={buttonClass}><Icon name="save" />{busy ? 'Đang lưu…' : person ? 'Lưu thay đổi' : 'Lưu người dùng'}</button></div>
  return <AdminReviewDialog compact className="sc-user-form-dialog" title={person ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'} busy={busy} footer={footer} onClose={onClose}><form id={formId} className="sc-user-form" noValidate onSubmit={(event) => {
    event.preventDefault(); const next = userFieldErrors(values); setErrors(next)
    if (busy || Object.keys(next).length || !changed || emailConflict) return
    setLastSentEmail(values.email.trim())
    onSave({ ...values, name: person && values.name.trim() === initial.name.trim() ? userName(person) : values.name })
  }}><ModalFormState value={values} busy={busy} /><fieldset disabled={busy}>
    <label><span>Họ tên <span className="sc-user-required" aria-hidden="true">*</span></span><input required maxLength={100} autoComplete="name" className={inputClass} {...field('name')} />{errors.name && <span role="alert" id="user-error-name" className="sc-field-error">{errors.name}</span>}</label>
    <label><span>Email <span className="sc-user-required" aria-hidden="true">*</span></span><input required type="email" maxLength={254} autoComplete="email" className={inputClass} {...field('email')} />{emailError && <span role="alert" id="user-error-email" className="sc-field-error">{emailError}</span>}</label>
  </fieldset>{error && !duplicateEmail && <ApiErrorMessage error={error} />}</form></AdminReviewDialog>
}
export function UserDecision({ person, action, busy, error, onClose, onConfirm, disabledReason }) {
  const deleting = action === 'delete', suspending = person.status === 'ACTIVE'
  const title = deleting ? 'Xác nhận xóa người dùng' : suspending ? 'Tạm ngưng người dùng' : 'Kích hoạt lại người dùng'
  const label = deleting ? 'Xác nhận xóa' : suspending ? 'Tạm ngưng' : 'Kích hoạt lại'
  const footer = <div className="sc-action-row"><button type="button" className="sc-button sc-action-button--secondary" disabled={busy} data-modal-close>Hủy</button><button type="button" className={'sc-button ' + (deleting ? 'sc-user-delete-confirm' : '')} disabled={busy || Boolean(disabledReason)} onClick={onConfirm}><Icon name={deleting ? 'delete' : suspending ? 'pause_circle' : 'play_circle'} />{busy ? 'Đang xử lý…' : label}</button></div>
  return <AdminReviewDialog compact className="sc-user-decision-dialog" title={title} footer={footer} onClose={onClose} busy={busy}><div className="sc-user-decision-content"><dl className="sc-review-fields">
    <ReviewField label="Họ tên" value={reviewText(userName(person))} fallback="Chưa cập nhật tên" /><ReviewField label="Email" value={reviewText(person.email)} fallback="Chưa có email" />
    {!deleting && <ReviewField label="Trạng thái sau xử lý" value={userStatus(suspending ? 'SUSPENDED' : 'ACTIVE')} />}
  </dl><p className={deleting ? 'sc-user-delete-warning' : 'sc-review-help'}>{deleting ? 'Hồ sơ sẽ bị xóa khỏi danh sách và không có chức năng khôi phục. Thao tác này không xóa tài khoản đăng nhập.' : suspending ? 'Tạm ngưng hồ sơ người dùng. Bạn có thể kích hoạt lại khi cần.' : 'Khôi phục trạng thái hoạt động của hồ sơ người dùng.'}</p>{disabledReason && <p role="alert" className="sc-field-error">{disabledReason}</p>}{error && <ApiErrorMessage error={error} />}</div></AdminReviewDialog>
}

export function UserDirectory() {
  const { user, roles } = useAuth(), [page, setPage] = useState(1), [draft, setDraft] = useState({ email: '', role: '', status: '' }), [filters, setFilters] = useState({})
  const resource = useCatalogResource(loadUsers, { page, size: 12, ...filters }), [editor, setEditor] = useState(null), [decision, setDecision] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  const inFlight = useRef(false), local = localUserDirectory(), canManage = roles.includes('ADMIN'), locked = busy || Boolean(resource.refreshing)
  async function mutate(action, message) {
    if (inFlight.current || busy || !canManage) return false
    inFlight.current = true; setBusy(true); setError(null); setNotice('')
    try { await action(); setEditor(null); setDecision(null); setNotice(message); resource.reload(); return true }
    catch (failure) { setError(reviewError(failure)); return false }
    finally { inFlight.current = false; setBusy(false) }
  }
  function choose(person, action) { if (locked || !canManage) return; setError(null); setNotice(''); if (action === 'edit') setEditor({ person }); else setDecision({ person, action }) }
  const field = (key) => ({ value: draft[key], onChange: (event) => setDraft({ ...draft, [key]: event.target.value }) })
  return <section className={panelClass}><div className="sc-user-toolbar"><p className="sc-review-help">{resource.data ? resource.data.meta.total + ' người dùng' : 'Danh sách người dùng'}</p><div className="sc-action-row"><RefreshButton disabled={locked} onClick={resource.reload}>Làm mới</RefreshButton><button className={buttonClass} disabled={!local || !canManage || locked || resource.status !== 'ready'} title={!local ? 'Chức năng thêm hồ sơ hiện chưa khả dụng.' : undefined} onClick={() => { setError(null); setNotice(''); setEditor({ person: null }) }}><Icon name="person_add" />Thêm người dùng</button></div></div>
    <form className="sc-user-filters" onSubmit={(event) => { event.preventDefault(); setFilters({ ...draft, email: draft.email.trim() }); setPage(1) }}><label>{local ? 'Tên hoặc email' : 'Email'}<input className={inputClass} {...field('email')} placeholder={local ? 'Tìm theo tên hoặc email' : 'Tìm theo email'} /></label><label>Vai trò<select className={inputClass} {...field('role')}><option value="">Tất cả vai trò</option>{['CUSTOMER', 'BAKERY_OWNER', 'BAKERY_STAFF', 'ADMIN'].map((role) => <option key={role} value={role}>{uiLabel(role)}</option>)}</select></label><label>Trạng thái<select className={inputClass} {...field('status')}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value={local ? 'SUSPENDED' : 'BLOCKED'}>Tạm ngưng</option>{!local && <option value="DELETED">Đã xóa</option>}</select></label><button className={buttonClass} disabled={locked}><Icon name="search" />Lọc</button></form>
    {!local && resource.status === 'ready' && <p className="sc-review-help">Hiện chưa thể thêm, chỉnh sửa, xóa hồ sơ hoặc thay đổi trạng thái người dùng tại đây.</p>}
    <ApiState resource={resource}>{resource.data && (resource.data.result.length ? <DataTable label="Danh sách người dùng" className="sc-admin-fixed-table sc-admin-users-table"><colgroup>{[20, 24, 18, 14, 24].map((width, index) => <col key={index} style={{ width: width + '%' }} />)}</colgroup><thead><tr><th>Người dùng</th><th>Liên hệ</th><th>Vai trò</th><th>Trạng thái</th><th className="sc-table-actions">Thao tác</th></tr></thead><tbody>{resource.data.result.map((person) => {
      const restriction = userRestriction(person, user), editReason = userRestriction(person, user, 'edit'), editable = local && isDemoId(person.id), statusReason = !editable ? 'Chức năng thay đổi trạng thái hiện chưa khả dụng.' : userRestriction(person, user, 'status')
      return <tr key={person.id}><td data-label="Người dùng"><strong>{reviewText(userName(person)) || 'Chưa cập nhật tên'}</strong>{restriction && <small>{restriction}</small>}</td><td data-label="Liên hệ">{reviewText(person.email) || 'Chưa có email'}</td><td data-label="Vai trò">{person.roles.map((role) => uiLabel(role, 'Chưa xác định')).join(', ')}</td><td data-label="Trạng thái"><StatusBadge status={person.status} label={userStatus(person.status)} /></td><td className="sc-table-actions"><div className="sc-action-row"><button className="sc-button sc-action-button--secondary" disabled={locked || !canManage || !editable || Boolean(editReason)} title={editReason || (!editable ? 'Chỉnh sửa hồ sơ hiện chưa khả dụng.' : undefined)} onClick={() => choose(person, 'edit')}><Icon name="edit" />Sửa</button>{['ACTIVE', 'SUSPENDED', 'BLOCKED'].includes(person.status) && <button className="sc-button sc-action-button--secondary sc-user-status-action" disabled={locked || !canManage || Boolean(statusReason)} title={statusReason || undefined} onClick={() => choose(person, 'status')}><Icon name={person.status === 'ACTIVE' ? 'pause_circle' : 'play_circle'} />{person.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt'}</button>}<button className="sc-button sc-action-button--danger" disabled={locked || !canManage || !editable || Boolean(restriction)} title={restriction || (!editable ? 'Xóa hồ sơ hiện chưa khả dụng.' : undefined)} onClick={() => choose(person, 'delete')}><Icon name="delete" />Xóa</button></div></td></tr>
    })}</tbody></DataTable> : <EmptyPanel title="Chưa có người dùng phù hợp." icon="group" />)}{resource.data?.meta && <CatalogPagination meta={resource.data.meta} onPage={setPage} />}</ApiState>
    {editor && canManage && <UserForm key={editor.person?.id || 'new'} person={editor.person} busy={busy} error={error} onClose={() => { setEditor(null); setError(null) }} onSave={(input) => mutate(() => saveUser(editor.person, input, user), 'Đã lưu thông tin người dùng.')} />}
    {decision && canManage && <UserDecision person={decision.person} action={decision.action} disabledReason={!local || !isDemoId(decision.person.id) ? 'Thao tác hiện chưa khả dụng với hồ sơ này.' : userRestriction(decision.person, user, decision.action === 'status' ? 'status' : 'delete')} busy={busy} error={error} onClose={() => { setDecision(null); setError(null) }} onConfirm={() => mutate(() => decision.action === 'delete' ? deleteUser(decision.person, user) : changeUserStatus(decision.person, user), decision.action === 'delete' ? 'Đã xóa thông tin người dùng.' : 'Đã cập nhật trạng thái người dùng.')} />}
    {notice && <p role="status" className="sc-feedback">{notice}</p>}
  </section>
}
export default function AdminUsersPage({ onNavigate }) { return <AdminFrame activeTab="admin-users" onNavigate={onNavigate}><UserDirectory /></AdminFrame> }
