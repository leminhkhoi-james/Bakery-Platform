import 'package:flutter/material.dart';

import '../../core/utils/formatters.dart';
import '../../core/widgets/common.dart';
import '../../state/app_state.dart';

class SecurityPanel extends StatefulWidget {
  const SecurityPanel({super.key});
  @override
  State<SecurityPanel> createState() => _SecurityPanelState();
}

class _SecurityPanelState extends State<SecurityPanel> {
  final form = GlobalKey<FormState>();
  final current = TextEditingController(),
      password = TextEditingController(),
      confirmation = TextEditingController();
  final visible = <int>{};
  @override
  void dispose() {
    current.dispose();
    password.dispose();
    confirmation.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context),
        controllers = [current, password, confirmation];
    return Form(
      key: form,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SectionTitle('Cài đặt & đổi mật khẩu'),
          const SizedBox(height: 16),
          for (var i = 0; i < 3; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: TextFormField(
                controller: controllers[i],
                obscureText: !visible.contains(i),
                decoration: InputDecoration(
                  labelText: [
                    'Mật khẩu hiện tại',
                    'Mật khẩu mới',
                    'Xác nhận mật khẩu mới',
                  ][i],
                  suffixIcon: IconButton(
                    tooltip: 'Ẩn/hiện mật khẩu',
                    onPressed: () => setState(
                      () => visible.contains(i)
                          ? visible.remove(i)
                          : visible.add(i),
                    ),
                    icon: Icon(
                      visible.contains(i)
                          ? Icons.visibility_off
                          : Icons.visibility,
                    ),
                  ),
                ),
                validator: (v) =>
                    requiredValue(v) ??
                    (i == 1 && (v?.length ?? 0) < 6
                        ? 'Mật khẩu mới phải có ít nhất 6 ký tự.'
                        : null) ??
                    (i == 2 && v != password.text
                        ? 'Mật khẩu xác nhận không khớp.'
                        : null),
              ),
            ),
          FilledButton(
            onPressed: () {
              if (!form.currentState!.validate()) return;
              for (final c in controllers) {
                c.clear();
              }
              feedback(
                context,
                'Đã mô phỏng cập nhật mật khẩu. Không thay đổi tài khoản thật.',
              );
            },
            child: const Text('Cập nhật mật khẩu'),
          ),
          const SizedBox(height: 24),
          const SectionTitle('Tùy chọn thông báo'),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('SMS khi xe lạnh bắt đầu giao'),
            value: state.notifySms,
            onChanged: (v) {
              state.notifySms = v;
              state.changed();
            },
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Zalo khi bếp tải ảnh QC'),
            value: state.notifyZalo,
            onChanged: (v) {
              state.notifyZalo = v;
              state.changed();
            },
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Tự động lưu địa chỉ nhận tiệc mới'),
            value: state.autoSaveAddress,
            onChanged: (v) {
              state.autoSaveAddress = v;
              state.changed();
            },
          ),
          const Text(
            'Các tùy chọn chỉ được lưu trong phiên mô phỏng; không gửi SMS/Zalo.',
          ),
        ],
      ),
    );
  }
}
