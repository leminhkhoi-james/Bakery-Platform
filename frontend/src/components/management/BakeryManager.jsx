import { bakeryReviewText } from '../../services/bakeryReviewModels.js'
import { displayReference } from '../../services/displayReference.js'
import RefreshButton from '../common/RefreshButton.jsx'
import EntityActionButtons from '../common/EntityActionButtons.jsx'
import { uiLabel, cleanPresentationLabel, publicCopy } from '../../services/uiLabels.js'
import React, { useState } from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { useAuth } from '../../context/useAuth.js'
import { loadVendorMembership, loadVendorProfile, vendorManagementService } from '../../services/vendorManagementService.js'
import { memberCanEdit } from '../../services/managementModels.js'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from './ApiState.jsx'
import BakeryOperationsForm from './BakeryOperationsForm.jsx'
import { Icon, StatusBadge } from '../common/WorkspaceUI.jsx'

export function BakeryProfileForm({ profile, create = false, busy, onSave }) {
  const [patch, setPatch] = useState({})
  return <form onSubmit={(event) => { event.preventDefault(); onSave(patch) }} className={panelClass}><h3 className="text-xl font-bold">{create ? 'Tạo tiệm bánh' : 'Cập nhật hồ sơ tiệm'}</h3><p className="text-sm">{create ? 'Tiệm mới được lưu thành bản nháp dưới tài khoản chủ tiệm hiện tại.' : 'Nhập các thông tin cần thay đổi. Những trường để nguyên sẽ được giữ lại.'}</p><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">{[['name', 'Tên tiệm', 180], ['phoneNumber', 'Số điện thoại', 30], ['email', 'Email', 320], ['description', 'Giới thiệu']].map(([key, label, max]) => <label key={key}>{label}<input name={key} type={key === 'email' ? 'email' : 'text'} maxLength={max} required={create && ['name', 'phoneNumber'].includes(key)} defaultValue={profile?.[key] || ''} onChange={(event) => setPatch((current) => ({ ...current, [key]: event.target.value }))} className={inputClass} /></label>)}</fieldset><button disabled={busy || !Object.keys(patch).length} className={buttonClass}>{busy ? 'Đang lưu…' : create ? 'Tạo tiệm' : 'Lưu các trường đã sửa'}</button></form>
}

export function CreateBakery({ onCreated }) {
  const { roles } = useAuth()
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [created, setCreated] = useState(null)
  if (!roles.includes('BAKERY_OWNER')) return <p>Chỉ chủ tiệm được tạo cửa hàng.</p>
  if (created) return <section className={panelClass}><p role="status" className="break-all">Đã tạo tiệm {cleanPresentationLabel(created.name, 'Tiệm bánh')}: {displayReference(created.id, 'SHOP')} · {uiLabel(created.status)}</p><p>Tiếp tục cấu hình vận hành và gửi duyệt ở hồ sơ phía trên.</p><button type="button" className={buttonClass} onClick={() => setCreated(null)}>Tạo một tiệm khác</button></section>
  return <><BakeryProfileForm create busy={busy} onSave={async (input) => {
    if (busy) return
    setBusy(true); setError(null)
    try { const bakery = await vendorManagementService.createBakery(input); setCreated(bakery); onCreated(bakery) }
    catch (failure) { setError(failure); return false } finally { setBusy(false) }
  }} />{error && <><ApiErrorMessage error={error} /><p className="text-sm">Nếu chưa nhận được phản hồi, hãy kiểm tra danh sách tiệm trước khi gửi lại để tránh tạo trùng.</p></>}{created && <p role="status" className="break-all">Đã tạo tiệm {cleanPresentationLabel(created.name, 'Tiệm bánh')}: {displayReference(created.id, 'SHOP')} · {uiLabel(created.status)}</p>}</>
}

