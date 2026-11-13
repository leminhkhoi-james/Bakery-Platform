

import { displayReference } from '../../../services/displayReference.js'
import { publicCopy } from '../../../services/uiLabels.js'
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { aiService, loadAiJobs, loadAiJob } from '../../../services/aiService.js'
import { ApiError } from '../../../services/apiClient.js'
import { loadRfq, rfqService } from '../../../services/rfqService.js'
import { ownsRequest, toLocalInput, rfqPayload as validateRfqPayload } from '../../../services/marketplaceModels.js'
import { runningJob } from '../../../services/aiModels.js'
import { isCatalogId } from '../../../services/catalogModels.js'
import MarketplaceState from '../../../components/marketplace/MarketplaceState.jsx'
import { ReferenceImage } from '../../../components/marketplace/MarketplaceViews.jsx'
import { useMarketplaceAction } from '../../../hooks/useMarketplaceAction.js'
import { ApiErrorMessage, buttonClass, inputClass, panelClass } from '../../../components/management/ApiState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import DesignDetail from '../../../components/marketplace/DesignDetail.jsx'
import RequestPicker from '../../../components/marketplace/RequestPicker.jsx'
import { EmptyPanel, Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import Cake3DBuilder, {
  BUDGET_PRESETS,
  buildPromptRfqDraft,
  saveStudioRfqDraft,
} from './Cake3DBuilder.jsx'

const FAVORITE_DESIGNS_STORAGE_KEY = 'sweetcake.favoriteAiDesigns.v1'

function loadFavoriteAiDesigns() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return []
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITE_DESIGNS_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveFavoriteAiDesigns(list) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    window.localStorage.setItem(FAVORITE_DESIGNS_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // Ignore storage errors in private mode
  }
}

const JOB_STATUS_LABELS = {
  QUEUED: 'Đang chờ xử lý',
  PROCESSING: 'Đang tạo ảnh mẫu AI…',
  SUCCEEDED: 'Đã tạo xong ảnh mẫu AI',
  FAILED: 'Tạo mẫu không thành công',
  CANCELLED: 'Đã hủy',
}

const MODERATION_STATUS_LABELS = {
  APPROVED: 'Mẫu hợp lệ',
  PENDING: 'Đang kiểm duyệt',
  REJECTED: 'Chưa đạt chuẩn',
}

const RFQ_STATUS_LABELS = {
  DRAFT: 'Bản nháp (Chưa gửi báo giá)',
  OPEN: 'Đang mở nhận báo giá',
  OFFER_SELECTED: 'Đã chọn báo giá',
  ORDERED: 'Đã đặt hàng',
  EXPIRED: 'Đã hết hạn',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
}

function formatStudioDateTime(isoString) {
  if (!isoString) return 'Chưa hoàn tất'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  } catch {
    return isoString
  }
}

export function StudioModeTabs({ mode, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Chọn phương thức thiết kế bánh"
      className="grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-1.5 shadow-2xs"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === '3d'}
        onClick={() => onChange('3d')}
        className={`flex items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-left transition-all cursor-pointer ${
          mode === '3d'
            ? 'bg-primary text-on-primary shadow-sm'
            : 'bg-surface text-on-surface hover:bg-white'
        }`}
      >
        <Icon
          name="view_in_ar"
          className={`text-lg ${mode === '3d' ? 'text-amber-300' : 'text-primary'}`}
        />
        <span className="font-serif text-sm sm:text-base font-bold">
          Thiết kế bánh 3D (Xoay 360°)
        </span>
        <span
          className={`hidden sm:inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            mode === '3d'
              ? 'bg-amber-400/20 text-amber-200'
              : 'bg-secondary/15 text-secondary'
          }`}
        >
          3D Studio
        </span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={mode === 'prompt'}
        onClick={() => onChange('prompt')}
        className={`flex items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-left transition-all cursor-pointer ${
          mode === 'prompt'
            ? 'bg-primary text-on-primary shadow-sm'
            : 'bg-surface text-on-surface hover:bg-white'
        }`}
      >
        <Icon
          name="auto_awesome"
          className={`text-lg ${mode === 'prompt' ? 'text-amber-200' : 'text-secondary'}`}
        />
        <span className="font-serif text-sm sm:text-base font-bold">
          AI Tạo mẫu bánh theo yêu cầu
        </span>
        <span
          className={`hidden sm:inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            mode === 'prompt'
              ? 'bg-white/20 text-white'
              : 'bg-primary/10 text-primary'
          }`}
        >
          Quy trình 5 bước
        </span>
      </button>
    </div>
  )
}

