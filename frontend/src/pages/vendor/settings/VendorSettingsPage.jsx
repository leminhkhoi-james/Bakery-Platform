import { DetailDrawer, Icon, StatusBadge } from '../../../components/common/WorkspaceUI.jsx'
import React, { useState } from 'react'
import VendorFrame from '../../../components/management/VendorFrame.jsx'
import BakeryManager from '../../../components/management/BakeryManager.jsx'
import OwnerBakeryOnboarding from '../../../components/management/OwnerBakeryOnboarding.jsx'
import { useVendorBakery } from '../../../hooks/useVendorBakery.js'
import { readBranchParent } from '../../../services/ownerDraftReceipts.js'

export default function VendorSettingsPage({ onNavigate, routeSearch }) {
  const owner = useVendorBakery(routeSearch)
  const { bakeryId, selectBakery, available } = owner
  const managedBakeries = available.data || []
  const locationOptions = managedBakeries.flatMap(({ operations }) => [
    ...(operations?.addresses || []), ...(operations?.serviceAreas || []),
  ])
  const branches = bakeryId && owner.bakery ? managedBakeries.filter(bakery =>
    readBranchParent(owner.user.id, bakery.id) === bakeryId
  ) : []
  const [created, setCreated] = useState(null), [creating, setCreating] = useState(new URLSearchParams(routeSearch).get('create') === '1'), [creatingBusy, setCreatingBusy] = useState(false)
  const [draftHeader, setDraftHeader] = useState(null)
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
      <button type="button" className="sc-button sc-action-button--secondary" disabled={loadingProfile} onClick={() => { setDraftHeader(null); setCreating(true) }}>
        <Icon name="add_business" />{owner.bakery ? 'Mở thêm chi nhánh' : 'Mở thêm tiệm'}
      </button>
    </div>
    {bakeryId && <BakeryManager key={'profile:' + bakeryId} bakeryId={bakeryId} initialProfile={created} locationOptions={locationOptions} onChanged={owner.reload} />}
    {branches.length > 0 && <section className="sc-panel sc-owner-profile-section" aria-labelledby="owner-branches-title">
      <h3 id="owner-branches-title">Chi nhánh đã mở từ tiệm này</h3>
      <ul className="sc-owner-profile-rows">
        {branches.map(branch => <li className="sc-owner-operation-row flex-wrap" key={branch.id}>
          <strong>{branch.name}</strong>
          <StatusBadge status={branch.status} />
          <button type="button" className="sc-button sc-action-button--secondary" disabled={creating} onClick={() => selectBakery(branch.id)}>Xem hồ sơ</button>
        </li>)}
      </ul>
    </section>}
    {creating && <DetailDrawer className="sc-vendor-drawer sc-bakery-create-dialog" title="Tạo tiệm bánh mới" headerContent={<div>
      <div className="flex flex-wrap items-center gap-2"><h2>Tạo tiệm bánh mới</h2>{draftHeader && <StatusBadge status={draftHeader.status} />}</div>
      {draftHeader && <p className="text-xs break-all">Hồ sơ tiệm: {draftHeader.name} · Mã tiệm: {draftHeader.id}</p>}
      {owner.bakery?.name && <p className="text-xs">Chi nhánh của {owner.bakery.name}</p>}
    </div>} busy={creatingBusy} onClose={() => { setCreating(false); available.reload() }}>
      {loadingProfile ? <p role="status">Đang tải thông tin tiệm…</p> :
        <OwnerBakeryOnboarding
          drafts={managedBakeries.filter(row => row.status === 'DRAFT')}
          defaults={defaults}
          parentBakeryId={owner.bakery?.id}
          locationOptions={locationOptions}
          onDraftReady={setDraftHeader}
          onBusy={setCreatingBusy}
          onCreated={bakery => { continueWith(bakery); setCreating(false) }}
        />}
    </DetailDrawer>}
  </VendorFrame>
}
