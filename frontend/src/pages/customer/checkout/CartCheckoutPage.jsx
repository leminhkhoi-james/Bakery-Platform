import { demoRuntime } from '../../../mockData/runtime.js'
import { isDemoId } from '../../../mockData/seed.js'
import React, { useState } from 'react'
import { revalidateCartItem } from '../../../services/checkoutService.js'
import { formatCatalogPrice, isCatalogId } from '../../../services/catalogModels.js'
import { ApiErrorMessage, buttonClass, panelClass } from '../../../components/management/ApiState.jsx'
import CatalogImage from '../../../components/catalog/CatalogImage.jsx'
import VerifiedCheckout from '../../../components/orders/VerifiedCheckout.jsx'

function CartLine({ item, onUpdateQuantity, onRemoveItem, onNavigate }) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const signature = JSON.stringify([item.productId, item.bakeryId, item.quantity, item.optionSelections, item.addOns])
  const fresh = result?.signature === signature ? result.data : null

  async function verify() {
    if (busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const data = await revalidateCartItem(item)
      setResult({ signature, data })
    } catch (failure) {
      setError(failure)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={panelClass + ' bg-white/95 backdrop-blur-md rounded-2xl border border-primary/15 shadow-md p-4 sm:p-5 transition-all hover:shadow-lg'}>
      <div className="flex flex-col gap-4 sm:flex-row items-start">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-primary/15 shadow-2xs">
          <CatalogImage
            src={item.image}
            alt={item.title || 'Sản phẩm'}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-savoure text-lg sm:text-xl font-bold text-wine leading-snug">
              {fresh?.product.title || item.title || 'Sản phẩm chưa có tên'}
            </h2>
            <button
              disabled={busy}
              aria-label="Xóa sản phẩm"
              className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-40"
              onClick={() => onRemoveItem(item.id)}
            >
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-secondary">
              <span className="material-symbols-outlined text-sm">storefront</span>
              <span>{fresh?.product.vendor || item.bakery || 'Chưa có tên cửa hàng'}</span>
            </span>
            <span className="text-primary/30">•</span>
            <span className="inline-block px-2 py-0.5 rounded-md bg-primary-fixed/50 text-[11px] font-bold text-wine border border-primary/15">
              {item.sizeSpec || 'Theo cấu hình đã chọn'}
            </span>
          </div>

          <p className="text-xs text-on-surface-variant font-medium">
            Giá lưu khi thêm vào giỏ: <strong className="text-sm font-bold text-wine">{formatCatalogPrice(item.price)}</strong> / lựa chọn.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center border-2 border-primary/25 rounded-xl bg-white px-2 py-0.5 shadow-2xs">
              <button
                disabled={busy}
                aria-label="Giảm số lượng"
                className="w-6 h-6 flex items-center justify-center font-bold text-primary hover:bg-primary-fixed-dim rounded-md text-sm cursor-pointer disabled:opacity-40"
                onClick={() => onUpdateQuantity(item.id, -1)}
              >
                −
              </button>
              <span className="font-bold text-wine text-xs sm:text-sm px-2">
                Số lượng: {item.quantity}
              </span>
              <button
                disabled={busy || item.quantity >= 100}
                aria-label="Tăng số lượng"
                className="w-6 h-6 flex items-center justify-center font-bold text-primary hover:bg-primary-fixed-dim rounded-md text-sm cursor-pointer disabled:opacity-40"
                onClick={() => onUpdateQuantity(item.id, 1)}
              >
                +
              </button>
            </div>

            <button
              disabled={busy}
              className="text-xs font-bold text-red-700 underline cursor-pointer disabled:opacity-40 sm:hidden"
              onClick={() => onRemoveItem(item.id)}
            >
              Xóa
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-primary/10">
        <button
          disabled={busy}
          onClick={verify}
          className={buttonClass + ' text-xs py-2 px-3.5 font-bold shadow-xs cursor-pointer'}
        >
          {busy ? 'Đang kiểm tra…' : 'Kiểm tra lại sản phẩm & giá'}
        </button>
        <button
          className="text-xs font-bold text-secondary hover:underline cursor-pointer flex items-center gap-1"
          onClick={() => onNavigate('product-detail?id=' + encodeURIComponent(item.productId || ''))}
        >
          <span>Chọn lại cấu hình</span>
          <span className="material-symbols-outlined text-xs">tune</span>
        </button>
      </div>

      {error && <ApiErrorMessage error={error} retry={verify} />}

      {fresh && (
        <div role="status" className="rounded-xl border border-primary/20 bg-primary-fixed/30 p-3 text-xs text-wine space-y-1">
          <p className="font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-green-700">check_circle</span>
            <span>Sản phẩm và cấu hình còn khả dụng.</span>
          </p>
          <p>
            Tiền hàng tạm tính theo catalog hiện tại: <strong className="text-sm font-bold text-wine">{formatCatalogPrice(fresh.subtotal)}</strong>. Chưa gồm phí giao hàng; giá cuối cùng sẽ được xác nhận khi đặt hàng.
          </p>
        </div>
      )}
    </article>
  )
}

