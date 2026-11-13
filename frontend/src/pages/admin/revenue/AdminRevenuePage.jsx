import PlanTierBadge from '../../../components/management/PlanTierBadge.jsx'
import RecordActionButton from '../../../components/common/RecordActionButton.jsx'
import { useViewportPageSize } from '../../../hooks/useViewportPageSize.js'
import React, { useState } from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { DataTable, DetailDrawer, Icon } from '../../../components/common/WorkspaceUI.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import { ApiErrorMessage } from '../../../components/management/ApiState.jsx'
import { approvalDate } from '../../../mockData/business/metrics.js'
import { subscriptionStatusLabel } from '../../../services/subscriptionModels.js'
import { dashboardMoney, dashboardDateTime } from '../../../services/adminDashboardModels.js'
import { cleanPresentationLabel, uiLabel } from '../../../services/uiLabels.js'
import { planName } from '../../../services/planPresentation.js'
import { useAuth } from '../../../context/useAuth.js'
import { useAdminReportFilters } from './useAdminReportFilters.js'
import { useAdminRevenueData } from './useAdminRevenueData.js'
import './admin-revenue.css'

export default function AdminRevenuePage({ onNavigate }) {
  const { user } = useAuth()
  const [filters] = useAdminReportFilters(user?.id)
  const { search } = filters
  const [page, setPage] = useState(1)
  const { containerRef, pageSize } = useViewportPageSize(() => setPage(1))
  const [detailModal, setDetailModal] = useState(null)
  const { paymentsResource, plansResource, loading, filteredPayments, realRevenue, countedPayments, planTiers, periodTotalRevenue } = useAdminRevenueData(filters)

  return (
    <AdminFrame activeTab="admin-revenue" onNavigate={onNavigate}>
      <div className="sc-admin-revenue">
        <div><button type="button" className="sc-button sc-action-button--secondary" onClick={() => onNavigate('admin-dashboard')}>Đổi bộ lọc ở Tổng quan</button></div>
        {/* Financial KPI Cards */}
        <section className="sc-revenue-kpi-card" aria-label="Doanh thu gói thực nhận">
          <span className="sc-revenue-kpi-label">Doanh thu</span>
          <div className="sc-revenue-kpi-value">{loading ? '…' : dashboardMoney(realRevenue, 'VND')}</div>
        </section>
        {/* Revenue Breakdown by Plan Tier */}
        {paymentsResource.error && <ApiErrorMessage error={paymentsResource.error} retry={paymentsResource.reload} />}
        {plansResource.error && <ApiErrorMessage error={plansResource.error} retry={plansResource.reload} />}
        {(plansResource.data || paymentsResource.data) && (
          <section className="sc-revenue-breakdown-panel">
            <div className="sc-revenue-breakdown-heading">
              <h3>
                <Icon name="pie_chart" />
                Cơ cấu doanh thu gói dịch vụ
              </h3>
            </div>


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

        <section ref={containerRef} className="sc-revenue-table-panel">
          <div className="sc-revenue-table-toolbar">
            <div>
              <h3 className="sc-revenue-table-title">
                Lịch sử giao dịch gói dịch vụ
              </h3>
            </div>
            {search && (
              <span className="text-xs font-semibold text-secondary">
                Tìm thấy {filteredPayments.length} kết quả khớp "{search}"
              </span>
            )}
          </div>

          {paymentsResource.error ? <p>Chưa thể tải giao dịch.</p> : filteredPayments.length > 0 ? (
            <>
              <DataTable label="Giao dịch doanh thu" className="sc-admin-fixed-table">
                <colgroup>
                  <col style={{ width: '60px' }} />
                  {[18, 15, 9, 15, 17, 17, 9].map((width, index) => (
                    <col key={index} style={{ width: width + '%' }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                    <th>Tiệm bánh</th>
                    <th>Gói dịch vụ</th>
                    <th>Thời hạn</th>
                    <th className="sc-money">Số tiền</th>
                    <th>Mã GD / Phương thức</th>
                    <th>Thời gian</th>
                    <th className="sc-table-actions">Biên lai</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.slice((page - 1) * pageSize, page * pageSize).map((payment, index) => {
                    const stt = (page - 1) * pageSize + index + 1
                    const bakeryName =
                      payment.context?.profile?.bakery?.name ||
                      payment.submittedByName ||
                      'Tiệm bánh đối tác'
                    const order = payment.context?.order
                    return (
                      <tr key={payment.id}>
                        <td data-label="STT" style={{ width: '60px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-muted, #64748b)' }}>
                          {stt}
                        </td>
                        <td>
                          <strong>{cleanPresentationLabel(bakeryName)}</strong>
                          
                        </td>
                        <td>
                          <PlanTierBadge name={order?.planNameSnapshot} code={order?.planCodeSnapshot} />
                        </td>
                        <td data-label="Thời hạn">{payment.context?.order?.billingPeriodMonths ? payment.context.order.billingPeriodMonths + ' tháng' : '—'}</td>
                        <td className="sc-money text-emerald-700 font-bold">
                          {dashboardMoney(payment.amount, payment.currency)}
                        </td>
                        <td>
                          <strong>{payment.paymentReference || '—'}</strong>
                          <small>{uiLabel(payment.paymentMethod, '—')}</small>
                        </td>
                        <td>
                          {dashboardDateTime(payment.status === 'APPROVED' ? approvalDate(payment) : payment.reviewedAt || payment.submittedAt)}
                          {payment.status === 'APPROVED' && !countedPayments.has(payment.id) && <small>Không tính lại vào doanh thu</small>}
                        </td>
                        <td className="sc-table-actions">
                          <RecordActionButton
                            type="button"
                            className="sc-button sc-action-button sc-action-button--secondary"
                            onClick={() => setDetailModal(payment)}
                            aria-label={'Xem chi tiết biên lai ' + payment.id}
                           action="view" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </DataTable>
              {filteredPayments.length > pageSize && (
                <CatalogPagination
                  meta={{ page, pageSize, total: filteredPayments.length, pages: Math.ceil(filteredPayments.length / pageSize) }}
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
          <DetailDrawer className="sc-workspace-detail" title="Chứng từ giao dịch doanh thu" onClose={() => setDetailModal(null)}
            headerContent={<><h2>Chứng từ giao dịch doanh thu</h2><p>{subscriptionStatusLabel(detailModal.status)} · {detailModal.paymentReference || detailModal.id}</p></>}
            footer={<div className="sc-business-actions justify-end">
              {detailModal.proofUrl && <a href={detailModal.proofUrl} target="_blank" rel="noreferrer" className="sc-button sc-action-button--secondary">Xem ảnh đầy đủ</a>}
              <button type="button" className="sc-button" onClick={() => setDetailModal(null)}>Đóng</button>
            </div>}>
            <section className="sc-detail-section"><h3>Thông tin giao dịch</h3><dl className="sc-detail-fields">
              <div>
                <dt>Tiệm bánh</dt>
                <dd>
                  {detailModal.context?.profile?.bakery?.name ||
                    detailModal.submittedByName ||
                    'Tiệm bánh'}
                </dd>
              </div>
              <div>
                <dt>Gói dịch vụ</dt>
                <dd>
                  {planName({ name: detailModal.context?.order?.planNameSnapshot, code: detailModal.context?.order?.planCodeSnapshot })}
                </dd>
              </div>
              <div>
                <dt>Số tiền giao dịch</dt>
                <dd className="text-emerald-700 font-bold">
                  +{dashboardMoney(detailModal.amount, detailModal.currency || 'VND')}
                </dd>
              </div>
              <div>
                <dt>Mã giao dịch</dt>
                <dd>{detailModal.paymentReference || detailModal.id}</dd>
              </div>
              <div>
                <dt>Phương thức</dt>
                <dd>{uiLabel(detailModal.paymentMethod, '—')}</dd>
              </div>
              <div>
                <dt>{detailModal.reviewedAt ? 'Thời gian xử lý' : 'Thời gian gửi'}</dt>
                <dd>
                  {dashboardDateTime(
                    detailModal.reviewedAt || detailModal.submittedAt
                  )}
                </dd>
              </div>
            </dl></section>

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
          </DetailDrawer>
        )}
      </div>
    </AdminFrame>
  )
}
