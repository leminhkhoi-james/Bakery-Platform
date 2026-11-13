import 'package:flutter/material.dart';

import '../../app/router/screen_id.dart';
import '../../app/theme/app_colors.dart';
import '../live/live_workspace.dart';
import 'sweetcake_widgets.dart';

void liveOpen(BuildContext context, String path, {String? id}) =>
    Navigator.of(context).pushNamed(path, arguments: ScreenArguments(id: id));

class LiveScaffold extends StatelessWidget {
  const LiveScaffold({
    super.key,
    required this.title,
    required this.children,
    this.operational = false,
    this.onRefresh,
    this.navigation = true,
    this.contentAlignment = Alignment.center,
    this.navigationPath,
  });
  final String title;
  final List<Widget> children;
  final bool operational, navigation;
  final Future<void> Function()? onRefresh;
  final Alignment contentAlignment;
  final String? navigationPath;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context),
        route = ModalRoute.of(context)?.settings.name ?? '/';
    final adminContext =
        route.startsWith('/admin') ||
        operational &&
            w.session.hasRole('ADMIN') &&
            !route.startsWith('/vendor');
    final ownerContext =
        route.startsWith('/vendor') || operational && !adminContext;
    final destinations = adminContext && w.session.hasRole('ADMIN')
        ? [
            ('/', 'Trang chủ', Icons.home_outlined),
            ('/admin-vendors', 'Tiệm bánh', Icons.storefront_outlined),
            ('/admin-payments', 'Duyệt gói', Icons.receipt_long_outlined),
            ('/admin-plans', 'Gói thuê', Icons.inventory_2_outlined),
          ]
        : ownerContext && w.session.authenticated
        ? [
            ('/', 'Trang chủ', Icons.home_outlined),
            ('/vendor-profile', 'Hồ sơ tiệm', Icons.storefront_outlined),
            ('/vendor-menu', 'Catalog', Icons.cake_outlined),
            (
              '/vendor-subscription',
              'Gói thuê',
              Icons.workspace_premium_outlined,
            ),
          ]
        : [
            ('/', 'Trang chủ', Icons.home_outlined),
            ('/explore', 'Bánh', Icons.cake_outlined),
            ('/stores', 'Tiệm', Icons.storefront_outlined),
            ('/profile', 'Tài khoản', Icons.person_outline),
          ];
    var selected = destinations.indexWhere(
      (d) => d.$1 == (navigationPath ?? route),
    );
    if (selected < 0) selected = 0;
    final large = MediaQuery.sizeOf(context).width >= 768;
    final body = RefreshIndicator(
      onRefresh: onRefresh ?? () async {},
      child: SingleChildScrollView(
        key: const ValueKey('live-scroll'),
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        child: Align(
          alignment: contentAlignment,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (var i = 0; i < children.length; i++) ...[
                  children[i],
                  if (i < children.length - 1) const SizedBox(height: 24),
                ],
              ],
            ),
          ),
        ),
      ),
    );
    return Scaffold(
      backgroundColor: operational ? AppColors.background : AppColors.lightPink,
      appBar: AppBar(
        title: title == 'SweetCake'
            ? Image.asset(
                'assets/images/brand_logo.png',
                width: 108,
                height: 40,
                semanticLabel: 'SweetCake',
              )
            : Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Chức năng',
            icon: const Icon(Icons.menu),
            onSelected: (path) => liveOpen(context, path),
            itemBuilder: (_) => [
              for (final item in const [
                ('/requests', 'Yêu cầu bánh'),
                ('/offers', 'Báo giá nhận được'),
                ('/cart', 'Giỏ bánh'),
                ('/orders', 'Đơn bánh'),
                ('/chat', 'Trò chuyện'),
              ])
                PopupMenuItem(value: item.$1, child: Text(item.$2)),
              if (w.session.hasRole('BAKERY_OWNER'))
                for (final item in const [
                  ('/vendor-requests', 'Yêu cầu cho tiệm'),
                  ('/vendor-offers', 'Báo giá của tiệm'),
                  ('/vendor-orders', 'Đơn của tiệm'),
                  ('/vendor-chat', 'Trò chuyện của tiệm'),
                ])
                  PopupMenuItem(value: item.$1, child: Text(item.$2)),
            ],
          ),
          IconButton(
            key: const ValueKey('account-nav'),
            tooltip: 'Tài khoản',
            onPressed: () => liveOpen(context, '/profile'),
            icon: const Icon(Icons.person_outline),
          ),
        ],
      ),
      body: SafeArea(
        child: Row(
          crossAxisAlignment: contentAlignment == Alignment.topCenter
              ? CrossAxisAlignment.start
              : CrossAxisAlignment.center,
          children: [
            if (navigation && large)
              NavigationRail(
                selectedIndex: selected,
                labelType: NavigationRailLabelType.all,
                onDestinationSelected: (i) =>
                    liveOpen(context, destinations[i].$1),
                destinations: [
                  for (final d in destinations)
                    NavigationRailDestination(
                      icon: Icon(d.$3),
                      label: Text(d.$2),
                    ),
                ],
              ),
            Expanded(child: body),
          ],
        ),
      ),
      bottomNavigationBar: navigation && !large
          ? NavigationBar(
              selectedIndex: selected,
              onDestinationSelected: (i) =>
                  liveOpen(context, destinations[i].$1),
              destinations: [
                for (final d in destinations)
                  NavigationDestination(
                    key: ValueKey('nav-${d.$1}'),
                    icon: Icon(d.$3),
                    label: d.$2,
                  ),
              ],
            )
          : null,
    );
  }
}

class LiveUnavailable extends StatelessWidget {
  const LiveUnavailable(
    this.message, {
    super.key,
    this.title = 'Chưa hỗ trợ thao tác này',
  });
  final String message, title;
  @override
  Widget build(BuildContext context) => LiveScaffold(
    title: title,
    children: [
      SCStateView(
        title: title,
        message: message,
        action: 'Về trang chủ',
        onAction: () => liveOpen(context, '/'),
      ),
    ],
  );
}
