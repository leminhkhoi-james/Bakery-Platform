import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';

import '../../../core/api/phase5_contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/phase5_widgets.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

class LiveConversationsPage extends StatelessWidget {
  const LiveConversationsPage({super.key, this.vendor = false});
  final bool vendor;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveDomainList(
      title: 'Trò chuyện',
      operational: vendor,
      statuses: const ['OPEN', 'CLOSED'],
      load: (page, status) async {
        if (vendor && w.bakery == null) await w.discoverBakery();
        if (vendor && w.bakery == null) {
          throw const ApiFailure(
            422,
            'Mở Hồ sơ tiệm và chọn tiệm có membership hợp lệ trước.',
          );
        }
        return w.chat.list({
          'page': page,
          'size': 20,
          'status': status,
          'bakeryId': vendor ? (w.bakery?['id']) : null,
        });
      },
      header: const SCNotice(
        'Mở hội thoại từ yêu cầu hoặc báo giá đã được Backend cho phép. Tin nhắn được cập nhật bằng HTTP khi màn hình đang mở; không có WebSocket.',
      ),
      tile: (context, c) => SCCard(
        key: ValueKey('conversation-${c['id']}'),
        onTap: () => liveOpen(
          context,
          vendor ? '/vendor-chat-detail' : '/chat-detail',
          id: apiId(c['id']),
        ),
        child: Row(
          children: [
            const Icon(Icons.chat_bubble_outline),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SCStatusBadge(
                    '${c['status']}',
                    label: c['status'] == 'OPEN'
                        ? 'Đang trò chuyện'
                        : 'Đã đóng',
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${c['lastMessagePreview'] ?? 'Chưa có tin nhắn'}',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(displayInstant(c['lastMessageAt'])),
                ],
              ),
            ),
            if ((c['unreadCount'] as num) > 0)
              Badge(label: Text('${c['unreadCount']}')),
          ],
        ),
      ),
    );
  }
}
