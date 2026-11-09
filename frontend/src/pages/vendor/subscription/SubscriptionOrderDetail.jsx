import { unifiedEnabled, recordSource } from '../../../services/unifiedDataService.js'
import { displayReference } from '../../../services/displayReference.js'
import { uiLabel, cleanPresentationLabel } from '../../../services/uiLabels.js'
import { planName } from '../../../services/planPresentation.js'
import React, { useRef, useState } from 'react'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionOrder, subscriptionService } from '../../../services/subscriptionService.js'
import { canSubmitSubscriptionPayment, formatSubscriptionDate, formatSubscriptionMoney, subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { FeatureList, ResourceState, SubscriptionError } from '../../../components/subscription/SubscriptionView.jsx'
import { simulationMediaUrl } from '../../../mockData/business/runtime.js'

const getPaymentOptions = ({ orderId }, options) => unifiedEnabled() && recordSource({ id: orderId }) === 'local' ? Promise.resolve({ sandboxEnabled: false, bankTransfer: { bankName: 'Sổ mô phỏng', accountNumber: 'Không chuyển tiền', accountName: 'Bản ghi mô phỏng' } }) : subscriptionService.getPaymentOptions({}, options)

export default function SubscriptionOrderDetail({ orderId, bakeryId, roles, onChanged, onBusy, revision = 0 }) {
  const resource = useCatalogResource(loadSubscriptionOrder, { orderId, bakeryId, revision })
  const paymentOptions = useCatalogResource(getPaymentOptions, { orderId })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(null)
  const form = useRef(null), inFlight = useRef(false)
  const order = resource.data
  const paymentConfigured = paymentOptions.status === 'ready' && Boolean(paymentOptions.data?.bankTransfer)
  async function submit(event) {
    event.preventDefault()
    if (inFlight.current || busy || !order || !paymentConfigured) return
    inFlight.current = true
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
    finally { inFlight.current = false; setBusy(false); onBusy(false) }
  }
  return <div className="space-y-3">
    <button type="button" disabled={busy} className="sc-button sc-action-button--secondary" onClick={() => { setMessage(''); resource.reload(); onChanged() }}>Tải lại chi tiết đơn</button>
    <ResourceState resource={resource}>{order && <>
      <section className="sc-detail-section">
        <h3>Thông tin đơn mua gói</h3>
        <dl className="sc-detail-fields">
          <div><dt>Mã đơn</dt><dd>{displayReference(order.id, 'SUB', order.orderNumber)}</dd></div>
          <div><dt>Trạng thái</dt><dd>{subscriptionStatusLabel(order.status)}</dd></div>
          <div><dt>Gói dịch vụ</dt><dd>{cleanPresentationLabel(planName({ name: order.planNameSnapshot, code: order.planCodeSnapshot }), 'Chưa có tên gói')}</dd></div>
          <div><dt>Số tiền</dt><dd>{formatSubscriptionMoney(order.totalAmount, order.currency)}</dd></div>
          <div><dt>Hạn thanh toán</dt><dd>{formatSubscriptionDate(order.expiresAt)}</dd></div>
          <div><dt>Nguồn</dt><dd>{recordSource(order) === 'local' ? 'Mô phỏng · không kích hoạt quyền Backend' : 'API thật'}</dd></div>
          {order.period && <div className="sc-detail-wide"><dt>Kỳ dịch vụ</dt><dd>{subscriptionStatusLabel(order.period.status)} · {formatSubscriptionDate(order.period.periodStart)} → {formatSubscriptionDate(order.period.periodEnd)}</dd></div>}
        </dl>
      </section>
      <section className="sc-detail-section"><h3>Quyền lợi của gói</h3><FeatureList features={order.featuresSnapshot} /></section>
      <section className="sc-detail-section"><h3>Lịch sử chứng từ thanh toán</h3>{order.payments.length ? <ul className="space-y-3">{order.payments.map((payment) => <li key={payment.id} className="rounded-xl bg-background p-3"><p>{uiLabel(payment.paymentMethod, 'Chưa có phương thức')} · {formatSubscriptionMoney(payment.amount, order.currency)} · {subscriptionStatusLabel(payment.status)}</p><p className="break-all">{cleanPresentationLabel(payment.paymentReference, 'Không có mã tham chiếu')} · {formatSubscriptionDate(payment.submittedAt)}</p>{payment.proofUrl && (simulationMediaUrl(payment.proofUrl) || /^https?:\/\//i.test(payment.proofUrl)) && <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="underline">Xem chứng từ</a>}</li>)}</ul> : <p>Chưa có chứng từ thanh toán cho đơn này.</p>}</section>
    {canSubmitSubscriptionPayment(roles, order) && (
      <div className="space-y-4 border-t border-outline-variant/30 pt-5">
        <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-secondary font-bold text-base">
            <span className="material-symbols-outlined">account_balance</span>
            <span>Thông tin thanh toán gói</span>
          </div>
          <ResourceState resource={paymentOptions}>{paymentOptions.data && (paymentOptions.data.bankTransfer
            ? <dl><dt>Ngân hàng</dt><dd>{paymentOptions.data.bankTransfer.bankName}</dd><dt>Số tài khoản</dt><dd>{paymentOptions.data.bankTransfer.accountNumber}</dd><dt>Chủ tài khoản</dt><dd>{paymentOptions.data.bankTransfer.accountName}</dd></dl>
            : <p className="text-sm">Hệ thống chưa cung cấp tài khoản ngân hàng nhận tiền. Vui lòng liên hệ quản trị viên để xác nhận thông tin chuyển khoản trước khi thanh toán.</p>)}</ResourceState>
          <p>Số tiền theo đơn: <strong>{formatSubscriptionMoney(order.totalAmount, order.currency)}</strong></p>
          <p>Nội dung đối chiếu: <strong>{order.orderNumber}</strong></p>

        </div>

        <form ref={form} onSubmit={submit} className="space-y-3">
          <h4 className="font-bold">Gửi chứng từ đã thanh toán</h4>
          <p className="text-sm">Số tiền theo đơn: {formatSubscriptionMoney(order.totalAmount, order.currency)}. Chỉ gửi thông tin giao dịch thực tế. Cần mã giao dịch hoặc tệp PNG/JPEG/PDF (tối đa 10 MB).</p>
          <fieldset disabled={busy || Boolean(attempt) || !paymentConfigured} className="grid gap-3">
            <label>Phương thức thanh toán<input name="paymentMethod" required maxLength={50} defaultValue="BANK_TRANSFER" className="mt-1 block w-full rounded-xl border p-3" /></label>
            <label>Mã giao dịch ngân hàng<input name="paymentReference" maxLength={120} placeholder="Ví dụ: VCB-20261103-987654" className="mt-1 block w-full rounded-xl border p-3" /></label>
            <label>Tệp chứng từ / Biên lai chuyển khoản<input name="proof" type="file" accept="image/png,image/jpeg,application/pdf" className="mt-1 block max-w-full" /></label>
          </fieldset>
          {attempt && <p className="text-sm">Lần thử lại giữ nguyên nội dung và mã yêu cầu để tránh gửi trùng. Nếu cần đổi thông tin, kiểm tra trạng thái đơn trước.</p>}
          <button disabled={busy || !paymentConfigured} className="rounded-xl bg-primary px-5 py-3 text-on-primary disabled:opacity-40">{busy ? 'Đang gửi…' : attempt ? 'Thử lại yêu cầu này' : 'Gửi để quản trị viên duyệt'}</button>
        </form>
      </div>
    )}
  </>}</ResourceState>{error && <SubscriptionError error={error} />}{message && <p role="status">{message}</p>}</div>
}
