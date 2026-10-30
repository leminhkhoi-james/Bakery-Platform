import { vendorMoney } from '../../services/vendorPresentation.js'
import { ModalFormState } from '../common/ModalSurface.jsx'
import { displayReference } from '../../services/displayReference.js'
import { uiLabel } from '../../services/uiLabels.js'
import React, { useState } from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadRfqAddOns } from '../../services/rfqService.js'
import { moneyVnd, toLocalInput } from '../../services/marketplaceModels.js'
import { ApiState, buttonClass, inputClass, panelClass } from '../management/ApiState.jsx'

import { loadBakery } from '../../services/vendorService.js'
import { Icon, StatusBadge } from '../common/WorkspaceUI.jsx'

const OFFER_STATUS_LABELS = {
  PENDING: 'Chờ khách hàng phản hồi',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Đã hết hạn',
  WITHDRAWN: 'Tiệm đã rút báo giá',
}

function formatQuoteDateTime(isoString) {
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

function OwnerOfferInfo({ offer, bakery }) {
  const overdue = offer.status === 'PENDING' && Number.isFinite(Date.parse(offer.expiresAt)) && Date.parse(offer.expiresAt) <= Date.now()
  return <section className={panelClass}><div className="sc-toolbar-actions"><h2>Báo giá của tiệm</h2><StatusBadge status={offer.status} label={overdue ? 'Đã qua hạn phản hồi' : OFFER_STATUS_LABELS[offer.status] || uiLabel(offer.status)} /></div><p className="font-semibold">{bakery?.name || 'Chưa có tên cửa hàng'}</p><dl className="sc-vendor-summary-grid">{[['Giá bánh',vendorMoney(offer.cakePrice)],['Phí giao hàng',vendorMoney(offer.deliveryFee)],['Phụ kiện',vendorMoney(offer.addOnTotal)],['Tổng giá đã báo',vendorMoney(offer.totalPrice)],['Hoàn thành dự kiến',Number.isFinite(Date.parse(offer.estimatedCompletionAt)) ? formatQuoteDateTime(offer.estimatedCompletionAt) : 'Chưa cập nhật'],['Hiệu lực đến',Number.isFinite(Date.parse(offer.expiresAt)) ? formatQuoteDateTime(offer.expiresAt) : 'Chưa cập nhật']].map(([label,value]) => <div key={label}><dt>{label}</dt><dd className={label === 'Tổng giá đã báo' ? 'text-lg text-primary' : ''}>{value}</dd></div>)}</dl><div><h3>Lời nhắn &amp; điều kiện</h3><p className="whitespace-pre-wrap text-sm">{offer.message || 'Chưa có lời nhắn'}</p></div>{offer.items?.length > 0 && <ul className="text-sm space-y-2">{offer.items.map((item,i) => <li key={item.id || i}>{item.itemNameSnapshot || 'Phụ kiện'} · {item.quantity} × {vendorMoney(item.unitPrice)} · {vendorMoney(item.lineTotal)}</li>)}</ul>}<details className="text-xs"><summary>Thông tin tham chiếu</summary>{displayReference(offer.id,'QTE')}</details></section>
}

export function OfferInfo({ offer, bakery: externalBakery, owner = false }) {
  const bakeryRes = useCatalogResource(loadBakery, externalBakery ? null : (offer?.bakeryId ? { id: offer.bakeryId } : null))
  const bakery = externalBakery || bakeryRes?.data
  const bakeryName = bakery?.name || 'Chưa có tên cửa hàng'
  const bakeryLocation = bakery?.location || 'Chưa có địa chỉ cửa hàng'
  if (owner) return <OwnerOfferInfo offer={offer} bakery={bakery} />

  return (
    <section className="space-y-5 rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
      {/* Header with status badge & offer ID */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
        <div className="flex items-center gap-2.5">
          <StatusBadge status={offer.status} label={OFFER_STATUS_LABELS[offer.status] || uiLabel(offer.status)} />
          <details className="text-xs"><summary>Thông tin tham chiếu</summary>{displayReference(offer.id, 'QTE')}</details>
        </div>
        {!owner && <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
          <Icon name="verified" className="text-sm text-secondary" /> Báo giá chính thức
        </span>}
      </div>

      {/* Bakery Card */}
      <div className="flex items-center gap-4 rounded-2xl bg-surface-container-low p-4 border border-outline-variant/20">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary overflow-hidden">
          {bakery?.logoUrl ? (
            <img src={bakery.logoUrl} alt={bakeryName} className="h-full w-full object-cover" />
          ) : (
            <Icon name="storefront" className="text-2xl" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-bold text-primary truncate">{bakeryName}</h3>
            <span className="shrink-0 rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
              Đối tác uy tín
            </span>
          </div>
          <p className="flex items-center gap-1 text-xs text-outline mt-0.5">
            <Icon name="location_on" className="text-xs" /> {bakeryLocation}
          </p>
        </div>
      </div>

      {/* Message from Bakery */}
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
          <Icon name="format_quote" className="text-lg text-amber-700" />
          <span>Lời nhắn từ tiệm bánh</span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-950 font-medium italic">
          "{offer.message || 'Chưa có lời nhắn'}"
        </p>
      </div>

      {/* Financial Breakdown Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-outline">
            <Icon name="cake" className="text-base text-primary" />
            <span>Giá bánh</span>
          </div>
          <p className="mt-2 text-xl font-bold text-primary">{moneyVnd(offer.cakePrice)}</p>
          <p className="mt-1 text-xs text-on-surface-variant">Chi phí tạo hình & cốt bánh</p>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-outline">
            <Icon name="local_shipping" className="text-base text-secondary" />
            <span>Giao hàng</span>
          </div>
          <p className="mt-2 text-xl font-bold text-secondary">{moneyVnd(offer.deliveryFee)}</p>
          <p className="mt-1 text-xs text-on-surface-variant">Giao chuyên dụng tận nơi</p>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-outline">
            <Icon name="extension" className="text-base text-tertiary" />
            <span>Phụ kiện</span>
          </div>
          <p className="mt-2 text-xl font-bold text-on-surface">{moneyVnd(offer.addOnTotal || 0)}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{offer.items?.length || 0} món đi kèm</p>
        </div>
      </div>

      {/* Total Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-primary via-wine to-wine-dark p-5 text-white shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/80">Tổng chi phí báo giá</p>
          <p className="mt-0.5 text-xs text-white/70">Tổng giá đã báo</p>
        </div>
        <div className="text-right">
          <span className="font-serif text-3xl font-bold tracking-tight text-white">{moneyVnd(offer.totalPrice)}</span>
        </div>
      </div>

      {/* Date Timeline Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon name="event_available" className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-medium text-outline">Hoàn thành dự kiến</p>
            <p className="mt-0.5 text-sm font-semibold text-on-surface">{formatQuoteDateTime(offer.estimatedCompletionAt)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <Icon name="timer" className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-medium text-outline">Hiệu lực báo giá đến</p>
            <p className="mt-0.5 text-sm font-semibold text-on-surface">{formatQuoteDateTime(offer.expiresAt)}</p>
          </div>
        </div>
      </div>

      {/* Add-ons list if any */}
      {offer.items && offer.items.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-primary">
            <Icon name="add_circle" className="text-base" /> Phụ kiện từ tiệm bánh
          </h4>
          <div className="divide-y divide-outline-variant/20">
            {offer.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-on-surface">{item.itemNameSnapshot}</p>
                  {item.descriptionSnapshot && <p className="text-xs text-outline">{item.descriptionSnapshot}</p>}
                </div>
                <div className="text-right">
                  <span className="font-semibold text-primary">{moneyVnd(item.lineTotal)}</span>
                  <span className="ml-2 text-xs text-outline">× {item.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status History Collapsible */}
      {offer.statusHistory && offer.statusHistory.length > 0 && (
        <details className="group rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3.5 text-sm">
          <summary className="flex cursor-pointer items-center justify-between font-semibold text-on-surface">
            <span className="flex items-center gap-2">
              <Icon name="history" className="text-outline" /> Lịch sử trạng thái ({offer.statusHistory.length})
            </span>
            <Icon name="expand_more" className="text-outline transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-2 border-t border-outline-variant/20 pt-3">
            {offer.statusHistory.map((row, index) => (
              <div key={index} className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="font-medium text-on-surface">{row.fromStatus} → {row.toStatus}</span>
                <span>{formatQuoteDateTime(row.changedAt)} {row.reason ? `(${row.reason})` : ''}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Collapsible raw details for transparency */}
      <details className="text-[11px] text-outline">
        <summary className="cursor-pointer hover:underline">Mã tham chiếu</summary>
        <p className="mt-1 break-all font-mono">Tiệm: {displayReference(offer.bakeryId, 'SHOP')} · Báo giá: {displayReference(offer.id, 'QTE')}</p>
      </details>
    </section>
  )
}
export default function OfferForm({ bakeryId, offer, disabled, busy, onSave, footerExternal = false }) {
  const [values, setValues] = useState(() => ({
    bakeryId,
    cakePrice: '',
    deliveryFee: '',
    message: '',
    items: [],
    ...offer,
    estimatedCompletionAt: toLocalInput(offer?.estimatedCompletionAt) || toLocalInput(new Date(Date.now() + 5 * 86400000).toISOString()),
    expiresAt: toLocalInput(offer?.expiresAt) || toLocalInput(new Date(Date.now() + 3 * 86400000).toISOString())
  }))
  const addOns = useCatalogResource(loadRfqAddOns, { bakeryId })
  const field = (key) => ({ value: values[key] ?? '', onChange: (event) => setValues({ ...values, [key]: event.target.value }) })
  return <form id={footerExternal ? "vendor-offer-form" : undefined} className={panelClass} onSubmit={(event) => { event.preventDefault(); if (!disabled && !busy) onSave(values) }}><ModalFormState value={values} busy={busy} /><h2 className="text-xl font-bold">{offer ? 'Sửa báo giá đang chờ' : 'Gửi báo giá'}</h2><fieldset disabled={disabled || busy} className="grid gap-4 sm:grid-cols-2">{[['cakePrice', 'Giá bánh (VND)', 'number'], ['deliveryFee', 'Phí giao hàng (VND)', 'number'], ['estimatedCompletionAt', 'Hoàn thành dự kiến', 'datetime-local'], ['expiresAt', 'Báo giá có hiệu lực đến', 'datetime-local']].map(([key, label, type]) => <label key={key}>{label}<input id={'offer-' + key} required type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? '0.01' : undefined} className={inputClass} {...field(key)} /></label>)}<label className="sm:col-span-2">Mô tả và điều kiện<textarea id="offer-message" maxLength={4000} className={inputClass} rows={4} {...field('message')} /></label><section className="sm:col-span-2 space-y-3"><h3 className="font-bold">Phụ kiện từ tiệm</h3><ApiState resource={addOns}>{addOns.data?.map((item) => <label key={item.id} className="flex flex-wrap items-center gap-3"><input type="checkbox" checked={values.items.some((row) => row.addOnId === item.id)} onChange={(event) => setValues({ ...values, items: event.target.checked ? [...values.items, { addOnId: item.id, quantity: 1 }] : values.items.filter((row) => row.addOnId !== item.id) })} />{item.name} · {moneyVnd(item.price)}{values.items.some((row) => row.addOnId === item.id) && <input aria-label={'Số lượng ' + item.name} type="number" min={1} value={values.items.find((row) => row.addOnId === item.id).quantity} onChange={(event) => setValues({ ...values, items: values.items.map((row) => row.addOnId === item.id ? { ...row, quantity: event.target.value } : row) })} className="w-20 rounded border p-2" />}</label>)}</ApiState><p className="text-sm">Kiểm tra phụ kiện, thời gian hoàn thành và tổng tiền trước khi gửi báo giá.</p></section></fieldset>{!footerExternal && <button id="offer-submit-btn" className={buttonClass} disabled={disabled || busy}>{busy ? 'Đang gửi…' : 'Lưu báo giá'}</button>}</form>
}
