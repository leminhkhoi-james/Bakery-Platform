import { displayReference } from '../../services/displayReference.js'
import { uiLabel } from '../../services/uiLabels.js'
import React, { useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { rfqService, loadRfqs, loadRfq, loadOffers } from '../../services/rfqService.js'
import { REQUEST_STATUSES, OFFER_STATUSES, editableRequest, ownsRequest, moneyVnd } from '../../services/marketplaceModels.js'
import { chatService } from '../../services/chatService.js'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import { ApiErrorMessage, buttonClass, inputClass, panelClass } from '../management/ApiState.jsx'
import MarketplaceState from './MarketplaceState.jsx'
import RequestForm from './RequestForm.jsx'
import ConfirmAction from '../common/ConfirmAction.jsx'
import { requestContextFromSearch } from '../../services/requestContextModels.js'
import { EmptyPanel, Icon, StatusBadge } from '../common/WorkspaceUI.jsx'
import { useMarketplaceAction } from '../../hooks/useMarketplaceAction.js'
export function ReferenceImage({ url, label = 'Ảnh tham khảo' }) {
  const [failed, setFailed] = useState(false)
  return url && !failed ? (
    <img
      src={url}
      alt={label}
      className="max-h-80 w-full rounded-2xl object-cover border border-outline-variant/30 shadow-xs hover:scale-[1.01] transition-transform"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-center text-xs text-outline">
      Ảnh không khả dụng hoặc URL đã hết hạn. Tải lại dữ liệu để lấy URL mới.
    </div>
  )
}

const RFQ_STATUS_LABELS = {
  DRAFT: 'Bản nháp',
  OPEN: 'Đang mở nhận báo giá',
  OFFER_SELECTED: 'Đã chọn báo giá',
  ORDERED: 'Đã đặt hàng',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
}

const OFFER_STATUS_LABELS = {
  SUBMITTED: 'Đã gửi báo giá',
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Đã hết hạn',
  WITHDRAWN: 'Đã rút lại',
}

const REQUEST_SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Mới nhất' },
  { value: 'neededAt,asc', label: 'Cần giao sớm nhất' },
  { value: 'budgetMin,asc', label: 'Ngân sách tăng dần' },
  { value: 'budgetMax,desc', label: 'Ngân sách giảm dần' },
]

const OFFER_SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Mới nhất' },
  { value: 'totalPrice,asc', label: 'Giá tăng dần' },
  { value: 'expiresAt,asc', label: 'Hết hạn sớm nhất' },
]

const REQUEST_TYPE_LABELS = {
  OPEN_CUSTOM: 'Tự do sáng tạo',
  TARGETED_PRODUCT_CUSTOM: 'Đặt theo mẫu tiệm',
}

function formatRfqDateTime(isoString) {
  if (!isoString) return 'Chưa xác định'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  } catch {
    return isoString
  }
}

