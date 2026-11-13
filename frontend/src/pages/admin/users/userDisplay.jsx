import React from 'react'
import { uiLabel } from '../../../services/uiLabels.js'
import { PLATFORM_ROLES } from '../../../services/adminUserService.js'

export function maskedEmail(email) {
  const [name, domain] = String(email || '').split('@')
  return domain ? `${name.slice(0, 1)}***@${domain}` : 'Chưa có email'
}

export function UserRoles({ roles = [] }) {
  const visible = roles.filter(role => PLATFORM_ROLES.includes(role) && (role !== 'CUSTOMER' || !roles.includes('BAKERY_OWNER')))
  return <span className="sc-user-role-list">{visible.map(role => <span key={role} className={'sc-role-label sc-role-label--' + role.toLowerCase()}>{uiLabel(role, 'Chưa xác định')}</span>)}</span>
}
