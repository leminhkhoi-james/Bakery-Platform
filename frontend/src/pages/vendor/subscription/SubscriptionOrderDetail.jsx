import { displayReference } from '../../../services/displayReference.js'
import { uiLabel, cleanPresentationLabel } from '../../../services/uiLabels.js'
import { planName } from '../../../services/planPresentation.js'
import React, { useRef, useState } from 'react'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionOrder, subscriptionService } from '../../../services/subscriptionService.js'
import { canSubmitSubscriptionPayment, formatSubscriptionDate, formatSubscriptionMoney, subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { FeatureList, ResourceState, SubscriptionError } from '../../../components/subscription/SubscriptionView.jsx'

const defaultBankTransfer = {
  bankName: 'Vietcombank (Chi nhánh TP.HCM)',
  accountNumber: '1932628888',
  accountName: 'SWEETCAKE PLATFORM',
}

const getPaymentOptions = (_params, options) => subscriptionService.getPaymentOptions({}, options)

function CopyButton({ text, label = 'Sao chép' }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore clipboard error
    }
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-primary/25 hover:bg-primary-fixed-dim text-primary transition-all cursor-pointer shadow-2xs"
    >
      <span className="material-symbols-outlined text-xs">
        {copied ? 'check' : 'content_copy'}
      </span>
      <span>{copied ? 'Đã sao chép' : label}</span>
    </button>
  )
}

