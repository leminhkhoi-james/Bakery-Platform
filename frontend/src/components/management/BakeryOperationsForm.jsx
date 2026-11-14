import MoneyInput from '../common/MoneyInput.jsx'
import { VendorConfirm } from '../common/VendorUi.jsx'
import { Icon } from '../common/WorkspaceUI.jsx'
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
const locationFields = new Set(['city', 'district', 'ward'])
const locationKey = value => String(value || '').trim().toLocaleLowerCase('vi')

function LocationField({ field, value, choices, inputProps, onChange }) {
  const [manual, setManual] = useState(false)
  const selected = choices.findIndex(option => locationKey(option) === locationKey(value))
  const editingText = manual || !choices.length || (Boolean(value) && selected < 0)
  const required = field !== 'ward'

  return <div className="sc-operation-location">
    <label>{names[field]}
      {editingText ? <input {...inputProps} required={required} maxLength={120} className={inputClass}
        value={value || ''} onChange={event => onChange(event.target.value)} /> :
        <select {...inputProps} required={required} className={inputClass} value={selected < 0 ? '' : String(selected)} onChange={event => {
          const option = event.target.value
          if (option === 'other') { setManual(true); onChange(''); return }
          onChange(option === '' ? '' : choices[Number(option)])
        }}>
          <option value="">{required ? 'Chọn ' + names[field].toLowerCase() : 'Không chọn'}</option>
          {choices.map((option, index) => <option key={option} value={index}>{option}</option>)}
          <option value="other">Nhập địa danh khác</option>
        </select>}
    </label>
    {editingText && choices.length > 0 && <button type="button" className="text-xs underline" onClick={() => { setManual(false); onChange('') }}>Chọn từ danh sách</button>}
  </div>
}

