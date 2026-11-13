import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/structured_form.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../catalog/presentation/live_owner_catalog.dart';
import '../../subscription/presentation/live_subscription_pages.dart';

const _planFields = [
  FormFieldSpec('code', 'Mã gói', required: true, maximum: 50),
  FormFieldSpec('name', 'Tên gói', required: true, maximum: 120),
  FormFieldSpec('description', 'Mô tả', maximum: 4000),
  FormFieldSpec(
    'monthlyPrice',
    'Giá tháng (VND)',
    required: true,
    kind: FieldKind.money,
  ),
  FormFieldSpec(
    'currency',
    'Tiền tệ',
    kind: FieldKind.choice,
    required: true,
    choices: ['VND'],
  ),
  FormFieldSpec(
    'billingPeriodMonths',
    'Số tháng mỗi chu kỳ',
    required: true,
    kind: FieldKind.integer,
    minimum: 1,
  ),
  FormFieldSpec(
    'status',
    'Trạng thái',
    required: true,
    kind: FieldKind.choice,
    choices: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
  ),
];
const _featureSchema = [
  CollectionSpec('featureEntries', 'Quyền lợi gói', [
    FormFieldSpec('key', 'Tên quyền lợi', required: true, maximum: 80),
    FormFieldSpec('value', 'Nội dung quyền lợi', required: true, maximum: 255),
  ]),
];

class LiveAdminPlans extends StatelessWidget {
  const LiveAdminPlans({super.key});
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<List<SubscriptionPlan>>(
      title: 'Quản lý gói',
      operational: true,
      load: () => w.subscriptions.plans(admin: true),
      builder: (c, plans, reload) => [
        SCButton(
          'Tạo gói thuê',
          key: const ValueKey('create-plan'),
          onPressed: () => editPlan(c, w, null, reload),
        ),
        if (plans.isEmpty) const SCNotice('Chưa có gói thuê.'),
        for (final p in plans)
          SCCard(
            key: ValueKey('admin-plan-${p.id}'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(p.name, style: Theme.of(c).textTheme.titleLarge),
                Text('${p.code} · ${p.json['status']}'),
                Text(
                  '${p.price.display(p.currency)} · Chu kỳ ${p.months} tháng',
                ),
                for (final feature in p.features.entries)
                  SCKeyValue(feature.key, '${feature.value}'),
                SCButton(
                  'Sửa gói',
                  key: ValueKey('edit-plan-${p.id}'),
                  outlined: true,
                  onPressed: () => editPlan(c, w, p, reload),
                ),
                if (p.json['status'] != 'ARCHIVED')
                  LiveCommand(
                    'Lưu trữ gói',
                    key: ValueKey('archive-plan-${p.id}'),
                    run: () async {
                      if (!await confirmRemove(
                        c,
                        'Lưu trữ gói thuê?',
                        'Gói sẽ ngừng bán công khai. Đơn và kỳ đăng ký đã tạo giữ snapshot cũ.',
                      )) {
                        return;
                      }
                      await w.subscriptions.archive(p.id);
                      await w.subscriptions.plans(admin: true);
                    },
                    after: reload,
                    outlined: true,
                  ),
              ],
            ),
          ),
        const SCNotice(
          'Quyền lợi hiển thị theo map của server. Ứng dụng không tự áp hạn mức hoặc sửa snapshot đơn cũ khi chỉnh gói.',
        ),
      ],
    );
  }
}

Future<void> editPlan(
  BuildContext c,
  LiveWorkspace w,
  SubscriptionPlan? plan,
  VoidCallback reload,
) async {
  final initial = <String, dynamic>{
    if (plan != null)
      ...plan.json
    else ...{
      'currency': 'VND',
      'billingPeriodMonths': 1,
      'status': 'ACTIVE',
    },
    'featureEntries': [
      if (plan != null)
        for (final f in plan.features.entries) {'key': f.key, 'value': f.value},
    ],
  };
  initial.remove('id');
  await openStructuredForm(
    c,
    title: plan == null ? 'Gói thuê mới' : 'Chỉnh gói thuê',
    initial: initial,
    fields: _planFields,
    collections: _featureSchema,
    notice: 'Mã gói không đổi được sau khi có đơn. Snapshot đơn cũ giữ nguyên giá và quyền lợi.',
    save: (body) async {
      final entries = objects(body.remove('featureEntries'));
      final features = <String, String>{};
      for (final f in entries) {
        if (features.containsKey(f['key'])) {
          throw const ApiFailure(422, 'Tên quyền lợi bị trùng.');
        }
        features['${f['key']}'] = '${f['value']}';
      }
      body['features'] = features;
      body['code'] = '${body['code']}'.toUpperCase();
      final result = await w.subscriptions.savePlan(body, id: plan?.id);
      final verified = await w.subscriptions.plans(admin: true);
      if (!verified.any((p) => p.id == result.id)) {
        throw const ApiFailure(
          502,
          'Chưa đối chiếu được gói sau khi lưu.',
          uncertain: true,
        );
      }
      return result.json;
    },
  );
  reload();
}

