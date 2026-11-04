import React, { useMemo, useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { DataTable, Icon } from '../../../components/common/WorkspaceUI.jsx'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { useAuth } from '../../../context/useAuth.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadPaymentDirectory } from '../../../services/adminPaymentPresentation.js'
import { adminManagementService } from '../../../services/adminManagementService.js'
import { paymentDateRange } from '../../../services/adminFilterModels.js'
import { dashboardMoney, dashboardNumber, dashboardDateTime } from '../../../services/adminDashboardModels.js'
import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import { demoRuntime, getDemoStore } from '../../../mockData/runtime.js'
import './admin-revenue.css'

function getPresetDates(preset) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  if (preset === 'today') {
    return { from: todayStr, to: todayStr }
  }
  if (preset === '7days') {
    const d = new Date(now.getTime() - 7 * 86400000)
    return { from: d.toISOString().slice(0, 10), to: todayStr }
  }
  if (preset === '30days') {
    const d = new Date(now.getTime() - 30 * 86400000)
    return { from: d.toISOString().slice(0, 10), to: todayStr }
  }
  if (preset === 'month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    return { from: firstDay, to: todayStr }
  }
  return { from: '', to: '' }
}

export default function AdminRevenuePage({ onNavigate }) {
  const { user } = useAuth()
  const [activePreset, setActivePreset] = useState('all')
  const [draftDates, setDraftDates] = useState({ from: '', to: '' })
  const [appliedDates, setAppliedDates] = useState({ from: '', to: '' })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [detailModal, setDetailModal] = useState(null)
  const [dateError, setDateError] = useState(null)

  // 1. Build date range filter matching Backend API (@RequestParam submittedFrom, submittedTo)
  const dateParams = useMemo(() => {
    try {
      if (!appliedDates.from && !appliedDates.to) return {}
      const fromStr = appliedDates.from ? `${appliedDates.from}T00:00:00` : ''
      const toStr = appliedDates.to ? `${appliedDates.to}T23:59:59` : ''
      return paymentDateRange(fromStr || undefined, toStr || undefined)
    } catch {
      return {}
    }
  }, [appliedDates])

  // 2. Query Approved payments matching backend contract: /api/v1/admin/bakery-payments?status=APPROVED
  const paymentsResource = useCatalogResource(loadPaymentDirectory, {
    status: 'APPROVED',
    page,
    size: 20,
    sort: 'submittedAt,desc',
    ...dateParams,
  })

  // 3. Load plans to ensure all tiers (Khởi đầu, Nghệ nhân, Chuyên nghiệp) are represented
  const plansResource = useCatalogResource(adminManagementService.getPlans)

  const loading = paymentsResource.status === 'loading'
  const refreshing = paymentsResource.refreshing

  // Count pending payments to display clean separation link
  const store = (typeof getDemoStore === 'function' ? getDemoStore() : null) || demoRuntime?.store
  const pendingCount = store?.state?.payments?.filter((p) => p.status === 'SUBMITTED')?.length || 0

  // Handle Preset Clicks
  const handlePresetSelect = (presetKey) => {
    setActivePreset(presetKey)
    setDateError(null)
    const dates = getPresetDates(presetKey)
    setDraftDates(dates)
    setAppliedDates(dates)
    setPage(1)
  }

  // Handle Custom Filter Submission
  const handleApplyFilter = (e) => {
    e.preventDefault()
    setDateError(null)
    try {
      if (draftDates.from && draftDates.to) {
        if (new Date(draftDates.from) > new Date(draftDates.to)) {
          setDateError('Ngày bắt đầu không được sau ngày kết thúc.')
          return
        }
      }
      setActivePreset('custom')
      setAppliedDates({ from: draftDates.from, to: draftDates.to })
      setPage(1)
    } catch (err) {
      setDateError(err.message || 'Khoảng thời gian không hợp lệ.')
    }
  }

  // Handle Reset Filter
  const handleResetFilter = () => {
    setDateError(null)
    setActivePreset('all')
    setDraftDates({ from: '', to: '' })
    setAppliedDates({ from: '', to: '' })
    setSearch('')
    setPage(1)
  }

  // Calculations for KPI in selected period
  const rawPayments = paymentsResource.data?.result || []
  const totalApprovedTransactions = paymentsResource.data?.meta?.total ?? rawPayments.length

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return rawPayments
    const q = search.toLowerCase().trim()
    return rawPayments.filter((p) => {
      const bName = p.context?.profile?.bakery?.name || p.submittedByName || ''
      const pName = p.context?.order?.planNameSnapshot || ''
      const ref = p.paymentReference || p.id || ''
      return (
        bName.toLowerCase().includes(q) ||
        pName.toLowerCase().includes(q) ||
        ref.toLowerCase().includes(q)
      )
    })
  }, [rawPayments, search])

  // Total period revenue
  const periodTotalRevenue = useMemo(() => {
    return rawPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }, [rawPayments])

  // Revenue breakdown by plan tier
  const planTiers = useMemo(() => {
    const plans = plansResource.data || []
    const breakdown = {}

    // Initialize all plans
    for (const plan of plans) {
      breakdown[plan.id] = {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        revenue: 0,
        count: 0,
      }
    }

    // Accumulate from approved payments
    for (const p of rawPayments) {
      const planId = p.context?.order?.planId
      const planName = p.context?.order?.planNameSnapshot || 'Gói dịch vụ'
      if (planId && breakdown[planId]) {
        breakdown[planId].revenue += Number(p.amount) || 0
        breakdown[planId].count += 1
      } else {
        // Fallback matching by name
        const match = Object.values(breakdown).find((b) => b.name === planName)
        if (match) {
          match.revenue += Number(p.amount) || 0
          match.count += 1
        }
      }
    }

    return Object.values(breakdown)
  }, [plansResource.data, rawPayments])

  // Top performing plan
  const topPlan = useMemo(() => {
    if (!planTiers.length) return null
    return [...planTiers].sort((a, b) => b.revenue - a.revenue)[0]
  }, [planTiers])

  return (
    <AdminFrame
      activeTab="admin-revenue"
      onNavigate={onNavigate}
      headerAction={
        <RefreshButton
          disabled={loading || refreshing}
          onClick={() => {
            paymentsResource.reload()
            plansResource.reload()
          }}
        >
          {loading || refreshing ? 'Đang cập nhật…' : 'Làm mới'}
        </RefreshButton>
      }
    >
      <div className="sc-admin-revenue">
        {/* Top Info Bar: Completely separates Approval queue from Financial Revenue */}
        <div className="sc-revenue-top-bar">
          <div className="sc-revenue-top-title-wrap">
            <span className="sc-revenue-top-badge">
              <Icon name="verified_user" />
              Doanh thu đã đối soát
            </span>
            <span className="sc-revenue-top-desc">
              Chỉ ghi nhận từ các giao dịch thanh toán gói dịch vụ đã được phê duyệt hợp lệ.
            </span>
          </div>

          {pendingCount > 0 && (
            <button
              type="button"
              className="sc-revenue-pending-link"
              onClick={() => onNavigate?.('admin-payments')}
              title="Chuyển đến màn hình đối chiếu chứng từ mới"
            >
              <Icon name="receipt_long" />
              <span>Duyệt gói dịch vụ</span>
              <span className="sc-revenue-pending-badge">{pendingCount} chờ duyệt</span>
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>

        {/* Filter Section: Presets, Custom Range & Search */}
        <section className="sc-revenue-filter-panel" aria-label="Bộ lọc khoảng thời gian">
          {/* Row 1: Presets on Left, Search on Right (Balanced across width) */}
          <div className="sc-revenue-filter-row sc-revenue-filter-row--primary">
            <div className="sc-revenue-filter-col">
              <span className="sc-revenue-row-label">
                <Icon name="history_toggle_off" />
                <span>Mốc thời gian:</span>
              </span>
              <div className="sc-revenue-segmented-control" role="tablist" aria-label="Mốc thời gian">
                {[
                  ['all', 'Tất cả'],
                  ['today', 'Hôm nay'],
                  ['7days', '7 ngày qua'],
                  ['30days', '30 ngày qua'],
                  ['month', 'Tháng này'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={activePreset === key}
                    className={
                      'sc-revenue-segment-btn' +
                      (activePreset === key ? ' sc-revenue-segment-btn--active' : '')
                    }
                    onClick={() => handlePresetSelect(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sc-revenue-search-box">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Tìm tiệm bánh, gói dịch vụ, mã GD..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Tìm kiếm trong danh sách giao dịch"
              />
              {search && (
                <button
                  type="button"
                  className="sc-revenue-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <Icon name="close" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Date Range on Left, Status Summary on Right (No repeated dates!) */}
          <div className="sc-revenue-filter-row sc-revenue-filter-row--secondary">
            <form onSubmit={handleApplyFilter} className="sc-revenue-range-form">
              <span className="sc-revenue-row-label">
                <Icon name="date_range" />
                <span>Khoảng ngày:</span>
              </span>

              <div className="sc-revenue-range-group">
                <div className="sc-revenue-date-field">
                  <label htmlFor="rev-from-date" className="sc-revenue-date-label">Từ</label>
                  <input
                    id="rev-from-date"
                    type="date"
                    value={draftDates.from}
                    onChange={(e) => {
                      setDraftDates({ ...draftDates, from: e.target.value })
                      setActivePreset('custom')
                    }}
                    className="sc-revenue-date-input"
                    aria-label="Từ ngày"
                  />
                </div>

                <span className="sc-revenue-date-sep" aria-hidden="true">→</span>

                <div className="sc-revenue-date-field">
                  <label htmlFor="rev-to-date" className="sc-revenue-date-label">Đến</label>
                  <input
                    id="rev-to-date"
                    type="date"
                    value={draftDates.to}
                    onChange={(e) => {
                      setDraftDates({ ...draftDates, to: e.target.value })
                      setActivePreset('custom')
                    }}
                    className="sc-revenue-date-input"
                    aria-label="Đến ngày"
                  />
                </div>
              </div>

              <div className="sc-revenue-range-actions">
                <button
                  type="submit"
                  className="sc-revenue-btn-apply"
                  disabled={refreshing}
                  title="Áp dụng khoảng thời gian"
                >
                  <Icon name="filter_alt" />
                  <span>Áp dụng</span>
                </button>

                {(appliedDates.from || appliedDates.to || activePreset !== 'all' || search) && (
                  <button
                    type="button"
                    className="sc-revenue-btn-reset"
                    onClick={handleResetFilter}
                    title="Đặt lại bộ lọc"
                  >
                    <Icon name="restart_alt" />
                    <span>Đặt lại</span>
                  </button>
                )}
              </div>
            </form>

            <div className="sc-revenue-status-chip">
              <span className="sc-revenue-status-dot" aria-hidden="true" />
              <span>
                Đã đối soát: <strong>{totalApprovedTransactions}</strong> giao dịch
                {search && filteredPayments.length !== totalApprovedTransactions && (
                  <span className="sc-revenue-status-match">
                    {' '}(khớp <strong>{filteredPayments.length}</strong>)
                  </span>
                )}
              </span>
            </div>
          </div>

          {dateError && (
            <div role="alert" className="sc-revenue-filter-error">
              <Icon name="error_outline" />
              <span>{dateError}</span>
            </div>
          )}
        </section>

        {/* 3 Financial KPI Cards */}
        <section className="sc-revenue-kpi-grid" aria-label="Chỉ số doanh thu trong kỳ">
          <article className="sc-revenue-kpi-card sc-revenue-kpi-card--hero">
            <div className="sc-revenue-kpi-top">
              <span className="sc-revenue-kpi-label">Doanh thu trong kỳ</span>
              <span className="sc-revenue-kpi-icon">
                <Icon name="account_balance_wallet" />
              </span>
            </div>
            <div className="sc-revenue-kpi-value">
              {loading ? '…' : dashboardMoney(periodTotalRevenue, 'VND')}
            </div>
            <div className="sc-revenue-kpi-sub">
              {appliedDates.from || appliedDates.to
                ? 'Thực thu theo khoảng thời gian đã chọn'
                : 'Tổng doanh thu gói dịch vụ đã duyệt'}
            </div>
          </article>

          <article className="sc-revenue-kpi-card">
            <div className="sc-revenue-kpi-top">
              <span className="sc-revenue-kpi-label">Giao dịch thành công</span>
              <span className="sc-revenue-kpi-icon">
                <Icon name="verified" />
              </span>
            </div>
            <div className="sc-revenue-kpi-value">
              {loading ? '…' : dashboardNumber(totalApprovedTransactions)}
            </div>
            <div className="sc-revenue-kpi-sub">Khoản thanh toán đã đối chiếu khớp lệnh</div>
          </article>

          <article className="sc-revenue-kpi-card">
            <div className="sc-revenue-kpi-top">
              <span className="sc-revenue-kpi-label">Gói đóng góp cao nhất</span>
              <span className="sc-revenue-kpi-icon">
                <Icon name="workspace_premium" />
              </span>
            </div>
            <div className="sc-revenue-kpi-value text-primary">
              {loading ? '…' : topPlan?.revenue ? topPlan.name : 'Chưa có'}
            </div>
            <div className="sc-revenue-kpi-sub">
              {topPlan?.revenue ? dashboardMoney(topPlan.revenue, 'VND') : 'Chưa có dữ liệu'}
            </div>
          </article>
        </section>

        {/* Revenue Breakdown by Plan Tier */}
        {planTiers.length > 0 && (
          <section className="sc-revenue-breakdown-panel">
            <div className="sc-revenue-breakdown-heading">
              <h3>
                <Icon name="pie_chart" />
                Cơ cấu doanh thu theo gói dịch vụ
              </h3>
              <span className="text-xs text-muted">
                {planTiers.filter((p) => p.revenue > 0).length} / {planTiers.length} gói có phát sinh doanh thu
              </span>
            </div>

            <div className="sc-revenue-plan-cards">
              {planTiers.map((tier) => {
                const percentage =
                  periodTotalRevenue > 0
                    ? Math.round((tier.revenue / periodTotalRevenue) * 100)
                    : 0
                return (
                  <div key={tier.id} className="sc-revenue-plan-card">
                    <div className="sc-revenue-plan-header">
                      <span className="sc-revenue-plan-name">{tier.name}</span>
                      <span className="sc-revenue-plan-code-badge">{tier.code}</span>
                    </div>

                    <div className="sc-revenue-plan-amount">
                      {dashboardMoney(tier.revenue, 'VND')}
                    </div>

                    <div className="sc-revenue-plan-bar-track">
                      <div
                        className="sc-revenue-plan-bar-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="sc-revenue-plan-meta">
                      <span>Đã kích hoạt: {tier.count} kỳ</span>
                      <strong className="text-primary">{percentage}% doanh thu</strong>
                    </div>

                    <div className="text-xs text-muted pt-2 border-t border-dashed border-border/40">
                      Giá niêm yết: {dashboardMoney(tier.monthlyPrice, 'VND')}/tháng
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Authoritative Revenue Transactions Table */}
        <section className="sc-revenue-table-panel">
          <div className="sc-revenue-table-toolbar">
            <div>
              <h3 className="sc-revenue-table-title">
                Chi tiết các giao dịch thực thu
              </h3>
              <p className="text-xs text-muted mt-1">
                Các khoản thanh toán gói đã được phê duyệt trong khoảng thời gian đã chọn.
              </p>
            </div>
            {search && (
              <span className="text-xs font-semibold text-secondary">
                Tìm thấy {filteredPayments.length} kết quả khớp "{search}"
              </span>
            )}
          </div>

          {filteredPayments.length > 0 ? (
            <>
              <DataTable label="Giao dịch doanh thu" className="sc-admin-fixed-table">
                <colgroup>
                  {[22, 18, 16, 18, 16, 10].map((width, index) => (
                    <col key={index} style={{ width: width + '%' }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th>Tiệm bánh / Người nộp</th>
                    <th>Gói dịch vụ</th>
                    <th className="sc-money">Số tiền</th>
                    <th>Mã GD / Phương thức</th>
                    <th>Thời gian duyệt</th>
                    <th className="sc-table-actions">Biên lai</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const bakeryName =
                      payment.context?.profile?.bakery?.name ||
                      payment.submittedByName ||
                      'Tiệm bánh đối tác'
                    const planName =
                      payment.context?.order?.planNameSnapshot || 'Gói dịch vụ'
                    return (
                      <tr key={payment.id}>
                        <td>
                          <strong>{cleanPresentationLabel(bakeryName)}</strong>
                          <small>{payment.submittedByName || 'Chủ tiệm bánh'}</small>
                        </td>
                        <td>
                          <span className="font-semibold text-primary">{planName}</span>
                          <small className="block text-xs text-muted">
                            Kỳ: {payment.context?.order?.billingPeriodMonths || 1} tháng
                          </small>
                        </td>
                        <td className="sc-money text-emerald-700 font-bold">
                          +{dashboardMoney(payment.amount, payment.currency || 'VND')}
                        </td>
                        <td>
                          <strong>{payment.paymentReference || 'Chuyển khoản QR'}</strong>
                          <small>{payment.paymentMethod || 'Vietcombank'}</small>
                        </td>
                        <td>
                          {dashboardDateTime(payment.reviewedAt || payment.submittedAt)}
                        </td>
                        <td className="sc-table-actions">
                          <button
                            type="button"
                            className="sc-button sc-action-button sc-action-button--secondary"
                            onClick={() => setDetailModal(payment)}
                            aria-label={'Xem biên lai ' + payment.id}
                          >
                            <Icon name="receipt" />
                            Xem
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </DataTable>
              {paymentsResource.data?.meta && (
                <CatalogPagination
                  meta={paymentsResource.data.meta}
                  onPage={setPage}
                />
              )}
            </>
          ) : (
            <p className="sc-dashboard-empty">
              {loading
                ? 'Đang tải dữ liệu giao dịch doanh thu…'
                : 'Không có giao dịch doanh thu nào trong khoảng thời gian đã chọn.'}
            </p>
          )}
        </section>

        {/* Transaction Detail & Receipt Modal */}
        {detailModal && (
          <div
            className="sc-revenue-modal-backdrop"
            onClick={() => setDetailModal(null)}
          >
            <div
              className="sc-revenue-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sc-revenue-modal-header">
                <h3>Chứng từ giao dịch doanh thu</h3>
                <button
                  type="button"
                  className="sc-revenue-modal-close"
                  onClick={() => setDetailModal(null)}
                >
                  <Icon name="close" />
                </button>
              </div>

              <div className="sc-revenue-modal-body">
                <div className="sc-revenue-modal-grid">
                  <div className="sc-revenue-modal-cell">
                    <small>Tiệm bánh</small>
                    <strong>
                      {detailModal.context?.profile?.bakery?.name ||
                        detailModal.submittedByName ||
                        'Tiệm bánh'}
                    </strong>
                  </div>
                  <div className="sc-revenue-modal-cell">
                    <small>Gói dịch vụ</small>
                    <strong>
                      {detailModal.context?.order?.planNameSnapshot || 'Gói dịch vụ'}
                    </strong>
                  </div>
                  <div className="sc-revenue-modal-cell">
                    <small>Số tiền thực nhận</small>
                    <strong className="text-emerald-700 font-bold">
                      +{dashboardMoney(detailModal.amount, detailModal.currency || 'VND')}
                    </strong>
                  </div>
                  <div className="sc-revenue-modal-cell">
                    <small>Mã giao dịch</small>
                    <strong>{detailModal.paymentReference || detailModal.id}</strong>
                  </div>
                  <div className="sc-revenue-modal-cell">
                    <small>Phương thức</small>
                    <strong>{detailModal.paymentMethod || 'Chuyển khoản Vietcombank'}</strong>
                  </div>
                  <div className="sc-revenue-modal-cell">
                    <small>Thời gian duyệt</small>
                    <strong>
                      {dashboardDateTime(
                        detailModal.reviewedAt || detailModal.submittedAt
                      )}
                    </strong>
                  </div>
                </div>

                {detailModal.proofUrl && (
                  <div className="sc-revenue-proof-box">
                    <div className="flex items-center justify-between">
                      <small className="font-bold text-muted uppercase text-xs">
                        Ảnh chụp biên lai chuyển khoản
                      </small>
                      <a
                        href={detailModal.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Icon name="open_in_new" />
                        Mở ảnh gốc
                      </a>
                    </div>
                    <img
                      src={detailModal.proofUrl}
                      alt="Biên lai chuyển khoản"
                      className="sc-revenue-proof-img"
                    />
                  </div>
                )}

                {detailModal.reviewNote && (
                  <div className="sc-revenue-modal-cell">
                    <small>Ghi chú đối chiếu của Admin</small>
                    <p className="text-xs text-primary font-medium mt-1">
                      {detailModal.reviewNote}
                    </p>
                  </div>
                )}
              </div>

              <div className="sc-revenue-modal-footer">
                {detailModal.proofUrl && (
                  <a
                    href={detailModal.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="sc-button sc-action-button sc-action-button--secondary"
                  >
                    <Icon name="visibility" />
                    Xem ảnh đầy đủ
                  </a>
                )}
                <button
                  type="button"
                  className="sc-button sc-action-button sc-action-button--primary"
                  onClick={() => setDetailModal(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminFrame>
  )
}
