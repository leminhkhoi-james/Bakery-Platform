import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/phase5_widgets.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

class LiveReviewSection extends StatelessWidget {
  const LiveReviewSection(
    this.order, {
    super.key,
    required this.reload,
    this.admin = false,
  });
  final Json order;
  final VoidCallback reload;
  final bool admin;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context), id = '${order['id']}';
    final review = order['review'] == null ? null : object(order['review']);
    final mine =
        order['customerId'] == w.session.user?['id'] &&
        w.session.hasRole('CUSTOMER');
    final deleted = review?['status'] == 'DELETED';
    Future<void> edit() async {
      await openLiveForm<Json>(
        context,
        title: review == null ? 'Đánh giá bánh' : 'Sửa đánh giá',
        action: 'Gửi đánh giá',
        initial: {
          'rating': '${review?['rating'] ?? 5}',
          'comment': review?['comment'] ?? '',
        },
        fields: const [
          FormFieldSpec(
            'rating',
            'Số sao',
            kind: FieldKind.choice,
            required: true,
            choices: ['1', '2', '3', '4', '5'],
            choiceLabels: {
              '1': '1 sao',
              '2': '2 sao',
              '3': '3 sao',
              '4': '4 sao',
              '5': '5 sao',
            },
          ),
          FormFieldSpec('comment', 'Nhận xét', maximum: 5000),
        ],
        save: (j) => review == null
            ? w.reviews.create(id, int.parse(j['rating']), j['comment'] ?? '')
            : w.reviews.update(id, int.parse(j['rating']), j['comment'] ?? ''),
        recoveryBuilder: (formContext, values, failure) => LiveCommand(
          'Đọc lại đánh giá',
          outlined: true,
          run: () async {
            final current = await w.orders.detail(id);
            final confirmed = current['review'];
            if (current['customerId'] != w.session.user?['id'] ||
                confirmed == null) {
              throw const ApiFailure(
                0,
                'Chưa tìm thấy đánh giá đã lưu. Quay lại đơn và làm mới trước khi gửi lại.',
              );
            }
            final saved = object(confirmed);
            if (saved['orderId'] != id ||
                saved['rating'] != int.tryParse('${values['rating']}') ||
                (saved['comment'] ?? '') !=
                    '${values['comment'] ?? ''}'.trim()) {
              throw const ApiFailure(
                0,
                'Nội dung đã lưu chưa khớp lần gửi này. Quay lại đơn để kiểm tra trước khi chỉnh sửa.',
              );
            }
            if (formContext.mounted) {
              await LiveFormPage.completeRecovery<Json>(formContext, saved);
            }
          },
        ),
      );
      reload();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SCSection('Đánh giá đơn bánh'),
        if (review == null)
          Text(
            order['status'] == 'COMPLETED'
                ? 'Đơn đã hoàn tất, chưa có đánh giá.'
                : 'Bạn có thể đánh giá sau khi đơn hoàn tất.',
          ),
        if (review != null) ...[
          SCStatusBadge('${review['status']}'),
          if (review['status'] == 'PENDING')
            const SCNotice(
              'Đánh giá đã được lưu và đang chờ duyệt. Nội dung chưa được công khai.',
            ),
          if (!deleted) ...[
            Text(
              '${review['rating']} / 5 sao',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            Text('${review['comment'] ?? ''}'),
          ],
          Text('Cập nhật: ${displayInstant(review['updatedAt'])}'),
        ],
        if (mine &&
            order['status'] == 'COMPLETED' &&
            (review == null ||
                ['PENDING', 'PUBLISHED'].contains(review['status'])))
          SCButton(
            review == null ? 'Viết đánh giá' : 'Sửa đánh giá',
            key: const ValueKey('review-edit'),
            onPressed: edit,
          ),
        if (mine && review != null && !deleted)
          LiveCommand(
            'Xóa đánh giá',
            outlined: true,
            run: () async {
              if (await confirmLive(context, 'Xóa đánh giá?')) {
                await w.reviews.delete(id);
              }
            },
            after: reload,
          ),
        if (admin && review != null && !deleted && w.session.hasRole('ADMIN'))
          LiveCommand(
            review['status'] == 'PUBLISHED'
                ? 'Ẩn đánh giá'
                : 'Công khai đánh giá',
            run: () async {
              if (await confirmLive(context, 'Đổi trạng thái đánh giá?')) {
                await w.reviews.moderate(
                  id,
                  review['status'] == 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED',
                );
              }
            },
            after: reload,
          ),
      ],
    );
  }
}
