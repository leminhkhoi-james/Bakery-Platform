import 'package:flutter/material.dart';

import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

class LiveAuthPage extends StatelessWidget {
  const LiveAuthPage({
    super.key,
    this.register = false,
    this.initialEmail = '',
    this.registrationConfirmed = false,
    this.reconcileRegistration = false,
  });
  final bool register;
  final String initialEmail;
  final bool registrationConfirmed, reconcileRegistration;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveFormPage<Object?>(
      privateContext: false,
      onSuccess: register
          ? null
          : (context, _) => Navigator.of(context).pushNamedAndRemoveUntil(
              '/profile',
              (route) => route.settings.name == '/',
            ),
      title: register ? 'Tạo tài khoản' : 'Đăng nhập SweetCake',
      action: register ? 'Tạo tài khoản' : 'Đăng nhập',
      initial: {if (initialEmail.isNotEmpty) 'email': initialEmail},
      recoveryBuilder: register
          ? (context, values, failure) => Column(
              children: [
                const SizedBox(height: 16),
                SCNotice(
                  failure.uncertain
                      ? 'Không gửi lại đăng ký chưa rõ kết quả. Đăng nhập để kiểm tra tài khoản; mật khẩu cần được nhập lại.'
                      : 'Email đã tồn tại. Đăng nhập để kiểm tra tài khoản; mật khẩu cần được nhập lại.',
                ),
                SCButton(
                  'Kiểm tra tài khoản bằng đăng nhập',
                  key: const ValueKey('registration-reconcile'),
                  onPressed: () => Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (_) => LiveAuthPage(
                        initialEmail: '${values['email'] ?? ''}',
                        reconcileRegistration: true,
                      ),
                    ),
                  ),
                ),
              ],
            )
          : null,
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
          return body['email'] as String;
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
              onPressed: () async {
                final registered = await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const LiveAuthPage(register: true),
                  ),
                );
                if (registered is String && context.mounted) {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (_) => LiveAuthPage(
                        initialEmail: registered,
                        registrationConfirmed: true,
                      ),
                    ),
                  );
                }
              },
              child: const Text('Tạo tài khoản mới'),
            ),
          if (registrationConfirmed)
            const SCNotice('Đã tạo tài khoản. Đăng nhập để tiếp tục.'),
          if (reconcileRegistration)
            const SCNotice(
              'Đăng nhập để xác nhận tài khoản. Nếu chưa đăng nhập được, kiểm tra kết nối và thông tin trước khi đăng ký lại.',
            ),
          if (!register) const SCNotice('Chưa hỗ trợ đặt lại mật khẩu.'),
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
          for (final destination in const [
            ('/requests', 'Yêu cầu bánh của tôi'),
            ('/offers', 'Báo giá nhận được'),
            ('/cart', 'Giỏ bánh'),
            ('/addresses', 'Địa chỉ của tôi'),
            ('/orders', 'Đơn bánh của tôi'),
            ('/chat', 'Trò chuyện'),
          ])
            SCButton(
              destination.$2,
              outlined: true,
              onPressed: () => liveOpen(context, destination.$1),
            ),
          LiveCommand(
            'Làm mới quyền tài khoản',
            key: const ValueKey('refresh-session'),
            run: session.reloadRoles,
          ),
          if (session.hasRole('CUSTOMER'))
            SCButton(
              'Thiết kế bánh AI',
              outlined: true,
              onPressed: () => liveOpen(context, '/ai-jobs'),
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
          if (session.hasRole('BAKERY_OWNER'))
            for (final destination in const [
              ('/vendor-requests', 'Yêu cầu đang tìm tiệm'),
              ('/vendor-offers', 'Báo giá đã gửi'),
              ('/vendor-orders', 'Đơn bánh của tiệm'),
              ('/vendor-chat', 'Trò chuyện của tiệm'),
            ])
              SCButton(
                destination.$2,
                outlined: true,
                onPressed: () => liveOpen(context, destination.$1),
              ),
          if (session.hasRole('ADMIN')) ...[
            SCButton(
              'Duyệt thiết kế AI',
              key: const ValueKey('admin-ai-nav'),
              onPressed: () => liveOpen(context, '/admin-ai-designs'),
            ),
            SCButton(
              'Giám sát báo giá',
              key: const ValueKey('admin-offers-nav'),
              onPressed: () => liveOpen(context, '/admin-offers'),
            ),
            SCButton(
              'Đơn bánh và đánh giá',
              key: const ValueKey('admin-orders-nav'),
              onPressed: () => liveOpen(context, '/admin-orders'),
            ),
            SCButton(
              'Giám sát yêu cầu và thiết kế',
              key: const ValueKey('admin-requests-nav'),
              onPressed: () => liveOpen(context, '/admin-requests'),
            ),
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
            'Địa chỉ giao hàng được quản lý riêng và xác minh theo tài khoản. Thông tin hồ sơ ở đây chỉ hiển thị để đối chiếu.',
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