export function AiWorkflowStepper({ currentStep = 1 }) {
  const steps = [
    { step: 1, title: 'Bước 1. Mô tả ý tưởng', desc: 'Nhập màu sắc, chủ đề, tên & tuổi' },
    { step: 2, title: 'Bước 2. AI tạo ảnh mẫu', desc: 'Xem ảnh bánh minh họa trực quan' },
    { step: 3, title: 'Bước 3. Chỉnh sửa & Lưu mẫu', desc: 'Tạo lại hoặc lưu mẫu yêu thích' },
    { step: 4, title: 'Bước 4. Chọn mẫu & Ngân sách', desc: 'Xác nhận mẫu, nhập giá & ngày nhận' },
    { step: 5, title: 'Bước 5. Đăng nhận báo giá', desc: 'Các tiệm bánh xem & gửi báo giá' },
  ]
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface px-3.5 py-2.5 shadow-2xs">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {steps.map((item) => {
          const isCurrent = item.step === currentStep
          const isDone = item.step < currentStep
          return (
            <div
              key={item.step}
              className={`flex items-start gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                isCurrent
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : isDone
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/70'
                    : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  isCurrent
                    ? 'bg-amber-300 text-stone-900'
                    : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-outline-variant/40 text-on-surface'
                }`}
              >
                {isDone ? '✓' : item.step}
              </span>
              <div className="min-w-0">
                <p className="font-bold truncate">{item.title}</p>
                <p className={`text-[10px] truncate ${isCurrent ? 'text-on-primary/80' : 'text-outline'}`}>
                  {item.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function GenerationForm({ cakeRequestId, existingRequest, jobId, disabled, onSubmitted, onNavigate, initialMode = 'prompt', initialPrompt = '', compactRevision = false }) {
  const [studioMode, setStudioMode] = useState(initialMode)
  const [prompt, setPrompt] = useState(initialPrompt || existingRequest?.description || '')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [numberOfDesigns, setNumberOfDesigns] = useState(2)
  const [images, setImages] = useState([])
  const [attempt, setAttempt] = useState(null)
  const action = useMarketplaceAction()

  const appendTagToPrompt = (tag) => {
    setPrompt((prev) => {
      const clean = prev.trim()
      if (!clean) return tag
      if (clean.toLowerCase().includes(tag.toLowerCase())) return clean
      return `${clean.replace(/[.,;]+$/, '')}, ${tag}`
    })
  }

  const submit = (snapshot) =>
    action.run(async () => {
      const result = jobId
        ? await aiService.reviseJob(jobId, snapshot.input, snapshot.key)
        : await aiService.createGenerationJob(snapshot.input, snapshot.images, snapshot.key)
      setAttempt(null)
      onSubmitted(result.id)
    })

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt)
  }, [initialPrompt])

  useEffect(() => {
    if (initialMode) setStudioMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (existingRequest && !prompt && existingRequest.description) {
      setPrompt(existingRequest.description)
    }
  }, [existingRequest])

  const handleApply3DToExistingRequest = (rfqDraft) => {
    if (disabled || action.busy || attempt) return
    action.run(async () => {
      const baseReq = existingRequest || (cakeRequestId ? await rfqService.getRfqById(cakeRequestId) : null)
      if (baseReq) {
        await rfqService.updateRfq(cakeRequestId, {
          requestType: baseReq.requestType || 'OPEN_CUSTOM',
          title: rfqDraft.title || baseReq.title,
          description: rfqDraft.description || baseReq.description,
          occasion: rfqDraft.occasion || baseReq.occasion,
          servingSize: rfqDraft.servingSize ?? baseReq.servingSize,
          budgetMin: rfqDraft.budgetMin !== '' ? rfqDraft.budgetMin : (baseReq.budgetMin ?? ''),
          budgetMax: rfqDraft.budgetMax !== '' ? rfqDraft.budgetMax : (baseReq.budgetMax ?? ''),
          neededAt: rfqDraft.neededAt || baseReq.neededAt,
          offerDeadline: rfqDraft.offerDeadline || baseReq.offerDeadline,
          deliveryDistrict: rfqDraft.deliveryDistrict || baseReq.deliveryDistrict,
          deliveryCity: rfqDraft.deliveryCity || baseReq.deliveryCity,
          targetBakeryId: baseReq.targetBakeryId || null,
          baseProductId: baseReq.baseProductId || null,
          optionSelections: baseReq.optionSelections || [],
          preference: {
            ...(baseReq.preference || {}),
            ...(rfqDraft.preference || {}),
          },
        })
      }
      if (onNavigate && cakeRequestId) {
        onNavigate('request-detail?id=' + cakeRequestId)
      }
    })
  }

  return (
    <div className="space-y-3.5">
      {!compactRevision && <StudioModeTabs mode={studioMode} onChange={setStudioMode} />}

      {!compactRevision && studioMode === '3d' ? (
        <div className="space-y-4">
          <Cake3DBuilder
            disabled={disabled || action.busy || !!attempt}
            forExistingRequest={Boolean(cakeRequestId)}
            initialOrderMeta={existingRequest}
            onSubmit3DDesign={(rfqDraft) => {
              handleApply3DToExistingRequest(rfqDraft)
            }}
          />
          {action.error && <ApiErrorMessage error={action.error} />}
        </div>
      ) : (
        <form
          className="rounded-3xl border border-outline-variant/30 bg-surface p-4 sm:p-5 shadow-sm sc-studio-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (disabled || action.busy || attempt) return
            const snapshot = {
              input: { cakeRequestId, prompt, negativePrompt, generationParameters: { aspectRatio, numberOfDesigns: Number(numberOfDesigns) } },
              images: [...images],
              key: crypto.randomUUID(),
            }
            setAttempt(snapshot)
            submit(snapshot)
          }}
        >
          <fieldset
            disabled={disabled || action.busy || !!attempt}
            className={compactRevision ? 'space-y-3.5' : 'grid gap-5 lg:grid-cols-12 items-start'}
          >
            {/* Left Column (8 cols): Bước 1 / Bước 3 — Mô tả ý tưởng chiếc bánh */}
            <div className={compactRevision ? 'space-y-3' : 'lg:col-span-8 space-y-3'}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-base sm:text-lg font-bold text-primary flex items-center gap-1.5">
                  <Icon name="auto_awesome" className="text-secondary" />
                  {jobId
                    ? 'Bước 3. Chỉnh sửa mô tả để AI tạo lại mẫu khác'
                    : 'Bước 1. Khách mô tả ý tưởng chiếc bánh mong muốn'}
                </h2>
                <span className="text-[11px] text-outline">Tối đa 4000 ký tự</span>
              </div>

              {/* Prompt Input */}
              <label className="block">
                <span className="sr-only">Mô tả ý tưởng chiếc bánh</span>
                <textarea
                  required
                  maxLength={4000}
                  rows={3}
                  placeholder="Ví dụ: Bánh sinh nhật màu xanh pastel, chủ đề biển, có vỏ sò, ghi chữ Happy Birthday Bé An 5 tuổi..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className={inputClass + ' w-full leading-relaxed text-sm'}
                />
              </label>

              {/* Collapsible Advanced Options (Negative Prompt & Reference Image Upload) */}
              <details className="group rounded-2xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2 text-xs">
                <summary className="cursor-pointer font-semibold text-on-surface-variant flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Icon name="tune" className="text-sm text-secondary" />
                    Tuỳ chọn nâng cao (Chi tiết cần tránh & Ảnh tham khảo đính kèm)
                  </span>
                  <Icon name="expand_more" className="group-open:rotate-180 transition-transform text-outline" />
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 pt-2.5 border-t border-outline-variant/20">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-on-surface">Chi tiết cần tránh (tùy chọn)</span>
                    <input
                      type="text"
                      maxLength={2000}
                      placeholder="VD: tránh màu tối, không dùng phẩm màu đậm..."
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className={inputClass + ' w-full text-xs bg-white'}
                    />
                  </label>
                  {!jobId && (
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-on-surface">
                        Ảnh mẫu (tối đa 5 ảnh, 10 MiB/ảnh)
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp"
                        className={inputClass + ' w-full text-xs bg-white'}
                        onChange={(e) => setImages(Array.from(e.target.files))}
                      />
                    </label>
                  )}
                </div>
              </details>
            </div>

            {/* Right Column (4 cols): Bước 2 — Cấu hình tạo ảnh AI & Nguyên tắc nghiệp vụ */}
            <div className={compactRevision ? 'space-y-3 pt-2 border-t border-outline-variant/20' : 'lg:col-span-4 space-y-3 rounded-2xl border border-primary/20 bg-surface-container-low p-4'}>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-on-surface">Tỉ lệ khung hình</span>
                  <select className={inputClass + ' w-full text-xs py-1.5 bg-white'} value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                    <option value="1:1">1:1 (Vuông)</option>
                    <option value="4:3">4:3 (Ngang)</option>
                    <option value="3:4">3:4 (Bánh cao tầng)</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-on-surface">Số ảnh mẫu (1–4)</span>
                  <input
                    required
                    min={1}
                    max={4}
                    type="number"
                    className={inputClass + ' w-full text-xs py-1.5 bg-white'}
                    value={numberOfDesigns}
                    onChange={(e) => setNumberOfDesigns(e.target.value)}
                  />
                </label>
              </div>

              <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-2.5 text-[11px] leading-relaxed text-amber-950">
                <strong className="font-bold">Nguyên tắc AI:</strong> AI chỉ tạo ảnh minh họa theo mô tả, không tự quyết định giá và chưa đồng nghĩa với việc đã đặt bánh. Sau khi xem ảnh, bạn sẽ chọn 1 mẫu ưng ý và nhập ngân sách ở Bước 4.
              </div>

              {action.error && <ApiErrorMessage error={action.error} />}

              {attempt ? (
                <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <p>Hệ thống chưa nhận được phản hồi. Bấm thử lại sẽ giữ nguyên nội dung.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={buttonClass} disabled={disabled || action.busy} onClick={() => submit(attempt)}>
                      Thử lại cùng yêu cầu
                    </button>
                    {[400, 422].includes(action.error?.status) && (
                      <button type="button" className="font-semibold text-primary underline" disabled={action.busy} onClick={() => setAttempt(null)}>
                        Sửa dữ liệu bị từ chối
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  className={buttonClass + ' flex w-full items-center justify-center gap-2 py-3 text-sm font-bold shadow-md transition-all hover:shadow-lg cursor-pointer'}
                  disabled={disabled || action.busy}
                >
                  <Icon name="auto_awesome" className="text-lg" />
                  {action.busy
                    ? 'Đang tạo ảnh mẫu AI…'
                    : jobId
                      ? 'Bước 3. Tạo lại ảnh mẫu AI theo mô tả mới'
                      : 'Bước 2. Tạo ảnh mẫu bánh bằng AI'}
                </button>
              )}
            </div>
          </fieldset>
        </form>
      )}
    </div>
  )
}

