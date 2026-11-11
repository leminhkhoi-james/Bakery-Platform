import RecordActionButton from '../../../components/common/RecordActionButton.jsx'
import { unifiedEnabled, recordSource, localBakeryFor } from '../../../services/unifiedDataService.js'
import React, { useState } from 'react'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
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
import { VendorConfirm } from '../../../components/common/VendorUi.jsx'
import { DetailDrawer, Icon } from '../../../components/common/WorkspaceUI.jsx'
import { ModalFormState } from '../../../components/common/ModalSurface.jsx'
import { loadVendorRfqAccess, loadExistingVendorOffer } from '../../../services/vendorRfqService.js'
import { requestMatchesBakery } from '../../../services/vendorRfqModels.js'
import { VendorRfqState } from './VendorRfqState.jsx'
import { loadDashboardAccess } from '../../../services/vendorDashboardService.js'
import { loadBakerySubscription } from '../../../services/subscriptionService.js'

function NewOffer({ id, bakery, onNavigate }) {
  const bakeryId = bakery.id
  const resource = useCatalogResource(loadRfq, { id }), existing = useCatalogResource(loadExistingVendorOffer, { bakeryId, cakeRequestId: id }), action = useMarketplaceAction(resource.reload)
  const subscription = useCatalogResource(loadBakerySubscription, { bakeryId })
  const localRequest = unifiedEnabled() && recordSource({ id }) === 'local'
  const matchingBakery = localRequest ? localBakeryFor(bakeryId) : bakery
  const canQuote = localRequest ? matchingBakery?.status === 'ACTIVE' : subscription.status === 'ready' && !subscription.error && subscription.data?.currentSubscription?.status === 'ACTIVE'
  const blockReason = resource.data && (!requestAcceptsOffers(resource.data) ? 'Yêu cầu đã đóng hoặc hết hạn nhận báo giá.'
    : !matchingBakery || !requestMatchesBakery(resource.data, matchingBakery) ? 'Yêu cầu nằm ngoài khu vực phục vụ của tiệm.' : '')
  const ready = existing.status === 'ready' && !existing.error && !existing.refreshing
  return (
    <>
      <VendorRfqState resource={resource}>
        {resource.data && (
          <div className="sc-quote-workspace-layout">
            <div className="sc-quote-side-request">
              <RequestInfo request={resource.data} compact />
            </div>
            <div className="sc-quote-side-form space-y-4">
              <VendorRfqState resource={existing}>
                {ready && (existing.data ? (
                  <section className={panelClass}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-green-600">check_circle</span>
                      <h3 className="font-bold text-base text-primary">Tiệm đã gửi báo giá cho yêu cầu này</h3>
                    </div>
                    <p className="text-sm text-stone-600 mb-4">Bạn có thể xem chi tiết hoặc chỉnh sửa mức giá đã báo cho khách hàng.</p>
                    <RecordActionButton className="sc-button" onClick={() => onNavigate('vendor-quote-submit?offerId=' + existing.data.id + '&bakeryId=' + bakeryId)} action="view" label="Xem báo giá đã gửi" />
                  </section>
                ) : (
                  <>
                    {!localRequest && subscription.status === 'loading' ? <p role="status">Đang kiểm tra gói dịch vụ…</p> : !localRequest && subscription.error ? <ApiErrorMessage error={subscription.error} retry={subscription.reload} /> : !canQuote && <section className={panelClass}><p>Tiệm cần gói dịch vụ đang hiệu lực để gửi báo giá. Đơn mua gói đang chờ thanh toán hoặc duyệt chưa kích hoạt quyền này.</p><button className="sc-button" onClick={() => onNavigate('vendor-subscription?bakeryId=' + bakeryId)}>Kiểm tra gói dịch vụ</button></section>}
                    {blockReason && <p role="status">{blockReason}</p>}
                    <OfferForm
                      key={bakeryId}
                      bakeryId={bakeryId}
                      request={resource.data}
                      source={unifiedEnabled() ? recordSource({ id }) : undefined}
                      disabled={!canQuote || Boolean(blockReason)}
                      busy={action.busy}
                      onSave={(input) => canQuote && action.run(async () => {
                        const found = await loadExistingVendorOffer({ bakeryId, cakeRequestId: id })
                        if (found) { onNavigate('vendor-quote-submit?offerId=' + found.id + '&bakeryId=' + bakeryId); return }
                        const offer = await rfqService.submitOffer(id, input)
                        if (offer.bakeryId !== bakeryId || offer.cakeRequestId !== id || offer.status !== 'PENDING') throw Object.assign(new Error('Chưa xác nhận được báo giá.'), { status: 502 })
                        onNavigate('vendor-quote-submit?offerId=' + offer.id + '&bakeryId=' + bakeryId)
                      })}
                    />
                  </>
                ))}
              </VendorRfqState>
            </div>
          </div>
        )}
      </VendorRfqState>
      {action.error && <ApiErrorMessage error={action.error} retry={existing.reload} />}
    </>
  )
}

