import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../catalog/presentation/live_owner_profile.dart';
import 'live_payment_page.dart';

class LivePlansPage extends StatelessWidget {
  const LivePlansPage({super.key});
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<List<SubscriptionPlan>>(
      title: 'Gói đối tác',
      load: () => w.subscriptions.plans(),
      builder: (c, plans, _) => [
        const SCSection(
          'Gói thuê cho tiệm bánh',
          description: 'Giá, chu kỳ và quyền lợi do nền tảng cung cấp. Gói gắn với tiệm; không phải gói cá nhân.',
        ),
        if (plans.isEmpty) const SCNotice('Chưa có gói đang mở bán.'),
        for (final p in plans)
          SCCard(
            key: ValueKey('plan-${p.id}'),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => LivePlanDetail(p.id)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(p.name, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                Text(
                  p.price.display(p.currency),
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                Text('Chu kỳ ${p.months} tháng'),
                for (final f in p.features.entries)
                  Text('${f.key}: ${f.value}'),
                const SizedBox(height: 12),
                const Text('Xem chi tiết gói →'),
              ],
            ),
          ),
      ],
    );
  }
}

class LivePlanDetail extends StatelessWidget {
  const LivePlanDetail(this.id, {super.key});
  final String id;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<SubscriptionPlan>(
      title: 'Chi tiết gói thuê',
      load: () => w.subscriptions.plan(id),
      builder: (c, p, reload) => [
        Text(p.name, style: Theme.of(context).textTheme.headlineMedium),
        SCKeyValue('Mã gói', p.code),
        SCKeyValue('Giá tháng', p.price.display(p.currency)),
        SCKeyValue('Chu kỳ', '${p.months} tháng'),
        if (p.json['description'] != null) Text('${p.json['description']}'),
        for (final f in p.features.entries) SCKeyValue(f.key, '${f.value}'),
        const SCNotice(
          'Tổng phải trả và quyền lợi được chốt trong đơn gói do server tạo. Gửi chứng từ chưa đồng nghĩa đã duyệt thanh toán.',
        ),
        if (w.session.authenticated &&
            w.bakery != null &&
            (w.session.hasRole('CUSTOMER') ||
                w.session.hasRole('BAKERY_OWNER')))
          LiveCommand(
            'Tạo đơn gói cho ${w.bakery!['name']}',
            key: const ValueKey('create-subscription-order'),
            run: () async {
              final bid = '${w.bakery!['id']}';
              final open = await w.subscriptions.orders(
                bid,
                query: {'size': 100},
              );
              final pending = open.items
                  .where(
                    (o) => [
                      'PENDING_PAYMENT',
                      'PAYMENT_REVIEW',
                    ].contains(o['status']),
                  )
                  .toList();
              if (pending.isNotEmpty) {
                if (pending.first['planId'] != p.id) {
                  throw const ApiFailure(
                    409,
                    'Tiệm đã có đơn gói đang chờ. Mở đơn hiện tại trước.',
                  );
                }
                final order = await w.subscriptions.order(
                  '${pending.first['id']}',
                );
                if (c.mounted) {
                  await Navigator.push(
                    c,
                    MaterialPageRoute(
                      builder: (_) => LiveSubscriptionOrder('${order['id']}'),
                    ),
                  );
                }
                return;
              }
              final created = await w.subscriptions.createOrder(bid, p.id);
              final verified = await w.subscriptions.order('${created['id']}');
              if (verified['id'] != created['id']) {
                throw const ApiFailure(
                  502,
                  'Chưa đối chiếu được đơn gói.',
                  uncertain: true,
                );
              }
              w.api.finishLogicalAction(
                'POST',
                '/api/v1/bakeries/$bid/subscription-orders',
                {'planId': p.id},
              );
              if (c.mounted) {
                await Navigator.push(
                  c,
                  MaterialPageRoute(
                    builder: (_) => LiveSubscriptionOrder('${created['id']}'),
                  ),
                );
              }
            },
          )
        else
          SCButton(
            w.session.authenticated
                ? 'Mở hồ sơ tiệm để chọn ngữ cảnh'
                : 'Đăng nhập để đăng ký gói',
            onPressed: () => liveOpen(
              context,
              w.session.authenticated ? '/vendor-profile' : '/login',
            ),
          ),
      ],
    );
  }
}

class _SubscriptionData {
  _SubscriptionData(this.bakery, this.subscription, this.orders);
  final Json? bakery, subscription;
  final ApiPage? orders;
}

class LiveOwnerSubscription extends StatefulWidget {
  const LiveOwnerSubscription({super.key});
  @override
  State<LiveOwnerSubscription> createState() => _LiveOwnerSubscriptionState();
}

