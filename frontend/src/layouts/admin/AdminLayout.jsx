import React from 'react'

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-background font-body text-admin-body text-on-surface antialiased flex flex-col selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {children}
    </div>
  )
}
