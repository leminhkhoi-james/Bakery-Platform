import 'package:flutter/material.dart';

import '../../core/widgets/common.dart';
import '../../core/utils/formatters.dart';
import '../../models/workflow.dart';
import '../../state/app_state.dart';

class VendorOrdersScreen extends StatefulWidget {
  const VendorOrdersScreen({super.key});
  @override
  State<VendorOrdersScreen> createState() => _VendorOrdersScreenState();
}

class _VendorOrdersScreenState extends State<VendorOrdersScreen> {
  String phase = 'pending', filter = 'all', query = '';
  Future<void> timeline(CakeOrder o) => showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Timeline ${o.id}'),
      content: SingleChildScrollView(child: Text(o.timeline.join('\n\n'))),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Đóng'),
        ),
      ],
    ),
  );
  Future<void> qc(CakeOrder o) => showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Ảnh kiểm tra thành phẩm'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CakePicture(o.image, height: 200, label: 'Ảnh QC mẫu'),
          const Text('Ảnh minh họa cục bộ · không tải ảnh lên server'),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Đóng'),
        ),
        FilledButton(
          onPressed: () {
            Navigator.pop(context);
            feedback(context, 'Đã mô phỏng gửi ảnh QC cho khách.');
          },
          child: const Text('Gửi ảnh QC mô phỏng'),
        ),
      ],
    ),
  );
  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final orders = state.repository.orders
        .where(
          (o) =>
              o.phase.name == phase &&
              '${o.id} ${o.customer} ${o.title}'.toLowerCase().contains(
                query.toLowerCase(),
              ) &&
              (filter == 'all' ||
                  (filter == 'urgent' ? o.urgent : o.category == filter)),
        )
        .toList();
    return PageBody(
      title: 'Quản lý đơn hàng',
      eyebrow: 'Bảng điều phối tiệm',
      children: [
        SearchField(
          hint: 'Mã đơn, khách, tên bánh...',
          onChanged: (v) => setState(() => query = v),
        ),
        FilterChips(
          values: {
            for (final p in OrderPhase.values.where(
              (p) => p != OrderPhase.cancelled,
            ))
              p.name:
                  '${p.label} (${state.repository.orders.where((o) => o.phase == p).length})',
          },
          selected: phase,
          onSelected: (v) => setState(() => phase = v),
        ),
        SelectField(
          label: 'Lọc đơn hàng',
          value: filter,
          options: const {
            'all': 'Tất cả',
            'urgent': 'Khẩn cấp',
            'birthday': 'Sinh nhật',
            'wedding': 'Tiệc cưới',
            'corporate': 'Doanh nghiệp',
          },
          onChanged: (v) => setState(() => filter = v),
        ),
        if (orders.isEmpty)
          const EmptyView(message: 'Không có đơn hàng trong cột này.'),
        for (final o in orders)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                CakePicture(o.image, height: 160, label: o.title),
                const SizedBox(height: 12),
                Text(o.title, style: Theme.of(context).textTheme.titleMedium),
                InfoRow(o.id, '${o.customer} · ${o.phone}'),
                InfoRow('Giao nhận', '${o.date}\n${o.address}'),
                InfoRow('Quy cách', o.size),
                InfoRow('Giá trị', vnd(o.price)),
                TextButton(
                  onPressed: () => timeline(o),
                  child: const Text('Xem timeline'),
                ),
                if (o.phase == OrderPhase.pending)
                  ActionButtons(
                    children: [
                      FilledButton(
                        onPressed: () =>
                            state.moveOrder(o, OrderPhase.scheduled),
                        child: const Text('Xác nhận nhận đơn'),
                      ),
                      TextButton(
                        onPressed: () async {
                          if (await confirm(
                            context,
                            'Từ chối đơn?',
                            'Hủy đơn và mô phỏng hoàn cọc. Không có giao dịch thật.',
                          )) {
                            state.moveOrder(o, OrderPhase.cancelled);
                          }
                        },
                        child: const Text('Từ chối đơn'),
                      ),
                    ],
                  ),
                if (o.phase == OrderPhase.scheduled)
                  FilledButton(
                    onPressed: () => state.moveOrder(o, OrderPhase.baking),
                    child: const Text('Bắt đầu làm bánh'),
                  ),
                if (o.phase == OrderPhase.baking) ...[
                  if (o.steps.isNotEmpty)
                    LinearProgressIndicator(
                      value:
                          o.steps.where((s) => s.done).length / o.steps.length,
                    ),
                  for (var i = 0; i < o.steps.length; i++)
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(o.steps[i].name),
                      value: o.steps[i].done,
                      onChanged: (_) => state.toggleStep(o, i),
                    ),
                  OutlinedButton(
                    onPressed: () => qc(o),
                    child: const Text('Ảnh kiểm tra chất lượng'),
                  ),
                  const SizedBox(height: 8),
                  FilledButton(
                    onPressed: () => state.moveOrder(o, OrderPhase.delivering),
                    child: const Text('Xong & đóng hộp'),
                  ),
                ],
                if (o.phase == OrderPhase.delivering) ...[
                  InfoRow(
                    'Tài xế & xe lạnh',
                    '${o.driver}\n${o.vehicle} · 4,8°C (mô phỏng)',
                  ),
                  OutlinedButton(
                    onPressed: () => showDialog<void>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Thông tin tài xế'),
                        content: Text(
                          '${o.driver}\n${o.driverPhone}\n${o.vehicle}\nMô phỏng · Không có vị trí GPS thật',
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Đóng'),
                          ),
                        ],
                      ),
                    ),
                    child: const Text('Thông tin giao hàng'),
                  ),
                  TextButton(
                    onPressed: () => feedback(
                      context,
                      'Liên hệ mô phỏng: ${o.driverPhone}. Không gọi điện thật.',
                    ),
                    child: const Text('Liên hệ tài xế'),
                  ),
                  ActionButtons(
                    children: [
                      FilledButton(
                        onPressed: () =>
                            state.moveOrder(o, OrderPhase.completed),
                        child: const Text('Giao thành công'),
                      ),
                      OutlinedButton(
                        onPressed: () => state.moveOrder(o, OrderPhase.pending),
                        child: const Text('Giao thất bại'),
                      ),
                    ],
                  ),
                ],
                if (o.phase == OrderPhase.completed)
                  InfoRow(
                    'Giải ngân mô phỏng',
                    vnd((o.price * 95 / 100).round()),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}
