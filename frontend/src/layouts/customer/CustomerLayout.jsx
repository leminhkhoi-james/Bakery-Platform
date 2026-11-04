import React from 'react'
import Header from './Header'
import Footer from './Footer'
import BackgroundOrnaments from '../../components/common/BackgroundOrnaments.jsx'

export default function CustomerLayout({ children, cartCount, activeTab, onNavigate }) {
  const isSubPage = activeTab !== 'home'
  return (
    <div className="sc-customer-layout min-h-screen bg-background text-on-surface flex flex-col justify-between" data-customer-page={activeTab}>
      <Header cartCount={cartCount} activeTab={activeTab} onNavigate={onNavigate} />
      <div className="h-[92px] sm:h-[100px] w-full shrink-0" aria-hidden="true" />
      <main className={'sc-customer-stage flex-1 w-full flex flex-col' + (isSubPage ? ' striped-candy-bg sc-fairy-stage' : '')}>
        <BackgroundOrnaments variant={activeTab} />
        {children}
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  )
}
