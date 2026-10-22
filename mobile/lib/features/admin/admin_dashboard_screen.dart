import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/widgets/common.dart';
import '../../core/utils/formatters.dart';
import '../../models/accounts.dart';
import '../../models/catalog.dart';
import '../../state/app_state.dart';

class _AuditOrder {
  _AuditOrder(Json j)
    : id = textValue(j, 'id'),
      customer = textValue(j, 'customerName'),
      vendor = textValue(j, 'vendor'),
      title = textValue(j, 'cakeType'),
      amount = intValue(j, 'amount'),
      released = j['statusCode'] == 'released';
  final String id, customer, vendor, title;
  final int amount;
  bool released;
}

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});
  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  String period = 'month', query = '', cluster = 'all';
  List<VendorAccount>? queue;
  List<_AuditOrder>? audit;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final f = AppScope.of(context).fixtures;
    queue ??= f
        .rows('INITIAL_PENDING_BAKERIES')
        .map(VendorAccount.fromJson)
        .toList();
    audit ??= f
        .rows('INITIAL_ESCROW_AUDIT_ORDERS')
        .map(_AuditOrder.new)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final f = AppScope.of(context).fixtures;
    final metrics = Map<String, Object?>.from(
      (f.record('ADMIN_PERIOD_METRICS')[period]) as Map,
    );
    final pending = queue!
        .where(
          (v) =>
              '${v.name} ${v.location}'.toLowerCase().contains(
                query.toLowerCase(),
              ) &&
              (cluster == 'all' ||
                  (cluster == 'hcm' &&
                      (v.location.contains('HCM') ||
                          v.location.contains('Thủ Đức') ||
                          v.location.contains('Thảo Điền'))) ||
                  (cluster == 'hn' && v.location.contains('Hà Nội')) ||
                  (cluster == 'dn' && v.location.contains('Đà Nẵng'))),
        )
        .toList();
    final orders = audit!
        .where(
          (o) => '${o.id} ${o.customer} ${o.vendor}'.toLowerCase().contains(
            query.toLowerCase(),
          ),
        )
        .toList();
    return PageBody(
      title: 'Tổng quan hệ thống',
      eyebrow: 'Master Admin',
      subtitle: 'Chỉ số và thao tác quản trị được mô phỏng từ frontend.',
      children: [
        FilterChips(
          values: const {
            'today': 'Hôm nay',
            '7days': '7 ngày',
            'month': 'Tháng này',
            'quarter': 'Quý này',
          },
          selected: period,
          onSelected: (v) => setState(() => period = v),
        ),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              InfoRow('GMV toàn sàn', textValue(metrics, 'gmv')),
              InfoRow('Phí nền tảng', textValue(metrics, 'fee')),
              InfoRow('Đơn hàng', textValue(metrics, 'orders')),
              InfoRow('Tăng trưởng', textValue(metrics, 'growth')),
            ],
          ),
        ),
        ActionButtons(
          children: [
            FilledButton(
              onPressed: () => go(context, Destination.adminOrders),
              child: const Text('Quản trị đơn hàng'),
            ),
            OutlinedButton(
              onPressed: () => go(context, Destination.adminVendors),
              child: const Text('Duyệt tiệm bánh'),
            ),
            TextButton(
              onPressed: () => go(context, Destination.adminUsers),
              child: const Text('Quản trị người dùng'),
            ),
          ],
        ),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SectionTitle('Doanh thu theo danh mục'),
              for (final metric in [
                ('Sinh nhật & Tạo hình 3D', .38),
                ('Bánh cưới', .24),
                ('Bento', .20),
                ('Mousse & bánh lạnh', .18),
              ])
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${metric.$1} · ${(metric.$2 * 100).round()}%'),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: metric.$2,
                        minHeight: 6,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 12),
              const Text('Phân bổ tĩnh theo bản demo web.'),
            ],
          ),
        ),
        SearchField(
          hint: 'Tìm tiệm, mã đơn, khách hàng...',
          onChanged: (v) => setState(() => query = v),
        ),
        SelectField(
          label: 'Cụm khu vực',
          value: cluster,
          options: const {
            'all': 'Tất cả',
            'hcm': 'TP. Hồ Chí Minh',
            'hn': 'Hà Nội',
            'dn': 'Đà Nẵng',
          },
          onChanged: (v) => setState(() => cluster = v),
        ),
        const SectionTitle('Hàng chờ duyệt tiệm bánh'),
        if (pending.isEmpty)
          const EmptyView(message: 'Không có tiệm đang chờ trong bộ lọc.'),
        for (final v in pending)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(v.name, style: Theme.of(context).textTheme.titleMedium),
                Text(v.location),
                Text(v.specialty),
                ActionButtons(
                  children: [
                    OutlinedButton(
                      onPressed: () => showDialog<void>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: Text(v.name),
                          content: Text(
                            '${v.location}\n${v.specialty}\nHồ sơ mẫu chờ duyệt.',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Đóng'),
                            ),
                          ],
                        ),
                      ),
                      child: const Text('Xem hồ sơ'),
                    ),
                    FilledButton(
                      onPressed: () => setState(
                        () => queue!.removeWhere((x) => x.id == v.id),
                      ),
                      child: const Text('Phê duyệt mô phỏng'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        const SectionTitle('Đơn hàng giá trị cao'),
        if (orders.isEmpty) const EmptyView(),
        for (final o in orders)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(o.id, style: Theme.of(context).textTheme.titleMedium),
                Text('${o.customer} · ${o.vendor}'),
                Text(o.title),
                InfoRow('Giá trị', vnd(o.amount)),
                StatusPill(o.released ? 'Đã giải ngân' : 'Khóa cọc 100%'),
                ActionButtons(
                  children: [
                    TextButton(
                      onPressed: () => showDialog<void>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: Text('Giao dịch ${o.id}'),
                          content: Text(
                            '${o.vendor}\n${vnd(o.amount)}\nPhí 5% · Giá trị mô phỏng',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Đóng'),
                            ),
                          ],
                        ),
                      ),
                      child: const Text('Kiểm toán'),
                    ),
                    FilledButton(
                      onPressed: o.released
                          ? null
                          : () async {
                              if (await confirm(
                                context,
                                'Giải ngân mô phỏng?',
                                'Không thực hiện chuyển tiền thật.',
                              )) {
                                if (mounted) setState(() => o.released = true);
                              }
                            },
                      child: const Text('Giải ngân mô phỏng'),
                    ),
                  ],
                ),
              ],
            ),
          ),
      ],
    );
  }
}
