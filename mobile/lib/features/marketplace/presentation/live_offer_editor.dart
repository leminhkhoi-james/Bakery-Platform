import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/phase5_widgets.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

class LiveOfferEditor extends StatelessWidget {
  const LiveOfferEditor({super.key, required this.request, this.offer});
  final Json request;
  final Json? offer;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<List<Json>>(
      title: offer == null ? 'Gửi báo giá' : 'Sửa báo giá',
      operational: true,
      load: () async {
        if (w.bakery == null) await w.discoverBakery();
        final id = offer?['bakeryId'] ?? w.bakery?['id'];
        if (id == null) {
          throw const ApiFailure(
            422,
            'Mở Hồ sơ tiệm và chọn tiệm có membership hợp lệ trước khi gửi báo giá.',
          );
        }
        final addons = await w.bakeries.addOns(apiId(id));
        if (offer != null &&
            objects(offer!['items']).any(
              (item) => !addons.any(
                (a) => a['id'] == item['addOnId'] && a['active'] == true,
              ),
            )) {
          throw const ApiFailure(
            409,
            'Phụ kiện trong báo giá đã thay đổi. Không gửi thay thế thiếu dữ liệu; làm mới và kiểm tra catalog.',
          );
        }
        return addons;
      },
      builder: (context, addons, reload) => [
        Text(
          '${request['title']}',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SCNotice(
          'Backend xác minh quyền Owner, trạng thái tiệm, gói hiệu lực và hạn của yêu cầu. Mỗi tiệm chỉ có một báo giá cho một yêu cầu.',
        ),
        SCButton(
          'Nhập nội dung báo giá',
          key: const ValueKey('offer-editor-open'),
          onPressed: () async {
            final bakeryId = apiId(offer?['bakeryId'] ?? w.bakery?['id']);
            final initial = <String, dynamic>{...?offer};
            for (final item in objects(offer?['items'] ?? [])) {
              initial['addon-${item['addOnId']}'] = item['quantity'];
            }
            final saved = await openLiveForm<Json>(
              context,
              title: offer == null ? 'Báo giá mới' : 'Chỉnh báo giá',
              action: 'Gửi báo giá',
              initial: initial,
              fields: [
                const FormFieldSpec(
                  'cakePrice',
                  'Giá bánh',
                  required: true,
                  kind: FieldKind.money,
                ),
                const FormFieldSpec(
                  'deliveryFee',
                  'Phí giao hàng',
                  required: true,
                  kind: FieldKind.money,
                ),
                const FormFieldSpec('message', 'Lời nhắn', maximum: 4000),
                const FormFieldSpec(
                  'estimatedCompletionAt',
                  'Hoàn thành lúc',
                  kind: FieldKind.instant,
                  required: true,
                ),
                const FormFieldSpec(
                  'expiresAt',
                  'Hết hạn lúc',
                  kind: FieldKind.instant,
                  required: true,
                ),
                for (final a in addons.where((a) => a['active'] == true))
                  FormFieldSpec(
                    'addon-${a['id']}',
                    '${a['name']} · ${displayMoney(a['price'])} · số lượng',
                    kind: FieldKind.integer,
                    minimum: 0,
                  ),
              ],
              transform: (j) {
                for (final k in ['estimatedCompletionAt', 'expiresAt']) {
                  final v = futureInstant(j[k]);
                  if (v.isAfter(DateTime.parse('${request['neededAt']}'))) {
                    throw const ApiFailure(
                      400,
                      'Thời gian báo giá phải trước ngày cần bánh.',
                    );
                  }
                  j[k] = v.toIso8601String();
                }
                final items = <Json>[];
                for (final a in addons) {
                  final qty = j.remove('addon-${a['id']}') as int?;
                  if (qty != null && qty > 0) {
                    items.add({'addOnId': a['id'], 'quantity': qty});
                  }
                }
                j['items'] = items;
                if (offer == null) j['bakeryId'] = bakeryId;
                return j;
              },
              save: (j) async {
                if (offer != null) {
                  return w.marketplace.editOffer(apiId(offer!['id']), j);
                }
                final existing = await w.marketplace.offers({
                  'scope': 'sent',
                  'bakeryId': bakeryId,
                  'cakeRequestId': request['id'],
                  'page': 1,
                  'size': 1,
                });
                if (existing.items.isNotEmpty) {
                  throw const ApiFailure(
                    409,
                    'Tiệm đã có báo giá cho yêu cầu này. Mở danh sách đã gửi để chỉnh sửa.',
                  );
                }
                return w.marketplace.createOffer(apiId(request['id']), j);
              },
            );
            if (saved != null && context.mounted) {
              liveOpen(context, '/vendor-offer-detail', id: apiId(saved['id']));
            }
          },
        ),
        SCButton(
          'Mở hồ sơ tiệm',
          outlined: true,
          onPressed: () => liveOpen(context, '/vendor-profile'),
        ),
      ],
    );
  }
}
