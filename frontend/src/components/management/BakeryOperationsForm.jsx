import { VendorConfirm } from '../common/VendorUi.jsx'
import { ModalFormState } from '../common/ModalSurface.jsx'
import { operationsPayload } from '../../services/managementModels.js'
import React, { useState } from 'react'
import { ApiErrorMessage, inputClass, buttonClass, panelClass } from './ApiState.jsx'

const labels = { addresses: 'Địa chỉ tiệm', serviceAreas: 'Khu vực giao hàng', businessHours: 'Giờ mở cửa' }
const fields = { addresses: ['addressLine', 'ward', 'district', 'city'], serviceAreas: ['city', 'district', 'deliveryFee', 'minimumOrder'] }
const names = { addressLine: 'Địa chỉ', ward: 'Phường/xã', district: 'Quận/huyện', city: 'Tỉnh/thành', deliveryFee: 'Phí giao (VND)', minimumOrder: 'Đơn tối thiểu (VND)' }
const newRow = {
  addresses: { addressLine: '', ward: '', district: '', city: '', isPrimary: false },
  serviceAreas: { city: '', district: '', deliveryFee: '', minimumOrder: '', active: true },
}
const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
const timeFields = { opensAt: ['Giờ mở ', '08:00'], closesAt: ['Giờ đóng ', '20:00'] }
const timeOptions = Array.from({ length: 48 }, (_, i) => String(Math.floor(i / 2)).padStart(2, '0') + (i % 2 ? ':30' : ':00'))
const numeric = field => ['deliveryFee', 'minimumOrder'].includes(field)
const fieldKey = (kind, index, field) => [kind, index, field].join('-')

