import { displayReference } from '../../../services/displayReference.js'
import { uiLabel, cleanPresentationLabel } from '../../../services/uiLabels.js'
import React, { useRef, useState } from 'react'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionOrder, subscriptionService } from '../../../services/subscriptionService.js'
import { canSubmitSubscriptionPayment, formatSubscriptionDate, formatSubscriptionMoney, subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { FeatureList, ResourceState, SubscriptionError } from '../../../components/subscription/SubscriptionView.jsx'

export default function SubscriptionOrderDetail({ orderId, bakeryId, roles, onChanged, onBusy, revision = 0 }) {
  const resource = useCatalogResource(loadSubscriptionOrder, { orderId, bakeryId, revision })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(null)
  const form = useRef(null)
  const order = resource.data
  async function submit(event) {
    event.preventDefault()
    const fields = new FormData(form.current)
    const file = fields.get('proof')
    const request = attempt || { key: crypto.randomUUID(), orderId, amount: order.totalAmount, currency: order.currency, paymentMethod: fields.get('paymentMethod'), paymentReference: fields.get('paymentReference'), proof: file?.size ? file : null }
    setAttempt(request); setBusy(true); onBusy(true); setError(null)
    try {
      const payment = await subscriptionService.submitPayment(request)
      setAttempt(null)
      setMessage('Đã ghi nhận chứng từ: ' + subscriptionStatusLabel(payment.status) + '. Gói chỉ có hiệu lực sau khi Admin phê duyệt.')
      resource.reload(); onChanged()
    } catch (failure) { setError(failure); if ([400, 422].includes(failure.status)) setAttempt(null) }
    finally { setBusy(false); onBusy(false) }
  }
  return <section className="mt-6 space-y-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5"><h3 className="text-xl font-bold">Chi tiết đơn mua gói</h3><button disabled={busy} className="underline" onClick={() => { setMessage(''); resource.reload(); onChanged() }}>Tải lại chi tiết đơn</button><ResourceState resource={resource}>{order && <>
    <p className="break-all">{displayReference(order.id, 'SUB', order.orderNumber)} · {subscriptionStatusLabel(order.status)}</p><p>{cleanPresentationLabel(order.planNameSnapshot || order.planCodeSnapshot, 'Chưa có tên gói')} · {formatSubscriptionMoney(order.totalAmount, order.currency)}</p>
    <p>Hạn thanh toán: {formatSubscriptionDate(order.expiresAt)}</p><FeatureList features={order.featuresSnapshot} />
    {order.period && <p>Kỳ dịch vụ: {subscriptionStatusLabel(order.period.status)} · {formatSubscriptionDate(order.period.periodStart)} → {formatSubscriptionDate(order.period.periodEnd)}</p>}
    <h4 className="font-bold">Lịch sử chứng từ thanh toán</h4>{order.payments.length ? <ul className="space-y-3">{order.payments.map((payment) => <li key={payment.id} className="rounded-xl bg-background p-3"><p>{uiLabel(payment.paymentMethod, 'Chưa có phương thức')} · {formatSubscriptionMoney(payment.amount, order.currency)} · {subscriptionStatusLabel(payment.status)}</p><p className="break-all">{cleanPresentationLabel(payment.paymentReference, 'Không có mã tham chiếu')} · {formatSubscriptionDate(payment.submittedAt)}</p>{payment.proofUrl && /^https?:\/\//i.test(payment.proofUrl) && <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="underline">Xem chứng từ</a>}</li>)}</ul> : <p>Chưa có chứng từ thanh toán cho đơn này.</p>}
    {canSubmitSubscriptionPayment(roles, order) && (
      <div className="space-y-4 border-t border-outline-variant/30 pt-5">
        <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-secondary font-bold text-base">
            <span className="material-symbols-outlined">account_balance</span>
            <span>Thông tin chuyển khoản kích hoạt gói</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2 text-sm text-primary">
              <div className="flex justify-between border-b border-outline-variant/20 pb-1">
                <span className="text-on-surface-variant">Ngân hàng:</span>
                <span className="font-bold">Vietcombank (VCB)</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 pb-1">
                <span className="text-on-surface-variant">Số tài khoản:</span>
                <span className="font-bold font-mono text-base text-secondary">1932628888</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 pb-1">
                <span className="text-on-surface-variant">Chủ tài khoản:</span>
                <span className="font-bold">SWEETCAKE PLATFORM</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 pb-1">
                <span className="text-on-surface-variant">Số tiền:</span>
                <span className="font-bold text-secondary text-base">{formatSubscriptionMoney(order.totalAmount, order.currency)}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 pb-1">
                <span className="text-on-surface-variant">Nội dung CK:</span>
                <span className="font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{order.orderNumber || 'GOI DICH VU'}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-outline-variant/20 shadow-xs">
              <img
                src={`https://img.vietqr.io/image/VCB-1932628888-compact2.png?amount=${order.totalAmount}&addInfo=${encodeURIComponent(order.orderNumber || 'GOI DICH VU')}&accountName=SWEETCAKE%20PLATFORM`}
                alt="Mã VietQR thanh toán gói"
                className="w-36 h-36 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <span className="text-xs text-on-surface-variant mt-1">Quét mã VietQR chuyển khoản</span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant italic">
            * Sau khi chuyển khoản, vui lòng nhập mã giao dịch và tải ảnh chụp biên lai bên dưới để Quản trị viên duyệt kích hoạt gói.
          </p>
        </div>

        <form ref={form} onSubmit={submit} className="space-y-3">
          <h4 className="font-bold">Gửi chứng từ đã thanh toán</h4>
          <p className="text-sm">Số tiền theo đơn: {formatSubscriptionMoney(order.totalAmount, order.currency)}. Chỉ gửi thông tin giao dịch thực tế. Cần mã giao dịch hoặc tệp PNG/JPEG/PDF (tối đa 10 MB).</p>
          <fieldset disabled={busy || Boolean(attempt)} className="grid gap-3">
            <label>Phương thức thanh toán<input name="paymentMethod" required maxLength={50} defaultValue="Chuyển khoản Vietcombank (QR)" className="mt-1 block w-full rounded-xl border p-3" /></label>
            <label>Mã giao dịch ngân hàng<input name="paymentReference" maxLength={120} placeholder="Ví dụ: VCB-20261103-987654" className="mt-1 block w-full rounded-xl border p-3" /></label>
            <label>Tệp chứng từ / Biên lai chuyển khoản<input name="proof" type="file" accept="image/png,image/jpeg,application/pdf" className="mt-1 block max-w-full" /></label>
          </fieldset>
          {attempt && <p className="text-sm">Lần thử lại giữ nguyên nội dung và mã yêu cầu để tránh gửi trùng. Nếu cần đổi thông tin, kiểm tra trạng thái đơn trước.</p>}
          <button disabled={busy} className="rounded-xl bg-primary px-5 py-3 text-on-primary disabled:opacity-40">{busy ? 'Đang gửi…' : attempt ? 'Thử lại yêu cầu này' : 'Gửi để quản trị viên duyệt'}</button>
        </form>
      </div>
    )}
  </>}</ResourceState>{error && <SubscriptionError error={error} />}{message && <p role="status">{message}</p>}</section>
}
