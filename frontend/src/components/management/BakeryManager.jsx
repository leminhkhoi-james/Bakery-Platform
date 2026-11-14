import { phoneError, emailError } from '../../services/contactValidation.js'
import RecordActionButton from '../common/RecordActionButton.jsx'
import { vendorMoney, vendorAddress } from '../../services/vendorPresentation.js'
import { bakeryReviewText } from '../../services/bakeryReviewModels.js'
import { displayReference } from '../../services/displayReference.js'
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
import { VendorImage } from '../common/VendorUi.jsx'
import { DetailDrawer, Icon, StatusBadge } from '../common/WorkspaceUI.jsx'

export function BakeryProfileForm({ profile, create = false, busy, onSave, footerExternal = false, onDirtyChange, error }) {
  const [patch, setPatch] = useState({}), [errors, setErrors] = useState({})
  const keys = ['name', 'phoneNumber', 'email', 'description']
  const changes = create ? Object.fromEntries(keys.map(key => [key, patch[key] ?? profile?.[key] ?? ''])) : Object.fromEntries(Object.entries(patch).filter(([key, value]) => value !== (profile?.[key] || '')))
  const update = (key, value) => { const next = { ...patch, [key]: value }; setPatch(next); setErrors(previous => ({ ...previous, [key]: '' })); onDirtyChange?.(Object.keys(next).some(field => next[field] !== (profile?.[field] || ''))) }
  const validate = (key, value) => key === 'name' && !value.trim() ? 'Vui lòng nhập tên tiệm.' : key === 'phoneNumber' ? phoneError(value) : key === 'email' ? emailError(value) : ''
  return <form noValidate id={footerExternal ? 'vendor-profile-form' : undefined} onSubmit={event => {
    event.preventDefault()
    const invalid = Object.fromEntries(keys.filter(key => create || Object.hasOwn(changes, key)).map(key => [key, validate(key, changes[key] || '')]).filter(([, message]) => message))
    setErrors(invalid)
    if (Object.keys(invalid).length) { event.currentTarget.querySelector('[name="' + Object.keys(invalid)[0] + '"]')?.focus(); return }
    onSave(changes)
  }} className={panelClass}>
    <ModalFormState value={changes} busy={busy} /><h3>{create ? 'Thông tin tiệm mới' : 'Thông tin cơ bản'}</h3>
    <fieldset disabled={busy} className="sc-vendor-form-grid">{[['name','Tên tiệm',180],['phoneNumber','Số điện thoại',30],['email','Email',320],['description','Mô tả tiệm']].map(([key,label,max]) => <label key={key} className={key === 'description' ? 'sm:col-span-2' : ''}>{label}{['name','phoneNumber'].includes(key) ? ' *' : ''}
      {key === 'description' ? <textarea rows={3} className={inputClass} name={key} value={patch[key] ?? profile?.[key] ?? ''} onChange={event => update(key,event.target.value)} /> : <input name={key} type={key === 'email' ? 'email' : key === 'phoneNumber' ? 'tel' : 'text'} autoComplete={{ name: 'organization', email: 'email', phoneNumber: 'tel' }[key]} maxLength={max} required={['name','phoneNumber'].includes(key)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? 'bakery-' + key + '-error' : undefined} value={patch[key] ?? profile?.[key] ?? ''} onBlur={event => setErrors(previous => ({ ...previous, [key]: validate(key, event.target.value) }))} onChange={event => update(key,event.target.value)} className={inputClass} />}
      {errors[key] && <span role="alert" id={'bakery-' + key + '-error'} className="sc-field-error">{errors[key]}</span>}
    </label>)}</fieldset>
    {error && <ApiErrorMessage error={error} />}
    {!footerExternal && <button disabled={busy || !Object.keys(changes).length} className={buttonClass}>{busy ? 'Đang lưu…' : create ? 'Tiếp tục' : 'Lưu thông tin tiệm'}</button>}
  </form>
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

// Private onboarding DTO omits media; active shops expose signed URLs publicly.
async function loadProfileImages({ bakeryId, status }, options) {
  if (status !== 'ACTIVE') return null
  try {
    return await vendorManagementService.getPublicProfile(bakeryId, options)
  } catch (error) {
    // The public endpoint also returns 404 for active shops without entitlement.
    if (error.status === 404) return null
    throw error
  }
}

function BakeryImages({ images, editable = false, busy, onUpload, onImageError, error, failureTarget }) {
  return <section className="sc-owner-profile-section">
    <h3>Hình ảnh cửa hàng</h3>
    <div className="sc-owner-profile-media">
      {['logo', 'cover'].map(kind => {
        const label = kind === 'logo' ? 'Logo' : 'Ảnh bìa'
        return <div key={kind}>
          <h4>{label}</h4>
          {!editable && <VendorImage src={images[kind]} alt={label} onLoadError={() => onImageError(kind)} />}
          {busy && failureTarget === kind && <p role="status">Đang tải {label.toLowerCase()} lên…</p>}
          {editable && <label className="sc-bakery-image-picker"><VendorImage src={images[kind]} alt={label} onLoadError={() => onImageError(kind)} /><span>Đổi {label.toLowerCase()}</span>
            <input type="file" aria-label={'Tải ' + label.toLowerCase() + ' tiệm'} accept="image/png,image/jpeg,image/webp"
              disabled={busy} className="sr-only" onChange={event => {
                const file = event.target.files[0]
                event.target.value = ''
                if (file) onUpload(kind, file)
              }} />
          </label>}
          {failureTarget === kind && error && <ApiErrorMessage error={error} />}
        </div>
      })}
    </div>
  </section>
}

function BakeryEditor({ profile, operations, locationOptions, images, busy, error, failureTarget, notice, onClose, onSaveProfile, onSaveOperations, onUpload, onImageError }) {
  const [profileVersion, setProfileVersion] = useState(0), [operationsVersion, setOperationsVersion] = useState(0)
  const [section, setSection] = useState('profile')
  const [profileDirty, setProfileDirty] = useState(false)
  const [operationsDirty, setOperationsDirty] = useState(false)
  const sections = [
    ['profile', 'Thông tin tiệm', 'storefront', profileDirty],
    ['operations', 'Vận hành', 'schedule', operationsDirty],
    ['images', 'Hình ảnh', 'image', false],
  ]
  const save = {
    profile: ['vendor-profile-form', 'Lưu thông tin tiệm', profileDirty],
    operations: ['vendor-operations-form', 'Lưu cấu hình vận hành', Boolean(operations && operationsDirty)],
  }[section]

  return <DetailDrawer className="sc-vendor-drawer sc-owner-profile-editor" busy={busy} onClose={onClose}
    headerContent={<div className="sc-owner-editor-heading">
      <h2>Chỉnh sửa hồ sơ tiệm</h2>
      {profile?.name && <p>{cleanPresentationLabel(profile.name)}</p>}
    </div>}
    footer={<>
      {notice && <p role="status" className="sc-owner-editor-notice">{notice}</p>}
      <button type="button" data-modal-close disabled={busy} className={buttonClass + ' sc-action-button--secondary'}>Đóng</button>
      {save && <button type="submit" form={save[0]} disabled={busy || !save[2]} className={buttonClass}>{busy ? 'Đang lưu…' : save[1]}</button>}
    </>}>
    <div className="sc-owner-editor-layout">
      <nav aria-label="Các mục hồ sơ tiệm" className="sc-owner-editor-sidebar">
        {sections.map(([id, label, icon, dirty]) => (
          <button key={id} type="button" aria-pressed={section === id} disabled={busy} onClick={event => {
            setSection(id)
            const body = event.currentTarget.closest('.sc-drawer-body')
            if (body) body.scrollTop = 0
          }}>
            <Icon name={icon} />
            <span>{label}{dirty && <small>Chưa lưu</small>}</span>
          </button>
        ))}
      </nav>
      <div className="sc-owner-editor-content">
    <div hidden={section !== 'profile'}>
      <BakeryProfileForm key={profileVersion} profile={profile} busy={busy} footerExternal onDirtyChange={setProfileDirty}
        error={failureTarget === 'profile' ? error : null} onSave={async input => {
          if (!Object.keys(input).length) return
          if (await onSaveProfile(input)) { setProfileVersion(value => value + 1); setProfileDirty(false) }
        }} />
    </div>
    <div hidden={section !== 'operations'}>
      {operations ? <BakeryOperationsForm key={operationsVersion} operations={operations} locationOptions={locationOptions} busy={busy}
        footerExternal compact onEdited={() => setOperationsDirty(true)} error={failureTarget === 'operations' ? error : null}
        onSave={async input => {
          if (await onSaveOperations(input)) { setOperationsVersion(value => value + 1); setOperationsDirty(false) }
        }} /> : <p>Chưa tải được địa chỉ và giờ mở cửa.</p>}
    </div>
    <div hidden={section !== 'images'}>
      <BakeryImages images={images} editable busy={busy} onUpload={onUpload} onImageError={onImageError} error={error} failureTarget={failureTarget} />
    </div>
      </div>
    </div>
  </DetailDrawer>
}

export default function BakeryManager({ bakeryId, initialProfile, locationOptions, onChanged }) {
  const { user, roles } = useAuth()
  const membership = useCatalogResource(loadVendorMembership, { bakeryId, userId: user.id })
  const profile = useCatalogResource(loadVendorProfile, { bakeryId, includeOnboarding: roles.includes('CUSTOMER') })
  const [confirmedProfile, setProfile] = useState(initialProfile?.id === bakeryId ? initialProfile : null), [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(''), [editor, setEditor] = useState(null)
  const [uploadedImages, setImages] = useState({}), [failureTarget, setFailureTarget] = useState('profile')
  const inFlight = useRef(false)
  const imageRetries = useRef({})
  const canEdit = membership.status === 'ready' && memberCanEdit(membership.data, roles)
  const current = profile.refreshing ? confirmedProfile || profile.data : profile.data || confirmedProfile
  async function mutate(operation, message, target = 'profile') {
    if (busy || inFlight.current || !canEdit) return false
    inFlight.current = true
    setBusy(true); setError(null); setNotice(''); setFailureTarget(target)
    try { const result = await operation(); if (result?.id === bakeryId) setProfile(result); setNotice(message); profile.reload(); membership.reload(); onChanged?.(); return true }
    catch (failure) { setError(failure); return false } finally { inFlight.current = false; setBusy(false) }
  }
  const media = useCatalogResource(loadProfileImages, { bakeryId, status: current?.status })
  const images = Object.fromEntries(['logo', 'cover'].map(kind => {
    const uploaded = uploadedImages[kind]
    const publishedUrl = media.data?.[kind + 'Url']
    const freshUrl = media.data !== uploaded?.previousMedia ? publishedUrl : null
    return [kind, freshUrl || uploaded?.url || publishedUrl]
  }))
  const refreshImage = kind => {
    if (current?.status !== 'ACTIVE' || imageRetries.current[kind]) return
    imageRetries.current[kind] = true
    media.reload()
  }
  const operations = current?.operations
  const primary = operations?.addresses?.find(row => row.isPrimary)
  const closeEditor = () => setEditor(null)
  const saveOperations = input => mutate(async () => {
    const saved = await vendorManagementService.saveOperations(bakeryId, input)
    setProfile(previous => ({ ...(previous || current), operations: saved })); return null
  }, 'Cấu hình vận hành đã được lưu thành công.', 'operations')
  const upload = (kind, file) => mutate(async () => {
    const uploaded = await vendorManagementService.uploadBakeryImage(bakeryId, kind, file)
    imageRetries.current[kind] = false
    setImages(previous => ({ ...previous, [kind]: { ...uploaded, previousMedia: media.data } }))
    media.reload()
    return null
  }, kind === 'logo' ? 'Đã tải logo tiệm.' : 'Đã tải ảnh bìa tiệm.', kind)
  return <div className="sc-panel sc-owner-profile">
    <section className="sc-owner-profile-section"><div className="sc-owner-profile-overview"><VendorImage src={images.logo || current?.logoUrl} alt="Logo tiệm" /><div><h2>{cleanPresentationLabel(current?.name, 'Thông tin tiệm')}</h2><p>{primary ? vendorAddress(primary) : 'Chưa cập nhật địa chỉ chính'}</p>{current?.status && <StatusBadge status={current.status} />}</div>{canEdit && <RecordActionButton className={buttonClass} onClick={() => setEditor('profile')} action="edit" label="Chỉnh sửa hồ sơ" />}</div>
    {profile.status === 'loading' ? <p role="status">Đang tải hồ sơ…</p> : profile.error && <ApiErrorMessage error={profile.error} retry={profile.reload} />}
    {membership.error && <ApiErrorMessage error={membership.error} retry={membership.reload} />}
    {canEdit && current?.status === 'DRAFT' && <div className="sc-toolbar-actions"><p>Hồ sơ đang là bản nháp. Hoàn thiện thông tin, địa chỉ chính và khu vực giao hàng để gửi duyệt.</p><button type="button" className={buttonClass} disabled={busy} onClick={() => setEditor('profile')}>Tiếp tục hồ sơ nháp</button></div>}
    {current?.status === 'SUSPENDED' && <p role="status" className="sc-note">Tiệm đang tạm ngưng. Vui lòng liên hệ quản trị viên để kích hoạt lại.</p>}
    {current?.status === 'CLOSED' && <p role="status" className="sc-note">Tiệm đã đóng. Hệ thống hiện chưa hỗ trợ mở lại hồ sơ này.</p>}
    {current?.status === 'DRAFT' && current.reviewDecision?.status === 'RETURNED' && <p className="sc-note">Hồ sơ đã được trả lại: {publicCopy(bakeryReviewText(current.reviewDecision.reason), 'Chưa có lý do được ghi nhận.')}</p>}
  </section>

    <div className="sc-owner-profile-columns"><div className="sc-owner-profile-main">
    {<section className="sc-owner-profile-section"><h3>Thông tin tiệm</h3><dl className="sc-owner-profile-fields">{[['name','Tên tiệm'],['phoneNumber','Số điện thoại'],['email','Email'],['description','Mô tả tiệm']].map(([key,label]) => <div key={key}><dt>{label}</dt><dd>{publicCopy(current?.[key], 'Chưa cập nhật')}</dd></div>)}</dl></section>}
    {(operations ? <>{['addresses','serviceAreas'].map(kind => <section key={kind} className="sc-owner-profile-section"><div className="sc-toolbar-actions"><h3>{{ addresses: 'Địa chỉ tiệm', serviceAreas: 'Khu vực giao hàng', businessHours: 'Giờ mở cửa' }[kind]}</h3></div>{operations[kind].length ? <ul className="sc-owner-profile-rows">{operations[kind].map((row,index) => <li key={row.id || index} className="sc-owner-operation-row"><div>{kind === 'addresses' ? <><div className="sc-owner-profile-line"><span className="sc-owner-profile-label">{row.isPrimary ? 'Địa chỉ chính:' : 'Địa chỉ ' + (index + 1) + ':'}</span><strong>{vendorAddress(row)}</strong></div></> : <><div className="sc-owner-profile-line"><span className="sc-owner-profile-label">Khu vực:</span><strong>{[row.district,row.city].filter(Boolean).join(', ')}</strong></div><p>Phí giao: {vendorMoney(row.deliveryFee)} · Đơn tối thiểu: {vendorMoney(row.minimumOrder)}</p><span>{row.active ? 'Đang phục vụ' : 'Ngừng phục vụ'}</span></>}</div></li>)}</ul> : <p>Chưa cập nhật</p>}</section>)}</> : <p>Chưa tải được cấu hình vận hành.</p>)}
    </div><div className="sc-owner-profile-aside">
    <BakeryImages images={images} editable={canEdit} busy={busy} onUpload={upload} onImageError={refreshImage} error={!editor ? error : null} failureTarget={failureTarget} />
    {media.error && <ApiErrorMessage error={media.error} retry={media.reload} />}
    <section className="sc-owner-profile-section"><h3>Giờ mở cửa</h3>
      {operations ? <div className="sc-owner-hours">{['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật'].map((day,index) => {
        const row = operations.businessHours.find(item => Number(item.dayOfWeek) === index + 1)
        return <div key={day}><strong>{day}</strong><span>{!row || row.closed ? 'Nghỉ' : row.opensAt && row.closesAt ? row.opensAt.slice(0,5) + ' – ' + row.closesAt.slice(0,5) : 'Chưa cập nhật giờ'}</span></div>
      })}</div> : <p>Chưa tải được giờ mở cửa.</p>}
    </section>
    </div></div>
    {canEdit && membership.data?.memberRole === 'OWNER' && (!current || current.status === 'DRAFT') && <section className="sc-owner-profile-section"><h3>Gửi tiệm để duyệt</h3><p>Cần địa chỉ chính và khu vực giao hàng đang phục vụ trước khi gửi.</p><EntityActionButtons showHeading={false} status={current?.status} busy={busy} refreshing={profile.refreshing} actions={[{ key:'submit', label:'Gửi yêu cầu duyệt', icon:'send', disabled: Boolean(confirmedProfile?.status && confirmedProfile.status !== 'DRAFT'), description:'Gửi hồ sơ tiệm để quản trị viên kiểm tra. Bạn cần địa chỉ chính và khu vực giao hàng hoạt động.' }]} onConfirm={() => mutate(() => vendorManagementService.submitBakery(bakeryId), 'Đã gửi hồ sơ tiệm để duyệt.')} /></section>}
    {editor && canEdit && <BakeryEditor profile={current} operations={operations} locationOptions={locationOptions} images={images} busy={busy} error={error} failureTarget={failureTarget} notice={notice} onClose={closeEditor}
      onSaveProfile={input => mutate(() => vendorManagementService.updateBakery(bakeryId, input), 'Đã lưu thông tin tiệm.')}
      onSaveOperations={saveOperations}
      onUpload={upload} onImageError={refreshImage} />}
    {error && !editor && !['logo', 'cover'].includes(failureTarget) && <ApiErrorMessage error={error} />}{notice && !editor && <p role="status">{notice}</p>}
  </div>
}
