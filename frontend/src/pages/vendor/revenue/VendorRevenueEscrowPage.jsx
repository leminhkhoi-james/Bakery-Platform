import React from 'react'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { panelClass } from '../../../components/management/ApiState.jsx'
import { EmptyPanel } from '../../../components/common/WorkspaceUI.jsx'

export default function VendorRevenueEscrowPage({ onNavigate, routeSearch }) {
  const { bakeryId } = useVendorBakery(routeSearch)
  return <VendorFrame title="Doanh thu" activeTab="revenue" bakeryId={bakeryId} onNavigate={onNavigate}><section className={panelClass}><EmptyPanel title="Chưa có API thống kê doanh thu" description="Chưa thể hiển thị doanh thu đã nhận, số dư hoặc hoàn tiền." icon="account_balance_wallet" /><p>Order Service lưu tổng tiền đơn hàng nhưng không theo dõi thanh toán bánh, escrow, số dư hay hoàn tiền. Không thể coi tổng tiền đơn là doanh thu đã nhận.</p><p>Các chỉ số và biểu đồ demo đã được gỡ khỏi màn hình này.</p></section></VendorFrame>
}
