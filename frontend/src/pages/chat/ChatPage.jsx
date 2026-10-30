import React from 'react'
import ChatWorkspace from '../../components/chat/ChatWorkspace.jsx'
import VendorFrame, { BakerySelector } from '../../components/management/VendorFrame.jsx'
import { useVendorBakery } from '../../hooks/useVendorBakery.js'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadDashboardAccess } from '../../services/vendorDashboardService.js'
import OwnerChatWorkspace from '../../components/chat/OwnerChatWorkspace.jsx'
import ChatFeedback from '../../components/chat/ChatFeedback.jsx'

function OwnerInbox({ bakeryId, userId, routeSearch, onNavigate }) {
  const access = useCatalogResource(loadDashboardAccess, { bakeryId, userId })
  if (access.status === 'loading') return <p role="status">Đang xác minh quyền quản lý cửa hàng…</p>
  if (access.error) return <ChatFeedback error={access.error} retry={access.reload} />
  return <OwnerChatWorkspace bakeryId={bakeryId} routeSearch={routeSearch} onNavigate={onNavigate} />
}

export function CustomerChatPage({ routeSearch, onNavigate }) {
  return <main className="sc-customer min-h-[65vh] bg-background px-4 py-8"><div className="mx-auto max-w-7xl space-y-6"><div className="sc-customer-heading"><p className="sc-kicker">Trao đổi cùng tiệm bánh</p><h1 className="font-serif text-3xl font-semibold text-primary">Tin nhắn</h1></div><ChatWorkspace key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} /></div></main>
}

export function VendorChatPage({ routeSearch = '', onNavigate }) {
  const { bakeryId, selectBakery, user, available } = useVendorBakery(routeSearch)
  return <VendorFrame title="Tin nhắn" activeTab="chat" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-owner-chat-page"><BakerySelector bakeryId={bakeryId} available={available} showError={!bakeryId} onSelect={(id) => { selectBakery(id); onNavigate('vendor-chat?bakeryId=' + id, null, { replace: true }) }} />{bakeryId ? <OwnerInbox key={user.id + ':' + bakeryId} bakeryId={bakeryId} userId={user.id} routeSearch={routeSearch} onNavigate={onNavigate} /> : <p role="status">Chọn cửa hàng bạn có quyền quản lý để xem tin nhắn.</p>}</div></VendorFrame>
}