class _LiveOwnerSubscriptionState extends State<LiveOwnerSubscription> {
  int page = 1;
  String status = '';
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<_SubscriptionData>(
      key: ValueKey('$page:$status'),
      title: 'Gói thuê của tiệm',
      operational: true,
      load: () async {
        final b = await currentBakery(w);
        if (b == null) return _SubscriptionData(null, null, null);
        final s = await w.subscriptions.subscription('${b['id']}');
        final orders = await w.subscriptions.orders(
          '${b['id']}',
          query: {'page': page, 'size': 12, 'status': status},
        );
        return _SubscriptionData(b, s, orders);
      },
      builder: (c, data, _) => [
        if (data.bakery == null) ...[
          const SCNotice('Chưa có hồ sơ đối tác.'),
          SCButton(
            'Gửi hồ sơ tiệm',
            onPressed: () => liveOpen(c, '/vendor-profile'),
          ),
        ] else ...[
          Text(
            '${data.bakery!['name']}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          ...periodSummary(
            data.subscription!['currentSubscription'],
            'Kỳ hiện tại',
          ),
          ...periodSummary(
            data.subscription!['scheduledSubscription'],
            'Kỳ đã lên lịch',
          ),
          for (final f in object(data.subscription!['features']).entries)
            SCKeyValue(f.key, '${f.value}'),
          SCButton(
            'Chọn gói thuê',
            key: const ValueKey('choose-plan'),
            onPressed: () => liveOpen(c, '/subscription-plans'),
          ),
          const SCSection('Đơn đăng ký gói'),
          DropdownButtonFormField<String>(
            initialValue: status,
            decoration: const InputDecoration(labelText: 'Trạng thái đơn'),
            items: [
              for (final s in [
                '',
                'PENDING_PAYMENT',
                'PAYMENT_REVIEW',
                'COMPLETED',
                'EXPIRED',
                'CANCELLED',
              ])
                DropdownMenuItem(
                  value: s,
                  child: Text(s.isEmpty ? 'Tất cả' : s),
                ),
            ],
            onChanged: (s) => setState(() {
              status = s!;
              page = 1;
            }),
          ),
          if (data.orders!.items.isEmpty)
            const SCNotice('Chưa có đơn gói trong bộ lọc này.'),
          for (final o in data.orders!.items)
            SCCard(
              key: ValueKey('subscription-order-${o['id']}'),
              onTap: () => Navigator.push(
                c,
                MaterialPageRoute(
                  builder: (_) => LiveSubscriptionOrder('${o['id']}'),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${o['planNameSnapshot']}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text('${o['orderNumber']}'),
                  Text(
                    '${o['status']} · ${Money.parse(o['totalAmount']).display('${o['currency']}')}',
                  ),
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
              if (data.orders!.hasNext)
                OutlinedButton(
                  onPressed: () => setState(() => page++),
                  child: const Text('Trang tiếp'),
                ),
            ],
          ),
        ],
      ],
    );
  }
}

List<Widget> periodSummary(Object? period, String title) => [
  SCSection(title),
  if (period == null)
    const Text('Chưa có kỳ đăng ký.')
  else ...[
    SCKeyValue('Gói', '${object(period)['planCode']}'),
    SCKeyValue('Trạng thái', '${object(period)['status']}'),
    SCKeyValue('Bắt đầu', '${object(period)['periodStart']}'),
    SCKeyValue('Kết thúc', '${object(period)['periodEnd']}'),
  ],
];

class LiveSubscriptionOrder extends StatelessWidget {
  const LiveSubscriptionOrder(this.id, {super.key});
  final String id;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<Json>(
      title: 'Đơn đăng ký gói',
      operational: true,
      load: () => w.subscriptions.order(id),
      builder: (c, o, reload) => [
        Text(
          '${o['planNameSnapshot']}',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        SCKeyValue('Số đơn', '${o['orderNumber']}'),
        SCKeyValue('Trạng thái', '${o['status']}'),
        SCKeyValue(
          'Tổng phải trả',
          Money.parse(o['totalAmount']).display('${o['currency']}'),
          emphasized: true,
        ),
        SCKeyValue('Chu kỳ', '${o['billingPeriodMonths']} tháng'),
        SCKeyValue('Hạn gửi thanh toán', '${o['expiresAt']}'),
        for (final f in object(o['featuresSnapshot']).entries)
          SCKeyValue(f.key, '${f.value}'),
        for (final payment in objects(o['payments']))
          SCCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Thanh toán · ${payment['status']}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                if (payment['reviewNote'] != null)
                  Text('Ghi chú duyệt: ${payment['reviewNote']}'),
                if (payment['proofUrl'] != null)
                  ProofPreview('${payment['proofUrl']}'),
              ],
            ),
          ),
        if (o['period'] != null)
          ...periodSummary(o['period'], 'Kỳ được kích hoạt'),
        if (o['status'] == 'PENDING_PAYMENT')
          SCButton(
            'Gửi thông tin thanh toán',
            key: const ValueKey('submit-payment-nav'),
            onPressed: () async {
              await Navigator.push(
                c,
                MaterialPageRoute(builder: (_) => LivePaymentPage(orderId: id)),
              );
              reload();
            },
          ),
        if (o['status'] == 'PAYMENT_REVIEW')
          const SCNotice(
            'Đã gửi thông tin, đang chờ Admin duyệt. Chưa xác nhận tiền hoặc kích hoạt gói.',
          ),
        if (o['status'] == 'COMPLETED')
          const SCNotice(
            'Server đã hoàn tất đơn gói. Làm mới hồ sơ đối tác và quyền tài khoản để xem điều kiện quản lý tiệm.',
          ),
      ],
    );
  }
}

class ProofPreview extends StatelessWidget {
  const ProofPreview(this.url, {super.key});
  final String url;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const Text('Chứng từ do người gửi cung cấp'),
      LiveMedia(url, label: 'Chứng từ thanh toán'),
      const Text(
        'Nếu tệp PDF không xem được ở đây, tải lại dữ liệu để lấy liên kết mới; không coi lỗi hiển thị ảnh là mất chứng từ.',
      ),
    ],
  );
}
