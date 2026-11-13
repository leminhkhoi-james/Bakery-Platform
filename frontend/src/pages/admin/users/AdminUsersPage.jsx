import React from 'react'
import AdminFrame from '../../../components/management/AdminFrame.jsx'
import { LocalUserDirectory } from './LocalUserDirectory.jsx'

export { RoleForm, UserDecision } from './UserEditor.jsx'

export function UserDirectory() { return <LocalUserDirectory /> }

export default function AdminUsersPage({ onNavigate }) {
  return <AdminFrame activeTab="admin-users" onNavigate={onNavigate}><UserDirectory /></AdminFrame>
}
