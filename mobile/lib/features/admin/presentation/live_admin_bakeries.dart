import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../catalog/presentation/live_public_pages.dart';

class LiveAdminBakeries extends StatefulWidget {
  const LiveAdminBakeries({super.key});
  @override
  State<LiveAdminBakeries> createState() => _LiveAdminBakeriesState();
}

class _LiveAdminBakeriesState extends State<LiveAdminBakeries> {
  int page = 1, revision = 0;
  String query = '', status = '';
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<ApiPage>(
      key: ValueKey('$page:$revision:$status'),
      title: 'Duyệt tiệm bánh',
      operational: true,
      load: () => w.bakeries.adminList(
        query: {'page': page, 'size': 12, 'query': query, 'status': status},
      ),
      builder: (c, data, _) => [
        TextField(
          key: const ValueKey('admin-bakery-search'),
          decoration: const InputDecoration(labelText: 'Tìm tiệm'),
          onSubmitted: (s) => setState(() {
            query = s;
            page = 1;
            revision++;
          }),
        ),
        DropdownButtonFormField<String>(
          initialValue: status,
          decoration: const InputDecoration(labelText: 'Trạng thái'),
          items: [
            for (final s in [
              '',
              'DRAFT',
              'PENDING_APPROVAL',
              'ACTIVE',
              'SUSPENDED',
              'CLOSED',
            ])
              DropdownMenuItem(value: s, child: Text(s.isEmpty ? 'Tất cả' : s)),
          ],
          onChanged: (s) => setState(() {
            status = s!;
            page = 1;
          }),
        ),
        Text('${data.total} tiệm · Trang $page'),
        if (data.items.isEmpty) const SCNotice('Chưa có hồ sơ phù hợp.'),
        for (final b in data.items)
          SCCard(
            key: ValueKey('admin-bakery-${b['id']}'),
            onTap: () async {
              await Navigator.push(
                c,
                MaterialPageRoute(
                  builder: (_) => LiveAdminBakeryDetail('${b['id']}'),
                ),
              );
              if (mounted) setState(() => revision++);
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${b['name']}', style: Theme.of(c).textTheme.titleLarge),
                Text('${b['status']}'),
              ],
            ),
          ),
        Wrap(
          spacing: 12,
          children: [
            if (page > 1)
              OutlinedButton(
                onPressed: () => setState(() => page--),
                child: const Text('Trang trước'),
              ),
            if (data.hasNext)
              OutlinedButton(
                onPressed: () => setState(() => page++),
                child: const Text('Trang tiếp'),
              ),
          ],
        ),
      ],
    );
  }
}

class LiveAdminBakeryDetail extends StatelessWidget {
  const LiveAdminBakeryDetail(this.id, {super.key});
  final String id;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<Json>(
      title: 'Hồ sơ duyệt tiệm',
      operational: true,
      load: () => w.bakeries.adminDetail(id),
      builder: (c, data, reload) {
        final b = object(data['bakery']);
        return [
          Text('${b['name']}', style: Theme.of(c).textTheme.headlineMedium),
          SCKeyValue('Trạng thái', '${b['status']}'),
          Text('${b['description'] ?? ''}'),
          ...operationSummary(object(b['operations'])),
          const SCSection('Thành viên'),
          for (final m in objects(data['members']))
            Text(
              '${m['displayNameSnapshot'] ?? 'Chủ tiệm'} · ${m['memberRole']} · ${m['status']}',
            ),
          if (data['subscription'] != null)
            SCKeyValue(
              'Subscription',
              '${object(data['subscription'])['status'] ?? 'Xem chi tiết gói ở trang duyệt thanh toán'}',
            ),
          SCButton(
            'Cập nhật trạng thái tiệm',
            key: const ValueKey('review-bakery'),
            onPressed: () async {
              await openLiveForm<Json>(
                c,
                title: 'Duyệt trạng thái tiệm',
                initial: {'status': b['status']},
                fields: const [
                  FormFieldSpec(
                    'status',
                    'Trạng thái',
                    kind: FieldKind.choice,
                    required: true,
                    choices: [
                      'DRAFT',
                      'PENDING_APPROVAL',
                      'ACTIVE',
                      'SUSPENDED',
                      'CLOSED',
                    ],
                  ),
                ],
                save: (body) async {
                  await w.bakeries.adminStatus(id, '${body['status']}');
                  return w.bakeries.adminDetail(id);
                },
              );
              reload();
            },
          ),
          const SCNotice(
            'Duyệt tiệm chưa tự hoàn tất mọi điều kiện. Backend chỉ kích hoạt quyền chủ tiệm khi có subscription hiệu lực.',
          ),
        ];
      },
    );
  }
}
