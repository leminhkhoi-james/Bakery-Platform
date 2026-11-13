import 'package:flutter/material.dart';

import '../../app/navigation/navigation.dart';
import '../../app/router/screen_id.dart';
import '../../app/theme/app_colors.dart';
import '../../features/auth/domain/demo_session.dart';
import '../demo/demo_workspace.dart';
import 'sweetcake_widgets.dart';

class SweetCakeScaffold extends StatelessWidget {
  const SweetCakeScaffold({
    super.key,
    required this.screen,
    required this.children,
    this.bottom,
    this.rawBody,
    this.onRefresh,
    this.scrollController,
    this.showNavigation = true,
  });
  final ScreenId screen;
  final List<Widget> children;
  final Widget? bottom, rawBody;
  final Future<void> Function()? onRefresh;
  final ScrollController? scrollController;
  final bool showNavigation;

  @override
  Widget build(BuildContext context) {
    final workspace = DemoScope.of(context);
    return ListenableBuilder(
      listenable: workspace.changes,
      builder: (context, _) {
        final persona = workspace.session.persona;
        final destinations = switch (persona) {
          Persona.guest => [
            ScreenId.home,
            ScreenId.explore,
            ScreenId.stores,
            ScreenId.login,
          ],
          Persona.customer => [
            ScreenId.home,
            ScreenId.explore,
            ScreenId.requests,
            ScreenId.chat,
            ScreenId.profile,
          ],
          Persona.owner => [
            ScreenId.vendorDashboard,
            ScreenId.vendorOrders,
            ScreenId.vendorCatalog,
            ScreenId.vendorRequests,
            ScreenId.vendorProfile,
          ],
          Persona.admin => [
            ScreenId.adminDashboard,
            ScreenId.adminBakeries,
            ScreenId.adminPayments,
            ScreenId.adminPlans,
          ],
        };
        final section = switch (screen) {
          ScreenId.product => ScreenId.explore,
          ScreenId.bakery => ScreenId.stores,
          ScreenId.requestNew ||
          ScreenId.requestDetail ||
          ScreenId.comparison ||
          ScreenId.offer => ScreenId.requests,
          ScreenId.tracking || ScreenId.payment => ScreenId.profile,
          ScreenId.vendorOffer => ScreenId.vendorRequests,
          ScreenId.vendorChat ||
          ScreenId.vendorRevenue ||
          ScreenId.vendorSubscription => ScreenId.vendorProfile,
          _ => screen,
        };
        final selected = destinations.indexOf(section);
        final expanded = MediaQuery.sizeOf(context).width >= 768;
        final scenario = workspace.session.scenario(screen.path);
        final normalBody =
            rawBody ??
            RefreshIndicator(
              onRefresh:
                  onRefresh ??
                  () async {
                    await Future<void>.delayed(
                      const Duration(milliseconds: 250),
                    );
                    if (context.mounted) {
                      demoFeedback(context, 'Đã làm mới dữ liệu local');
                    }
                  },
              child: ListView(
                controller: scrollController,
                key: ValueKey('content-${screen.name}'),
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
                children: [
                  Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1100),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (scenario == DemoScenario.partial)
                            const Padding(
                              padding: EdgeInsets.only(bottom: 20),
                              child: SCNotice(
                                'Tình huống demo: một phần thông tin chưa sẵn sàng; dữ liệu còn lại vẫn hiển thị.',
                                warning: true,
                              ),
                            ),
                          for (var i = 0; i < children.length; i++) ...[
                            children[i],
                            if (i < children.length - 1)
                              const SizedBox(height: 24),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
        final body = _scenario(context, scenario, normalBody, workspace);
        return Scaffold(
          backgroundColor:
              screen.group == 'public' || screen.group == 'customer'
              ? AppColors.lightPink
              : AppColors.background,
          appBar: AppBar(
            title: screen == ScreenId.home
                ? Image.asset(
                    'assets/images/brand_logo.png',
                    width: 108,
                    height: 40,
                    fit: BoxFit.contain,
                    semanticLabel: 'SweetCake',
                  )
                : Text(
                    screen.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
            actions: [
              TextButton(
                key: const ValueKey('demo-menu'),
                onPressed: () => _demoMenu(context, workspace),
                child: const Text('Demo'),
              ),
              if (screen.group == 'public' || screen.group == 'customer')
                IconButton(
                  tooltip: 'Giỏ bánh',
                  onPressed: () => openScreen(context, ScreenId.cart),
                  icon: Badge(
                    isLabelVisible: workspace.cart.count > 0,
                    label: Text('${workspace.cart.count}'),
                    child: const Icon(Icons.shopping_bag_outlined),
                  ),
                ),
            ],
          ),
          drawer: Drawer(
            child: SafeArea(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Image.asset(
                    'assets/images/brand_logo.png',
                    height: 58,
                    semanticLabel: 'SweetCake',
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '${persona.label} · bản demo',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const Divider(),
                  for (final destination in ScreenId.values.where(
                    (s) => s.allowed(persona) && s != ScreenId.login,
                  ))
                    ListTile(
                      selected: destination == screen,
                      selectedTileColor: AppColors.softPink,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      leading: Icon(iconFor(destination)),
                      title: Text(destination.title),
                      onTap: () {
                        Navigator.pop(context);
                        openScreen(context, destination);
                      },
                    ),
                ],
              ),
            ),
          ),
          body: SafeArea(
            top: false,
            child: Row(
              children: [
                if (expanded) ...[
                  SizedBox(
                    width: 120,
                    child: LayoutBuilder(
                      builder: (context, constraints) => SingleChildScrollView(
                        child: SizedBox(
                          height: constraints.maxHeight < 600
                              ? 600
                              : constraints.maxHeight,
                          child: NavigationRail(
                            selectedIndex: selected >= 0 ? selected : null,
                            labelType: NavigationRailLabelType.all,
                            onDestinationSelected: (index) => openScreen(
                              context,
                              destinations[index],
                              replace: true,
                            ),
                            destinations: [
                              for (final d in destinations)
                                NavigationRailDestination(
                                  icon: Icon(iconFor(d)),
                                  label: Text(shortLabel(d)),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const VerticalDivider(width: 1),
                ],
                Expanded(child: body),
              ],
            ),
          ),
          bottomNavigationBar: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (bottom != null &&
                    (scenario == DemoScenario.normal ||
                        scenario == DemoScenario.partial))
                  Container(
                    constraints: const BoxConstraints(maxWidth: 1100),
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                    decoration: const BoxDecoration(
                      color: AppColors.white,
                      border: Border(top: BorderSide(color: AppColors.border)),
                    ),
                    child: bottom,
                  ),
                if (!expanded && showNavigation)
                  NavigationBar(
                    selectedIndex: selected >= 0 ? selected : 0,
                    onDestinationSelected: (index) =>
                        openScreen(context, destinations[index], replace: true),
                    destinations: [
                      for (final d in destinations)
                        NavigationDestination(
                          icon: Icon(iconFor(d)),
                          label: shortLabel(d),
                        ),
                    ],
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _scenario(
    BuildContext context,
    DemoScenario scenario,
    Widget child,
    DemoWorkspace workspace,
  ) {
    void retry() =>
        workspace.session.setScenario(screen.path, DemoScenario.normal);
    return switch (scenario) {
      DemoScenario.normal || DemoScenario.partial => child,
      DemoScenario.loading => SCStateView(
        title: 'Đang tải bản xem trước',
        message: 'Đây là trạng thái tải mô phỏng, không có request mạng.',
        loading: true,
        action: 'Hiển thị dữ liệu',
        onAction: retry,
      ),
      DemoScenario.empty => SCStateView(
        title: 'Chưa có dữ liệu',
        message: 'Màn hình đang ở tình huống dữ liệu rỗng của bản demo.',
        action: 'Khôi phục dữ liệu',
        onAction: retry,
      ),
      DemoScenario.forbidden => SCStateView(
        title: 'Không có quyền xem',
        message:
            'Quyền truy cập cần được Backend kiểm chứng khi tích hợp thật.',
        icon: Icons.lock_outline,
        action: 'Quay lại dữ liệu demo',
        onAction: retry,
      ),
      DemoScenario.notFound => SCStateView(
        title: 'Không tìm thấy nội dung',
        message: 'Tài nguyên minh họa không có trong tình huống này.',
        icon: Icons.search_off,
        action: 'Trở về dữ liệu demo',
        onAction: retry,
      ),
      DemoScenario.conflict => SCStateView(
        title: 'Dữ liệu đã thay đổi',
        message: 'Hãy tải lại trước khi thử lưu để tránh gửi lặp.',
        icon: Icons.sync_problem_outlined,
        action: 'Tải lại bản xem trước',
        onAction: retry,
      ),
      DemoScenario.timeout => SCStateView(
        title: 'Chờ lâu hơn dự kiến',
        message:
            'Timeout mô phỏng. Không có kết nối Backend nào được thực hiện.',
        icon: Icons.schedule,
        onAction: retry,
      ),
      DemoScenario.error => SCStateView(
        title: 'Chưa thể hiển thị dữ liệu',
        message: 'Lỗi mô phỏng để kiểm tra phản hồi và khả năng thử lại.',
        icon: Icons.cloud_off_outlined,
        onAction: retry,
      ),
    };
  }

  Future<void> _demoMenu(BuildContext context, DemoWorkspace workspace) async {
    await showSCSheet<void>(
      context,
      title: 'Bản demo SweetCake',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SCNotice(
            'Dữ liệu và thao tác chỉ nằm trên thiết bị. Đây không phải phiên đăng nhập hay giao dịch thật.',
          ),
          const SizedBox(height: 16),
          Text(
            'Chọn vai trò xem trước',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          for (final persona in Persona.values)
            ListTile(
              title: Text(persona.label),
              subtitle: Text(persona.code),
              selected: persona == workspace.session.persona,
              leading: Icon(
                persona == workspace.session.persona
                    ? Icons.radio_button_checked
                    : Icons.radio_button_off,
              ),
              onTap: () {
                Navigator.pop(context);
                workspace.session.switchPersona(persona);
                final target = persona == Persona.owner
                    ? ScreenId.vendorDashboard
                    : persona == Persona.admin
                    ? ScreenId.adminDashboard
                    : ScreenId.home;
                Navigator.of(context)
                    .pushNamedAndRemoveUntil(target.path, (route) => false);
              },
            ),
          const Divider(),
          Text(
            'Tình huống màn hình',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: [
              for (final scenario in DemoScenario.values)
                ChoiceChip(
                  label: Text(scenario.label),
                  selected: workspace.session.scenario(screen.path) == scenario,
                  onSelected: (_) {
                    workspace.session.setScenario(screen.path, scenario);
                    Navigator.pop(context);
                  },
                ),
            ],
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () {
              workspace.reset();
              Navigator.pop(context);
              demoFeedback(context, 'Đã khôi phục fixture ban đầu');
            },
            icon: const Icon(Icons.restart_alt),
            label: const Text('Đặt lại dữ liệu local'),
          ),
        ],
      ),
    );
  }
}

String shortLabel(ScreenId screen) => switch (screen) {
  ScreenId.home => 'Trang chủ',
  ScreenId.explore => 'Khám phá',
  ScreenId.stores => 'Tiệm bánh',
  ScreenId.login => 'Tài khoản',
  ScreenId.requests => 'Yêu cầu',
  ScreenId.chat => 'Tin nhắn',
  ScreenId.profile => 'Cá nhân',
  ScreenId.vendorDashboard || ScreenId.adminDashboard => 'Tổng quan',
  ScreenId.vendorOrders => 'Đơn bánh',
  ScreenId.vendorCatalog => 'Catalog',
  ScreenId.vendorRequests => 'RFQ',
  ScreenId.vendorProfile => 'Quản lý',
  ScreenId.adminBakeries => 'Tiệm bánh',
  ScreenId.adminPayments => 'Thanh toán',
  ScreenId.adminPlans => 'Gói thuê',
  _ => screen.title,
};

IconData iconFor(ScreenId screen) => switch (screen) {
  ScreenId.home => Icons.home_outlined,
  ScreenId.explore || ScreenId.vendorCatalog => Icons.cake_outlined,
  ScreenId.stores ||
  ScreenId.bakery ||
  ScreenId.adminBakeries => Icons.storefront_outlined,
  ScreenId.cart => Icons.shopping_bag_outlined,
  ScreenId.requests ||
  ScreenId.vendorRequests ||
  ScreenId.requestNew => Icons.edit_note_outlined,
  ScreenId.chat || ScreenId.vendorChat => Icons.chat_bubble_outline,
  ScreenId.tracking ||
  ScreenId.vendorOrders ||
  ScreenId.adminOrders => Icons.receipt_long_outlined,
  ScreenId.profile ||
  ScreenId.login ||
  ScreenId.adminUsers => Icons.person_outline,
  ScreenId.plans ||
  ScreenId.vendorSubscription ||
  ScreenId.adminPlans => Icons.workspace_premium_outlined,
  ScreenId.adminDashboard ||
  ScreenId.vendorDashboard => Icons.space_dashboard_outlined,
  ScreenId.adminPayments || ScreenId.payment => Icons.payment_outlined,
  ScreenId.adminRevenue || ScreenId.vendorRevenue => Icons.bar_chart_outlined,
  ScreenId.adminModeration => Icons.fact_check_outlined,
  ScreenId.studio => Icons.palette_outlined,
  ScreenId.vendorProfile => Icons.tune,
  _ => Icons.arrow_forward_outlined,
};

class BakerySelector extends StatelessWidget {
  const BakerySelector({super.key});
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    return DropdownButtonFormField<String>(
      initialValue: w.session.selectedBakeryId,
      isExpanded: true,
      decoration: const InputDecoration(
        labelText: 'Tiệm đang quản lý',
        prefixIcon: Icon(Icons.storefront_outlined),
      ),
      items: [
        for (final b in w.catalog.owned)
          DropdownMenuItem(
            value: b.id,
            child: Text(b.name, overflow: TextOverflow.ellipsis),
          ),
      ],
      onChanged: (id) {
        if (id != null) w.session.selectBakery(id);
      },
    );
  }
}
