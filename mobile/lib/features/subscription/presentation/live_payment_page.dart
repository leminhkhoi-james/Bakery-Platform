import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/api/transport.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/live_upload.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

class LivePaymentPage extends StatefulWidget {
  const LivePaymentPage({super.key, required this.orderId});
  final String orderId;
  @override
  State<LivePaymentPage> createState() => _LivePaymentPageState();
}

class _LivePaymentPageState extends State<LivePaymentPage> {
  UploadPart? proof;
  String reference = '', method = 'BANK_TRANSFER';
  int revision = 0;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<List<Json>>(
      key: ValueKey(revision),
      title: 'Thông tin thanh toán gói',
      operational: true,
      load: () async => [
        await w.subscriptions.order(widget.orderId),
        await w.subscriptions.capabilities(),
      ],
      builder: (c, items, reload) {
        final order = items[0], capabilities = items[1];
        return [
          SCKeyValue('Số đơn', '${order['orderNumber']}'),
          SCKeyValue('Trạng thái', '${order['status']}'),
          SCKeyValue(
            'Số tiền theo đơn',
            Money.parse(order['totalAmount']).display('${order['currency']}'),
          ),
          const SCNotice(
            'Ghi nhận tham chiếu/chứng từ để Admin đối chiếu thủ công. Ứng dụng không chuyển tiền và không tự xác nhận tiền đã đến. Không nhập dữ liệu ngân hàng thật khi kiểm thử local.',
          ),
          if (order['status'] != 'PENDING_PAYMENT')
            const SCNotice(
              'Đơn không còn chờ gửi thanh toán. Quay lại chi tiết để theo dõi trạng thái.',
            )
          else ...[
            DropdownButtonFormField<String>(
              key: const ValueKey('payment-method'),
              initialValue: method,
              decoration: const InputDecoration(labelText: 'Phương thức'),
              items: [
                const DropdownMenuItem(
                  value: 'BANK_TRANSFER',
                  child: Text('Tham chiếu / chứng từ chuyển khoản'),
                ),
                if (capabilities['sandboxEnabled'] == true)
                  const DropdownMenuItem(
                    value: 'SANDBOX',
                    child: Text('Sandbox được server bật'),
                  ),
              ],
              onChanged: (s) => setState(() {
                method = s!;
                reference = '';
                proof = null;
                revision++;
              }),
            ),
            NativeField(
              FormFieldSpec(
                'paymentReference',
                method == 'SANDBOX'
                    ? 'Mã sandbox đã được cấp'
                    : 'Tham chiếu thanh toán',
                kind: method == 'SANDBOX' ? FieldKind.password : FieldKind.text,
                maximum: 120,
              ),
              value: reference,
              onChanged: (s) => reference = '$s',
            ),
            if (method != 'SANDBOX')
              OutlinedButton.icon(
                key: const ValueKey('pick-proof'),
                onPressed: () async {
                  try {
                    final file = await pickLiveFile('proof', proof: true);
                    if (mounted) setState(() => proof = file);
                  } on Object catch (e) {
                    if (c.mounted) {
                      ScaffoldMessenger.of(c)
                          .showSnackBar(SnackBar(content: Text(safeError(e))));
                    }
                  }
                },
                icon: const Icon(Icons.attach_file),
                label: Text(
                  proof == null
                      ? 'Chọn chứng từ (tối đa 10 MiB)'
                      : 'Đã chọn ${proof!.name}',
                ),
              ),
            LiveCommand(
              'Gửi để Admin duyệt',
              key: const ValueKey('send-payment'),
              run: () async {
                if (reference.trim().isEmpty && proof == null) {
                  throw const ApiFailure(422, 'Cần tham chiếu hoặc chứng từ.');
                }
                final fresh = await w.subscriptions.order(widget.orderId);
                if (fresh['status'] != 'PENDING_PAYMENT') {
                  reload();
                  throw const ApiFailure(
                    409,
                    'Đơn đã thay đổi. Kiểm tra lại trạng thái.',
                  );
                }
                final submitted = await w.subscriptions.payment(
                  widget.orderId,
                  {
                    'paymentMethod': method,
                    if (reference.trim().isNotEmpty)
                      'paymentReference': reference.trim(),
                    'amount': Money.parse(fresh['totalAmount']).decimal,
                    'currency': fresh['currency'],
                  },
                  proof: proof,
                );
                final verified = await w.subscriptions.order(widget.orderId);
                if (!objects(verified['payments'])
                    .any((p) => p['id'] == submitted['id'])) {
                  throw const ApiFailure(
                    502,
                    'Chưa đối chiếu được payment trong đơn.',
                    uncertain: true,
                  );
                }
                if (mounted) {
                  setState(() {
                    proof = null;
                    reference = '';
                    revision++;
                  });
                }
              },
            ),
          ],
        ];
      },
    );
  }
}
