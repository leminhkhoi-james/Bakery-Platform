import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/router/destination.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/chat_sheet.dart';
import '../../core/widgets/form_sheet.dart';
import '../../models/workflow.dart';
import '../../state/app_state.dart';

class QuoteScreen extends StatelessWidget {
  const QuoteScreen({super.key, this.quote});
  final Quote? quote;
  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final q = quote ?? state.fixtures.quotes.first;
    final request = state.repository.requests
        .where((r) => r.id == q.rfqId)
        .firstOrNull;
    return PageBody(
      title: q.bakery,
      eyebrow: 'Báo giá nghệ nhân',
      subtitle: '★ ${q.rating} · ${q.duration}',
      children: [
        CakePicture(
          request?.image ?? q.image,
          height: 280,
          label: 'Thiết kế tham chiếu',
        ),
        Text(vnd(q.price), style: Theme.of(context).textTheme.headlineMedium),
        const SectionTitle('Bảng thông số kỹ thuật đề xuất'),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              InfoRow(
                'Cốt bánh',
                q.flavor.isEmpty
                    ? (request?.flavor ?? 'Chiffon Vani Dâu Tây')
                    : q.flavor,
              ),
              const InfoRow(
                'Lớp phủ & kem lót',
                'Kem tươi ít ngọt · Fondant tạo hình 3D',
              ),
              InfoRow(
                'Kích thước & khẩu phần',
                q.size.isEmpty
                    ? (request?.size ?? '2 Tầng (20cm + 14cm)')
                    : q.size,
              ),
              InfoRow('Thông điệp', request?.message ?? ''),
              InfoRow(
                'Giao nhận',
                '${request?.date ?? ''} · ${request?.time ?? ''}',
              ),
            ],
          ),
        ),
        const SectionTitle('Đối chiếu thiết kế & thực tế thi công'),
        for (final image in q.samples)
          CakePicture(image, height: 200, label: 'Ảnh mẫu tiệm từng làm'),
        if (q.samples.isEmpty)
          const Text(
            'Ảnh mẫu và cam kết giữ theo báo giá web; không phải ảnh sản xuất thực tế trong phiên này.',
          ),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(q.pitch),
              const Divider(),
              for (final item in q.packages) Text('✓ $item'),
            ],
          ),
        ),
        FilledButton(
          onPressed: () async {
            final yes = await confirm(
              context,
              'Xác nhận đặt cọc Escrow',
              'Chọn báo giá này trong dữ liệu mô phỏng. Không chuyển tiền hay giữ cọc thật.',
            );
            if (!context.mounted || !yes) return;
            try {
              state.acceptQuote(q);
              go(context, Destination.payment);
            } on StateError catch (e) {
              feedback(context, e.message.toString());
            }
          },
          child: const Text('Xác nhận chọn tiệm & đặt cọc'),
        ),
        OutlinedButton(
          onPressed: () => openChat(context, 'quote-${q.id}', q.bakery),
          child: const Text('Nhắn bếp trưởng'),
        ),
        OutlinedButton(
          onPressed: () async {
            final result = await editForm(
              context,
              'Điều chỉnh thông số với ${q.bakery}',
              [const FieldSpec('note', 'Yêu cầu điều chỉnh', lines: 4)],
              submit: 'Gửi yêu cầu mô phỏng',
            );
            if (result == null || !context.mounted) return;
            state.sendChat('quote-${q.id}', result['note']!);
            feedback(
              context,
              'Đã lưu yêu cầu điều chỉnh trong hội thoại mô phỏng.',
            );
          },
          child: const Text('Yêu cầu điều chỉnh'),
        ),
        TextButton(
          onPressed: () async {
            await Clipboard.setData(
              ClipboardData(text: 'SweetCake · ${q.bakery} · ${vnd(q.price)}'),
            );
            if (context.mounted) {
              feedback(context, 'Đã sao chép tóm tắt báo giá.');
            }
          },
          child: const Text('Sao chép chia sẻ báo giá'),
        ),
      ],
    );
  }
}
