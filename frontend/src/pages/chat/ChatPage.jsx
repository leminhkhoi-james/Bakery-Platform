import React from 'react'
import ChatWorkspace from '../../components/chat/ChatWorkspace.jsx'
import VendorFrame, { BakerySelector } from '../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../hooks/useVendorBakery.js'

export function CustomerChatPage({ routeSearch, onNavigate }) {
  return <main className="striped-candy-bg min-h-[65vh] px-4 py-8"><div className="mx-auto max-w-7xl space-y-6"><h1 className="text-3xl font-bold text-primary">Tin nhắn</h1><ChatWorkspace key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} /></div></main>
}

export function VendorChatPage({ routeSearch = '', onNavigate }) {
  const { bakeryId, selectBakery } = useVendorBakery(routeSearch)
  return <VendorFrame title="Tin nhắn của cửa hàng" activeTab="chat" bakeryId={bakeryId} onNavigate={onNavigate}><BakerySelector bakeryId={bakeryId} onSelect={(id) => { selectBakery(id); onNavigate('vendor-chat?bakeryId=' + id) }} /><p className="text-sm">{bakeryId ? 'Backend xác minh membership khi lọc theo cửa hàng.' : 'Đang xem các hội thoại bạn đã tham gia. Chọn bakeryId để truy cập hộp thư của cửa hàng theo membership.'}</p><ChatWorkspace key={bakeryId + ':' + routeSearch} bakeryId={bakeryId} routeSearch={routeSearch} baseRoute="vendor-chat" onNavigate={onNavigate} /></VendorFrame>
}
