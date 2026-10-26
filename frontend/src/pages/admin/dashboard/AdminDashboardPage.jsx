import React from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { ApiState, panelClass, buttonClass } from '../../../components/management/ApiState.jsx'
import { DataTable, EmptyPanel, Icon, SectionHeading, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadAdminBakeries, loadAdminPayments } from '../../../services/publicationAdminService.js'
import { formatSubscriptionMoney } from '../../../services/subscriptionModels.js'

export default function AdminDashboardPage({ onNavigate }) {
  const bakeries = useCatalogResource(loadAdminBakeries, { status: 'PENDING_APPROVAL', page: 1, size: 5, sort: 'createdAt,asc' })
  const payments = useCatalogResource(loadAdminPayments, { status: 'SUBMITTED', page: 1, size: 5, sort: 'submittedAt,asc' })
  return <AdminFrame title="Tổng quan quản trị" activeTab="admin-dashboard" onNavigate={onNavigate}>
    <SectionHeading title="Trung tâm vận hành" description="Hồ sơ và chứng từ cần xử lý, cập nhật từ hệ thống." icon="dashboard" />
    <div className="grid gap-4 md:grid-cols-2">
      <section className={panelClass + ' sc-metric'}><div><h2>Tiệm chờ duyệt</h2><ApiState resource={bakeries}>{bakeries.data && <><p className="sc-metric-value">{bakeries.data.meta.total}</p><p className="text-xs text-on-surface-variant">Hồ sơ PENDING_APPROVAL</p></>}</ApiState></div><span className="sc-metric-icon"><Icon name="storefront" /></span></section>
      <section className={panelClass + ' sc-metric'}><div><h2>Thanh toán gói chờ duyệt</h2><ApiState resource={payments}>{payments.data && <><p className="sc-metric-value">{payments.data.meta.total}</p><p className="text-xs text-on-surface-variant">Chứng từ SUBMITTED</p></>}</ApiState></div><span className="sc-metric-icon"><Icon name="receipt_long" /></span></section>
    </div>
    <div className="sc-dashboard-queues grid items-start gap-5 xl:grid-cols-2">
      <section className={panelClass}><SectionHeading title="Hồ sơ tiệm bánh" action={<button className="text-xs underline" onClick={bakeries.reload}>Tải lại</button>} />
        <ApiState resource={bakeries}>{bakeries.data && (bakeries.data.result.length ? <DataTable label="Tiệm chờ duyệt"><thead><tr><th>Tiệm bánh</th><th>Trạng thái</th><th>Hồ sơ</th></tr></thead><tbody>{bakeries.data.result.map((bakery) => <tr key={bakery.id}><td><strong>{bakery.name}</strong><small>{bakery.id}</small></td><td><StatusBadge status={bakery.status} /></td><td><button className="font-semibold text-primary underline" onClick={() => onNavigate('admin-vendors')}>Xem hồ sơ</button></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Chưa có tiệm gửi duyệt." description="Hồ sơ mới sẽ xuất hiện khi Vendor gửi yêu cầu." icon="storefront" />)}</ApiState>
        <button className={buttonClass} onClick={() => onNavigate('admin-vendors')}>Xem hồ sơ tiệm <Icon name="arrow_forward" /></button>
      </section>
      <section className={panelClass}><SectionHeading title="Chứng từ mua gói" action={<button className="text-xs underline" onClick={payments.reload}>Tải lại</button>} />
        <ApiState resource={payments}>{payments.data && (payments.data.result.length ? <DataTable label="Chứng từ chờ duyệt"><thead><tr><th>Chứng từ</th><th>Giá trị</th><th>Trạng thái</th></tr></thead><tbody>{payments.data.result.map((payment) => <tr key={payment.id}><td><strong>{payment.paymentReference || payment.id}</strong><small>{payment.subscriptionOrderId}</small></td><td className="whitespace-nowrap tabular-nums">{formatSubscriptionMoney(payment.amount, payment.currency)}</td><td><StatusBadge status={payment.status} /></td></tr>)}</tbody></DataTable> : <EmptyPanel title="Chưa có chứng từ chờ duyệt." description="Chứng từ do Vendor gửi sẽ được liệt kê tại đây." icon="receipt_long" />)}</ApiState>
        <button className={buttonClass} onClick={() => onNavigate('admin-payments')}>Đối chiếu thanh toán <Icon name="arrow_forward" /></button>
      </section>
    </div>
    <section className={panelClass}><SectionHeading title="Điều kiện xuất hiện trên SweetCake" icon="task_alt" /><div className="grid gap-3 md:grid-cols-3">{[['01', 'Duyệt hồ sơ', 'Tiệm ở trạng thái ACTIVE.'], ['02', 'Xác nhận gói dịch vụ', 'Subscription còn hiệu lực.'], ['03', 'Công khai sản phẩm', 'Sản phẩm ở trạng thái PUBLISHED.']].map(([number, title, detail]) => <div key={number} className="flex gap-3 rounded-xl bg-surface-container-low p-3"><span className="font-serif text-xl text-secondary">{number}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-xs text-on-surface-variant">{detail}</p></div></div>)}</div><details className="text-xs text-on-surface-variant"><summary className="cursor-pointer">Phạm vi dữ liệu</summary><p className="mt-2">Duyệt hồ sơ tiệm và duyệt thanh toán gói là hai bước độc lập. Thống kê doanh thu/escrow chưa có API.</p></details></section>
  </AdminFrame>
}
