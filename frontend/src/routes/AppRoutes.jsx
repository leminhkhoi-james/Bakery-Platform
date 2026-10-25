import React from 'react'
import { CustomerLayout, VendorLayout, AdminLayout } from '../layouts'

// Customer Pages (Modular Feature Subfolders)
import HomePage from '../pages/customer/home/HomePage'
import ExploreCakesPage from '../pages/customer/catalog/ExploreCakesPage'
import ProductDetailPage from '../pages/customer/catalog/ProductDetailPage'
import AiCakeStudioPage from '../pages/customer/ai-studio/AiCakeStudioPage'
import BiddingComparisonPage from '../pages/customer/bidding/BiddingComparisonPage'
import BakerQuoteDetailPage from '../pages/customer/bidding/BakerQuoteDetailPage'
import CartCheckoutPage from '../pages/customer/checkout/CartCheckoutPage'
import PaymentGatewayPage from '../pages/customer/checkout/PaymentGatewayPage'
import OrderTrackingPage from '../pages/customer/tracking/OrderTrackingPage'
import CustomerProfilePage from '../pages/customer/profile/CustomerProfilePage'
import StoreDirectoryPage from '../pages/customer/stores/StoreDirectoryPage'

// Auth Page
import AuthPage from '../pages/auth/AuthPage'

// Vendor Pages (Modular Feature Subfolders)
import VendorDashboardPage from '../pages/vendor/dashboard/VendorDashboardPage'
import VendorMenuCatalogPage from '../pages/vendor/catalog/VendorMenuCatalogPage'
import VendorRfqMarketplacePage from '../pages/vendor/rfq/VendorRfqMarketplacePage'
import VendorBespokeQuoteSubmitPage from '../pages/vendor/rfq/VendorBespokeQuoteSubmitPage'
import VendorOrderManagementPage from '../pages/vendor/orders/VendorOrderManagementPage'
import VendorRevenueEscrowPage from '../pages/vendor/revenue/VendorRevenueEscrowPage'
import VendorSettingsPage from '../pages/vendor/settings/VendorSettingsPage'

// Admin Pages (Modular Feature Subfolders)
import AdminDashboardPage from '../pages/admin/dashboard/AdminDashboardPage'
import AdminUsersPage from '../pages/admin/users/AdminUsersPage'
import AdminVendorsPage from '../pages/admin/vendors/AdminVendorsPage'
import AdminOrdersEscrowPage from '../pages/admin/orders/AdminOrdersEscrowPage'

export default function AppRoutes({
  currentPage,
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
    currentPage === 'admin-users'

  const isVendorPortal =
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
          <AdminOrdersEscrowPage onNavigate={onNavigate} />
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
        {currentPage === 'vendor-orders' ? (
          <VendorOrderManagementPage onNavigate={onNavigate} />
        ) : currentPage === 'vendor-quote-submit' ? (
          <VendorBespokeQuoteSubmitPage onNavigate={onNavigate} rfqData={selectedCake} />
        ) : currentPage === 'vendor-rfq' ? (
          <VendorRfqMarketplacePage onNavigate={onNavigate} />
        ) : currentPage === 'vendor-menu' ? (
          <VendorMenuCatalogPage onNavigate={onNavigate} />
        ) : currentPage === 'vendor-revenue' ? (
          <VendorRevenueEscrowPage onNavigate={onNavigate} />
        ) : currentPage === 'vendor-profile' || currentPage === 'vendor-settings' ? (
          <VendorSettingsPage onNavigate={onNavigate} />
        ) : (
          <VendorDashboardPage onNavigate={onNavigate} />
        )}
      </VendorLayout>
    )
  }

  // 3. Phân Hệ Khách Hàng (kèm Auth)
  return (
    <CustomerLayout cartCount={cartCount} activeTab={currentPage} onNavigate={onNavigate}>
      {currentPage === 'profile' ? (
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
        <OrderTrackingPage onNavigate={onNavigate} />
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
          onAddToCart={onAddToCart}
          onNavigate={onNavigate}
        />
      ) : currentPage === 'ai-studio' ? (
        <AiCakeStudioPage
          onAddToCart={onAddToCart}
          onNavigate={onNavigate}
          onSetCustomCake={setActiveCustomCake}
        />
      ) : currentPage === 'bidding' ? (
        <BiddingComparisonPage onAddToCart={onAddToCart} onNavigate={onNavigate} />
      ) : currentPage === 'baker-quote' ? (
        <BakerQuoteDetailPage onAddToCart={onAddToCart} onNavigate={onNavigate} />
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
        <ExploreCakesPage onAddToCart={onAddToCart} onNavigate={onNavigate} />
      ) : (
        <HomePage onAddToCart={onAddToCart} onNavigate={onNavigate} />
      )}
    </CustomerLayout>
  )
}
