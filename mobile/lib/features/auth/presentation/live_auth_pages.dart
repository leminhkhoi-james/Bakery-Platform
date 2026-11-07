import 'package:flutter/material.dart';

import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

class LiveAuthPage extends StatelessWidget {
  const LiveAuthPage({super.key, this.register = false});
  final bool register;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveFormPage<Object?>(
      privateContext: false,
      title: register ? 'Tạo tài khoản' : 'Đăng nhập SweetCake',
      action: register ? 'Tạo tài khoản' : 'Đăng nhập',
      initial: const {},
      fields: [
        const FormFieldSpec(
          'email',
          'Email',
          required: true,
          kind: FieldKind.email,
          maximum: 320,
        ),
        FormFieldSpec(
          'password',
          'Mật khẩu',
          required: true,
          kind: FieldKind.password,
          minimum: register ? 8 : 1,
          maximum: 100,
        ),
        if (register) ...[
          const FormFieldSpec(
            'displayName',
            'Tên hiển thị',
            required: true,
            maximum: 120,
          ),
          const FormFieldSpec('phoneNumber', 'Số điện thoại', maximum: 30),
        ],
      ],
      save: (body) async {
        if (register) {
          await w.session.register(body);
          return true;
        }
        await w.session.login(
          body['email'] as String,
          body['password'] as String,
        );
        return true;
      },
      extra: Column(
        children: [
          if (!register)
            TextButton(
              key: const ValueKey('register-nav'),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const LiveAuthPage(register: true),
                ),
              ),
              child: const Text('Tạo tài khoản mới'),
            ),
          const SCNotice(
            'Chưa hỗ trợ đặt lại mật khẩu hoặc sửa địa chỉ tài khoản.',
          ),
        ],
      ),
    );
  }
}

class LiveProfilePage extends StatelessWidget {
  const LiveProfilePage({super.key});
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context), session = w.session, user = session.user;
    return LiveScaffold(
      title: 'Tài khoản của tôi',
      children: [
        if (session.restoring) const LinearProgressIndicator(),
        if (session.notice != null) SCNotice(session.notice!),
        if (user == null) ...[
          const SCMascot(),
          const Text('Đăng nhập để quản lý tiệm và gói thuê của bạn.'),
          SCButton(
            'Đăng nhập',
            key: const ValueKey('login-nav'),
            onPressed: () => liveOpen(context, '/login'),
          ),
          if (session.accessToken != null)
            LiveCommand('Thử khôi phục phiên', run: session.restore),
        ] else ...[
          Text(
            '${user['displayName']}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          SCKeyValue('Email', '${user['email']}'),
          SCKeyValue('Điện thoại', '${user['phoneNumber'] ?? 'Chưa cung cấp'}'),
          SCKeyValue('Vai trò', (user['roles'] as List).join(', ')),
          SCKeyValue('Trạng thái', '${user['status']}'),
          LiveCommand(
            'Làm mới quyền tài khoản',
            key: const ValueKey('refresh-session'),
            run: session.reloadRoles,
          ),
          if (session.hasRole('CUSTOMER'))
            SCButton(
              'Hồ sơ đối tác của tôi',
              key: const ValueKey('onboarding-nav'),
              onPressed: () => liveOpen(context, '/vendor-profile'),
            ),
          if (session.hasRole('BAKERY_OWNER'))
            SCButton(
              'Quản lý catalog',
              onPressed: () => liveOpen(context, '/vendor-menu'),
            ),
          if (session.hasRole('ADMIN')) ...[
            SCButton(
              'Duyệt tiệm bánh',
              key: const ValueKey('admin-bakeries-nav'),
              onPressed: () => liveOpen(context, '/admin-vendors'),
            ),
            SCButton(
              'Duyệt thanh toán gói',
              key: const ValueKey('admin-payments-nav'),
              onPressed: () => liveOpen(context, '/admin-payments'),
            ),
            SCButton(
              'Quản lý gói',
              key: const ValueKey('admin-plans-nav'),
              onPressed: () => liveOpen(context, '/admin-plans'),
            ),
          ],
          const SCNotice(
            'Hồ sơ chỉ đọc. Backend chưa cung cấp API công khai để sửa hồ sơ, quản lý địa chỉ hoặc người dùng.',
          ),
          LiveCommand(
            'Đăng xuất',
            key: const ValueKey('logout'),
            run: session.logout,
            outlined: true,
          ),
        ],
      ],
    );
  }
}
