import React, { useEffect, useState } from 'react'
import { subscriptionService } from '../../../services/subscriptionService.js'
import { vnpayOrderRoute, vnpayResultCopy } from '../../../services/vnpayModels.js'
import { displayReference } from '../../../services/displayReference.js'

export default function VnpayReturnPage({ routeSearch = '', onNavigate }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(true)
  const [waiting, setWaiting] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let timer, checks = 0
    async function check() {
      if (controller.signal.aborted) return
      if (document.hidden) { timer = setTimeout(check, 3000); return }
      try {
        const data = await subscriptionService.getVnpayResult(routeSearch, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
        })
        if (controller.signal.aborted) return
        setResult(data)
        checks += 1
        if (data.status === 'PENDING' && checks < 10) timer = setTimeout(check, 3000)
        else if (data.status === 'PENDING') setWaiting(true)
      } catch {
        if (!controller.signal.aborted) setError(true)
      } finally {
        if (!controller.signal.aborted) setChecking(false)
      }
    }
    check()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [routeSearch, revision])

  const copy = vnpayResultCopy(result)
  return <main className="min-h-screen bg-surface px-4 py-12 sm:py-20">
    <section className="mx-auto max-w-xl space-y-6 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 sm:p-8">
      <a href="/subscription-plans" className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary">
        <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_back</span>Gói dịch vụ
      </a>
      <div aria-live="polite" aria-atomic="true" className="space-y-3">
        <span aria-hidden="true" className="material-symbols-outlined text-4xl text-primary">{error ? 'info' : result ? copy.icon : 'schedule'}</span>
        <h1 className="text-2xl font-bold text-primary">{error ? 'Chưa xác minh được thanh toán' : result ? copy.title : 'Đang kiểm tra giao dịch VNPay'}</h1>
        <p className="text-sm leading-6 text-on-surface-variant">{error
          ? 'Không thể xác minh kết quả lúc này. Vui lòng kiểm tra lại hoặc mở đơn mua gói để xem trạng thái. Nếu đã bị trừ tiền, đừng thanh toán thêm.'
          : result ? copy.description : 'Vui lòng chờ trong khi hệ thống kiểm tra kết quả thanh toán.'}</p>
      </div>
      {result && <dl className="border-y border-outline-variant/30 py-4 text-sm">
        <div className="flex flex-wrap justify-between gap-2"><dt className="text-on-surface-variant">Đơn mua gói</dt><dd className="font-semibold text-primary">{displayReference(result.orderId, 'SUB')}</dd></div>
      </dl>}
      {waiting && <p role="status" className="text-sm text-on-surface-variant">Hệ thống chưa nhận được xác nhận cuối cùng. Bạn có thể kiểm tra lại sau; đơn chưa được đánh dấu thanh toán thành công.</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        {(error || result?.status === 'PENDING') && <button type="button" disabled={checking} onClick={() => {
          setResult(null); setError(false); setWaiting(false); setChecking(true); setRevision(value => value + 1)
        }}
          className="rounded-xl border border-primary px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50">
          {checking ? 'Đang kiểm tra…' : 'Kiểm tra lại thanh toán'}
        </button>}
        <button type="button" onClick={() => onNavigate(result ? vnpayOrderRoute(result) : 'vendor-subscription')}
          className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Xem đơn mua gói
        </button>
      </div>
    </section>
  </main>
}
