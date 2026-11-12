import { useViewportPageSize } from '../../../hooks/useViewportPageSize.js'
import { maskedEmail, UserRoles } from './userDisplay.jsx'
import RecordActionButton from '../../../components/common/RecordActionButton.jsx'
import { RoleForm, UserDecision } from './UserEditor.jsx'
import { USER_STATUSES, PLATFORM_ROLES, updateUserRoles, updateUserProfile, isLocalUser } from '../../../services/adminUserService.js'
import React, { useRef, useState } from 'react'
import { ModalFormState } from '../../../components/common/ModalSurface.jsx'
import { DataTable, StatusBadge, Icon, EmptyPanel } from '../../../components/common/WorkspaceUI.jsx'
import { AdminReviewDialog } from '../../../components/management/AdminReviewUI.jsx'
import { reviewText, reviewError } from '../../../services/adminPresentation.js'
import { ApiState, ApiErrorMessage, panelClass, inputClass, buttonClass } from '../../../components/management/ApiState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { useAuth } from '../../../context/useAuth.js'
import { uiLabel } from '../../../services/uiLabels.js'
import { loadUsers, userName, userStatus, userRestriction, userFieldErrors, saveUser, deleteUser, changeUserStatus } from '../../../services/adminUserService.js'
import { localUserDirectory } from '../../../mockData/admin/userManagement.js'

import './admin-users.css'

