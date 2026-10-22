import 'package:flutter/material.dart';

import '../../core/widgets/common.dart';
import '../../core/utils/formatters.dart';
import '../../models/catalog.dart';
import '../../models/workflow.dart';
import '../../state/app_state.dart';

Future<void> showReceipt(BuildContext context, CakeOrder order) =>
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Biên lai mẫu ${order.id}'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('MÔ PHỎNG · Không phải hóa đơn tài chính'),
              InfoRow('Bánh', order.title),
              InfoRow('Tiệm', order.bakery),
              InfoRow('Người nhận', order.customer),
              InfoRow('Địa chỉ', order.address),
              InfoRow('Tổng giá trị', vnd(order.price)),
              InfoRow(
                'Trạng thái',
                order.paid
                    ? 'Đã xác nhận thanh toán mô phỏng'
                    : 'Chưa thanh toán / COD',
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );

Future<void> showGallery(BuildContext context) async {
  final photos = AppScope.of(context).fixtures.rows('ORDER_GALLERY_PHOTOS');
  var index = 0;
  await showDialog<void>(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, refresh) => AlertDialog(
        title: const Text('Ảnh kiểm tra chất lượng mẫu'),
        content: SizedBox(
          width: 500,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CakePicture(
                textValue(photos[index], 'src'),
                height: 220,
                label: textValue(photos[index], 'title'),
              ),
              Text(textValue(photos[index], 'title')),
              Text('${index + 1}/${photos.length}'),
            ],
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Ảnh trước',
            onPressed: () => refresh(
              () => index = (index - 1 + photos.length) % photos.length,
            ),
            icon: const Icon(Icons.chevron_left),
          ),
          IconButton(
            tooltip: 'Ảnh sau',
            onPressed: () => refresh(() => index = (index + 1) % photos.length),
            icon: const Icon(Icons.chevron_right),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
        ],
      ),
    ),
  );
}

Future<void> showReview(BuildContext context, CakeOrder order) =>
    showDialog<void>(
      context: context,
      builder: (_) => _ReviewDialog(order: order),
    );

class _ReviewDialog extends StatefulWidget {
  const _ReviewDialog({required this.order});
  final CakeOrder order;
  @override
  State<_ReviewDialog> createState() => _ReviewDialogState();
}

class _ReviewDialogState extends State<_ReviewDialog> {
  final comment = TextEditingController();
  final scores = [5, 5, 5, 5];
  bool attached = false;
  @override
  void dispose() {
    comment.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Xác nhận đã nhận bánh'),
    content: SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Đánh giá và giải ngân đều là mô phỏng cục bộ.'),
          const SizedBox(height: 16),
          for (var i = 0; i < 4; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: SelectField(
                label: [
                  'Đánh giá tổng thể',
                  'Độ giống mẫu AI',
                  'Hương vị bánh',
                  'Giao hàng',
                ][i],
                value: '${scores[i]}',
                options: {for (var v = 1; v <= 5; v++) '$v': '$v ★'},
                onChanged: (v) => setState(() => scores[i] = int.parse(v)),
              ),
            ),
          TextField(
            controller: comment,
            minLines: 3,
            maxLines: 5,
            decoration: const InputDecoration(labelText: 'Nhận xét của bạn'),
          ),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Đính kèm ảnh mẫu cục bộ'),
            value: attached,
            onChanged: (v) => setState(() => attached = v!),
          ),
          if (attached) CakePicture(widget.order.image, height: 100),
        ],
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('Hủy'),
      ),
      FilledButton(
        onPressed: () {
          AppScope.of(context).reviewOrder(
            widget.order,
            '${comment.text}\nĐộ giống mẫu: ${scores[1]}/5 · Hương vị: ${scores[2]}/5 · Giao hàng: ${scores[3]}/5${attached ? ' · Có ảnh mẫu' : ''}',
            scores[0],
          );
          Navigator.pop(context);
          feedback(
            context,
            'Đã nhận bánh, lưu đánh giá và mở cọc trong dữ liệu mô phỏng.',
          );
        },
        child: const Text('Gửi đánh giá & hoàn tất'),
      ),
    ],
  );
}
