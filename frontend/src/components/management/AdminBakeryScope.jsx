import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { readDashboardPages } from '../../services/adminDashboardService.js'
import { loadAdminBakeries } from '../../services/publicationAdminService.js'
import { cleanPresentationLabel } from '../../services/uiLabels.js'

const loadScopes = (_params, options) => readDashboardPages(loadAdminBakeries, options)

export default function AdminBakeryScope({ value, onChange }) {
  const bakeries = useCatalogResource(loadScopes)
  const rows = bakeries.data?.rows || []

  return <label className="sc-admin-bakery-scope">
    <span>Phạm vi</span>
    <select className="sc-owner-header-shop" aria-label="Phạm vi tiệm" value={value}
      onChange={event => onChange(event.target.value)}>
      <option value="">Toàn hệ thống</option>
      {rows.map(shop => <option key={shop.id} value={shop.id}>{cleanPresentationLabel(shop.name, 'Tiệm bánh')}</option>)}
    </select>
    {bakeries.error && <button type="button" className="underline" aria-label="Tải lại danh sách tiệm" onClick={bakeries.reload}>Thử lại</button>}
  </label>
}
