import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/router/destination.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/common.dart';
import '../../state/app_state.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});
  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String method = 'vnpay';
  bool processing = false, success = false, failed = false;
  int seconds = 898;
  Timer? timer;
  @override
  void initState() {
    super.initState();
    timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || success) return;
      if (seconds == 0) {
        timer?.cancel();
        setState(() => failed = true);
        return;
      }
      setState(() => seconds--);
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  Future<void> verify({bool fail = false}) async {
    if (processing) return;
    setState(() {
      processing = true;
      failed = false;
    });
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    if (!fail) {
      AppScope.of(context).pay(cod: method == 'cod');
      timer?.cancel();
    }
    setState(() {
      processing = false;
      success = !fail;
      failed = fail;
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context), order = state.activeOrder;
    if (order == null) {
      return const PageBody(
        title: 'Thanh toán',
        children: [EmptyView(message: 'Chưa có đơn hàng để thanh toán.')],
      );
    }
    final syntax =
        'SWEETCAKE ${order.id.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '')}';
    return PageBody(
      title: 'Thanh toán an toàn',
      eyebrow: 'Đơn ${order.id}',
      subtitle:
          'MÔ PHỎNG OFFLINE · Không chuyển tiền, không tạo giao dịch thật.',
      children: [
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              CakePicture(order.image, height: 160, label: order.title),
              const SizedBox(height: 12),
              Text(order.title, style: Theme.of(context).textTheme.titleMedium),
              Text(order.bakery),
              InfoRow('Tổng thanh toán', vnd(order.price)),
              InfoRow(
                'Thời gian còn lại',
                '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}',
              ),
            ],
          ),
        ),
        if (!success) ...[
          FilterChips(
            values: const {'vnpay': 'VNPAY', 'momo': 'MoMo', 'cod': 'COD'},
            selected: method,
            onSelected: (v) {
              if (!processing) setState(() => method = v);
            },
          ),
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.qr_code_2, size: 100),
                const Text(
                  'Ảnh biểu trưng mô phỏng\nKhông phải mã thanh toán thực',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                InfoRow(
                  'Phương thức',
                  method == 'cod'
                      ? 'Thanh toán khi nhận bánh'
                      : method.toUpperCase(),
                ),
                InfoRow('Nội dung chuyển khoản mẫu', syntax),
                TextButton.icon(
                  onPressed: () async {
                    await Clipboard.setData(ClipboardData(text: syntax));
                    if (context.mounted) {
                      feedback(context, 'Đã sao chép nội dung mẫu.');
                    }
                  },
                  icon: const Icon(Icons.copy),
                  label: const Text('Sao chép nội dung'),
                ),
                FilledButton(
                  onPressed: processing || seconds == 0 ? null : () => verify(),
                  child: processing
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(
                          method == 'cod'
                              ? 'Xác nhận COD mô phỏng'
                              : 'Xác nhận thanh toán mô phỏng',
                        ),
                ),
                TextButton(
                  onPressed: processing ? null : () => verify(fail: true),
                  child: const Text('Mô phỏng giao dịch bị từ chối'),
                ),
              ],
            ),
          ),
          if (failed)
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Giao dịch mô phỏng bị từ chối hoặc hết thời gian.',
                  ),
                  OutlinedButton(
                    onPressed: () {
                      timer?.cancel();
                      seconds = 898;
                      timer = Timer.periodic(const Duration(seconds: 1), (_) {
                        if (mounted && seconds > 0 && !success) {
                          setState(() => seconds--);
                        }
                      });
                      setState(() => failed = false);
                    },
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            ),
        ] else
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(
                  Icons.check_circle_outline,
                  color: Colors.green,
                  size: 48,
                ),
                const SizedBox(height: 12),
                const SectionTitle('Xác nhận mô phỏng thành công!'),
                const Text('Thay đổi chỉ được lưu trong bộ nhớ của ứng dụng.'),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => go(context, Destination.tracking),
                  child: const Text('Theo dõi đơn làm bánh'),
                ),
                TextButton(
                  onPressed: () => go(context, Destination.profile),
                  child: const Text('Xem đơn hàng của tôi'),
                ),
              ],
            ),
          ),
        const InfoRow(
          'Vận chuyển bánh',
          'Tiêu chuẩn minh họa: xe lạnh 4°C – 6°C, đóng hộp chống nghiêng.',
        ),
      ],
    );
  }
}
