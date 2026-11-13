import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../reviews/presentation/live_review_section.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/phase5_widgets.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

List<Widget> orderSnapshotWidgets(Object? value) {
  if (value is! Map<String, dynamic>) return const [];
  final result = <Widget>[];
  for (final key in const {
    'cakeSize': 'Kích thước',
    'cakeShape': 'Hình dáng',
    'flavor': 'Hương vị',
    'filling': 'Nhân bánh',
    'frosting': 'Kem phủ',
    'colorPalette': 'Màu sắc',
    'decorationNotes': 'Trang trí',
    'allergyNotes': 'Dị ứng',
  }.entries) {
    if (value[key.key] != null) {
      result.add(SCKeyValue(key.value, '${value[key.key]}'));
    }
  }
  if (value['preference'] is Map) {
    result.addAll(orderSnapshotWidgets(value['preference']));
  }
  for (final key in ['optionSelections', 'options']) {
    if (value[key] is List) {
      for (final option in objects(value[key])) {
        if (option['groupName'] is String && option['values'] is List) {
          result.add(
            SCKeyValue(
              '${option['groupName']}',
              objects(option['values']).map((v) => '${v['name']}').join(', '),
            ),
          );
        }
        if (option['groupNameSnapshot'] != null &&
            option['valueNameSnapshot'] != null) {
          result.add(
            SCKeyValue(
              '${option['groupNameSnapshot']}',
              '${option['valueNameSnapshot']} × ${option['quantity'] ?? 1}',
            ),
          );
        }
      }
    }
  }
  return result;
}

class LiveOrdersPage extends StatelessWidget {
  const LiveOrdersPage({super.key, this.vendor = false, this.admin = false});
  final bool vendor, admin;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveDomainList(
      title: admin
          ? 'Đơn bánh và đánh giá'
          : vendor
          ? 'Đơn bánh của tiệm'
          : 'Đơn bánh của tôi',
      operational: vendor || admin,
      statuses: orderStatuses,
      load: (page, status) async {
        if (vendor && w.bakery == null) await w.discoverBakery();
        if (vendor && w.bakery == null) {
          throw const ApiFailure(
            422,
            'Mở Hồ sơ tiệm và chọn tiệm đã xác minh trước.',
          );
        }
        return w.orders.list({
          'scope': admin
              ? 'all'
              : vendor
              ? 'bakery'
              : 'mine',
          'bakeryId': vendor ? w.bakery!['id'] : null,
          'page': page,
          'size': 20,
          'status': status,
          'sort': 'createdAt,desc',
        });
      },
      tile: (context, o) => SCCard(
        key: ValueKey('order-${o['id']}'),
        onTap: () => liveOpen(
          context,
          admin
              ? '/admin-order-detail'
              : vendor
              ? '/vendor-order-detail'
              : '/order-detail',
          id: apiId(o['id']),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SCStatusBadge('${o['status']}'),
            const SizedBox(height: 12),
            Text(
              '${o['orderNumber']}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            Text('${o['bakeryName'] ?? ''}'),
            Text(displayMoney(o['totalAmount'])),
            Text('Ngày cần: ${displayInstant(o['neededAt'])}'),
          ],
        ),
      ),
    );
  }
}

class LiveOrderDetail extends StatelessWidget {
  const LiveOrderDetail(
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
      title: 'Chi tiết đơn bánh',
      operational: vendor || admin,
      load: () => w.orders.detail(id),
      builder: (context, o, reload) {
        final mine =
            o['customerId'] == w.session.user?['id'] &&
            w.session.hasRole('CUSTOMER');
        final actions = orderActions(
          '${o['status']}',
          owner:
              admin && w.session.hasRole('ADMIN') ||
              vendor && w.session.hasRole('BAKERY_OWNER'),
          customer: mine,
        );
        return [
          SCStatusBadge('${o['status']}'),
          Text(
            '${o['orderNumber']}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          Text('${o['bakeryName']}'),
          SCKeyValue('Nguồn đơn', '${o['orderSource']}'),
          SCKeyValue('Tổng tiền', displayMoney(o['totalAmount'])),
          SCKeyValue('Phí giao', displayMoney(o['deliveryFee'])),
          SCKeyValue('Ngày cần bánh', displayInstant(o['neededAt'])),
          for (final item in objects(o['items']))
            SCCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${item['name']} × ${item['quantity']}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text('${item['description'] ?? ''}'),
                  Text(displayMoney(item['lineTotal'])),
                  ...orderSnapshotWidgets(item['configuration']),
                ],
              ),
            ),
          if (o['deliveryAddress'] is Map) ...[
            const SCSection('Địa chỉ đã chốt'),
            for (final e in const {
              'recipientName': 'Người nhận',
              'recipientPhone': 'Điện thoại',
              'addressLine': 'Địa chỉ',
              'ward': 'Phường / xã',
              'district': 'Quận / huyện',
              'city': 'Tỉnh / thành phố',
              'deliveryNote': 'Ghi chú',
            }.entries)
              if (object(o['deliveryAddress'])[e.key] != null)
                SCKeyValue(e.value, '${object(o['deliveryAddress'])[e.key]}'),
          ],
          LiveReviewSection(o, reload: reload, admin: admin),
          const SCSection('Lịch sử đơn'),
          for (final h in objects(o['statusHistory']))
            SCKeyValue(
              '${h['toStatus']}',
              '${displayInstant(h['changedAt'])} · ${h['note'] ?? ''}',
            ),
          for (final target in actions)
            LiveCommand(
              target == 'COMPLETED'
                  ? 'Xác nhận đã nhận bánh'
                  : statusLabels[target] ?? target,
              key: ValueKey('order-transition-$target'),
              confirm: target == 'COMPLETED'
                  ? () => confirmLive(
                      context,
                      'Bạn đã nhận bánh và muốn hoàn tất đơn?',
                    )
                  : null,
              run: () async {
                if (target == 'COMPLETED') {
                  await w.orders.transition(
                    id,
                    target,
                    'Khách hàng xác nhận đã nhận bánh',
                  );
                  return;
                }
                final reason = await liveReason(
                  context,
                  'Chuyển sang ${statusLabels[target] ?? target}',
                  max: 1000,
                );
                if (reason != null) {
                  await w.orders.transition(id, target, reason);
                }
              },
              after: reload,
            ),
          SCButton('Làm mới trạng thái', outlined: true, onPressed: reload),
          if (o['cakeRequestId'] != null)
            SCButton(
              'Yêu cầu liên quan',
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
          if (o['offerId'] != null)
            SCButton(
              'Báo giá đã chốt',
              outlined: true,
              onPressed: () => liveOpen(
                context,
                admin
                    ? '/admin-offer-detail'
                    : vendor
                    ? '/vendor-offer-detail'
                    : '/offer-detail',
                id: apiId(o['offerId']),
              ),
            ),
          const SCNotice(
            'Lịch sử và trạng thái do Order trả về. Không có chức năng thanh toán online hoặc xác nhận chuyển tiền trong luồng này.',
          ),
        ];
      },
    );
  }
}
