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
          (a) => !widget.customRequest && a['active'] == true,
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
  final form = GlobalKey<FormState>();
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
        Form(
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
        const SCSection('Địa chỉ giao hàng'),
        const SCNotice(addressContractBlocker, warning: true),
        const ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Icon(Icons.location_on_outlined),
          title: Text('Chưa có nguồn địa chỉ đã xác minh'),
          subtitle: Text('Không nhập UUID hoặc dùng địa chỉ của người khác.'),
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
        const SCButton('Tạo đơn bánh', onPressed: null),
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
