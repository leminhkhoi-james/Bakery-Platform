import RecordActionButton from '../../../components/common/RecordActionButton.jsx'
import { useViewportPageSize } from '../../../hooks/useViewportPageSize.js'
import { QuoteWorkspace } from './VendorBespokeQuoteSubmitPage.jsx'
import React, { useId, useState } from 'react'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadVendorRequests, loadVendorOffers, loadVendorRfqLocations } from '../../../services/vendorRfqService.js'
import { loadDashboardAccess } from '../../../services/vendorDashboardService.js'
import { requestTitleWithoutCustomer, rfqStatusLabel, sentOfferStatusLabel } from '../../../services/vendorRfqModels.js'
import { OFFER_STATUSES } from '../../../services/marketplaceModels.js'
import { formatOrderDate, formatOrderMoney } from '../../../services/orderPresentation.js'
import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import { DataTable, DetailDrawer, EmptyPanel, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { VendorRfqState } from './VendorRfqState.jsx'
export { VendorRfqState } from './VendorRfqState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import './vendor-rfq.css'

function RfqTable({ resource, sent, onOpen }) {
  const rows = resource.data?.result
  return <VendorRfqState resource={resource}>
    {rows && (rows.length ? (
      <DataTable label={sent ? 'Báo giá đã gửi' : 'Khám phá yêu cầu'} className="sc-vendor-rfq-table">
        <colgroup>
          <col className="sc-rfq-column-number" /><col className="sc-rfq-column-request" />
          <col className="sc-rfq-column-location" /><col className="sc-rfq-column-status" />
          {sent && <col className="sc-rfq-column-value" />}<col className="sc-rfq-column-value" /><col className="sc-rfq-column-date" />
          <col className="sc-rfq-column-actions" />
        </colgroup>
        <thead><tr>
          <th scope="col">STT</th>
          <th scope="col">Yêu cầu bánh</th>
          <th scope="col">Khu vực giao</th>
          <th scope="col">Trạng thái</th>
          {sent && <th scope="col" className="sc-business-value">Ngân sách</th>}
          <th scope="col" className="sc-business-value">{sent ? 'Giá đã báo' : 'Ngân sách'}</th>
          <th scope="col">{sent ? 'Hiệu lực đến' : 'Cần bánh lúc'}</th>
          <th scope="col" className="sc-table-actions">Thao tác</th>
        </tr></thead>
        <tbody>{rows.map((row, index) => (
          <tr key={row.id}>
            <td>{((resource.data.meta.page || 1) - 1) * (resource.data.meta.pageSize || rows.length) + index + 1}</td>
            <td><strong>{cleanPresentationLabel(requestTitleWithoutCustomer(sent ? row.requestTitle : row.title, row.customerName), sent ? 'Yêu cầu không còn khả dụng' : 'Yêu cầu đặt bánh')}</strong>
              {row.description && <small className="block line-clamp-2">{row.description}</small>}
            </td>
            <td>{[row.deliveryDistrict, row.deliveryCity].filter(Boolean).join(', ') || 'Chưa có địa điểm'}
              {row.servingSize ? <small className="block">Khẩu phần: {row.servingSize} người</small> : null}
            </td>
            <td><StatusBadge status={row.status} label={sent ? sentOfferStatusLabel(row.status, row.expiresAt) : rfqStatusLabel(row.status)} /></td>
            {sent && <td className="sc-business-value">{budget(row)}</td>}
            <td className="sc-business-value">{sent ? formatOrderMoney(row.totalPrice, row.currency || 'VND') : budget(row)}</td>
            <td>{formatOrderDate(sent ? row.expiresAt : row.neededAt)}</td>
            <td className="sc-table-actions"><RecordActionButton type="button" className="sc-button" onClick={() => onOpen(row.id)} action="view" label="Xem chi tiết" /></td>
          </tr>
        ))}</tbody>
      </DataTable>
    ) : <EmptyPanel
      title={sent ? 'Chưa có báo giá phù hợp' : 'Chưa có yêu cầu phù hợp'}
      description={sent ? 'Báo giá đã gửi của tiệm sẽ xuất hiện tại đây.' : 'Yêu cầu mới trong khu vực phục vụ của tiệm sẽ xuất hiện tại đây.'}
      icon={sent ? 'description' : 'request_quote'}
    />)}
  </VendorRfqState>
}
const budget = (row) => row.budgetMin == null && row.budgetMax == null ? 'Chưa có ngân sách' : row.budgetMin != null && row.budgetMax != null ? formatOrderMoney(row.budgetMin, 'VND') + ' – ' + formatOrderMoney(row.budgetMax, 'VND') : row.budgetMin != null ? 'Từ ' + formatOrderMoney(row.budgetMin, 'VND') : 'Đến ' + formatOrderMoney(row.budgetMax, 'VND')

export function VendorRfqWorkspace({ bakery, onNavigate, user, roles }) {
  const [detail, setDetail] = useState(null)
  const openDetail = (key, value) => {
    const query = new URLSearchParams({ [key]: value, bakeryId: bakery.id })
    if (user) setDetail(query)
    else onNavigate('vendor-quote-submit?' + query)
  }
  const navigateDetail = route => {
    const [path, query] = route.split('?')
    if (path !== 'vendor-quote-submit') { onNavigate(route); return }
    const next = new URLSearchParams(query)
    if (next.has('offerId')) {
      setOffers({ page: 1, size: 12, status: '', sort: 'createdAt,desc' })
      setTab('sent')
    }
    setDetail(next)
  }
  const [tab, setTab] = useState('discover')
  const [requests, setRequests] = useState({ page: 1, size: 12, status: '', city: '', district: '', sort: 'createdAt,desc' })
  const [offers, setOffers] = useState({ page: 1, size: 12, status: '', sort: 'createdAt,desc' })
  const id = useId()
  const tabs = <div className="sc-owner-rfq-tabs" role="tablist" aria-label="Yêu cầu và báo giá">{[['discover', 'Khám phá yêu cầu'], ['sent', 'Báo giá đã gửi']].map(([key, label]) => <button key={key} id={id + key} role="tab" aria-selected={tab === key} aria-controls={id + 'panel'} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={(event) => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'discover' : event.key === 'End' ? 'sent' : tab === 'discover' ? 'sent' : 'discover'; setTab(next); document.getElementById(id + next)?.focus() }
  }}>{label}</button>)}</div>
  const sent = tab === 'sent'
  return <section className="sc-panel sc-owner-rfq-content">
    <RfqList key={tab} tabs={tabs} panelId={id + 'panel'} tabId={id + tab} sent={sent} bakery={bakery} filters={sent ? offers : requests} setFilters={sent ? setOffers : setRequests} onOpen={value => openDetail(sent ? 'offerId' : 'cakeRequestId', value)} />
    {detail && <DetailDrawer title={detail.has('offerId') ? 'Chi tiết báo giá' : 'Chi tiết yêu cầu'} className="sc-workspace-detail" onClose={() => setDetail(null)}>
      <QuoteWorkspace bakeryId={bakery.id} user={user} roles={roles} query={detail} onNavigate={navigateDetail} />
    </DetailDrawer>}
  </section>
}

