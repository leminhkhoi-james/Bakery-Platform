import '../../features/auth/domain/demo_session.dart';

enum ScreenId {
  home('/', 'SweetCake', 'public'),
  explore('/explore', 'Khám phá bánh', 'public'),
  product('/product-detail', 'Chi tiết bánh', 'public'),
  stores('/stores', 'Tiệm bánh đối tác', 'public'),
  bakery('/bakery-detail', 'Chi tiết tiệm', 'public'),
  plans('/subscription-plans', 'Gói đối tác', 'public'),
  login('/login', 'Chào mừng đến SweetCake', 'public'),
  cart('/cart', 'Giỏ bánh của bạn', 'customer'),
  profile('/profile', 'Tài khoản của tôi', 'customer'),
  tracking('/tracking', 'Đơn bánh của tôi', 'customer'),
  payment('/payment', 'Thông tin thanh toán', 'customer'),
  studio('/ai-studio', 'Xưởng ý tưởng', 'customer'),
  requests('/rfqs', 'Yêu cầu của tôi', 'customer'),
  requestNew('/rfq-new', 'Tạo yêu cầu bánh', 'customer'),
  requestDetail('/request-detail', 'Chi tiết yêu cầu', 'customer'),
  comparison('/bidding', 'So sánh báo giá', 'customer'),
  offer('/baker-quote', 'Chi tiết báo giá', 'customer'),
  chat('/chat', 'Tin nhắn', 'customer'),
  vendorDashboard('/vendor-dashboard', 'Tổng quan tiệm', 'vendor'),
  vendorCatalog('/vendor-menu', 'Catalog của tiệm', 'vendor'),
  vendorOrders('/vendor-orders', 'Đơn của tiệm', 'vendor'),
  vendorRequests('/vendor-rfq', 'Yêu cầu khả dụng', 'vendor'),
  vendorOffer('/vendor-quote-submit', 'Soạn báo giá', 'vendor'),
  vendorProfile('/vendor-profile', 'Hồ sơ và vận hành', 'vendor'),
  vendorRevenue('/vendor-revenue', 'Thông tin doanh thu', 'vendor'),
  vendorChat('/vendor-chat', 'Tin nhắn của tiệm', 'vendor'),
  vendorSubscription('/vendor-subscription', 'Gói thuê của tiệm', 'vendor'),
  adminDashboard('/admin-dashboard', 'Tổng quan nền tảng', 'admin'),
  adminUsers('/admin-users', 'Người dùng', 'admin'),
  adminBakeries('/admin-vendors', 'Duyệt tiệm bánh', 'admin'),
  adminPayments('/admin-payments', 'Duyệt thanh toán gói', 'admin'),
  adminPlans('/admin-plans', 'Quản lý gói', 'admin'),
  adminOrders('/admin-orders', 'Đơn trên nền tảng', 'admin'),
  adminModeration('/admin-moderation', 'Kiểm duyệt', 'admin'),
  adminRevenue('/admin-revenue', 'Doanh thu gói thuê', 'admin');

  const ScreenId(this.path, this.title, this.group);
  final String path;
  final String title;
  final String group;

  bool allowed(Persona persona) => switch (group) {
    'public' => true,
    'customer' => this == cart || persona == Persona.customer,
    'vendor' =>
      persona == Persona.owner ||
          (this == vendorSubscription && persona == Persona.customer),
    'admin' => persona == Persona.admin,
    _ => false,
  };

  Persona get previewPersona => switch (group) {
    'vendor' => Persona.owner,
    'admin' => Persona.admin,
    'customer' => Persona.customer,
    _ => Persona.guest,
  };

  static ScreenId? parse(String? path) {
    final normalized = Uri.tryParse(path ?? '/')?.path;
    for (final screen in values) {
      if (screen.path == normalized) return screen;
    }
    return null;
  }
}

class ScreenArguments {
  const ScreenArguments({this.id, this.relatedId, this.tab = 0});
  final String? id;
  final String? relatedId;
  final int tab;
}
