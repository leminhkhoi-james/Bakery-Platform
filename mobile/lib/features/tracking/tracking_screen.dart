import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/widgets/common.dart';
import '../../core/widgets/chat_sheet.dart';
import '../../core/widgets/form_sheet.dart';
import '../../core/utils/formatters.dart';
import '../../models/workflow.dart';
import '../../state/app_state.dart';
import 'order_dialogs.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});
  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  String scenario = 'normal';
  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context), order = state.activeOrder;
    if (order == null) {
      return const PageBody(
        title: 'Theo dõi đơn hàng',
        children: [EmptyView(message: 'Chưa có đơn hàng hiện tại.')],
      );
    }
    final cancelled = order.phase == OrderPhase.cancelled;
    return PageBody(
      title: 'Hành trình chiếc bánh',
      eyebrow: order.id,
      subtitle: 'Timeline, ảnh và vị trí bên dưới là dữ liệu mô phỏng.',
      children: [
        StatusPill(order.phase.label),
        if (cancelled)
          const Panel(
            child: Text(
              'Đơn mô phỏng đã hủy. Xem chính sách hoàn cọc trong lịch sử đơn.',
            ),
          ),
        if (scenario != 'normal')
          Panel(
            child: Text(
              scenario == 'overdue'
                  ? 'CẢNH BÁO GIAO TRỄ · Điều phối mô phỏng'
                  : 'TRANH CHẤP KÝ QUỸ · Hồ sơ mô phỏng đang được thụ lý',
            ),
          ),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              CakePicture(order.image, height: 210, label: order.title),
              const SizedBox(height: 12),
              Text(order.title, style: Theme.of(context).textTheme.titleLarge),
              InfoRow('Xưởng thực hiện', order.bakery),
              InfoRow('Quy cách', order.size),
              InfoRow('Giao nhận', order.date),
              InfoRow('Địa chỉ', order.address),
              InfoRow('Lời chúc', order.message),
              InfoRow('Giá trị', vnd(order.price)),
              TextButton.icon(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: order.id));
                  if (context.mounted) feedback(context, 'Đã sao chép mã đơn.');
                },
                icon: const Icon(Icons.copy),
                label: const Text('Sao chép mã đơn'),
              ),
            ],
          ),
        ),
        const SectionTitle('Tiến trình chế tác & giao nhận'),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final phase in OrderPhase.values.where(
                (p) => p != OrderPhase.cancelled,
              ))
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        !cancelled && order.phase.index >= phase.index
                            ? Icons.check_circle
                            : Icons.radio_button_unchecked,
                        color: !cancelled && order.phase.index >= phase.index
                            ? Theme.of(context).colorScheme.primary
                            : Colors.grey,
                        size: 22,
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Text(phase.label)),
                    ],
                  ),
                ),
              const Divider(),
              for (final event in order.timeline)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(event),
                ),
            ],
          ),
        ),
        const SectionTitle('Kiểm soát chất lượng tại xưởng'),
        OutlinedButton.icon(
          onPressed: () => showGallery(context),
          icon: const Icon(Icons.photo_library_outlined),
          label: const Text('Xem ảnh QC & thành phẩm mẫu'),
        ),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionTitle('Xe lạnh chuyên dụng'),
              InfoRow('Tài xế', '${order.driver} · ${order.vehicle}'),
              const InfoRow(
                'Telemetry mô phỏng',
                '4,8°C  ·  Độ rung 0,02g  ·  Còn khoảng 25 phút',
              ),
              const Divider(),
              const Row(
                children: [
                  Icon(Icons.storefront),
                  Expanded(child: LinearProgressIndicator(value: .6)),
                  Icon(Icons.location_on_outlined),
                ],
              ),
              const SizedBox(height: 8),
              const Text('Sơ đồ minh họa hành trình · Không có GPS thật'),
              TextButton(
                onPressed: () => feedback(
                  context,
                  'Liên hệ tài xế mô phỏng: ${order.driverPhone}. Không thực hiện cuộc gọi.',
                ),
                child: const Text('Liên hệ tài xế'),
              ),
            ],
          ),
        ),
        ActionButtons(
          children: [
            FilledButton.icon(
              onPressed: () =>
                  openChat(context, 'order-${order.id}', order.bakery),
              icon: const Icon(Icons.chat_bubble_outline),
              label: const Text('Nhắn bếp trưởng'),
            ),
            OutlinedButton(
              onPressed: () => showReceipt(context, order),
              child: const Text('Hóa đơn mẫu'),
            ),
          ],
        ),
        if (!cancelled && order.phase.index < OrderPhase.delivering.index)
          ActionButtons(
            children: [
              OutlinedButton(
                onPressed: () async {
                  final result = await editForm(
                    context,
                    'Điều chỉnh khung giờ nhận',
                    [FieldSpec('time', 'Khung giờ', initial: order.date)],
                    submit: 'Lưu giờ nhận',
                  );
                  if (result != null) {
                    state.saveOrder(order.copyWith(date: result['time']));
                  }
                },
                child: const Text('Đổi giờ nhận bánh'),
              ),
              OutlinedButton(
                onPressed: () async {
                  final result = await editForm(
                    context,
                    'Sửa bảng chữ socola',
                    [
                      FieldSpec(
                        'message',
                        'Lời chúc',
                        initial: order.message,
                        required: false,
                        maxLength: 35,
                      ),
                    ],
                  );
                  if (result != null) {
                    state.saveOrder(order.copyWith(message: result['message']));
                  }
                },
                child: const Text('Sửa bảng chữ'),
              ),
              TextButton(
                onPressed: () async {
                  final percent = order.phase == OrderPhase.baking ? 20 : 70;
                  final yes = await confirm(
                    context,
                    'Hủy đơn & hoàn cọc mẫu',
                    'Chính sách web mô phỏng hoàn $percent% (${vnd((order.price * percent / 100).round())}). Không có tiền thực được hoàn.',
                  );
                  if (yes && context.mounted) {
                    state.cancelOrder(order);
                    feedback(context, 'Đã hủy đơn trong dữ liệu mô phỏng.');
                  }
                },
                child: const Text('Hủy đơn & hoàn cọc'),
              ),
            ],
          ),
        if ([
              OrderPhase.delivering,
              OrderPhase.completed,
            ].contains(order.phase) &&
            !order.reviewed)
          FilledButton(
            onPressed: () => showReview(context, order),
            child: const Text('Đã nhận bánh · Đánh giá'),
          ),
        if (order.reviewed)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Đã nghiệm thu & đánh giá ${order.rating} ★'),
                Text(order.review),
              ],
            ),
          ),
        ExpansionTile(
          title: const Text('Câu hỏi về vận chuyển'),
          children: const [
            Padding(
              padding: EdgeInsets.all(12),
              child: Text(
                'Xe lạnh mẫu duy trì 4°C – 6°C. Bạn có thể trao đổi khung giờ và nội dung bảng chữ với bếp trưởng trước khi giao.',
              ),
            ),
          ],
        ),
        ExpansionTile(
          title: const Text('Kịch bản thử nghiệm'),
          children: [
            FilterChips(
              values: const {
                'normal': 'Bình thường',
                'overdue': 'Giao trễ',
                'dispute': 'Tranh chấp',
              },
              selected: scenario,
              onSelected: (v) => setState(() => scenario = v),
            ),
            Wrap(
              spacing: 6,
              children: [
                for (final p in OrderPhase.values.where(
                  (p) => p != OrderPhase.cancelled,
                ))
                  ActionChip(
                    label: Text(p.label),
                    onPressed: () => state.saveOrder(order.copyWith(phase: p)),
                  ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}
