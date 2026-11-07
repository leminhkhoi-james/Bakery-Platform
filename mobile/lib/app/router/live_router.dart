import 'package:flutter/material.dart';

import '../../core/live/live_workspace.dart';
import '../../core/widgets/live_scaffold.dart';
import '../../features/admin/presentation/live_admin_bakeries.dart';
import '../../features/admin/presentation/live_admin_subscription.dart';
import '../../features/auth/presentation/live_auth_pages.dart';
import '../../features/catalog/presentation/live_owner_catalog.dart';
import '../../features/catalog/presentation/live_owner_profile.dart';
import '../../features/catalog/presentation/live_public_pages.dart';
import '../../features/subscription/presentation/live_subscription_pages.dart';
import 'screen_id.dart';

abstract final class LiveRouter {
  static Route<void> generate(RouteSettings settings) => MaterialPageRoute(
    settings: settings,
    builder: (context) {
      final w = LiveScope.of(context), path = settings.name ?? '/';
      final args = settings.arguments is ScreenArguments
          ? settings.arguments as ScreenArguments
          : const ScreenArguments();
      if (path.startsWith('/admin') && !w.session.hasRole('ADMIN')) {
        return LiveUnavailable(
          w.session.authenticated
              ? 'Chỉ tài khoản ADMIN được mở trang này.'
              : 'Đăng nhập bằng tài khoản ADMIN để tiếp tục.',
          title: 'Không có quyền truy cập',
        );
      }
      if (path.startsWith('/vendor')) {
        if (!w.session.authenticated) return const LiveAuthPage();
        if (!w.session.hasRole('CUSTOMER') &&
            !w.session.hasRole('BAKERY_OWNER')) {
          return const LiveUnavailable(
            'Cần tài khoản chủ tiệm hoặc Customer có hồ sơ onboarding.',
          );
        }
        if (path == '/vendor-menu' && !w.session.hasRole('BAKERY_OWNER')) {
          return const LiveUnavailable(
            'Hoàn tất hồ sơ, được duyệt tiệm và có gói hiệu lực trước khi quản lý catalog.',
            title: 'Chưa có quyền chủ tiệm',
          );
        }
      }
      return switch (path) {
        '/' => const LiveCatalogPage(home: true),
        '/explore' => const LiveCatalogPage(),
        '/stores' => const LiveCatalogPage(bakeries: true),
        '/product-detail' =>
          args.id == null
              ? const LiveUnavailable('Cần chọn bánh từ catalog.')
              : LiveProductPage(args.id!),
        '/bakery-detail' =>
          args.id == null
              ? const LiveUnavailable('Cần chọn tiệm từ danh bạ.')
              : LiveBakeryPage(args.id!),
        '/login' => const LiveAuthPage(),
        '/profile' => const LiveProfilePage(),
        '/subscription-plans' => const LivePlansPage(),
        '/vendor-profile' || '/vendor-dashboard' => const LiveOwnerProfile(),
        '/vendor-menu' => const LiveOwnerCatalog(),
        '/vendor-subscription' => const LiveOwnerSubscription(),
        '/admin-vendors' || '/admin-dashboard' => const LiveAdminBakeries(),
        '/admin-payments' => const LiveAdminPayments(),
        '/admin-plans' => const LiveAdminPlans(),
        _ => const LiveUnavailable(
          'Chức năng này nằm ngoài Phases 1–4 hoặc Backend chưa cung cấp API công khai. Không gửi dữ liệu tới Order, Marketplace, Chat, AI hoặc endpoint nội bộ.',
        ),
      };
    },
  );
}
