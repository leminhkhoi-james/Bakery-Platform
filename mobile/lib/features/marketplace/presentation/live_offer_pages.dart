import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/phase5_widgets.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

import 'live_offer_editor.dart';
export 'live_offer_editor.dart';

class LiveOffersPage extends StatelessWidget {
  const LiveOffersPage({super.key, this.vendor = false, this.admin = false});
  final bool vendor, admin;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveDomainList(
      title: admin
          ? 'Giám sát báo giá'
          : vendor
          ? 'Báo giá đã gửi'
          : 'Báo giá đã nhận',
      operational: vendor || admin,
      statuses: const [
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'WITHDRAWN',
        'EXPIRED',
      ],
      load: (page, status) => w.marketplace.offers({
        'scope': admin
            ? null
            : vendor
            ? 'sent'
            : 'received',
        'page': page,
        'size': 20,
        'status': status,
      }),
      tile: (context, o) => offerTile(context, o, vendor: vendor, admin: admin),
    );
  }
}

Widget offerTile(
  BuildContext context,
  Json o, {
  bool vendor = false,
  bool admin = false,
}) => SCCard(
  key: ValueKey('offer-${o['id']}'),
  onTap: () => liveOpen(
    context,
    admin
        ? '/admin-offer-detail'
        : vendor
        ? '/vendor-offer-detail'
        : '/offer-detail',
    id: apiId(o['id']),
  ),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      SCStatusBadge('${o['status']}'),
      const SizedBox(height: 12),
      Text(
        displayMoney(o['totalPrice']),
        style: Theme.of(context).textTheme.titleLarge,
      ),
      Text('${o['message'] ?? ''}'),
      SCKeyValue(
        'Dự kiến hoàn thành',
        displayInstant(o['estimatedCompletionAt']),
      ),
      SCKeyValue('Hiệu lực đến', displayInstant(o['expiresAt'])),
    ],
  ),
);

class LiveOfferDetail extends StatelessWidget {
  const LiveOfferDetail(
    this.id, {
    super.key,
    this.vendor = false,
    this.admin = false,
  });
  final String id;
  final bool vendor, admin;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<Json>(
      title: 'Chi tiết báo giá',
      operational: vendor || admin,
      load: () => w.marketplace.offer(id),
      builder: (context, o, reload) => [
        SCStatusBadge('${o['status']}'),
        Text(
          displayMoney(o['totalPrice']),
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        Text('${o['message'] ?? ''}'),
        SCKeyValue('Giá bánh', displayMoney(o['cakePrice'])),
        SCKeyValue('Giao hàng', displayMoney(o['deliveryFee'])),
        SCKeyValue('Phụ kiện', displayMoney(o['addOnTotal'])),
        SCKeyValue('Hoàn thành', displayInstant(o['estimatedCompletionAt'])),
        SCKeyValue('Hết hạn', displayInstant(o['expiresAt'])),
        for (final item in objects(o['items']))
          SCKeyValue(
            '${item['itemNameSnapshot']} × ${item['quantity']}',
            displayMoney(item['lineTotal']),
          ),
        SCButton(
          'Xem yêu cầu gốc',
          outlined: true,
          onPressed: () => liveOpen(
            context,
            admin
                ? '/admin-request-detail'
                : vendor
                ? '/vendor-request-detail'
                : '/request-detail',
            id: apiId(o['cakeRequestId']),
          ),
        ),
        if (vendor &&
            o['status'] == 'PENDING' &&
            DateTime.tryParse('${o['expiresAt']}')?.isAfter(DateTime.now()) ==
                true) ...[
          SCButton(
            'Sửa báo giá',
            onPressed: () async {
              final r = await w.marketplace.request(apiId(o['cakeRequestId']));
              if (context.mounted) {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => LiveOfferEditor(request: r, offer: o),
                  ),
                );
                reload();
              }
            },
          ),
          LiveCommand(
            'Rút báo giá',
            outlined: true,
            run: () async {
              final reason = await liveReason(context, 'Rút báo giá');
              if (reason != null) await w.marketplace.withdraw(id, reason);
            },
            after: reload,
          ),
        ],
        if (!vendor &&
            !admin &&
            o['status'] == 'PENDING' &&
            DateTime.tryParse('${o['expiresAt']}')?.isAfter(DateTime.now()) ==
                true) ...[
          const SCNotice(addressContractBlocker, warning: true),
          const SCButton('Chấp nhận báo giá', onPressed: null),
          const Text(
            'Sau khi chấp nhận, hãy kiểm tra báo giá và danh sách đơn nếu chưa nhận được kết quả rõ ràng.',
          ),
        ],
        if (o['status'] == 'ACCEPTED')
          SCButton(
            'Kiểm tra đơn từ báo giá',
            onPressed: () => liveOpen(context, '/orders'),
          ),
        if (!admin)
          LiveCommand(
            'Mở trò chuyện',
            run: () async {
              final c = vendor
                  ? await w.chat.existingForRequest(
                      apiId(o['cakeRequestId']),
                      apiId(o['bakeryId']),
                    )
                  : await w.chat.create(
                      apiId(o['cakeRequestId']),
                      apiId(o['bakeryId']),
                    );
              if (c == null) {
                throw const ApiFailure(
                  422,
                  'Khách hàng cần khởi tạo hội thoại trước. Tiệm mở các hội thoại đã được dịch vụ cho phép.',
                );
              }
              if (context.mounted) {
                liveOpen(
                  context,
                  vendor ? '/vendor-chat-detail' : '/chat-detail',
                  id: apiId(c['id']),
                );
              }
            },
          ),
        const SCSection('Lịch sử báo giá'),
        for (final h in objects(o['statusHistory']))
          SCKeyValue('${h['toStatus']}', '${h['changedAt']}'),
      ],
    );
  }
}

class LiveOfferComparison extends StatelessWidget {
  const LiveOfferComparison({super.key, required this.request});
  final Json request;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<ApiPage>(
      title: 'So sánh báo giá',
      load: () => w.marketplace.offers({
        'scope': 'received',
        'cakeRequestId': request['id'],
        'page': 1,
        'size': 100,
      }),
      builder: (context, page, _) => [
        Text(
          '${request['title']}',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const Text(
          'Đối chiếu tổng giá, phí giao, thời gian hoàn thành và hiệu lực. Giá thấp hơn không tự động được chọn.',
        ),
        if (page.items.isEmpty) const SCNotice('Chưa có báo giá để so sánh.'),
        for (final o
            in [...page.items]..sort(
              (a, b) =>
                  Money.parse(a['totalPrice'])
                      .compareTo(Money.parse(b['totalPrice'])),
            ))
          offerTile(context, o),
        if (page.hasNext)
          const SCNotice(
            'Còn báo giá ở trang tiếp theo. Mở danh sách báo giá để xem đầy đủ.',
          ),
      ],
    );
  }
}
