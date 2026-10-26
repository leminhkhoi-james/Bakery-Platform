import React from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { ApiState, panelClass, buttonClass } from '../../../components/management/ApiState.jsx'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadAdminBakeries, loadAdminPayments } from '../../../services/publicationAdminService.js'

export default function AdminDashboardPage({ onNavigate }) {
  const bakeries = useCatalogResource(loadAdminBakeries, { status: 'PENDING_APPROVAL', page: 1, size: 5, sort: 'createdAt,asc' })
  const payments = useCatalogResource(loadAdminPayments, { status: 'SUBMITTED', page: 1, size: 5, sort: 'submittedAt,asc' })
  return <AdminFrame title="Tổng quan quản trị" activeTab="admin-dashboard" onNavigate={onNavigate}>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className={panelClass}><h2 className="text-xl font-bold text-primary">Tiệm chờ duyệt</h2><ApiState resource={bakeries}>{bakeries.data && <><p>Tổng từ backend: {bakeries.data.meta.total}</p>{bakeries.data.result.length ? bakeries.data.result.map((bakery) => <p key={bakery.id}>{bakery.name} · {bakery.status}</p>) : <p>Chưa có tiệm gửi duyệt.</p>}</>}</ApiState><button className={buttonClass} onClick={() => onNavigate('admin-vendors')}>Xem hồ sơ tiệm</button><button className="ml-3 underline" onClick={bakeries.reload}>Tải lại</button></section>
      <section className={panelClass}><h2 className="text-xl font-bold text-primary">Thanh toán gói chờ duyệt</h2><ApiState resource={payments}>{payments.data && <p>Tổng chứng từ SUBMITTED từ backend: {payments.data.meta.total}</p>}</ApiState><button className={buttonClass} onClick={() => onNavigate('admin-payments')}>Đối chiếu thanh toán</button><button className="ml-3 underline" onClick={payments.reload}>Tải lại</button></section>
    </div><section className={panelClass}><h2 className="font-bold">Điều kiện xuất hiện trên SweetCake</h2><p>Tiệm cần ACTIVE và Subscription đang hiệu lực. Sản phẩm cần PUBLISHED, thuộc tiệm ACTIVE và còn Subscription. Duyệt hồ sơ tiệm và duyệt thanh toán gói là hai bước độc lập.</p><p>Thống kê doanh thu/escrow không có API trong luồng này; không hiển thị số liệu demo.</p></section>
  </AdminFrame>
}
