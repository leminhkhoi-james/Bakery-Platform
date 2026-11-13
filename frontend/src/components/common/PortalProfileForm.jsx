import React, { useRef, useState } from 'react'
import { api, ApiError } from '../../services/apiClient.js'
import { authService } from '../../services/authService.js'
import { phoneError } from '../../services/contactValidation.js'
import { ApiErrorMessage, inputClass } from '../management/ApiState.jsx'
import { ModalFormState } from './ModalSurface.jsx'

export default function PortalProfileForm({ user, onSaved, onBusy }) {
  const [values, setValues] = useState({ displayName: user.displayName || '', phoneNumber: user.phoneNumber || user.phone || '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const nameError = !values.displayName.trim() || values.displayName.trim().length > 120 ? 'Nhập họ tên từ 1 đến 120 ký tự.' : ''
  const invalidPhone = values.phoneNumber.trim() ? phoneError(values.phoneNumber) : ''
  async function save(event) {
    event.preventDefault()
    if (lock.current || nameError || invalidPhone) return
    lock.current = true
    setBusy(true)
    onBusy(true)
    setError(null)
    try {
      if (authService.getSnapshot().user?.id !== user.id) throw new ApiError('Phiên đăng nhập đã thay đổi. Vui lòng mở lại hồ sơ.', 401)
      const saved = await api.patch('/users/me', {
        displayName: values.displayName.trim(), phoneNumber: values.phoneNumber.trim(),
      }, { allowMockFallback: false })
      if (saved?.id !== user.id) throw new ApiError('Chưa xác nhận được hồ sơ đã cập nhật.', 502)
      await authService.reloadProfile()
      onSaved()
    } catch (failure) {
      setError(failure)
    } finally {
      lock.current = false
      setBusy(false)
      onBusy(false)
    }
  }
  return <form id="portal-profile-form" onSubmit={save} className="space-y-3">
    <ModalFormState value={values} busy={busy} />
    <fieldset disabled={busy} className="grid gap-3">
      <label>Họ tên<input className={inputClass} value={values.displayName} required maxLength={120}
        onChange={event => setValues(current => ({ ...current, displayName: event.target.value }))} aria-invalid={Boolean(nameError)} /></label>
      {nameError && <p className="text-sm text-red-700" role="alert">{nameError}</p>}
      <label>Email<input className={inputClass} value={user.email || ''} readOnly type="email" /></label>
      <label>Số điện thoại<input className={inputClass} type="tel" autoComplete="tel" maxLength={30} value={values.phoneNumber}
        onChange={event => setValues(current => ({ ...current, phoneNumber: event.target.value }))} aria-invalid={Boolean(invalidPhone)} /></label>
      {invalidPhone && <p className="text-sm text-red-700" role="alert">{invalidPhone}</p>}
    </fieldset>
    {error && <ApiErrorMessage error={error} />}
    <button className="sc-button" type="submit" disabled={busy || Boolean(nameError || invalidPhone)}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
  </form>
}
