import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import RefreshButton from '../../../components/common/RefreshButton.jsx'
import { vendorRfqError } from '../../../services/vendorRfqModels.js'
import './vendor-rfq.css'

export function VendorRfqState({ resource, children }) {
  if (resource.status === 'loading' || resource.refreshing) return <p role="status" className="sc-rfq-state">Đang tải dữ liệu…</p>
  if (resource.error) return <div role="alert" className="sc-rfq-error"><Icon name={resource.error.status === 403 ? 'lock' : 'info'} /><p>{vendorRfqError(resource.error)}</p>{resource.error.status !== 401 && <RefreshButton onClick={resource.reload}>Thử lại</RefreshButton>}</div>
  return children
}

