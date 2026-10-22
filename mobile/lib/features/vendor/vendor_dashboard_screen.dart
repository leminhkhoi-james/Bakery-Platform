import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/form_sheet.dart';
import '../../core/utils/formatters.dart';
import '../../models/workflow.dart';
import '../../state/app_state.dart';

class VendorDashboardScreen extends StatelessWidget {
  const VendorDashboardScreen({super.key});
  Future<void> quickQuote(BuildContext context, CakeRequest request) async {
    final state = AppScope.of(context);
    final result = await editForm(context, 'Báo giá nhanh ${request.id}', [
      FieldSpec(
        'price',
        'Giá chào thầu (VNĐ)',
        initial: '${request.budget}',
        keyboard: TextInputType.number,
        validate: (v) => parseMoney(v) > 0 ? null : 'Giá phải lớn hơn 0.',
      ),
      const FieldSpec('note', 'Lời nhắn & cam kết', lines: 3, required: false),
    ], submit: 'Gửi báo giá mô phỏng');
    if (result == null || !context.mounted) return;
    state.submitQuote(
      Quote(
        id: state.repository.nextId('bid'),
        rfqId: request.id,
        bakery: state.settings.values['shopName'] ?? 'Tiệm bánh của bạn',
        price: parseMoney(result['price']!),
        pitch: result['note']!,
        duration: '6 giờ hoàn thiện',
        durationRank: 99,
      ),
    );
    feedback(context, 'Đã gửi báo giá nhanh trong phiên mô phỏng.');
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context), orders = state.repository.orders;
    return PageBody(
      title: 'Xin chào,\nLa Crème Pâtisserie',
      eyebrow: 'Xưởng bánh đối tác',
      subtitle: 'Tổng quan vận hành · Dữ liệu mô phỏng',
      children: [
        Panel(
          child: SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Tiệm đang nhận đơn'),
            subtitle: const Text('Trạng thái mô phỏng'),
            value: state.receiving,
            onChanged: (v) {
              state.receiving = v;
              state.changed();
            },
          ),
        ),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              InfoRow(
                'Đơn chờ xác nhận',
                '${orders.where((o) => o.phase == OrderPhase.pending).length} đơn',
              ),
              InfoRow(
                'Yêu cầu báo giá',
                '${state.repository.requests.length} yêu cầu',
              ),
              InfoRow(
                'Đang chế tác',
                '${orders.where((o) => o.phase == OrderPhase.baking).length} đơn',
              ),
              InfoRow('Số dư ví mô phỏng', vnd(state.balance)),
            ],
          ),
        ),
        ActionButtons(
          children: [
            FilledButton(
              onPressed: () => go(context, Destination.vendorRfq),
              child: const Text('Xem yêu cầu báo giá'),
            ),
            OutlinedButton(
              onPressed: () => go(context, Destination.vendorCatalog),
              child: const Text('Quản lý mẫu bánh'),
            ),
            OutlinedButton(
              onPressed: () => go(context, Destination.vendorOrders),
              child: const Text('Quản lý đơn hàng'),
            ),
            TextButton(
              onPressed: () => go(context, Destination.vendorRevenue),
              child: const Text('Doanh thu & Escrow'),
            ),
          ],
        ),
        const SectionTitle('RFQ cần xử lý ngay'),
        for (final r
            in state.repository.requests
                .where((r) => !state.rejectedRequests.contains(r.id))
                .take(3))
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.title, style: Theme.of(context).textTheme.titleMedium),
                InfoRow(r.id, vnd(r.budget)),
                ActionButtons(
                  children: [
                    FilledButton(
                      onPressed: () => quickQuote(context, r),
                      child: const Text('Báo giá nhanh'),
                    ),
                    TextButton(
                      onPressed: () {
                        state.rejectedRequests.add(r.id);
                        state.changed();
                      },
                      child: const Text('Bỏ qua'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        const SectionTitle('Tiến độ đơn hàng hôm nay'),
        for (final o in orders.take(3))
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(o.title),
                StatusPill(o.phase.label),
                TextButton(
                  onPressed: () => go(context, Destination.vendorOrders),
                  child: const Text('Xem quản lý đơn'),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
