import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/chat_sheet.dart';
import '../../core/utils/formatters.dart';
import '../../models/workflow.dart';
import '../../state/app_state.dart';

class RfqScreen extends StatefulWidget {
  const RfqScreen({super.key});
  @override
  State<RfqScreen> createState() => _RfqScreenState();
}

class _RfqScreenState extends State<RfqScreen> {
  String query = '',
      category = 'all',
      budget = 'all',
      distance = 'all',
      urgency = 'all';
  bool matches(CakeRequest r) {
    if (!'${r.id} ${r.title} ${r.customer} ${r.description}'
        .toLowerCase()
        .contains(query.toLowerCase())) {
      return false;
    }
    if (category != 'all' && r.category != category) return false;
    if (budget == 'under500' && r.budget > 500000) return false;
    if (budget == '500to1500' && (r.budget < 500000 || r.budget > 1500000)) {
      return false;
    }
    if (budget == 'over1500' && r.budget <= 1500000) return false;
    if (distance == 'under5' && r.distance > 5) return false;
    if (distance == 'under10' && r.distance > 10) return false;
    if (urgency == 'urgent' && !r.urgent) return false;
    if (urgency == 'today' && !r.date.contains('Hôm nay')) return false;
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final requests = state.repository.requests
        .where((r) => !state.rejectedRequests.contains(r.id) && matches(r))
        .toList();
    return PageBody(
      title: 'Chợ yêu cầu báo giá',
      eyebrow: 'RFQ Marketplace',
      subtitle: '${requests.length} yêu cầu phù hợp',
      children: [
        SearchField(
          hint: 'Tìm mã, khách hàng, mẫu bánh...',
          onChanged: (v) => setState(() => query = v),
        ),
        ExpansionTile(
          title: const Text('Lọc yêu cầu'),
          children: [
            SelectField(
              label: 'Danh mục',
              value: category,
              options: {
                'all': 'Tất cả',
                for (final r in state.repository.requests)
                  r.category: r.category,
              },
              onChanged: (v) => setState(() => category = v),
            ),
            const SizedBox(height: 12),
            SelectField(
              label: 'Ngân sách',
              value: budget,
              options: const {
                'all': 'Tất cả',
                'under500': 'Dưới 500.000đ',
                '500to1500': '500.000đ – 1.500.000đ',
                'over1500': 'Trên 1.500.000đ',
              },
              onChanged: (v) => setState(() => budget = v),
            ),
            const SizedBox(height: 12),
            SelectField(
              label: 'Khoảng cách',
              value: distance,
              options: const {
                'all': 'Tất cả',
                'under5': 'Trong 5 km',
                'under10': 'Trong 10 km',
              },
              onChanged: (v) => setState(() => distance = v),
            ),
            const SizedBox(height: 12),
            SelectField(
              label: 'Độ khẩn',
              value: urgency,
              options: const {
                'all': 'Tất cả',
                'urgent': 'Khẩn cấp',
                'today': 'Nhận hôm nay',
              },
              onChanged: (v) => setState(() => urgency = v),
            ),
          ],
        ),
        if (requests.isEmpty) const EmptyView(),
        for (final r in requests)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                CakePicture(r.image, height: 190, label: r.title),
                const SizedBox(height: 12),
                Text(r.title, style: Theme.of(context).textTheme.titleMedium),
                StatusPill(r.stage.label),
                InfoRow(r.id, '${r.customer}\n${vnd(r.budget)}'),
                InfoRow(
                  'Giao nhận',
                  '${r.date} · ${r.time}\n${r.distance} km · ${r.address}',
                ),
                ActionButtons(
                  children: [
                    FilledButton(
                      onPressed: () => go(context, Destination.vendorQuote, r),
                      child: const Text('Soạn báo giá'),
                    ),
                    OutlinedButton(
                      onPressed: () => showDialog<void>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: Text(r.id),
                          content: SingleChildScrollView(
                            child: Text(
                              '${r.description}\n\n${r.size}\n${r.flavor}\nLời chúc: ${r.message}',
                            ),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Đóng'),
                            ),
                          ],
                        ),
                      ),
                      child: const Text('Chi tiết RFQ'),
                    ),
                    TextButton(
                      onPressed: () =>
                          openChat(context, 'rfq-${r.id}', r.customer),
                      child: const Text('Nhắn khách'),
                    ),
                    TextButton(
                      onPressed: () async {
                        if (await confirm(
                          context,
                          'Từ chối yêu cầu?',
                          'Ẩn yêu cầu khỏi danh sách tiệm trong phiên mô phỏng.',
                        )) {
                          state.rejectedRequests.add(r.id);
                          state.changed();
                        }
                      },
                      child: const Text('Không nhận đơn'),
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
