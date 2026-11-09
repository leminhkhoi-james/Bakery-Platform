import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/phase5_widgets.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../addresses/presentation/live_address_page.dart';
import '../../orders/data/pending_order_command.dart';
import '../../orders/presentation/live_order_pages.dart';

class LiveOfferAcceptance extends StatefulWidget {
  const LiveOfferAcceptance(this.offer, {super.key});
  final Json offer;
  @override
  State<LiveOfferAcceptance> createState() => _LiveOfferAcceptanceState();
}

class _LiveOfferAcceptanceState extends State<LiveOfferAcceptance> {
  Json? address;
  String note = '';
  String? error;
  bool busy = false;
  final form = GlobalKey<FormState>();
  Future<void> submit() async {
    final w = LiveScope.of(context), id = apiId(widget.offer['id']);
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      var command = w.pendingOfferAcceptances[id];
      if (command == null) {
        if (!form.currentState!.validate()) return;
        if (address == null) {
          throw const ApiFailure(400, 'Chọn địa chỉ giao hàng trước.');
        }
        final fresh = await w.addresses.get(apiId(address!['id']));
        final request = await w.marketplace.request(
          apiId(widget.offer['cakeRequestId']),
        );
        if (fresh['city'].toString().toLowerCase() !=
                request['deliveryCity'].toString().toLowerCase() ||
            fresh['district'].toString().toLowerCase() !=
                request['deliveryDistrict'].toString().toLowerCase()) {
          throw const ApiFailure(
            422,
            'Địa chỉ cần cùng tỉnh/thành phố và quận/huyện với yêu cầu bánh.',
          );
        }
        if (addressSummary(fresh) != addressSummary(address!) ||
            fresh['recipientName'] != address!['recipientName'] ||
            fresh['recipientPhone'] != address!['recipientPhone']) {
          setState(() => address = fresh);
          throw const ApiFailure(
            409,
            'Địa chỉ vừa thay đổi. Kiểm tra lại trước khi chấp nhận.',
          );
        }
        if (!mounted ||
            !await confirmLive(
              context,
              'Chấp nhận báo giá và tạo đơn bánh theo địa chỉ đã chọn?',
            )) {
          return;
        }
        command = PendingOrderCommand({
          'deliveryAddressId': apiId(fresh['id']),
          'customerNote': note.trim(),
        });
        w.pendingOfferAcceptances[id] = command;
      } else {
        // Read the authoritative offer before an explicit replay; never start a
        // second acceptance or create an Order directly from the client.
        await w.marketplace.offer(id);
      }
      final result = await w.marketplace.accept(id, command.body, command.key);
      w.pendingOfferAcceptances.remove(id);
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute<void>(
            builder: (_) => LiveOrderDetail(apiId(result['orderId'])),
          ),
        );
      }
    } on Object catch (e) {
      final command = w.pendingOfferAcceptances[id];
      if (command != null &&
          e is ApiFailure &&
          (e.uncertain || e.status == 409)) {
        command.uncertain = true;
      } else if (e is ApiFailure && e.status == 422 ||
          command?.uncertain != true) {
        w.pendingOfferAcceptances.remove(id);
      }
      if (mounted) setState(() => error = safeError(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pending = LiveScope.of(context)
        .pendingOfferAcceptances[apiId(widget.offer['id'])];
    return LiveScaffold(
      title: 'Chấp nhận báo giá',
      children: [
        SCKeyValue('Tổng báo giá', displayMoney(widget.offer['totalPrice'])),
        SCKeyValue('Phí giao', displayMoney(widget.offer['deliveryFee'])),
        LiveAddressSelection(
          value: address,
          enabled: !busy && pending == null,
          onChanged: (value) => setState(() => address = value),
        ),
        AbsorbPointer(
          absorbing: busy || pending != null,
          child: Form(
            key: form,
            child: NativeField(
              const FormFieldSpec(
                'customerNote',
                'Ghi chú giao bánh',
                maximum: 2000,
              ),
              value: note,
              onChanged: (v) => note = '$v',
            ),
          ),
        ),
        if (error != null) SCNotice(error!, warning: true),
        if (pending != null)
          const SCNotice(
            'Kết quả đang chờ đối chiếu. Yêu cầu được giữ nguyên mã và địa chỉ; không chấp nhận báo giá khác khi kết quả chưa rõ.',
            warning: true,
          ),
        SCButton(
          pending == null ? 'Chấp nhận và tạo đơn' : 'Đối chiếu cùng yêu cầu',
          key: const ValueKey('offer-accept-submit'),
          busy: busy,
          onPressed: busy ? null : submit,
        ),
        const SCNotice(
          'Dịch vụ xác minh quyền sở hữu địa chỉ, hiệu lực báo giá và tạo tối đa một đơn. Thanh toán bánh do khách và tiệm thỏa thuận.',
        ),
      ],
    );
  }
}
