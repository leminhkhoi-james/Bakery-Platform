import { vendorMoney, vendorAddress } from '../../services/vendorPresentation.js'
import { bakeryReviewText } from '../../services/bakeryReviewModels.js'
import { displayReference } from '../../services/displayReference.js'
import RefreshButton from '../common/RefreshButton.jsx'
import EntityActionButtons from '../common/EntityActionButtons.jsx'
import { uiLabel, cleanPresentationLabel, publicCopy } from '../../services/uiLabels.js'
import React, { useRef, useState } from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { useAuth } from '../../context/useAuth.js'
import { loadVendorMembership, loadVendorProfile, vendorManagementService } from '../../services/vendorManagementService.js'
import { memberCanEdit } from '../../services/managementModels.js'
import { ApiErrorMessage, inputClass, buttonClass, panelClass } from './ApiState.jsx'
import BakeryOperationsForm from './BakeryOperationsForm.jsx'
import { ModalFormState } from '../common/ModalSurface.jsx'
import { VendorImage, VendorConfirm } from '../common/VendorUi.jsx'
import { DetailDrawer, Icon, StatusBadge } from '../common/WorkspaceUI.jsx'

export function BakeryProfileForm({ profile, create = false, busy, onSave, footerExternal = false, onDirtyChange }) {
  const [patch, setPatch] = useState({})
  const changes = Object.fromEntries(Object.entries(patch).filter(([key,value]) => create || value !== (profile?.[key] || '')))
  const update = (key,value) => { const next = { ...patch,[key]:value }; setPatch(next); onDirtyChange?.(Object.keys(next).some(field => next[field] !== (profile?.[field] || ''))) }
  return <form id={footerExternal ? 'vendor-profile-form' : undefined} onSubmit={event => { event.preventDefault(); onSave(changes) }} className={panelClass}><ModalFormState value={changes} busy={busy} /><h3>{create ? 'Thông tin tiệm mới' : 'Thông tin cơ bản'}</h3><p className="text-sm">{create ? 'Tiệm mới được lưu thành bản nháp dưới tài khoản chủ tiệm hiện tại.' : 'Chỉ những trường đã thay đổi được lưu lại.'}</p><fieldset disabled={busy} className="sc-vendor-form-grid">{[['name','Tên tiệm',180],['phoneNumber','Số điện thoại',30],['email','Email',320],['description','Mô tả tiệm']].map(([key,label,max]) => <label key={key} className={key === 'description' ? 'sm:col-span-2' : ''}>{label}{create && ['name','phoneNumber'].includes(key) ? ' *' : ''}{key === 'description' ? <textarea rows={3} className={inputClass} name={key} value={patch[key] ?? profile?.[key] ?? ''} onChange={event => update(key,event.target.value)} /> : <input name={key} type={key === 'email' ? 'email' : 'text'} maxLength={max} required={(create || Object.hasOwn(patch,key)) && ['name','phoneNumber'].includes(key)} value={patch[key] ?? profile?.[key] ?? ''} onChange={event => update(key,event.target.value)} className={inputClass} />}</label>)}</fieldset>{!footerExternal && <button disabled={busy || !Object.keys(changes).length} className={buttonClass}>{busy ? 'Đang lưu…' : create ? 'Tạo tiệm' : 'Lưu các trường đã sửa'}</button>}</form>
}

export function CreateBakery({ onCreated, footerExternal = false, onBusy }) {
  const { roles } = useAuth()
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [created, setCreated] = useState(null)
  const createFlight = useRef(false)
  if (!roles.includes('BAKERY_OWNER')) return <p>Chỉ chủ tiệm được tạo cửa hàng.</p>
  if (created) return <section className={panelClass}><p role="status" className="break-all">Đã tạo tiệm {cleanPresentationLabel(created.name, 'Tiệm bánh')}: {displayReference(created.id, 'SHOP')} · {uiLabel(created.status)}</p><p>Tiếp tục cấu hình vận hành và gửi duyệt ở hồ sơ phía trên.</p><button type="button" className={buttonClass} onClick={() => setCreated(null)}>Tạo một tiệm khác</button></section>
  return <><BakeryProfileForm create footerExternal={footerExternal} busy={busy} onSave={async (input) => {
    if (busy || createFlight.current) return
    createFlight.current = true
    setBusy(true); onBusy?.(true); setError(null)
    try { const bakery = await vendorManagementService.createBakery(input); setCreated(bakery); onCreated(bakery) }
    catch (failure) { setError(failure); return false } finally { createFlight.current = false; setBusy(false); onBusy?.(false) }
  }} />{error && <><ApiErrorMessage error={error} /><p className="text-sm">Nếu chưa nhận được phản hồi, hãy kiểm tra danh sách tiệm trước khi gửi lại để tránh tạo trùng.</p></>}{created && <p role="status" className="break-all">Đã tạo tiệm {cleanPresentationLabel(created.name, 'Tiệm bánh')}: {displayReference(created.id, 'SHOP')} · {uiLabel(created.status)}</p>}</>
}

