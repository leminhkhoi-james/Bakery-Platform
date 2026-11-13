import { maskedEmail } from './userDisplay.jsx'
import React, { useState } from 'react'
import { ModalFormState } from '../../../components/common/ModalSurface.jsx'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import { AdminReviewDialog, ReviewField } from '../../../components/management/AdminReviewUI.jsx'
import { reviewText } from '../../../services/adminPresentation.js'
import { ApiErrorMessage, inputClass, buttonClass } from '../../../components/management/ApiState.jsx'
import { uiLabel } from '../../../services/uiLabels.js'
import { userName, userStatus, roleErrors, userFieldErrors, PLATFORM_ROLES } from '../../../services/adminUserService.js'
import { phoneError } from '../../../services/contactValidation.js'


const sameRoles = (a, b) => a.length === b.length && a.every((role) => b.includes(role))

export function RoleForm({ person, local = false, busy, error, onClose, onSave, onAction, removeReason, statusReason }) {
  const initialRoles = person.roles.filter(role => PLATFORM_ROLES.includes(role))
  const original = { name: userName(person), email: person.email || '', phone: person.phoneNumber || '' }
  const [roles, setRoles] = useState(() => initialRoles)
  const [values, setValues] = useState(() => original)
  const [touched, setTouched] = useState({})
  const changed = !sameRoles(roles, initialRoles) || Object.keys(original).some(key => values[key].trim() !== original[key].trim())
  const errors = local ? userFieldErrors(values) : {
    name: !values.name.trim() || values.name.trim().length > 120 ? 'Nhập họ tên từ 1 đến 120 ký tự.' : '',
    phone: values.phone.trim() === original.phone.trim() ? '' : phoneError(values.phone),
  }
  const invalid = roleErrors(roles)
  const canSave = changed && !invalid && !Object.values(errors).some(Boolean) && !busy
  const formId = 'admin-role-form-' + person.id
  const field = key => ({
    value: values[key],
    className: inputClass,
    onChange: event => setValues({ ...values, [key]: event.target.value }),
    onBlur: () => setTouched({ ...touched, [key]: true }),
    'aria-invalid': Boolean(touched[key] && errors[key]) || undefined,
  })
  const feedback = key => touched[key] && errors[key] && <small role="alert" className="sc-field-error">{errors[key]}</small>
  const toggle = role => setRoles(current => current.includes(role) ? current.filter(item => item !== role) : [...current, role])
  const footer = <div className="sc-action-row">
    <button type="button" className="sc-button sc-action-button--secondary" disabled={busy} data-modal-close>Hủy</button>
    <button type="submit" form={formId} disabled={!canSave} className={buttonClass}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
  </div>
  return <AdminReviewDialog compact className="sc-user-form-dialog" title="Chỉnh sửa người dùng" busy={busy} footer={footer} onClose={onClose}>
    <form id={formId} className="sc-user-form" noValidate onSubmit={event => {
      event.preventDefault()
      if (canSave) onSave(roles, Object.fromEntries(Object.entries(values).filter(([key, value]) => value.trim() !== original[key].trim()).map(([key, value]) => [key, value.trim()])))
    }}>
      <ModalFormState value={{ roles, ...values }} busy={busy} />
      <fieldset disabled={busy}>
        <legend>Thông tin người dùng</legend>
        <label>Họ tên<input {...field('name')} required maxLength={local ? 100 : 120} />{feedback('name')}</label>
        {local ? <label>Email<input {...field('email')} required type="email" maxLength={254} />{feedback('email')}</label> :
          <><dl className="sc-review-fields"><ReviewField label="Email đăng nhập" value={maskedEmail(person.email)} /></dl>
          <label>Số điện thoại<input {...field('phone')} type="tel" maxLength={30} />{feedback('phone')}</label></>}
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Vai trò</legend>
        {PLATFORM_ROLES.map(role => <label key={role}><input type="checkbox" name="roles" value={role} checked={roles.includes(role)} onChange={() => toggle(role)} /> {uiLabel(role)}</label>)}
      </fieldset>
      {invalid && <p role="alert" className="sc-field-error">{invalid}</p>}
      {error && <ApiErrorMessage error={error} />}
      {onAction && <fieldset className="sc-user-editor-actions" disabled={busy}>
        <legend>Trạng thái tài khoản</legend>
        {['ACTIVE', 'SUSPENDED', 'BLOCKED'].includes(person.status) && <button type="button" className="sc-button sc-action-button--secondary" disabled={Boolean(statusReason)} title={statusReason || undefined} onClick={() => onAction('status')}>{person.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt lại'}</button>}
        <button type="button" className="sc-button sc-action-button--danger" disabled={Boolean(removeReason)} title={removeReason || undefined} onClick={() => onAction('delete')}>Xóa người dùng</button>
        {removeReason && !statusReason && <small>{removeReason}</small>}
      </fieldset>}
    </form>
  </AdminReviewDialog>
}

export function UserDecision({ person, action, busy, error, onClose, onConfirm, disabledReason, local = false }) {
  const deleting = action === 'delete', blocking = person.status === 'ACTIVE'
  const title = deleting ? 'Xác nhận xóa người dùng' : blocking ? 'Tạm ngưng người dùng' : 'Kích hoạt lại người dùng'
  const label = deleting ? 'Xác nhận xóa' : blocking ? 'Tạm ngưng' : 'Kích hoạt lại'
  const nextStatus = deleting ? 'DELETED' : blocking ? 'BLOCKED' : 'ACTIVE'
  const help = deleting ? local ? 'Hồ sơ sẽ bị xóa khỏi danh sách.' : 'Tài khoản chuyển sang trạng thái Đã xóa, mọi phiên đăng nhập bị thu hồi và không thể khôi phục tại đây.'
    : blocking ? local ? 'Hồ sơ sẽ chuyển sang trạng thái Tạm ngưng.' : 'Người dùng không thể đăng nhập và các phiên hiện tại sẽ bị thu hồi.'
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
