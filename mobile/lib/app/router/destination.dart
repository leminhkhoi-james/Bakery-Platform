import 'package:flutter/material.dart';

enum Destination {
  home('Trang chủ', Icons.home_outlined),
  explore('Khám phá mẫu bánh', Icons.cake_outlined),
  product('Chi tiết bánh', Icons.cake_outlined),
  studio('Thiết kế bánh', Icons.auto_awesome_outlined),
  bidding('Sàn so sánh giá', Icons.request_quote_outlined),
  quote('Chi tiết báo giá', Icons.receipt_long_outlined),
  stores('Tiệm bánh đối tác', Icons.storefront_outlined),
  cart('Giỏ hàng', Icons.shopping_bag_outlined),
  payment('Thanh toán', Icons.account_balance_wallet_outlined),
  tracking('Theo dõi đơn hàng', Icons.local_shipping_outlined),
  profile('Hồ sơ & đơn hàng', Icons.person_outline),
  auth('Đăng nhập / Đăng ký', Icons.login),
  vendorDashboard('Tổng quan tiệm bánh', Icons.space_dashboard_outlined),
  vendorRfq('Yêu cầu báo giá', Icons.description_outlined),
  vendorQuote('Soạn báo giá', Icons.edit_note),
  vendorCatalog('Mẫu bánh tiệm', Icons.menu_book_outlined),
  vendorOrders('Quản lý đơn hàng', Icons.inventory_2_outlined),
  vendorRevenue('Doanh thu & Escrow', Icons.account_balance_wallet_outlined),
  vendorSettings('Hồ sơ tiệm bánh', Icons.storefront_outlined),
  adminDashboard('Tổng quan hệ thống', Icons.dashboard_outlined),
  adminUsers('Người dùng', Icons.group_outlined),
  adminVendors('Tiệm bánh & duyệt xưởng', Icons.storefront_outlined),
  adminOrders('Đơn hàng & Escrow Vault', Icons.lock_clock_outlined);

  const Destination(this.label, this.icon);
  final String label;
  final IconData icon;
  bool get isVendor => name.startsWith('vendor');
  bool get isAdmin => name.startsWith('admin');
}

void go(BuildContext context, Destination destination, [Object? argument]) {
  Navigator.of(context).pushNamed('/${destination.name}', arguments: argument);
}
