import React, { useState } from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import { ApiErrorMessage, inputClass, panelClass } from '../../../components/management/ApiState.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { rfqService, loadRfq, loadOffer } from '../../../services/rfqService.js'
import { loadVendorMembership } from '../../../services/vendorManagementService.js'
import { memberCanEdit } from '../../../services/managementModels.js'
import { requestAcceptsOffers, pendingOffer } from '../../../services/marketplaceModels.js'
import MarketplaceState from '../../../components/marketplace/MarketplaceState.jsx'
import { RequestInfo } from '../../../components/marketplace/MarketplaceViews.jsx'
import { useMarketplaceAction } from '../../../hooks/useMarketplaceAction.js'
import OfferForm, { OfferInfo } from '../../../components/marketplace/OfferForm.jsx'
import ConfirmAction from '../../../components/common/ConfirmAction.jsx'

function NewOffer({ id, bakeryId, onNavigate }) {
  const resource = useCatalogResource(loadRfq, { id }), action = useMarketplaceAction(resource.reload)
  return <><MarketplaceState resource={resource}>{resource.data && <><RequestInfo request={resource.data} /><p>OWNER có thể gửi theo quyền backend; cần membership ACTIVE và subscription hợp lệ. Thời gian hoàn thành và hạn báo giá không vượt ngày cần bánh.</p><OfferForm key={bakeryId} bakeryId={bakeryId} disabled={!requestAcceptsOffers(resource.data) || (!!resource.data.targetBakeryId && resource.data.targetBakeryId !== bakeryId)} busy={action.busy} onSave={(input) => action.run(async () => { const offer = await rfqService.submitOffer(id, input); onNavigate('vendor-quote-submit?offerId=' + offer.id + '&bakeryId=' + bakeryId) })} /></>}</MarketplaceState>{action.error && <ApiErrorMessage error={action.error} retry={resource.reload} />}</>
}
function ManageOffer({ id, bakeryId, user, roles }) {
  const resource = useCatalogResource(loadOffer, { id }), membership = useCatalogResource(loadVendorMembership, { bakeryId, userId: user.id })
  const action = useMarketplaceAction(resource.reload), [reason, setReason] = useState('')
  const canEdit = membership.status === 'ready' && memberCanEdit(membership.data, roles)
  return <><MarketplaceState resource={resource}>{resource.data && (resource.data.bakeryId === bakeryId ? <><OfferInfo offer={resource.data} /><p>Sửa/rút báo giá chỉ dành cho OWNER, PENDING chưa hết hạn. Backend kiểm tra lại trạng thái RFQ và reservation.</p>{canEdit && pendingOffer(resource.data) ? <><OfferForm key={resource.data.updatedAt} bakeryId={bakeryId} offer={resource.data} busy={action.busy} onSave={(input) => action.run(() => rfqService.updateOffer(id, input))} /><section className={panelClass}><label>Lý do rút báo giá<input className={inputClass} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} /></label><ConfirmAction key={id} label="Rút báo giá" description="Xác nhận rút báo giá PENDING này." busy={action.busy} onConfirm={() => action.run(() => rfqService.withdrawOffer(id, reason))} /></section></> : <p>Không có quyền sửa/rút hoặc trạng thái báo giá không cho phép.</p>}</> : <p role="alert">Báo giá không thuộc cửa hàng đang chọn.</p>)}</MarketplaceState>{membership.error && membership.error.status !== 403 && <ApiErrorMessage error={membership.error} retry={membership.reload} />}{action.error && <ApiErrorMessage error={action.error} retry={resource.reload} />}</>
}
export default function VendorBespokeQuoteSubmitPage({ routeSearch = '', onNavigate }) {
  const { bakeryId, selectBakery, user, roles } = useVendorBakery(routeSearch), query = new URLSearchParams(routeSearch)
  return <VendorFrame title="Chi tiết RFQ / báo giá" activeTab="rfq" bakeryId={bakeryId} onNavigate={onNavigate}><button className="underline" onClick={() => onNavigate('vendor-rfq' + (bakeryId ? '?bakeryId=' + bakeryId : ''))}>← Marketplace</button><BakerySelector bakeryId={bakeryId} onSelect={selectBakery} />{bakeryId ? query.get('offerId') ? <ManageOffer key={bakeryId + query.get('offerId')} id={query.get('offerId')} bakeryId={bakeryId} user={user} roles={roles} /> : query.get('cakeRequestId') ? <NewOffer key={bakeryId + query.get('cakeRequestId')} id={query.get('cakeRequestId')} bakeryId={bakeryId} onNavigate={onNavigate} /> : <p>Chọn RFQ thật từ Marketplace trước khi báo giá.</p> : <p>Chọn bakeryId thật để xem yêu cầu và gửi báo giá.</p>}<button className="underline" onClick={() => onNavigate('vendor-chat' + (bakeryId ? '?bakeryId=' + bakeryId : ''))}>Mở hộp thư thật của tiệm</button></VendorFrame>
}