export default function BakeryManager({ bakeryId, initialProfile }) {
  const { user, roles } = useAuth()
  const membership = useCatalogResource(loadVendorMembership, { bakeryId, userId: user.id })
  const profile = useCatalogResource(loadVendorProfile, { bakeryId })
  const [confirmedProfile, setProfile] = useState(initialProfile?.id === bakeryId ? initialProfile : null), [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(''), [revision, setRevision] = useState(0), [tab, setTab] = useState('info'), [editor, setEditor] = useState(null), [deleting, setDeleting] = useState(null), [operationsConfirmed, setOperationsConfirmed] = useState(false), [profileDirty, setProfileDirty] = useState(false)
  const inFlight = useRef(false)
  const canEdit = membership.status === 'ready' && memberCanEdit(membership.data, roles)
  const current = profile.refreshing ? confirmedProfile || profile.data : profile.data || confirmedProfile
  async function mutate(operation, message) {
    if (busy || inFlight.current || !canEdit) return false
    inFlight.current = true
    setBusy(true); setError(null)
    try { const result = await operation(); if (result?.id === bakeryId) setProfile(result); setNotice(message); setRevision((value) => value + 1); profile.reload(); membership.reload(); return true }
    catch (failure) { setError(failure); return false } finally { inFlight.current = false; setBusy(false) }
  }
  const operations = current?.operations
  const primary = operations?.addresses?.find(row => row.isPrimary)
  const closeEditor = () => setEditor(null)
  const saveOperations = input => mutate(async () => {
    const saved = await vendorManagementService.saveOperations(bakeryId, input)
    setProfile(previous => ({ ...(previous || current), operations: saved })); return null
  }, 'Đã lưu cấu hình vận hành.')
  return <div className="space-y-4">
    <section className={panelClass}><div className="sc-owner-profile-overview"><VendorImage src={current?.logoUrl} alt="Logo tiệm" /><div><h2>{cleanPresentationLabel(current?.name, 'Thông tin tiệm')}</h2><p>{primary ? vendorAddress(primary) : 'Chưa cập nhật địa chỉ chính'}</p>{current?.status && <StatusBadge status={current.status} />}</div>{canEdit && <button className={buttonClass} onClick={() => { setProfileDirty(false); setEditor('profile') }}><Icon name="edit" />Chỉnh sửa hồ sơ</button>}</div>
    {profile.status === 'loading' ? <p role="status">Đang tải hồ sơ…</p> : profile.error && <ApiErrorMessage error={profile.error} retry={profile.reload} />}
    {membership.error && <ApiErrorMessage error={membership.error} retry={membership.reload} />}
    {current?.status === 'DRAFT' && current.reviewDecision?.status === 'RETURNED' && <p className="sc-note">Hồ sơ đã được trả lại: {publicCopy(bakeryReviewText(current.reviewDecision.reason), 'Chưa có lý do được ghi nhận.')}</p>}
    <RefreshButton disabled={busy} onClick={profile.reload}>Tải lại hồ sơ</RefreshButton></section>
    <nav className="sc-tabs" aria-label="Hồ sơ tiệm bánh">{[['info','Thông tin tiệm'],['delivery','Địa chỉ & giao hàng'],['hours','Giờ mở cửa'],['images','Hình ảnh']].map(([key,label]) => <button key={key} aria-pressed={tab === key} disabled={busy} onClick={() => setTab(key)}>{label}</button>)}</nav>
    {tab === 'info' && <section className={panelClass}><h3>Thông tin tiệm</h3><dl className="sc-vendor-summary-grid">{[['name','Tên tiệm'],['phoneNumber','Số điện thoại'],['email','Email'],['description','Mô tả tiệm']].map(([key,label]) => <div key={key}><dt>{label}</dt><dd>{publicCopy(current?.[key], 'Chưa cập nhật')}</dd></div>)}</dl></section>}
    {(tab === 'delivery' || tab === 'hours') && (operations ? <>{(tab === 'delivery' ? ['addresses','serviceAreas'] : ['businessHours']).map(kind => <section key={kind} className={panelClass}><div className="sc-toolbar-actions"><h3>{{ addresses: 'Địa chỉ tiệm', serviceAreas: 'Khu vực giao hàng', businessHours: 'Giờ mở cửa' }[kind]}</h3>{canEdit && <button disabled={busy} className={buttonClass} onClick={() => { setOperationsConfirmed(false); setEditor(kind) }}><Icon name="edit" />Chỉnh sửa</button>}</div>{kind === 'businessHours' ? <div className="sc-owner-hours">{['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật'].map((day,i) => { const row = operations.businessHours.find(item => Number(item.dayOfWeek) === i+1); return <div key={day}><strong>{day}</strong><span>{!row ? 'Chưa thiết lập' : row.closed ? 'Nghỉ' : row.opensAt && row.closesAt ? row.opensAt.slice(0,5) + ' – ' + row.closesAt.slice(0,5) : 'Chưa cập nhật giờ'}</span></div> })}</div> : operations[kind].length ? <ul className="space-y-3">{operations[kind].map((row,index) => <li key={row.id || index} className="sc-owner-operation-row"><div>{kind === 'addresses' ? <><strong>{vendorAddress(row)}</strong>{row.isPrimary && <span>Địa chỉ chính</span>}</> : <><strong>{[row.district,row.city].filter(Boolean).join(', ')}</strong><p>Phí giao: {vendorMoney(row.deliveryFee)} · Đơn tối thiểu: {vendorMoney(row.minimumOrder)}</p><span>{row.active ? 'Đang phục vụ' : 'Ngừng phục vụ'}</span></>}</div>{canEdit && <button className="sc-icon-button" disabled={busy} aria-label="Xóa dòng" onClick={() => setDeleting({ kind, index })}><Icon name="delete" /></button>}</li>)}</ul> : <p>Chưa cập nhật</p>}</section>)}</> : <p>Chưa tải được cấu hình vận hành. Vui lòng tải lại hồ sơ trước khi chỉnh sửa.</p>)}
    {tab === 'images' && <section className={panelClass}><h3>Hình ảnh cửa hàng</h3><div className="sc-vendor-form-grid">{['logo','cover'].map(kind => <div key={kind}><h4>{kind === 'logo' ? 'Logo' : 'Ảnh bìa'}</h4><VendorImage src={current?.[kind + 'Url']} alt={kind === 'logo' ? 'Logo' : 'Ảnh bìa'} />{canEdit && <label>Thay ảnh PNG/JPEG/WebP, tối đa 5 MiB<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} className={inputClass} onChange={event => { const file = event.target.files[0]; event.target.value = ''; if (file) mutate(() => vendorManagementService.uploadBakeryImage(bakeryId, kind, file), 'Đã tải ảnh cửa hàng.') }} /></label>}</div>)}</div></section>}
    {canEdit && membership.data?.memberRole === 'OWNER' && (!current || current.status === 'DRAFT') && <section className={panelClass}><h3>Gửi tiệm để duyệt</h3><p>Cần địa chỉ chính và khu vực giao hàng đang phục vụ trước khi gửi.</p><EntityActionButtons showHeading={false} status={current?.status} busy={busy} refreshing={profile.refreshing} actions={[{ key:'submit', label:'Gửi yêu cầu duyệt', icon:'send', disabled: Boolean(confirmedProfile?.status && confirmedProfile.status !== 'DRAFT'), description:'Gửi hồ sơ tiệm để quản trị viên kiểm tra. Bạn cần địa chỉ chính và khu vực giao hàng hoạt động.' }]} onConfirm={() => mutate(() => vendorManagementService.submitBakery(bakeryId), 'Đã gửi hồ sơ tiệm để duyệt.')} /></section>}
    {editor && canEdit && <DetailDrawer className="sc-vendor-drawer" title={editor === 'profile' ? 'Chỉnh sửa hồ sơ tiệm' : { addresses:'Địa chỉ tiệm', serviceAreas:'Khu vực giao hàng', businessHours:'Giờ mở cửa' }[editor]} busy={busy} onClose={closeEditor} footer={<><button type="button" data-modal-close disabled={busy} className="sc-button sc-action-button--secondary">Hủy</button><button form={editor === 'profile' ? 'vendor-profile-form' : 'vendor-operations-form'} type="submit" disabled={busy || (editor === 'profile' ? !profileDirty : !operationsConfirmed)} title={editor !== 'profile' && !operationsConfirmed ? 'Xác nhận thay thế cấu hình trước khi lưu' : undefined} className={buttonClass}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button></>}>
    {editor === 'profile' ? <BakeryProfileForm key={revision} profile={current} onDirtyChange={setProfileDirty} footerExternal busy={busy} onSave={async input => { if (await mutate(() => vendorManagementService.updateBakery(bakeryId,input),'Đã cập nhật hồ sơ.')) closeEditor() }} /> : operations && <BakeryOperationsForm key={revision} operations={operations} sections={[editor]} onConfirmChange={setOperationsConfirmed} footerExternal busy={busy} onSave={async input => { if (await saveOperations(input)) closeEditor() }} />}{error && <ApiErrorMessage error={error} />}</DetailDrawer>}
    {deleting && <VendorConfirm title="Xóa cấu hình đã chọn" label="Xác nhận xóa" danger busy={busy} onClose={() => setDeleting(null)} error={error && <ApiErrorMessage error={error} />} onConfirm={async () => { const input = { ...operations, [deleting.kind]: operations[deleting.kind].filter((_, index) => index !== deleting.index) }; if (await saveOperations(input)) setDeleting(null) }}><p>Dòng được chọn sẽ bị xóa. Các địa chỉ, khu vực và giờ mở cửa khác được giữ nguyên.</p></VendorConfirm>}
    {error && !editor && !deleting && <ApiErrorMessage error={error} />}{notice && <p role="status">{notice}</p>}
  </div>
}
