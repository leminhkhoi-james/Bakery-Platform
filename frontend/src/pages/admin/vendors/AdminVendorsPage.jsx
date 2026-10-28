import { displayReference } from '../../../services/displayReference.js'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import EntityActionButtons from '../../../components/common/EntityActionButtons.jsx'
import { uiLabel } from '../../../services/uiLabels.js'
import { useAuth } from '../../../context/useAuth.js'
import React, { useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { DataTable, DetailDrawer, EmptyPanel, Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from '../../../components/management/ApiState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { BAKERY_STATUSES, bakeryTransitions, loadAdminBakeries, loadAdminBakery, publicationAdminService } from '../../../services/publicationAdminService.js'
import { dateTime } from '../../../services/managementModels.js'

const labels = { ACTIVE: 'Duyệt / kích hoạt', DRAFT: 'Trả về bản nháp', SUSPENDED: 'Tạm ngưng', CLOSED: 'Đóng tiệm' }
export function BakeryReview({ id, onChanged, onClose, onNavigate }) {
  const resource = useCatalogResource(loadAdminBakery, { id })
  const { roles } = useAuth()
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(null)
  const detail = resource.data, bakery = detail?.bakery
  const primary = bakery?.operations?.addresses?.some((item) => item.isPrimary === true)
  const area = bakery?.operations?.serviceAreas?.some((item) => item.active === true)
  return <DetailDrawer title="Hồ sơ duyệt tiệm" onClose={onClose} busy={busy}><section className={panelClass}><h2 className="sr-only">Hồ sơ duyệt tiệm</h2>
    <ApiState resource={resource}>{bakery && <><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-serif text-xl font-semibold text-primary">{bakery.name}</h3><StatusBadge status={bakery.status} /></div><dl className="sc-profile-fields"><div><dt>Mã hồ sơ</dt><dd>{displayReference(bakery.id, 'SHOP')}</dd></div><div><dt>Liên hệ</dt><dd>{bakery.phoneNumber} · {bakery.email}</dd></div></dl>{bakery.description && <p className="text-sm text-on-surface-variant">{bakery.description}</p>}
      <p className="sc-note">Địa chỉ chính: {primary ? 'Có' : 'Chưa có'} · Khu vực giao hàng hoạt động: {area ? 'Có' : 'Chưa có'}</p>
      {bakery.operations?.addresses?.map((address, index) => <p key={address.id || index}>{address.addressLine}, {address.ward}, {address.district}, {address.city}{address.isPrimary ? ' (chính)' : ''}</p>)}
      <p>Thành viên: {detail.members?.map((member) => (member.displayNameSnapshot || member.displayName || displayReference(member.userId, 'USR')) + ' (' + uiLabel(member.memberRole) + ', ' + uiLabel(member.status) + ')').join('; ') || 'Chưa có dữ liệu'}</p>
      <p className="sc-note">Gói dịch vụ: {detail.subscription == null ? 'Chưa tải được thông tin gói dịch vụ.' : detail.subscription.active ? 'Đang hiệu lực · ' + (detail.subscription.planCode || '') + ' · hết hạn ' + dateTime(detail.subscription.periodEnd) : 'Chưa có hiệu lực. Duyệt tiệm không tự kích hoạt gói dịch vụ.'}</p>
      <button className="underline" onClick={() => onNavigate('admin-payments?bakeryId=' + bakery.id)}>Duyệt thanh toán gói dịch vụ</button>
      {roles.includes('ADMIN') && <EntityActionButtons title="Quản lý trạng thái tiệm" status={bakery.status} busy={busy} refreshing={resource.refreshing} actions={bakeryTransitions(bakery.status).map((value) => ({
        key: value, label: labels[value], icon: { ACTIVE: 'verified', DRAFT: 'edit_note', SUSPENDED: 'pause_circle', CLOSED: 'storefront' }[value],
        tone: { ACTIVE: 'primary', DRAFT: 'secondary', SUSPENDED: 'warning', CLOSED: 'danger' }[value],
        disabled: value === 'ACTIVE' && bakery.status === 'PENDING_APPROVAL' && !(primary && area),
        disabledReason: 'Cần địa chỉ chính và khu vực giao hàng hoạt động trước khi duyệt.',
        description: value === 'CLOSED' ? 'Đóng tiệm sẽ dừng hoạt động. Hiện không thể mở lại tiệm đã đóng.' : 'Kiểm tra hồ sơ trước khi chuyển sang trạng thái ' + uiLabel(value).toLocaleLowerCase('vi') + '.',
        confirmText: value === 'CLOSED' ? 'Tôi hiểu rằng tiệm đã đóng sẽ không thể mở lại.' : undefined,
      }))} onConfirm={async (target) => {
        if (busy || !roles.includes('ADMIN')) return false
        setBusy(true); setError(null); setNotice(null)
        try { await publicationAdminService.changeBakeryStatus(bakery, target); setNotice({ status: target, message: 'Đã cập nhật trạng thái tiệm: ' + uiLabel(target) + '.' }); resource.reload(); onChanged?.(); return true }
        catch (failure) { setError(failure); resource.reload(); onChanged?.(); return false }
        finally { setBusy(false) }
      }} />}
      {notice?.status === bakery.status && <p role="status" className="sc-feedback">{notice.message}</p>}</>}</ApiState>{error && <ApiErrorMessage error={error} />}
  </section></DetailDrawer>
}
export default function AdminVendorsPage({ onNavigate, routeSearch = '' }) {
  const [page, setPage] = useState(1), [status, setStatus] = useState(() => { const value = new URLSearchParams(routeSearch).get('status'); return BAKERY_STATUSES.includes(value) ? value : '' }), [query, setQuery] = useState(''), [city, setCity] = useState(''), [selected, setSelected] = useState(() => new URLSearchParams(routeSearch).get('bakeryId') || null)
  const resource = useCatalogResource(loadAdminBakeries, { page, size: 20, status, query, city, sort: 'createdAt,desc' })
  const filter = (setter) => (event) => { setter(event.target.value); setPage(1) }
  return <AdminFrame activeTab="admin-vendors" onNavigate={onNavigate}>
    <section className={panelClass}><div className="grid gap-3 sm:grid-cols-3"><label>Tìm tên tiệm<input value={query} onChange={filter(setQuery)} className={inputClass} /></label><label>Thành phố<input value={city} onChange={filter(setCity)} className={inputClass} /></label><label>Trạng thái<select value={status} onChange={filter(setStatus)} className={inputClass}><option value="">Tất cả</option>{BAKERY_STATUSES.map((value) => <option key={value} value={value}>{uiLabel(value)}</option>)}</select></label></div><RefreshButton onClick={resource.reload} className="underline">Tải lại danh sách</RefreshButton>
      <ApiState resource={resource}>{resource.data && <><p>Tổng theo bộ lọc: {resource.data.meta.total}</p>{resource.data.result.length ? <DataTable label="Danh sách hồ sơ tiệm bánh"><thead><tr><th>Tiệm bánh / Mã hồ sơ</th><th>Trạng thái</th><th className="sc-table-actions" scope="col">Thao tác</th></tr></thead><tbody>{resource.data.result.map((bakery) => <tr key={bakery.id}><td><h2 className="font-semibold text-primary">{bakery.name}</h2><small>{displayReference(bakery.id, 'SHOP')}</small></td><td><StatusBadge status={bakery.status} /></td><td className="sc-table-actions"><button className={buttonClass} onClick={() => setSelected(bakery.id)}><Icon name="fact_check" />Xem / duyệt hồ sơ</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Không có tiệm phù hợp." description="Thử thay đổi bộ lọc để xem các hồ sơ khác." icon="storefront" />}<CatalogPagination meta={resource.data.meta} onPage={setPage} /></>}</ApiState>
    </section>{selected && <BakeryReview key={selected} id={selected} onChanged={resource.reload} onClose={() => setSelected(null)} onNavigate={onNavigate} />}
  </AdminFrame>
}
