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
import '../../features/marketplace/presentation/live_request_pages.dart';
import '../../features/marketplace/presentation/live_offer_pages.dart';
import '../../features/orders/presentation/live_order_pages.dart';
import '../../features/chat/presentation/live_chat_page.dart';
import '../../features/cart/presentation/live_cart_page.dart';
import '../../features/ai/presentation/live_ai_pages.dart';
import '../../features/addresses/presentation/live_address_page.dart';

abstract final class LiveRouter {
  static Route<void> generate(RouteSettings settings) => MaterialPageRoute(
    settings: settings,
    builder: (context) {
      final w = LiveScope.of(context), path = settings.name ?? '/';
      final args = settings.arguments is ScreenArguments
          ? settings.arguments as ScreenArguments
          : const ScreenArguments();
      if ((path.startsWith('/request') ||
              path.startsWith('/offer') ||
              path.startsWith('/order') ||
              path.startsWith('/chat') ||
              path.startsWith('/ai') ||
              path == '/checkout' ||
              path == '/addresses') &&
          !w.session.authenticated) {
        return const LiveAuthPage();
      }
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
        if ((path.startsWith('/vendor-request') ||
                path.startsWith('/vendor-offer') ||
                path.startsWith('/vendor-order') ||
                path.startsWith('/vendor-chat')) &&
            !w.session.hasRole('BAKERY_OWNER')) {
          return const LiveUnavailable(
            'Cần quyền chủ tiệm từ Identity và membership hợp lệ để thực hiện chức năng này.',
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
        '/admin-ai-designs' => const LiveAiModerationPage(),
        '/ai-jobs' =>
          w.session.hasRole('CUSTOMER')
              ? const LiveAiJobsPage()
              : const LiveUnavailable(
                  'Cần tài khoản Customer để xem các thiết kế của mình.',
                ),
        '/admin-requests' => const LiveRequestsPage(admin: true),
        '/admin-offers' => const LiveOffersPage(admin: true),
        '/admin-request-detail' =>
          args.id == null
              ? const LiveUnavailable(
                  'Chọn yêu cầu từ danh sách được cấp quyền.',
                )
              : LiveRequestDetail(args.id!, admin: true),
        '/admin-offer-detail' =>
          args.id == null
              ? const LiveUnavailable('Chọn báo giá từ yêu cầu được cấp quyền.')
              : LiveOfferDetail(args.id!, admin: true),
        '/admin-orders' => const LiveOrdersPage(admin: true),
        '/admin-order-detail' =>
          args.id == null
              ? const LiveUnavailable('Chọn đơn từ danh sách được cấp quyền.')
              : LiveOrderDetail(args.id!, admin: true),
        '/requests' => const LiveRequestsPage(),
        '/request-new' => const LiveRequestEditor(),
        '/vendor-requests' => const LiveRequestsPage(vendor: true),
        '/request-detail' || '/vendor-request-detail' =>
          args.id == null
              ? const LiveUnavailable('Chọn một yêu cầu đã được phép truy cập.')
              : LiveRequestDetail(args.id!, vendor: path.startsWith('/vendor')),
        '/offers' => const LiveOffersPage(),
        '/vendor-offers' => const LiveOffersPage(vendor: true),
        '/offer-detail' || '/vendor-offer-detail' =>
          args.id == null
              ? const LiveUnavailable('Chọn một báo giá hợp lệ.')
              : LiveOfferDetail(args.id!, vendor: path.startsWith('/vendor')),
        '/orders' || '/tracking' => const LiveOrdersPage(),
        '/vendor-orders' => const LiveOrdersPage(vendor: true),
        '/order-detail' || '/vendor-order-detail' =>
          args.id == null
              ? const LiveUnavailable('Chọn một đơn đã được phép truy cập.')
              : LiveOrderDetail(args.id!, vendor: path.startsWith('/vendor')),
        '/chat' => const LiveConversationsPage(),
        '/vendor-chat' => const LiveConversationsPage(vendor: true),
        '/chat-detail' || '/vendor-chat-detail' =>
          args.id == null
              ? const LiveUnavailable('Mở hội thoại từ danh sách hoặc yêu cầu.')
              : LiveChatThread(args.id!, vendor: path.startsWith('/vendor')),
        '/cart' => const LiveCartPage(),
        '/checkout' => const LiveCheckoutPage(),
        '/addresses' => const LiveAddressPage(),
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
          'Chức năng này chưa có tích hợp được hỗ trợ. Không gửi tới AI hoặc endpoint nội bộ.',
        ),
      };
    },
  );
}
