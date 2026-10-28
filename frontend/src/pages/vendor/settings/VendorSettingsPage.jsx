import React, { useState } from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import BakeryManager, { CreateBakery } from '../../../components/management/BakeryManager.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'

export default function VendorSettingsPage({ onNavigate, routeSearch }) {
  const { bakeryId, selectBakery } = useVendorBakery(routeSearch)
  const [created, setCreated] = useState(null)
  return <VendorFrame title="Hồ sơ tiệm bánh" activeTab="profile" bakeryId={bakeryId} onNavigate={onNavigate}><BakerySelector key={bakeryId} bakeryId={bakeryId} onSelect={selectBakery} />{bakeryId && <BakeryManager key={bakeryId} bakeryId={bakeryId} initialProfile={created} />}<details className="rounded-2xl border border-outline-variant/30 p-5"><summary className="cursor-pointer font-bold">Tạo tiệm bánh mới</summary><div className="mt-4"><CreateBakery onCreated={(bakery) => { setCreated(bakery); selectBakery(bakery.id) }} /></div></details></VendorFrame>
}
