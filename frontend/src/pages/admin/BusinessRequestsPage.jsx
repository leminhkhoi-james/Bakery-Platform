import React from 'react'
import AdminFrame from '../../components/management/AdminFrame.jsx'
import BusinessSimulationReport from '../../components/management/BusinessSimulationReport.jsx'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { loadRfqs, loadOffers } from '../../services/rfqService.js'
import { ApiErrorMessage } from '../../components/management/ApiState.jsx'

export default function BusinessRequestsPage({ onNavigate }) {
  const requests = useCatalogResource(loadRfqs, { scope: 'all', size: 100 })
  const offers = useCatalogResource(loadOffers, { scope: 'all', size: 100 })
  return <AdminFrame title="Yêu cầu và báo giá" activeTab="admin-rfq" onNavigate={onNavigate}>
    {requests.error && <ApiErrorMessage error={requests.error} retry={requests.reload} />}
    {offers.error && <ApiErrorMessage error={offers.error} retry={offers.reload} />}
    <BusinessSimulationReport requestsOnly loadHistory />
  </AdminFrame>
}
