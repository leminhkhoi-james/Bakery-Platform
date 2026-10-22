import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/common.dart';
import '../../state/app_state.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});
  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  bool checkout = false;
  String fulfillment = 'delivery', payment = 'vietqr', slot = '15:30 - 16:30';
  final form = GlobalKey<FormState>();
  final name = TextEditingController(text: 'Nguyễn Mai Thảo Hân');
  final phone = TextEditingController(text: '0918 234 567');
  final email = TextEditingController(text: 'hanmai.sweetcake@example.com');
  final address = TextEditingController(text: 'Căn hộ 18.04, Saigon Pearl');
  final district = TextEditingController(text: 'Bình Thạnh, TP. Hồ Chí Minh');
  final date = TextEditingController(text: '22/10/2026');
  final note = TextEditingController();
  final plaque = TextEditingController(text: 'Happy 7th Birthday Minh Khang!');
  final card = TextEditingController();
  final voucher = TextEditingController();
  @override
  void dispose() {
    for (final c in [
      name,
      phone,
      email,
      address,
      district,
      date,
      note,
      plaque,
      card,
      voucher,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void placeOrder() {
    if (!form.currentState!.validate()) return;
    final state = AppScope.of(context);
    state.checkout(
      name: name.text,
      phone: phone.text,
      address: fulfillment == 'pickup'
          ? 'Nhận tại xưởng bánh'
          : '${address.text}, ${district.text}',
      date: '${date.text} · $slot',
      message: plaque.text,
      note: '${note.text}\nThiệp: ${card.text}\nPhương thức: $payment',
    );
    go(context, Destination.payment);
  }

  Widget field(
    TextEditingController controller,
    String label, {
    bool required = false,
    TextInputType keyboard = TextInputType.text,
    int lines = 1,
    int? max,
  }) => TextFormField(
    controller: controller,
    keyboardType: keyboard,
    minLines: lines,
    maxLines: lines,
    maxLength: max,
    textInputAction: lines > 1 ? TextInputAction.newline : TextInputAction.next,
    validator: (v) =>
        (required ? requiredValue(v) : null) ??
        (keyboard == TextInputType.emailAddress ? emailValue(v) : null),
    decoration: InputDecoration(labelText: label),
  );
  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context), cart = state.cart;
    return Form(
      key: form,
      child: PageBody(
        title: checkout ? 'Thông tin giao hàng' : 'Giỏ hàng của bạn',
        eyebrow: 'Giỏ bánh ngọt ngào',
        children: [
          FilterChips(
            values: const {'cart': '1. Giỏ hàng', 'checkout': '2. Giao nhận'},
            selected: checkout ? 'checkout' : 'cart',
            onSelected: (v) {
              if (v == 'checkout' && cart.selected.isEmpty) return;
              setState(() => checkout = v == 'checkout');
            },
          ),
          if (cart.lines.isEmpty)
            EmptyView(
              message: 'Giỏ hàng của bạn đang trống.',
              action: FilledButton(
                onPressed: () => go(context, Destination.explore),
                child: const Text('Khám phá mẫu bánh'),
              ),
            ),
          if (!checkout && cart.lines.isNotEmpty) ...[
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Chọn tất cả (${cart.lines.length} món)'),
              value: cart.selected.length == cart.lines.length,
              onChanged: (v) => cart.selectAll(v!),
            ),
            for (final item in cart.lines)
              Panel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    CakePicture(item.image, height: 150, label: item.title),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        item.title,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      subtitle: Text('${item.size}\n${item.bakery}'),
                      value: !cart.unselected.contains(item.id),
                      onChanged: (v) => cart.select(item.id, v!),
                    ),
                    if (item.message.isNotEmpty)
                      Text('Lời chúc: ${item.message}'),
                    if (item.sweetness.isNotEmpty)
                      Text('Độ ngọt: ${item.sweetness}'),
                    Text(
                      vnd(item.price * item.quantity),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    ActionButtons(
                      children: [
                        IconButton(
                          tooltip: 'Giảm số lượng ${item.title}',
                          onPressed: () => cart.quantity(item.id, -1),
                          icon: const Icon(Icons.remove_circle_outline),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(14),
                          child: Text('${item.quantity}'),
                        ),
                        IconButton(
                          tooltip: 'Tăng số lượng ${item.title}',
                          onPressed: () => cart.quantity(item.id, 1),
                          icon: const Icon(Icons.add_circle_outline),
                        ),
                        TextButton(
                          onPressed: () => cart.remove(item.id),
                          child: const Text('Xóa món'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            TextButton(
              onPressed: () async {
                if (await confirm(
                  context,
                  'Làm trống giỏ hàng?',
                  'Xóa toàn bộ món trong giỏ mô phỏng.',
                )) {
                  cart.clear();
                }
              },
              child: const Text('Làm trống giỏ hàng'),
            ),
            ExpansionTile(
              title: const Text('Phụ kiện đi kèm & trang trí'),
              children: [
                for (final e in cart.accessories)
                  Column(
                    children: [
                      CheckboxListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(e.name),
                        subtitle: Text(vnd(e.price)),
                        value: (cart.accessoryQuantities[e.id] ?? 0) > 0,
                        onChanged: (v) => cart.accessory(e.id, v! ? 1 : 0),
                      ),
                      if ((cart.accessoryQuantities[e.id] ?? 0) > 0)
                        ActionButtons(
                          children: [
                            IconButton(
                              tooltip: 'Giảm phụ kiện',
                              onPressed: () => cart.accessory(
                                e.id,
                                (cart.accessoryQuantities[e.id] ?? 0) - 1,
                              ),
                              icon: const Icon(Icons.remove),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(14),
                              child: Text('${cart.accessoryQuantities[e.id]}'),
                            ),
                            IconButton(
                              tooltip: 'Tăng phụ kiện',
                              onPressed: () => cart.accessory(
                                e.id,
                                (cart.accessoryQuantities[e.id] ?? 0) + 1,
                              ),
                              icon: const Icon(Icons.add),
                            ),
                          ],
                        ),
                    ],
                  ),
              ],
            ),
          ],
          if (checkout && cart.lines.isNotEmpty) ...[
            const SectionTitle('Người nhận & địa chỉ'),
            field(name, 'Họ và tên người nhận *', required: true),
            field(
              phone,
              'Số điện thoại *',
              required: true,
              keyboard: TextInputType.phone,
            ),
            field(
              email,
              'Email nhận xác nhận',
              keyboard: TextInputType.emailAddress,
            ),
            SelectField(
              label: 'Hình thức nhận bánh',
              value: fulfillment,
              options: const {
                'delivery': 'Giao tận nơi bằng xe lạnh',
                'pickup': 'Tự đến lấy tại xưởng',
              },
              onChanged: (v) => setState(() => fulfillment = v),
            ),
            if (fulfillment == 'delivery') ...[
              field(address, 'Địa chỉ chi tiết *', required: true, lines: 2),
              field(
                district,
                'Quận / Huyện, Tỉnh / Thành phố *',
                required: true,
              ),
            ],
            field(note, 'Ghi chú giao nhận', lines: 2),
            field(
              date,
              'Ngày nhận bánh *',
              required: true,
              keyboard: TextInputType.datetime,
            ),
            SelectField(
              label: 'Khung giờ giao nhận',
              value: slot,
              options: {
                for (final t in [
                  '09:00 - 10:30',
                  '14:00 - 15:30',
                  '15:30 - 16:30',
                  '18:00 - 19:30',
                ])
                  t: t,
              },
              onChanged: (v) => setState(() => slot = v),
            ),
            field(plaque, 'Chữ trên bảng socola (miễn phí)', max: 35),
            field(card, 'Lời chúc trên thiệp', lines: 3),
            SelectField(
              label: 'Phương thức thanh toán',
              value: payment,
              options: const {
                'vietqr': 'VietQR / Ngân hàng',
                'credit_card': 'Thẻ tín dụng',
                'ewallet': 'Ví điện tử',
                'deposit_50': 'Đặt cọc 50%',
              },
              onChanged: (v) => setState(() => payment = v),
            ),
          ],
          if (cart.lines.isNotEmpty)
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SectionTitle('Tóm tắt đơn hàng'),
                  InfoRow(
                    'Tạm tính (${cart.selected.length} món)',
                    vnd(cart.subtotal),
                  ),
                  InfoRow('Phụ kiện', vnd(cart.extra)),
                  InfoRow(
                    'Giảm giá ${cart.voucher?.code ?? ''}',
                    '− ${vnd(cart.discount)}',
                  ),
                  TextField(
                    controller: voucher,
                    decoration: const InputDecoration(labelText: 'Mã giảm giá'),
                  ),
                  ActionButtons(
                    children: [
                      TextButton(
                        onPressed: () {
                          final error = cart.applyVoucher(voucher.text);
                          feedback(
                            context,
                            error ?? 'Đã áp dụng mã giảm giá mô phỏng.',
                          );
                        },
                        child: const Text('Áp dụng mã'),
                      ),
                      TextButton(
                        onPressed: cart.removeVoucher,
                        child: const Text('Bỏ mã'),
                      ),
                    ],
                  ),
                  ExpansionTile(
                    title: const Text('Kho voucher SweetCake'),
                    children: [
                      for (final v in cart.vouchers)
                        ListTile(
                          title: Text(v.code),
                          subtitle: Text('Đơn từ ${vnd(v.minimum)}'),
                          trailing: TextButton(
                            onPressed: cart.subtotal >= v.minimum
                                ? () {
                                    final error = cart.applyVoucher(v.code);
                                    feedback(
                                      context,
                                      error ?? 'Đã chọn ${v.code}.',
                                    );
                                  }
                                : null,
                            child: const Text('Dùng mã'),
                          ),
                        ),
                    ],
                  ),
                  const Divider(),
                  Text(
                    vnd(cart.total),
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: cart.selected.isEmpty
                        ? null
                        : checkout
                        ? placeOrder
                        : () => setState(() => checkout = true),
                    child: Text(
                      checkout
                          ? 'Tạo đơn mô phỏng & thanh toán'
                          : 'Tiếp tục giao nhận',
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
