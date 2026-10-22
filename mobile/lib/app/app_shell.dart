import 'package:flutter/material.dart';

import '../core/widgets/common.dart';
import '../core/theme/app_theme.dart';
import '../features/home/home_screen.dart';
import '../models/catalog.dart';
import '../state/app_state.dart';
import 'router/destination.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.destination, required this.child});
  final Destination destination;
  final Widget child;
  static const customers = [
    Destination.home,
    Destination.explore,
    Destination.studio,
    Destination.stores,
    Destination.bidding,
    Destination.tracking,
    Destination.profile,
    Destination.auth,
  ];
  static const vendors = [
    Destination.vendorDashboard,
    Destination.vendorRfq,
    Destination.vendorOrders,
    Destination.vendorCatalog,
    Destination.vendorRevenue,
    Destination.vendorSettings,
  ];
  static const admins = [
    Destination.adminDashboard,
    Destination.adminVendors,
    Destination.adminOrders,
    Destination.adminUsers,
  ];
  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final portal = destination.isVendor
        ? 'XƯỞNG BÁNH ĐỐI TÁC'
        : destination.isAdmin
        ? 'MASTER ADMIN'
        : 'SWEETCAKE';
    const bottom = [
      Destination.home,
      Destination.explore,
      Destination.studio,
      Destination.profile,
    ];
    final selected = bottom.indexOf(destination);
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: Navigator.canPop(context) ? const BackButton() : null,
        title: Semantics(
          label: 'SweetCake',
          child: Image.asset(
            'assets/images/brand-logo.png',
            width: 116,
            height: 42,
            fit: BoxFit.contain,
          ),
        ),
        actions: [
          if (destination.isVendor)
            IconButton(
              tooltip: 'Thông báo tiệm bánh',
              onPressed: () => feedback(
                context,
                textValue(
                  state.fixtures.record('VENDOR_HEADER_NOTIFICATIONS'),
                  'summary',
                ),
              ),
              icon: const Badge(
                label: Text('3'),
                child: Icon(Icons.notifications_outlined),
              ),
            ),
          IconButton(
            tooltip: 'Giỏ hàng',
            onPressed: () => go(context, Destination.cart),
            icon: Badge(
              isLabelVisible: state.cart.count > 0,
              label: Text('${state.cart.count}'),
              child: const Icon(Icons.shopping_bag_outlined),
            ),
          ),
          Builder(
            builder: (context) => IconButton(
              key: const ValueKey('navigation-menu'),
              tooltip: 'Menu điều hướng',
              onPressed: () => Scaffold.of(context).openDrawer(),
              icon: const Icon(Icons.menu),
            ),
          ),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.symmetric(vertical: 16),
            children: [
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Image.asset('assets/images/brand-logo.png', height: 60),
                    const SizedBox(height: 12),
                    Text(
                      portal,
                      style: const TextStyle(
                        color: Brand.caramel,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text('Bản mô phỏng giao diện di động'),
                  ],
                ),
              ),
              for (final section in [
                ('Khách hàng', customers),
                ('Cổng tiệm bánh', vendors),
                ('Quản trị viên', admins),
              ]) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 6),
                  child: Text(
                    section.$1,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                ),
                for (final d in section.$2)
                  ListTile(
                    selected: destination == d,
                    selectedColor: Brand.wine,
                    selectedTileColor: Brand.blush.withValues(alpha: .4),
                    leading: Icon(d.icon),
                    title: Text(d.label),
                    onTap: () {
                      Navigator.pop(context);
                      if (d != destination) go(context, d);
                    },
                  ),
              ],
              const Divider(),
              ListTile(
                leading: const Icon(Icons.policy_outlined),
                title: const Text('Điều khoản & chính sách'),
                onTap: () {
                  Navigator.pop(context);
                  showPolicies(context);
                },
              ),
            ],
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              color: Brand.cream,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Text(
                '$portal · MÔ PHỎNG OFFLINE',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 10,
                  color: Brand.muted,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),
            ),
            Expanded(child: child),
          ],
        ),
      ),
      bottomNavigationBar: destination.isAdmin || destination.isVendor
          ? null
          : NavigationBar(
              selectedIndex: selected < 0 ? 0 : selected,
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              onDestinationSelected: (i) {
                if (bottom[i] != destination) go(context, bottom[i]);
              },
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.home_outlined),
                  selectedIcon: Icon(Icons.home),
                  label: 'Trang chủ',
                ),
                NavigationDestination(
                  icon: Icon(Icons.cake_outlined),
                  selectedIcon: Icon(Icons.cake),
                  label: 'Khám phá',
                ),
                NavigationDestination(
                  icon: Icon(Icons.auto_awesome_outlined),
                  selectedIcon: Icon(Icons.auto_awesome),
                  label: 'Thiết kế',
                ),
                NavigationDestination(
                  icon: Icon(Icons.person_outline),
                  selectedIcon: Icon(Icons.person),
                  label: 'Tài khoản',
                ),
              ],
            ),
    );
  }
}
