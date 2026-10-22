import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/widgets/common.dart';
import '../../core/utils/formatters.dart';
import '../../models/accounts.dart';
import '../../state/app_state.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  static const labels = {
    'shopName': 'Tên tiệm bánh',
    'headChef': 'Chủ tiệm / bếp trưởng',
    'phone': 'Hotline tiệm bánh',
    'email': 'Email liên hệ',
    'bio': 'Giới thiệu & phong cách bánh',
    'kitchenAddress': 'Địa chỉ tiệm bánh',
    'operatingHours': 'Giờ mở cửa',
    'deliveryRadius': 'Bán kính nhận giao (km)',
    'minLeadTime': 'Thời gian tối thiểu (giờ)',
    'bankName': 'Tên ngân hàng',
    'bankAccount': 'Số tài khoản mẫu',
    'accountHolder': 'Tên chủ tài khoản mẫu',
  };
  final form = GlobalKey<FormState>();
  Map<String, TextEditingController>? controllers;
  bool rfq = true, sound = true, urgent = true;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (controllers != null) return;
    final settings = AppScope.of(context).settings;
    controllers = {
      for (final key in labels.keys)
        key: TextEditingController(text: settings.values[key] ?? ''),
    };
    rfq = settings.receiveRfq;
    sound = settings.sound;
    urgent = settings.urgent;
  }

  @override
  void dispose() {
    for (final c in controllers!.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    return Form(
      key: form,
      child: PageBody(
        title: 'Hồ sơ tiệm bánh',
        eyebrow: 'Thiết lập xưởng',
        subtitle: 'Chỉ lưu cấu hình mẫu trong phiên. Không thay đổi gian hàng hay tài khoản ngân hàng thật.',
        children: [
          OutlinedButton(
            onPressed: () => go(context, Destination.stores),
            child: const Text('Xem gian hàng trên sàn'),
          ),
          for (final field in labels.entries)
            TextFormField(
              controller: controllers![field.key],
              minLines: field.key == 'bio' ? 3 : 1,
              maxLines: field.key == 'bio' ? 5 : 1,
              keyboardType: field.key == 'phone'
                  ? TextInputType.phone
                  : field.key == 'email'
                  ? TextInputType.emailAddress
                  : [
                      'deliveryRadius',
                      'minLeadTime',
                      'bankAccount',
                    ].contains(field.key)
                  ? TextInputType.number
                  : TextInputType.text,
              validator: (v) =>
                  requiredValue(v) ??
                  (field.key == 'email' ? emailValue(v) : null),
              decoration: InputDecoration(labelText: field.value),
            ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Nhận thông báo yêu cầu RFQ mới'),
            value: rfq,
            onChanged: (v) => setState(() => rfq = v),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Âm thanh chuông báo đơn mới'),
            value: sound,
            onChanged: (v) => setState(() => sound = v),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Tiếp nhận đơn hỏa tốc'),
            value: urgent,
            onChanged: (v) => setState(() => urgent = v),
          ),
          FilledButton(
            onPressed: () {
              if (!form.currentState!.validate()) return;
              state.saveSettings(
                VendorSettings(
                  values: {
                    for (final e in controllers!.entries) e.key: e.value.text,
                  },
                  receiveRfq: rfq,
                  sound: sound,
                  urgent: urgent,
                ),
              );
              feedback(context, 'Đã lưu hồ sơ tiệm bánh mô phỏng.');
            },
            child: const Text('Lưu hồ sơ tiệm bánh'),
          ),
        ],
      ),
    );
  }
}
