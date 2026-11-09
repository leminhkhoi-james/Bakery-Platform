import { unifiedIssues, recordSource, unifiedSnapshot, unifiedMetrics } from '../../../services/unifiedDataService.js'
import BusinessSimulationReport from '../../../components/management/BusinessSimulationReport.jsx'
import React, { useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { DataTable, Icon } from '../../../components/common/WorkspaceUI.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { ApiErrorMessage } from '../../../components/management/ApiState.jsx'
import { loadRevenuePayments, loadAdminPending } from '../../../services/adminSummaryService.js'
import { loadAdminPlans } from '../../../services/adminManagementService.js'
import { approvalDate, approvedPayments, businessDateSelected, businessDay, settledBusinessSales } from '../../../mockData/business/metrics.js'
import { subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { dashboardMoney, dashboardNumber, dashboardDateTime } from '../../../services/adminDashboardModels.js'
import { cleanPresentationLabel } from '../../../services/uiLabels.js'
import { planName, sortPlansByTier } from '../../../services/planPresentation.js'
import './admin-revenue.css'

function getPresetDates(preset) {
  const now = new Date()
  const todayStr = businessDay(now)
  if (preset === 'today') {
    return { from: todayStr, to: todayStr }
  }
  if (preset === '7days') {
    const d = new Date(now.getTime() - 6 * 86400000)
    return { from: businessDay(d), to: todayStr }
  }
  if (preset === '30days') {
    const d = new Date(now.getTime() - 29 * 86400000)
    return { from: businessDay(d), to: todayStr }
  }
  if (preset === 'month') {
    const firstDay = todayStr.slice(0, 7) + '-01'
    return { from: firstDay, to: todayStr }
  }
  return { from: '', to: '' }
}

function groupMonthlyRevenue(rows, dateOf, amountOf) {
  const totals = new Map()
  for (const row of rows) {
    const month = businessDay(dateOf(row)).slice(0, 7)
    if (!month) continue
    totals.set(month, (totals.get(month) || 0) + amountOf(row))
  }
  return totals
}

function MonthlyRevenueChart({ title, series }) {
  if (!series.size) return null
  const peak = Math.max(1, ...series.values())
  return <section className="sc-revenue-month-chart" aria-label={title}>
    <h4>{title}</h4>
    {[...series].sort(([first], [second]) => first.localeCompare(second)).map(([month, amount]) => (
      <div key={month} className="sc-revenue-month-row">
        <span>{month.slice(5)}/{month.slice(0, 4)}</span>
        <div className="sc-revenue-plan-bar-track" aria-hidden="true">
          <div className="sc-revenue-plan-bar-fill" style={{ width: `${(amount / peak) * 100}%` }} />
        </div>
        <strong>{dashboardMoney(amount, 'VND')}</strong>
      </div>
    ))}
  </section>
}

export default function AdminRevenuePage({ onNavigate }) {
  const [activePreset, setActivePreset] = useState('all')
  const [draftDates, setDraftDates] = useState({ from: '', to: '' })
  const [appliedDates, setAppliedDates] = useState({ from: '', to: '' })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [breakdownSource, setBreakdownSource] = useState('local')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailModal, setDetailModal] = useState(null)
  const [dateError, setDateError] = useState(null)

  const paymentsResource = useCatalogResource(loadRevenuePayments)

  // 3. Load plans to ensure all tiers (Khởi đầu, Nghệ nhân, Chuyên nghiệp) are represented
  const plansResource = useCatalogResource(loadAdminPlans)

  const loading = paymentsResource.status === 'loading'
  const refreshing = paymentsResource.refreshing

  // Count pending payments to display clean separation link
  const pending = useCatalogResource(loadAdminPending)
  const pendingCount = pending.data?.payments ?? null

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
    setStatusFilter('')
    setPage(1)
  }

  const allPayments = paymentsResource.data || []
  const inPeriod = payment => businessDateSelected(payment.reviewedAt || payment.submittedAt, appliedDates.from, appliedDates.to)
  const approvalInPeriod = payment => businessDateSelected(approvalDate(payment), appliedDates.from, appliedDates.to)
  const payments = allPayments.filter(payment => payment.status === 'APPROVED' ? approvalInPeriod(payment) : inPeriod(payment))
  const ready = paymentsResource.status === 'ready'
  const apiReady = ready && !unifiedIssues().some(issue => issue.source === 'api' && issue.path === '/admin/bakery-payments')
  const localReady = ready && !unifiedIssues().some(issue => issue.source === 'local' && issue.path === '/admin/bakery-payments')
  const realPayments = approvedPayments(allPayments.filter(row => recordSource(row) === 'api')).filter(approvalInPeriod)
  const simulatedPayments = approvedPayments(allPayments.filter(row => recordSource(row) === 'local')).filter(approvalInPeriod)
  const sum = rows => rows.reduce((total, row) => total + row.amount, 0)
  const realRevenue = apiReady ? sum(realPayments) : null
  const simulatedRevenue = localReady ? sum(simulatedPayments) : null
  const snapshot = unifiedSnapshot()
  const simulatedSales = snapshot ? unifiedMetrics(snapshot, appliedDates).simulationSalesRevenue : null
  const totalApprovedTransactions = ready ? realPayments.length + simulatedPayments.length : null
  const rawPayments = breakdownSource === 'local' ? simulatedPayments : realPayments

  const filteredPayments = (() => {
    const q = search.toLowerCase().trim()
    return payments.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false
      const bName = p.context?.profile?.bakery?.name || p.submittedByName || ''
      const pName = planName({ name: p.context?.order?.planNameSnapshot, code: p.context?.order?.planCodeSnapshot })
      const ref = p.paymentReference || p.id || ''
      return (
        bName.toLowerCase().includes(q) ||
        pName.toLowerCase().includes(q) ||
        ref.toLowerCase().includes(q)
      )
    })
  })()

  const periodTotalRevenue = breakdownSource === 'local' ? simulatedRevenue : realRevenue

  const countedPayments = new Set([...realPayments, ...simulatedPayments].map(row => row.id))
  const monthlyRevenue = groupMonthlyRevenue(rawPayments, approvalDate, payment => payment.amount)
  const settledSales = snapshot
    ? settledBusinessSales({ ...snapshot, orders: snapshot.orders.filter(order => recordSource(order) === 'local') }, appliedDates)
    : []
  const monthlySales = groupMonthlyRevenue(settledSales, row => row.recognizedAt, row => row.order.totalAmount)

  // Revenue breakdown by plan tier
  const planTiers = (() => {
    const plans = plansResource.data || []
    const breakdown = {}

    // Initialize all plans
    for (const plan of plans) {
      breakdown[plan.code || plan.id] = {
        id: plan.id,
        code: plan.code,
        name: planName(plan),
        monthlyPrice: plan.monthlyPrice,
        revenue: 0,
        count: 0,
      }
    }

    // Accumulate from approved payments
    for (const p of rawPayments) {
      const planId = p.context?.order?.planCodeSnapshot || p.context?.order?.planId || 'UNKNOWN'
      const pName = planName({ name: p.context?.order?.planNameSnapshot, code: p.context?.order?.planCodeSnapshot })
      if (planId && breakdown[planId]) {
        breakdown[planId].revenue += Number(p.amount) || 0
        breakdown[planId].count += 1
      } else {
        breakdown[planId] = { id: planId, code: p.context?.order?.planCodeSnapshot || 'CUSTOM', name: planId === 'UNKNOWN' ? 'Chưa xác định gói' : pName, revenue: Number(p.amount), count: 1 }
      }
    }

    const tiers = sortPlansByTier(Object.values(breakdown))
    if (!periodTotalRevenue) return tiers.map(tier => ({ ...tier, share: 0 }))
    const shares = tiers.map(tier => {
      const exact = tier.revenue / periodTotalRevenue * 100
      return { ...tier, share: Math.floor(exact), fraction: exact % 1 }
    })
    const remaining = 100 - shares.reduce((total, tier) => total + tier.share, 0)
    const remainderOrder = [...shares].sort((a, b) => b.fraction - a.fraction)
    remainderOrder.slice(0, remaining).forEach(tier => { tier.share++ })
    return shares
  })()

  // Top performing plan
  const topPlan = (() => {
    if (!planTiers.length) return null
    return [...planTiers].sort((a, b) => b.revenue - a.revenue)[0]
  })()

  return (
    <AdminFrame
      activeTab="admin-revenue"
      onNavigate={onNavigate}
    >
      <div className="sc-admin-revenue">
        {/* Top Info Bar: Completely separates Approval queue from Financial Revenue */}
        <div className="sc-revenue-top-bar">
          <div className="sc-revenue-top-title-wrap">
            <span className="sc-revenue-top-badge">
              <Icon name="verified_user" />
              Doanh thu theo nguồn
            </span>
            <span className="sc-revenue-top-desc">
              Doanh thu gói được ghi nhận theo ngày duyệt. Doanh thu bán bánh mô phỏng ghi nhận khi đơn đã hoàn tất và đã thu tiền.
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
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
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
                Đã duyệt (hai nguồn): <strong>{dashboardNumber(totalApprovedTransactions)}</strong> giao dịch
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

        {/* Financial KPI Cards */}
        <section className="sc-revenue-kpi-grid" aria-label="Chỉ số doanh thu trong kỳ">
          <article className="sc-revenue-kpi-card sc-revenue-kpi-card--hero" aria-label="Gói dịch vụ thực nhận">
            <div className="sc-revenue-kpi-top">
              <span className="sc-revenue-kpi-label">Gói dịch vụ thực nhận</span>
              <span className="sc-revenue-kpi-icon">
                <Icon name="account_balance_wallet" />
              </span>
            </div>
            <div className="sc-revenue-kpi-value">
              {loading ? '…' : dashboardMoney(realRevenue, 'VND')}
            </div>
            <div className="sc-revenue-kpi-sub">
              Chứng từ Backend đã duyệt
            </div>
          </article>

          <article className="sc-revenue-kpi-card" aria-label="Gói dịch vụ mô phỏng">
            <div className="sc-revenue-kpi-label">Gói dịch vụ mô phỏng</div>
            <div className="sc-revenue-kpi-value">{loading ? '…' : dashboardMoney(simulatedRevenue, 'VND')}</div>
            <div className="sc-revenue-kpi-sub">{simulatedPayments.length} chứng từ trình duyệt đã duyệt</div>
          </article>

          <article className="sc-revenue-kpi-card" aria-label="Bán bánh mô phỏng">
            <div className="sc-revenue-kpi-label">Bán bánh mô phỏng</div>
            <div className="sc-revenue-kpi-value">{dashboardMoney(simulatedSales, 'VND')}</div>
            <div className="sc-revenue-kpi-sub">Đơn hoàn tất và đã ghi thu trong trình duyệt</div>
          </article>

          <article className="sc-revenue-kpi-card">
            <div className="sc-revenue-kpi-top">
              <span className="sc-revenue-kpi-label">Gói cao nhất · {breakdownSource === 'local' ? 'Mô phỏng' : 'Thực nhận'}</span>
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
        {paymentsResource.error && <ApiErrorMessage error={paymentsResource.error} retry={paymentsResource.reload} />}
        {plansResource.error && <ApiErrorMessage error={plansResource.error} retry={plansResource.reload} />}
        {(plansResource.data || paymentsResource.data) && (
          <section className="sc-revenue-breakdown-panel">
            <div className="sc-revenue-breakdown-heading">
              <h3>
                <Icon name="pie_chart" />
                Cơ cấu doanh thu theo gói
              </h3>
              <label>Nguồn cơ cấu gói
                <select className="sc-input ml-2" value={breakdownSource} onChange={event => setBreakdownSource(event.target.value)}>
                  <option value="local">Mô phỏng</option><option value="api">Thực nhận</option>
                </select>
              </label>
            </div>

            {periodTotalRevenue !== null && <MonthlyRevenueChart title="Doanh thu gói theo tháng" series={monthlyRevenue} />}

            <div className="sc-revenue-plan-cards">
              {planTiers.map((tier) => {
                const percentage = tier.share
                return (
                  <div key={tier.id} className="sc-revenue-plan-card">
                    <div className="sc-revenue-plan-header">
                      <span className="sc-revenue-plan-name">{tier.name}</span>
                    </div>

                    <div className="sc-revenue-plan-amount">
                      {dashboardMoney(periodTotalRevenue === null ? null : tier.revenue, 'VND')}
                    </div>

                    <div className="sc-revenue-plan-bar-track">
                      <div
                        className="sc-revenue-plan-bar-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="sc-revenue-plan-meta">
                      <span>Chứng từ đã duyệt: {tier.count}</span>
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
          <label className="mb-3 block">Trạng thái giao dịch
            <select className="sc-input ml-2" value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1) }}>
              <option value="">Tất cả</option>
              {['APPROVED', 'SUBMITTED', 'REJECTED'].map(status => <option key={status} value={status}>{subscriptionStatusLabel(status)}</option>)}
            </select>
          </label>
          <div className="sc-revenue-table-toolbar">
            <div>
              <h3 className="sc-revenue-table-title">
                Lịch sử giao dịch gói dịch vụ
              </h3>
              <p className="text-xs text-muted mt-1">
                Giao dịch từ Backend và dữ liệu mô phỏng trong khoảng thời gian đã chọn.
              </p>
            </div>
            {search && (
              <span className="text-xs font-semibold text-secondary">
                Tìm thấy {filteredPayments.length} kết quả khớp "{search}"
              </span>
            )}
          </div>

          {paymentsResource.error ? <p>Chưa thể tải giao dịch. Hãy thử tải lại.</p> : filteredPayments.length > 0 ? (
            <>
              <DataTable label="Giao dịch doanh thu" className="sc-admin-fixed-table">
                <colgroup>
                  <col style={{ width: '60px' }} />
                  {[20, 18, 16, 18, 16, 12].map((width, index) => (
                    <col key={index} style={{ width: width + '%' }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                    <th>Tiệm bánh / Người nộp</th>
                    <th>Gói dịch vụ</th>
                    <th className="sc-money">Số tiền</th>
                    <th>Mã GD / Phương thức</th>
                    <th>Thời gian / Trạng thái</th>
                    <th className="sc-table-actions">Biên lai</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.slice((page - 1) * 20, page * 20).map((payment, index) => {
                    const stt = (page - 1) * 20 + index + 1
                    const bakeryName =
                      payment.context?.profile?.bakery?.name ||
                      payment.submittedByName ||
                      'Tiệm bánh đối tác'
                    const planDisplayName =
                      planName({ name: payment.context?.order?.planNameSnapshot, code: payment.context?.order?.planCodeSnapshot })
                    return (
                      <tr key={payment.id}>
                        <td data-label="STT" style={{ width: '60px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-muted, #64748b)' }}>
                          {stt}
                        </td>
                        <td>
                          <strong>{cleanPresentationLabel(bakeryName)}</strong>
                          <small>{recordSource(payment) === 'local' ? 'Mô phỏng' : 'Backend'} · {payment.submittedByName || 'Chủ tiệm bánh'}</small>
                        </td>
                        <td>
                          <span className="font-semibold text-primary">{planDisplayName}</span>
                          <small className="block text-xs text-muted">
                            Kỳ: {payment.context?.order?.billingPeriodMonths ? payment.context.order.billingPeriodMonths + ' tháng' : '—'}
                          </small>
                        </td>
                        <td className="sc-money text-emerald-700 font-bold">
                          {dashboardMoney(payment.amount, payment.currency)}
                        </td>
                        <td>
                          <strong>{payment.paymentReference || '—'}</strong>
                          <small>{payment.paymentMethod || '—'}</small>
                        </td>
                        <td>
                          {dashboardDateTime(payment.status === 'APPROVED' ? approvalDate(payment) : payment.reviewedAt || payment.submittedAt)}<small>{subscriptionStatusLabel(payment.status)}</small>
                          {payment.status === 'APPROVED' && !countedPayments.has(payment.id) && <small>Không tính lại vào doanh thu</small>}
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
              {filteredPayments.length > 20 && (
                <CatalogPagination
                  meta={{ page, pageSize: 20, total: filteredPayments.length, pages: Math.ceil(filteredPayments.length / 20) }}
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
        {monthlySales.size > 0 && (
          <section className="sc-revenue-breakdown-panel">
            <MonthlyRevenueChart title="Doanh thu bán bánh mô phỏng theo tháng ghi nhận" series={monthlySales} />
          </section>
        )}

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
                      {planName({ name: detailModal.context?.order?.planNameSnapshot, code: detailModal.context?.order?.planCodeSnapshot })}
                    </strong>
                  </div>
                  <div className="sc-revenue-modal-cell">
                    <small>Số tiền giao dịch</small>
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
                    <strong>{detailModal.paymentMethod || '—'}</strong>
                  </div>
                  <div className="sc-revenue-modal-cell">
                    <small>{detailModal.reviewedAt ? 'Thời gian xử lý' : 'Thời gian gửi'}</small>
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
      <BusinessSimulationReport loadHistory dates={appliedDates} />
    </AdminFrame>
  )
}
