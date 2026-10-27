import { inputClass } from '../management/ApiState.jsx'

export default function AddressFields({ value, onChange, disabled = false }) {
  return <fieldset disabled={disabled} className="grid min-w-0 gap-3 sm:grid-cols-2">
    {[['title', 'Tên địa chỉ'], ['recipientName', 'Người nhận'], ['recipientPhone', 'Số điện thoại'], ['addressLine', 'Địa chỉ'], ['ward', 'Phường/xã'], ['district', 'Quận/huyện'], ['city', 'Tỉnh/thành']].map(([key, label]) => <label className="min-w-0" key={key}>{label}<input required={key !== 'ward'} maxLength={255} type={key === 'recipientPhone' ? 'tel' : 'text'} autoComplete={key === 'recipientPhone' ? 'tel' : 'off'} placeholder={key === 'title' ? 'Nhà riêng, công ty…' : key === 'addressLine' ? 'Số nhà, tên đường' : undefined} className={inputClass} value={value[key] || ''} onChange={(e) => onChange({ ...value, [key]: e.target.value })} /></label>)}
    <label className="min-w-0 sm:col-span-2">Ghi chú giao hàng (tùy chọn)<textarea maxLength={500} rows={2} className={inputClass} value={value.deliveryNote || ''} onChange={(e) => onChange({ ...value, deliveryNote: e.target.value })} placeholder="Tòa nhà, cổng vào, hướng dẫn tìm nhà…" /></label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={value.primary} onChange={(e) => onChange({ ...value, primary: e.target.checked })} />Địa chỉ mặc định</label>
  </fieldset>
}
