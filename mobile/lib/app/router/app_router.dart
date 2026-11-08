import 'package:flutter/material.dart';

import '../../core/demo/demo_workspace.dart';
import '../../core/widgets/sweetcake_scaffold.dart';
import '../../core/widgets/sweetcake_widgets.dart';
import '../../features/admin/presentation/admin_pages.dart';
import '../../features/auth/presentation/auth_page.dart';
import '../../features/cake_ai/presentation/studio_page.dart';
import '../../features/cart/presentation/cart_page.dart';
import '../../features/catalog/presentation/catalog_pages.dart';
import '../../features/catalog/presentation/vendor_catalog_page.dart';
import '../../features/catalog/presentation/vendor_workspace_pages.dart';
import '../../features/chat/presentation/chat_page.dart';
import '../../features/customer/presentation/profile_page.dart';
import '../../features/home/presentation/home_page.dart';
import '../../features/marketplace/presentation/offer_pages.dart';
import '../../features/marketplace/presentation/request_pages.dart';
import '../../features/orders/presentation/order_pages.dart';
import '../../features/subscription/presentation/subscription_pages.dart';
import 'screen_id.dart';

abstract final class AppRouter {
  static Route<void> generate(
    RouteSettings settings,
    DemoWorkspace workspace,
  ) => MaterialPageRoute<void>(
    settings: settings,
    builder: (context) {
      final screen = ScreenId.parse(settings.name);
      if (screen == null) return const MissingPage();
      final w = DemoScope.of(context);
      if (!screen.allowed(w.session.persona)) {
        return SweetCakeScaffold(
          screen: screen,
          children: [
            SCStateView(
              title: 'Vai demo chưa có quyền mở màn hình',
              message:
                  'Mở bộ chọn Demo để chọn ${screen.previewPersona.label}. Đây là chặn điều hướng local; không thay thế phân quyền Backend.',
              action: 'Về trang chủ',
              onAction: () =>
                  Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false),
            ),
          ],
        );
      }
      final args = settings.arguments is ScreenArguments
          ? settings.arguments as ScreenArguments
          : const ScreenArguments();
      final id =
          args.id ??
          switch (screen) {
            ScreenId.product => 'product-1',
            ScreenId.bakery => 'bakery-01',
            ScreenId.requestDetail ||
            ScreenId.comparison ||
            ScreenId.vendorOffer => 'request-01',
            ScreenId.offer => 'offer-01',
            _ => null,
          };
      if (id != null && !_exists(screen, id, w)) return const MissingPage();
      return switch (screen) {
        ScreenId.home => const HomePage(),
        ScreenId.explore => ExplorePage(category: args.relatedId ?? id),
        ScreenId.product => ProductDetailPage(id: id),
        ScreenId.stores => const StoreDirectoryPage(),
        ScreenId.bakery => BakeryDetailPage(id: id),
        ScreenId.plans => const PlansPage(),
        ScreenId.login => const AuthPage(),
        ScreenId.cart => const CartPage(),
        ScreenId.profile => const ProfilePage(),
        ScreenId.tracking ||
        ScreenId.vendorOrders ||
        ScreenId.adminOrders => OrderListPage(screen: screen, id: id),
        ScreenId.payment => const PaymentInformationPage(),
        ScreenId.studio => const StudioPage(),
        ScreenId.requests => const RequestsPage(),
        ScreenId.requestNew => RequestEditorPage(
          id: id,
          productId: args.relatedId?.startsWith('product-') == true
              ? args.relatedId
              : null,
          designId: args.relatedId?.startsWith('design-') == true
              ? args.relatedId
              : null,
        ),
        ScreenId.requestDetail => RequestDetailPage(id: id),
        ScreenId.comparison => ComparisonPage(id: id),
        ScreenId.offer => OfferDetailPage(id: id),
        ScreenId.chat => ChatPage(id: id),
        ScreenId.vendorDashboard => const VendorDashboardPage(),
        ScreenId.vendorCatalog => const VendorCatalogPage(),
        ScreenId.vendorRequests => const RequestsPage(vendor: true),
        ScreenId.vendorOffer => VendorOfferPage(requestId: id),
        ScreenId.vendorProfile => const VendorProfilePage(),
        ScreenId.vendorRevenue => const VendorRevenuePage(),
        ScreenId.vendorChat => ChatPage(id: id, vendor: true),
        ScreenId.vendorSubscription => VendorSubscriptionPage(planId: id),
        ScreenId.adminDashboard => const AdminDashboardPage(),
        ScreenId.adminUsers => const AdminUsersPage(),
        ScreenId.adminBakeries => const AdminBakeriesPage(),
        ScreenId.adminPayments => const AdminPaymentsPage(),
        ScreenId.adminPlans => const AdminPlansPage(),
        ScreenId.adminModeration => const AdminModerationPage(),
        ScreenId.adminRevenue => const AdminRevenuePage(),
      };
    },
  );
  static bool _exists(ScreenId screen, String id, DemoWorkspace w) =>
      switch (screen) {
        ScreenId.product => w.catalog.published.any((p) => p.id == id),
        ScreenId.bakery => w.catalog.bakeries.any(
          (b) => b.id == id && b.status == 'ACTIVE',
        ),
        ScreenId.requestDetail ||
        ScreenId.requestNew ||
        ScreenId.comparison ||
        ScreenId.vendorOffer => w.marketplace.requests.any((r) => r.id == id),
        ScreenId.offer => w.marketplace.offers.any((o) => o.id == id),
        ScreenId.tracking ||
        ScreenId.adminOrders => w.orders.orders.any((o) => o.id == id),
        ScreenId.vendorOrders => w.orders.orders.any(
          (o) => o.id == id && o.bakeryId == w.session.selectedBakeryId,
        ),
        ScreenId.chat => w.chat.conversations.any((c) => c.id == id),
        ScreenId.vendorChat => w.chat.conversations.any(
          (c) => c.id == id && c.bakeryId == w.session.selectedBakeryId,
        ),
        ScreenId.vendorSubscription => w.subscriptions.plans.any(
          (p) => p.id == id,
        ),
        _ => true,
      };
}

class MissingPage extends StatelessWidget {
  const MissingPage({super.key});
  @override
  Widget build(BuildContext context) => SweetCakeScaffold(
    screen: ScreenId.home,
    children: [
      SCStateView(
        title: 'Không tìm thấy nội dung',
        message: 'Liên kết hoặc dữ liệu local này không còn khả dụng.',
        action: 'Về trang chủ',
        onAction: () =>
            Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false),
      ),
    ],
  );
}