export function DesignResults({ detail, busy, onSelect, favorites = [], onToggleFavorite, selectedDesignId = null }) {
  const promptText = detail?.promptRevisions?.[0]?.prompt || ''
  return (
    <section className="space-y-4 rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-sm sc-studio-results">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-primary">
            <Icon name="auto_awesome" className="text-secondary" /> Bước 2 & 3. Ảnh mẫu bánh AI minh họa
          </h2>
          <p className="text-xs text-on-surface-variant">
            Lưu các mẫu yêu thích để so sánh hoặc bấm <strong>“Chọn mẫu này & Tạo yêu cầu đặt bánh”</strong> để sang Bước 4 nhập ngân sách, ngày giờ nhận bánh.
          </p>
        </div>
        <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
          {detail.generatedDesigns.length} mẫu minh họa
        </span>
      </div>

      {/* Business rule notice from Section 4 */}
      <div className="flex items-start gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-950">
        <Icon name="info" className="text-base text-secondary shrink-0 mt-0.5" />
        <div>
          <strong>Lưu ý nghiệp vụ:</strong> AI chỉ tạo ảnh minh họa theo mô tả, không cam kết chiếc bánh thực tế giống hoàn toàn ảnh. Tạo ảnh chưa đồng nghĩa với việc đã đặt bánh — bạn chỉ cần chọn <strong>1 mẫu ưng ý nhất</strong> để gửi yêu cầu cho các tiệm báo giá.
        </div>
      </div>

      {!detail.generatedDesigns.length && (
        <div className="rounded-2xl bg-surface-container-low p-5 text-center text-sm text-outline">
          Chưa có thiết kế được tạo.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 items-stretch">
        {detail.generatedDesigns.map((design, idx) => {
          const isFav = favorites.some((fav) => fav.id === design.id)
          const isSelected = selectedDesignId === design.id
          return (
            <article
              key={design.id}
              className={`group flex flex-col justify-between h-full rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md bg-white/95 backdrop-blur-xs ${
                isSelected
                  ? 'border-2 border-primary bg-primary/5 ring-2 ring-primary/15'
                  : 'border-outline-variant/30 hover:border-primary/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={design.moderationStatus} label={MODERATION_STATUS_LABELS[design.moderationStatus] || design.moderationStatus} />
                    <span className="text-xs font-bold text-primary">Mẫu #{idx + 1}</span>
                  </div>
                  {onToggleFavorite && design.moderationStatus === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleFavorite({
                          id: design.id,
                          imageUrl: design.imageUrl,
                          prompt: promptText,
                          cakeRequestId: detail.job?.cakeRequestId,
                          jobId: detail.job?.id,
                          savedAt: new Date().toISOString(),
                        })
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        isFav
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : 'bg-surface-container/70 text-on-surface-variant hover:bg-rose-50 hover:text-rose-600'
                      }`}
                      title={isFav ? 'Bỏ lưu yêu thích' : 'Lưu mẫu bánh này'}
                    >
                      <Icon name={isFav ? 'favorite' : 'favorite_border'} className="text-sm" />
                      <span>{isFav ? 'Đã lưu' : 'Lưu mẫu'}</span>
                    </button>
                  )}
                </div>

                {/* Design Image Card: Uniform 4:3 Aspect Ratio with zoom hover */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-low shadow-inner">
                  {design.moderationStatus === 'APPROVED' ? (
                    <img
                      src={design.imageUrl}
                      alt={`Mẫu thiết kế #${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-6 text-center text-xs text-outline">
                      Ảnh đang trong quá trình kiểm duyệt hoặc chưa đạt chuẩn an toàn.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button: Step 4 - Always pinned at bottom for horizontal alignment */}
              <div className="pt-3 mt-3 border-t border-outline-variant/15">
                <button
                  className={buttonClass + ' flex w-full items-center justify-center gap-2 py-2.5 px-3 text-xs sm:text-sm font-bold shadow-sm transition-all hover:shadow-md cursor-pointer rounded-xl'}
                  disabled={busy || detail.job.status !== 'SUCCEEDED' || design.moderationStatus !== 'APPROVED' || !onSelect}
                  onClick={() => onSelect?.(design.id, design)}
                >
                  <Icon name="check_circle" className="text-base" />
                  <span>{isSelected ? 'Đang chọn mẫu này' : 'Chọn mẫu này để nhận báo giá'}</span>
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Step4CreateRequestFromAiPanel({
  selectedDesign,
  promptText,
  existingRequest,
  cakeRequestId,
  busy,
  onCancel,
  onSubmitRequest,
}) {
  const [confirmedSample, setConfirmedSample] = useState(true)
  const [title, setTitle] = useState(
    () => existingRequest?.title && !existingRequest.title.includes('Đang phác thảo')
      ? existingRequest.title
      : `Bánh thiết kế theo mẫu AI: ${(promptText || 'Mẫu bánh riêng').slice(0, 55)}`
  )
  const [description, setDescription] = useState(() => promptText || existingRequest?.description || '')
  const [budgetMin, setBudgetMin] = useState(() => existingRequest?.budgetMin != null ? String(existingRequest.budgetMin) : '500000')
  const [budgetMax, setBudgetMax] = useState(() => existingRequest?.budgetMax != null ? String(existingRequest.budgetMax) : '800000')
  const [servingSize, setServingSize] = useState(() => existingRequest?.servingSize != null ? String(existingRequest.servingSize) : '10')
  const [quantity, setQuantity] = useState('1')
  const [occasion, setOccasion] = useState(() => existingRequest?.occasion || 'Sinh nhật / Kỷ niệm')
  const [fulfillmentMethod, setFulfillmentMethod] = useState('Giao tận nơi')
  const [deliveryDistrict, setDeliveryDistrict] = useState(() => existingRequest?.deliveryDistrict || 'Quận 1')
  const [deliveryCity, setDeliveryCity] = useState(() => existingRequest?.deliveryCity || 'TP. Hồ Chí Minh')
  const [neededAt, setNeededAt] = useState(() =>
    toLocalInput(existingRequest?.neededAt || new Date(Date.now() + 5 * 86400000).toISOString())
  )
  const [offerDeadline, setOfferDeadline] = useState(() =>
    toLocalInput(existingRequest?.offerDeadline || new Date(Date.now() + 2 * 86400000).toISOString())
  )
  const [specialNotes, setSpecialNotes] = useState(() => existingRequest?.preference?.decorationNotes || '')
  const [allergyNotes, setAllergyNotes] = useState(() => existingRequest?.preference?.allergyNotes || '')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (typeof document === 'undefined') return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  if (!selectedDesign) return null

  const buildPayload = () => {
    const qtyNote = Number(quantity) > 1 ? `Số lượng cần đặt: ${quantity} chiếc bánh. ` : 'Số lượng: 1 chiếc bánh. '
    const methodNote = `Phương thức nhận bánh: ${fulfillmentMethod} (${deliveryDistrict}, ${deliveryCity}). `
    const combinedDecorationNotes = `${qtyNote}${methodNote}${specialNotes.trim()}`.trim()
    return {
      requestType: existingRequest?.requestType || 'OPEN_CUSTOM',
      title: title.trim() || 'Yêu cầu đặt bánh theo mẫu AI',
      description: description.trim() || promptText || 'Đặt bánh kem theo ảnh mẫu AI đính kèm.',
      occasion: occasion.trim() || 'Sinh nhật / Kỷ niệm',
      servingSize: Number(servingSize) || 10,
      budgetMin,
      budgetMax,
      neededAt,
      offerDeadline,
      deliveryDistrict: deliveryDistrict.trim() || 'Quận 1',
      deliveryCity: deliveryCity.trim() || 'TP. Hồ Chí Minh',
      targetBakeryId: existingRequest?.targetBakeryId || null,
      baseProductId: existingRequest?.baseProductId || null,
      optionSelections: existingRequest?.optionSelections || [],
      preference: {
        ...(existingRequest?.preference || {}),
        decorationNotes: combinedDecorationNotes.slice(0, 4000),
        allergyNotes: allergyNotes.trim().slice(0, 4000),
        extraOptions: {
          ...(existingRequest?.preference?.extraOptions || {}),
          fulfillmentMethod,
          quantity: Number(quantity) || 1,
        },
      },
    }
  }

  function submitConfirmation(publish) {
    if (busy || !confirmedSample) return
    setValidationError('')
    try {
      const payload = buildPayload()
      validateRfqPayload(payload)
      onSubmitRequest(payload, publish)
    } catch (error) {
      setValidationError(error.message)
    }
  }

  const dialogContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xác nhận mẫu AI và gửi yêu cầu nhận báo giá"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) onCancel()
      }}
    >
      <section
        id="step-4-create-request-panel"
        className="my-auto w-full max-w-2xl flex flex-col rounded-3xl border border-outline-variant/30 bg-surface shadow-2xl overflow-hidden max-h-[88vh]"
      >
        {/* Sticky Dialog Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4 bg-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm shadow-xs">
              4
            </span>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-primary">
                Gửi yêu cầu nhận báo giá
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Các tiệm bánh lân cận sẽ xem mẫu và gửi bảng báo giá cho bạn lựa chọn
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Đóng / Chọn mẫu khác"
            >
              ✕
            </button>
          )}
        </div>

        {/* Scrollable Dialog Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1 overscroll-contain">
          {/* Selected Cake Card */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <img
              src={selectedDesign.imageUrl}
              alt="Mẫu bánh AI khách đã chọn"
              className="h-20 w-20 shrink-0 rounded-xl object-cover border border-primary/25 shadow-xs"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  ✓ Mẫu đã chọn
                </span>
                <span className="font-mono text-[10px] text-outline">{displayReference(selectedDesign.id, 'ART')}</span>
              </div>
              <p className="text-xs font-bold text-primary line-clamp-1">
                {title}
              </p>
              <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Section 1: Budget */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Icon name="payments" className="text-sm text-secondary" />
                Ngân sách dự kiến của bạn:
              </span>
              <span className="text-xs font-bold text-primary font-mono">
                {Number(budgetMin).toLocaleString('vi-VN')}đ – {Number(budgetMax).toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BUDGET_PRESETS.map((preset) => {
                const active = budgetMin === preset.min && budgetMax === preset.max
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setBudgetMin(preset.min)
                      setBudgetMax(preset.max)
                    }}
                    className={`rounded-xl border py-2 px-2 text-xs font-bold transition-all cursor-pointer text-center ${
                      active
                        ? 'border-primary bg-primary text-white shadow-xs'
                        : 'border-outline-variant/30 bg-surface-container-low text-on-surface hover:border-primary/50'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Quantity & Event */}
          <div className="grid grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-on-surface">Số lượng bánh</span>
              <input
                type="number"
                min={1}
                max={20}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={inputClass + ' w-full text-xs font-bold py-2 bg-surface-container-lowest'}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-on-surface">Số người ăn</span>
              <input
                type="number"
                min={1}
                max={200}
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                className={inputClass + ' w-full text-xs font-bold py-2 bg-surface-container-lowest'}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-on-surface">Dịp tiệc</span>
              <input
                type="text"
                maxLength={100}
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="VD: Sinh nhật"
                className={inputClass + ' w-full text-xs py-2 bg-surface-container-lowest'}
              />
            </label>
          </div>

          {/* Section 3: Time & Location */}
          <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                  <Icon name="event" className="text-sm text-secondary" /> Ngày giờ cần nhận bánh *
                </span>
                <input
                  type="datetime-local"
                  required
                  value={neededAt}
                  onChange={(e) => setNeededAt(e.target.value)}
                  className={inputClass + ' w-full text-xs py-2 bg-white'}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-on-surface">Hạn nhận báo giá</span>
                <input type="datetime-local" value={offerDeadline} max={neededAt || undefined}
                  onChange={event => setOfferDeadline(event.target.value)}
                  className={inputClass + ' w-full text-xs py-2 bg-white'} />
                <span className="text-xs text-on-surface-variant">Để trống nếu không đặt hạn riêng. Hạn phải ở tương lai và trước thời gian nhận bánh.</span>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                  <Icon name="local_shipping" className="text-sm text-secondary" /> Phương thức nhận
                </span>
                <select
                  value={fulfillmentMethod}
                  onChange={(e) => setFulfillmentMethod(e.target.value)}
                  className={inputClass + ' w-full text-xs py-2 bg-white'}
                >
                  <option value="Giao tận nơi">Giao tận nơi</option>
                  <option value="Nhận tại tiệm">Tự đến tiệm lấy</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-on-surface">Quận / Huyện *</span>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={deliveryDistrict}
                  onChange={(e) => setDeliveryDistrict(e.target.value)}
                  className={inputClass + ' w-full text-xs py-2 bg-white'}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-on-surface">Tỉnh / Thành phố *</span>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className={inputClass + ' w-full text-xs py-2 bg-white'}
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-on-surface">
                Ghi chú thêm cho tiệm bánh (chữ viết lên bánh, dị ứng, lưu ý...)
              </span>
              <input
                type="text"
                maxLength={500}
                placeholder="VD: Viết chữ Happy Birthday, cốt ít ngọt, không đậu phộng..."
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className={inputClass + ' w-full text-xs py-2 bg-white'}
              />
            </label>
          </div>

          {/* Section 4: Confirmation checkbox */}
          <label className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-950 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedSample}
              onChange={(e) => setConfirmedSample(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary shrink-0"
            />
            <span className="text-[11px] leading-relaxed">
              Tôi xác nhận chọn mẫu bánh AI này để gửi tới các tiệm bánh báo giá và hiểu rằng tiệm sẽ dựa vào ảnh để tư vấn chiếc bánh thực tế.
            </span>
          </label>
        </div>

        {validationError && <p role="alert" className="px-5 py-2 text-sm text-red-700">{validationError}</p>}
        {/* Sticky Dialog Footer */}
        <div className="border-t border-outline-variant/20 bg-surface px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-outline-variant/40 bg-surface px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
          >
            Quay lại
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy || !confirmedSample}
              onClick={() => submitConfirmation(false)}
              className="rounded-xl border border-outline-variant/40 bg-surface px-3.5 py-2 text-xs font-bold text-on-surface hover:bg-surface-container cursor-pointer disabled:opacity-50"
            >
              Lưu nháp
            </button>
            <button
              type="button"
              disabled={busy || !confirmedSample}
              onClick={() => submitConfirmation(true)}
              className={buttonClass + ' flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50'}
            >
              <Icon name="send" className="text-base" />
              <span>{busy ? 'Đang gửi…' : 'Gửi yêu cầu nhận báo giá'}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(dialogContent, document.body) : dialogContent
}

function JobDetail({ id, onNavigate, favorites, onToggleFavorite }) {
  const { user } = useAuth()
  const resource = useCatalogResource(loadAiJob, { id, user })
  const action = useMarketplaceAction(resource.reload)
  const job = resource.data?.job
  const status = job?.status
  const { error, reload } = resource
  const latestPrompt =
    resource.data?.promptRevisions?.at(-1)?.prompt ||
    resource.data?.promptRevisions?.[0]?.prompt ||
    ''
  const [revisePrompt, setRevisePrompt] = useState('')
  const [reviseRatio, setReviseRatio] = useState('1:1')
  const [reviseCount, setReviseCount] = useState(2)
  const [selectedFavoriteForOrder, setSelectedFavoriteForOrder] = useState(null)

  useEffect(() => {
    if (latestPrompt) setRevisePrompt(latestPrompt)
  }, [latestPrompt])

  useEffect(() => {
    if (!runningJob(status) || error) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') reload()
    }, 1200)
    return () => clearInterval(timer)
  }, [status, error, reload])

  const handleRegenerateNow = (promptToUse) => {
    const clean = String(promptToUse || latestPrompt || '').trim()
    if (!clean || action.busy || runningJob(status)) return
    action.run(async () => {
      await aiService.reviseJob(
        id,
        {
          prompt: clean,
          negativePrompt: '',
          generationParameters: {
            aspectRatio: reviseRatio,
            numberOfDesigns: Number(reviseCount) || 2,
          },
        },
        crypto.randomUUID()
      )
      resource.reload()
    })
  }

  return (
    <MarketplaceState kind="Cake AI" resource={resource}>
      {resource.data && (
        <div className="space-y-3.5 pt-2">
          <AiWorkflowStepper currentStep={status === 'SUCCEEDED' ? 3 : 2} />

          {/* Compact Top Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-outline-variant/30 bg-surface px-4 py-2 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => onNavigate('ai-studio' + (job?.cakeRequestId ? '?cakeRequestId=' + job.cakeRequestId + '&mode=prompt' : '?mode=prompt'))}
              className="inline-flex items-center gap-1.5 font-semibold text-secondary hover:underline cursor-pointer"
            >
              <Icon name="arrow_back" className="text-base" /> Quay lại khung thiết kế chính
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {['SUCCEEDED', 'FAILED'].includes(status) && (
                <button
                  type="button"
                  disabled={action.busy}
                  onClick={() => handleRegenerateNow(revisePrompt || latestPrompt)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 border border-amber-300 px-3 py-1.5 font-bold text-amber-950 hover:bg-amber-200 transition-colors cursor-pointer"
                >
                  <Icon name="autorenew" className="text-sm text-primary" />
                  Tạo lại mẫu khác ngay
                </button>
              )}
              {job?.cakeRequestId && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('request-detail?id=' + job.cakeRequestId)}
                    className="inline-flex items-center gap-1 rounded-xl border border-primary/25 bg-primary/5 px-3 py-1.5 font-bold text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    <Icon name="visibility" className="text-sm" /> Xem Yêu cầu & Ngân sách
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('bidding?cakeRequestId=' + job.cakeRequestId)}
                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 font-bold text-on-primary shadow-xs cursor-pointer"
                  >
                    <Icon name="local_offer" className="text-xs" /> Sàn báo giá
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 2-Column Side-by-Side Split Layout: Left (8 cols = 2 x 4 cols) | Right (4 cols, sticky = 1 x 4 cols) -> PERFECT 4:4:4 SYMMETRY! */}
          <div className="grid gap-5 lg:grid-cols-12 items-start">
            {/* Left Column (8 cols): 2 Generated Cake Designs (4 cols each) */}
            <div className="lg:col-span-8 space-y-4">
              {runningJob(status) && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950">
                  <p className="flex items-center gap-2 font-semibold">
                    <Icon name="sync" className="animate-spin text-base text-primary" />
                    Bước 2: Hệ thống đang vẽ ảnh mẫu bánh AI theo mô tả của bạn…
                  </p>
                  <button
                    type="button"
                    className={buttonClass + ' py-1.5 px-3 text-xs'}
                    disabled={action.busy}
                    onClick={() => action.run(() => aiService.cancelJob(id))}
                  >
                    Hủy tạo mẫu
                  </button>
                </div>
              )}

              {job.errorMessage && (
                <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                  {job.errorMessage}
                </p>
              )}

              <JobRequestContext
                detail={resource.data}
                busy={action.busy}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
                externalSelectedDesign={selectedFavoriteForOrder}
                onClearExternalSelected={() => setSelectedFavoriteForOrder(null)}
                onSubmitted={() => resource.reload()}
                onNavigate={onNavigate}
              />
            </div>

            {/* Right Column (4 cols, sticky): Bước 3 — Tạo lại mẫu / Chỉnh sửa mô tả ngay cạnh ảnh */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-36">
              <section className="space-y-3.5 rounded-3xl border border-outline-variant/30 bg-surface/95 backdrop-blur-md p-4 sm:p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={job.status} label={JOB_STATUS_LABELS[job.status] || ('Trạng thái: ' + job.status)} />
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                      Lần tạo #{resource.data.currentRevision || 1}
                    </span>
                  </div>
                  <button type="button" className="flex items-center gap-1 text-xs font-semibold text-secondary hover:underline cursor-pointer" onClick={resource.reload}>
                    <Icon name="refresh" className="text-sm" /> Làm mới
                  </button>
                </div>

                {/* Step 3 Right inside the sticky sidebar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-sm sm:text-base font-bold text-primary flex items-center gap-1.5">
                      <Icon name="edit" className="text-base text-secondary" />
                      Bước 3. Sửa mô tả & Tạo lại
                    </h3>
                  </div>

                  <label className="block">
                    <span className="sr-only">Mô tả ý tưởng để tạo lại</span>
                    <textarea
                      rows={5}
                      maxLength={4000}
                      value={revisePrompt}
                      onChange={(e) => setRevisePrompt(e.target.value)}
                      disabled={action.busy || runningJob(status)}
                      placeholder="Nhập mô tả màu sắc, phong cách, chi tiết bánh cần điều chỉnh..."
                      className={inputClass + ' w-full text-xs leading-relaxed bg-surface-container-lowest'}
                    />
                  </label>

                  {/* Instant regeneration button */}
                  <div>
                    <button
                      type="button"
                      disabled={action.busy || runningJob(status) || !revisePrompt.trim()}
                      onClick={() => handleRegenerateNow(revisePrompt)}
                      className={buttonClass + ' w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold shadow-sm cursor-pointer'}
                    >
                      <Icon name="auto_awesome" className="text-base" />
                      {action.busy ? 'Đang tạo lại…' : 'Vẽ lại theo mô tả'}
                    </button>
                  </div>

                  {/* Design & Order Tips Card - Balances height with Left Column */}
                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs space-y-1 text-amber-950">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                      <Icon name="lightbulb" className="text-sm text-secondary" />
                      Mẹo tinh chỉnh mẫu bánh
                    </div>
                    <ul className="space-y-0.5 text-[11px] leading-relaxed text-amber-900/90 pl-1">
                      <li>• Nêu rõ <strong>màu sắc & chủ đề</strong> (vd: hồng pastel, vương miện).</li>
                      <li>• Sau khi ưng ý, bấm <strong>"Chọn mẫu này để nhận báo giá"</strong>.</li>
                    </ul>
                  </div>
                </div>

                {/* Saved Favorites Quick Drawer inside Right Sidebar */}
                {favorites.length > 0 && (
                  <div className="border-t border-outline-variant/20 pt-3 space-y-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <Icon name="favorite" className="text-sm text-rose-600" />
                      Mẫu yêu thích đã lưu ({favorites.length})
                    </span>
                    <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
                      {favorites.filter(fav => fav.cakeRequestId === detail.job.cakeRequestId).map((fav) => (
                        <div
                          key={fav.id}
                          className="group relative rounded-xl border border-outline-variant/30 bg-surface-container-low p-1"
                        >
                          <img
                            src={fav.imageUrl}
                            alt="Mẫu đã lưu"
                            className="h-14 w-full rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedFavoriteForOrder(detail.generatedDesigns.find(design => design.id === fav.id && design.moderationStatus === 'APPROVED') || null)}
                            className="mt-1 w-full rounded-md bg-primary py-0.5 text-[10px] font-bold text-on-primary cursor-pointer"
                          >
                            Chọn đặt
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>

          {action.error && <ApiErrorMessage error={action.error} retry={resource.reload} />}
        </div>
      )}
    </MarketplaceState>
  )
}

function JobRequestContext({ detail, busy, favorites, onToggleFavorite, externalSelectedDesign, onClearExternalSelected, onNavigate }) {
  const { user } = useAuth(), resource = useCatalogResource(loadRfq, { id: detail.job.cakeRequestId })
  const requestAction = useMarketplaceAction(resource.reload)
  const [selectedDesignForStep4, setSelectedDesignForStep4] = useState(null)
  const activeDesignForStep4 = selectedDesignForStep4 || externalSelectedDesign || null
  const mutable = resource.data && ownsRequest(resource.data, user) && ['DRAFT', 'OPEN'].includes(resource.data.status)
  const latestPrompt = detail.promptRevisions?.at(-1)?.prompt || detail.promptRevisions?.[0]?.prompt || ''

  const handleConfirmStep4And5 = (rfqPayload, publishNow) => {
    if (!activeDesignForStep4) return
    requestAction.run(async () => {
      const targetRequestId = detail.job.cakeRequestId
      if (resource.data && resource.data.status === 'DRAFT') {
        await rfqService.updateRfq(targetRequestId, rfqPayload)
      }
      await rfqService.selectDesign(targetRequestId, activeDesignForStep4.id)
      if (publishNow && resource.data?.status === 'DRAFT') {
        await rfqService.publishRfq(targetRequestId)
      }
      onNavigate('request-detail?id=' + targetRequestId)
    })
  }

  return (
    <div className="space-y-3.5">
      <DesignResults
        detail={detail}
        busy={busy || requestAction.busy}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
        selectedDesignId={activeDesignForStep4?.id || resource.data?.selectedDesignId || null}
        onSelect={
          mutable
            ? (designId, designObj) => {
                const resolved = designObj || detail.generatedDesigns.find((d) => d.id === designId)
                onClearExternalSelected?.()
                setSelectedDesignForStep4(resolved || { id: designId })
              }
            : null
        }
      />

      {activeDesignForStep4 && mutable && (
        <Step4CreateRequestFromAiPanel
          selectedDesign={activeDesignForStep4}
          promptText={activeDesignForStep4.prompt || latestPrompt}
          existingRequest={resource.data}
          cakeRequestId={detail.job.cakeRequestId}
          busy={busy || requestAction.busy}
          onCancel={() => {
            setSelectedDesignForStep4(null)
            onClearExternalSelected?.()
          }}
          onSubmitRequest={handleConfirmStep4And5}
        />
      )}

      {requestAction.error && <ApiErrorMessage error={requestAction.error} />}

      <MarketplaceState resource={resource}>
        {resource.data && !mutable && (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 text-center text-xs text-outline">
            Yêu cầu đặt bánh này đã chốt báo giá hoặc không thuộc quyền chỉnh sửa của bạn.
          </div>
        )}
      </MarketplaceState>
    </div>
  )
}

function CreateForRequest({ id, disabled, onSubmitted, onNavigate, initialMode = '', initialPrompt = '' }) {
  const { user } = useAuth(), resource = useCatalogResource(loadRfq, { id })
  const req = resource.data
  const resolvedMode =
    initialMode === 'prompt' || initialMode === '3d'
      ? initialMode
      : req?.preference?.extraOptions?.cake3DConfig || req?.title?.includes('3D')
        ? '3d'
        : 'prompt'

  return (
    <MarketplaceState resource={resource}>
      {req && (
        <div className="space-y-4">
          <AiWorkflowStepper currentStep={1} />
          {/* Compact RFQ Context Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/30 bg-surface px-4 py-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name="cake" className="text-lg" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Đang thiết kế mẫu cho:</span>
                  <StatusBadge status={req.status} label={RFQ_STATUS_LABELS[req.status] || req.status} />
                  <span className="text-xs text-outline">📍 {req.deliveryDistrict}, {req.deliveryCity}</span>
                </div>
                <h3 className="font-serif text-base font-bold text-primary">
                  {req.title}
                </h3>
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('request-detail?id=' + id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Icon name="arrow_back" className="text-sm" /> Quay lại Chi tiết yêu cầu & Báo giá
              </button>
            )}
          </div>

          <GenerationForm
            cakeRequestId={id}
            existingRequest={req}
            initialMode={resolvedMode}
            initialPrompt={initialPrompt}
            disabled={disabled || !ownsRequest(req, user) || !['DRAFT', 'OPEN'].includes(req.status)}
            onSubmitted={onSubmitted}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </MarketplaceState>
  )
}

export default function AiCakeStudioPage({ onNavigate, routeSearch = '' }) {
  const { user } = useAuth()
  const quickAttempt = useRef(null)
  const query = new URLSearchParams(routeSearch), cakeRequestId = query.get('cakeRequestId'), jobId = query.get('jobId')
  const explicitMode = query.get('mode')
  const [page, setPage] = useState(1), [status, setStatus] = useState('')
  const [entryMode, setEntryMode] = useState(explicitMode === 'prompt' ? 'prompt' : '3d')
  const [draft3DPrompt, setDraft3DPrompt] = useState(() => query.get('prompt') || '')
  const [quickAspectRatio, setQuickAspectRatio] = useState('1:1')
  const [quickDesignsCount, setQuickDesignsCount] = useState(2)
  const [favorites, setFavorites] = useState(() => loadFavoriteAiDesigns())
  const [selectedFavoriteForOrder, setSelectedFavoriteForOrder] = useState(null)
  const resource = useCatalogResource(loadAiJobs, { cakeRequestId, page: page - 1, size: 12, status })
  const quickAction = useMarketplaceAction(resource.reload)
  const openJob = (id) => onNavigate('ai-studio?' + (cakeRequestId ? 'cakeRequestId=' + cakeRequestId + '&' : '') + 'jobId=' + id)

  const handleToggleFavorite = (designItem) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === designItem.id)
      const next = exists ? prev.filter((item) => item.id !== designItem.id) : [designItem, ...prev]
      saveFavoriteAiDesigns(next)
      return next
    })
  }

  const handleDirectCreate3DRfq = (rfqDraft) => {
    if (quickAction.busy) return
    quickAction.run(async () => {
      const createdRfq = await rfqService.createRfq(rfqDraft)
      onNavigate('request-detail?id=' + createdRfq.id)
    })
  }

  // Step 1 -> Step 2: Generate AI cake designs from prompt (creates a workspace draft transparently for the job ID, while the user only confirms & publishes in Step 4 & 5!)
  const handleStep1GenerateAiImages = (promptText) => {
    const cleanPrompt = String(promptText || '').trim()
    if (!cleanPrompt || quickAction.busy) return
    quickAction.run(async () => {
      const draftWorkspace = buildPromptRfqDraft(cleanPrompt, {
        budgetMin: '500000',
        budgetMax: '800000',
        deliveryDistrict: 'Quận 1',
        deliveryCity: 'TP. Hồ Chí Minh',
      })
      const signature = JSON.stringify([user?.id, cleanPrompt, quickAspectRatio, quickDesignsCount])
      if (quickAttempt.current?.signature !== signature) quickAttempt.current = { signature, key: crypto.randomUUID() }
      const attempt = quickAttempt.current
      if (!attempt.request) {
        attempt.request = await rfqService.createRfq({
          ...draftWorkspace,
          title: `Phác thảo AI: ${cleanPrompt.slice(0, 52)}`,
        })
      }
      const createdRfq = attempt.request
      const createdJob = await aiService.createGenerationJob(
        {
          cakeRequestId: createdRfq.id,
          prompt: cleanPrompt,
          negativePrompt: '',
          generationParameters: { aspectRatio: quickAspectRatio, numberOfDesigns: Number(quickDesignsCount) || 2 },
        },
        [],
        attempt.key
      )
      quickAttempt.current = null
      onNavigate('ai-studio?cakeRequestId=' + createdRfq.id + '&jobId=' + createdJob.id)
    })
  }

  const openSavedFavorite = (favorite) => {
    quickAction.run(async () => {
      const detail = await aiService.getGenerationJob(favorite.jobId, user, { allowMockFallback: false })
      const design = detail.generatedDesigns.find(item => item.id === favorite.id)
      if (design?.moderationStatus !== 'APPROVED' || !design.imageUrl || detail.job.cakeRequestId !== favorite.cakeRequestId) {
        throw new ApiError('Mẫu bánh đã lưu hiện không khả dụng.', 422)
      }
      const request = await rfqService.getRfqById(detail.job.cakeRequestId)
      if (!ownsRequest(request, user) || !['DRAFT', 'OPEN'].includes(request.status)) {
        throw new ApiError('Yêu cầu gốc không còn cho phép chọn mẫu bánh.', 409)
      }
      if (request.status === 'OPEN') {
        await rfqService.selectDesign(request.id, design.id)
        onNavigate('request-detail?id=' + request.id)
        return
      }
      setSelectedFavoriteForOrder({ ...favorite, imageUrl: design.imageUrl, request })
    })
  }

  // Step 4 & 5 from a Saved Favorite Design
  const handleCreateRequestFromSavedFavorite = (rfqPayload, publishNow) => {
    if (!selectedFavoriteForOrder || quickAction.busy) return
    quickAction.run(async () => {
      const requestId = selectedFavoriteForOrder.cakeRequestId
      const request = await rfqService.getRfqById(requestId)
      if (!ownsRequest(request, user) || !['DRAFT', 'OPEN'].includes(request.status)) {
        throw new ApiError('Yêu cầu gốc không còn cho phép chọn mẫu bánh.', 409)
      }
      if (request.status === 'DRAFT') await rfqService.updateRfq(requestId, rfqPayload)
      await rfqService.selectDesign(requestId, selectedFavoriteForOrder.id)
      if (publishNow && request.status === 'DRAFT') await rfqService.publishRfq(requestId)
      onNavigate('request-detail?id=' + requestId)
    })
  }

  return (
    <div className="sc-customer sc-studio-page mx-auto max-w-6xl space-y-5 px-4 py-5">
      {/* Compact Top Header */}
      <div className="sc-customer-heading flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="flex items-center gap-2 font-serif text-2xl sm:text-3xl font-semibold text-primary">
            <Icon name="auto_awesome" /> Thiết kế Bánh 3D & AI Studio
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-surface px-3.5 py-2 text-xs font-bold text-primary shadow-2xs hover:bg-primary/5 cursor-pointer"
            onClick={() => onNavigate('rfq-new')}
          >
            <Icon name="add_circle" className="text-sm text-secondary" /> Biểu mẫu đặt bánh
          </button>
          <button className={buttonClass + ' flex items-center gap-1.5 py-2 px-3.5 text-xs shadow-xs'} onClick={() => onNavigate('rfqs')}>
            <Icon name="cake" className="text-sm" /> Yêu cầu bánh của tôi
          </button>
        </div>
      </div>

      {quickAction.error && <ApiErrorMessage error={quickAction.error} />}

      {/* When no cakeRequestId is selected yet, allow designing immediately in both 3D Cake Builder and Prompt AI */}
      {!cakeRequestId && !jobId && (
        <div className="space-y-4">
          <StudioModeTabs mode={entryMode} onChange={setEntryMode} />

          {entryMode === '3d' ? (
            <Cake3DBuilder
              disabled={quickAction.busy}
              onCreateRfqWith3D={(rfqDraft) => {
                saveStudioRfqDraft(rfqDraft)
                onNavigate('rfq-new')
              }}
              onSubmit3DDesign={(rfqDraft) => {
                handleDirectCreate3DRfq(rfqDraft)
              }}
            />
          ) : (
            <div className="space-y-4">
              <AiWorkflowStepper currentStep={selectedFavoriteForOrder ? 4 : 1} />

              <section className="rounded-3xl border border-outline-variant/30 bg-surface p-4 sm:p-5 shadow-sm">
                <div className="grid gap-5 lg:grid-cols-12 items-start">
                  {/* Left Column (7 cols): Bước 1 — Khách mô tả ý tưởng chiếc bánh */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-serif text-base sm:text-lg font-bold text-primary flex items-center gap-1.5">
                        <Icon name="auto_awesome" className="text-secondary" />
                        Bước 1. Mô tả chiếc bánh bạn mong muốn
                      </h2>
                      <span className="text-[11px] text-outline">Tối đa 4000 ký tự</span>
                    </div>

                    <label className="block">
                      <span className="sr-only">Mô tả ý tưởng chiếc bánh của bạn</span>
                      <textarea
                        rows={3}
                        maxLength={4000}
                        placeholder="Ví dụ: Bánh sinh nhật màu xanh pastel, chủ đề biển, có vỏ sò, ghi tên người nhận và số tuổi..."
                        value={draft3DPrompt}
                        onChange={(e) => setDraft3DPrompt(e.target.value)}
                        className={inputClass + ' w-full leading-relaxed text-sm'}
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-on-surface">Khung hình ảnh AI</span>
                        <select className={inputClass + ' w-full text-xs py-1.5'} value={quickAspectRatio} onChange={(e) => setQuickAspectRatio(e.target.value)}>
                          <option value="1:1">1:1 (Vuông chuẩn)</option>
                          <option value="4:3">4:3 (Khung ngang)</option>
                          <option value="3:4">3:4 (Bánh cao tầng)</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-on-surface">Số lượng ảnh mẫu (1–4)</span>
                        <input
                          type="number"
                          min={1}
                          max={4}
                          value={quickDesignsCount}
                          onChange={(e) => setQuickDesignsCount(e.target.value)}
                          className={inputClass + ' w-full text-xs py-1.5'}
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={quickAction.busy || !draft3DPrompt.trim()}
                      onClick={() => handleStep1GenerateAiImages(draft3DPrompt)}
                      className={buttonClass + ' w-full flex items-center justify-center gap-2 py-3 text-sm font-bold shadow-md cursor-pointer'}
                    >
                      <Icon name="auto_awesome" className="text-lg" />
                      {quickAction.busy ? 'Đang gửi mô tả tới AI…' : 'Bước 2. Tạo ảnh mẫu bánh bằng AI ngay'}
                    </button>
                  </div>

                  {/* Right Column (5 cols): Quy tắc nghiệp vụ AI & Bộ sưu tập mẫu yêu thích đã lưu */}
                  <div className="lg:col-span-5 space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                    <div className="flex items-start gap-2.5 border-b border-outline-variant/20 pb-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-amber-200">
                        <Icon name="verified_user" className="text-base" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900">Quy tắc tạo mẫu bánh bằng AI</h3>
                        <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5">
                          • <strong>AI chỉ hỗ trợ tạo ảnh minh họa</strong> theo mô tả, không tự quyết định giá và không tự chọn tiệm.<br />
                          • <strong>Tạo ảnh chưa phải là đặt bánh:</strong> Bạn thoải mái tạo & chỉnh sửa nhiều ảnh mẫu, lưu mẫu yêu thích rồi mới chọn 1 mẫu ưng ý nhất để nhập ngân sách và gửi yêu cầu báo giá ở Bước 4.
                        </p>
                      </div>
                    </div>

                    {/* Saved Favorite AI Designs Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Icon name="favorite" className="text-sm text-rose-600" />
                          Mẫu bánh AI yêu thích đã lưu ({favorites.length})
                        </span>
                      </div>

                      {favorites.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-white/70 p-3 text-center text-xs text-outline">
                          Sau khi AI tạo ảnh ở Bước 2, bạn có thể bấm <strong>“♥ Lưu mẫu yêu thích”</strong> để giữ lại các mẫu đẹp tại đây.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {favorites.map((fav) => (
                            <div
                              key={fav.id}
                              className="group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-white p-1.5 shadow-2xs"
                            >
                              <img
                                src={fav.imageUrl}
                                alt="Mẫu yêu thích"
                                className="h-20 w-full rounded-lg object-cover"
                              />
                              <p className="mt-1 truncate text-[10px] font-medium text-on-surface">
                                {fav.prompt || 'Mẫu bánh AI'}
                              </p>
                              <div className="mt-1 flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={quickAction.busy}
                                  onClick={() => openSavedFavorite(fav)}
                                  className="flex-1 rounded-lg bg-primary px-1.5 py-1 text-[10px] font-bold text-on-primary cursor-pointer"
                                >
                                  Chọn đặt bánh
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFavorite(fav)}
                                  title="Bỏ lưu"
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-1.5 py-1 text-[10px] text-rose-700 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {selectedFavoriteForOrder && (
                <Step4CreateRequestFromAiPanel
                  key={selectedFavoriteForOrder.id}
                  selectedDesign={selectedFavoriteForOrder}
                  promptText={selectedFavoriteForOrder.prompt}
                  existingRequest={selectedFavoriteForOrder.request}
                  cakeRequestId={selectedFavoriteForOrder.cakeRequestId}
                  busy={quickAction.busy}
                  onCancel={() => setSelectedFavoriteForOrder(null)}
                  onSubmitRequest={handleCreateRequestFromSavedFavorite}
                />
              )}
            </div>
          )}
        </div>
      )}

      {cakeRequestId && !isCatalogId(cakeRequestId) && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Mã yêu cầu bánh không hợp lệ.
        </p>
      )}

      {isCatalogId(cakeRequestId) && !jobId && (
        <CreateForRequest
          key={cakeRequestId}
          id={cakeRequestId}
          initialMode={explicitMode || ''}
          initialPrompt={draft3DPrompt}
          disabled={resource.status !== 'ready'}
          onSubmitted={openJob}
          onNavigate={onNavigate}
        />
      )}

      {jobId && (
        <JobDetail
          key={jobId}
          id={jobId}
          onNavigate={onNavigate}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Secondary Drawers: Existing Requests & Generation History (Collapsed by default so there is zero forced scrolling) */}
      <div className="grid gap-4 lg:grid-cols-2 items-start pt-2">
        {!cakeRequestId && !jobId && (
          <details className="group rounded-2xl border border-outline-variant/30 bg-surface p-4 shadow-2xs">
            <summary className="cursor-pointer font-serif text-base font-bold text-primary flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Icon name="folder_open" className="text-lg text-secondary" />
                Chọn yêu cầu đặt bánh có sẵn để thiết kế
              </span>
              <Icon name="expand_more" className="group-open:rotate-180 transition-transform text-outline" />
            </summary>
            <div className="mt-3 pt-3 border-t border-outline-variant/20">
              <RequestPicker
                title="Chọn yêu cầu để thiết kế AI"
                allowedStatuses={['DRAFT', 'OPEN']}
                onSelect={(id) => onNavigate('ai-studio?cakeRequestId=' + id + (entryMode === '3d' ? '&mode=3d' : '&mode=prompt'))}
              />
            </div>
          </details>
        )}

        <details className={`group rounded-2xl border border-outline-variant/30 bg-surface p-4 shadow-2xs ${cakeRequestId || jobId ? 'lg:col-span-2' : ''}`}>
          <summary className="cursor-pointer font-serif text-base font-bold text-primary flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Icon name="history" className="text-lg text-primary" />
              Lịch sử tạo mẫu bánh AI ({resource.data?.meta?.totalElements ?? 0})
            </span>
            <Icon name="expand_more" className="group-open:rotate-180 transition-transform text-outline" />
          </summary>
          <div className="mt-3 space-y-4 pt-3 border-t border-outline-variant/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-on-surface-variant">Các phiên tạo mẫu bánh AI trước đây (Tạo ảnh AI độc lập với đơn hàng)</span>
              <label className="flex items-center gap-2 text-xs font-semibold text-outline">
                <span>Trạng thái</span>
                <select className={inputClass + ' px-3 py-1 text-xs'} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
                  <option value="">Tất cả trạng thái</option>
                  <option value="QUEUED">Đang chờ xử lý</option>
                  <option value="PROCESSING">Đang tạo mẫu</option>
                  <option value="SUCCEEDED">Đã hoàn thành</option>
                  <option value="FAILED">Không thành công</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </label>
            </div>

            <MarketplaceState kind="Cake AI" resource={resource}>
              {resource.data && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {resource.data.result.map((job) => (
                      <article className="space-y-2.5 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 shadow-2xs" key={job.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <StatusBadge status={job.status} label={JOB_STATUS_LABELS[job.status] || job.status} />
                          <span className="text-xs font-medium text-on-surface-variant">
                            {job.modelName?.includes('không gọi AI') ? 'Mẫu phác thảo hệ thống' : (job.modelName || 'SweetCake AI')}
                          </span>
                        </div>
                        <p className="text-xs text-outline">{formatStudioDateTime(job.createdAt)}</p>
                        <button className={buttonClass + ' w-full py-2 text-xs'} onClick={() => openJob(job.id)}>
                          Xem ảnh mẫu & Chọn đặt bánh
                        </button>
                      </article>
                    ))}
                  </div>
                  {!resource.data.result.length && (
                    <section className={panelClass}>
                      <EmptyPanel title="Chưa có lịch sử thiết kế." description="Nhập ý tưởng ở Bước 1 để AI tạo mẫu bánh minh họa." icon="auto_awesome" />
                    </section>
                  )}
                  <CatalogPagination meta={resource.data.meta} onPage={setPage} />
                </>
              )}
            </MarketplaceState>
          </div>
        </details>
      </div>
    </div>
  )
}
