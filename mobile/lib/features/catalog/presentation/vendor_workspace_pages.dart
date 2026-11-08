import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../domain/catalog_repository.dart';
import '../../marketplace/presentation/offer_pages.dart';

class VendorDashboardPage extends StatelessWidget {
  const VendorDashboardPage({super.key});
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context), id = w.session.selectedBakeryId;
    final bakery = w.catalog.bakery(id),
        orders = w.orders.orders.where((o) => o.bakeryId == id).toList();
    return SweetCakeScaffold(
      screen: ScreenId.vendorDashboard,
      children: [
        const BakerySelector(),
        SCSection(
          'Chào tiệm, ${bakery.name}',
          description: 'Công việc hôm nay từ dữ liệu demo',
        ),
        SCStatusBadge(bakery.status),
        MetricGrid(
          items: [
            (
              'Sản phẩm',
              '${w.catalog.products.where((p) => p.bakeryId == id).length}',
            ),
            (
              'Đơn đang làm',
              '${orders.where((o) => !['COMPLETED', 'CANCELLED'].contains(o.status.name.toUpperCase())).length}',
            ),
            (
              'Yêu cầu đang mở',
              '${w.marketplace.requests.where((r) => r.status == 'OPEN').length}',
            ),
            (
              'Hội thoại',
              '${w.chat.conversations.where((c) => c.bakeryId == id).length}',
            ),
          ],
        ),
        SCButton(
          'Xử lý đơn bánh',
          icon: Icons.receipt_long_outlined,
          onPressed: () => openScreen(context, ScreenId.vendorOrders),
        ),
        SCButton(
          'Tìm yêu cầu để báo giá',
          outlined: true,
          onPressed: () => openScreen(context, ScreenId.vendorRequests),
        ),
        const SCSection('Việc cần chú ý'),
        if (bakery.status != 'ACTIVE')
          const SCNotice(
            'Tiệm chưa ACTIVE. Hoàn thiện hồ sơ và gửi duyệt trước khi xuất bản catalog.',
            warning: true,
          ),
        SCCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Kiểm tra gói thuê và hồ sơ vận hành'),
              TextButton(
                onPressed: () =>
                    openScreen(context, ScreenId.vendorSubscription),
                child: const Text('Mở gói thuê'),
              ),
              TextButton(
                onPressed: () => openScreen(context, ScreenId.vendorProfile),
                child: const Text('Mở hồ sơ tiệm'),
              ),
            ],
          ),
        ),
        const SCNotice(
          'Chỉ số được tính từ fixture, không phải doanh thu hoặc dữ liệu hoạt động thật.',
        ),
      ],
    );
  }
}

class MetricGrid extends StatelessWidget {
  const MetricGrid({super.key, required this.items});
  final List<(String, String)> items;
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, c) {
      final count = items.any((item) => item.$2.length > 8) && c.maxWidth < 600
          ? 1
          : c.maxWidth >= 800
          ? 4
          : c.maxWidth >= 370 && MediaQuery.textScalerOf(context).scale(1) < 1.5
          ? 2
          : 1;
      return Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [
          for (final item in items)
            SizedBox(
              width: (c.maxWidth - (count - 1) * 12) / count,
              child: SCCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.$1, style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 12),
                    Text(
                      item.$2,
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ],
                ),
              ),
            ),
        ],
      );
    },
  );
}

