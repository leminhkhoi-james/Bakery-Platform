import React from 'react'
import { Icon } from './WorkspaceUI.jsx'

export default function RefreshButton({ children = 'Tải lại danh sách', className = '', ...props }) {
  return <button type="button" {...props} className={'sc-button sc-action-button--secondary sc-refresh-button ' + className}><Icon name="refresh" />{children}</button>
}
