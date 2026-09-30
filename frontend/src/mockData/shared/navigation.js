/**
 * SweetCake Shared Navigation & Layouts Mock Data
 */

export const CUSTOMER_NAV_LINKS = [
  {
    id: 'home',
    label: 'Trang chủ',
    route: 'home',
    href: '/',
  },
  {
    id: 'explore',
    label: 'Khám phá mẫu bánh',
    route: 'explore',
    href: '/explore',
    activeAliases: ['explore', 'menu', 'product-detail', 'product'],
  },
  {
    id: 'ai-studio',
    label: 'Thiết kế bánh',
    route: 'ai-studio',
    href: '/ai-studio',
    icon: 'auto_awesome',
  },
  {
    id: 'stores',
    label: 'Tiệm bánh đối tác',
    route: 'stores',
    href: '/stores',
  },
  {
    id: 'bidding',
    label: 'Sàn so sánh giá',
    route: 'bidding',
    href: '/bidding',
  },
];

export const FOOTER_DATA = {
  categories: [
    { label: 'Bánh kem sinh nhật', route: 'explore' },
    { label: 'Bánh cưới nghệ thuật', route: 'explore' },
    { label: 'Mousse & Tiramisu', route: 'explore' },
    { label: 'Cupcakes & Macarons', route: 'explore' },
    { label: 'Bánh nướng Viennoiserie', route: 'explore' },
  ],
  supportLinks: [
    {
      label: 'Đăng nhập / Đăng ký tài khoản',
      route: 'login',
      icon: 'login',
      isHighlight: true,
    },
    { label: 'Chính sách giao hàng & Theo dõi đơn', route: 'tracking' },
    { label: 'Đặt tiệc & Đấu thầu bánh lớn', route: 'ai-studio' },
    { label: 'Kênh hợp tác xưởng bánh (Partner Hub)', route: 'vendor-dashboard' },
    { label: 'Hồ sơ tài khoản & Điểm thưởng', route: 'profile' },
  ],
  partnerBakeries: [
    { label: 'La Crème Pâtisserie (Q.1)', route: 'explore' },
    { label: 'Sweet Bakery Studio (Cầu Giấy)', route: 'explore' },
    { label: 'Moon Cake Haute Atelier (Thảo Điền)', route: 'explore' },
    { label: 'Maison de Gâteaux (Q.3)', route: 'explore' },
    { label: 'Artisan Sweet Atelier (Hoàn Kiếm)', route: 'explore' },
  ],
  branches: [
    { city: 'TP. Hồ Chí Minh', address: '31 Tô Vĩnh Diện, P. Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh' },
    { city: 'TP. Hồ Chí Minh', address: '12 Lê Lợi, P. Bến Nghé, Q.1' },

  ],
};

export const ADMIN_NAV_ITEMS = [
  {
    id: 'admin-dashboard',
    label: 'Tổng quan Hệ thống',
    icon: 'dashboard',
    description: 'Chỉ số GMV & Điều phối',
  },
  {
    id: 'admin-vendors',
    label: 'Tiệm bánh & Duyệt xưởng',
    icon: 'storefront',
    badgeKey: 'pendingVendorsCount',
    badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300/60',
    description: 'Thẩm định ATTP & Tiêu chuẩn',
  },
  {
    id: 'admin-orders',
    label: 'Đơn hàng & Escrow Vault',
    icon: 'lock_clock',
    badge: 'Bảo chứng 100%',
    badgeColor: 'bg-secondary-fixed text-on-secondary-fixed',
    description: 'Khóa cọc & Giám sát giải ngân',
  },
  {
    id: 'admin-users',
    label: 'Quản trị Người dùng',
    icon: 'group',
    description: 'Tài khoản & Phân quyền KYC',
  },
];

export const VENDOR_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    icon: 'grid_view',
    route: 'vendor-dashboard',
  },
  {
    id: 'rfq',
    label: 'Yêu cầu báo giá',
    icon: 'description',
    badgeKey: 'rfqCount',
    badgeSuffix: ' mới',
    route: 'vendor-rfq',
  },
  {
    id: 'orders',
    label: 'Quản lý đơn hàng',
    icon: 'cake',
    badge: '15 đơn',
    route: 'vendor-orders',
  },
  {
    id: 'menu',
    label: 'Mẫu bánh tiệm',
    icon: 'menu_book',
    route: 'vendor-menu',
  },
  {
    id: 'revenue',
    label: 'Doanh thu & Escrow',
    icon: 'account_balance_wallet',
    badge: '46.7M',
    route: 'vendor-revenue',
  },
  {
    id: 'profile',
    label: 'Hồ sơ tiệm bánh',
    icon: 'storefront',
    route: 'vendor-profile',
  },
];

export const VENDOR_HEADER_NOTIFICATIONS = {
  unreadCount: 3,
  summary:
    'Có 3 thông báo mới: 1 yêu cầu RFQ mới, 1 đơn hàng đã mở cọc Escrow, và 1 đánh giá 5 sao!',
  items: [
    {
      id: 1,
      title: 'Yêu cầu báo giá mới',
      text: 'Khách hàng vừa đăng RFQ bánh Pikachu 2 tầng',
      time: '5 phút trước',
    },
    {
      id: 2,
      title: 'Đơn hàng đã ký quỹ Escrow',
      text: 'Đơn hàng #ORD-9982 đã khóa cọc 100%',
      time: '12 phút trước',
    },
    {
      id: 3,
      title: 'Đánh giá 5 sao mới',
      text: 'Khách hàng Mai Lan đánh giá bánh Mousse Earl Grey',
      time: '1 giờ trước',
    },
  ],
};
