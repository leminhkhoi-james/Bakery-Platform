import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/live_upload.dart';
import '../../../core/widgets/structured_form.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import 'live_editor_schemas.dart';
import 'live_public_pages.dart';

Future<Json?> currentBakery(LiveWorkspace w) async {
  final value = await w.bakeries.onboarding();
  if (value == null) return w.bakery;
  if (w.bakery == null) {
    w.selectBakery(value);
    return value;
  }
  if (w.bakery!['id'] == value['id']) w.bakery = value;
  return w.bakery;
}

class LiveOwnerProfile extends StatelessWidget {
  const LiveOwnerProfile({super.key});
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<Json?>(
      title: 'Hồ sơ và vận hành',
      operational: true,
      load: () => currentBakery(w),
      builder: (context, b, reload) => [
        if (b == null) ...[
          const SCSection(
            'Trở thành đối tác SweetCake',
            description: 'Gửi hồ sơ tiệm, chờ quản trị duyệt và đăng ký gói thuê. Quyền chủ tiệm được Backend cấp sau khi đủ điều kiện.',
          ),
          SCButton(
            'Gửi hồ sơ đối tác',
            key: const ValueKey('onboarding-create'),
            onPressed: () async {
              final result = await openStructuredForm(
                context,
                title: 'Hồ sơ đối tác mới',
                initial: const {
                  'addresses': [],
                  'serviceAreas': [],
                  'businessHours': [],
                },
                fields: bakeryFields
                    .where((f) => f.name != 'description')
                    .toList(),
                collections: operationsSchema,
                validate: validateOperations,
                save: (body) async {
                  await w.bakeries.submitOnboarding({
                    for (final k in ['name', 'phoneNumber', 'email'])
                      if (body[k] != null) k: body[k],
                    'operations': {
                      for (final c in operationsSchema) c.name: body[c.name],
                    },
                  });
                  final verified = await w.bakeries.onboarding();
                  if (verified == null) {
                    throw const ApiFailure(
                      502,
                      'Chưa đối chiếu được hồ sơ sau khi gửi.',
                    );
                  }
                  return verified;
                },
              );
              if (result != null) {
                w.selectBakery(result);
                reload();
              }
            },
          ),
        ] else ...[
          Text(
            '${b['name']}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          SCKeyValue('Trạng thái hồ sơ', '${b['status']}'),
          if (w.verifiedBakeries.length > 1)
            DropdownButtonFormField<String>(
              key: ValueKey('bakery-selector-${b['id']}'),
              initialValue: '${b['id']}',
              decoration: const InputDecoration(labelText: 'Tiệm đang quản lý'),
              items: [
                for (final item in w.verifiedBakeries)
                  DropdownMenuItem(
                    value: '${item['id']}',
                    child: Text('${item['name']}'),
                  ),
              ],
              onChanged: (id) {
                w.selectBakery(
                  w.verifiedBakeries.firstWhere((v) => v['id'] == id),
                );
                reload();
              },
            ),
          const SCNotice(
            'API onboarding chỉ trả một membership đầu tiên. Danh sách nhiều tiệm chưa có API công khai; không suy quyền sở hữu từ danh bạ public.',
          ),
          ...operationSummary(object(b['operations'])),
          SCButton(
            'Xem gói thuê của tiệm',
            key: const ValueKey('owner-subscription-nav'),
            onPressed: () => liveOpen(context, '/vendor-subscription'),
          ),
          LiveCommand(
            'Hoàn tất đăng ký đối tác',
            key: const ValueKey('onboarding-complete'),
            run: () async {
              await w.bakeries.complete('${b['id']}');
              await w.session.reloadRoles();
              await currentBakery(w);
            },
            after: reload,
          ),
          if (w.session.hasRole('BAKERY_OWNER')) ...[
            SCButton(
              'Sửa hồ sơ tiệm',
              key: const ValueKey('edit-bakery'),
              onPressed: () async {
                await openLiveForm<Json>(
                  context,
                  title: 'Sửa hồ sơ tiệm',
                  fields: bakeryFields,
                  initial: b,
                  save: (body) async {
                    w.bakery = await w.bakeries.update('${b['id']}', body);
                    return (await currentBakery(w))!;
                  },
                );
                reload();
              },
            ),
            SCButton(
              'Sửa vận hành',
              key: const ValueKey('edit-operations'),
              onPressed: () async {
                final fresh = await currentBakery(w);
                if (!context.mounted || fresh == null) return;
                await openStructuredForm(
                  context,
                  title: 'Vận hành của tiệm',
                  initial: object(fresh['operations']),
                  collections: operationsSchema,
                  validate: validateOperations,
                  notice: 'Lưu sẽ thay thế toàn bộ địa chỉ, khu vực và giờ mở cửa. Các mục bị xóa sẽ được gỡ khỏi tiệm.',
                  save: (body) async {
                    final persisted = await w.bakeries.operations(
                      '${b['id']}',
                      body,
                    );
                    w.bakery = {...b, 'operations': persisted};
                    return (await currentBakery(w))!;
                  },
                );
                reload();
              },
            ),
            LiveUpload(
              'Logo tiệm',
              upload: (file) async {
                await w.bakeries.upload('${b['id']}', 'logo', [file]);
                await currentBakery(w);
              },
              after: reload,
            ),
            LiveUpload(
              'Ảnh bìa',
              upload: (file) async {
                await w.bakeries.upload('${b['id']}', 'cover', [file]);
                await currentBakery(w);
              },
              after: reload,
            ),
            if (b['status'] == 'DRAFT')
              LiveCommand(
                'Gửi tiệm chờ duyệt',
                key: const ValueKey('submit-extra-bakery'),
                run: () async {
                  w.bakery = await w.bakeries.submit('${b['id']}');
                  await currentBakery(w);
                },
                after: reload,
              ),
            SCButton(
              'Quản lý catalog',
              key: const ValueKey('owner-catalog-nav'),
              onPressed: () => liveOpen(context, '/vendor-menu'),
            ),
            SCButton(
              'Xem thành viên',
              key: const ValueKey('owner-members-nav'),
              outlined: true,
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => _LiveMembers('${b['id']}')),
              ),
            ),
          ],
        ],
        if (w.session.hasRole('BAKERY_OWNER'))
          SCButton(
            'Thêm tiệm khác',
            key: const ValueKey('create-extra-bakery'),
            outlined: true,
            onPressed: () async {
              final result = await openLiveForm<Json>(
                context,
                title: 'Tạo tiệm mới',
                fields: bakeryFields,
                save: w.bakeries.create,
              );
              if (result != null) {
                w.selectBakery(result);
                reload();
              }
            },
          ),
      ],
    );
  }
}

class _LiveMembers extends StatelessWidget {
  const _LiveMembers(this.id);
  final String id;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<List<Json>>(
      title: 'Thành viên của tiệm',
      operational: true,
      load: () => w.bakeries.members(id),
      builder: (c, m, _) => [
        for (final member in m)
          ListTile(
            title: Text('${member['displayNameSnapshot'] ?? 'Thành viên'}'),
            subtitle: Text('${member['memberRole']} · ${member['status']}'),
          ),
        const SCNotice(
          'Danh sách chỉ đọc. Backend không cung cấp API chỉnh vai trò hoặc thêm/xóa thành viên công khai.',
        ),
      ],
    );
  }
}
