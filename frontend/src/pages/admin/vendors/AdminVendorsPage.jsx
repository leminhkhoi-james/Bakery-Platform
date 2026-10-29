import { isMockRecord } from '../../../mockData/runtime.js'
import { displayReference } from '../../../services/displayReference.js'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import EntityActionButtons from '../../../components/common/EntityActionButtons.jsx'
import { uiLabel, cleanPresentationLabel } from '../../../services/uiLabels.js'
import { useAuth } from '../../../context/useAuth.js'
import React, { useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { DataTable, DetailDrawer, EmptyPanel, Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { ApiState, ApiErrorMessage, inputClass, buttonClass, panelClass } from '../../../components/management/ApiState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { BAKERY_STATUSES, loadAdminBakeries, loadAdminBakery, publicationAdminService } from '../../../services/publicationAdminService.js'
import { bakeryReviewProfile } from '../../../services/bakeryReviewModels.js'
import BakeryReviewProfile from '../../../components/management/BakeryReviewProfile.jsx'

export function BakeryReview({ id, onChanged, onClose, onNavigate }) {
  const resource = useCatalogResource(loadAdminBakery, { id })
  const { roles } = useAuth()
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState(null)
  const [confirmed, setConfirmed] = useState(null)
  const detail = confirmed?.previous === resource.data ? { ...resource.data, bakery: confirmed.bakery } : resource.data
  const bakery = detail?.bakery, profile = bakeryReviewProfile(detail)
  const footer = bakery && <div className="sc-bakery-review-footer"><div className="sc-bakery-review-footer-heading"><h3>Xử lý của Admin</h3><RefreshButton disabled={busy || resource.refreshing} onClick={resource.reload}>Tải lại hồ sơ</RefreshButton></div><p className="sc-bakery-review-muted">{!roles.includes('ADMIN') ? 'Chỉ quản trị viên có quyền xử lý hồ sơ.' : bakery.status === 'DRAFT' ? 'Chủ tiệm cần hoàn thiện và gửi lại hồ sơ trước khi duyệt.' : 'Đối chiếu thông tin và xác nhận trước khi xử lý.'}</p>

      {roles.includes('ADMIN') && <EntityActionButtons compactConfirmation title="Thao tác hồ sơ" showHeading={false} showDisabledReasons status={bakery.status} busy={busy} refreshing={resource.refreshing} actions={profile.actions.map((action) => ({ ...action, reasonHelp: action.key === 'DRAFT' && !isMockRecord(bakery.id) ? 'Lý do dùng để đối chiếu trong lần xử lý này; hiện chưa được lưu cùng hồ sơ hoặc gửi đến chủ tiệm.' : undefined }))} onConfirm={async (target, reason) => {
        const action = profile.actions.find((item) => item.key === target)
        if (busy || resource.refreshing || !roles.includes('ADMIN') || !action || action.disabled || action.reasonRequired && !reason?.trim()) return false
        setBusy(true); setError(null); setNotice(null)
        try {
          const updated = await publicationAdminService.changeBakeryStatus(bakery, target, reason)
          setConfirmed({ previous: resource.data, bakery: updated })
          setNotice({ status: target, message: 'Đã cập nhật trạng thái tiệm: ' + uiLabel(target) + '.' })
          resource.reload(); onChanged?.(); return true
        } catch (failure) { setError(failure); resource.reload(); onChanged?.(); return false }
        finally { setBusy(false) }
      }} />}
      {notice?.status === bakery.status && <p role="status" className="sc-feedback">{notice.message}</p>}
      {error && <ApiErrorMessage error={error} />}
    </div>
  return <DetailDrawer title="Hồ sơ duyệt tiệm" headerContent={<h2>Hồ sơ duyệt tiệm</h2>} className="sc-bakery-review-dialog" footer={footer} onClose={onClose} busy={busy}><ApiState resource={resource}>{bakery && <BakeryReviewProfile bakery={bakery} profile={profile} busy={busy} onPayments={() => { if (!busy) onNavigate('admin-payments?bakeryId=' + bakery.id) }} />}</ApiState></DetailDrawer>
}
export default function AdminVendorsPage({ onNavigate, routeSearch = '' }) {
  const [page, setPage] = useState(1), [status, setStatus] = useState(() => { const value = new URLSearchParams(routeSearch).get('status'); return BAKERY_STATUSES.includes(value) ? value : '' }), [query, setQuery] = useState(''), [city, setCity] = useState(''), [selected, setSelected] = useState(() => new URLSearchParams(routeSearch).get('bakeryId') || null)
  const resource = useCatalogResource(loadAdminBakeries, { page, size: 20, status, query, city, sort: 'createdAt,desc' })
  const filter = (setter) => (event) => { setter(event.target.value); setPage(1) }
  return <AdminFrame activeTab="admin-vendors" onNavigate={onNavigate}>
    <section className={panelClass}><div className="grid gap-3 sm:grid-cols-3"><label>Tìm tên tiệm<input value={query} onChange={filter(setQuery)} className={inputClass} /></label><label>Thành phố<input value={city} onChange={filter(setCity)} className={inputClass} /></label><label>Trạng thái<select value={status} onChange={filter(setStatus)} className={inputClass}><option value="">Tất cả</option>{BAKERY_STATUSES.map((value) => <option key={value} value={value}>{uiLabel(value)}</option>)}</select></label></div><RefreshButton onClick={resource.reload} className="underline">Tải lại danh sách</RefreshButton>
      <ApiState resource={resource}>{resource.data && <><p>Tổng theo bộ lọc: {resource.data.meta.total}</p>{resource.data.result.length ? <DataTable label="Danh sách hồ sơ tiệm bánh"><thead><tr><th>Tiệm bánh / Mã hồ sơ</th><th>Trạng thái</th><th className="sc-table-actions" scope="col">Thao tác</th></tr></thead><tbody>{resource.data.result.map((bakery) => <tr key={bakery.id}><td><h2 className="font-semibold text-primary">{cleanPresentationLabel(bakery.name, 'Tiệm bánh')}</h2><small>{displayReference(bakery.id, 'SHOP')}</small></td><td><StatusBadge status={bakery.status} /></td><td className="sc-table-actions"><button className={buttonClass} onClick={() => setSelected(bakery.id)}><Icon name="fact_check" />Xem / duyệt hồ sơ</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Không có tiệm phù hợp." description="Thử thay đổi bộ lọc để xem các hồ sơ khác." icon="storefront" />}<CatalogPagination meta={resource.data.meta} onPage={setPage} /></>}</ApiState>
    </section>{selected && <BakeryReview key={selected} id={selected} onChanged={resource.reload} onClose={() => setSelected(null)} onNavigate={onNavigate} />}
  </AdminFrame>
}
