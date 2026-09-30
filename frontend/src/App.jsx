import { useState, useEffect } from 'react'
import AppRoutes from './routes/AppRoutes'

function App() {
  const [cartItems, setCartItems] = useState([
    {
      id: 'pikachu-3d-2tier',
      title: 'Bánh Sinh Nhật Pikachu Tạo Hình 3D (2 Tầng)',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ',
      sizeSpec: '2 Tầng (20cm + 14cm) • 12 - 18 phần',
      flavor: 'Chiffon Vani Dâu Tây Hữu Cơ (ít ngọt 30%) + Kem whipping Pháp',
      bakery: 'La Crème Pâtisserie (Chef Jean-Luc)',
      price: 950000,
      quantity: 1,
    },
    {
      id: 'macarons-box-6',
      title: 'Hộp 6 Macarons Pháp Cao Cấp',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDQc3-sChlCzc2ggdfbTb-K34Fx0N8Nq1Yad9S6mpY8e2_TsT5AqG3bBjGsCzzyIIvH4XoZp8JZLjW3hFSfeyKQJvyNh_43DUUvnarGr-1Ly7npVePgmKU44Z9PPmTbqrwTMnEFmLOOdVBiHg6NpGMo0lWxwRxdNJGR0ezBbmYJr1X0nt56OD-NSwugzRwdOCR_XQkve6QCkxESWoZj4zPuKtJBro0jrLdJBbQ_JtGokzv53HveVvZj',
      sizeSpec: '6 vị thượng hạng Pháp',
      flavor: 'Pistachio, Raspberry, Dark Chocolate',
      bakery: 'La Crème Pâtisserie',
      price: 210000,
      quantity: 1,
    },
  ])

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const ROUTE_ALIASES = {
    // AI Studio & Custom Cake
    'custom-cake': 'ai-studio',
    'custom-quote': 'ai-studio',
    'yeu-cau-lam-banh': 'ai-studio',
    'thiet-ke-banh': 'ai-studio',
    'yeu-cau-cua-toi': 'ai-studio',
    'custom-atelier': 'ai-studio',

    // Bidding / RFQ
    'san-bao-gia-custom': 'bidding',
    'san-dau-thau': 'bidding',
    'rfq-detail': 'bidding',
    'rfq': 'bidding',
    'chi-tiet-yeu-cau': 'bidding',
    'bao-gia': 'bidding',

    // Home
    'trang-chu': 'home',
    'index': 'home',

    // Explore Cakes
    'menu': 'explore',
    'kham-pha': 'explore',
    'kham-pha-mau-banh': 'explore',
    'san-pham': 'explore',
    'tat-ca-banh': 'explore',

    // Store Directory
    'danh-sach-cua-hang': 'stores',
    'cua-hang': 'stores',
    'tiem-banh': 'stores',
    'tiem-banh-doi-tac': 'stores',

    // Cart & Checkout
    'checkout': 'cart',
    'gio-hang': 'cart',

    // Payment Gateway
    'thanh-toan': 'payment',
    'checkout-payment': 'payment',
    'cong-thanh-toan': 'payment',

    // Order Tracking
    'order-tracking': 'tracking',
    'theo-doi-don-hang': 'tracking',
    'don-hang': 'tracking',

    // Profile & Account
    'account': 'profile',
    'tai-khoan': 'profile',
    'customer-profile': 'profile',

    // Auth
    'register': 'login',
    'auth': 'login',
    'dang-nhap': 'login',

    // Baker Quote Detail
    'sweet-bakery-quote': 'baker-quote',
    'chi-tiet-bao-gia': 'baker-quote',
    'quote-detail': 'baker-quote',

    // Vendor Portal
    'vendor': 'vendor-dashboard',
    'baker-hub': 'vendor-dashboard',
    'kenh-nguoi-ban': 'vendor-dashboard',
    'quan-ly-don-hang': 'vendor-orders',
    'quan-tri-don-hang': 'vendor-orders',
    'soan-bao-gia': 'vendor-quote-submit',
    'soan-bao-gia-chi-tiet': 'vendor-quote-submit',
    'bao-gia-chi-tiet': 'vendor-quote-submit',
    'baker-quote-submit': 'vendor-quote-submit',
    'vendor-baker-quote': 'vendor-quote-submit',
    'rfq-marketplace': 'vendor-rfq',
    'yeu-cau-bao-gia': 'vendor-rfq',
    'menu-catalog': 'vendor-menu',
    'thuc-don-va-mau-banh': 'vendor-menu',
    'doanh-thu-va-escrow': 'vendor-revenue',
    'vendor-settings': 'vendor-profile',
    'vendor-profile': 'vendor-profile',
    'cai-dat-xuong-banh': 'vendor-profile',
    'thiet-lap-xuong': 'vendor-profile',
    'ho-so-tiem': 'vendor-profile',
    'ho-so-tiem-banh': 'vendor-profile',

    // Admin Portal
    'admin': 'admin-dashboard',
    'master-admin': 'admin-dashboard',
    'tong-quan-admin-dashboard': 'admin-dashboard',
    'tong-quan-he-thong': 'admin-dashboard',
    'don-hang-and-escrow-vault': 'admin-orders',
    'quan-tri-don-hang-escrow-vault': 'admin-orders',
    'escrow-vault': 'admin-orders',
    'tiem-banh-and-duyet-xuong': 'admin-vendors',
    'quan-tri-tiem-banh-vendors': 'admin-vendors',
    'vendors-vetting': 'admin-vendors',
    'quan-tri-nguoi-dung': 'admin-users',
    'quan-tri-nguoi-dung-users': 'admin-users',
    'users': 'admin-users',
  }

  const resolveRouteFromUrl = () => {
    if (typeof window === 'undefined') return 'home'
    const rawHash = (window.location.hash || '').replace('#', '').trim()
    if (rawHash) {
      const cleaned = rawHash.replace(/^\/+|\/+$/g, '')
      const canonical = ROUTE_ALIASES[cleaned] || cleaned || 'home'
      const cleanUrl = canonical === 'home' ? '/' : `/${canonical}`
      window.history.replaceState({ page: canonical }, '', cleanUrl)
      return canonical
    }
    const rawPath = (window.location.pathname || '').replace(/^\/+|\/+$/g, '').trim()
    if (!rawPath) return 'home'
    return ROUTE_ALIASES[rawPath] || rawPath
  }

  const [currentPage, setCurrentPage] = useState(() => resolveRouteFromUrl())
  const [selectedCake, setSelectedCake] = useState(null)
  const [activeCustomCake, setActiveCustomCake] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    if (window.location.hash) {
      const cleanRoute = resolveRouteFromUrl()
      setCurrentPage(cleanRoute)
    }

    const handlePopState = (e) => {
      const page = (e.state && e.state.page) || resolveRouteFromUrl()
      setCurrentPage(page || 'home')
    }
    window.addEventListener('popstate', handlePopState)

    const handleDocumentClick = (e) => {
      const anchor = e.target.closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href) return

      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      ) {
        return
      }

      if (href.startsWith('#') || href.startsWith('/')) {
        e.preventDefault()
        let target = href.replace(/^#\/?/, '').replace(/^\//, '').trim()
        if (!target) target = 'home'
        handleNavigate(target)
      }
    }
    document.addEventListener('click', handleDocumentClick)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [])

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  const handleAddToCart = (cake) => {
    const qtyToAdd = cake.quantity || 1
    const targetSize =
      cake.selectedSize ||
      cake.sizeSpec ||
      (cake.size ? `Size ${cake.size}cm` : 'Size tiêu chuẩn')
    const targetId = cake.id
      ? `${cake.id}-${targetSize.replace(/[^a-zA-Z0-9]/g, '_')}`
      : `item-${Date.now()}`

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.title === cake.title &&
          (item.sizeSpec === targetSize ||
            (cake.selectedSize && item.sizeSpec.includes(cake.selectedSize)))
      )
      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qtyToAdd,
        }
        return updated
      } else {
        const newItem = {
          id: targetId,
          title: cake.title || 'Bánh Ngọt Nghệ Thuật',
          image:
            cake.image ||
            (cake.photos && cake.photos[0]) ||
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ',
          sizeSpec: targetSize,
          flavor: cake.flavor || cake.selectedFlavor || cake.flavorDescription || '',
          bakery: cake.bakery || cake.vendor || cake.chef || 'La Crème Pâtisserie',
          price: cake.price || 450000,
          quantity: qtyToAdd,
        }
        return [newItem, ...prev]
      }
    })

    const sizeText = cake.selectedSize
      ? ` (${cake.selectedSize})`
      : cake.sizeSpec
        ? ` (${cake.sizeSpec.split('•')[0].trim()})`
        : ''
    showToast(`Đã thêm "${cake.title}${sizeText}" vào giỏ hàng!`)
  }

  const handleUpdateCartQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta
            return nextQty > 0 ? { ...item, quantity: nextQty } : null
          }
          return item
        })
        .filter(Boolean)
    )
  }

  const handleRemoveFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
    showToast('Đã xóa bánh khỏi giỏ hàng!')
  }

  const handleClearCart = () => {
    setCartItems([])
    showToast('Đã làm trống giỏ hàng!')
  }

  const handleNavigate = (path, cakeData = null) => {
    if (cakeData) {
      setSelectedCake(cakeData)
    }
    const cleaned = (path || '').replace('#', '').trim()
    const resolvedPath = ROUTE_ALIASES[cleaned] || cleaned || 'home'
    setCurrentPage(resolvedPath)

    if (typeof window !== 'undefined') {
      const targetUrl = resolvedPath === 'home' ? '/' : `/${resolvedPath}`
      if (window.location.pathname !== targetUrl || window.location.hash) {
        window.history.pushState({ page: resolvedPath }, '', targetUrl)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-secondary text-xl">
            check_circle
          </span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* App Routes Router */}
      <AppRoutes
        currentPage={currentPage}
        onNavigate={handleNavigate}
        selectedCake={selectedCake}
        activeCustomCake={activeCustomCake}
        setActiveCustomCake={setActiveCustomCake}
        cartItems={cartItems}
        cartCount={cartCount}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        showToast={showToast}
      />
    </>
  )
}

export default App
