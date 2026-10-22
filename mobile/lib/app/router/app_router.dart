import 'package:flutter/material.dart';

import '../../features/admin/admin_dashboard_screen.dart';
import '../../features/admin/admin_orders_screen.dart';
import '../../features/admin/users_screen.dart';
import '../../features/admin/vendors_screen.dart';
import '../../features/auth/auth_screen.dart';
import '../../features/bidding/bidding_screen.dart';
import '../../features/bidding/quote_screen.dart';
import '../../features/catalog/catalog_screen.dart';
import '../../features/catalog/product_screen.dart';
import '../../features/checkout/cart_screen.dart';
import '../../features/checkout/payment_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/stores/stores_screen.dart';
import '../../features/studio/studio_screen.dart';
import '../../features/tracking/tracking_screen.dart';
import '../../features/vendor/quote_editor_screen.dart';
import '../../features/vendor/revenue_screen.dart';
import '../../features/vendor/rfq_screen.dart';
import '../../features/vendor/settings_screen.dart';
import '../../features/vendor/vendor_catalog_screen.dart';
import '../../features/vendor/vendor_dashboard_screen.dart';
import '../../features/vendor/vendor_orders_screen.dart';
import '../../models/catalog.dart';
import '../../models/workflow.dart';
import '../app_shell.dart';
import 'destination.dart';

Route<void> appRoute(RouteSettings settings) {
  final name = (settings.name ?? '/home').replaceFirst('/', '');
  final destination =
      Destination.values.where((d) => d.name == name).firstOrNull ??
      Destination.home;
  final argument = settings.arguments;
  final screen = switch (destination) {
    Destination.home => const HomeScreen(),
    Destination.explore => CatalogScreen(
      category: argument is String ? argument : null,
    ),
    Destination.product => ProductScreen(
      cake: argument is Cake ? argument : null,
    ),
    Destination.studio => StudioScreen(
      request: argument is CakeRequest ? argument : null,
    ),
    Destination.bidding => const BiddingScreen(),
    Destination.quote => QuoteScreen(
      quote: argument is Quote ? argument : null,
    ),
    Destination.stores => const StoresScreen(),
    Destination.cart => const CartScreen(),
    Destination.payment => const PaymentScreen(),
    Destination.tracking => const TrackingScreen(),
    Destination.profile => const ProfileScreen(),
    Destination.auth => const AuthScreen(),
    Destination.vendorDashboard => const VendorDashboardScreen(),
    Destination.vendorRfq => const RfqScreen(),
    Destination.vendorQuote => QuoteEditorScreen(
      request: argument is CakeRequest ? argument : null,
    ),
    Destination.vendorCatalog => const VendorCatalogScreen(),
    Destination.vendorOrders => const VendorOrdersScreen(),
    Destination.vendorRevenue => const RevenueScreen(),
    Destination.vendorSettings => const SettingsScreen(),
    Destination.adminDashboard => const AdminDashboardScreen(),
    Destination.adminUsers => const UsersScreen(),
    Destination.adminVendors => const VendorsScreen(),
    Destination.adminOrders => const AdminOrdersScreen(),
  };
  return MaterialPageRoute<void>(
    settings: settings,
    builder: (_) => AppShell(destination: destination, child: screen),
  );
}
