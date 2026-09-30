import React, { useState, useMemo } from 'react'
import VendorSidebar from '../../../layouts/vendor/VendorSidebar'
import VendorHeader from '../../../layouts/vendor/VendorHeader'

import { INITIAL_TRANSACTIONS } from '../../../mockData/vendor/revenue.js'

export default function VendorRevenueEscrowPage({ onNavigate }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [availableBalance, setAvailableBalance] = useState(32500000)
  const [escrowLocked, setEscrowLocked] = useState(14200000)
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS)
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'released' | 'locked' | 'withdrawn'
  const [searchQuery, setSearchQuery] = useState('')
  const [toastFeedback, setToastFeedback] = useState(null)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const showToast = (msg) => {
    setToastFeedback(msg)
    setTimeout(() => setToastFeedback(null), 3500)
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (activeFilter !== 'all' && t.status !== activeFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          t.orderId.toLowerCase().includes(q) ||
          t.cakeTitle.toLowerCase().includes(q) ||
          t.customer.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [transactions, activeFilter, searchQuery])

  const handleWithdrawSubmit = (e) => {
    e.preventDefault()
    const amt = parseInt(withdrawAmount.replace(/\D/g, ''), 10)
    if (!amt || isNaN(amt) || amt <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ muốn rút!')
      return
    }
    if (amt > availableBalance) {
      showToast('Số tiền rút vượt quá số dư khả dụng trong ví!')
      return
    }
    if (amt < 500000) {
      showToast('Hạn mức rút tối thiểu là 500.000đ mỗi lần!')
      return
    }

    setAvailableBalance((prev) => prev - amt)
    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: `#WD-2025-${Math.floor(1000 + Math.random() * 9000)}`,
      date: 'Vừa xong · Hôm nay',
      cakeTitle: 'Rút tiền về Vietcombank (STK: 0071 0012 89932)',
      customer: 'Hệ thống SweetCake Escrow',
      grossAmount: -amt,
      platformFee: 0,
      netAmount: -amt,
      status: 'withdrawn',
      statusLabel: 'Đã chuyển khoản thành công',
      statusDesc: 'Giao dịch chuyển khoản tức thì Napas 24/7 hoàn tất',
      paymentMethod: 'Chuyển khoản 24/7',
    }
    setTransactions([newTx, ...transactions])
    setIsWithdrawModalOpen(false)
    setWithdrawAmount('')
    showToast(
      `Lệnh rút ${amt.toLocaleString('vi-VN')}₫ thành công! Tiền đã chuyển vào Vietcombank.`
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Toast Notification */}
      {toastFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-secondary text-xl">
            check_circle
          </span>
          <span className="text-sm font-medium">{toastFeedback}</span>
        </div>
      )}

      {/* VENDOR FIXED SIDEBAR */}
      <VendorSidebar
        activeTab="revenue"
        onNavigate={onNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* TOPBAR */}
      <VendorHeader
        title="Doanh Thu & Ký Quỹ Escrow"
        subtitle="Quản lý tài chính phân xưởng, đối soát ký quỹ & rút tiền"
        contextBadge="Escrow Vault Bảo Vệ 100%"
        onNavigate={onNavigate}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        showToast={showToast}
        actions={
          <button
            className="inline-flex items-center gap-1.5 bg-secondary text-on-secondary px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold shadow-xs hover:bg-primary-container transition-colors cursor-pointer"
            onClick={() => setIsWithdrawModalOpen(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">
              account_balance
            </span>
            <span className="hidden sm:inline">Rút tiền về ngân hàng</span>
            <span className="sm:hidden">Rút tiền</span>
          </button>
        }
      />

      {/* MAIN CONTENT AREA */}
      <div className="md:pl-72 flex-1">
        <main className="pt-24 min-h-screen bg-background pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-8">
            {/* 1. FINANCIAL SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Available Balance */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_4px_24px_rgba(45,30,24,0.04)] border border-outline-variant/20 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider">
                      Số Dư Khả Dụng
                    </span>
                    <h3 className="font-headline-md text-2xl font-bold text-primary">
                      {availableBalance.toLocaleString('vi-VN')} ₫
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">
                      account_balance_wallet
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 font-body-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Có thể rút ngay lập tức
                  </span>
                  <button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="text-xs font-label-md text-secondary font-bold hover:underline cursor-pointer"
                  >
                    Rút tiền →
                  </button>
                </div>
              </div>

              {/* Card 2: Escrow Locked */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_4px_24px_rgba(45,30,24,0.04)] border border-outline-variant/20 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider">
                      Ký Quỹ Escrow Đang Khóa
                    </span>
                    <h3 className="font-headline-md text-2xl font-bold text-secondary">
                      {escrowLocked.toLocaleString('vi-VN')} ₫
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">
                      lock_clock
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between text-xs text-on-surface-variant font-body-sm">
                  <span>Khách đã cọc 100%</span>
                  <span className="font-medium text-primary">Tự mở khi giao bánh</span>
                </div>
              </div>

              {/* Card 3: Monthly Revenue */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_4px_24px_rgba(45,30,24,0.04)] border border-outline-variant/20 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider">
                      Doanh Thu Tháng Này
                    </span>
                    <h3 className="font-headline-md text-2xl font-bold text-primary">
                      68.400.000 ₫
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">
                      trending_up
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between text-xs font-body-sm">
                  <span className="text-emerald-700 font-bold">+18.4%</span>
                  <span className="text-on-surface-variant">so với tháng trước</span>
                </div>
              </div>

              {/* Card 4: Platform Fee */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_4px_24px_rgba(45,30,24,0.04)] border border-outline-variant/20 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-label-sm text-label-sm text-outline font-semibold uppercase tracking-wider">
                      Phí Dịch Vụ Sàn
                    </span>
                    <h3 className="font-headline-md text-2xl font-bold text-primary">
                      10% Cố Định
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container text-outline flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">
                      percent
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/10 text-xs text-on-surface-variant font-body-sm">
                  Bao gồm trợ giá xe lạnh &amp; bảo hiểm đơn
                </div>
              </div>
            </div>

            {/* 2. TRANSACTION TABLE & FILTER BAR */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_24px_rgba(45,30,24,0.04)] border border-outline-variant/20 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeFilter === 'all'
                        ? 'bg-primary text-on-primary shadow-sm font-bold'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                  >
                    Tất cả giao dịch ({transactions.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('released')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeFilter === 'released'
                        ? 'bg-primary text-on-primary shadow-sm font-bold'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                  >
                    Đã giải ngân vào ví
                  </button>
                  <button
                    onClick={() => setActiveFilter('locked')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeFilter === 'locked'
                        ? 'bg-primary text-on-primary shadow-sm font-bold'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                  >
                    Đang khóa Escrow
                  </button>
                  <button
                    onClick={() => setActiveFilter('withdrawn')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeFilter === 'withdrawn'
                        ? 'bg-primary text-on-primary shadow-sm font-bold'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                  >
                    Đã rút về ngân hàng
                  </button>
                </div>

                {/* Search & Export Buttons */}
                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm mã đơn, tên bánh..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:border-secondary"
                    />
                  </div>

                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-surface-container-low/70 text-outline font-label-sm text-label-sm uppercase tracking-wider font-semibold border-b border-outline-variant/20">
                      <th className="py-3 px-4">Mã Giao Dịch &amp; Giờ</th>
                      <th className="py-3 px-4">Đơn Bánh &amp; Đối Tượng</th>
                      <th className="py-3 px-4 text-right">Tổng Tiền</th>
                      <th className="py-3 px-4 text-right">Phí Sàn (10%)</th>
                      <th className="py-3 px-4 text-right">Thực Nhận Xưởng</th>
                      <th className="py-3 px-4">Trạng Thái Escrow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-xs font-body-sm">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-on-surface-variant">
                          Không có giao dịch nào phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const isWithdraw = tx.status === 'withdrawn'
                        const isLocked = tx.status === 'locked'

                        return (
                          <tr key={tx.id} className="hover:bg-surface-container-low/40 transition-colors">
                            <td className="py-4 px-4 align-top">
                              <span className="font-mono font-bold text-primary block">
                                {tx.orderId}
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                {tx.date}
                              </span>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <span className="font-semibold text-primary block max-w-xs truncate">
                                {tx.cakeTitle}
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                Khách: {tx.customer} • {tx.paymentMethod}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right align-top font-mono font-semibold text-on-surface">
                              {isWithdraw
                                ? `-${Math.abs(tx.grossAmount).toLocaleString('vi-VN')}₫`
                                : `${tx.grossAmount.toLocaleString('vi-VN')}₫`}
                            </td>
                            <td className="py-4 px-4 text-right align-top font-mono text-outline">
                              {tx.platformFee > 0
                                ? `-${tx.platformFee.toLocaleString('vi-VN')}₫`
                                : '0₫'}
                            </td>
                            <td className="py-4 px-4 text-right align-top font-mono font-bold text-base">
                              <span
                                className={
                                  isWithdraw
                                    ? 'text-primary'
                                    : isLocked
                                      ? 'text-secondary'
                                      : 'text-emerald-700'
                                }
                              >
                                {isWithdraw
                                  ? `-${Math.abs(tx.netAmount).toLocaleString('vi-VN')}₫`
                                  : `+${tx.netAmount.toLocaleString('vi-VN')}₫`}
                              </span>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${isLocked
                                    ? 'bg-secondary-fixed text-on-secondary-fixed'
                                    : isWithdraw
                                      ? 'bg-surface-container-high text-on-surface-variant'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${isLocked
                                      ? 'bg-secondary animate-pulse'
                                      : isWithdraw
                                        ? 'bg-outline'
                                        : 'bg-emerald-600'
                                    }`}
                                ></span>
                                {tx.statusLabel}
                              </span>
                              <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                                {tx.statusDesc}
                              </p>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* WITHDRAW MODAL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl max-w-md w-full shadow-2xl p-6 border border-outline-variant/30 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl">
                  account_balance
                </span>
                <h3 className="font-headline-sm text-primary text-lg font-bold">
                  Yêu Cầu Rút Tiền Về Ngân Hàng
                </h3>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-outline hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {/* Account Bank Card */}
              <div className="p-4 bg-surface-container rounded-xl space-y-1.5 border border-outline-variant/20 text-xs">
                <span className="text-on-surface-variant block font-medium">
                  Tài khoản ngân hàng thụ hưởng đã xác thực:
                </span>
                <div className="font-bold text-primary text-sm">
                  Vietcombank (Chi nhánh TP.HCM)
                </div>
                <div className="font-mono text-secondary font-bold">
                  0071 0012 89932
                </div>
                <div className="text-on-surface font-semibold uppercase">
                  NGUYEN MAI THAO HAN (LA CREME PATISSERIE)
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-primary">Số tiền muốn rút:</label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(availableBalance.toLocaleString('vi-VN'))}
                    className="text-secondary font-semibold hover:underline cursor-pointer"
                  >
                    Rút toàn bộ ({availableBalance.toLocaleString('vi-VN')}₫)
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Nhập số tiền (tối thiểu 500.000₫)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-sm font-mono font-bold text-primary focus:outline-none focus:border-secondary"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant text-xs">
                    VNĐ
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary-fixed/40 text-on-secondary-fixed text-xs flex items-center justify-between">
                <span>Phí dịch vụ rút tiền:</span>
                <span className="font-bold text-emerald-800">Miễn phí (0₫)</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-secondary text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  Xác Nhận Rút Tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
