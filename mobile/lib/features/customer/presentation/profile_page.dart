import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../auth/domain/demo_session.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context), session = w.session;
    return SweetCakeScaffold(
      screen: ScreenId.profile,
      children: [
        SCCard(
          color: AppColors.softPink,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: AppColors.white,
                child: Text(
                  session.displayName.characters.first,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Chào ${session.displayName}!',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              const Text('Những điều ngọt ngào của bạn, ở cùng một nơi.'),
            ],
          ),
        ),
        SCCard(
          child: Column(
            children: [
              SCKeyValue('Tên hiển thị', session.displayName),
              SCKeyValue('Email demo', session.email),
              SCKeyValue('Địa chỉ minh họa', session.address),
              const SizedBox(height: 12),
              SCButton(
                'Sửa hồ sơ local',
                outlined: true,
                onPressed: () => _edit(context),
              ),
            ],
          ),
        ),
        for (final item in [
          (ScreenId.tracking, 'Đơn bánh của tôi'),
          (ScreenId.requests, 'Yêu cầu & báo giá'),
          (ScreenId.chat, 'Tin nhắn với tiệm'),
          (ScreenId.studio, 'Ý tưởng bánh đã lưu'),
          (ScreenId.plans, 'Trở thành đối tác'),
        ])
          SCCard(
            padding: EdgeInsets.zero,
            child: ListTile(
              leading: Icon(iconFor(item.$1)),
              title: Text(item.$2),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => openScreen(context, item.$1),
            ),
          ),
        const SCNotice(
          'Sửa hồ sơ và địa chỉ chỉ có trong prototype local. Không khẳng định public API tương ứng đã được triển khai.',
        ),
        TextButton(
          onPressed: () {
            session.switchPersona(Persona.guest);
            Navigator.of(context).pushNamedAndRemoveUntil('/', (r) => false);
          },
          child: const Text('Kết thúc phiên demo'),
        ),
      ],
    );
  }

  Future<void> _edit(BuildContext context) => showSCSheet<void>(
    context,
    title: 'Hồ sơ local',
    child: const ProfileEditor(),
  );
}

class ProfileEditor extends StatefulWidget {
  const ProfileEditor({super.key});
  @override
  State<ProfileEditor> createState() => _ProfileEditorState();
}

class _ProfileEditorState extends State<ProfileEditor> {
  final name = TextEditingController(),
      email = TextEditingController(),
      address = TextEditingController();
  final form = GlobalKey<FormState>();
  bool initialized = false;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (initialized) return;
    initialized = true;
    final session = DemoScope.of(context).session;
    name.text = session.displayName;
    email.text = session.email;
    address.text = session.address;
  }

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    address.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SCField('Tên hiển thị', controller: name),
        SCField(
          'Email demo',
          controller: email,
          keyboardType: TextInputType.emailAddress,
          validator: (v) =>
              (v?.contains('@') ?? false) ? null : 'Email chưa hợp lệ.',
        ),
        SCField('Địa chỉ minh họa', controller: address, lines: 2),
        SCButton(
          'Lưu hồ sơ trong demo',
          onPressed: () {
            if (form.currentState!.validate()) {
              DemoScope.of(context).session
                  .updateProfile(name.text, email.text, address.text);
              Navigator.pop(context);
              demoFeedback(context);
            }
          },
        ),
      ],
    ),
  );
}