export function RequestInfo({ request }) {
  return (
    <section className="space-y-6 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
      {/* Header with status badge & request ID */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
        <div className="flex items-center gap-2.5">
          <StatusBadge status={request.status} label={RFQ_STATUS_LABELS[request.status] || request.status} />
          <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
            {REQUEST_TYPE_LABELS[request.requestType] || 'Đặt bánh theo yêu cầu'}
          </span>
          <details className="text-xs"><summary>Thông tin tham chiếu</summary>{displayReference(request.id, 'RFQ')}</details>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
          <Icon name="verified" className="text-sm text-secondary" /> Yêu cầu đặt làm riêng
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary leading-tight">
          {request.title || 'Yêu cầu chưa có tiêu đề'}
        </h2>
        {request.description && (
          <div className="mt-3 rounded-2xl bg-surface-container-low p-4 text-sm leading-relaxed text-on-surface-variant border border-outline-variant/20">
            <p className="whitespace-pre-wrap">{request.description}</p>
          </div>
        )}
      </div>

      {/* Budget & Location Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-outline">
            <Icon name="payments" className="text-base text-primary" />
            <span>Ngân sách dự kiến</span>
          </div>
          <p className="mt-2 text-xl font-bold text-primary">
            {moneyVnd(request.budgetMin)} — {moneyVnd(request.budgetMax)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">Khoảng giá mong muốn</p>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-outline">
            <Icon name="location_on" className="text-base text-secondary" />
            <span>Địa điểm giao bánh</span>
          </div>
          <p className="mt-2 text-lg font-bold text-on-surface">
            {request.deliveryDistrict}, {request.deliveryCity}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">Khu vực nhận bánh chính thức</p>
        </div>
      </div>

      {/* Date Timeline Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon name="event" className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-medium text-outline">Cần bánh lúc</p>
            <p className="mt-0.5 text-sm font-semibold text-on-surface">{formatRfqDateTime(request.neededAt)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <Icon name="timer" className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-medium text-outline">Hạn nhận báo giá</p>
            <p className="mt-0.5 text-sm font-semibold text-on-surface">{formatRfqDateTime(request.offerDeadline)}</p>
          </div>
        </div>
      </div>

      {/* Custom Specifications & Preferences */}
      {(request.occasion || request.servingSize != null || (request.preference && Object.keys(request.preference).length > 0)) && (
        <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-primary">
            <Icon name="tune" className="text-base" /> Quy cách & Tuỳ chọn thiết kế
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {request.occasion && (
              <div className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 border border-outline-variant/20">
                <span className="text-outline text-xs">Dịp / Sự kiện:</span>
                <span className="font-semibold text-on-surface">{request.occasion}</span>
              </div>
            )}
            {request.servingSize != null && (
              <div className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 border border-outline-variant/20">
                <span className="text-outline text-xs">Khẩu phần phục vụ:</span>
                <span className="font-semibold text-on-surface">{request.servingSize} người</span>
              </div>
            )}
            {request.preference && Object.entries(request.preference)
              .filter(([, value]) => typeof value === 'string' && value)
              .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 border border-outline-variant/20">
                  <span className="text-outline text-xs capitalize">{key === 'cakeSize' ? 'Kích thước tầng' : key === 'flavor' ? 'Hương vị cốt & kem' : key}:</span>
                  <span className="font-semibold text-on-surface text-right truncate max-w-[60%]">{value}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Option selections */}
      {request.optionSelections && request.optionSelections.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-primary">
            <Icon name="layers" className="text-base" /> Chi tiết tuỳ chọn đính kèm
          </h4>
          <div className="divide-y divide-outline-variant/20 text-sm">
            {request.optionSelections.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <span className="text-on-surface">{item.groupNameSnapshot || displayReference(item.optionGroupId, 'OPT')}: {item.valueNameSnapshot || displayReference(item.optionValueId, 'VAL')}</span>
                <span className="font-semibold text-primary">× {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reference Images Gallery */}
      {request.images && request.images.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-bold text-primary">
            <Icon name="photo_library" className="text-base" /> Ảnh tham khảo & Mẫu bánh ({request.images.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {request.images.map((image) => (
              <div key={image.id} className="group overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-xs">
                <ReferenceImage key={image.id} url={image.url} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Mã thiết kế */}
      {request.selectedDesignId && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-900 border border-amber-200">
          <Icon name="auto_awesome" className="text-base text-amber-700" />
          <span>Mẫu thiết kế AI được chọn: <strong className="font-mono">{displayReference(request.selectedDesignId, 'ART')}</strong></span>
        </div>
      )}
    </section>
  )
}
export function RequestListView({ resource, onPage, onOpen }) {
  return (
    <MarketplaceState resource={resource}>
      {resource.data && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {resource.data.result.map((request) => (
              <article
                key={request.id}
                data-status={request.status}
                className={panelClass + ' sc-request-card space-y-4 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md'}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={request.status} label={RFQ_STATUS_LABELS[request.status] || request.status} />
                    <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
                      {REQUEST_TYPE_LABELS[request.requestType] || request.requestType || 'Tùy chỉnh'}
                    </span>
                  </div>
                  <details className="text-xs"><summary>Thông tin tham chiếu</summary>{displayReference(request.id, 'RFQ')}</details>
                </div>

                <h2 className="font-serif text-xl font-bold text-primary">{request.title || displayReference(request.id, 'RFQ')}</h2>

                <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Icon name="location_on" className="text-base text-primary" />
                  <span>{request.deliveryDistrict}, {request.deliveryCity}</span>
                </p>

                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3.5">
                  <span className="text-xs text-outline">Ngân sách dự kiến:</span>
                  <p className="font-serif text-lg font-bold text-primary">
                    {moneyVnd(request.budgetMin)} — {moneyVnd(request.budgetMax)}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-outline pt-1">
                  <span className="flex items-center gap-1">
                    <Icon name="event" className="text-sm text-secondary" />
                    Cần bánh: <strong className="font-medium text-on-surface">{formatRfqDateTime(request.neededAt)}</strong>
                  </span>
                </div>

                <button className={buttonClass + ' w-full py-2.5 text-sm font-bold shadow-xs'} onClick={() => onOpen(request.id)}>
                  Xem chi tiết yêu cầu
                </button>
              </article>
            ))}
          </div>
          {!resource.data.result.length && (
            <section className={panelClass}>
              <EmptyPanel
                title="Chưa có yêu cầu phù hợp."
                description="Các yêu cầu sẽ được hiển thị theo bộ lọc và quyền truy cập."
                icon="cake"
              />
            </section>
          )}
          <CatalogPagination meta={resource.data.meta} onPage={onPage} />
        </>
      )}
    </MarketplaceState>
  )
}
export function RequestFilters({ filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value, page: 1 })
  return (
    <div className="sc-toolbar grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label>
        <span>Trạng thái</span>
        <select className={inputClass} value={filters.status || ''} onChange={(e) => set('status', e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {REQUEST_STATUSES.map((status) => (
            <option key={status} value={status}>
              {RFQ_STATUS_LABELS[status] || uiLabel(status)}
            </option>
          ))}
        </select>
      </label>
      {['city', 'district'].map((key) => (
        <label key={key}>
          <span>{key === 'city' ? 'Tỉnh/thành' : 'Quận/huyện'}</span>
          <input className={inputClass} placeholder={key === 'city' ? 'Ví dụ: TP. Hồ Chí Minh' : 'Ví dụ: Quận 1'} value={filters[key] || ''} onChange={(e) => set(key, e.target.value)} />
        </label>
      ))}
      <label>
        <span>Sắp xếp</span>
        <select className={inputClass} value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
          {REQUEST_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
export function CustomerRequests({ onNavigate, create = false, routeSearch = '' }) {
  const [filters, setFilters] = useState({ scope: 'mine', page: 1, size: 12, sort: 'createdAt,desc' })
  const resource = useCatalogResource(loadRfqs, filters)
  let context = {}, contextError = null
  try { if (create) context = requestContextFromSearch(routeSearch) } catch (failure) { contextError = failure }
  const action = useMarketplaceAction(resource.reload)
  return <main className="sc-customer mx-auto max-w-6xl space-y-6 px-4 py-8"><div className="sc-customer-heading"><p className="sc-kicker">Bánh riêng cho khoảnh khắc của bạn</p><h1 className="font-serif text-3xl font-semibold text-primary">Yêu cầu bánh của tôi</h1></div><div className="flex flex-wrap gap-4"><button className={buttonClass} onClick={() => onNavigate(create ? 'rfqs' : 'rfq-new')}>{create ? 'Danh sách yêu cầu' : 'Tạo yêu cầu mới'}</button><button className="underline" onClick={() => onNavigate('ai-studio')}>AI Cake Studio</button></div>{action.error && <ApiErrorMessage error={action.error} />}{create ? <><MarketplaceState resource={resource} />{contextError && <ApiErrorMessage error={contextError} />}<RequestForm initialValues={context} disabled={resource.status !== 'ready' || Boolean(contextError)} busy={action.busy} onSave={(input) => action.run(async () => { const request = await rfqService.createRfq(input); onNavigate('request-detail?id=' + request.id) })} /></> : <><RequestFilters filters={filters} onChange={setFilters} /><RequestListView resource={resource} onPage={(page) => setFilters({ ...filters, page })} onOpen={(id) => onNavigate('request-detail?id=' + id)} /></>}</main>
}
export function CustomerRequestDetail({ id, onNavigate }) {
  const { user } = useAuth(), resource = useCatalogResource(loadRfq, { id })
  const [editing, setEditing] = useState(false), [reason, setReason] = useState(''), [files, setFiles] = useState([])
  const action = useMarketplaceAction(resource.reload), request = resource.data

  return (
    <main className="sc-customer mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Top Header */}
      <div className="sc-customer-heading flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="sc-kicker">SweetCake Marketplace / Đặt làm theo yêu cầu</p>
          <h1 className="font-serif text-3xl font-semibold text-primary">Chi tiết yêu cầu bánh (RFQ)</h1>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline transition-colors"
          onClick={() => onNavigate('rfqs')}
        >
          <Icon name="arrow_back" className="text-base" /> Quay lại danh sách yêu cầu
        </button>
      </div>

      {action.error && <ApiErrorMessage error={action.error} retry={resource.reload} />}

      <MarketplaceState resource={resource}>
        {request && (ownsRequest(request, user) ? (
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Left column: Request Details & Status History */}
            <div className="space-y-6 lg:col-span-7">
              <RequestInfo request={request} />

              {/* Status History */}
              <section className="space-y-3 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                  <Icon name="history" className="text-primary text-xl" />
                  <h3 className="font-serif text-lg font-bold text-primary">Lịch sử trạng thái</h3>
                </div>
                {request.statusHistory && request.statusHistory.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {request.statusHistory.map((row, index) => (
                      <div key={index} className="flex items-center justify-between text-xs text-on-surface-variant py-1 border-b border-outline-variant/10 last:border-0">
                        <span className="font-semibold text-on-surface">{row.fromStatus} → {row.toStatus}</span>
                        <span>{formatRfqDateTime(row.changedAt)} {row.reason ? `(${row.reason})` : ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-outline">Chưa có lịch sử trạng thái.</p>
                )}
              </section>
            </div>

            {/* Right column: Action Panel (Sticky) */}
            <div className="space-y-5 lg:col-span-5 lg:sticky lg:top-24">
              <section className="space-y-5 rounded-3xl border-2 border-primary/10 bg-surface p-6 shadow-md">
                <div className="border-b border-outline-variant/20 pb-4">
                  <p className="sc-kicker text-xs">Thao tác yêu cầu</p>
                  <h2 className="font-serif text-2xl font-bold text-primary">Quản lý báo giá & Thiết kế</h2>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    So sánh các báo giá gửi từ tiệm hoặc sử dụng AI để sáng tạo thêm thiết kế.
                  </p>
                </div>

                {/* Primary CTA: Bidding comparison */}
                <button
                  type="button"
                  className={buttonClass + ' w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2'}
                  onClick={() => onNavigate('bidding?cakeRequestId=' + id)}
                >
                  <Icon name="local_offer" className="text-xl" /> So sánh báo giá
                </button>

                {/* AI Studio CTA */}
                <button
                  type="button"
                  className="w-full rounded-2xl border-2 border-primary/20 bg-surface-container-low py-3 px-4 text-sm font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  onClick={() => onNavigate('ai-studio?cakeRequestId=' + id)}
                >
                  <Icon name="auto_awesome" className="text-lg text-secondary" /> Thiết kế AI cho yêu cầu này
                </button>

                {/* Chat with target bakery if assigned */}
                {request.targetBakeryId && !['DRAFT', 'CANCELLED'].includes(request.status) && (
                  <div className="pt-2 border-t border-outline-variant/20">
                    <ChatForRequest request={request} bakeryId={request.targetBakeryId} onNavigate={onNavigate} />
                  </div>
                )}

                {/* Edit & Image Upload if DRAFT */}
                {editableRequest(request, user) && (
                  <div className="space-y-4 pt-2 border-t border-outline-variant/20">
                    <button
                      disabled={action.busy}
                      className="w-full rounded-2xl border border-outline-variant/40 bg-surface py-2.5 px-4 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5"
                      onClick={() => setEditing(!editing)}
                    >
                      <Icon name="edit" className="text-sm text-secondary" /> {editing ? 'Đóng chỉnh sửa' : 'Sửa bản nháp'}
                    </button>

                    {editing && (
                      <RequestForm
                        key={request.updatedAt}
                        request={request}
                        busy={action.busy}
                        onClose={() => setEditing(false)}
                        onSave={(input) => action.run(async () => { await rfqService.updateRfq(id, input); setEditing(false) })}
                      />
                    )}

                    <section className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 text-xs">
                      <p className="font-semibold text-primary">Tải lên ảnh tham khảo:</p>
                      <p className="text-outline">PNG/JPEG/WebP, 1–10 tệp, tối đa 10 MiB/tệp. </p>
                      <input
                        aria-label="Ảnh tham khảo RFQ"
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp"
                        disabled={action.busy}
                        onChange={(e) => setFiles(Array.from(e.target.files))}
                        className={inputClass + ' w-full text-xs'}
                      />
                      <button
                        className={buttonClass + ' w-full py-2 text-xs'}
                        disabled={action.busy || !files.length}
                        onClick={() => action.run(async () => { await rfqService.uploadImages(id, files); setFiles([]) })}
                      >
                        Tải ảnh lên
                      </button>

                      {request.images.map((image) => (
                        <ConfirmAction
                          key={image.id}
                          label={'Xóa ảnh ' + image.displayOrder}
                          description="Xác nhận xóa ảnh tham khảo này."
                          busy={action.busy}
                          onConfirm={() => action.run(() => rfqService.deleteImage(id, image.id))}
                        />
                      ))}

                      <button
                        className={buttonClass + ' w-full py-3 text-sm font-bold'}
                        disabled={action.busy}
                        onClick={() => action.run(() => rfqService.publishRfq(id))}
                      >
                        Gửi yêu cầu để nhận báo giá
                      </button>
                    </section>
                  </div>
                )}

                {/* Cancel Request if DRAFT or OPEN */}
                {['DRAFT', 'OPEN'].includes(request.status) && (
                  <details className="group rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3.5 text-xs">
                    <summary className="cursor-pointer font-semibold text-outline hover:text-red-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-red-700">
                        <Icon name="cancel" className="text-sm" /> Hủy yêu cầu
                      </span>
                      <Icon name="expand_more" className="group-open:rotate-180 transition-transform text-outline" />
                    </summary>
                    <div className="mt-3 space-y-2.5 pt-3 border-t border-outline-variant/20">
                      <label className="block space-y-1">
                        <span className="text-outline">Lý do hủy yêu cầu:</span>
                        <input
                          maxLength={2000}
                          value={reason}
                          placeholder="Nhập lý do hủy yêu cầu..."
                          onChange={(e) => setReason(e.target.value)}
                          className={inputClass + ' w-full'}
                        />
                      </label>
                      <ConfirmAction
                        key={id}
                        label="Hủy yêu cầu"
                        description="Xác nhận hủy yêu cầu báo giá này."
                        busy={action.busy}
                        onConfirm={() => action.run(() => rfqService.cancelRfq(id, reason))}
                      />
                    </div>
                  </details>
                )}
              </section>
            </div>
          </div>
        ) : (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Không có quyền xem yêu cầu của tài khoản khác.
          </p>
        ))}
      </MarketplaceState>
    </main>
  )
}
export function ChatForRequest({ request, bakeryId, onNavigate }) {
  const { user } = useAuth(), action = useMarketplaceAction()
  const valid = ownsRequest(request, user) && !['DRAFT', 'CANCELLED'].includes(request.status)
  return <div className="space-y-2">{action.error && <ApiErrorMessage error={action.error} />}<button className={buttonClass} disabled={!valid || action.busy} onClick={() => action.run(async () => { const conversation = await chatService.createConversation({ cakeRequestId: request.id, bakeryId }, { userId: user.id, roles: user.roles }); onNavigate('chat?conversationId=' + conversation.id) })}>Mở hội thoại với tiệm</button><p className="text-sm">Trao đổi trực tiếp với tiệm về yêu cầu và báo giá này.</p></div>
}
export function OfferCards({ resource, onPage, onOpen }) {
  return <MarketplaceState resource={resource}>{resource.data && <><div className="grid gap-4 md:grid-cols-2">{resource.data.result.map((offer) => <article className={panelClass + ' sc-offer-card'} key={offer.id}><p className="break-all">Tiệm: {displayReference(offer.bakeryId, 'SHOP')}</p><p><StatusBadge status={offer.status} /></p><h3 className="text-xl font-bold">{moneyVnd(offer.totalPrice)}</h3><p>Hoàn thành: {offer.estimatedCompletionAt || 'Chưa có'}</p><p>Hết hạn: {offer.expiresAt}</p><button className={buttonClass} onClick={() => onOpen(offer.id)}>Chi tiết báo giá</button></article>)}</div>{!resource.data.result.length && <section className={panelClass}><EmptyPanel title="Chưa có báo giá." description="Báo giá từ tiệm sẽ xuất hiện tại đây khi có dữ liệu phù hợp." icon="description" /></section>}<CatalogPagination meta={resource.data.meta} onPage={onPage} /></>}</MarketplaceState>
}
export function Offers({ cakeRequestId, bakeryId, scope, onOpen }) {
  const [filters, setFilters] = useState({ scope, cakeRequestId, bakeryId, page: 1, size: 12, sort: 'createdAt,desc', status: '' })
  const resource = useCatalogResource(loadOffers, filters)
  return (
    <section className="space-y-4">
      <div className="sc-toolbar sc-offer-filters">
        <label>
          <span>Trạng thái báo giá</span>
          <select className={inputClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
            <option value="">Tất cả trạng thái</option>
            {OFFER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {OFFER_STATUS_LABELS[status] || uiLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Sắp xếp</span>
          <select className={inputClass} value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}>
            {OFFER_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <OfferCards resource={resource} onPage={(page) => setFilters({ ...filters, page })} onOpen={onOpen} />
    </section>
  )
}
