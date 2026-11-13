import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/live_upload.dart';
import '../../../core/widgets/phase5_widgets.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import 'live_offer_pages.dart';

import 'live_request_editor.dart';
import '../../ai/presentation/live_ai_pages.dart';
export 'live_request_editor.dart';

class LiveRequestsPage extends StatelessWidget {
  const LiveRequestsPage({super.key, this.vendor = false, this.admin = false});
  final bool vendor, admin;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveDomainList(
      title: admin
          ? 'Giám sát yêu cầu bánh'
          : vendor
          ? 'Yêu cầu đang tìm tiệm'
          : 'Yêu cầu bánh của tôi',
      operational: vendor || admin,
      statuses: vendor ? const ['OPEN'] : requestStatuses,
      load: (page, status) => w.marketplace.requests({
        'scope': admin
            ? null
            : vendor
            ? 'available'
            : 'mine',
        'page': page,
        'size': 20,
        'status': status,
      }),
      header: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            vendor
                ? 'Ý tưởng đang tìm\nđúng tiệm bánh.'
                : 'Từ một ý tưởng,\nđến chiếc bánh riêng.',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          if (vendor)
            const SCNotice(
              'Danh sách khả dụng do Backend xác minh membership, khu vực và trạng thái tiệm. Không coi lỗi dịch vụ là danh sách rỗng.',
            ),
          if (!vendor && !admin)
            SCButton(
              'Tạo yêu cầu mới',
              key: const ValueKey('rfq-new'),
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LiveRequestEditor()),
              ),
            ),
          if (!admin)
            SCButton(
              'Báo giá ${vendor ? 'đã gửi' : 'đã nhận'}',
              outlined: true,
              onPressed: () =>
                  liveOpen(context, vendor ? '/vendor-offers' : '/offers'),
            ),
        ],
      ),
      tile: (context, row) => SCCard(
        key: ValueKey('rfq-${row['id']}'),
        onTap: () => liveOpen(
          context,
          admin
              ? '/admin-request-detail'
              : vendor
              ? '/vendor-request-detail'
              : '/request-detail',
          id: apiId(row['id']),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SCStatusBadge('${row['status']}'),
            const SizedBox(height: 12),
            Text(
              '${row['title']}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            Text(
              '${row['description'] ?? ''}',
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            SCKeyValue('Ngày cần bánh', '${row['neededAt']}'),
            SCKeyValue(
              'Khu vực',
              '${row['deliveryDistrict']}, ${row['deliveryCity']}',
            ),
          ],
        ),
      ),
    );
  }
}