class LiveAdminPayments extends StatefulWidget {
  const LiveAdminPayments({super.key});
  @override
  State<LiveAdminPayments> createState() => _LiveAdminPaymentsState();
}

class _LiveAdminPaymentsState extends State<LiveAdminPayments> {
  int page = 1, revision = 0;
  Json filters = {'status': 'SUBMITTED', 'sort': 'submittedAt,asc'};
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<ApiPage>(
      key: ValueKey('$page:$revision'),
      title: 'Duyệt thanh toán gói',
      operational: true,
      load: () => w.subscriptions.payments(
        query: {...filters, 'page': page, 'size': 12},
      ),
      builder: (c, data, reload) => [
        SCButton(
          'Lọc thanh toán',
          key: const ValueKey('filter-payments'),
          outlined: true,
          onPressed: () async {
            final result = await openLiveForm<Json>(
              c,
              title: 'Lọc thanh toán gói',
              initial: filters,
              fields: const [
                FormFieldSpec(
                  'status',
                  'Trạng thái',
                  kind: FieldKind.choice,
                  choices: ['SUBMITTED', 'APPROVED', 'REJECTED'],
                ),
                FormFieldSpec('bakeryId', 'ID tiệm (nếu biết)'),
                FormFieldSpec('submittedFrom', 'Từ ngày ISO8601'),
                FormFieldSpec('submittedTo', 'Đến ngày ISO8601'),
                FormFieldSpec(
                  'sort',
                  'Thứ tự gửi',
                  kind: FieldKind.choice,
                  choices: ['submittedAt,asc', 'submittedAt,desc'],
                ),
              ],
              save: (body) async {
                for (final k in ['submittedFrom', 'submittedTo']) {
                  if (body[k] != null &&
                      DateTime.tryParse('${body[k]}') == null) {
                    throw const ApiFailure(
                      400,
                      'Ngày cần đúng định dạng ISO8601.',
                    );
                  }
                }
                return body;
              },
              action: 'Áp dụng bộ lọc',
            );
            if (result != null && mounted) {
              setState(() {
                filters = result;
                page = 1;
                revision++;
              });
            }
          },
        ),
        Text('${data.total} thanh toán · Trang $page'),
        if (data.items.isEmpty)
          const SCNotice(
            'Chưa có thanh toán phù hợp. Thay bộ lọc hoặc làm mới sau.',
          ),
        for (final payment in data.items)
          SCCard(
            key: ValueKey('admin-payment-${payment['id']}'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  '${payment['status']} · ${Money.parse(payment['amount']).display('${payment['currency']}')}',
                  style: Theme.of(c).textTheme.titleLarge,
                ),
                Text('Phương thức: ${payment['paymentMethod']}'),
                if (payment['reviewNote'] != null)
                  Text('Ghi chú: ${payment['reviewNote']}'),
                TextButton(
                  key: ValueKey('payment-order-${payment['id']}'),
                  onPressed: () => Navigator.push(
                    c,
                    MaterialPageRoute(
                      builder: (_) => LiveSubscriptionOrder(
                        '${payment['subscriptionOrderId']}',
                      ),
                    ),
                  ),
                  child: const Text('Xem đơn gói liên quan'),
                ),
                if (payment['proofUrl'] != null)
                  ProofPreview('${payment['proofUrl']}'),
                if (payment['status'] == 'SUBMITTED') ...[
                  SCButton(
                    'Duyệt thanh toán',
                    key: ValueKey('approve-payment-${payment['id']}'),
                    onPressed: () => review(c, w, payment, true, reload),
                  ),
                  const SizedBox(height: 8),
                  SCButton(
                    'Từ chối thanh toán',
                    key: ValueKey('reject-payment-${payment['id']}'),
                    outlined: true,
                    onPressed: () => review(c, w, payment, false, reload),
                  ),
                ],
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

  Future<void> review(
    BuildContext c,
    LiveWorkspace w,
    Json payment,
    bool approve,
    VoidCallback reload,
  ) async {
    await openLiveForm<Json>(
      c,
      title: approve ? 'Duyệt thanh toán' : 'Từ chối thanh toán',
      fields: [
        FormFieldSpec(
          'reviewNote',
          approve ? 'Ghi chú duyệt' : 'Lý do từ chối',
          required: !approve,
          maximum: 2000,
        ),
      ],
      save: (body) async {
        final result = await w.subscriptions.review(
          '${payment['id']}',
          approve: approve,
          note: '${body['reviewNote'] ?? ''}',
        );
        final order = await w.subscriptions.order(
          '${payment['subscriptionOrderId']}',
        );
        await w.subscriptions.subscription('${order['bakeryId']}');
        await w.bakeries.adminDetail('${order['bakeryId']}');
        await w.subscriptions.payments(
          query: {
            'status': approve ? 'APPROVED' : 'REJECTED',
            'bakeryId': order['bakeryId'],
          },
        );
        return result;
      },
      action: approve ? 'Xác nhận duyệt' : 'Xác nhận từ chối',
    );
    reload();
  }
}
