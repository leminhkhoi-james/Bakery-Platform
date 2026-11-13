import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

class CartPage extends StatelessWidget {
  const CartPage({super.key});
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context), cart = w.cart;
    return SweetCakeScaffold(
      screen: ScreenId.cart,
      bottom: cart.lines.isEmpty
          ? null
          : SCButton(
              'Xem trước đơn bánh',
              icon: Icons.receipt_long_outlined,
              onPressed: () => showSCSheet<void>(
                context,
                title: 'Bản xem trước đơn bánh',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SCKeyValue(
                      'Tiệm',
                      w.catalog.bakery(cart.lines.first.bakeryId).name,
                    ),
                    for (final line in cart.lines)
                      SCKeyValue(
                        '${line.name} × ${line.quantity}',
                        vnd(line.total),
                      ),
                    const Divider(),
                    SCKeyValue(
                      'Tổng minh họa',
                      vnd(cart.total),
                      emphasized: true,
                    ),
                    const SizedBox(height: 16),
                    const SCNotice(
                      'Không tạo đơn Backend và không thu tiền. Địa chỉ, giá và khả năng phục vụ cần được xác nhận khi có tích hợp thật.',
                    ),
                    const SizedBox(height: 16),
                    SCButton(
                      'Lưu bản xem trước local',
                      onPressed: () {
                        cart.savePreview();
                        Navigator.pop(context);
                        demoFeedback(
                          context,
                          'Đã lưu bản xem trước trong phiên demo; chưa đặt đơn thật',
                        );
                      },
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                        openScreen(context, ScreenId.payment);
                      },
                      child: const Text('Tìm hiểu thanh toán với tiệm'),
                    ),
                  ],
                ),
              ),
            ),
      children: [
        if (cart.lines.isEmpty)
          SCStateView(
            title: 'Giỏ bánh đang chờ bạn',
            message: 'Chọn một chiếc bánh và thêm những điều bạn thích.',
            icon: Icons.shopping_bag_outlined,
            action: 'Khám phá bánh',
            onAction: () => openScreen(context, ScreenId.explore),
          )
        else ...[
          Text(
            '${cart.count} chiếc bánh, một dịp thật vui.',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          for (final line in cart.lines)
            SCCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SCImage(
                        line.image,
                        label: line.name,
                        width: 76,
                        height: 76,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              line.name,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            Text(
                              '${line.size} · ${line.flavor}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (line.addons.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(line.addons.join(', ')),
                    ),
                  const SizedBox(height: 12),
                  SCPrice(line.total),
                  Wrap(
                    alignment: WrapAlignment.spaceBetween,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 12,
                    children: [
                      SCQuantity(
                        line.quantity,
                        onChanged: (value) => cart.quantity(line, value),
                      ),
                      TextButton.icon(
                        onPressed: () => cart.remove(line),
                        icon: const Icon(Icons.delete_outline),
                        label: const Text('Bỏ khỏi giỏ'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          SCCard(
            child: Column(
              children: [
                SCKeyValue('Tạm tính', vnd(cart.subtotal)),
                SCKeyValue('Giao hàng minh họa', vnd(cart.delivery)),
                const Divider(),
                SCKeyValue('Tổng dự kiến', vnd(cart.total), emphasized: true),
              ],
            ),
          ),
          const SCNotice(
            'Giá và phí chỉ minh họa. Mỗi giỏ xem trước thuộc một tiệm; không có escrow hay thanh toán tự động.',
          ),
        ],
        if (cart.previews.isNotEmpty) ...[
          const SCSection('Bản xem trước đã lưu'),
          for (final preview in cart.previews)
            SCCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(preview.label),
                  SCPrice(preview.total),
                  const Text('Bản xem trước local · chưa đặt đơn thật'),
                ],
              ),
            ),
        ],
      ],
    );
  }
}

class PaymentInformationPage extends StatelessWidget {
  const PaymentInformationPage({super.key});
  @override
  Widget build(BuildContext context) => SweetCakeScaffold(
    screen: ScreenId.payment,
    children: [
      const Center(child: Icon(Icons.handshake_outlined, size: 64)),
      Text(
        'Thỏa thuận trực tiếp\ncùng tiệm bánh.',
        style: Theme.of(context).textTheme.headlineMedium,
      ),
      const Text(
        'SweetCake kết nối bạn với tiệm. Giá bánh, cách thanh toán và thời gian giao nhận cần được hai bên thống nhất.',
      ),
      const SCCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Trước khi xác nhận',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            SizedBox(height: 12),
            Text(
              '• Đối chiếu mẫu bánh, kích thước và hương vị.\n• Thống nhất giá cuối và phí giao.\n• Xác nhận thời gian, địa điểm và yêu cầu bảo quản.',
            ),
          ],
        ),
      ),
      const SCNotice(
        'Prototype không giữ tiền, đảm bảo escrow, tạo mã thanh toán hoặc xác nhận chuyển tiền.',
      ),
      SCButton(
        'Mở hội thoại demo',
        icon: Icons.chat_bubble_outline,
        onPressed: () => openScreen(context, ScreenId.chat, id: 'chat-01'),
      ),
      SCButton(
        'Xem đơn minh họa',
        outlined: true,
        onPressed: () => openScreen(context, ScreenId.tracking),
      ),
    ],
  );
}
