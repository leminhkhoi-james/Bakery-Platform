import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/form_sheet.dart';
import '../../core/widgets/chat_sheet.dart';
import '../../core/utils/formatters.dart';
import '../../models/workflow.dart';
import '../../state/app_state.dart';

class BiddingScreen extends StatefulWidget {
  const BiddingScreen({super.key});
  @override
  State<BiddingScreen> createState() => _BiddingScreenState();
}

class _BiddingScreenState extends State<BiddingScreen> {
  String sort = 'all';
  final declined = <String>{};
  Future<void> cancel() async {
    final state = AppScope.of(context);
    final result = await editForm(context, 'Hủy yêu cầu RFQ', [
      const FieldSpec(
        'reason',
        'Lý do hủy',
        initial: 'Đã tìm được phương án khác',
        options: {
          'Đã tìm được phương án khác': 'Đã tìm được phương án khác',
          'Muốn thay đổi mẫu thiết kế / ngân sách':
              'Muốn thay đổi mẫu thiết kế / ngân sách',
          'Hoãn / Hủy lịch tiệc sinh nhật': 'Hoãn / Hủy lịch tiệc sinh nhật',
          'Lý do khác': 'Lý do khác',
        },
      ),
    ], submit: 'Xác nhận hủy');
    if (result == null || !mounted) return;
    state.requestStage(RfqStage.cancelled);
    feedback(context, 'Đã hủy yêu cầu mô phỏng: ${result['reason']}');
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context), request = state.activeRequest;
    if (request == null) {
      return PageBody(
        title: 'Sàn so sánh giá',
        children: [
          EmptyView(
            message: 'Bạn chưa có yêu cầu bánh.',
            action: FilledButton(
              onPressed: () => go(context, Destination.studio),
              child: const Text('Thiết kế bánh'),
            ),
          ),
        ],
      );
    }
    final quotes = [...state.repository.quotesFor(request.id)];
    if (sort == 'lowest') quotes.sort((a, b) => a.price.compareTo(b.price));
    if (sort == 'fastest') {
      quotes.sort((a, b) => a.durationRank.compareTo(b.durationRank));
    }
    final open = [RfqStage.open, RfqStage.quoted].contains(request.stage);
    return PageBody(
      title: 'Sàn so sánh báo giá',
      eyebrow: request.id,
      subtitle: 'Các báo giá và thao tác trong phiên đều là dữ liệu mô phỏng.',
      children: [
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              CakePicture(request.image, height: 210, label: request.title),
              const SizedBox(height: 12),
              Text(
                request.title,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              StatusPill(request.stage.label),
              InfoRow('Ngân sách', vnd(request.budget)),
              InfoRow(
                'Kích thước & hương vị',
                '${request.size}\n${request.flavor}',
              ),
              InfoRow(
                'Giao nhận',
                '${request.date} · ${request.time}\n${request.address}',
              ),
              InfoRow('Ghi chú', request.description),
              if (open)
                ActionButtons(
                  children: [
                    OutlinedButton(
                      onPressed: () => go(context, Destination.studio, request),
                      child: const Text('Chỉnh sửa yêu cầu'),
                    ),
                    TextButton(
                      onPressed: cancel,
                      child: const Text('Hủy yêu cầu'),
                    ),
                  ],
                ),
              if ([
                RfqStage.expired,
                RfqStage.closed,
                RfqStage.cancelled,
              ].contains(request.stage))
                FilledButton(
                  onPressed: () {
                    state.requestStage(RfqStage.quoted);
                    declined.clear();
                    feedback(
                      context,
                      'Đã mở lại / gia hạn yêu cầu mô phỏng thêm 24 giờ.',
                    );
                  },
                  child: Text(
                    request.stage == RfqStage.expired
                        ? 'Gia hạn 24 giờ'
                        : 'Mở lại yêu cầu',
                  ),
                ),
              if (state.acceptedQuote != null)
                FilledButton(
                  onPressed: () => go(context, Destination.payment),
                  child: const Text('Tiếp tục thanh toán'),
                ),
            ],
          ),
        ),
        ExpansionTile(
          title: const Text('Kịch bản thử nghiệm'),
          subtitle: const Text('Giữ bảng mô phỏng có sẵn trên web'),
          children: [
            Wrap(
              spacing: 6,
              children: [
                for (final stage in RfqStage.values)
                  ActionChip(
                    label: Text(stage.label),
                    onPressed: () => state.simulateRequestStage(stage),
                  ),
              ],
            ),
            if (state.acceptedQuote != null)
              ActionButtons(
                children: [
                  OutlinedButton(
                    onPressed: () {
                      state.requestStage(RfqStage.confirmed);
                      go(context, Destination.payment);
                    },
                    child: const Text('Tiệm xác nhận (mô phỏng)'),
                  ),
                  TextButton(
                    onPressed: () {
                      declined.add(state.acceptedQuote!.id);
                      state.declineAcceptedQuote();
                    },
                    child: const Text('Tiệm từ chối (mô phỏng)'),
                  ),
                ],
              ),
            TextButton(
              onPressed: () {
                declined.clear();
                state.acceptedQuote = null;
                state.requestStage(RfqStage.quoted);
              },
              child: const Text('Đặt lại luồng thử nghiệm'),
            ),
          ],
        ),
        const SectionTitle('Báo giá từ các tiệm bánh'),
        FilterChips(
          values: const {
            'all': 'Tất cả',
            'lowest': 'Giá thấp nhất',
            'fastest': 'Nhanh nhất',
          },
          selected: sort,
          onSelected: (v) => setState(() => sort = v),
        ),
        if (quotes.isEmpty)
          const EmptyView(
            message: 'Chưa có tiệm bánh nào gửi báo giá. Bạn có thể sang cổng tiệm bánh để gửi báo giá mô phỏng.',
          ),
        for (final q in quotes)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(q.bakery, style: Theme.of(context).textTheme.titleLarge),
                Text('★ ${q.rating} · ${q.duration}'),
                const SizedBox(height: 8),
                Text(
                  vnd(q.price),
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(q.pitch),
                for (final item in q.packages)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text('✓ $item'),
                  ),
                const SizedBox(height: 16),
                ActionButtons(
                  children: [
                    FilledButton(
                      onPressed: open && !declined.contains(q.id)
                          ? () {
                              state.acceptQuote(q);
                              feedback(
                                context,
                                'Đã chọn tiệm trong dữ liệu mô phỏng.',
                              );
                              go(context, Destination.payment);
                            }
                          : null,
                      child: const Text('Chọn tiệm này'),
                    ),
                    OutlinedButton(
                      onPressed: () => go(context, Destination.quote, q),
                      child: const Text('Chi tiết'),
                    ),
                    TextButton(
                      onPressed: () =>
                          openChat(context, 'quote-${q.id}', q.bakery),
                      child: const Text('Trao đổi với tiệm'),
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