export default function BakeryOperationsForm({ operations, busy, onSave, onEdited, locationOptions = [], sections = Object.keys(labels), footerExternal = false, compact = false, notice, error }) {
  const [values, setValues] = useState(() => structuredClone(operations))
  const [activeSection, setActiveSection] = useState(sections[0])
  const [validation, setValidation] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [removing, setRemoving] = useState(null)
  const clearErrors = () => { setValidation(null); setFieldErrors({}) }
  const edited = () => { clearErrors(); onEdited?.() }
  const update = (kind, index, field, value) => {
    edited()
    setValues(current => ({
      ...current,
      [kind]: current[kind].map((row, position) => {
        if (kind === 'addresses' && field === 'isPrimary' && value) return { ...row, isPrimary: position === index }
        if (position !== index) return row
        if (field === 'city' && row.city !== value) return { ...row, city: value, district: '', ...(kind === 'addresses' ? { ward: '' } : {}) }
        if (field === 'district' && kind === 'addresses' && row.district !== value) return { ...row, district: value, ward: '' }
        return { ...row, [field]: value }
      }),
    }))
  }
  const updateHours = (dayOfWeek, patch) => {
    edited()
    setValues(current => {
      const old = current.businessHours.find(item => Number(item.dayOfWeek) === dayOfWeek)
      const row = { dayOfWeek, ...old, ...patch }
      return { ...current, businessHours: [...current.businessHours.filter(item => Number(item.dayOfWeek) !== dayOfWeek), row].sort((a, b) => a.dayOfWeek - b.dayOfWeek) }
    })
  }
  const submit = event => {
    event.preventDefault()
    if (busy) return
    const invalid = {}
    for (const kind of sections) {
      if (kind === 'businessHours') {
        for (const row of values.businessHours) {
          const withSeconds = value => value?.length === 5 ? value + ':00' : value
          if (!row.closed && (!row.opensAt || !row.closesAt || withSeconds(row.opensAt) >= withSeconds(row.closesAt))) invalid[fieldKey(kind, row.dayOfWeek, 'closesAt')] = 'Giờ đóng cửa phải sau giờ mở cửa.'
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
          else if (!numeric(field) && value.length > (field === 'addressLine' ? 255 : 120)) invalid[key] = 'Thông tin này vượt quá độ dài cho phép.'
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
      const firstField = Object.keys(invalid)[0]
      const input = event.currentTarget.elements.namedItem(firstField)
      if (compact) {
        setActiveSection(firstField.split('-')[0])
        requestAnimationFrame(() => input?.focus())
      } else {
        input?.focus()
      }
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
    <fieldset disabled={busy} className={compact ? 'space-y-3' : 'space-y-5'}>
      {compact && <nav aria-label="Cấu hình vận hành" className="sc-owner-editor-nav">
        {sections.map(kind => <button key={kind} type="button" aria-pressed={activeSection === kind}
          onClick={() => setActiveSection(kind)}>{labels[kind]}</button>)}
      </nav>}
      {sections.map(kind => kind === 'businessHours' ? <section key={kind} hidden={compact && activeSection !== kind}>
        {!compact && <h4 className="font-bold">Giờ mở cửa</h4>}
        <ul className="sc-opening-hours-list">{days.map((day, i) => {
            const dayOfWeek = i + 1
            const row = values.businessHours.find(item => Number(item.dayOfWeek) === dayOfWeek)
            const open = Boolean(row && !row.closed)
            return <li key={day}>
              <label className="sc-opening-day"><input type="checkbox" checked={open} onChange={event => updateHours(dayOfWeek, {
                closed: !event.target.checked,
                opensAt: row?.opensAt || '08:00',
                closesAt: row?.closesAt || '20:00',
              })} /> {day}</label>
              {!open ? <span>Nghỉ</span> : <div className="sc-opening-time-range">{Object.entries(timeFields).map(([field, [label, defaultTime]]) => {
                const time = (row?.[field] || defaultTime).slice(0, 5)
                const choices = timeOptions.includes(time) ? timeOptions : [...timeOptions, time].sort()
                const key = fieldKey(kind, dayOfWeek, field)
                return <label key={field}><span>{label.trim()}</span>
                  <select {...inputErrorProps(key)} aria-label={label + day} className={inputClass} value={time} onChange={event => updateHours(dayOfWeek, { [field]: event.target.value })}>
                    {choices.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                  {fieldMessage(key)}
                </label>
              })}</div>}
            </li>
          })}</ul>
      </section> : <section key={kind} hidden={compact && activeSection !== kind} className="space-y-3">
        {!compact && <h4 className="font-bold">{labels[kind]}</h4>}
        {values[kind].map((row, index) => {
          const toggle = kind === 'addresses' ? 'isPrimary' : 'active'
          const rowLabel = (kind === 'addresses' ? 'Địa chỉ ' : 'Khu vực giao hàng ') + (index + 1)
          const deleteLabel = 'Xóa ' + rowLabel.toLocaleLowerCase('vi')
          const removeButton = <button type="button" className="sc-icon-button shrink-0" aria-label={deleteLabel}
            title={deleteLabel} onClick={() => setRemoving({ kind, index, rowLabel })}>
            <Icon name="delete_outline" />
          </button>
          return <div key={row.id || index} className="sc-popup-group grid gap-3 rounded-xl border border-outline-variant/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {!compact && <div className="col-span-full flex items-center justify-between gap-3 border-b border-outline-variant/30 pb-2">
              <span className="text-sm font-semibold text-on-surface-variant">{rowLabel}</span>
              {removeButton}
            </div>}
            {fields[kind].map(field => {
              const key = fieldKey(kind, index, field)
              if (locationFields.has(field)) {
                const matching = [...operations.addresses, ...operations.serviceAreas, ...locationOptions]
                  .filter(option => (field === 'city' || locationKey(row.city) === locationKey(option.city)) &&
                    (field !== 'ward' || locationKey(row.district) === locationKey(option.district)))
                const choices = [...new Map(matching.map(option => option[field]?.trim()).filter(Boolean)
                  .map(option => [locationKey(option), option])).values()].sort((a, b) => a.localeCompare(b, 'vi'))
                return <div key={field} className="text-sm"><LocationField
                  key={field === 'city' ? field : JSON.stringify([row.city, field === 'ward' ? row.district : null])}
                  field={field} choices={choices} value={row[field]} inputProps={inputErrorProps(key)}
                  onChange={value => update(kind, index, field, value)} />{fieldMessage(key)}</div>
              }
              const FieldInput = numeric(field) ? MoneyInput : 'input'
              return <label key={field} className="text-sm">{names[field]}
                <FieldInput {...inputErrorProps(key)} required type={numeric(field) ? 'number' : 'text'}
                  min={numeric(field) ? 0 : undefined} step={numeric(field) ? '0.01' : undefined}
                  maxLength={field === 'addressLine' ? 255 : 120} value={row[field] ?? ''}
                  onChange={event => update(kind, index, field, event.target.value)} className={inputClass} />
                {fieldMessage(key)}
              </label>
            })}
            <div className={compact ? 'col-span-full flex items-center justify-between gap-3' : ''}>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(row[toggle])}
                onChange={event => update(kind, index, toggle, event.target.checked)} />
                {kind === 'addresses' ? 'Địa chỉ chính' : 'Đang phục vụ'}
              </label>
              {compact && removeButton}
            </div>
          </div>
        })}
        <button type="button" className="text-sm underline" onClick={() => { edited(); setValues(current => ({ ...current, [kind]: [...current[kind], { ...newRow[kind] }] })) }}>Thêm {labels[kind].toLowerCase()}</button>
      </section>)}
      {(error || validation) && <ApiErrorMessage error={validation || error} />}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={busy} className={buttonClass} type="submit" id="vendor-operations-save" hidden={footerExternal}>Lưu cấu hình vận hành</button>
        {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
      </div>
    </fieldset>
    {removing && <VendorConfirm title={'Xóa ' + removing.rowLabel.toLocaleLowerCase('vi')} label="Xóa khỏi cấu hình" danger onClose={() => setRemoving(null)} onConfirm={() => {
      setValues(current => ({ ...current, [removing.kind]: current[removing.kind].filter((_, index) => index !== removing.index) }))
      edited()
      setRemoving(null)
    }}><p>Thay đổi sẽ được áp dụng khi bạn bấm lưu cấu hình.</p></VendorConfirm>}
  </form>
}
