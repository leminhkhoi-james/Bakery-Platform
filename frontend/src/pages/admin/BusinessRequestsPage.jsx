import React, { useState } from 'react'
import AdminBakeryScope from '../../components/management/AdminBakeryScope.jsx'
import AdminFrame from '../../components/management/AdminFrame.jsx'
import BusinessSimulationReport from '../../components/management/BusinessSimulationReport.jsx'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadRfqs, loadOffers } from '../../services/rfqService.js'
import { ApiErrorMessage } from '../../components/management/ApiState.jsx'
import '../vendor/orders/vendor-orders.css'

export default function BusinessRequestsPage({ onNavigate }) {
  const [bakeryId, setBakeryId] = useState('')
  const requests = useCatalogResource(loadRfqs, { scope: 'all', size: 100 })
  const offers = useCatalogResource(loadOffers, { scope: 'all', size: 100 })
  return <AdminFrame title="Yêu cầu và báo giá" activeTab="admin-rfq" onNavigate={onNavigate}
    headerDescription={<AdminBakeryScope value={bakeryId} onChange={setBakeryId} />}>
    {requests.error && <ApiErrorMessage error={requests.error} retry={requests.reload} />}
    {offers.error && <ApiErrorMessage error={offers.error} retry={offers.reload} />}
    <BusinessSimulationReport requestsOnly loadHistory reportBakeryId={bakeryId} />
  </AdminFrame>
}
