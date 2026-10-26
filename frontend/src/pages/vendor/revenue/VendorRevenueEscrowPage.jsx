import React from 'react'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { panelClass } from '../../../components/management/ApiState.jsx'

export default function VendorRevenueEscrowPage({ onNavigate, routeSearch }) {
  const { bakeryId } = useVendorBakery(routeSearch)
  return <VendorFrame title="Doanh thu" activeTab="revenue" bakeryId={bakeryId} onNavigate={onNavigate}><section className={panelClass}><h2 className="text-xl font-bold">Chưa có API thống kê doanh thu</h2><p>Order Service lưu tổng tiền đơn hàng nhưng không theo dõi thanh toán bánh, escrow, số dư hay hoàn tiền. Không thể coi tổng tiền đơn là doanh thu đã nhận.</p><p>Các chỉ số và biểu đồ demo đã được gỡ khỏi màn hình này.</p></section></VendorFrame>
}