function RelatedOfferRequest({ id }) {
  const resource = useCatalogResource(loadRfq, { id })
  return <VendorRfqState resource={resource}>{resource.data && <RequestInfo request={resource.data} compact />}</VendorRfqState>
}
export function ManageOffer({ id, bakeryId, user, roles }) {
  const resource = useCatalogResource(loadOffer, { id }), membership = useCatalogResource(loadVendorMembership, { bakeryId, userId: user.id })
  const action = useMarketplaceAction(resource.reload), [reason, setReason] = useState(''), [editing, setEditing] = useState(false), [withdrawing, setWithdrawing] = useState(false)
  const canEdit = membership.status === 'ready' && !membership.error && memberCanEdit(membership.data, roles)
  const allowed = Boolean(resource.data && canEdit && pendingOffer(resource.data))
  return (
    <>
      <MarketplaceState resource={resource}>
        {resource.data && (resource.data.bakeryId === bakeryId ? (
          <div className="sc-quote-workspace-layout">
            <div className="sc-quote-side-request">
              {resource.data.cakeRequestId && <RelatedOfferRequest id={resource.data.cakeRequestId} />}
            </div>
            <div className="sc-quote-side-form space-y-4">
              <OfferInfo offer={resource.data} owner />
              {membership.status === 'loading' ? (
                <p role="status">Đang xác minh quyền thao tác…</p>
              ) : membership.error ? (
                <ApiErrorMessage error={membership.error} retry={membership.reload} />
              ) : allowed ? (
                <div className="sc-actions">
                  <RecordActionButton className="sc-button" disabled={action.busy} onClick={() => setEditing(true)} action="edit" label="Sửa báo giá" />
                  <button className="sc-button sc-action-button--secondary" disabled={action.busy} onClick={() => setWithdrawing(true)}>
                    <Icon name="undo" />Rút báo giá
                  </button>
                </div>
              ) : (
                <p role="status" className="text-sm text-stone-600">
                  {!canEdit
                    ? 'Bạn không có quyền chỉnh sửa báo giá của tiệm.'
                    : resource.data.status === 'PENDING'
                      ? 'Báo giá đã hết thời hạn phản hồi.'
                      : 'Báo giá ' + ({ ACCEPTED: 'đã được khách chấp nhận', REJECTED: 'đã bị từ chối', WITHDRAWN: 'đã được rút', EXPIRED: 'đã hết hạn' }[resource.data.status] || 'không còn ở trạng thái chờ') + ', không thể sửa hoặc rút.'}
                </p>
              )}
            </div>
            {editing && allowed && (
              <DetailDrawer
                className="sc-vendor-drawer"
                title="Sửa báo giá"
                footer={
                  <>
                    <button type="button" data-modal-close disabled={action.busy} className="sc-button sc-action-button--secondary">Hủy</button>
                    <button type="submit" form="vendor-offer-form" disabled={action.busy} className="sc-button">{action.busy ? 'Đang lưu…' : 'Lưu báo giá'}</button>
                  </>
                }
                busy={action.busy}
                onClose={() => setEditing(false)}
              >
                <ModalFormState value={reason} busy={action.busy} />
                <OfferForm source={unifiedEnabled() ? recordSource({ id }) : undefined} footerExternal key={resource.data.updatedAt} bakeryId={bakeryId} offer={resource.data} busy={action.busy} onSave={async (input) => { await action.run(async () => { await rfqService.updateOffer(id, input); setEditing(false) }) }} />
                {action.error && <ApiErrorMessage error={action.error} />}
              </DetailDrawer>
            )}
            {withdrawing && allowed && (
              <VendorConfirm
                title="Rút báo giá"
                label="Xác nhận rút báo giá"
                danger
                guardChanges
                busy={action.busy}
                onClose={() => { setWithdrawing(false); setReason('') }}
                error={action.error && <ApiErrorMessage error={action.error} />}
                onConfirm={async () => { await action.run(async () => { await rfqService.withdrawOffer(id, reason); setWithdrawing(false); setReason('') }) }}
              >
                <p>Khách hàng sẽ không thể chọn báo giá này sau khi rút.</p>
                <label>Lý do rút báo giá (tùy chọn)<textarea className={inputClass} maxLength={2000} rows={3} value={reason} onChange={event => setReason(event.target.value)} /></label>
              </VendorConfirm>
            )}
          </div>
        ) : (
          <p role="alert">Báo giá không thuộc cửa hàng đang chọn.</p>
        ))}
      </MarketplaceState>
      {action.error && !editing && !withdrawing && <ApiErrorMessage error={action.error} retry={resource.reload} />}
    </>
  )
}
export function QuoteWorkspace({ bakeryId, user, roles, query, onNavigate }) {
  const access = useCatalogResource(query.get('offerId') ? loadDashboardAccess : loadVendorRfqAccess, { bakeryId, userId: user.id, includeOnboarding: roles.includes('CUSTOMER') })
  if (access.status === 'loading' || access.error) return <VendorRfqState resource={access} />
  return query.get('offerId') ? <ManageOffer key={bakeryId + query.get('offerId')} id={query.get('offerId')} bakeryId={bakeryId} user={user} roles={roles} /> : query.get('cakeRequestId') ? <NewOffer key={bakeryId + query.get('cakeRequestId')} id={query.get('cakeRequestId')} bakery={access.data} onNavigate={onNavigate} /> : <p>Chọn một yêu cầu để xem chi tiết và gửi báo giá.</p>
}
export default function VendorBespokeQuoteSubmitPage({ routeSearch = '', onNavigate }) {
  const owner = useVendorBakery(routeSearch)
  const { bakeryId, user, roles } = owner, query = new URLSearchParams(routeSearch)
  return <VendorFrame owner={owner} title={query.get('offerId') ? 'Chi tiết báo giá' : 'Chi tiết yêu cầu'} activeTab="rfq" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-actions"><button className="sc-button sc-action-button--secondary" onClick={() => onNavigate('vendor-rfq' + (bakeryId ? '?bakeryId=' + bakeryId : ''))}><Icon name="arrow_back" />Quay lại danh sách</button><button className="sc-button sc-action-button--secondary" onClick={() => onNavigate('vendor-chat' + (bakeryId ? '?bakeryId=' + bakeryId : ''))}><Icon name="chat" />Mở hộp thư của tiệm</button></div><DetailDrawer title={query.get('offerId') ? 'Chi tiết báo giá' : 'Chi tiết yêu cầu'} onClose={() => onNavigate('vendor-rfq' + (bakeryId ? '?bakeryId=' + bakeryId : ''))}>{bakeryId ? <QuoteWorkspace key={user.id + ':' + bakeryId} bakeryId={bakeryId} user={user} roles={roles} query={query} onNavigate={onNavigate} /> : <p>Chọn cửa hàng để xem yêu cầu và gửi báo giá.</p>}</DetailDrawer></VendorFrame>
}