class LiveRequestDetail extends StatelessWidget {
  const LiveRequestDetail(
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
      title: 'Chi tiết yêu cầu',
      operational: vendor || admin,
      load: () => w.marketplace.request(id),
      builder: (context, r, reload) {
        final mine = r['customerId'] == w.session.user?['id'],
            draft = !admin && mine && r['status'] == 'DRAFT';
        return [
          SCStatusBadge('${r['status']}'),
          Text(
            '${r['title']}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          Text('${r['description']}'),
          SCKeyValue(
            'Loại yêu cầu',
            r['requestType'] == 'OPEN_CUSTOM'
                ? 'Yêu cầu mở'
                : 'Tùy chỉnh từ mẫu của tiệm',
          ),
          SCKeyValue('Ngày cần bánh', displayInstant(r['neededAt'])),
          SCKeyValue(
            'Khu vực',
            '${r['deliveryDistrict']}, ${r['deliveryCity']}',
          ),
          SCKeyValue(
            'Ngân sách',
            '${r['budgetMin'] == null ? 'Chưa đặt' : displayMoney(r['budgetMin'])} – ${r['budgetMax'] == null ? 'Chưa đặt' : displayMoney(r['budgetMax'])}',
          ),
          if (r['preference'] is Map)
            for (final entry in const {
              'cakeSize': 'Kích thước',
              'cakeShape': 'Hình dáng',
              'flavor': 'Hương vị',
              'filling': 'Nhân bánh',
              'frosting': 'Kem phủ',
              'colorPalette': 'Màu sắc',
              'decorationNotes': 'Trang trí',
              'allergyNotes': 'Dị ứng',
            }.entries)
              if (object(r['preference'])[entry.key] != null)
                SCKeyValue(
                  entry.value,
                  '${object(r['preference'])[entry.key]}',
                ),
          for (final image in objects(r['images']))
            Column(
              children: [
                LiveMedia(image['url'] as String?, label: 'Ảnh tham khảo'),
                if (draft)
                  LiveCommand(
                    'Xóa ảnh tham khảo',
                    run: () async {
                      if (await confirmLive(context, 'Xóa ảnh tham khảo?')) {
                        await w.marketplace.deleteImage(id, apiId(image['id']));
                      }
                    },
                    after: reload,
                  ),
              ],
            ),
          if (mine && !admin && w.session.hasRole('CUSTOMER'))
            SCButton(
              'Thiết kế AI cho yêu cầu',
              key: const ValueKey('rfq-ai'),
              outlined: true,
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => LiveAiJobsPage(request: r)),
              ),
            ),
          if (r['selectedDesignId'] != null && (mine || admin))
            SCButton(
              'Xem thiết kế đã chọn',
              outlined: true,
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => LiveAiDesignPage(
                    apiId(r['selectedDesignId']),
                    request: r,
                    admin: admin,
                  ),
                ),
              ),
            ),
          if (admin)
            SCButton(
              'Mở hàng đợi thiết kế AI',
              outlined: true,
              onPressed: () => liveOpen(context, '/admin-ai-designs'),
            ),
          if (draft) ...[
            SCButton(
              'Sửa bản nháp',
              key: const ValueKey('rfq-edit'),
              onPressed: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => LiveRequestEditor(request: r),
                  ),
                );
                reload();
              },
            ),
            LiveUpload(
              'Ảnh tham khảo',
              field: 'files',
              maximumMiB: 10,
              upload: (part) async {
                await w.marketplace.upload(id, part);
              },
              after: reload,
            ),
            LiveCommand(
              'Công khai yêu cầu',
              key: const ValueKey('rfq-publish'),
              run: () async {
                if (await confirmLive(context, 'Công khai yêu cầu?')) {
                  await w.marketplace.publish(id);
                }
              },
              after: reload,
            ),
          ],
          if (!admin && mine && ['DRAFT', 'OPEN'].contains(r['status']))
            LiveCommand(
              'Hủy yêu cầu',
              outlined: true,
              run: () async {
                final reason = await liveReason(context, 'Hủy yêu cầu');
                if (reason != null) await w.marketplace.cancel(id, reason);
              },
              after: reload,
            ),
          const SCSection('Báo giá nhận được'),
          if (objects(r['offers']).isEmpty) const Text('Chưa có báo giá.'),
          for (final offer in objects(r['offers']))
            SCCard(
              onTap: () => liveOpen(
                context,
                admin
                    ? '/admin-offer-detail'
                    : vendor
                    ? '/vendor-offer-detail'
                    : '/offer-detail',
                id: apiId(offer['id']),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SCStatusBadge('${offer['status']}'),
                  Text(displayMoney(offer['totalPrice'])),
                  Text('Hiệu lực đến ${displayInstant(offer['expiresAt'])}'),
                ],
              ),
            ),
          if (!admin && objects(r['offers']).length > 1)
            SCButton(
              'So sánh báo giá',
              outlined: true,
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => LiveOfferComparison(request: r),
                ),
              ),
            ),
          if (vendor && r['status'] == 'OPEN')
            SCButton(
              'Gửi báo giá',
              key: const ValueKey('offer-new'),
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => LiveOfferEditor(request: r)),
              ),
            ),
          if (!admin && mine && r['targetBakeryId'] != null)
            LiveCommand(
              'Mở trò chuyện với tiệm',
              run: () async {
                final c = await w.chat.create(id, apiId(r['targetBakeryId']));
                if (context.mounted) {
                  liveOpen(context, '/chat-detail', id: apiId(c['id']));
                }
              },
            ),
          const SCSection('Lịch sử yêu cầu'),
          for (final h in objects(r['statusHistory']))
            SCKeyValue(
              '${h['toStatus']}',
              '${h['changedAt']} · ${h['reason'] ?? h['note'] ?? ''}',
            ),
        ];
      },
    );
  }
}
