import React from 'react'
import { Icon } from './WorkspaceUI.jsx'
import { useManualRefresh } from '../../context/ManualRefreshContext.js'

export default function RefreshButton({ children = 'Tải lại danh sách', className = '', ...props }) {
  const enabled = useManualRefresh()
  if (!enabled) return null
  return <button type="button" {...props} className={'sc-button sc-action-button--secondary sc-refresh-button ' + className}><Icon name="refresh" /><span>{children}</span></button>
}
