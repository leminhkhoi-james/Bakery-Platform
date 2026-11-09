import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/phase5_widgets.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../marketplace/presentation/live_request_editor.dart';
import '../data/live_cart.dart';
import '../../addresses/presentation/live_address_page.dart';
import '../../orders/data/pending_order_command.dart';
import '../../orders/presentation/live_order_pages.dart';

class LiveProductSelection extends StatefulWidget {
  const LiveProductSelection(
    this.product, {
    super.key,
    this.customRequest = false,
  });
  final PublicProduct product;
  final bool customRequest;
  @override
  State<LiveProductSelection> createState() => _LiveProductSelectionState();
}

class _LiveProductSelectionState extends State<LiveProductSelection> {
  final Map<String, List<String>> selected = {};
  final Map<String, int> extras = {};
  int quantity = 1;
  String? error;
  bool initialized = false;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (initialized) return;
    initialized = true;
    final cart = LiveScope.of(context).cart;
    if (cart.product?.id == widget.product.id) {
      quantity = cart.quantity;
      selected.addAll(
        cart.selections.map((key, value) => MapEntry(key, List.of(value))),
      );
      extras.addAll(cart.addOns);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product, w = LiveScope.of(context);
    return LiveScaffold(
      title: 'Chọn bánh và tùy chọn',
      children: [
        Text(p.name, style: Theme.of(context).textTheme.headlineSmall),
        Text(p.price.display()),
        const SCNotice(
          'Giỏ hiện hỗ trợ một sản phẩm theo contract direct Order. Chọn sản phẩm khác cần xác nhận thay thế; không gộp nhiều tiệm.',
        ),
        if (!widget.customRequest)
          NativeField(
            const FormFieldSpec(
              'quantity',
              'Số lượng',
              kind: FieldKind.integer,
              minimum: 1,
              required: true,
            ),
            value: quantity,
            onChanged: (v) =>
                setState(() => quantity = int.tryParse('$v') ?? 0),
          ),
        for (final group in objects(p.options['groups']))
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SCSection(
                '${group['name']} · ${group['minimumSelections']}–${group['maximumSelections']} lựa chọn',
              ),
              for (final v in objects(
                group['values'],
              ).where((v) => v['active'] == true))
                CheckboxListTile(
                  key: ValueKey('option-value-${v['id']}'),
                  contentPadding: EdgeInsets.zero,
                  title: Text('${v['name']}'),
                  subtitle: Text(displayMoney(v['priceAdjustment'])),
                  value: (selected['${group['id']}'] ?? []).contains(v['id']),
                  onChanged: (on) => setState(() {
                    final values = selected.putIfAbsent(
                      '${group['id']}',
                      () => [],
                    );
                    if (on == true) {
                      if (group['selectionType'] == 'SINGLE') values.clear();
                      values.add(apiId(v['id']));
                    } else {
                      values.remove(v['id']);
                    }
                  }),
                ),
            ],
          ),
        if (!widget.customRequest && p.addOns.isNotEmpty)
          const SCSection('Phụ kiện'),
        for (final a in p.addOns.where(
          (a) => !widget.customRequest && a['active'] != false,
        ))
          NativeField(
            FormFieldSpec(
              'addon-${a['id']}',
              '${a['name']} · ${displayMoney(a['price'])}',
              kind: FieldKind.integer,
              minimum: 0,
            ),
            value: extras[a['id']] ?? 0,
            onChanged: (v) => setState(() {
              final qty = int.tryParse('$v') ?? 0;
              if (qty > 0) {
                extras[apiId(a['id'])] = qty;
              } else {
                extras.remove(a['id']);
              }
            }),
          ),
        if (error != null) SCNotice(error!, warning: true),
        SCButton(
          !w.session.authenticated
              ? 'Đăng nhập để chọn bánh'
              : widget.customRequest
              ? 'Tiếp tục yêu cầu tùy chỉnh'
              : 'Thêm vào giỏ',
          key: const ValueKey('cart-add'),
          onPressed: () async {
            try {
              if (!w.session.authenticated) {
                liveOpen(context, '/login');
                return;
              }
              if (!widget.customRequest && w.pendingDirectOrder != null) {
                throw const ApiFailure(
                  409,
                  'Đối chiếu yêu cầu đặt bánh đang chờ trước khi thay đổi giỏ.',
                );
              }
              if (widget.customRequest) {
                LiveCart.validate(p, 1, selected, {});
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => LiveRequestEditor(
                      product: p,
                      optionSelections: [
                        for (final entry in selected.entries)
                          for (final value in entry.value)
                            {
                              'optionGroupId': entry.key,
                              'optionValueId': value,
                              'quantity': 1,
                            },
                      ],
                    ),
                  ),
                );
                return;
              }
              if (w.cart.product != null && w.cart.product!.id != p.id) {
                if (!await confirmLive(context, 'Thay sản phẩm trong giỏ?')) {
                  return;
                }
              }
              w.cart.set(p, quantity, selected, extras);
              if (context.mounted) liveOpen(context, '/cart');
            } on Object catch (e) {
              if (mounted) setState(() => error = safeError(e));
            }
          },
        ),
      ],
    );
  }
}

