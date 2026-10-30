import React, { useId, useState } from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadVendorRequests, loadVendorOffers } from '../../../services/vendorRfqService.js'
import { loadDashboardAccess } from '../../../services/vendorDashboardService.js'
import { rfqStatusLabel, sentOfferStatusLabel, vendorRfqError } from '../../../services/vendorRfqModels.js'
import { OFFER_STATUSES } from '../../../services/marketplaceModels.js'
import { formatOrderDate, formatOrderMoney } from '../../../services/orderPresentation.js'
import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import { EmptyPanel, Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import './vendor-rfq.css'

export function VendorRfqState({ resource, children }) {
  if (resource.status === 'loading' || resource.refreshing) return <p role="status" className="sc-rfq-state">Đang tải dữ liệu…</p>
  if (resource.error) return <div role="alert" className="sc-rfq-error"><Icon name={resource.error.status === 403 ? 'lock' : 'info'} /><p>{vendorRfqError(resource.error)}</p>{resource.error.status !== 401 && <RefreshButton onClick={resource.reload}>Thử lại</RefreshButton>}</div>
  return children
}

function Cards({ resource, sent, onOpen }) {
  return <VendorRfqState resource={resource}>{resource.data && (resource.data.result.length ? <div className="sc-owner-rfq-cards">{resource.data.result.map((row) => <article key={row.id} className="sc-owner-rfq-card"><StatusBadge status={row.status} label={sent ? sentOfferStatusLabel(row.status, row.expiresAt) : rfqStatusLabel(row.status)} /><h2>{cleanPresentationLabel(sent ? row.requestTitle : row.title, sent ? 'Yêu cầu không còn khả dụng' : 'Yêu cầu đặt bánh')}</h2>{!sent && <p className="sc-rfq-location"><Icon name="location_on" />{[row.deliveryDistrict, row.deliveryCity].filter(Boolean).join(', ') || 'Chưa có địa điểm'}</p>}<dl><div><dt>{sent ? 'Giá đã báo' : 'Ngân sách'}</dt><dd className={sent ? 'sc-rfq-price' : ''}>{sent ? formatOrderMoney(row.totalPrice, 'VND') : budget(row)}</dd></div><div><dt>{sent ? 'Hiệu lực đến' : 'Cần bánh lúc'}</dt><dd>{formatOrderDate(sent ? row.expiresAt : row.neededAt)}</dd></div></dl><button className="sc-button" onClick={() => onOpen(row.id)}><Icon name="visibility" />Xem chi tiết</button></article>)}</div> : <EmptyPanel title={sent ? 'Chưa có báo giá phù hợp' : 'Chưa có yêu cầu phù hợp'} description={sent ? 'Báo giá đã gửi của tiệm sẽ xuất hiện tại đây.' : 'Yêu cầu mới trong khu vực phục vụ của tiệm sẽ xuất hiện tại đây.'} icon={sent ? 'description' : 'request_quote'} />)}</VendorRfqState>
}
const budget = (row) => row.budgetMin == null && row.budgetMax == null ? 'Chưa có ngân sách' : row.budgetMin != null && row.budgetMax != null ? formatOrderMoney(row.budgetMin, 'VND') + ' – ' + formatOrderMoney(row.budgetMax, 'VND') : row.budgetMin != null ? 'Từ ' + formatOrderMoney(row.budgetMin, 'VND') : 'Đến ' + formatOrderMoney(row.budgetMax, 'VND')

export function VendorRfqWorkspace({ bakery, onNavigate }) {
  const [tab, setTab] = useState('discover')
  const [requests, setRequests] = useState({ page: 1, size: 12, status: '', city: '', district: '', sort: 'createdAt,desc' })
  const [offers, setOffers] = useState({ page: 1, size: 12, status: '', sort: 'createdAt,desc' })
  const id = useId()
  return <section className="sc-panel sc-owner-rfq-content"><div className="sc-owner-rfq-tabs" role="tablist" aria-label="Yêu cầu và báo giá">{[['discover', 'Khám phá yêu cầu'], ['sent', 'Báo giá đã gửi']].map(([key, label]) => <button key={key} id={id + key} role="tab" aria-selected={tab === key} aria-controls={id + 'panel'} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={(event) => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'discover' : event.key === 'End' ? 'sent' : tab === 'discover' ? 'sent' : 'discover'; setTab(next); document.getElementById(id + next)?.focus() }
  }}>{label}</button>)}</div><div role="tabpanel" id={id + 'panel'} aria-labelledby={id + tab}>{tab === 'discover' ? <RfqList bakery={bakery} filters={requests} setFilters={setRequests} onOpen={(requestId) => onNavigate('vendor-quote-submit?cakeRequestId=' + requestId + '&bakeryId=' + bakery.id)} /> : <RfqList sent bakery={bakery} filters={offers} setFilters={setOffers} onOpen={(offerId) => onNavigate('vendor-quote-submit?offerId=' + offerId + '&bakeryId=' + bakery.id)} />}</div></section>
}

