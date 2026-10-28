import React from 'react'
import ChatWorkspace from '../../components/chat/ChatWorkspace.jsx'
import VendorFrame, { BakerySelector } from '../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../hooks/useVendorBakery.js'

export function CustomerChatPage({ routeSearch, onNavigate }) {
  return <main className="sc-customer min-h-[65vh] bg-background px-4 py-8"><div className="mx-auto max-w-7xl space-y-6"><div className="sc-customer-heading"><p className="sc-kicker">Trao đổi cùng tiệm bánh</p><h1 className="font-serif text-3xl font-semibold text-primary">Tin nhắn</h1></div><ChatWorkspace key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} /></div></main>
}

export function VendorChatPage({ routeSearch = '', onNavigate }) {
  const { bakeryId, selectBakery } = useVendorBakery(routeSearch)
  return <VendorFrame title="Tin nhắn của cửa hàng" activeTab="chat" bakeryId={bakeryId} onNavigate={onNavigate}><BakerySelector bakeryId={bakeryId} onSelect={(id) => { selectBakery(id); onNavigate('vendor-chat?bakeryId=' + id) }} /><p className="text-sm">{bakeryId ? 'Backend xác minh membership khi lọc theo cửa hàng.' : 'Đang xem các hội thoại bạn đã tham gia. Chọn bakeryId để truy cập hộp thư của cửa hàng theo membership.'}</p><ChatWorkspace key={bakeryId + ':' + routeSearch} bakeryId={bakeryId} routeSearch={routeSearch} baseRoute="vendor-chat" onNavigate={onNavigate} /></VendorFrame>
}
