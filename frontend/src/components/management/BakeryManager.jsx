import React, { useState } from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { useAuth } from '../../context/useAuth.js'
import { loadVendorMembership, loadVendorProfile, vendorManagementService } from '../../services/vendorManagementService.js'
import { memberCanEdit } from '../../services/managementModels.js'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from './ApiState.jsx'
import BakeryOperationsForm from './BakeryOperationsForm.jsx'

export function BakeryProfileForm({ profile, create = false, busy, onSave }) {
  const [patch, setPatch] = useState({})
  return <form onSubmit={(event) => { event.preventDefault(); onSave(patch) }} className={panelClass}><h3 className="text-xl font-bold">{create ? 'Tạo tiệm bánh' : 'Cập nhật hồ sơ tiệm'}</h3><p className="text-sm">{create ? 'Chủ tiệm lấy từ JWT. Backend tạo ID và trạng thái DRAFT.' : 'Chỉ gửi các trường bạn đã sửa. Phone/email không có trong DTO public nên không tự điền giá trị demo.'}</p><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">{[['name', 'Tên tiệm', 180], ['phoneNumber', 'Số điện thoại', 30], ['email', 'Email', 320], ['description', 'Giới thiệu']].map(([key, label, max]) => <label key={key}>{label}<input name={key} type={key === 'email' ? 'email' : 'text'} maxLength={max} required={create && ['name', 'phoneNumber'].includes(key)} defaultValue={profile?.[key] || ''} onChange={(event) => setPatch((current) => ({ ...current, [key]: event.target.value }))} className={inputClass} /></label>)}</fieldset><button disabled={busy || !Object.keys(patch).length} className={buttonClass}>{busy ? 'Đang lưu…' : create ? 'Tạo tiệm' : 'Lưu các trường đã sửa'}</button></form>
}

export function CreateBakery({ onCreated }) {
  const { roles } = useAuth()
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [created, setCreated] = useState(null)
  if (!roles.includes('BAKERY_OWNER')) return <p>Chỉ tài khoản BAKERY_OWNER được tạo tiệm.</p>
  if (created) return <section className={panelClass}><p role="status" className="break-all">Backend đã tạo tiệm {created.name}: {created.id} · {created.status}</p><p>Tiếp tục cấu hình vận hành và gửi duyệt ở hồ sơ phía trên.</p><button type="button" className={buttonClass} onClick={() => setCreated(null)}>Tạo một tiệm khác</button></section>
  return <><BakeryProfileForm create busy={busy} onSave={async (input) => {
    if (busy) return
    setBusy(true); setError(null)
    try { const bakery = await vendorManagementService.createBakery(input); setCreated(bakery); onCreated(bakery) }
    catch (failure) { setError(failure) } finally { setBusy(false) }
  }} />{error && <><ApiErrorMessage error={error} /><p className="text-sm">API tạo tiệm chưa có idempotency. Nếu mất phản hồi, kiểm tra tiệm đã được tạo trước khi gửi lại.</p></>}{created && <p role="status" className="break-all">Backend đã tạo tiệm {created.name}: {created.id} · {created.status}</p>}</>
}

export default function BakeryManager({ bakeryId, initialProfile }) {
  const { user, roles } = useAuth()
  const membership = useCatalogResource(loadVendorMembership, { bakeryId, userId: user.id })
  const profile = useCatalogResource(loadVendorProfile, { bakeryId })
  const [confirmedProfile, setProfile] = useState(initialProfile?.id === bakeryId ? initialProfile : null), [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(''), [revision, setRevision] = useState(0)
  const canEdit = membership.status === 'ready' && memberCanEdit(membership.data, roles)
  const current = confirmedProfile || profile.data
  async function mutate(operation, message) {
    if (busy || !canEdit) return
    setBusy(true); setError(null)
    try { const result = await operation(); if (result?.id === bakeryId) setProfile(result); setNotice(message); setRevision((value) => value + 1); profile.reload(); membership.reload() }
    catch (failure) { setError(failure) } finally { setBusy(false) }
  }
  return <div className="space-y-5"><section className={panelClass}><h2 className="text-xl font-bold text-primary">Hồ sơ cửa hàng</h2><ApiState resource={membership}><p>Quyền quản lý: {membership.data?.memberRole || 'Chưa xác nhận'}.</p></ApiState>
    {profile.status === 'loading' ? <p role="status">Đang tải hồ sơ public…</p> : profile.error?.status === 404 ? <p>Hồ sơ chưa public hoặc không tồn tại. GET public chỉ trả bakery ACTIVE có subscription. Backend chưa có GET hồ sơ quản lý cho tiệm chưa public; không thể đọc trước phone/email/trạng thái/vận hành. OWNER/MANAGER có thể cập nhật trường hồ sơ cần đổi; response PATCH sẽ trả hồ sơ quản lý.</p> : profile.error ? <ApiErrorMessage error={profile.error} retry={profile.reload} /> : null}
    {current && <><h3 className="font-bold">{current.name}</h3><p>{current.description || 'Chưa có mô tả.'}</p>{confirmedProfile?.status && <p>Trạng thái backend xác nhận gần nhất: {confirmedProfile.status}</p>}</>}<button onClick={profile.reload} className="underline">Tải lại hồ sơ public</button>
  </section>{canEdit && <>
    <BakeryProfileForm key={revision} profile={current} busy={busy} onSave={(input) => mutate(() => vendorManagementService.updateBakery(bakeryId, input), 'Backend đã xác nhận cập nhật hồ sơ; đang đọc lại các API hiện có.')} />
    {current?.operations ? <BakeryOperationsForm key={'operations-' + revision} operations={current.operations} busy={busy} onSave={(input) => mutate(async () => {
      const operations = await vendorManagementService.saveOperations(bakeryId, input)
      setProfile((previous) => ({ ...(previous || current), operations }))
      return null
    }, 'Backend đã xác nhận cấu hình vận hành.')} /> : <p>Chưa có snapshot vận hành từ backend để sửa an toàn. Không tự PUT các danh sách rỗng ghi đè cấu hình hiện có.</p>}
    <section className={panelClass}><h3 className="font-bold">Ảnh cửa hàng</h3><p className="text-sm">PNG/JPEG/WebP, từ 1 byte đến 5 MB. {busy ? 'Đang xử lý yêu cầu…' : 'Chọn tệp để upload.'}</p>{['logo', 'cover'].map((kind) => <label key={kind} className="block">{kind === 'logo' ? 'Logo' : 'Ảnh bìa'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} className="mt-2 block max-w-full" onChange={(event) => { const file = event.target.files[0]; event.target.value = ''; if (file) mutate(() => vendorManagementService.uploadBakeryImage(bakeryId, kind, file), 'Backend đã nhận ảnh ' + kind + '. Đang tải lại hồ sơ public.') }} /></label>)}</section>
    {membership.data.memberRole === 'OWNER' && <section className={panelClass}><h3 className="font-bold">Gửi tiệm để duyệt</h3><p>Chỉ bakery DRAFT có địa chỉ chính và khu vực giao hàng hoạt động được gửi duyệt. Admin xác nhận trạng thái, frontend không tự kích hoạt.</p><button disabled={busy || (profile.status === 'ready' && Boolean(profile.data)) || (confirmedProfile?.status && confirmedProfile.status !== 'DRAFT')} className={buttonClass} onClick={() => mutate(() => vendorManagementService.submitBakery(bakeryId), 'Backend đã nhận yêu cầu duyệt tiệm.')}>Gửi yêu cầu duyệt</button></section>}
  </>}{error && <ApiErrorMessage error={error} />}{notice && <p role="status">{notice}</p>}</div>
}
