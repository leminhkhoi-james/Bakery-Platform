import 'package:flutter/material.dart';

import '../../core/widgets/common.dart';
import '../../core/utils/formatters.dart';
import '../../models/workflow.dart';
import '../../state/app_state.dart';

class AdminOrdersScreen extends StatefulWidget {
  const AdminOrdersScreen({super.key});
  @override
  State<AdminOrdersScreen> createState() => _AdminOrdersScreenState();
}

class _AdminOrdersScreenState extends State<AdminOrdersScreen> {
  String phase = 'all', query = '', type = 'all', price = 'all';
  bool matches(CakeOrder o) {
    if (!'${o.id} ${o.title} ${o.customer} ${o.bakery}'.toLowerCase().contains(
      query.toLowerCase(),
    )) {
      return false;
    }
    if (phase == 'completed' && !o.released) return false;
    if (phase == 'delivered' && o.phase != OrderPhase.completed) return false;
    if (['baking', 'delivering'].contains(phase) && o.phase.name != phase) {
      return false;
    }
    if (type == 'catalog' && o.orderType != 'catalog') return false;
    if (type == 'bespoke' && !['rfq', 'bespoke'].contains(o.orderType)) {
      return false;
    }
    if (price == 'low' && o.price >= 1000000) return false;
    if (price == 'mid' && (o.price < 1000000 || o.price > 3000000)) {
      return false;
    }
    if (price == 'high' && o.price <= 3000000) return false;
    return true;
  }

  Future<void> release(CakeOrder o) async {
    final state = AppScope.of(context);
    if (!await confirm(
      context,
      'Giải ngân ký quỹ Escrow?',
      'Chỉ mở cọc trong dữ liệu mẫu cho đơn ${o.id}. Không chuyển tiền thật.',
    )) {
      return;
    }
    state.release(o);
    if (mounted) feedback(context, 'Đã giải ngân trong dữ liệu mô phỏng.');
  }

  Future<void> detail(CakeOrder o) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (context) => FractionallySizedBox(
      heightFactor: .8,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Đơn hàng ${o.id}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            CakePicture(o.image, height: 180),
            InfoRow('Bánh', o.title),
            InfoRow('Khách hàng', '${o.customer}\n${o.phone}\n${o.address}'),
            InfoRow('Tiệm bánh', o.bakery),
            InfoRow('Giá trị', vnd(o.price)),
            StatusPill(o.phase.label),
            InfoRow('Escrow', o.released ? 'Đã giải ngân' : 'Đang khóa cọc'),
            for (final event in o.timeline) Text(event),
            const SizedBox(height: 16),
            if (!o.released)
              FilledButton(
                onPressed: () {
                  Navigator.pop(context);
                  release(o);
                },
                child: const Text('Giải ngân cọc mô phỏng'),
              ),
          ],
        ),
      ),
    ),
  );
  @override
  Widget build(BuildContext context) {
    final orders = AppScope.of(context).allAdminOrders.where(matches).toList();
    return PageBody(
      title: 'Đơn hàng & Escrow Vault',
      eyebrow: 'Master Admin',
      subtitle: 'Giám sát và giải ngân chỉ trong môi trường mô phỏng.',
      children: [
        SearchField(
          hint: 'Mã đơn, khách, tiệm, mẫu bánh...',
          onChanged: (v) => setState(() => query = v),
        ),
        FilterChips(
          values: const {
            'all': 'Tất cả',
            'baking': 'Đang làm',
            'delivering': 'Đang giao',
            'delivered': 'Đã giao',
            'completed': 'Đã giải ngân',
          },
          selected: phase,
          onSelected: (v) => setState(() => phase = v),
        ),
        SelectField(
          label: 'Loại đơn',
          value: type,
          options: const {
            'all': 'Tất cả đơn',
            'bespoke': 'Bánh đặt riêng',
            'catalog': 'Bánh có sẵn',
          },
          onChanged: (v) => setState(() => type = v),
        ),
        SelectField(
          label: 'Phân khúc',
          value: price,
          options: const {
            'all': 'Mọi phân khúc',
            'low': 'Dưới 1.000.000đ',
            'mid': '1.000.000đ – 3.000.000đ',
            'high': 'Trên 3.000.000đ',
          },
          onChanged: (v) => setState(() => price = v),
        ),
        TextButton(
          onPressed: () => feedback(
            context,
            'Web hiển thị 2 đơn đã được hỗ trợ hoàn cọc. Đây là thông báo mẫu.',
          ),
          child: const Text('Hủy / hoàn cọc'),
        ),
        if (orders.isEmpty) const EmptyView(),
        for (final o in orders)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(o.id, style: Theme.of(context).textTheme.titleMedium),
                Text(o.title),
                InfoRow('Khách · Tiệm', '${o.customer}\n${o.bakery}'),
                InfoRow('Giá trị', vnd(o.price)),
                StatusPill(o.phase.label),
                const SizedBox(height: 8),
                StatusPill(o.released ? 'Đã giải ngân' : 'Khóa cọc'),
                const SizedBox(height: 12),
                ActionButtons(
                  children: [
                    OutlinedButton(
                      onPressed: () => detail(o),
                      child: const Text('Chi tiết'),
                    ),
                    if (!o.released)
                      FilledButton(
                        onPressed: () => release(o),
                        child: const Text('Giải ngân cọc'),
                      ),
                    if (o.phase == OrderPhase.delivering)
                      TextButton(
                        onPressed: () => showDialog<void>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Theo dõi giao hàng mẫu'),
                            content: Text(
                              '${o.driver}\n${o.vehicle}\n4,8°C · Còn khoảng 25 phút\nSơ đồ mô phỏng, không có GPS thật.',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: const Text('Đóng'),
                              ),
                            ],
                          ),
                        ),
                        child: const Text('Kiểm tra GPS mẫu'),
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
