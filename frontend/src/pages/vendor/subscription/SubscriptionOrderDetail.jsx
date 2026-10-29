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
    {canSubmitSubscriptionPayment(roles, order) && <form ref={form} onSubmit={submit} className="space-y-3 border-t border-outline-variant/30 pt-5"><h4 className="font-bold">Gửi chứng từ đã thanh toán</h4><p className="text-sm">Số tiền theo đơn: {formatSubscriptionMoney(order.totalAmount, order.currency)}. Chỉ gửi thông tin giao dịch thực tế. Cần mã giao dịch hoặc tệp PNG/JPEG/PDF (tối đa 10 MB).</p>
      <fieldset disabled={busy || Boolean(attempt)} className="grid gap-3"><label>Phương thức thanh toán<input name="paymentMethod" required maxLength={50} className="mt-1 block w-full rounded-xl border p-3" /></label><label>Mã giao dịch<input name="paymentReference" maxLength={120} className="mt-1 block w-full rounded-xl border p-3" /></label><label>Chứng từ<input name="proof" type="file" accept="image/png,image/jpeg,application/pdf" className="mt-1 block max-w-full" /></label></fieldset>
      {attempt && <p className="text-sm">Lần thử lại giữ nguyên nội dung và mã yêu cầu để tránh gửi trùng. Nếu cần đổi thông tin, kiểm tra trạng thái đơn trước.</p>}<button disabled={busy} className="rounded-xl bg-primary px-5 py-3 text-on-primary disabled:opacity-40">{busy ? 'Đang gửi…' : attempt ? 'Thử lại yêu cầu này' : 'Gửi để quản trị viên duyệt'}</button>
    </form>}
  </>}</ResourceState>{error && <SubscriptionError error={error} />}{message && <p role="status">{message}</p>}</section>
}
