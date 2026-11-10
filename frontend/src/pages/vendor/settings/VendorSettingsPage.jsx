import { DetailDrawer, Icon } from '../../../components/common/WorkspaceUI.jsx'
import React, { useState } from 'react'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import BakeryManager from '../../../components/management/BakeryManager.jsx'
import OwnerBakeryOnboarding from '../../../components/management/OwnerBakeryOnboarding.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'

export default function VendorSettingsPage({ onNavigate, routeSearch }) {
  const owner = useVendorBakery(routeSearch)
  const { bakeryId, selectBakery, available } = owner
  const [created, setCreated] = useState(null), [creating, setCreating] = useState(new URLSearchParams(routeSearch).get('create') === '1'), [creatingBusy, setCreatingBusy] = useState(false)
  return <VendorFrame owner={owner} title="Hồ sơ tiệm bánh" activeTab="profile" bakeryId={bakeryId} onNavigate={onNavigate}><div className="sc-owner-profile-selector"><button className="sc-button sc-action-button--secondary" onClick={() => setCreating(true)}><Icon name="add_business" />Tạo tiệm mới</button></div>{bakeryId && <BakeryManager key={'profile:' + bakeryId} bakeryId={bakeryId} initialProfile={created} />}{creating && <DetailDrawer className="sc-vendor-drawer" title="Tạo tiệm bánh mới" busy={creatingBusy} onClose={() => setCreating(false)}><OwnerBakeryOnboarding onBusy={setCreatingBusy} onCreated={bakery => { setCreated(bakery); selectBakery(bakery.id); available.reload(); setCreating(false) }} /></DetailDrawer>}</VendorFrame>
}
