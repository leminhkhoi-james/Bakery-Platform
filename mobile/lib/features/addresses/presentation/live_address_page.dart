import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/phase5_widgets.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

String addressSummary(Json address) => [
  address['addressLine'],
  address['ward'],
  address['district'],
  address['city'],
].where((v) => v != null && '$v'.isNotEmpty).join(', ');

class LiveAddressPage extends StatelessWidget {
  const LiveAddressPage({super.key, this.select = false});
  final bool select;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<List<Json>>(
      title: select ? 'Chọn địa chỉ giao hàng' : 'Địa chỉ của tôi',
      contentAlignment: Alignment.topCenter,
      navigationPath: '/profile',
      load: w.addresses.list,
      builder: (context, addresses, reload) => [
        SCButton(
          'Thêm địa chỉ',
          key: const ValueKey('address-add'),
          onPressed: () async {
            await editAddress(context);
            reload();
          },
        ),
        if (addresses.isEmpty)
          const SCNotice(
            'Bạn chưa lưu địa chỉ. Thêm địa chỉ người nhận để đặt bánh.',
          ),
        for (final a in addresses)
          SCCard(
            key: ValueKey('address-${a['id']}'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  '${a['label']}',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                if (a['isDefault'] == true) const Text('Địa chỉ mặc định'),
                Text('${a['recipientName']} · ${a['recipientPhone']}'),
                Text(addressSummary(a)),
                const SizedBox(height: 16),
                if (select) ...[
                  SCButton(
                    'Giao đến địa chỉ này',
                    onPressed: () => Navigator.pop(context, a),
                  ),
                  const SizedBox(height: 8),
                ],
                SCButton(
                  'Sửa địa chỉ',
                  outlined: true,
                  onPressed: () async {
                    await editAddress(context, a);
                    reload();
                  },
                ),
                const SizedBox(height: 8),
                if (a['isDefault'] != true) ...[
                  LiveCommand(
                    'Đặt làm mặc định',
                    outlined: true,
                    run: () => w.addresses.setDefault(apiId(a['id'])),
                    after: reload,
                  ),
                  const SizedBox(height: 8),
                ],
                LiveCommand(
                  'Xóa địa chỉ',
                  outlined: true,
                  confirm: () => confirmLive(
                    context,
                    'Xóa địa chỉ đã lưu? Địa chỉ trên đơn đã tạo vẫn được giữ.',
                  ),
                  run: () => w.addresses.delete(apiId(a['id'])),
                  after: reload,
                ),
              ],
            ),
          ),
        SCButton('Làm mới địa chỉ', outlined: true, onPressed: reload),
      ],
    );
  }
}

Future<Json?> editAddress(BuildContext context, [Json? address]) {
  final w = LiveScope.of(context);
  return Navigator.push<Json>(
    context,
    MaterialPageRoute(
      builder: (_) => LiveFormPage<Json>(
        title: address == null
            ? 'Thêm địa chỉ giao hàng'
            : 'Sửa địa chỉ giao hàng',
        action: 'Lưu địa chỉ',
        operational: false,
        initial: address ?? const {'isDefault': false},
        fields: const [
          FormFieldSpec('label', 'Tên gợi nhớ', required: true, maximum: 80),
          FormFieldSpec(
            'recipientName',
            'Tên người nhận',
            required: true,
            maximum: 120,
          ),
          FormFieldSpec(
            'recipientPhone',
            'Điện thoại người nhận',
            required: true,
            maximum: 30,
          ),
          FormFieldSpec(
            'addressLine',
            'Số nhà và đường',
            required: true,
            maximum: 255,
          ),
          FormFieldSpec('ward', 'Phường / xã', maximum: 120),
          FormFieldSpec(
            'district',
            'Quận / huyện',
            required: true,
            maximum: 120,
          ),
          FormFieldSpec(
            'city',
            'Tỉnh / thành phố',
            required: true,
            maximum: 120,
          ),
          FormFieldSpec(
            'isDefault',
            'Đặt làm mặc định',
            kind: FieldKind.boolean,
          ),
        ],
        transform: (body) => {...body, 'ward': body['ward'] ?? ''},
        save: (body) => w.addresses.save(
          body,
          id: address == null ? null : apiId(address['id']),
        ),
      ),
    ),
  );
}

class LiveAddressSelection extends StatelessWidget {
  const LiveAddressSelection({
    super.key,
    required this.value,
    required this.onChanged,
    this.enabled = true,
  });
  final Json? value;
  final ValueChanged<Json> onChanged;
  final bool enabled;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const SCSection('Địa chỉ giao hàng'),
      if (value != null) ...[
        Text('${value!['recipientName']} · ${value!['recipientPhone']}'),
        Text(addressSummary(value!)),
      ] else
        const Text('Chọn địa chỉ đã lưu hoặc thêm địa chỉ người nhận.'),
      SCButton(
        value == null ? 'Chọn địa chỉ giao hàng' : 'Đổi địa chỉ giao hàng',
        outlined: true,
        onPressed: !enabled
            ? null
            : () async {
                final address = await Navigator.push<Json>(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const LiveAddressPage(select: true),
                  ),
                );
                if (address != null && context.mounted) onChanged(address);
              },
      ),
    ],
  );
}