class VendorProfilePage extends StatelessWidget {
  const VendorProfilePage({super.key});
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context),
        b = w.catalog.bakery(w.session.selectedBakeryId);
    return SweetCakeScaffold(
      screen: ScreenId.vendorProfile,
      children: [
        const BakerySelector(),
        SCSection(b.name, description: 'Membership OWNER · bản demo'),
        SCStatusBadge(b.status),
        SCCard(
          child: Column(
            children: [
              SCKeyValue('Địa chỉ', b.address),
              SCKeyValue('Khu vực', b.district),
              SCKeyValue('Giờ mở cửa', b.hours),
              SCKeyValue('Đơn tối thiểu', vnd(b.minimumOrder)),
              SCKeyValue('Phí giao', vnd(b.deliveryFee)),
            ],
          ),
        ),
        Text(b.description),
        SCButton(
          'Chỉnh sửa hồ sơ và vận hành',
          outlined: true,
          onPressed: () => showSCSheet(
            context,
            title: 'Hồ sơ tiệm local',
            child: BakeryEditor(bakery: b),
          ),
        ),
        if (b.status == 'DRAFT')
          SCButton(
            'Gửi hồ sơ vào hàng chờ local',
            onPressed: () => demoAction(context, () {
              if (b.name.isEmpty || b.address.isEmpty) {
                throw StateError('Cần tên và địa chỉ tiệm.');
              }
              b.status = 'PENDING_APPROVAL';
              w.catalog.changed();
            }),
          ),
        const SCSection('Thành viên và quyền'),
        const SCNotice(
          'Tài khoản demo giữ membership OWNER của hai tiệm. Không có thao tác mời thành viên hoặc cấp vai thật. Đổi tiệm ở bộ chọn để kiểm tra phạm vi dữ liệu.',
        ),
        SCButton(
          'Xem gói thuê',
          outlined: true,
          onPressed: () => openScreen(context, ScreenId.vendorSubscription),
        ),
      ],
    );
  }
}

class BakeryEditor extends StatefulWidget {
  const BakeryEditor({super.key, required this.bakery});
  final BakeryProfile bakery;
  @override
  State<BakeryEditor> createState() => _BakeryEditorState();
}

class _BakeryEditorState extends State<BakeryEditor> {
  late final fields = [
    widget.bakery.name,
    widget.bakery.description,
    widget.bakery.address,
    widget.bakery.district,
    widget.bakery.hours,
    '${widget.bakery.minimumOrder}',
    '${widget.bakery.deliveryFee}',
  ].map((s) => TextEditingController(text: s)).toList();
  final form = GlobalKey<FormState>();
  @override
  void dispose() {
    for (final c in fields) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < fields.length; i++)
          SCField(
            [
              'Tên tiệm',
              'Giới thiệu',
              'Địa chỉ',
              'Khu vực',
              'Giờ mở cửa',
              'Đơn tối thiểu (VND)',
              'Phí giao (VND)',
            ][i],
            controller: fields[i],
            lines: i == 1 ? 3 : 1,
            keyboardType: i >= 5 ? TextInputType.number : null,
            validator: i >= 5 ? moneyValidation : null,
          ),
        SCButton(
          'Lưu hồ sơ local',
          onPressed: () {
            if (!form.currentState!.validate()) return;
            final b = widget.bakery;
            b.name = fields[0].text;
            b.description = fields[1].text;
            b.address = fields[2].text;
            b.district = fields[3].text;
            b.hours = fields[4].text;
            b.minimumOrder = int.parse(fields[5].text);
            b.deliveryFee = int.parse(fields[6].text);
            DemoScope.of(context).catalog.changed();
            Navigator.pop(context);
          },
        ),
      ],
    ),
  );
}

class VendorRevenuePage extends StatelessWidget {
  const VendorRevenuePage({super.key});
  @override
  Widget build(BuildContext context) => SweetCakeScaffold(
    screen: ScreenId.vendorRevenue,
    children: [
      const BakerySelector(),
      const Icon(Icons.insights_outlined, size: 64),
      const SCSection(
        'Doanh thu tiệm chưa có nguồn dữ liệu',
        description: 'Bản UI dành sẵn vị trí báo cáo khi hợp đồng dữ liệu được xác nhận.',
      ),
      const SCNotice(
        'Backend chưa cung cấp API doanh thu, ví, rút tiền hoặc escrow cho tiệm. Không hiển thị số dư có thể rút, không cộng giá đơn thành tiền đã nhận.',
      ),
      SCButton(
        'Xem danh sách đơn local',
        outlined: true,
        onPressed: () => openScreen(context, ScreenId.vendorOrders),
      ),
      SCButton(
        'Xem chi phí gói thuê',
        outlined: true,
        onPressed: () => openScreen(context, ScreenId.vendorSubscription),
      ),
    ],
  );
}
