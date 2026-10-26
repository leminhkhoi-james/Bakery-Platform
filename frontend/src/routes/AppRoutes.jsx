import React, { lazy, Suspense } from 'react'
import AuthGuard from './AuthGuard.jsx'
import { CustomerLayout, VendorLayout, AdminLayout } from '../layouts'

// Customer Pages (Modular Feature Subfolders)
const HomePage = lazy(() => import('../pages/customer/home/HomePage'))
const ExploreCakesPage = lazy(() => import('../pages/customer/catalog/ExploreCakesPage'))
const ProductDetailPage = lazy(() => import('../pages/customer/catalog/ProductDetailPage'))
const AiCakeStudioPage = lazy(() => import('../pages/customer/ai-studio/AiCakeStudioPage'))
const BiddingComparisonPage = lazy(() => import('../pages/customer/bidding/BiddingComparisonPage'))
const BakerQuoteDetailPage = lazy(() => import('../pages/customer/bidding/BakerQuoteDetailPage'))
const CustomerRequests = lazy(() => import('../components/marketplace/MarketplaceViews.jsx').then((module) => ({ default: module.CustomerRequests })))
const CustomerRequestDetail = lazy(() => import('../components/marketplace/MarketplaceViews.jsx').then((module) => ({ default: module.CustomerRequestDetail })))
const CartCheckoutPage = lazy(() => import('../pages/customer/checkout/CartCheckoutPage'))
const PaymentGatewayPage = lazy(() => import('../pages/customer/checkout/PaymentGatewayPage'))
const OrderTrackingPage = lazy(() => import('../pages/customer/tracking/OrderTrackingPage'))
const CustomerProfilePage = lazy(() => import('../pages/customer/profile/CustomerProfilePage'))
const StoreDirectoryPage = lazy(() => import('../pages/customer/stores/StoreDirectoryPage'))
const BakeryDetailPage = lazy(() => import('../pages/customer/stores/BakeryDetailPage.jsx'))
const SubscriptionPlansPage = lazy(() => import('../pages/customer/subscription/SubscriptionPlansPage.jsx'))
const VendorSubscriptionPage = lazy(() => import('../pages/vendor/subscription/VendorSubscriptionPage.jsx'))
const CustomerChatPage = lazy(() => import('../pages/chat/ChatPage.jsx').then((module) => ({ default: module.CustomerChatPage })))
const VendorChatPage = lazy(() => import('../pages/chat/ChatPage.jsx').then((module) => ({ default: module.VendorChatPage })))

// Auth Page
const AuthPage = lazy(() => import('../pages/auth/AuthPage'))

// Vendor Pages (Modular Feature Subfolders)
const VendorDashboardPage = lazy(() => import('../pages/vendor/dashboard/VendorDashboardPage'))
const VendorMenuCatalogPage = lazy(() => import('../pages/vendor/catalog/VendorMenuCatalogPage'))
const VendorRfqMarketplacePage = lazy(() => import('../pages/vendor/rfq/VendorRfqMarketplacePage'))
const VendorBespokeQuoteSubmitPage = lazy(() => import('../pages/vendor/rfq/VendorBespokeQuoteSubmitPage'))
const VendorOrderManagementPage = lazy(() => import('../pages/vendor/orders/VendorOrderManagementPage'))
const VendorRevenueEscrowPage = lazy(() => import('../pages/vendor/revenue/VendorRevenueEscrowPage'))
const VendorSettingsPage = lazy(() => import('../pages/vendor/settings/VendorSettingsPage'))

// Admin Pages (Modular Feature Subfolders)
const AdminDashboardPage = lazy(() => import('../pages/admin/dashboard/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('../pages/admin/users/AdminUsersPage'))
const AdminVendorsPage = lazy(() => import('../pages/admin/vendors/AdminVendorsPage'))
const AdminPaymentsPage = lazy(() => import('../pages/admin/vendors/AdminPaymentsPage.jsx'))
const AdminPlansPage = lazy(() => import('../pages/admin/vendors/AdminPlansPage.jsx'))
const AdminModerationPage = lazy(() => import('../pages/admin/vendors/AdminModerationPage.jsx'))
const AdminOrdersEscrowPage = lazy(() => import('../pages/admin/orders/AdminOrdersEscrowPage'))

class RouteBoundary extends React.Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <section role="alert" className="p-8 text-center"><p>Không thể tải màn hình. Vui lòng tải lại trang.</p><button className="mt-3 underline" onClick={() => window.location.reload()}>Tải lại trang</button></section> : this.props.children
  }
}
export default function AppRoutes(props) {
  return (
    <AuthGuard page={props.currentPage} onNavigate={props.onNavigate}>
      <RouteBoundary key={props.currentPage}><Suspense fallback={<p role="status" className="p-8 text-center text-primary">Đang tải màn hình…</p>}><PageRoutes {...props} /></Suspense></RouteBoundary>
    </AuthGuard>
  )
}