export default function BakeryManager({ bakeryId, initialProfile }) {
  const { user, roles } = useAuth()
  const membership = useCatalogResource(loadVendorMembership, { bakeryId, userId: user.id })
  const profile = useCatalogResource(loadVendorProfile, { bakeryId })
  const [confirmedProfile, setProfile] = useState(initialProfile?.id === bakeryId ? initialProfile : null), [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(''), [revision, setRevision] = useState(0)
  const canEdit = membership.status === 'ready' && memberCanEdit(membership.data, roles)
  const current = profile.refreshing ? confirmedProfile || profile.data : profile.data || confirmedProfile
  async function mutate(operation, message) {
    if (busy || !canEdit) return false
    setBusy(true); setError(null)
    try { const result = await operation(); if (result?.id === bakeryId) setProfile(result); setNotice(message); setRevision((value) => value + 1); profile.reload(); membership.reload(); return true }
    catch (failure) { setError(failure) } finally { setBusy(false) }
  }
  return <div className="space-y-5"><section className={panelClass}><h2 className="flex items-center gap-2 text-xl font-bold text-primary"><Icon name="storefront" /> Hồ sơ cửa hàng</h2><ApiState resource={membership}><p>Quyền quản lý: {uiLabel(membership.data?.memberRole, 'Chưa xác nhận')}.</p></ApiState>
    {profile.status === 'loading' ? <p role="status">Đang tải hồ sơ công khai…</p> : profile.error?.status === 404 ? <p>Hồ sơ tiệm chưa được công khai hoặc chưa thể tải. Chủ tiệm có thể cập nhật thông tin cần thay đổi.</p> : profile.error ? <ApiErrorMessage error={profile.error} retry={profile.reload} /> : null}
    {current && <><h3 className="font-bold">{cleanPresentationLabel(current.name, 'Tiệm bánh')}</h3><p>{publicCopy(current.description, 'Chưa có mô tả.')}</p>{current.status && <p>Trạng thái hiện tại: <StatusBadge status={current.status} /></p>}{current.status === 'DRAFT' && current.reviewDecision?.status === 'RETURNED' && <div className="sc-note"><strong>Hồ sơ đã được trả lại</strong><p>Lý do trả hồ sơ: {publicCopy(bakeryReviewText(current.reviewDecision.reason), 'Chưa có lý do được ghi nhận.')}</p></div>}</>}<RefreshButton onClick={profile.reload} className="underline">Tải lại hồ sơ công khai</RefreshButton>
  </section>{canEdit && <>
    <BakeryProfileForm key={revision} profile={current} busy={busy} onSave={(input) => mutate(() => vendorManagementService.updateBakery(bakeryId, input), 'Đã cập nhật hồ sơ. Đang tải lại thông tin.')} />
    {current?.operations ? <BakeryOperationsForm key={'operations-' + revision} operations={current.operations} busy={busy} onSave={(input) => mutate(async () => {
      const operations = await vendorManagementService.saveOperations(bakeryId, input)
      setProfile((previous) => ({ ...(previous || current), operations }))
      return null
    }, 'Đã xác nhận cấu hình vận hành.')} /> : <p>Chưa tải được cấu hình vận hành. Vui lòng tải lại hồ sơ trước khi chỉnh sửa.</p>}
    <section className={panelClass}><h3 className="flex items-center gap-2 font-bold"><Icon name="add_photo_alternate" /> Ảnh cửa hàng</h3><p className="text-sm">PNG/JPEG/WebP, từ 1 byte đến 5 MB. {busy ? 'Đang xử lý yêu cầu…' : 'Chọn tệp để tải lên.'}</p>{['logo', 'cover'].map((kind) => <label key={kind} className="block">{kind === 'logo' ? 'Logo' : 'Ảnh bìa'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} className="mt-2 block w-full rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low p-4 text-sm" onChange={(event) => { const file = event.target.files[0]; event.target.value = ''; if (file) mutate(() => vendorManagementService.uploadBakeryImage(bakeryId, kind, file), 'Đã tải ảnh ' + (kind === 'logo' ? 'logo' : 'bìa') + '. Đang tải lại hồ sơ.') }} /></label>)}</section>
    {membership.data.memberRole === 'OWNER' && <section className={panelClass}><h3 className="flex items-center gap-2 font-bold"><Icon name="task_alt" /> Gửi tiệm để duyệt</h3><p>Chỉ tiệm ở trạng thái bản nháp, có địa chỉ chính và khu vực giao hàng hoạt động mới được gửi duyệt.</p><EntityActionButtons title="Gửi hồ sơ tiệm" status={current?.status} busy={busy} refreshing={profile.refreshing} actions={[{ key: 'submit', label: 'Gửi yêu cầu duyệt', icon: 'send', disabled: (profile.status === 'ready' && Boolean(profile.data)) || Boolean(confirmedProfile?.status && confirmedProfile.status !== 'DRAFT'), description: 'Gửi hồ sơ tiệm để quản trị viên kiểm tra. Bạn cần địa chỉ chính và khu vực giao hàng hoạt động.' }]} onConfirm={() => mutate(() => vendorManagementService.submitBakery(bakeryId), 'Đã gửi hồ sơ tiệm để duyệt.')} /></section>}
  </>}{error && <ApiErrorMessage error={error} />}{notice && <p role="status">{notice}</p>}</div>
}
