import React from 'react'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { panelClass } from '../../../components/management/ApiState.jsx'
import { EmptyPanel } from '../../../components/common/WorkspaceUI.jsx'

export default function VendorRevenueEscrowPage({ onNavigate, routeSearch }) {
  const { bakeryId } = useVendorBakery(routeSearch)
  return <VendorFrame title="Doanh thu" activeTab="revenue" bakeryId={bakeryId} onNavigate={onNavigate}><section className={panelClass}><EmptyPanel title="Chưa có số liệu doanh thu đã đối soát" description="Chưa thể hiển thị doanh thu đã nhận, số dư hoặc hoàn tiền." icon="account_balance_wallet" /><p>Tổng giá trị đơn hàng gồm cả những khoản chưa thanh toán. Chỉ các giao dịch đã đối soát mới được ghi nhận là doanh thu.</p><p>Thông tin doanh thu sẽ được cập nhật khi có kết quả đối soát.</p></section></VendorFrame>
}