class LiveCartPage extends StatelessWidget {
  const LiveCartPage({super.key});
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context), cart = w.cart, p = cart.product;
    if (p == null) {
      return LiveScaffold(
        title: 'Giỏ bánh',
        children: [
          SCStateView(
            title: 'Giỏ bánh đang trống',
            message: 'Chọn sản phẩm thật từ catalog để bắt đầu.',
            action: 'Khám phá bánh',
            onAction: () => liveOpen(context, '/explore'),
          ),
        ],
      );
    }
    if (w.pendingDirectOrder != null) {
      return LiveScaffold(
        title: 'Giỏ bánh',
        children: [
          Text(p.name, style: Theme.of(context).textTheme.headlineSmall),
          const SCNotice(
            'Có yêu cầu đặt bánh chưa rõ kết quả. Giữ nguyên giỏ để đối chiếu đúng yêu cầu đã gửi.',
            warning: true,
          ),
          SCButton(
            'Đối chiếu yêu cầu đang chờ',
            onPressed: () => liveOpen(context, '/checkout'),
          ),
          SCButton(
            'Xem đơn đã có',
            outlined: true,
            onPressed: () => liveOpen(context, '/orders'),
          ),
        ],
      );
    }
    return LiveScaffold(
      title: 'Giỏ bánh',
      children: [
        Text(p.name, style: Theme.of(context).textTheme.headlineSmall),
        Text(p.bakeryName),
        SCKeyValue('Số lượng', '${cart.quantity}'),
        SCKeyValue('Tạm tính', cart.estimate.display()),
        const SCNotice(
          'Tạm tính theo catalog đã đọc; chưa phải báo giá cuối của Order. Backend tính lại giá, phí giao và điều kiện khi tạo đơn. Không có API public quote riêng.',
        ),
        SCButton(
          'Đổi tùy chọn / số lượng',
          outlined: true,
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => LiveProductSelection(p)),
          ),
        ),
        LiveCommand(
          'Kiểm tra lại sản phẩm và giá',
          run: () async {
            await cart.revalidate(w.catalog);
          },
        ),
        SCButton(
          'Tiếp tục đặt bánh',
          key: const ValueKey('checkout-open'),
          onPressed: () => liveOpen(context, '/checkout'),
        ),
        LiveCommand(
          'Xóa giỏ',
          outlined: true,
          run: () async {
            if (await confirmLive(context, 'Xóa giỏ bánh?')) cart.clear();
          },
        ),
      ],
    );
  }
}

class LiveCheckoutPage extends StatefulWidget {
  const LiveCheckoutPage({super.key});
  @override
  State<LiveCheckoutPage> createState() => _LiveCheckoutPageState();
}