export default function BakeryOperationsForm({ operations, busy, onSave, sections = Object.keys(labels), footerExternal = false, onConfirmChange, error }) {
  const [values, setValues] = useState(() => structuredClone(operations))
  const [validation, setValidation] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [confirmed, setConfirmed] = useState(false)
  const [removing, setRemoving] = useState(null)
  const clearErrors = () => { setValidation(null); setFieldErrors({}) }
  const update = (kind, index, field, value) => {
    clearErrors()
    setValues(current => ({
      ...current,
      [kind]: current[kind].map((row, position) => {
        if (kind === 'addresses' && field === 'isPrimary' && value) return { ...row, isPrimary: position === index }
        return position === index ? { ...row, [field]: value } : row
      }),
    }))
  }
  const updateHours = (dayOfWeek, patch) => {
    clearErrors()
    setValues(current => {
      const old = current.businessHours.find(item => Number(item.dayOfWeek) === dayOfWeek)
      const row = { dayOfWeek, ...old, ...patch }
      return { ...current, businessHours: [...current.businessHours.filter(item => Number(item.dayOfWeek) !== dayOfWeek), row].sort((a, b) => a.dayOfWeek - b.dayOfWeek) }
    })
  }
  const submit = event => {
    event.preventDefault()
    if (busy || !confirmed) return
    const invalid = {}
    for (const kind of sections) {
      if (kind === 'businessHours') {
        for (const row of values.businessHours) {
          if (!row.closed && (!row.opensAt || !row.closesAt || row.opensAt.padEnd(8, ':00') >= row.closesAt.padEnd(8, ':00'))) invalid[fieldKey(kind, row.dayOfWeek, 'closesAt')] = 'Giờ đóng cửa phải sau giờ mở cửa.'
        }
        continue
      }
      const areas = new Set()
      values[kind].forEach((row, index) => {
        for (const field of fields[kind]) {
          const value = String(row[field] ?? '').trim()
          const key = fieldKey(kind, index, field)
          if (field !== 'ward' && !value) invalid[key] = 'Vui lòng điền thông tin này.'
          else if (numeric(field) && (!Number.isFinite(Number(value)) || Number(value) < 0)) invalid[key] = 'Nhập số tiền lớn hơn hoặc bằng 0.'
        }
        if (kind === 'serviceAreas' && row.city?.trim() && row.district?.trim()) {
          const area = row.city.trim().toLowerCase() + ':' + row.district.trim().toLowerCase()
          if (areas.has(area)) invalid[fieldKey(kind, index, 'district')] = 'Khu vực giao hàng này đã có.'
          areas.add(area)
        }
      })
    }
    setFieldErrors(invalid)
    setValidation(null)
    if (Object.keys(invalid).length) {
      event.currentTarget?.elements.namedItem(Object.keys(invalid)[0])?.focus()
      return
    }
    try {
      operationsPayload(values)
      onSave(values)
    } catch (failure) {
      setValidation(failure)
    }
  }
  const fieldMessage = key => fieldErrors[key] && <span id={key + '-error'} role="alert" className="sc-field-error">{fieldErrors[key]}</span>
  const inputErrorProps = key => ({ name: key, 'aria-invalid': Boolean(fieldErrors[key]), 'aria-describedby': fieldErrors[key] ? key + '-error' : undefined })

  return <form noValidate id={footerExternal ? 'vendor-operations-form' : undefined} className={panelClass} onSubmit={submit}>
    <ModalFormState value={values} busy={busy} />
    {!sections.includes('serviceAreas') && values.serviceAreas.some(row => row.minimumOrder === undefined || row.minimumOrder === null || row.minimumOrder === '') &&
      <p role="alert" className="sc-note">Cần cập nhật giá trị đơn tối thiểu tại mục Địa chỉ &amp; giao hàng trước khi lưu cấu hình. Các thông tin chưa chỉnh sửa sẽ được giữ nguyên.</p>}
    <fieldset disabled={busy} className="space-y-5">
      {sections.map(kind => kind === 'businessHours' ? <section key={kind}>
        <h4 className="font-bold">Giờ mở cửa</h4>
        <table className="sc-opening-hours">
          <thead><tr><th scope="col">Ngày mở cửa</th><th scope="col">Mở cửa</th><th scope="col">Đóng cửa</th></tr></thead>
          <tbody>{days.map((day, i) => {
            const dayOfWeek = i + 1
            const row = values.businessHours.find(item => Number(item.dayOfWeek) === dayOfWeek)
            const open = Boolean(row && !row.closed)
            return <tr key={day}>
              <td><label><input type="checkbox" checked={open} onChange={event => updateHours(dayOfWeek, {
                closed: !event.target.checked,
                opensAt: row?.opensAt || '08:00',
                closesAt: row?.closesAt || '20:00',
              })} /> {day}{!open && <small> · Nghỉ</small>}</label></td>
              {Object.entries(timeFields).map(([field, [label, defaultTime]]) => {
                const time = (row?.[field] || defaultTime).slice(0, 5)
                const choices = timeOptions.includes(time) ? timeOptions : [...timeOptions, time].sort()
                const key = fieldKey(kind, dayOfWeek, field)
                return <td key={field}>
                  <select {...inputErrorProps(key)} aria-label={label + day} className={inputClass} disabled={!open} value={open ? time : ''} onChange={event => updateHours(dayOfWeek, { [field]: event.target.value })}>
                    {!open && <option value="">—</option>}
                    {choices.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                  {fieldMessage(key)}
                </td>
              })}
            </tr>
          })}</tbody>
        </table>
      </section> : <section key={kind} className="space-y-3">
        <h4 className="font-bold">{labels[kind]}</h4>
        {values[kind].map((row, index) => {
          const toggle = kind === 'addresses' ? 'isPrimary' : 'active'
          return <div key={row.id || index} className="grid gap-3 rounded-xl border border-outline-variant/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields[kind].map(field => {
              const key = fieldKey(kind, index, field)
              return <label key={field} className="text-sm">{names[field]}
                <input {...inputErrorProps(key)} required={field !== 'ward'} type={numeric(field) ? 'number' : 'text'}
                  min={numeric(field) ? 0 : undefined} step={numeric(field) ? '0.01' : undefined}
                  maxLength={field === 'addressLine' ? 255 : 120} value={row[field] ?? ''}
                  onChange={event => update(kind, index, field, event.target.value)} className={inputClass} />
                {fieldMessage(key)}
              </label>
            })}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(row[toggle])}
              onChange={event => update(kind, index, toggle, event.target.checked)} />
              {kind === 'addresses' ? 'Địa chỉ chính' : 'Đang phục vụ'}
            </label>
            <button type="button" className="text-left text-sm text-red-700 underline" onClick={() => setRemoving({ kind, index })}>Xóa dòng</button>
          </div>
        })}
        <button type="button" className="text-sm underline" onClick={() => setValues(current => ({ ...current, [kind]: [...current[kind], { ...newRow[kind] }] }))}>Thêm {labels[kind].toLowerCase()}</button>
      </section>)}
      {(error || validation) && <ApiErrorMessage error={validation || error} />}
      <label className="flex items-center gap-2"><input type="checkbox" checked={confirmed} onChange={event => {
        setConfirmed(event.target.checked)
        onConfirmChange?.(event.target.checked)
      }} />Tôi xác nhận thay thế toàn bộ cấu hình bằng các dòng trên.</label>
      <button disabled={!confirmed || busy} className={buttonClass} type="submit" id="vendor-operations-save" hidden={footerExternal}>Lưu cấu hình vận hành</button>
    </fieldset>
    {removing && <VendorConfirm title="Xóa dòng cấu hình" label="Xóa khỏi cấu hình" danger onClose={() => setRemoving(null)} onConfirm={() => {
      setValues(current => ({ ...current, [removing.kind]: current[removing.kind].filter((_, index) => index !== removing.index) }))
      clearErrors()
      setRemoving(null)
    }}><p>Dòng này sẽ được bỏ khỏi cấu hình khi bạn lưu. Các dữ liệu khác được giữ nguyên.</p></VendorConfirm>}
  </form>
}