export const CartCheckoutPage = ({ cartItems = [], onUpdateQuantity, onRemoveItem, onClearCart, onNavigate }) => {
  return (
    <main className="sc-customer min-h-[60vh] px-4 sm:px-6 py-4 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Page Top Heading Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-primary/15 shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="sc-kicker text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">shopping_basket</span>
              <span>Bánh đã chọn</span>
            </p>
            <h1 className="font-savoure text-2xl sm:text-3xl font-bold text-wine">
              Giỏ hàng &amp; Đặt bánh
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {cartItems.length > 0 && (
              <button
                className="text-xs font-bold text-wine/70 hover:text-red-700 underline flex items-center gap-1 cursor-pointer"
                onClick={onClearCart}
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Làm trống giỏ</span>
              </button>
            )}
            <button
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white border border-primary/20 text-xs font-bold text-wine shadow-2xs hover:bg-primary-fixed-dim transition-all cursor-pointer"
              onClick={() => onNavigate('explore')}
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Khám phá bánh</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Left: Cart Items List (7 cols on lg) */}
          <section className="space-y-4 lg:col-span-7">
            {cartItems.length ? (
              cartItems.map((item) =>
                item.catalogSource === 'backend' && isCatalogId(item.productId) && isCatalogId(item.bakeryId) ? (
                  <CartLine
                    key={item.id}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                    onNavigate={onNavigate}
                  />
                ) : (
                  <article key={item.id} className={panelClass + ' bg-white/95 backdrop-blur-md rounded-2xl border border-red-200 shadow-md p-4 sm:p-5 space-y-2'}>
                    <h2 className="font-bold text-red-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">warning</span>
                      <span>Sản phẩm chưa khả dụng</span>
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Sản phẩm này chưa thể đặt từ giỏ hàng. Vui lòng chọn lại mẫu bánh hoặc liên hệ tiệm.
                    </p>
                    <button className="text-red-700 underline text-xs font-bold cursor-pointer" onClick={() => onRemoveItem(item.id)}>
                      Xóa mục chưa xác minh
                    </button>
                  </article>
                )
              )
            ) : (
              <section className={panelClass + ' bg-white/95 backdrop-blur-md rounded-2xl border border-primary/15 shadow-md p-8 sm:p-12 text-center space-y-4'}>
                <div className="w-16 h-16 rounded-full bg-primary-fixed/60 text-primary mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                </div>
                <div className="space-y-1">
                  <h2 className="font-savoure text-2xl font-bold text-wine">Giỏ hàng đang trống</h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto">
                    Chọn mẫu bánh để thêm vào giỏ.
                  </p>
                </div>
                <button className={buttonClass + ' py-2.5 px-6 font-bold shadow-md cursor-pointer'} onClick={() => onNavigate('explore')}>
                  Khám phá bánh
                </button>
              </section>
            )}
          </section>

          {/* Right: Checkout & Confirmation Panel (5 cols on lg - Sticky) */}
          <aside className={panelClass + ' sc-checkout-summary self-start lg:sticky lg:top-28 bg-white/95 backdrop-blur-md rounded-2xl border border-primary/15 shadow-md p-4 sm:p-6 space-y-3.5 lg:col-span-5'}>
            <div className="pb-1 border-b border-primary/10">
              <h2 className="font-savoure text-xl sm:text-2xl font-bold text-wine flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
                <span>Xác nhận đơn hàng</span>
              </h2>
            </div>

            {!(demoRuntime && cartItems.length > 0 && cartItems.every((item) => isDemoId(item.productId))) && (
              <p className="text-xs text-on-surface-variant">
                Mỗi sản phẩm được đặt thành một đơn riêng, kèm tùy chọn và phụ kiện đã chọn.
              </p>
            )}

            <>
              {cartItems.some((item) => item.catalogSource === 'backend' && isCatalogId(item.productId) && isCatalogId(item.bakeryId)) ? (
                <VerifiedCheckout
                  items={cartItems.filter((item) => item.catalogSource === 'backend' && isCatalogId(item.productId) && isCatalogId(item.bakeryId))}
                  onNavigate={onNavigate}
                  onConfirmed={onRemoveItem}
                />
              ) : (
                <button disabled className={buttonClass + ' w-full py-3 font-bold opacity-50 cursor-not-allowed'}>
                  Chưa thể đặt hàng
                </button>
              )}
            </>

            {!(demoRuntime && cartItems.length > 0 && cartItems.every((item) => isDemoId(item.productId))) && (
              <p className="text-[11px] text-center text-outline">
                Kiểm tra sản phẩm, địa chỉ và lịch nhận trước khi xác nhận đơn hàng.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}

export default CartCheckoutPage