export function UserForm({ person, busy, error, onClose, onSave }) {
  const initial = { name: reviewText(userName(person)) || '', email: person?.email || '', role: person?.roles?.[0] || 'CUSTOMER' }
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
    {!person && <label>Vai trò<select className={inputClass} value={values.role} onChange={event => setValues(current => ({ ...current, role: event.target.value }))}>{PLATFORM_ROLES.map(role => <option key={role} value={role}>{uiLabel(role)}</option>)}</select></label>}
  </fieldset>{error && !duplicateEmail && <ApiErrorMessage error={error} />}</form></AdminReviewDialog>
}
export function LocalUserDirectory() {
  const { user, roles } = useAuth()
  const [page, setPage] = useState(1)
  const { containerRef, pageSize } = useViewportPageSize(() => setPage(1))
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')

  const filters = {
    ...(email.trim() ? { email: email.trim() } : {}),
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
  }
  const resource = useCatalogResource(loadUsers, { page, size: pageSize, sort: 'displayName,asc', ...filters })
  const [editor, setEditor] = useState(null)
  const [decision, setDecision] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const inFlight = useRef(false)
  const local = Boolean(localUserDirectory())
  const canManage = roles.includes('ADMIN')
  const locked = busy || Boolean(resource.refreshing)

  async function mutate(action, message) {
    if (inFlight.current || busy || !canManage) return false
    inFlight.current = true; setBusy(true); setError(null); setNotice('')
    try { await action(); setEditor(null); setDecision(null); setNotice(message); setPage(1); resource.reload(); return true }
    catch (failure) { setError(reviewError(failure)); if (failure.status === 409) resource.reload(); return false }
    finally { inFlight.current = false; setBusy(false) }
  }

  function choose(person, action) {
    if (locked || !canManage) return
    setError(null); setNotice('')
    if (action === 'edit') setEditor({ person })
    else setDecision({ person, action })
  }

  const hasFilter = Boolean(email.trim() || role || status)

  return (
    <section ref={containerRef} className={panelClass}>
      <div className="sc-user-toolbar">
        <div className="sc-action-row">
          <button
            className={buttonClass}
            disabled={!local || !canManage || locked || resource.status !== 'ready'}
            title={!local ? 'Chức năng thêm hồ sơ hiện chưa khả dụng.' : undefined}
            onClick={() => { setError(null); setNotice(''); setEditor({ person: null }) }}
          >
            <Icon name="person_add" />Thêm người dùng
          </button>
        </div>
      </div>

      <form className="sc-user-filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          {local ? 'Tên hoặc email' : 'Email'}
          <input
            className={inputClass}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setPage(1) }}
            placeholder={local ? 'Tìm theo tên hoặc email' : 'Tìm theo email'}
          />
        </label>
        <label>
          Vai trò
          <select
            className={inputClass}
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1) }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="BAKERY_OWNER">Chủ tiệm bánh</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </label>
        <label>
          Trạng thái
          <select
            aria-label="Trạng thái"
            className={inputClass}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          >
            <option value="">Tất cả trạng thái</option>
            {USER_STATUSES.map(value => <option key={value} value={value}>{userStatus(value)}</option>)}
          </select>
        </label>
        {hasFilter && (
          <button
            type="button"
            className="sc-button sc-action-button--secondary"
            disabled={locked}
            onClick={() => { setEmail(''); setRole(''); setStatus(''); setPage(1) }}
          >
            <Icon name="clear" />Xóa bộ lọc
          </button>
        )}
        <span className="sc-filter-count">{resource.data?.meta.total ?? '—'} người dùng</span>
      </form>

      <ApiState resource={resource}>
        {resource.data && (
          resource.data.result.length ? (
            <DataTable label="Danh sách người dùng" className="sc-admin-fixed-table sc-admin-users-table">
              <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '23%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="sc-col-stt">STT</th>
                  <th>Người dùng</th>
                  <th>Liên hệ</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th className="sc-table-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {resource.data.result.map((person, index) => {
                  const accountRestriction = userRestriction(person, user, 'edit')
                  const pageIndex = resource.data?.meta?.page || page
                  const returnedPageSize = resource.data?.meta?.pageSize || resource.data?.meta?.size || pageSize
                  const stt = (pageIndex - 1) * returnedPageSize + index + 1

                  return (
                    <tr key={person.id}>
                      <td data-label="STT" className="sc-col-stt font-medium text-on-surface-variant">{stt}</td>
                      <td data-label="Người dùng">
                        <strong>{reviewText(userName(person)) || 'Chưa cập nhật tên'}</strong>
                        {accountRestriction && <small>{accountRestriction}</small>}
                      </td>
                      <td data-label="Liên hệ">{maskedEmail(person.email) || 'Chưa có email'}</td>
                      <td data-label="Vai trò">{<UserRoles roles={person.roles} />}</td>
                      <td data-label="Trạng thái"><StatusBadge status={['BLOCKED', 'SUSPENDED'].includes(person.status) ? 'NEUTRAL' : person.status} label={userStatus(person.status)} /></td>
                      <td className="sc-table-actions">
                        <RecordActionButton type="button" action="view" label="Chỉnh sửa người dùng" className="sc-button"
                          disabled={locked || !canManage || Boolean(accountRestriction)} title={accountRestriction || 'Chỉnh sửa'}
                          onClick={() => choose(person, 'edit')} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </DataTable>
          ) : (
            <EmptyPanel title="Chưa có người dùng phù hợp." icon="group" />
          )
        )}
        {resource.data?.meta && <CatalogPagination meta={resource.data.meta} onPage={setPage} />}
      </ApiState>

      {editor?.person && canManage && <RoleForm
        key={editor.person.id}
        person={editor.person}
        local={isLocalUser(editor.person)}
        busy={busy}
        error={decision ? null : error}
        removeReason={userRestriction(editor.person, user, 'delete')}
        statusReason={userRestriction(editor.person, user, 'status')}
        onClose={() => { setEditor(null); setError(null) }}
        onAction={action => choose(editor.person, action)}
        onSave={(nextRoles, changes) => mutate(async () => {
          let current = editor.person
          if (Object.keys(changes).length) {
            current = isLocalUser(current)
              ? await saveUser(current, { name: changes.name ?? userName(current), email: changes.email ?? current.email }, user)
              : await updateUserProfile(current, {
                ...(changes.name ? { displayName: changes.name } : {}),
                ...(changes.phone ? { phoneNumber: changes.phone } : {}),
              }, user)
            setEditor({ person: current })
            resource.reload()
          }
          const currentRoles = current.roles.filter(role => PLATFORM_ROLES.includes(role))
          if (currentRoles.length !== nextRoles.length || nextRoles.some(role => !currentRoles.includes(role))) {
            await updateUserRoles(current, nextRoles, user)
          }
        }, 'Đã cập nhật người dùng.')}
      />}
      {editor && !editor.person && canManage && <UserForm
        key="new"
        busy={busy}
        error={error}
        onClose={() => { setEditor(null); setError(null) }}
        onSave={input => mutate(async () => {
          await saveUser(null, input, user)
          setEmail(''); setRole(''); setStatus('')
        }, 'Đã lưu thông tin người dùng.')}
      />}
      {decision && canManage && (
        <UserDecision
          person={decision.person}
          action={decision.action}
          local={isLocalUser(decision.person)}
          disabledReason={userRestriction(decision.person, user, decision.action)}
          busy={busy}
          error={error}
          onClose={() => { setDecision(null); setError(null) }}
          onConfirm={() => mutate(() => decision.action === 'delete' ? deleteUser(decision.person, user) : changeUserStatus(decision.person, user, isLocalUser(decision.person) ? undefined : decision.person.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'), decision.action === 'delete' ? 'Đã xóa thông tin người dùng.' : 'Đã cập nhật trạng thái người dùng.')}
        />
      )}
      {notice && <p role="status" className="sc-feedback">{notice}</p>}
    </section>
  )
}