export function RfqList({ bakery, sent, filters, setFilters, onOpen, tabs, panelId, tabId }) {
  const { containerRef, pageSize } = useViewportPageSize(() => setFilters(current => ({ ...current, page: 1 })))
  const resource = useCatalogResource(sent ? loadVendorOffers : loadVendorRequests, sent ? { bakeryId: bakery.id, ...filters, size: pageSize } : { bakery, ...filters, size: pageSize, excludeQuoted: true })
  const locations = useCatalogResource(loadVendorRfqLocations, { bakery })
  const values = locations.data || []
  const cities = [...new Set(values.map(row => row.city))].sort((a, b) => a.localeCompare(b, 'vi'))
  const districts = [...new Set(values.filter(row => !filters.city || row.city === filters.city).map(row => row.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'))
  const field = (key) => ({ value: filters[key] || '', onChange: (event) => setFilters((current) => ({ ...current, [key]: event.target.value, ...(key === 'city' ? { district: '' } : {}), page: 1 })) })
  return <div ref={containerRef}>
    <div className="sc-owner-rfq-toolbar sc-sticky-filter">{tabs}<div className="sc-toolbar sc-owner-rfq-filters">
      <label>Trạng thái<select className="sc-input" {...field('status')}><option value="">Tất cả</option>{(sent ? OFFER_STATUSES : ['OPEN']).map(status => <option key={status} value={status}>{sent ? sentOfferStatusLabel(status) : rfqStatusLabel(status)}</option>)}</select></label>
      <label>Tỉnh/thành<select className="sc-input" {...field('city')} disabled={locations.status === 'loading'}><option value="">Tất cả tỉnh/thành</option>{cities.map(city => <option key={city} value={city}>{city}</option>)}</select></label>
      <label>Quận/huyện<select className="sc-input" {...field('district')} disabled={locations.status === 'loading'}><option value="">Tất cả quận/huyện</option>{districts.map(district => <option key={district} value={district}>{district}</option>)}</select></label>
    </div></div>
    {locations.error && <p role="alert">Chưa tải được danh sách khu vực. Vui lòng thử lại sau.</p>}
    <div role={tabId ? 'tabpanel' : undefined} id={panelId} aria-labelledby={tabId}><RfqTable resource={resource} sent={sent} onOpen={onOpen} />{resource.status === 'ready' && !resource.error && !resource.refreshing && resource.data?.meta.pages > 1 && <CatalogPagination meta={resource.data.meta} onPage={(page) => setFilters((current) => ({ ...current, page }))} />}</div>
  </div>
}

function VerifiedWorkspace({ bakery, user, roles, onNavigate }) {
  const resource = useCatalogResource(loadDashboardAccess, { bakeryId: bakery.id, userId: user.id })
  if (resource.status === 'loading' || resource.error) return <VendorRfqState resource={resource} />
  return <VendorRfqWorkspace bakery={bakery} onNavigate={onNavigate} user={user} roles={roles} />
}
export default function VendorRfqMarketplacePage({ onNavigate, routeSearch = '' }) {
  const owner = useVendorBakery(routeSearch)
  const { bakeryId, user, roles, available, bakery: currentBakery } = owner
  const selectedBakery = currentBakery
  return <VendorFrame owner={owner} title="Yêu cầu báo giá" activeTab="rfq" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-owner-rfq">{selectedBakery ? <VerifiedWorkspace key={user.id + ':' + selectedBakery.id} bakery={selectedBakery} user={user} roles={roles} onNavigate={onNavigate} /> : owner.error ? <VendorRfqState resource={{ status: 'error', error: owner.error, reload: owner.reload }} /> : <p role="status">{owner.state === 'LOADING' || available.status === 'loading' ? 'Đang tải dữ liệu cửa hàng…' : 'Chọn cửa hàng bạn có quyền quản lý để xem yêu cầu và báo giá.'}</p>}</div></VendorFrame>
}
