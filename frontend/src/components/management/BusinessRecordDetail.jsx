import { recordSource } from '../../services/unifiedDataService.js'
import React from 'react'
import { DetailDrawer } from '../common/WorkspaceUI.jsx'
import { OrderDetail } from '../orders/OrderViews.jsx'
import { moneyVnd } from '../../services/marketplaceModels.js'
import { sentOfferStatusLabel, rfqStatusLabel } from '../../services/vendorRfqModels.js'
import { formatOrderDate } from '../../services/orderPresentation.js'

export default function BusinessRecordDetail({ selection, resolvedCustomer, state, isAdmin, bakeryId, onClose, onAccept, now }) {
  if (!selection) return null
  if (selection.kind === 'orders') return <OrderDetail orderId={selection.id} scope={isAdmin ? 'all' : 'bakery'} bakeryId={bakeryId} onClose={onClose} />
  const collection = selection.kind === 'requests' ? 'requests' : selection.kind === 'offers' ? 'offers' : selection.kind === 'transactions' ? 'salesPayments' : 'users'
  const record = state[collection].find(row => row.id === selection.id)
  if (!record) return null
  const request = collection === 'requests' ? record : collection === 'offers' ? state.requests.find(row => row.id === record.cakeRequestId) : null
  const offers = request ? state.offers.filter(row => row.cakeRequestId === request.id && (isAdmin || row.bakeryId === bakeryId)) : []
  const customer = resolvedCustomer || state.users.find(user => user.id === (request?.customerId || record.customerId || record.id))
  return <DetailDrawer className="sc-workspace-detail" title={request?.title || record.name || 'Chi tiết phiếu thu'} onClose={onClose}>
    <section className="sc-detail-section"><h3>Thông tin chi tiết</h3><dl className="sc-detail-fields"><div><dt>Khách hàng</dt><dd>{customer?.displayName || customer?.name || request?.customerName || '—'}</dd></div>{customer?.email && <div><dt>Email</dt><dd>{customer.email}</dd></div>}{customer?.phoneNumber && <div><dt>Điện thoại</dt><dd>{customer.phoneNumber}</dd></div>}<div><dt>Ngày tạo</dt><dd>{formatOrderDate(record.createdAt)}</dd></div>{request && <><div><dt>Trạng thái yêu cầu</dt><dd>{rfqStatusLabel(request.status)}</dd></div><div><dt>Ngày cần bánh</dt><dd>{formatOrderDate(request.neededAt)}</dd></div><div><dt>Ngân sách</dt><dd>{moneyVnd(request.budgetMin)} – {moneyVnd(request.budgetMax)}</dd></div><div><dt>Khu vực giao</dt><dd>{request.deliveryDistrict}, {request.deliveryCity}</dd></div></>}{record.amount != null && <div><dt>Số tiền</dt><dd>{moneyVnd(record.amount)}</dd></div>}</dl></section>
    {request?.description && <section className="sc-detail-section"><h3>Mô tả yêu cầu</h3><p className="sc-detail-value whitespace-pre-wrap">{request.description}</p></section>}
    {offers.length > 0 && <section className="sc-detail-section space-y-3"><h3 className="font-bold">Báo giá liên quan</h3>{offers.map(offer => <article key={offer.id} className="border rounded-xl p-4 space-y-2"><strong>{state.bakeries.find(shop => shop.id === offer.bakeryId)?.name}</strong><p>{moneyVnd(offer.totalPrice)} · {sentOfferStatusLabel(offer.status, offer.expiresAt)}</p><p>{offer.message}</p>{recordSource(offer) === 'local' && offer.status === 'PENDING' && Date.parse(offer.expiresAt) > now && <button className="sc-button" onClick={() => onAccept(offer)}>Ghi nhận khách đồng ý</button>}</article>)}</section>}
    {collection === 'users' && <section className="sc-detail-section space-y-2"><h3 className="font-bold">Lịch sử mua bánh</h3>{state.orders.filter(order => order.customerId === record.id && (isAdmin || order.bakeryId === bakeryId)).map(order => <p key={order.id}>{order.orderNumber} · {moneyVnd(order.totalAmount)} · {formatOrderDate(order.createdAt)}</p>)}</section>}
  </DetailDrawer>
}
