import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../domain/chat_repository.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key, this.id, this.vendor = false});
  final String? id;
  final bool vendor;
  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final text = TextEditingController();
  final scroll = ScrollController();
  String query = '';
  bool attachment = false;
  @override
  void dispose() {
    text.dispose();
    scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context),
        screen = widget.vendor ? ScreenId.vendorChat : ScreenId.chat;
    if (widget.id == null) {
      final conversations = w.chat.conversations
          .where(
            (c) =>
                (!widget.vendor || c.bakeryId == w.session.selectedBakeryId) &&
                '${c.subject} ${w.catalog.bakery(c.bakeryId).name}'
                    .toLowerCase()
                    .contains(query.toLowerCase()),
          )
          .toList();
      return SweetCakeScaffold(
        screen: screen,
        children: [
          if (widget.vendor) const BakerySelector(),
          SCSearch(
            hint: 'Tìm cuộc trò chuyện',
            onChanged: (v) => setState(() => query = v),
          ),
          const SCNotice(
            'Tin nhắn và ảnh chỉ ở bộ nhớ demo. Không kết nối WebSocket hoặc gửi cho người thật.',
          ),
          if (conversations.isEmpty)
            const SCStateView(
              title: 'Chưa có hội thoại phù hợp',
              message: 'Thử từ khóa khác hoặc chọn lại tiệm.',
            ),
          for (final c in conversations)
            SCCard(
              onTap: () {
                w.chat.markRead(c);
                openScreen(context, screen, id: c.id);
              },
              child: Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: AppColors.lightPink,
                    child: Icon(
                      Icons.chat_bubble_outline,
                      color: AppColors.wine,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          w.catalog.bakery(c.bakeryId).name,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        Text(c.subject),
                        Text(
                          c.closed ? 'Hội thoại đã đóng' : c.messages.last.text,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  if (c.unread > 0) Badge(label: Text('${c.unread}')),
                ],
              ),
            ),
        ],
      );
    }
    final c = w.chat.get(widget.id!);
    return SweetCakeScaffold(
      screen: screen,
      scrollController: scroll,
      showNavigation: false,
      bottom: c.closed
          ? const SCNotice('Hội thoại đã đóng trong demo; không thể gửi tin.')
          : Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (attachment)
                  Row(
                    children: [
                      const Icon(Icons.image_outlined),
                      const Expanded(child: Text('Ảnh bánh mẫu · chỉ local')),
                      IconButton(
                        tooltip: 'Bỏ ảnh',
                        onPressed: () => setState(() => attachment = false),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    IconButton(
                      tooltip: 'Chọn ảnh demo',
                      onPressed: () => setState(() => attachment = true),
                      icon: const Icon(Icons.add_photo_alternate_outlined),
                    ),
                    Expanded(
                      child: TextField(
                        controller: text,
                        minLines: 1,
                        maxLines: 4,
                        decoration: const InputDecoration(
                          labelText: 'Tin nhắn demo',
                        ),
                      ),
                    ),
                    IconButton.filled(
                      tooltip: 'Gửi local',
                      onPressed: () => demoAction(context, () {
                        w.chat.send(
                          c,
                          text.text,
                          attachment: attachment
                              ? 'assets/demo/cake_01.jpg'
                              : null,
                        );
                        text.clear();
                        setState(() => attachment = false);
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (!mounted || !scroll.hasClients) return;
                          if (MediaQuery.disableAnimationsOf(context)) {
                            scroll.jumpTo(scroll.position.maxScrollExtent);
                          } else {
                            scroll.animateTo(
                              scroll.position.maxScrollExtent,
                              duration: const Duration(milliseconds: 180),
                              curve: Curves.easeOut,
                            );
                          }
                        });
                      }),
                      icon: const Icon(Icons.send),
                    ),
                  ],
                ),
              ],
            ),
      children: [
        SCSection(w.catalog.bakery(c.bakeryId).name, description: c.subject),
        const SCNotice(
          'Cuộc trò chuyện minh họa. Tin gửi local không có xác nhận giao/đọc từ máy chủ.',
        ),
        for (final m in c.messages)
          Align(
            alignment: m.mine ? Alignment.centerRight : Alignment.centerLeft,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: GestureDetector(
                onLongPress: !m.mine || m.deleted
                    ? null
                    : () => _delete(context, m),
                child: SCCard(
                  color: m.mine ? AppColors.lightPink : AppColors.white,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        m.mine ? 'Bạn · local' : 'Tiệm · fixture',
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                      const SizedBox(height: 6),
                      Text(m.text),
                      if (m.attachment != null && !m.deleted)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: SCImage(m.attachment!, height: 160),
                        ),
                      if (m.mine && !m.deleted)
                        TextButton(
                          onPressed: () => _delete(context, m),
                          child: const Text('Xóa tin local'),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        if (!c.closed)
          TextButton(
            onPressed: () async {
              if (await confirmDemo(
                    context,
                    title: 'Đóng hội thoại demo?',
                    message:
                        'Sau khi đóng không thể gửi thêm trong fixture này.',
                  ) &&
                  context.mounted) {
                w.chat.close(c);
              }
            },
            child: const Text('Đóng hội thoại local'),
          ),
      ],
    );
  }

  Future<void> _delete(BuildContext context, DemoMessage message) async {
    if (await confirmDemo(
          context,
          title: 'Xóa tin local?',
          message: 'Chỉ tin của bạn trong bản demo bị thay đổi.',
        ) &&
        context.mounted) {
      DemoScope.of(context).chat.delete(message);
    }
  }
}