function RfqList({ bakery, sent = false, filters, setFilters, onOpen }) {
  const resource = useCatalogResource(sent ? loadVendorOffers : loadVendorRequests, sent ? { bakeryId: bakery.id, ...filters } : { bakery, ...filters })
  const field = (key) => ({ value: filters[key], onChange: (event) => setFilters((current) => ({ ...current, [key]: event.target.value, page: 1 })) })
  return <><div className={'sc-toolbar sc-owner-rfq-filters' + (sent ? ' sc-owner-rfq-sent-filters' : '')}><label>{sent ? 'Trạng thái báo giá' : 'Trạng thái'}<select className="sc-input" {...field('status')}><option value="">Tất cả</option>{(sent ? OFFER_STATUSES : ['OPEN']).map((status) => <option key={status} value={status}>{sent ? sentOfferStatusLabel(status) : rfqStatusLabel(status)}</option>)}</select></label>{!sent && <><label>Tỉnh/thành<input className="sc-input" placeholder="Nhập tỉnh/thành" {...field('city')} /></label><label>Quận/huyện<input className="sc-input" placeholder="Nhập quận/huyện" {...field('district')} /></label></>}<label>Sắp xếp<select className="sc-input" {...field('sort')}><option value="createdAt,desc">Mới nhất</option>{sent ? <><option value="totalPrice,asc">Giá tăng dần</option><option value="expiresAt,asc">Hết hạn sớm nhất</option></> : <><option value="neededAt,asc">Cần giao sớm nhất</option><option value="budgetMin,asc">Ngân sách tăng dần</option><option value="budgetMax,desc">Ngân sách giảm dần</option></>}</select></label></div><div className="sc-owner-rfq-tools"><RefreshButton disabled={resource.status === 'loading' || resource.refreshing} onClick={resource.reload}>Tải lại</RefreshButton></div><Cards resource={resource} sent={sent} onOpen={onOpen} />{resource.status === 'ready' && !resource.error && !resource.refreshing && resource.data?.meta.pages > 1 && <CatalogPagination meta={resource.data.meta} onPage={(page) => setFilters((current) => ({ ...current, page }))} />}</>
}

function VerifiedWorkspace({ bakeryId, userId, onNavigate }) {
  const resource = useCatalogResource(loadDashboardAccess, { bakeryId, userId })
  if (resource.status === 'loading' || resource.error) return <VendorRfqState resource={resource} />
  return <VendorRfqWorkspace bakery={{ id: bakeryId }} onNavigate={onNavigate} />
}
export default function VendorRfqMarketplacePage({ onNavigate, routeSearch = '' }) {
  const { bakeryId, selectBakery, user, available } = useVendorBakery(routeSearch)
  return <VendorFrame title="Yêu cầu báo giá" activeTab="rfq" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-owner-rfq"><BakerySelector bakeryId={bakeryId} onSelect={selectBakery} available={available} />{bakeryId ? <VerifiedWorkspace key={user.id + ':' + bakeryId} bakeryId={bakeryId} userId={user.id} onNavigate={onNavigate} /> : <p role="status">Chọn cửa hàng bạn có quyền quản lý để xem yêu cầu và báo giá.</p>}</div></VendorFrame>
}