function ReceiptUploader({ file, onChange, disabled }) {
  const [preview, setPreview] = useState(null)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (!f) {
      setPreview(null)
      onChange(null)
      return
    }
    onChange(f)
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  // Update preview when file changes
  React.useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreview(null)
    }
  }, [file])

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-primary">
        Ảnh biên lai / Chứng từ chuyển khoản (Tùy chọn nếu có mã giao dịch)
      </label>
      <input
        ref={inputRef}
        name="proof"
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
      {!file ? (
        <div
          onClick={() => { if (!disabled) inputRef.current?.click() }}
          className="border-2 border-dashed border-primary/30 hover:border-primary rounded-2xl p-4 sm:p-5 text-center cursor-pointer bg-surface hover:bg-primary/5 transition-all space-y-1.5"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">upload_file</span>
          </div>
          <p className="text-xs font-bold text-primary">Bấm để tải lên ảnh biên lai chuyển khoản</p>
          <p className="text-[11px] text-on-surface-variant">Ảnh chụp màn hình biên lai chuyển tiền từ ứng dụng ngân hàng (PNG, JPG, PDF tối đa 10 MB)</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-primary/20 bg-primary/5">
          {preview ? (
            <img src={preview} alt="Biên lai" className="w-14 h-14 object-cover rounded-xl border border-primary/20 shadow-2xs shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-2xl">description</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-primary truncate">{file.name}</p>
            <p className="text-[11px] text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB · Biên lai hợp lệ</p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleFile(null)}
            className="p-1.5 rounded-full hover:bg-red-50 text-red-600 cursor-pointer"
            title="Xóa tệp"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default function SubscriptionOrderDetail({ orderId, bakeryId, roles, onChanged, onBusy, revision = 0 }) {
  const resource = useCatalogResource(loadSubscriptionOrder, { orderId, bakeryId, revision })
  const paymentOptions = useCatalogResource(getPaymentOptions, { orderId })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [paymentReference, setPaymentReference] = useState('')
  const form = useRef(null), inFlight = useRef(false)
  const order = resource.data
  const bankTransfer = paymentOptions.data?.bankTransfer || defaultBankTransfer
  const paymentConfigured = paymentOptions.status === 'ready'

  const transferContent = order?.orderNumber || order?.id || ''

  async function submit(event) {
    event.preventDefault()
    if (inFlight.current || busy || !order || !paymentConfigured) return
    const file = selectedFile
    const ref = paymentReference.trim()
    if (!file && !ref) return

    inFlight.current = true
    const request = attempt || {
      key: crypto.randomUUID(),
      orderId,
      amount: order.totalAmount,
      currency: order.currency,
      paymentMethod: 'BANK_TRANSFER',
      paymentReference: ref || null,
      proof: file?.size ? file : null,
    }
    setAttempt(request)
    setBusy(true)
    onBusy(true)
    setError(null)
    try {
      await subscriptionService.submitPayment(request)
      setAttempt(null)
      setSelectedFile(null)
      setPaymentReference('')
      setMessage('Đã gửi thông tin thanh toán thành công! Ban quản trị SweetCake sẽ kiểm tra và kích hoạt gói cho tiệm bánh của bạn trong thời gian sớm nhất.')
      resource.reload()
      onChanged()
    } catch (failure) {
      setError(failure)
      if ([400, 422].includes(failure.status)) setAttempt(null)
    } finally {
      inFlight.current = false
      setBusy(false)
      onBusy(false)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-primary/20 bg-surface p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-primary/10 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-primary">Thông tin thanh toán gói dịch vụ</h3>
          <p className="text-xs text-on-surface-variant">
            Mã đơn: <span className="font-mono font-bold text-primary">{displayReference(order?.id, 'SUB', order?.orderNumber)}</span>
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          className="text-xs font-semibold text-secondary hover:underline cursor-pointer"
          onClick={() => { setMessage(''); resource.reload(); onChanged() }}
        >
          Làm mới
        </button>
      </div>

      <ResourceState resource={resource}>
        {order && (
          <div className="space-y-4">
            {/* Plan Info Card */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-primary/5 p-3 rounded-xl border border-primary/10">
              <div>
                <span className="text-on-surface-variant">Gói đăng ký: </span>
                <strong className="text-primary font-bold">{cleanPresentationLabel(planName({ name: order.planNameSnapshot, code: order.planCodeSnapshot }), 'Gói dịch vụ')}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant">Số tiền: </span>
                <strong className="text-secondary font-bold text-sm">{formatSubscriptionMoney(order.totalAmount, order.currency)}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant">Trạng thái: </span>
                <strong className="text-primary font-bold">{subscriptionStatusLabel(order.status)}</strong>
              </div>
            </div>

            {/* Payment History (if already submitted) */}
            {order.payments?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-primary">Lịch sử gửi chứng từ:</h4>
                <ul className="space-y-2">
                  {order.payments.map((payment) => (
                    <li key={payment.id} className="rounded-xl bg-surface-container-low p-3 text-xs border border-outline-variant/30 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-primary">{subscriptionStatusLabel(payment.status)}</span>
                        <span className="text-on-surface-variant">{formatSubscriptionDate(payment.submittedAt)}</span>
                      </div>
                      <p className="text-stone-600">
                        Số tiền: <strong>{formatSubscriptionMoney(payment.amount, order.currency)}</strong>
                        {payment.paymentReference && <span> · Mã tra cứu: <code className="font-mono">{payment.paymentReference}</code></span>}
                      </p>
                      {payment.proofUrl && /^https?:\/\//i.test(payment.proofUrl) && (
                        <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="text-secondary font-semibold hover:underline inline-block pt-1">
                          Xem ảnh biên lai đã tải lên ↗
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transfer & Evidence Form */}
            {canSubmitSubscriptionPayment(roles, order) && (
              <div className="space-y-4">
                {/* Bank Transfer Box with VietQR */}
                <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-primary/15 pb-2.5">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
                      <span className="material-symbols-outlined text-secondary">qr_code_2</span>
                      <span>Quét mã QR hoặc Chuyển khoản</span>
                    </div>
                    <span className="text-[11px] font-bold text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-full">
                      Ủy nhiệm chi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* VietQR code image */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-primary/15 shadow-2xs">
                      <img
                        src={`https://img.vietqr.io/image/vietcombank-${bankTransfer.accountNumber}-compact2.png?amount=${order.totalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankTransfer.accountName)}`}
                        alt="Mã QR chuyển khoản"
                        className="w-40 sm:w-44 h-auto object-contain rounded-lg"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                      <p className="text-[10px] text-center text-on-surface-variant mt-1.5 font-medium">
                        Mở app ngân hàng quét mã để tự động điền
                      </p>
                    </div>

                    {/* Account details with Copy buttons */}
                    <div className="sm:col-span-7 space-y-2 text-xs">
                      <div className="p-2 rounded-xl bg-white border border-primary/10">
                        <span className="text-on-surface-variant block text-[10px]">Ngân hàng</span>
                        <strong className="text-primary font-bold text-xs">{bankTransfer.bankName}</strong>
                      </div>

                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-primary/10">
                        <div>
                          <span className="text-on-surface-variant block text-[10px]">Số tài khoản</span>
                          <strong className="text-primary font-mono text-sm tracking-wider font-bold">{bankTransfer.accountNumber}</strong>
                        </div>
                        <CopyButton text={bankTransfer.accountNumber} />
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-primary/10">
                        <span className="text-on-surface-variant block text-[10px]">Chủ tài khoản</span>
                        <strong className="text-primary font-bold text-xs">{bankTransfer.accountName}</strong>
                      </div>

                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-primary/10">
                        <div>
                          <span className="text-on-surface-variant block text-[10px]">Số tiền cần chuyển</span>
                          <strong className="text-secondary text-sm font-bold">{formatSubscriptionMoney(order.totalAmount, order.currency)}</strong>
                        </div>
                        <CopyButton text={String(order.totalAmount)} label="Chép số tiền" />
                      </div>

                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50 border border-amber-300">
                        <div className="min-w-0 flex-1">
                          <span className="text-amber-800 block text-[10px] font-bold">Nội dung chuyển khoản (Bắt buộc)</span>
                          <strong className="text-amber-950 font-mono text-xs font-bold block truncate">{transferContent}</strong>
                        </div>
                        <CopyButton text={transferContent} label="Chép nội dung" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Form */}
                <form ref={form} onSubmit={submit} className="space-y-3.5 pt-1">
                  <ReceiptUploader file={selectedFile} onChange={setSelectedFile} disabled={busy || !paymentConfigured} />

                  <label className="block text-xs font-bold text-primary">
                    Mã giao dịch ngân hàng / Mã tham chiếu
                    <input
                      name="paymentReference"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      maxLength={120}
                      placeholder="Ví dụ: FT2611039821 hoặc mã tra cứu từ app ngân hàng"
                      className="mt-1 block w-full rounded-xl border border-outline-variant/50 p-2.5 text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      disabled={busy || !paymentConfigured}
                    />
                  </label>
                  <p className="text-[11px] text-on-surface-variant">
                    * Bạn có thể tải lên ảnh chụp màn hình biên lai, hoặc nhập mã giao dịch từ ứng dụng ngân hàng, hoặc cả hai để hệ thống xác thực.
                  </p>

                  <button
                    type="submit"
                    disabled={busy || !paymentConfigured || (!selectedFile && !paymentReference.trim())}
                    className="w-full rounded-xl bg-primary py-3 text-on-primary text-xs sm:text-sm font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {busy ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Đang gửi chứng từ xác nhận…</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Xác nhận đã chuyển khoản</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </ResourceState>

      {error && <SubscriptionError error={error} />}
      {message && (
        <div role="status" className="rounded-xl bg-green-50 border border-green-200 text-green-800 p-3 text-xs font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{message}</span>
        </div>
      )}
    </section>
  )
}
