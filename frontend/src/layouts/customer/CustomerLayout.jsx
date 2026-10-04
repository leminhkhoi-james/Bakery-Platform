import React from 'react'
import Header from './Header'
import Footer from './Footer'

export default function CustomerLayout({ children, cartCount, activeTab, onNavigate }) {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between">
      <Header cartCount={cartCount} activeTab={activeTab} onNavigate={onNavigate} />
      <main className="flex-1 w-full flex flex-col">{children}</main>
      <Footer onNavigate={onNavigate} />
    </div>
  )
}
