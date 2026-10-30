import { DetailDrawer, Icon } from '../../../components/common/WorkspaceUI.jsx'
import React, { useState } from 'react'
import VendorFrame, { BakerySelector } from '../../../components/management/VendorFrame.jsx'
import BakeryManager, { CreateBakery } from '../../../components/management/BakeryManager.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'

export default function VendorSettingsPage({ onNavigate, routeSearch }) {
  const { bakeryId, selectBakery } = useVendorBakery(routeSearch)
  const [created, setCreated] = useState(null), [creating, setCreating] = useState(false), [creatingBusy, setCreatingBusy] = useState(false)
  return <VendorFrame title="Hồ sơ tiệm bánh" activeTab="profile" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-owner-profile-selector"><BakerySelector key={'selector:' + bakeryId} bakeryId={bakeryId} onSelect={selectBakery} /><button className="sc-button sc-action-button--secondary" onClick={() => setCreating(true)}><Icon name="add_business" />Tạo tiệm mới</button></div>{bakeryId && <BakeryManager key={'profile:' + bakeryId} bakeryId={bakeryId} initialProfile={created} />}{creating && <DetailDrawer className="sc-vendor-drawer" title="Tạo tiệm bánh mới" busy={creatingBusy} onClose={() => setCreating(false)} footer={<><button type="button" data-modal-close disabled={creatingBusy} className="sc-button sc-action-button--secondary">Hủy</button><button form="vendor-profile-form" type="submit" disabled={creatingBusy} className="sc-button">{creatingBusy ? 'Đang tạo…' : 'Tạo tiệm'}</button></>}><CreateBakery footerExternal onBusy={setCreatingBusy} onCreated={bakery => { setCreated(bakery); selectBakery(bakery.id); setCreating(false) }} /></DetailDrawer>}</VendorFrame>
}
