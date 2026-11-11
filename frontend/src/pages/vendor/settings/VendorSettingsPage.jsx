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
  const loadingProfile = available.status === 'loading' || owner.state === 'LOADING'
  const operations = owner.bakery?.operations
  const defaults = {
    name: owner.bakery?.name,
    email: owner.bakery?.email,
    phoneNumber: owner.bakery?.phoneNumber,
    operations: operations && Object.fromEntries(
      Object.entries(operations).map(([key, rows]) => [key, rows.map(({ id: _id, ...fields }) => fields)])
    ),
  }
  const continueWith = bakery => {
    setCreated(bakery)
    selectBakery(bakery.id)
    available.reload()
  }

  return <VendorFrame owner={owner} title="Hồ sơ tiệm bánh" activeTab="profile" bakeryId={bakeryId} onNavigate={onNavigate} bakerySelectionDisabled={creating}>
    <div className="sc-owner-profile-selector">
      <button type="button" className="sc-button sc-action-button--secondary" disabled={loadingProfile} onClick={() => setCreating(true)}>
        <Icon name="add_business" />Mở thêm tiệm / chi nhánh
      </button>
    </div>
    {bakeryId && <BakeryManager key={'profile:' + bakeryId} bakeryId={bakeryId} initialProfile={created} />}
    {creating && <DetailDrawer className="sc-vendor-drawer" title="Tạo tiệm bánh mới" headerContent={<h2>Tạo tiệm bánh mới</h2>} busy={creatingBusy} onClose={() => { setCreating(false); available.reload() }}>
      {loadingProfile ? <p role="status">Đang tải thông tin tiệm…</p> :
        <OwnerBakeryOnboarding
          drafts={(available.data || []).filter(row => row.status === 'DRAFT')}
          defaults={defaults}
          onBusy={setCreatingBusy}
          onCreated={bakery => { continueWith(bakery); setCreating(false) }}
        />}
    </DetailDrawer>}
  </VendorFrame>
}
