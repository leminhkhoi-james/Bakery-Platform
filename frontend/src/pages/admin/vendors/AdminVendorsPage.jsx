import React, { useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { DataTable, DetailDrawer, EmptyPanel, SectionHeading, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from '../../../components/management/ApiState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { BAKERY_STATUSES, bakeryTransitions, loadAdminBakeries, loadAdminBakery, publicationAdminService } from '../../../services/publicationAdminService.js'
import { dateTime } from '../../../services/managementModels.js'

const labels = { ACTIVE: 'Duyệt / kích hoạt', DRAFT: 'Trả về bản nháp', SUSPENDED: 'Tạm ngưng', CLOSED: 'Đóng tiệm' }
export function BakeryReview({ id, onChanged, onClose, onNavigate }) {
  const resource = useCatalogResource(loadAdminBakery, { id })
  const [target, setTarget] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(null), [closedConfirmed, setClosedConfirmed] = useState(false)
  const detail = resource.data, bakery = detail?.bakery
  const primary = bakery?.operations?.addresses?.some((item) => item.isPrimary === true)
  const area = bakery?.operations?.serviceAreas?.some((item) => item.active === true)
  return <DetailDrawer title="Hồ sơ duyệt tiệm" onClose={onClose} busy={busy}><section className={panelClass}><h2 className="sr-only">Hồ sơ duyệt tiệm</h2>
    <ApiState resource={resource}>{bakery && <><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-serif text-xl font-semibold text-primary">{bakery.name}</h3><StatusBadge status={bakery.status} /></div><dl className="sc-profile-fields"><div><dt>Mã hồ sơ</dt><dd>{bakery.id}</dd></div><div><dt>Liên hệ</dt><dd>{bakery.phoneNumber} · {bakery.email}</dd></div></dl>{bakery.description && <p className="text-sm text-on-surface-variant">{bakery.description}</p>}
      <p className="sc-note">Địa chỉ chính: {primary ? 'Có' : 'Chưa có'} · Khu vực giao hàng hoạt động: {area ? 'Có' : 'Chưa có'}</p>
      {bakery.operations?.addresses?.map((address, index) => <p key={address.id || index}>{address.addressLine}, {address.ward}, {address.district}, {address.city}{address.isPrimary ? ' (chính)' : ''}</p>)}
      <p>Thành viên: {detail.members?.map((member) => (member.displayNameSnapshot || member.displayName || member.userId) + ' (' + member.memberRole + ', ' + member.status + ')').join('; ') || 'Chưa có dữ liệu'}</p>
      <p className="sc-note">Subscription: {detail.subscription == null ? 'Chưa xác minh được — kiểm tra kết nối Subscription.' : detail.subscription.active ? 'Đang hiệu lực · ' + (detail.subscription.planCode || '') + ' · hết hạn ' + dateTime(detail.subscription.periodEnd) : 'Chưa có hiệu lực. Duyệt tiệm không tự kích hoạt Subscription.'}</p>
      <button className="underline" onClick={() => onNavigate('admin-payments?bakeryId=' + bakery.id)}>Duyệt thanh toán gói dịch vụ</button>
      <form onSubmit={async (event) => { event.preventDefault(); if (busy || !target || (target === 'CLOSED' && !closedConfirmed)) return; setBusy(true); setError(null); try { await publicationAdminService.changeBakeryStatus(bakery, target); setTarget(''); resource.reload(); onChanged() } catch (failure) { setError(failure); resource.reload(); onChanged() } finally { setBusy(false) } }} className="space-y-3">
        <label>Trạng thái cần chuyển<select disabled={busy || !bakeryTransitions(bakery.status).length} value={target} onChange={(event) => { setTarget(event.target.value); setClosedConfirmed(false) }} className={inputClass}><option value="">Chọn thao tác</option>{bakeryTransitions(bakery.status).map((value) => <option key={value} value={value} disabled={value === 'ACTIVE' && bakery.status === 'PENDING_APPROVAL' && !(primary && area)}>{labels[value]} ({value})</option>)}</select></label>
        <p className="text-sm">Chỉ xác nhận sau khi kiểm tra hồ sơ thật. Đóng tiệm CLOSED không có API mở lại; backend kiểm tra lại điều kiện và trạng thái.</p>{target === 'CLOSED' && <label className="flex items-start gap-2"><input required type="checkbox" checked={closedConfirmed} disabled={busy} onChange={(event) => setClosedConfirmed(event.target.checked)} />Tôi xác nhận đóng tiệm CLOSED; hiện không có API mở lại.</label>}<button disabled={busy || !target || (target === 'CLOSED' && !closedConfirmed)} className={buttonClass}>{busy ? 'Đang gửi…' : 'Xác nhận thay đổi'}</button>
      </form></>}</ApiState>{error && <ApiErrorMessage error={error} />}
  </section></DetailDrawer>
}
export default function AdminVendorsPage({ onNavigate }) {
  const [page, setPage] = useState(1), [status, setStatus] = useState(''), [query, setQuery] = useState(''), [city, setCity] = useState(''), [selected, setSelected] = useState(null)
  const resource = useCatalogResource(loadAdminBakeries, { page, size: 20, status, query, city, sort: 'createdAt,desc' })
  const filter = (setter) => (event) => { setter(event.target.value); setPage(1) }
  return <AdminFrame title="Tiệm bánh · Duyệt hồ sơ" activeTab="admin-vendors" onNavigate={onNavigate}>
    <SectionHeading title="Tiệm bánh đối tác" description="Tra cứu hồ sơ, xem điều kiện hoạt động và duyệt trạng thái tiệm." icon="storefront" />
    <section className={panelClass}><div className="grid gap-3 sm:grid-cols-3"><label>Tìm tên tiệm<input value={query} onChange={filter(setQuery)} className={inputClass} /></label><label>Thành phố<input value={city} onChange={filter(setCity)} className={inputClass} /></label><label>Trạng thái<select value={status} onChange={filter(setStatus)} className={inputClass}><option value="">Tất cả</option>{BAKERY_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label></div><button onClick={resource.reload} className="underline">Tải lại danh sách</button>
      <ApiState resource={resource}>{resource.data && <><p>Tổng theo bộ lọc: {resource.data.meta.total}</p>{resource.data.result.length ? <DataTable label="Danh sách hồ sơ tiệm bánh"><thead><tr><th>Tiệm bánh / Mã hồ sơ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{resource.data.result.map((bakery) => <tr key={bakery.id}><td><h2 className="font-semibold text-primary">{bakery.name}</h2><small>{bakery.id}</small></td><td><StatusBadge status={bakery.status} /></td><td><button className={buttonClass} onClick={() => setSelected(bakery.id)}>Xem / duyệt hồ sơ</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Không có tiệm phù hợp từ backend." description="Thử thay đổi bộ lọc để xem các hồ sơ khác." icon="storefront" />}<CatalogPagination meta={resource.data.meta} onPage={setPage} /></>}</ApiState>
    </section>{selected && <BakeryReview key={selected} id={selected} onChanged={resource.reload} onClose={() => setSelected(null)} onNavigate={onNavigate} />}
  </AdminFrame>
}
