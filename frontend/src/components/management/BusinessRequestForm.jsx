import MoneyInput from '../common/MoneyInput.jsx'
import React, { useState } from 'react'
import { DetailDrawer } from '../common/WorkspaceUI.jsx'
import { inputClass } from './ApiState.jsx'

export default function BusinessRequestForm({ customers, onSave, onClose, error }) {
  const [busy, setBusy] = useState(false)
  const [values, setValues] = useState(() => ({ customerId: customers[0]?.id || '', title: '', description: '', budgetMin: '400000', budgetMax: '900000', neededAt: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16), offerDeadline: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16) }))
  const field = key => ({ value: values[key], onChange: event => setValues({ ...values, [key]: event.target.value }) })
  return <DetailDrawer title="Thêm yêu cầu bánh" onClose={onClose} busy={busy}><form className="space-y-4" onSubmit={async event => { event.preventDefault(); if (busy) return; setBusy(true); try { await onSave(values) } finally { setBusy(false) } }}>
    <label>Khách hàng<select aria-label="Khách hàng yêu cầu" className={inputClass} {...field('customerId')}>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
    <label>Tiêu đề yêu cầu<input required maxLength={180} className={inputClass} {...field('title')} /></label><label>Mô tả mong muốn<textarea className={inputClass} {...field('description')} /></label>
    <label>Ngân sách từ<MoneyInput min="0" required className={inputClass} {...field('budgetMin')} /></label><label>Ngân sách đến<MoneyInput min={values.budgetMin} required className={inputClass} {...field('budgetMax')} /></label>
    <label>Ngày cần bánh<input type="datetime-local" required className={inputClass} {...field('neededAt')} /></label><label>Hạn nhận báo giá<input type="datetime-local" required className={inputClass} {...field('offerDeadline')} /></label>
    {error && <p role="alert">{error}</p>}<button className="sc-button" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu yêu cầu'}</button>
  </form></DetailDrawer>
}
