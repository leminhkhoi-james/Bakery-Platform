import React from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadManagedProducts } from '../../../services/vendorManagementService.js'
import { loadOrders } from '../../../services/orderService.js'
import { dateTime, money } from '../../../services/managementModels.js'
import { orderStatusLabel } from '../../../services/orderModels.js'
import { ApiState, panelClass, buttonClass } from '../../../components/management/ApiState.jsx'

function DashboardData({ bakeryId, onNavigate }) {
  const products = useCatalogResource(loadManagedProducts, { bakeryId, page: 1, size: 1 })
  const orders = useCatalogResource(loadOrders, { scope: 'bakery', bakeryId, page: 1, size: 5, sort: 'createdAt,desc' })
  return <><div className="grid gap-5 md:grid-cols-3"><section className={panelClass}><h2 className="font-bold">Sản phẩm của cửa hàng</h2><ApiState resource={products}>{products.data && <p className="text-3xl font-bold">{products.data.meta.total}</p>}</ApiState><button className={buttonClass} onClick={() => onNavigate('vendor-menu?bakeryId=' + bakeryId)}>Quản lý sản phẩm</button></section><section className={panelClass}><h2 className="font-bold">Tổng số đơn hàng</h2><ApiState resource={orders}>{orders.data && <p className="text-3xl font-bold">{orders.data.meta.total}</p>}</ApiState><p className="text-sm">Tất cả trạng thái, theo quyền truy cập backend.</p></section><section className={panelClass}><h2 className="font-bold">Doanh thu và thanh toán</h2><p>Chưa có API thống kê doanh thu hoặc escrow. Không hiển thị số liệu giả.</p></section></div><section className={panelClass}><h2 className="text-xl font-bold">Đơn hàng gần đây</h2><ApiState resource={orders}>{orders.data && (orders.data.result.length ? <ul className="space-y-3">{orders.data.result.map((order) => <li key={order.id}><button className="w-full rounded-xl border border-outline-variant/30 p-4 text-left" onClick={() => onNavigate('vendor-orders?bakeryId=' + bakeryId + '&orderId=' + order.id)}><span className="block break-all font-bold">{order.orderNumber || order.id}</span>{orderStatusLabel(order.status)} · {money(order.totalAmount, order.currency)} · {dateTime(order.createdAt)}</button></li>)}</ul> : <p>Chưa có đơn hàng.</p>)}</ApiState><button className={buttonClass} onClick={() => onNavigate('vendor-orders?bakeryId=' + bakeryId)}>Xem tất cả đơn</button></section></>
}

export default function VendorDashboardPage({ onNavigate, routeSearch }) {
  const { bakeryId, selectBakery } = useVendorBakery(routeSearch)
  return <VendorFrame title="Tổng quan cửa hàng" activeTab="dashboard" bakeryId={bakeryId} onNavigate={onNavigate}><BakerySelector bakeryId={bakeryId} onSelect={selectBakery} />{bakeryId ? <DashboardData key={bakeryId} bakeryId={bakeryId} onNavigate={onNavigate} /> : <p>Chọn cửa hàng để xem tổng số sản phẩm và đơn từ backend.</p>}</VendorFrame>
}