class _LiveCheckoutPageState extends State<LiveCheckoutPage> {
  String needed = '', note = '';
  Json? address;
  bool busy = false;
  String? error;
  final form = GlobalKey<FormState>();
  bool restored = false;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (restored) return;
    restored = true;
    final command = LiveScope.of(context).pendingDirectOrder;
    if (command != null) {
      needed = '${command.body['requestedDeliveryAt']}';
      note = '${command.body['customerNote'] ?? ''}';
    }
  }

  Future<void> submit() async {
    final w = LiveScope.of(context);
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      var command = w.pendingDirectOrder;
      if (command == null) {
        if (!form.currentState!.validate()) return;
        if (address == null) {
          throw const ApiFailure(400, 'Chọn địa chỉ giao hàng trước.');
        }
        final at = futureInstant(needed);
        final fresh = await w.addresses.get(apiId(address!['id']));
        if (addressSummary(fresh) != addressSummary(address!) ||
            fresh['recipientName'] != address!['recipientName'] ||
            fresh['recipientPhone'] != address!['recipientPhone']) {
          setState(() => address = fresh);
          throw const ApiFailure(
            409,
            'Địa chỉ vừa thay đổi. Kiểm tra lại rồi xác nhận đặt bánh.',
          );
        }
        await w.cart.revalidate(w.catalog);
        command = PendingOrderCommand({
          ...w.cart.payload,
          'deliveryAddressId': apiId(fresh['id']),
          'requestedDeliveryAt': at.toIso8601String(),
          'customerNote': note.trim(),
        });
        w.pendingDirectOrder = command;
      }
      final order = await w.orders.create(command.body, command.key);
      w.pendingDirectOrder = null;
      w.cart.clear();
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute<void>(
            builder: (_) => LiveOrderDetail(apiId(order['id'])),
          ),
        );
      }
    } on Object catch (e) {
      if (e is ApiFailure && e.uncertain) {
        w.pendingDirectOrder?.uncertain = true;
      } else if (e is ApiFailure && e.status == 422 ||
          w.pendingDirectOrder?.uncertain != true) {
        w.pendingDirectOrder = null;
      }
      if (mounted) setState(() => error = safeError(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context), cart = w.cart;
    if (cart.empty) return const LiveCartPage();
    return LiveScaffold(
      title: 'Đặt bánh',
      children: [
        Text(
          cart.product!.name,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        SCKeyValue('Tạm tính', cart.estimate.display()),
        AbsorbPointer(
          absorbing: busy || w.pendingDirectOrder != null,
          child: Form(
            key: form,
            child: Column(
              children: [
                NativeField(
                  const FormFieldSpec(
                    'requestedDeliveryAt',
                    'Ngày giao',
                    kind: FieldKind.instant,
                    required: true,
                  ),
                  value: needed,
                  onChanged: (v) => needed = '$v',
                ),
                const SizedBox(height: 16),
                NativeField(
                  const FormFieldSpec(
                    'customerNote',
                    'Ghi chú giao bánh',
                    maximum: 1000,
                  ),
                  value: note,
                  onChanged: (v) => note = '$v',
                ),
              ],
            ),
          ),
        ),
        if (w.pendingDirectOrder == null)
          LiveAddressSelection(
            value: address,
            enabled: !busy && w.pendingDirectOrder == null,
            onChanged: (value) => setState(() => address = value),
          ),
        const SCNotice(
          'Tạm tính chưa gồm phí giao hàng. Order tính lại giá và phí khi tạo đơn; chi tiết đơn hiển thị số tiền đã chốt.',
        ),
        LiveCommand(
          'Kiểm tra thông tin và catalog',
          run: () async {
            if (!form.currentState!.validate()) {
              throw const ApiFailure(400, 'Kiểm tra thông tin đặt bánh.');
            }
            futureInstant(needed);
            await cart.revalidate(w.catalog);
          },
        ),
        if (error != null) SCNotice(error!, warning: true),
        if (w.pendingDirectOrder != null)
          const SCNotice(
            'Yêu cầu đang chờ đối chiếu. Không đổi địa chỉ hoặc tạo yêu cầu khác. Thử lại sử dụng đúng mã và nội dung cũ; dịch vụ trả lại đơn đã tạo nếu có.',
            warning: true,
          ),
        SCButton(
          w.pendingDirectOrder == null
              ? 'Tạo đơn bánh'
              : 'Đối chiếu cùng yêu cầu',
          key: const ValueKey('direct-order-submit'),
          busy: busy,
          onPressed: busy ? null : submit,
        ),
        const SCNotice(
          'Việc thanh toán bánh do khách và tiệm thỏa thuận. Ứng dụng không xác nhận chuyển tiền, giữ tiền hoặc hoàn tiền.',
        ),
        SCButton(
          'Xem đơn đã có',
          outlined: true,
          onPressed: () => liveOpen(context, '/orders'),
        ),
      ],
    );
  }
}
