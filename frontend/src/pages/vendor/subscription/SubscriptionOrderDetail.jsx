import { displayReference } from '../../../services/displayReference.js'
import VnpayCheckout from '../../../components/subscription/VnpayCheckout.jsx'
import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import { planName } from '../../../services/planPresentation.js'
import React, { useRef, useState } from 'react'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionOrder, subscriptionService } from '../../../services/subscriptionService.js'
import { canSubmitSubscriptionPayment, formatSubscriptionDate, formatSubscriptionMoney, subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { ResourceState, SubscriptionError } from '../../../components/subscription/SubscriptionView.jsx'

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
    onChange(f || null)
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
            <p className="text-[11px] text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB · Chưa gửi duyệt</p>
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

export default function SubscriptionOrderDetail({ orderId, bakeryId, roles, onChanged, onBusy, revision = 0, paymentAllowed = true }) {
  const resource = useCatalogResource(loadSubscriptionOrder, { orderId, bakeryId, revision })
  const paymentOptions = useCatalogResource(getPaymentOptions, { orderId })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [paymentReference, setPaymentReference] = useState('')
  const [qrFailed, setQrFailed] = useState(false)
  const form = useRef(null), inFlight = useRef(false)
  const order = resource.data
  const candidateBank = paymentOptions.data?.bankTransfer
  const bankTransfer = candidateBank?.bankName && candidateBank?.accountNumber && candidateBank?.accountName
    ? candidateBank : null

  const shortOrderRef = displayReference(order?.id, 'SUB', order?.orderNumber)
  const transferContent = shortOrderRef !== '—' ? shortOrderRef : (order?.orderNumber || order?.id || '')
  const bankCode = bankTransfer?.bankCode
  const vietQrUrl = order?.totalAmount && bankTransfer && bankCode
    ? `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(bankTransfer.accountNumber)}-compact2.png?amount=${encodeURIComponent(order.totalAmount)}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankTransfer.accountName)}`
    : null

  async function submit(event) {
    event.preventDefault()
    if (!paymentAllowed || inFlight.current || busy || !order || !canSubmitSubscriptionPayment(roles, order)) return
    const formData = typeof FormData === 'function' ? new FormData(event?.currentTarget || form.current || undefined) : null
    const file = selectedFile || formData?.get?.('proof') || null
    const ref = (paymentReference || formData?.get?.('paymentReference') || '').trim()
    const method = (formData?.get?.('paymentMethod') || 'BANK_TRANSFER').trim()
    if (!attempt && !file && !ref) return

    inFlight.current = true
    const request = attempt || {
      key: crypto.randomUUID(),
      orderId,
      amount: order.totalAmount,
      currency: order.currency,
      paymentMethod: method || 'BANK_TRANSFER',
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
      setMessage('Đã gửi xác nhận thanh toán thành công. Bộ phận kế toán đang đối soát giao dịch của bạn.')
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
            Mã hóa đơn: <span className="font-mono font-bold text-primary">#{shortOrderRef}</span>
          </p>
        </div>
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
                <span className="text-on-surface-variant">Tổng thanh toán: </span>
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
                <h4 className="font-bold text-xs text-primary">Lịch sử xác nhận thanh toán:</h4>
                <ul className="space-y-2">
                  {order.payments.map((payment) => (
                    <li key={payment.id} className="rounded-xl bg-surface-container-low p-3 text-xs border border-outline-variant/30 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-primary">{subscriptionStatusLabel(payment.status)}</span>
                        <span className="text-on-surface-variant">{formatSubscriptionDate(payment.submittedAt)}</span>
                      </div>
                      <p className="text-stone-600">
                        Số tiền: <strong>{formatSubscriptionMoney(payment.amount, order.currency)}</strong>
                        {payment.paymentReference && <span> · Mã giao dịch: <code className="font-mono font-bold text-primary">{payment.paymentReference}</code></span>}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transfer & Evidence Form */}
            {paymentAllowed && canSubmitSubscriptionPayment(roles, order) && (
              <div className="space-y-4">
                {order.currency === 'VND' && <VnpayCheckout order={order} bakeryId={bakeryId} disabled={busy || Boolean(attempt)}
                  onBusy={(value) => { setBusy(value); onBusy(value) }} />}
                <form ref={form} onSubmit={submit} className="hidden" aria-hidden="true" />
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
