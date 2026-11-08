import 'package:flutter/material.dart';

import '../../../app/router/screen_id.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../domain/demo_session.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({super.key});
  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final form = GlobalKey<FormState>();
  final email = TextEditingController(),
      password = TextEditingController(),
      name = TextEditingController(),
      confirm = TextEditingController();
  bool registration = false, terms = false, busy = false;
  Persona persona = Persona.customer;
  @override
  void dispose() {
    for (final c in [email, password, name, confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => SweetCakeScaffold(
    screen: ScreenId.login,
    children: [
      const Center(child: SCMascot()),
      Center(
        child: Text(
          registration
              ? 'Bắt đầu câu chuyện ngọt ngào'
              : 'Chào mừng bạn trở lại',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
      ),
      SegmentedButton<bool>(
        segments: const [
          ButtonSegment(value: false, label: Text('Đăng nhập')),
          ButtonSegment(value: true, label: Text('Đăng ký')),
        ],
        selected: {registration},
        onSelectionChanged: (s) => setState(() => registration = s.first),
      ),
      SCCard(
        child: Form(
          key: form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (registration) SCField('Tên hiển thị', controller: name),
              SCField(
                'Email',
                controller: email,
                keyboardType: TextInputType.emailAddress,
                validator: (v) =>
                    RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                        .hasMatch(v?.trim() ?? '')
                    ? null
                    : 'Nhập email hợp lệ để xem trước biểu mẫu.',
              ),
              SCField(
                'Mật khẩu demo',
                controller: password,
                obscure: true,
                validator: (v) => (v?.length ?? 0) >= 8
                    ? null
                    : 'Mật khẩu minh họa cần ít nhất 8 ký tự.',
              ),
              if (registration)
                SCField(
                  'Nhập lại mật khẩu',
                  controller: confirm,
                  obscure: true,
                  validator: (v) => v == password.text
                      ? null
                      : 'Mật khẩu nhập lại chưa khớp.',
                ),
              if (registration)
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Tôi hiểu đây là bản demo local'),
                  value: terms,
                  onChanged: (v) => setState(() => terms = v ?? false),
                ),
              if (!registration)
                DropdownButtonFormField<Persona>(
                  isExpanded: true,
                  initialValue: persona,
                  decoration: const InputDecoration(
                    labelText: 'Vai trò xem trước',
                  ),
                  items: [
                    for (final p in Persona.values.where(
                      (p) => p != Persona.guest,
                    ))
                      DropdownMenuItem(
                        value: p,
                        child: Text('${p.label} · demo'),
                      ),
                  ],
                  onChanged: (p) => setState(() => persona = p!),
                ),
              const SizedBox(height: 20),
              SCButton(
                registration ? 'Tạo hồ sơ demo' : 'Tiếp tục trong demo',
                busy: busy,
                onPressed: () async {
                  if (!form.currentState!.validate() || busy) return;
                  if (registration && !terms) {
                    demoFeedback(context, 'Vui lòng xác nhận chế độ demo.');
                    return;
                  }
                  setState(() => busy = true);
                  await Future<void>.delayed(const Duration(milliseconds: 180));
                  if (!context.mounted) return;
                  final w = DemoScope.of(context),
                      selected = registration ? Persona.customer : persona;
                  w.session.switchPersona(selected);
                  if (registration) {
                    w.session.updateProfile(
                      name.text.trim(),
                      email.text.trim(),
                      w.session.address,
                    );
                  }
                  final target = selected == Persona.owner
                      ? ScreenId.vendorDashboard
                      : selected == Persona.admin
                      ? ScreenId.adminDashboard
                      : ScreenId.home;
                  demoFeedback(
                    context,
                    'Đã mở phiên mô phỏng; không xác thực với Identity Service',
                  );
                  Navigator.of(context)
                      .pushNamedAndRemoveUntil(target.path, (r) => false);
                },
              ),
              if (!registration)
                TextButton(
                  onPressed: () => showSCSheet<void>(
                    context,
                    title: 'Khôi phục mật khẩu',
                    child: const SCNotice(
                      'Web/Backend chưa có luồng public khôi phục mật khẩu đã xác minh. Prototype không gửi email hoặc đổi mật khẩu.',
                    ),
                  ),
                  child: const Text('Quên mật khẩu?'),
                ),
            ],
          ),
        ),
      ),
      const SCNotice(
        'Không nhập mật khẩu thật. Dữ liệu chỉ kiểm tra biểu mẫu trên thiết bị; không có JWT hoặc phiên đăng nhập Backend.',
      ),
    ],
  );
}
