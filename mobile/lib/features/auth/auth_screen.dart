import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/common.dart';
import '../../models/accounts.dart';
import '../../state/app_state.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final form = GlobalKey<FormState>();
  final phone = TextEditingController(), password = TextEditingController();
  final lastName = TextEditingController(), firstName = TextEditingController();
  bool register = false, visible = false;
  @override
  void dispose() {
    for (final c in [phone, password, lastName, firstName]) {
      c.dispose();
    }
    super.dispose();
  }

  void submit() {
    if (!form.currentState!.validate()) return;
    final state = AppScope.of(context);
    state.signedIn = true;
    if (register) {
      state.saveProfile(
        CustomerProfile(
          name: '${lastName.text} ${firstName.text}'.trim(),
          phone: phone.text,
          email: '${phone.text.replaceAll(' ', '')}@sweetcake.vn',
          tier: 'Hội viên Mới',
          points: 100,
        ),
      );
    }
    state.changed();
    feedback(
      context,
      register
          ? 'Đã tạo hồ sơ mô phỏng cục bộ.'
          : 'Đăng nhập mô phỏng thành công.',
    );
    password.clear();
    go(context, Destination.home);
  }

  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: PageBody(
      title: register ? 'Gia nhập SweetCake' : 'Chào mừng trở lại',
      eyebrow: 'Tài khoản SweetCake',
      subtitle: 'Tài khoản demo cục bộ · Không có xác thực backend',
      children: [
        FilterChips(
          values: const {'login': 'Đăng nhập', 'register': 'Đăng ký tài khoản'},
          selected: register ? 'register' : 'login',
          onSelected: (v) => setState(() {
            register = v == 'register';
            form.currentState?.reset();
          }),
        ),
        if (register) ...[
          TextFormField(
            controller: lastName,
            decoration: const InputDecoration(labelText: 'Họ & tên đệm'),
          ),
          TextFormField(
            controller: firstName,
            validator: requiredValue,
            decoration: const InputDecoration(labelText: 'Tên của bạn'),
          ),
        ],
        TextFormField(
          key: const ValueKey('auth-phone'),
          controller: phone,
          keyboardType: TextInputType.phone,
          validator: requiredValue,
          decoration: const InputDecoration(
            labelText: 'Số điện thoại',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
        ),
        TextFormField(
          key: const ValueKey('auth-password'),
          controller: password,
          obscureText: !visible,
          validator: (v) =>
              requiredValue(v) ??
              (register && (v?.length ?? 0) < 6
                  ? 'Mật khẩu phải có ít nhất 6 ký tự.'
                  : null),
          decoration: InputDecoration(
            labelText: register ? 'Mật khẩu (tối thiểu 6 ký tự)' : 'Mật khẩu',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              tooltip: 'Ẩn/hiện mật khẩu',
              onPressed: () => setState(() => visible = !visible),
              icon: Icon(visible ? Icons.visibility_off : Icons.visibility),
            ),
          ),
        ),
        if (!register)
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => feedback(
                context,
                'Vui lòng liên hệ quản trị viên để được hướng dẫn khôi phục mật khẩu.',
              ),
              child: const Text('Quên mật khẩu?'),
            ),
          ),
        FilledButton(
          key: const ValueKey('auth-submit'),
          onPressed: submit,
          child: Text(register ? 'Tạo tài khoản' : 'Đăng nhập vào tài khoản'),
        ),
      ],
    ),
  );
}
