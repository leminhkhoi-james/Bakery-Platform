import MoneyInput from '../common/MoneyInput.jsx'
import { displayReference } from '../../services/displayReference.js'
import { uiLabel } from '../../services/uiLabels.js'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { rfqService, loadRfqs, loadRfq, loadOffers } from '../../services/rfqService.js'
import { REQUEST_STATUSES, OFFER_STATUSES, editableRequest, ownsRequest, moneyVnd, toLocalInput, rfqPayload } from '../../services/marketplaceModels.js'
import { chatService } from '../../services/chatService.js'
import CatalogPagination from '../catalog/CatalogPagination.jsx'
import { ApiErrorMessage, buttonClass, inputClass, panelClass } from '../management/ApiState.jsx'
import MarketplaceState from './MarketplaceState.jsx'
import RequestForm from './RequestForm.jsx'
import ConfirmAction from '../common/ConfirmAction.jsx'
import { requestContextFromSearch } from '../../services/requestContextModels.js'
import { EmptyPanel, Icon, StatusBadge } from '../common/WorkspaceUI.jsx'
import { useMarketplaceAction } from '../../hooks/useMarketplaceAction.js'
import ThreeCakeCanvas from '../../pages/customer/ai-studio/ThreeCakeCanvas.jsx'

export function ReferenceImage({ url, label = 'Ảnh tham khảo', className, unavailableLabel }) {
  const [failed, setFailed] = useState(false)
  return url && !failed ? (
    <img
      src={url}
      alt={label}
      className={className || "max-h-80 w-full rounded-2xl object-cover border border-outline-variant/30 shadow-xs hover:scale-[1.01] transition-transform"}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-center text-xs text-outline">
      {unavailableLabel || 'Ảnh không khả dụng hoặc URL đã hết hạn. Tải lại dữ liệu để lấy URL mới.'}
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

const PREFERENCE_FIELD_LABELS = {
  cakeSize: 'Kích thước tầng',
  cakeShape: 'Hình dáng bánh',
  flavor: 'Hương vị cốt bánh',
  filling: 'Nhân kem / mứt',
  frosting: 'Lớp kem phủ ngoài',
  colorPalette: 'Bảng phối màu',
  decorationNotes: 'Chi tiết trang trí & lời chúc',
  allergyNotes: 'Lưu ý dị ứng',
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

const QUICK_BUDGET_RANGES = [
  { label: '300k – 500k', min: 300000, max: 500000 },
  { label: '500k – 800k', min: 500000, max: 800000 },
  { label: '800k – 1.2Tr', min: 800000, max: 1200000 },
  { label: '1.2Tr – 2.5Tr', min: 1200000, max: 2500000 },
]

export function RequestInfo({ request, compact = false }) {
  const cake3DConfig = request.preference?.extraOptions?.cake3DConfig
  const cake3DSnapshotUrl = request.preference?.extraOptions?.cake3DSnapshotUrl
  const [live3DMode, setLive3DMode] = useState(Boolean(cake3DConfig))
  const [show3DCutaway, setShow3DCutaway] = useState(false)
  const selectedAiImageUrl =
    request.selectedDesignImageUrl || request.preference?.extraOptions?.selectedAiImageUrl || null
  const hasBudget = request.budgetMin != null || request.budgetMax != null
  const extraImages = (request.images || []).filter(
    (img) =>
      (!cake3DSnapshotUrl || img.url !== cake3DSnapshotUrl) &&
      (!selectedAiImageUrl || img.url !== selectedAiImageUrl)
  )

  if (compact) {
    return (
      <section className={`sc-popup-group sc-rfq-request-summary ${cake3DConfig || cake3DSnapshotUrl || selectedAiImageUrl || extraImages.length ? 'sc-rfq-request-summary--media' : ''} space-y-3.5 rounded-2xl border border-outline-variant/30 bg-surface p-4 sm:p-5 shadow-xs`}>
        {/* Status & Occasion header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={request.status} label={RFQ_STATUS_LABELS[request.status] || request.status} />
            <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
              {REQUEST_TYPE_LABELS[request.requestType] || 'Yêu cầu làm bánh'}
            </span>
          </div>
          {request.occasion && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              {request.occasion}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-serif text-lg sm:text-xl font-bold text-primary leading-snug">
          {request.title || 'Yêu cầu chưa có tiêu đề'}
        </h2>

        {/* Key Metrics: Budget & Location */}
        <div className="sc-popup-summary grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="sc-popup-group rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Icon name="payments" className="text-sm" />
              <span>Ngân sách</span>
            </div>
            <p className="mt-1 font-serif text-base font-bold text-primary">
              {hasBudget ? `${moneyVnd(request.budgetMin)} — ${moneyVnd(request.budgetMax)}` : 'Thương lượng'}
            </p>
          </div>

          <div className="sc-popup-group rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-outline">
              <Icon name="location_on" className="text-sm text-secondary" />
              <span>Giao tại</span>
            </div>
            <p className="mt-1 text-sm font-bold text-on-surface truncate">
              {[request.deliveryDistrict, request.deliveryCity].filter(Boolean).join(', ') || 'Chưa có địa điểm'}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Cần giao: <strong>{formatRfqDateTime(request.neededAt)}</strong>
            </p>
          </div>
        </div>

        {/* Cake Visual */}
        {(cake3DSnapshotUrl || cake3DConfig) ? (
          <div className="sc-rfq-reference rounded-2xl border border-rose-200/90 bg-rose-50/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Icon name="view_in_ar" className="text-base" /> Mẫu bánh 3D
              </span>
              {cake3DConfig && (
                <button
                  type="button"
                  onClick={() => setLive3DMode((v) => !v)}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  {live3DMode ? 'Xem ảnh chụp' : 'Xoay 3D 360°'}
                </button>
              )}
            </div>
            {live3DMode && cake3DConfig ? (
              <div className="h-56 w-full rounded-xl overflow-hidden border border-rose-200">
                <ThreeCakeCanvas
                  compact
                  config={cake3DConfig}
                  spongeColor={cake3DConfig.spongeColor || '#f6e3ba'}
                  fillingColor={cake3DConfig.fillingColor || '#e04f6b'}
                  showCrossSection={show3DCutaway}
                  autoRotate
                />
              </div>
            ) : (
              <ReferenceImage key={cake3DSnapshotUrl || selectedAiImageUrl}
                unavailableLabel="Ảnh mẫu hiện chưa xem được."
                url={cake3DSnapshotUrl || selectedAiImageUrl}
                label="Mẫu bánh 3D"
                className="h-52 w-full rounded-xl object-contain bg-white/70 border border-stone-200"
              />
            )}
          </div>
        ) : selectedAiImageUrl ? (
          <div className="sc-rfq-reference rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Icon name="auto_awesome" className="text-base" /> Mẫu bánh AI khách chọn
              </span>
            </div>
            <ReferenceImage key={selectedAiImageUrl}
              unavailableLabel="Ảnh mẫu hiện chưa xem được."
              url={selectedAiImageUrl}
              label="Mẫu bánh AI"
              className="h-52 w-full rounded-xl object-cover border border-outline-variant/30 shadow-xs"
            />
          </div>
        ) : extraImages.length > 0 ? (
          <div className="sc-rfq-reference rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3 space-y-2">
            <span className="text-xs font-bold text-outline">Ảnh khách đính kèm</span>
            <ReferenceImage key={extraImages[0].url}
              unavailableLabel="Ảnh đính kèm hiện chưa xem được."
              url={extraImages[0].url}
              label="Ảnh đính kèm"
              className="h-48 w-full rounded-xl object-cover border border-outline-variant/30"
            />
          </div>
        ) : null}

        {/* Specifications */}
        <div className="sc-popup-group sc-rfq-specification-group rounded-xl border border-outline-variant/20 bg-surface-container-low p-3 space-y-1.5 text-xs">
          <div className="font-bold text-primary flex items-center gap-1.5">
            <Icon name="tune" className="text-sm" /> Yêu cầu quy cách
          </div>
          <div className="sc-rfq-specifications grid grid-cols-2 gap-2 text-stone-700 pt-1">
            {request.servingSize != null && (
              <div><span className="text-outline">Khẩu phần:</span> <strong>{request.servingSize} người</strong></div>
            )}
            {request.preference?.flavor && (
              <div><span className="text-outline">Hương vị:</span> <strong>{request.preference.flavor}</strong></div>
            )}
            {request.preference?.frosting && (
              <div><span className="text-outline">Kem phủ:</span> <strong>{request.preference.frosting}</strong></div>
            )}
            {request.preference?.cakeSize && (
              <div><span className="text-outline">Kích thước:</span> <strong>{request.preference.cakeSize}</strong></div>
            )}
            {request.preference?.colorPalette && (
              <div><span className="text-outline">Tone màu:</span> <strong>{request.preference.colorPalette}</strong></div>
            )}
          </div>
          {request.preference?.decorationNotes && (
            <div className="pt-1 text-stone-700 border-t border-outline-variant/15 mt-1">
              <span className="text-outline">Trang trí:</span> <strong>{request.preference.decorationNotes}</strong>
            </div>
          )}
          {request.preference?.allergyNotes && (
            <div className="text-rose-700">
              <span className="font-bold">Lưu ý dị ứng:</span> {request.preference.allergyNotes}
            </div>
          )}
        </div>

        {/* Customer description */}
        {request.description && (
          <div className="sc-rfq-customer-message rounded-xl bg-amber-50/70 border border-amber-200/60 p-3 text-xs text-amber-950">
            <div className="font-bold mb-1 flex items-center gap-1 text-amber-800">
              <Icon name="notes" className="text-sm" /> Lời nhắn của khách hàng
            </div>
            <p className="whitespace-pre-wrap leading-relaxed">{request.description}</p>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-5 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
      {/* Header with status badge & request ID */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
        <div className="flex items-center gap-2.5">
          <StatusBadge status={request.status} label={RFQ_STATUS_LABELS[request.status] || request.status} />
          <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
            {REQUEST_TYPE_LABELS[request.requestType] || 'Đặt bánh theo yêu cầu'}
          </span>
          <details className="text-xs"><summary>Thông tin tham chiếu</summary>{displayReference(request.id, 'RFQ')}</details>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 border border-rose-200">
          <Icon name="verified" className="text-sm text-secondary" /> Yêu cầu đặt làm riêng
        </span>
      </div>

      {/* Title */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary leading-tight">
          {request.title || 'Yêu cầu chưa có tiêu đề'}
        </h2>
      </div>

      {/* Top Hero Key Metrics: Budget, Location, Needed Time, Offer Deadline */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-2xl border p-4 ${
            hasBudget
              ? 'border-primary/20 bg-primary/5'
              : 'border-rose-300 bg-rose-50/70'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Icon name="payments" className="text-base text-primary" />
              <span>Ngân sách mong muốn</span>
            </div>
            {!hasBudget && (
              <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-950">
                Chưa nhập giá
              </span>
            )}
          </div>
          {hasBudget ? (
            <p className="mt-1.5 font-serif text-xl font-bold text-primary">
              {moneyVnd(request.budgetMin)} — {moneyVnd(request.budgetMax)}
            </p>
          ) : (
            <p className="mt-1.5 text-sm font-bold text-rose-950">
              Chưa nhập khoảng ngân sách ({moneyVnd(request.budgetMin)})
            </p>
          )}
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            {hasBudget
              ? 'Khoảng ngân sách để các tiệm bánh cân đối báo giá'
              : 'Nhập ngân sách ở khung bên phải để tiệm bánh báo giá sát nhất'}
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-outline">
            <Icon name="location_on" className="text-base text-secondary" />
            <span>Khu vực nhận bánh</span>
          </div>
          <p className="mt-1.5 text-base font-bold text-on-surface">
            {request.deliveryDistrict}, {request.deliveryCity}
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            Cần giao lúc: <strong className="text-on-surface">{formatRfqDateTime(request.neededAt)}</strong>
          </p>
        </div>
      </div>

      {/* 3D Cake Design Showcase (Exact 3D Cake Image & Interactive 3D Viewer) */}
      {(cake3DSnapshotUrl || cake3DConfig) && (
        <div className="space-y-3 rounded-3xl border border-rose-200/90 bg-gradient-to-b from-[#fff5f8] via-[#fdf2f4] to-[#fce7eb] p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
                <Icon name="view_in_ar" className="text-lg" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Mẫu bánh 3D đã thiết kế</h4>
                <p className="text-[11px] text-stone-600">Đúng mẫu bánh 3D bạn đã tạo — Gửi trực tiếp cho tiệm bánh</p>
              </div>
            </div>
            {cake3DConfig && (
              <div className="flex flex-wrap items-center gap-2">
                {live3DMode && (
                  <button
                    type="button"
                    onClick={() => setShow3DCutaway((v) => !v)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      show3DCutaway ? 'bg-primary text-white' : 'bg-white/90 text-stone-700 hover:bg-white'
                    }`}
                  >
                    {show3DCutaway ? 'Ẩn lát cắt' : 'Xem lát cắt lớp bánh'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLive3DMode((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary hover:bg-wine-dark px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs cursor-pointer"
                >
                  <Icon name="360" className="text-sm text-rose-300" />
                  {live3DMode ? 'Xem hình chụp 3D' : 'Xoay mô hình 3D 360°'}
                </button>
              </div>
            )}
          </div>

          {live3DMode && cake3DConfig ? (
            <ThreeCakeCanvas
              compact
              config={cake3DConfig}
              spongeColor={cake3DConfig.spongeColor || '#f6e3ba'}
              fillingColor={cake3DConfig.fillingColor || '#e04f6b'}
              showCrossSection={show3DCutaway}
              autoRotate
            />
          ) : cake3DSnapshotUrl ? (
            <div className="flex justify-center">
              <img
                src={cake3DSnapshotUrl}
                alt="Mẫu bánh 3D đã thiết kế"
                className="max-h-72 w-full rounded-2xl object-contain border border-stone-200/80 bg-white/50 shadow-xs"
              />
            </div>
          ) : (
            cake3DConfig && (
              <ThreeCakeCanvas
                compact
                config={cake3DConfig}
                spongeColor={cake3DConfig.spongeColor || '#f6e3ba'}
                fillingColor={cake3DConfig.fillingColor || '#e04f6b'}
                showCrossSection={show3DCutaway}
                autoRotate
              />
            )
          )}
        </div>
      )}

      {/* Selected AI Cake Design Showcase */}
      {selectedAiImageUrl && !cake3DConfig && (
        <div className="space-y-3 rounded-3xl border border-primary/25 bg-primary/5 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary shadow-xs">
                <Icon name="auto_awesome" className="text-lg" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-primary">Mẫu bánh AI minh họa khách đã chọn</h4>
                <p className="text-[11px] text-on-surface-variant">
                  Ảnh mẫu AI đính kèm theo yêu cầu để các tiệm bánh xem xét khả năng thực hiện và gửi báo giá
                </p>
              </div>
            </div>
            {request.selectedDesignId && (
              <span className="rounded-full bg-white px-3 py-1 font-mono text-xs font-semibold text-primary border border-primary/20">
                {displayReference(request.selectedDesignId, 'ART')}
              </span>
            )}
          </div>
          <div className="flex justify-center">
            <ReferenceImage url={selectedAiImageUrl} label="Mẫu bánh AI khách đã chọn" />
          </div>
        </div>
      )}

      {/* Custom Specifications & Preferences */}
      {(request.occasion || request.servingSize != null || (request.preference && Object.keys(request.preference).length > 0)) && (
        <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-primary">
            <Icon name="tune" className="text-base" /> Thông số & Cấu hình chiếc bánh
          </h4>
          <div className="grid gap-2.5 sm:grid-cols-2 text-sm">
            {request.occasion && (
              <div className="rounded-xl bg-surface px-3.5 py-2.5 border border-outline-variant/20">
                <p className="text-[11px] font-medium text-outline">Dịp / Sự kiện</p>
                <p className="mt-0.5 font-semibold text-on-surface">{request.occasion}</p>
              </div>
            )}
            {request.servingSize != null && (
              <div className="rounded-xl bg-surface px-3.5 py-2.5 border border-outline-variant/20">
                <p className="text-[11px] font-medium text-outline">Khẩu phần phục vụ</p>
                <p className="mt-0.5 font-semibold text-on-surface">{request.servingSize} người</p>
              </div>
            )}
            {request.preference && Object.entries(request.preference)
              .filter(([, value]) => typeof value === 'string' && value)
              .map(([key, value]) => (
                <div
                  key={key}
                  className={`rounded-xl bg-surface px-3.5 py-2.5 border border-outline-variant/20 ${
                    key === 'decorationNotes' || key === 'allergyNotes' ? 'sm:col-span-2' : ''
                  }`}
                >
                  <p className="text-[11px] font-medium text-outline">{PREFERENCE_FIELD_LABELS[key] || key}</p>
                  <p className="mt-0.5 font-semibold text-on-surface break-words">{value}</p>
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

      {/* Description & Timeline Secondary Box */}
      {request.description && (
        <div className="rounded-2xl bg-surface-container-low p-4 text-xs leading-relaxed text-on-surface-variant border border-outline-variant/20 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-primary">Mô tả chi tiết gửi tiệm bánh</span>
            <span className="text-[11px] text-outline">Hạn nhận báo giá: {formatRfqDateTime(request.offerDeadline)}</span>
          </div>
          <p className="whitespace-pre-wrap">{request.description}</p>
        </div>
      )}

      {/* Reference Images Gallery */}
      {extraImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-bold text-primary">
            <Icon name="photo_library" className="text-base" /> Ảnh tham khảo đính kèm thêm ({extraImages.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {extraImages.map((image) => (
              <div key={image.id} className="group overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-xs">
                <ReferenceImage key={image.id} url={image.url} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Mã thiết kế */}
      {request.selectedDesignId && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-900 border border-rose-200">
          <Icon name="auto_awesome" className="text-base text-rose-700" />
          <span>Mẫu thiết kế AI được chọn: <strong className="font-mono">{displayReference(request.selectedDesignId, 'ART')}</strong></span>
        </div>
      )}
    </section>
  )
}

export function RequestListView({ resource, onPage, onOpen, onNavigate }) {
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

                {(request.preference?.extraOptions?.cake3DSnapshotUrl || request.preference?.extraOptions?.selectedAiImageUrl || request.images?.[0]?.url) && (
                  <div className="overflow-hidden rounded-2xl border border-rose-200/70 bg-gradient-to-b from-[#fff5f8] to-[#fce7eb] p-2">
                    <img
                      src={request.preference?.extraOptions?.cake3DSnapshotUrl || request.preference?.extraOptions?.selectedAiImageUrl || request.images?.[0]?.url}
                      alt="Mẫu bánh đã thiết kế"
                      className="h-44 w-full rounded-xl object-contain"
                    />
                  </div>
                )}

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

                <div className="space-y-2 pt-1">
                  <button className={buttonClass + ' w-full py-2.5 text-sm font-bold shadow-xs'} onClick={() => onOpen(request.id)}>
                    Xem chi tiết yêu cầu
                  </button>

                  {onNavigate && (
                    <div className="grid grid-cols-2 gap-2">
                      {['DRAFT', 'OPEN'].includes(request.status) && (
                        <button
                          type="button"
                          onClick={() => onNavigate('ai-studio?cakeRequestId=' + request.id)}
                          className="rounded-xl border border-primary/25 bg-surface-container-low py-2 px-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Icon name="auto_awesome" className="text-sm text-secondary" />
                          Thiết kế 3D / AI
                        </button>
                      )}
                      {['OPEN', 'OFFER_SELECTED', 'ORDERED'].includes(request.status) && (
                        <button
                          type="button"
                          onClick={() => onNavigate('bidding?cakeRequestId=' + request.id)}
                          className="rounded-xl border border-secondary/30 bg-secondary/10 py-2 px-3 text-xs font-bold text-secondary hover:bg-secondary/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Icon name="local_offer" className="text-sm" />
                          So sánh báo giá
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
  return (
    <main className="sc-customer mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="sc-customer-heading flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="sc-kicker">Bánh riêng cho khoảnh khắc của bạn</p>
          <h1 className="font-serif text-3xl font-semibold text-primary">Yêu cầu bánh của tôi</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className={buttonClass} onClick={() => onNavigate(create ? 'rfqs' : 'rfq-new')}>
            {create ? 'Danh sách yêu cầu' : 'Tạo yêu cầu mới'}
          </button>
          <button
            type="button"
            className="rounded-xl border border-primary/30 bg-surface px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 cursor-pointer"
            onClick={() => onNavigate('ai-studio?mode=3d')}
          >
            🎂 Thiết kế bánh 3D
          </button>
          <button className="underline text-sm font-semibold text-primary cursor-pointer" onClick={() => onNavigate('ai-studio')}>
            AI Cake Studio
          </button>
        </div>
      </div>
      {action.error && <ApiErrorMessage error={action.error} />}
      {create ? (
        <>
          <MarketplaceState resource={resource} />
          {contextError && <ApiErrorMessage error={contextError} />}
          <RequestForm
            initialValues={context}
            disabled={resource.status !== 'ready' || Boolean(contextError)}
            busy={action.busy}
            onSave={(input) => action.run(async () => {
              const request = await rfqService.createRfq(input)
              onNavigate('request-detail?id=' + request.id)
            })}
          />
        </>
      ) : (
        <>
          <RequestFilters filters={filters} onChange={setFilters} />
          <RequestListView
            resource={resource}
            onPage={(page) => setFilters({ ...filters, page })}
            onOpen={(id) => onNavigate('request-detail?id=' + id)}
            onNavigate={onNavigate}
          />
        </>
      )}
    </main>
  )
}

function QuickBudgetDeliveryCard({ request, busy, onSaveOnly, onSaveAndPublish }) {
  const [budgetMin, setBudgetMin] = useState(request?.budgetMin ?? '')
  const [budgetMax, setBudgetMax] = useState(request?.budgetMax ?? '')
  const [deliveryDistrict, setDeliveryDistrict] = useState(request?.deliveryDistrict || 'Quận 1')
  const [deliveryCity, setDeliveryCity] = useState(request?.deliveryCity || 'TP. Hồ Chí Minh')
  const [neededAt, setNeededAt] = useState(() => toLocalInput(request?.neededAt))
  const [offerDeadline, setOfferDeadline] = useState(() => toLocalInput(request?.offerDeadline))
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    setBudgetMin(request?.budgetMin ?? '')
    setBudgetMax(request?.budgetMax ?? '')
    setDeliveryDistrict(request?.deliveryDistrict || 'Quận 1')
    setDeliveryCity(request?.deliveryCity || 'TP. Hồ Chí Minh')
    setNeededAt(toLocalInput(request?.neededAt))
    setOfferDeadline(toLocalInput(request?.offerDeadline))
  }, [request?.updatedAt, request?.budgetMin, request?.budgetMax, request?.deliveryDistrict, request?.deliveryCity, request?.neededAt, request?.offerDeadline])

  const buildUpdatedPayload = () => ({
    ...request,
    budgetMin: budgetMin === '' ? null : Number(budgetMin),
    budgetMax: budgetMax === '' ? null : Number(budgetMax),
    deliveryDistrict: deliveryDistrict.trim() || request.deliveryDistrict || 'Quận 1',
    deliveryCity: deliveryCity.trim() || request.deliveryCity || 'TP. Hồ Chí Minh',
    neededAt,
    offerDeadline: offerDeadline || null,
  })

  function submit(publish) {
    setValidationError('')
    try {
      const payload = buildUpdatedPayload()
      rfqPayload(payload)
      if (publish) onSaveAndPublish(payload)
      else onSaveOnly(payload)
    } catch (error) {
      setValidationError(error.message)
    }
  }

  return (
    <div className="space-y-3.5 rounded-2xl border-2 border-rose-300/90 bg-gradient-to-b from-rose-50/90 to-white p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
            <Icon name="payments" className="text-base" />
          </span>
          <div>
            <p className="text-sm font-bold text-stone-900">1. Nhập ngân sách & Giao nhận</p>
            <p className="text-[11px] text-stone-600">
              Chọn nhanh hoặc nhập khoảng ngân sách mong muốn để các tiệm bánh gửi báo giá phù hợp nhất.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Budget Range Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
          Chọn nhanh khoảng ngân sách:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_BUDGET_RANGES.map((range) => {
            const active = Number(budgetMin) === range.min && Number(budgetMax) === range.max
            return (
              <button
                key={range.label}
                type="button"
                disabled={busy}
                onClick={() => {
                  setBudgetMin(String(range.min))
                  setBudgetMax(String(range.max))
                }}
                className={`rounded-xl border px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'border-primary bg-primary text-white shadow-xs'
                    : 'border-rose-300/80 bg-white text-stone-800 hover:border-primary/50 hover:bg-rose-50/50'
                }`}
              >
                {range.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Manual Budget Min / Max Inputs */}
      <div className="grid grid-cols-2 gap-2.5">
        <label className="space-y-1 text-xs">
          <span className="font-semibold text-stone-700">Tối thiểu (VNĐ)</span>
          <MoneyInput
            min={0}
            step={50000}
            disabled={busy}
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            placeholder="VD: 500000"
            className={inputClass + ' w-full bg-white text-xs font-bold'}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-semibold text-stone-700">Tối đa (VNĐ)</span>
          <MoneyInput
            min={0}
            step={50000}
            disabled={busy}
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="VD: 800000"
            className={inputClass + ' w-full bg-white text-xs font-bold'}
          />
        </label>
      </div>

      {/* Delivery District / City & NeededAt */}
      <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-rose-200/60">
        <label className="space-y-1 text-xs">
          <span className="font-semibold text-stone-700">Quận / Huyện nhận</span>
          <input
            type="text"
            maxLength={120}
            disabled={busy}
            value={deliveryDistrict}
            onChange={(e) => setDeliveryDistrict(e.target.value)}
            placeholder="VD: Quận 1"
            className={inputClass + ' w-full bg-white text-xs'}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-semibold text-stone-700">Tỉnh / Thành phố</span>
          <input
            type="text"
            maxLength={120}
            disabled={busy}
            value={deliveryCity}
            onChange={(e) => setDeliveryCity(e.target.value)}
            placeholder="VD: TP. Hồ Chí Minh"
            className={inputClass + ' w-full bg-white text-xs'}
          />
        </label>
        <label className="col-span-2 space-y-1 text-xs">
          <span className="font-semibold text-stone-700">Thời gian cần nhận bánh</span>
          <input
            type="datetime-local"
            disabled={busy}
            value={neededAt}
            onChange={(e) => setNeededAt(e.target.value)}
            className={inputClass + ' w-full bg-white text-xs'}
          />
        </label>
        <label className="col-span-2 space-y-1 text-xs"><span className="font-semibold text-stone-700">Hạn nhận báo giá</span>
          <input type="datetime-local" disabled={busy} value={offerDeadline} max={neededAt || undefined}
            onChange={event => setOfferDeadline(event.target.value)} className={inputClass + ' w-full bg-white text-xs'} />
          <span>Để trống nếu không đặt hạn riêng. Nếu chọn, hạn phải ở tương lai và trước thời gian nhận bánh.</span>
        </label>
      </div>

      {validationError && <p role="alert" className="text-xs text-red-700">{validationError}</p>}

      {/* Save / Publish Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => submit(false)}
          className="w-full rounded-xl border border-primary/30 bg-white py-2.5 px-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Icon name="save" className="text-sm" />
          Lưu ngân sách & thông tin
        </button>

        <button
          type="button"
          className={buttonClass + ' w-full py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer'}
          disabled={busy}
          onClick={() => submit(true)}
        >
          <Icon name="send" className="text-base" />
          2. Gửi yêu cầu để nhận báo giá ngay
        </button>
      </div>
    </div>
  )
}

export function CustomerRequestDetail({ id, onNavigate }) {
  const { user } = useAuth(), resource = useCatalogResource(loadRfq, { id })
  const [editing, setEditing] = useState(false), [reason, setReason] = useState(''), [files, setFiles] = useState([])
  const action = useMarketplaceAction(resource.reload), request = resource.data

  const currentStepIndex = !request
    ? 0
    : request.status === 'DRAFT'
      ? 1
      : request.status === 'OPEN'
        ? 2
        : request.status === 'OFFER_SELECTED'
          ? 3
          : request.status === 'ORDERED'
            ? 4
            : 0

  return (
    <main className="sc-customer mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Top Header */}
      <div className="sc-customer-heading flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="sc-kicker">SweetCake Marketplace / Đặt làm theo yêu cầu</p>
          <h1 className="font-serif text-3xl font-semibold text-primary">Chi tiết yêu cầu bánh</h1>
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
          <div className="space-y-6">
            {/* 4-Step Workflow Progress Bar */}
            <section aria-label="Tiến độ yêu cầu đặt bánh" className="grid gap-2.5 sm:grid-cols-4 rounded-2xl border border-outline-variant/30 bg-surface p-3.5 text-xs shadow-xs">
              {[
                { step: 1, title: '1. Thiết kế & Ngân sách', desc: 'Chọn mẫu bánh 3D/AI & nhập ngân sách' },
                { step: 2, title: '2. Mở nhận báo giá', desc: 'Tiệm bánh đối tác gửi báo giá' },
                { step: 3, title: '3. So sánh & Chọn tiệm', desc: 'Trao đổi chat & chốt báo giá' },
                { step: 4, title: '4. Làm bánh & Giao nhận', desc: 'Theo dõi tiến độ đơn hàng' },
              ].map((item) => {
                const done = currentStepIndex > item.step
                const active = currentStepIndex === item.step
                return (
                  <div
                    key={item.step}
                    className={`flex items-start gap-2.5 rounded-xl p-2.5 border ${
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : done
                          ? 'border-emerald-300 bg-emerald-50/50'
                          : 'border-outline-variant/20 bg-surface-container-low'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        active
                          ? 'bg-primary text-on-primary'
                          : done
                            ? 'bg-emerald-600 text-white'
                            : 'bg-outline-variant/40 text-on-surface'
                      }`}
                    >
                      {done ? '✓' : item.step}
                    </span>
                    <div>
                      <p className="font-bold text-primary">{item.title}</p>
                      <p className="text-[11px] text-on-surface-variant">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </section>

            {/* Full-width Draft Form Editor when toggled */}
            {editing && editableRequest(request, user) && (
              <RequestForm
                key={request.updatedAt}
                request={request}
                busy={action.busy}
                onClose={() => setEditing(false)}
                onSave={(input) => action.run(async () => { await rfqService.updateRfq(id, input); setEditing(false) })}
              />
            )}

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
                <section className="space-y-4 rounded-3xl border-2 border-primary/10 bg-surface p-6 shadow-md">
                  <div className="border-b border-outline-variant/20 pb-3">
                    <p className="sc-kicker text-xs">Thao tác yêu cầu</p>
                    <h2 className="font-serif text-2xl font-bold text-primary">Ngân sách & Báo giá</h2>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      Nhập ngân sách mong muốn, gửi yêu cầu cho các tiệm bánh hoặc chỉnh sửa lại mẫu 3D.
                    </p>
                  </div>

                  {/* Direct Quick Budget & Delivery Card + Publish CTA when RFQ is still in DRAFT */}
                  {editableRequest(request, user) && (
                    <QuickBudgetDeliveryCard
                      request={request}
                      busy={action.busy}
                      onSaveOnly={(payload) => action.run(() => rfqService.updateRfq(id, payload))}
                      onSaveAndPublish={(payload) =>
                        action.run(async () => {
                          await rfqService.updateRfq(id, payload)
                          await rfqService.publishRfq(id)
                        })
                      }
                    />
                  )}

                  {/* Primary CTA: Bidding comparison */}
                  <button
                    type="button"
                    className={
                      (editableRequest(request, user)
                        ? 'w-full rounded-2xl border-2 border-primary/25 bg-surface-container-low py-3 px-4 text-sm font-bold text-primary hover:bg-primary/5 transition-colors'
                        : buttonClass + ' w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg transition-all') +
                      ' flex items-center justify-center gap-2 cursor-pointer'
                    }
                    onClick={() => onNavigate('bidding?cakeRequestId=' + id)}
                  >
                    <Icon name="local_offer" className="text-lg" /> So sánh báo giá từ các tiệm
                  </button>

                  {/* Order Tracking CTA when already ordered */}
                  {['ORDERED', 'OFFER_SELECTED'].includes(request.status) && (
                    <button
                      type="button"
                      className="w-full rounded-2xl border-2 border-emerald-600/30 bg-emerald-50 py-3 px-4 text-sm font-bold text-emerald-900 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      onClick={() => onNavigate('tracking')}
                    >
                      <Icon name="local_shipping" className="text-lg text-emerald-700" /> Xem đơn hàng & Theo dõi tiến độ
                    </button>
                  )}

                  {/* AI & 3D Studio CTAs */}
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <button
                      type="button"
                      className="w-full rounded-2xl border-2 border-secondary/30 bg-secondary/10 py-2.5 px-3 text-xs font-bold text-secondary hover:bg-secondary/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      onClick={() => onNavigate('ai-studio?cakeRequestId=' + id + '&mode=3d')}
                    >
                      <Icon name="view_in_ar" className="text-base" /> Sửa lại mẫu bánh 3D
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-2xl border-2 border-primary/20 bg-surface-container-low py-2.5 px-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      onClick={() => onNavigate('ai-studio?cakeRequestId=' + id + '&mode=prompt')}
                    >
                      <Icon name="auto_awesome" className="text-base text-secondary" /> Tạo thêm ảnh bằng AI
                    </button>
                  </div>

                  {/* Chat with target bakery if assigned */}
                  {request.targetBakeryId && !['DRAFT', 'CANCELLED'].includes(request.status) && (
                    <div className="pt-2 border-t border-outline-variant/20">
                      <ChatForRequest request={request} bakeryId={request.targetBakeryId} onNavigate={onNavigate} />
                    </div>
                  )}

                  {/* Secondary Full Draft Edit & Image Upload if DRAFT */}
                  {editableRequest(request, user) && (
                    <div className="space-y-3 pt-2 border-t border-outline-variant/20">
                      <button
                        disabled={action.busy}
                        className="w-full rounded-2xl border border-outline-variant/40 bg-surface py-2.5 px-4 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        onClick={() => setEditing(!editing)}
                      >
                        <Icon name="edit" className="text-sm text-secondary" />
                        {editing ? 'Đóng biểu mẫu chỉnh sửa chi tiết' : 'Sửa toàn bộ thông tin bản nháp'}
                      </button>

                      <details className="group rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3.5 text-xs">
                        <summary className="cursor-pointer font-semibold text-primary flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Icon name="add_photo_alternate" className="text-base text-secondary" /> Tải thêm ảnh tham khảo ngoài
                          </span>
                          <Icon name="expand_more" className="group-open:rotate-180 transition-transform text-outline" />
                        </summary>
                        <div className="mt-3 space-y-2.5 pt-2 border-t border-outline-variant/20">
                          <p className="text-outline">PNG/JPEG/WebP, 1–10 tệp, tối đa 10 MiB/tệp.</p>
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
                        </div>
                      </details>
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
  return (
    <MarketplaceState resource={resource}>
      {resource.data && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {resource.data.result.map((offer) => (
              <article className={panelClass + ' sc-offer-card space-y-3 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm'} key={offer.id}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
                  <p className="break-all text-xs font-bold text-primary">
                    Tiệm: {displayReference(offer.bakeryId, 'SHOP')}
                  </p>
                  <StatusBadge status={offer.status} label={OFFER_STATUS_LABELS[offer.status] || offer.status} />
                </div>

                <div>
                  <span className="text-xs text-outline">Tổng chi phí đề xuất:</span>
                  <h3 className="font-serif text-2xl font-bold text-primary">{moneyVnd(offer.totalPrice)}</h3>
                  {(offer.cakePrice != null || offer.deliveryFee != null) && (
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Tiền bánh: {moneyVnd(offer.cakePrice)} · Phí giao: {moneyVnd(offer.deliveryFee)}
                    </p>
                  )}
                </div>

                {offer.message && (
                  <p className="rounded-xl bg-surface-container-low p-3 text-xs italic text-on-surface-variant border border-outline-variant/20">
                    “{offer.message}”
                  </p>
                )}

                <div className="grid gap-1 text-xs text-on-surface-variant">
                  <p>Hoàn thành: <strong className="text-on-surface">{formatRfqDateTime(offer.estimatedCompletionAt)}</strong></p>
                  <p>Hết hạn: <strong className="text-on-surface">{formatRfqDateTime(offer.expiresAt)}</strong></p>
                </div>

                <button className={buttonClass + ' w-full py-2.5 text-sm font-bold'} onClick={() => onOpen(offer.id)}>
                  Chi tiết báo giá
                </button>
              </article>
            ))}
          </div>
          {!resource.data.result.length && (
            <section className={panelClass}>
              <EmptyPanel title="Chưa có báo giá." description="Báo giá từ tiệm sẽ xuất hiện tại đây khi có dữ liệu phù hợp." icon="description" />
            </section>
          )}
          <CatalogPagination meta={resource.data.meta} onPage={onPage} />
        </>
      )}
    </MarketplaceState>
  )
}

export function Offers({ cakeRequestId, bakeryId, scope, onOpen }) {
  const [filters, setFilters] = useState({ scope, cakeRequestId, bakeryId, page: 1, size: 12, sort: 'createdAt,desc', status: '' })
  const resource = useCatalogResource(loadOffers, filters)

  const isEmpty = resource.status === 'ready' && resource.data?.result?.length === 0

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

      {isEmpty && scope === 'received' && cakeRequestId && (
        <div className="text-center p-6 bg-surface-container-low rounded-3xl border border-primary/20 space-y-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-pulse" aria-hidden="true">storefront</span>
          <h3 className="font-serif text-lg font-bold text-primary">Các tiệm bánh đang xem xét yêu cầu của bạn</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Báo giá sẽ xuất hiện khi tiệm bánh gửi phản hồi. Bạn có thể tải lại để kiểm tra.
          </p>
          <button type="button" className={buttonClass} disabled={resource.refreshing} onClick={resource.reload}>Tải lại báo giá</button>
        </div>
      )}

      <OfferCards resource={resource} onPage={(page) => setFilters({ ...filters, page })} onOpen={onOpen} />
    </section>
  )
}