function PageRoutes({
  currentPage,
  routeSearch,
  onNavigate,
  selectedCake,
  activeCustomCake,
  setActiveCustomCake,
  cartItems,
  cartCount,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  showToast,
}) {
  const isAdminPortal =
    currentPage === 'admin-dashboard' ||
    currentPage === 'admin-orders' ||
    currentPage === 'admin-vendors' ||
    currentPage === 'admin-payments' ||
    currentPage === 'admin-plans' ||
    currentPage === 'admin-moderation' ||
    currentPage === 'admin-users'

  const isVendorPortal =
    currentPage === 'vendor-chat' ||
    currentPage === 'vendor-subscription' ||
    currentPage === 'vendor-dashboard' ||
    currentPage === 'vendor-orders' ||
    currentPage === 'vendor-quote-submit' ||
    currentPage === 'vendor-rfq' ||
    currentPage === 'vendor-menu' ||
    currentPage === 'vendor-revenue' ||
    currentPage === 'vendor-profile' ||
    currentPage === 'vendor-settings'

  // 1. Phân Hệ Admin
  if (isAdminPortal) {
    return (
      <AdminLayout activeTab={currentPage} onNavigate={onNavigate}>
        {currentPage === 'admin-orders' ? (
          <AdminOrdersEscrowPage routeSearch={routeSearch} onNavigate={onNavigate} />
        ) : currentPage === 'admin-plans' ? (
          <AdminPlansPage onNavigate={onNavigate} />
        ) : currentPage === 'admin-moderation' ? (
          <AdminModerationPage onNavigate={onNavigate} />
        ) : currentPage === 'admin-payments' ? (
          <AdminPaymentsPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
        ) : currentPage === 'admin-vendors' ? (
          <AdminVendorsPage onNavigate={onNavigate} />
        ) : currentPage === 'admin-users' ? (
          <AdminUsersPage onNavigate={onNavigate} />
        ) : (
          <AdminDashboardPage onNavigate={onNavigate} />
        )}
      </AdminLayout>
    )
  }

  // 2. Phân Hệ Vendor
  if (isVendorPortal) {
    return (
      <VendorLayout activeTab={currentPage} onNavigate={onNavigate}>
        {currentPage === 'vendor-chat' ? (
          <VendorChatPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
        ) : currentPage === 'vendor-subscription' ? (
          <VendorSubscriptionPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
        ) : currentPage === 'vendor-orders' ? (
          <VendorOrderManagementPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
        ) : currentPage === 'vendor-quote-submit' ? (
          <VendorBespokeQuoteSubmitPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
        ) : currentPage === 'vendor-rfq' ? (
          <VendorRfqMarketplacePage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
        ) : currentPage === 'vendor-menu' ? (
          <VendorMenuCatalogPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
        ) : currentPage === 'vendor-revenue' ? (
          <VendorRevenueEscrowPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
        ) : currentPage === 'vendor-profile' || currentPage === 'vendor-settings' ? (
          <VendorSettingsPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
        ) : (
          <VendorDashboardPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
        )}
      </VendorLayout>
    )
  }

  // 3. Phân Hệ Khách Hàng (kèm Auth)
  return (
    <CustomerLayout cartCount={cartCount} activeTab={currentPage} onNavigate={onNavigate}>
      {currentPage === 'rfqs' || currentPage === 'rfq-new' ? (
        <CustomerRequests key={currentPage} create={currentPage === 'rfq-new'} onNavigate={onNavigate} />
      ) : currentPage === 'request-detail' ? (
        <CustomerRequestDetail key={routeSearch} id={new URLSearchParams(routeSearch).get('id')} onNavigate={onNavigate} />
      ) : currentPage === 'chat' ? (
        <CustomerChatPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
      ) : currentPage === 'subscription-plans' ? (
        <SubscriptionPlansPage onNavigate={onNavigate} />
      ) : currentPage === 'profile' ? (
        <CustomerProfilePage onAddToCart={onAddToCart} onNavigate={onNavigate} />
      ) : currentPage === 'login' ? (
        <AuthPage
          onNavigate={onNavigate}
          onLoginSuccess={(msg) => {
            showToast(msg)
            onNavigate('profile')
          }}
        />
      ) : currentPage === 'tracking' ? (
        <OrderTrackingPage routeSearch={routeSearch} onNavigate={onNavigate} />
      ) : currentPage === 'payment' ? (
        <PaymentGatewayPage onNavigate={onNavigate} />
      ) : currentPage === 'cart' ? (
        <CartCheckoutPage
          cartItems={cartItems}
          cartCount={cartCount}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onClearCart={onClearCart}
          onAddToCart={onAddToCart}
          onNavigate={onNavigate}
        />
      ) : currentPage === 'product-detail' ? (
        <ProductDetailPage
          cake={selectedCake}
          routeSearch={routeSearch}
          onAddToCart={onAddToCart}
          onNavigate={onNavigate}
        />
      ) : currentPage === 'ai-studio' ? (
        <AiCakeStudioPage
          key={routeSearch}
          routeSearch={routeSearch}
          onNavigate={onNavigate}
        />
      ) : currentPage === 'bidding' ? (
        <BiddingComparisonPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
      ) : currentPage === 'baker-quote' ? (
        <BakerQuoteDetailPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
      ) : currentPage === 'bakery-detail' ? (
        <BakeryDetailPage key={routeSearch} routeSearch={routeSearch} onNavigate={onNavigate} />
      ) : currentPage === 'stores' ? (
        <StoreDirectoryPage
          customCake={activeCustomCake}
          onClearCustomCake={() => {
            setActiveCustomCake(null)
            try {
              localStorage.removeItem('sweetcake_current_custom_cake')
            } catch {}
          }}
          onAddToCart={onAddToCart}
          onNavigate={onNavigate}
        />
      ) : currentPage === 'explore' ? (
        <ExploreCakesPage key={routeSearch} routeSearch={routeSearch} onAddToCart={onAddToCart} onNavigate={onNavigate} />
      ) : (
        <HomePage onAddToCart={onAddToCart} onNavigate={onNavigate} />
      )}
    </CustomerLayout>
  )
}
