import { displayReference } from '../../../services/displayReference.js'
import { publicCopy } from '../../../services/uiLabels.js'
import { isMockRecord } from '../../../mockData/runtime.js'
import { STYLE_PROMPTS } from '../../../mockData/customer/aiDesigns.js'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { aiService, loadAiJobs, loadAiJob } from '../../../services/aiService.js'
import { loadRfq, rfqService } from '../../../services/rfqService.js'
import { ownsRequest } from '../../../services/marketplaceModels.js'
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

const JOB_STATUS_LABELS = {
  QUEUED: 'Đang chờ xử lý',
  PROCESSING: 'Đang tạo mẫu bánh…',
  SUCCEEDED: 'Đã hoàn thành thiết kế',
  FAILED: 'Tạo mẫu không thành công',
  CANCELLED: 'Đã hủy',
}

const MODERATION_STATUS_LABELS = {
  APPROVED: 'Mẫu hợp lệ',
  PENDING: 'Đang kiểm duyệt',
  REJECTED: 'Chưa đạt chuẩn',
}

const RFQ_STATUS_LABELS = {
  DRAFT: 'Bản nháp',
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

export function GenerationForm({ cakeRequestId, jobId, disabled, onSubmitted }) {
  const [prompt, setPrompt] = useState(''), [negativePrompt, setNegativePrompt] = useState(''), [aspectRatio, setAspectRatio] = useState('1:1'), [numberOfDesigns, setNumberOfDesigns] = useState(1), [images, setImages] = useState([]), [attempt, setAttempt] = useState(null)
  const action = useMarketplaceAction()
  const isMock = isMockRecord(cakeRequestId) || isMockRecord(jobId)
  const submit = (snapshot) => action.run(async () => { const result = jobId ? await aiService.reviseJob(jobId, snapshot.input, snapshot.key) : await aiService.createGenerationJob(snapshot.input, snapshot.images, snapshot.key); setAttempt(null); onSubmitted(result.id) })

  return (
    <form
      className="space-y-6 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm sc-studio-form"
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="auto_awesome" className="text-xl" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-primary">
              <Icon name="magic_button" /> {jobId ? 'Thử lại với mô tả ý tưởng mới' : 'Thiết kế mẫu bánh bằng AI'}
            </h2>
            <p className="text-xs text-on-surface-variant">
              Mô tả ý tưởng bánh chi tiết để hệ thống tạo hình ảnh phác thảo 3D trực quan
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
          <Icon name="verified" className="text-sm" /> Trợ lý thiết kế SweetCake
        </span>
      </div>

      <fieldset disabled={disabled || action.busy || !!attempt} className="space-y-4">
        {/* Style Suggestions Chips */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-outline">
            <Icon name="palette" className="text-sm text-secondary" /> Gợi ý phong cách nhanh:
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLE_PROMPTS.map((style) => (
              <button
                type="button"
                key={style.label}
                disabled={disabled || action.busy || !!attempt}
                className="cursor-pointer rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:border-primary hover:text-primary"
                onClick={() => setPrompt(style.text)}
              >
                ✨ {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <label className="block space-y-1.5">
          <span className="flex items-center justify-between text-sm font-semibold text-primary">
            <span>Mô tả ý tưởng chiếc bánh</span>
            <span className="text-xs font-normal text-outline">Tối đa 4000 ký tự</span>
          </span>
          <textarea
            required
            maxLength={4000}
            rows={4}
            placeholder="Ví dụ: Bánh sinh nhật Pikachu tạo hình fondant 3D 2 tầng tone vàng tươi sáng, có trang trí kẹo mút và dâu tây ngọt ngào..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className={inputClass + ' w-full leading-relaxed'}
          />
        </label>

        {/* Negative Prompt */}
        <label className="block space-y-1.5">
          <span className="flex items-center justify-between text-sm font-semibold text-on-surface">
            <span>Chi tiết cần tránh</span>
            <span className="text-xs font-normal text-outline">Tùy chọn</span>
          </span>
          <textarea
            maxLength={2000}
            rows={2}
            placeholder="Ví dụ: tránh màu tối u ám, không tạo hình biến dạng, không kèm chữ nguệch ngoạc..."
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className={inputClass + ' w-full'}
          />
        </label>

        {/* Ratio & Number of designs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-on-surface">Tỉ lệ ảnh</span>
            <select className={inputClass + ' w-full'} value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
              {['1:1', '4:3', '3:4'].map((ratio) => <option key={ratio}>{ratio}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-on-surface">Số thiết kế</span>
            <input
              required
              min={1}
              max={4}
              type="number"
              className={inputClass + ' w-full'}
              value={numberOfDesigns}
              onChange={(e) => setNumberOfDesigns(e.target.value)}
            />
          </label>
        </div>

        {/* Image Source Upload */}
        {!jobId && (
          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
              <Icon name="add_photo_alternate" className="text-secondary" />
              Ảnh mẫu tham khảo (tối đa 5 ảnh PNG/JPEG/WebP, 10 MiB/ảnh)
            </span>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className={inputClass + ' w-full text-xs'}
              onChange={(e) => setImages(Array.from(e.target.files))}
            />
          </label>
        )}
      </fieldset>

      <div className="flex items-start gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-xs text-on-surface-variant">
        <Icon name="info" className="mt-0.5 shrink-0 text-sm text-secondary" />
        <p className="text-sm">
          {isMock
            ? 'Các phác thảo gợi ý giúp bạn chọn ý tưởng và trao đổi với tiệm.'
            : 'Hệ thống tự động phác thảo hình ảnh và kiểm duyệt tiêu chuẩn an toàn. Bạn có thể chọn mẫu bánh ưng ý nhất để đính kèm vào yêu cầu gửi tiệm làm bánh.'}
        </p>
      </div>

      {action.error && <ApiErrorMessage error={action.error} />}

      {attempt ? (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <p>Hệ thống chưa nhận được phản hồi. Bấm thử lại sẽ giữ nguyên nội dung để tránh tạo trùng bản thiết kế.</p>
          <div className="flex flex-wrap items-center gap-3">
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
          className={buttonClass + ' flex w-full items-center justify-center gap-2 py-3.5 text-base font-bold shadow-md transition-all hover:shadow-lg'}
          disabled={disabled || action.busy}
        >
          <Icon name="auto_awesome" className="text-xl" />
          {action.busy ? 'Đang gửi…' : 'Bắt đầu tạo thiết kế'}
        </button>
      )}
    </form>
  )
}

export function DesignResults({ detail, busy, onSelect }) {
  return (
    <section className="space-y-6 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm sc-studio-results">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-primary">
            <Icon name="auto_awesome" className="text-secondary" /> Bản thiết kế bánh
          </h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Chọn mẫu bánh ưng ý nhất để gắn vào yêu cầu gửi tiệm báo giá
          </p>
        </div>
        <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
          {detail.generatedDesigns.length} mẫu phác thảo
        </span>
      </div>

      {!detail.generatedDesigns.length && (
        <div className="rounded-2xl bg-surface-container-low p-6 text-center text-sm text-outline">
          Chưa có thiết kế được tạo.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {detail.generatedDesigns.map((design) => (
          <article key={design.id} className="space-y-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <StatusBadge status={design.moderationStatus} label={MODERATION_STATUS_LABELS[design.moderationStatus] || design.moderationStatus} />
              <span className="max-w-[60%] truncate text-xs text-on-surface-variant">
                {publicCopy(design.moderationReason, 'Phác thảo tham khảo')}
              </span>
            </div>

            {/* Design Image Card */}
            <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low">
              {design.moderationStatus === 'APPROVED' ? (
                <ReferenceImage url={design.imageUrl} label="Thiết kế bánh" />
              ) : (
                <div className="p-8 text-center text-xs text-outline">
                  Ảnh đang trong quá trình kiểm duyệt hoặc chưa đạt chuẩn an toàn.
                </div>
              )}
            </div>

            {/* Technical Detail Collapsible */}
            <details className="text-xs text-outline">
              <summary className="flex cursor-pointer items-center gap-1 font-semibold text-secondary hover:underline">
                <Icon name="visibility" className="text-sm" /> Xem chi tiết thiết kế
              </summary>
              <div className="mt-2 border-t border-outline-variant/20 pt-2">
                <DesignDetail id={design.id} jobId={detail.job.id} />
              </div>
            </details>

            {/* Action Button */}
            <button
              className={buttonClass + ' flex w-full items-center justify-center gap-1.5 py-3 text-sm font-bold shadow-sm transition-all hover:shadow-md'}
              disabled={busy || detail.job.status !== 'SUCCEEDED' || design.moderationStatus !== 'APPROVED' || !onSelect}
              onClick={() => onSelect?.(design.id)}
            >
              <Icon name="check_circle" className="text-base" />
              Dùng thiết kế này cho yêu cầu bánh
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function JobDetail({ id, onNavigate }) {
  const { user } = useAuth(), resource = useCatalogResource(loadAiJob, { id, user }), action = useMarketplaceAction(resource.reload)
  const job = resource.data?.job
  const status = job?.status
  const { error, reload } = resource
  useEffect(() => { if (!runningJob(status) || error) return; const timer = setInterval(() => { if (document.visibilityState === 'visible') reload() }, 5000); return () => clearInterval(timer) }, [status, error, reload])

  return (
    <MarketplaceState kind="Cake AI" resource={resource}>
      {resource.data && (
        <div className="space-y-6">
          {/* Job Overview Card */}
          <section className="space-y-5 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-2.5">
                <StatusBadge status={job.status} label={JOB_STATUS_LABELS[job.status] || ('Trạng thái: ' + job.status)} />
                <span className="font-mono text-xs text-outline">Mã thiết kế: {displayReference(job.id, 'AI')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
                  {job.modelName?.includes('không gọi AI') ? 'Mẫu phác thảo hệ thống' : (job.modelName || 'SweetCake AI')}
                </span>
                <span className="text-xs text-outline">Phiên bản: {resource.data.currentRevision}</span>
              </div>
            </div>

            {/* Prompt Recap Card */}
            {resource.data.promptRevisions && resource.data.promptRevisions.length > 0 && (
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-800">
                  <span className="flex items-center gap-1.5">
                    <Icon name="auto_awesome" className="text-base text-amber-700" />
                    Ý tưởng mô tả mẫu bánh:
                  </span>
                  <span className="font-mono font-normal text-amber-700">Phiên bản {resource.data.promptRevisions[0]?.revisionNumber}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm font-medium italic leading-relaxed text-amber-950">
                  Phiên bản {resource.data.promptRevisions[0]?.revisionNumber}: {resource.data.promptRevisions[0]?.prompt}
                </p>
                {resource.data.promptRevisions[0]?.negativePrompt && (
                  <p className="mt-2 border-t border-amber-200/60 pt-2 text-xs text-amber-800/80">
                    · Tránh: {resource.data.promptRevisions[0]?.negativePrompt}
                  </p>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3">
                <Icon name="schedule" className="text-base text-primary" />
                <span>Thời gian tạo: <strong className="font-medium text-on-surface">{formatStudioDateTime(job.createdAt)}</strong></span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3">
                <Icon name="task_alt" className="text-base text-secondary" />
                <span>Hoàn tất lúc: <strong className="font-medium text-on-surface">{formatStudioDateTime(job.completedAt)}</strong></span>
              </div>
            </div>

            {job.errorMessage && (
              <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                {job.errorMessage}
              </p>
            )}

            {runningJob(status) && (
              <div className="space-y-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-xs">
                <p className="flex items-center gap-1.5 font-semibold text-on-surface">
                  <Icon name="sync" className="animate-spin text-primary" />
                  Hệ thống đang tạo mẫu bánh; tự động cập nhật khi hoàn tất.
                </p>
                <button
                  type="button"
                  className={buttonClass + ' py-2 text-xs'}
                  disabled={action.busy}
                  onClick={() => action.run(() => aiService.cancelJob(id))}
                >
                  Hủy yêu cầu tạo mẫu
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button type="button" className="flex items-center gap-1 text-xs font-semibold text-secondary hover:underline" onClick={resource.reload}>
                <Icon name="refresh" className="text-sm" /> Cập nhật trạng thái
              </button>
            </div>

            {/* Source Images if any */}
            {resource.data.sourceImages && resource.data.sourceImages.length > 0 && (
              <div className="space-y-2 border-t border-outline-variant/20 pt-2">
                <p className="text-xs font-semibold text-outline">Ảnh mẫu tham khảo đã đính kèm:</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {resource.data.sourceImages.map((image) => (
                    <ReferenceImage key={image.id} url={image.url} label="Ảnh mẫu tham khảo" />
                  ))}
                </div>
              </div>
            )}
          </section>

          <JobRequestContext
            detail={resource.data}
            busy={action.busy}
            onSelect={(designId) => action.run(async () => {
              await rfqService.selectDesign(resource.data.job.cakeRequestId, designId)
              onNavigate('request-detail?id=' + resource.data.job.cakeRequestId)
            })}
            onSubmitted={() => resource.reload()}
          />

          {action.error && <ApiErrorMessage error={action.error} retry={resource.reload} />}
        </div>
      )}
    </MarketplaceState>
  )
}

function JobRequestContext({ detail, busy, onSelect, onSubmitted }) {
  const { user } = useAuth(), resource = useCatalogResource(loadRfq, { id: detail.job.cakeRequestId })
  const mutable = resource.data && ownsRequest(resource.data, user) && ['DRAFT', 'OPEN'].includes(resource.data.status)
  return (
    <>
      <DesignResults detail={detail} busy={busy} onSelect={mutable ? onSelect : null} />
      <MarketplaceState resource={resource}>
        {resource.data && !mutable && (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 text-center text-xs text-outline">
            Yêu cầu đặt bánh này đã chốt báo giá hoặc không thuộc quyền chỉnh sửa của bạn.
          </div>
        )}
      </MarketplaceState>
      {['SUCCEEDED', 'FAILED'].includes(detail.job.status) && (
        <GenerationForm jobId={detail.job.id} cakeRequestId={detail.job.cakeRequestId} disabled={!mutable} onSubmitted={onSubmitted} />
      )}
    </>
  )
}

function CreateForRequest({ id, disabled, onSubmitted }) {
  const { user } = useAuth(), resource = useCatalogResource(loadRfq, { id })
  return (
    <MarketplaceState resource={resource}>
      {resource.data && (
        <div className="space-y-6">
          {/* RFQ Target Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon name="cake" className="text-2xl" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-outline">Yêu cầu đặt bánh đang áp dụng</span>
                  <StatusBadge status={resource.data.status} label={RFQ_STATUS_LABELS[resource.data.status] || resource.data.status} />
                </div>
                <h3 className="mt-0.5 font-serif text-lg font-bold text-primary">
                  {resource.data.title}
                </h3>
              </div>
            </div>
            <div className="text-xs text-outline">
              <p>📍 {resource.data.deliveryDistrict}, {resource.data.deliveryCity}</p>
            </div>
          </div>

          <GenerationForm
            cakeRequestId={id}
            disabled={disabled || !ownsRequest(resource.data, user) || !['DRAFT', 'OPEN'].includes(resource.data.status)}
            onSubmitted={onSubmitted}
          />
        </div>
      )}
    </MarketplaceState>
  )
}

export default function AiCakeStudioPage({ onNavigate, routeSearch = '' }) {
  const query = new URLSearchParams(routeSearch), cakeRequestId = query.get('cakeRequestId'), jobId = query.get('jobId')
  const [page, setPage] = useState(1), [status, setStatus] = useState('')
  const resource = useCatalogResource(loadAiJobs, { cakeRequestId, page: page - 1, size: 12, status })
  const openJob = (id) => onNavigate('ai-studio?' + (cakeRequestId ? 'cakeRequestId=' + cakeRequestId + '&' : '') + 'jobId=' + id)

  return (
    <main className="sc-customer sc-studio-page mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Top Header */}
      <div className="sc-customer-heading flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="sc-kicker">Từ ý tưởng đến bản thiết kế trực quan</p>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-semibold text-primary">
            <Icon name="auto_awesome" /> AI Cake Studio
          </h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            Tạo mẫu phác thảo bánh 3D theo ý tưởng riêng cho các yêu cầu bánh của bạn, giúp tiệm bánh dễ dàng hình dung và gửi báo giá chuẩn xác.
          </p>
        </div>
        <button className={buttonClass + ' flex items-center gap-1.5 shadow-sm'} onClick={() => onNavigate('rfqs')}>
          <Icon name="cake" className="text-base" /> Yêu cầu bánh của tôi
        </button>
      </div>

      {!cakeRequestId && (
        <RequestPicker
          title="Chọn yêu cầu để thiết kế AI"
          allowedStatuses={['DRAFT', 'OPEN']}
          onSelect={(id) => onNavigate('ai-studio?cakeRequestId=' + id)}
        />
      )}

      {cakeRequestId && !isCatalogId(cakeRequestId) && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Mã yêu cầu bánh không hợp lệ.
        </p>
      )}

      {isCatalogId(cakeRequestId) && !jobId && (
        <CreateForRequest key={cakeRequestId} id={cakeRequestId} disabled={resource.status !== 'ready'} onSubmitted={openJob} />
      )}

      {jobId && <JobDetail key={jobId} id={jobId} onNavigate={onNavigate} />}

      {/* Generation History */}
      <section className="space-y-4 border-t border-outline-variant/30 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-primary">
            <Icon name="history" className="text-primary" /> Lịch sử thiết kế mẫu bánh
          </h2>
          <label className="flex items-center gap-2 text-xs font-semibold text-outline">
            <span>Trạng thái</span>
            <select className={inputClass + ' px-3 py-1.5 text-xs'} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
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
              <div className="grid gap-4 sm:grid-cols-2">
                {resource.data.result.map((job) => (
                  <article className="space-y-3 rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-sm transition-shadow hover:shadow-md" key={job.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge status={job.status} label={JOB_STATUS_LABELS[job.status] || job.status} />
                      <span className="text-xs font-medium text-on-surface-variant">
                        {job.modelName?.includes('không gọi AI') ? 'Mẫu phác thảo hệ thống' : (job.modelName || 'SweetCake AI')}
                      </span>
                    </div>
                    <p className="text-xs text-outline">{formatStudioDateTime(job.createdAt)}</p>
                    <button className={buttonClass + ' w-full py-2 text-xs'} onClick={() => openJob(job.id)}>
                      Xem chi tiết mẫu bánh
                    </button>
                  </article>
                ))}
              </div>
              {!resource.data.result.length && (
                <section className={panelClass}>
                  <EmptyPanel title="Chưa có lịch sử thiết kế." description="Chọn một yêu cầu đặt bánh để bắt đầu tạo mẫu." icon="auto_awesome" />
                </section>
              )}
              <CatalogPagination meta={resource.data.meta} onPage={setPage} />
            </>
          )}
        </MarketplaceState>
      </section>
    </main>
  )
}

