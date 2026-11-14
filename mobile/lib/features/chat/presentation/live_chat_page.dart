import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/api/transport.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/live_upload.dart';
import '../../../core/widgets/phase5_widgets.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

import 'live_chat_attachment.dart';
export 'live_conversations_page.dart';

class LiveChatThread extends StatefulWidget {
  const LiveChatThread(this.id, {super.key, this.vendor = false});
  final String id;
  final bool vendor;
  @override
  State<LiveChatThread> createState() => _LiveChatThreadState();
}

class _LiveChatThreadState extends State<LiveChatThread>
    with WidgetsBindingObserver {
  final text = TextEditingController();
  final Map<String, Json> messages = {};
  Json? conversation;
  String? cursor, error, sendError;
  bool more = false,
      loading = false,
      sending = false,
      uncertain = false,
      foreground = true;
  UploadPart? attachment;
  String? logicalId, frozenText;
  UploadPart? frozenFile;
  final List<UploadPart> extraFiles = [], frozenExtraFiles = [];
  Timer? timer;
  int? generation;
  int epoch = 0;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    timer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (mounted &&
          foreground &&
          ModalRoute.of(context)?.isCurrent == true &&
          error == null &&
          !loading) {
        load();
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final next = LiveScope.of(context).session.generation;
    if (generation != next) {
      generation = next;
      epoch++;
      messages.clear();
      conversation = null;
      cursor = null;
      logicalId = null;
      frozenText = null;
      frozenFile = null;
      attachment = null;
      extraFiles.clear();
      frozenExtraFiles.clear();
      text.clear();
      uncertain = false;
      loading = false;
      load();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    foreground = state == AppLifecycleState.resumed;
  }

  @override
  void dispose() {
    timer?.cancel();
    epoch++;
    WidgetsBinding.instance.removeObserver(this);
    text.dispose();
    super.dispose();
  }

  bool valid(int current) =>
      mounted &&
      current == epoch &&
      generation == LiveScope.of(context).session.generation;
  Future<void> load({bool older = false}) async {
    if (loading) return;
    final current = epoch;
    loading = true;
    final repo = LiveScope.of(context).chat;
    try {
      await repo.restorePending();
      if (!valid(current)) return;
      final recovered = repo.pending[widget.id];
      if (recovered != null && !sending) {
        setState(() {
          logicalId = recovered.id;
          frozenText = recovered.content;
          frozenFile = recovered.attachment;
          text.text = recovered.content;
          attachment = recovered.attachment;
          extraFiles
            ..clear()
            ..addAll(recovered.attachments.skip(1));
          frozenExtraFiles
            ..clear()
            ..addAll(extraFiles);
          uncertain = true;
        });
      }
      final detail = await repo.detail(widget.id);
      if (!valid(current)) return;
      setState(() => conversation = detail);
      final page = await repo.messages(
        widget.id,
        before: older ? cursor : null,
      );
      if (!valid(current)) return;
      Json? confirmed;
      String? recoveryError;
      try {
        confirmed = await repo.reconcile(widget.id, page);
      } on Object catch (e) {
        recoveryError = safeError(e);
      }
      if (!valid(current)) return;
      setState(() {
        for (final message in page.items) {
          messages[apiId(message['id'])] = message;
        }
        if (confirmed != null) {
          messages[apiId(confirmed['id'])] = confirmed;
          logicalId = null;
          frozenText = null;
          frozenFile = null;
          attachment = null;
          extraFiles.clear();
          frozenExtraFiles.clear();
          text.clear();
          uncertain = false;
          sendError = null;
        }
        if (recoveryError != null) sendError = recoveryError;
        if (older || cursor == null) {
          cursor = page.nextCursor;
          more = page.hasMore;
        }
        error = null;
      });
    } on Object catch (e) {
      if (valid(current)) {
        setState(
          () => error = e is ApiFailure && e.status == 403
              ? 'Chưa tải được lịch sử trò chuyện. Bạn có thể thử lại sau.'
              : safeError(e),
        );
      }
    } finally {
      if (valid(current)) setState(() => loading = false);
    }
  }

  Future<void> send() async {
    if (sending || conversation?['status'] != 'OPEN') return;
    final content = uncertain ? frozenText! : text.text.trim(),
        file = uncertain ? frozenFile : attachment;
    if (content.isEmpty && file == null) {
      setState(() => sendError = 'Nhập nội dung hoặc chọn tệp.');
      return;
    }
    if (content.length > 10000) {
      setState(() => sendError = 'Nội dung tối đa 10.000 ký tự.');
      return;
    }
    logicalId ??= commandId();
    frozenText = content;
    frozenFile = file;
    final extras = List<UploadPart>.of(
      uncertain ? frozenExtraFiles : extraFiles,
    );
    frozenExtraFiles
      ..clear()
      ..addAll(extras);
    final current = epoch;
    setState(() {
      sending = true;
      sendError = null;
    });
    try {
      final result = await LiveScope.of(context).chat.send(
        widget.id,
        logicalId!,
        content,
        attachment: file,
        attachments: extras,
      );
      if (!valid(current)) return;
      setState(() {
        messages[apiId(result['id'])] = result;
        text.clear();
        attachment = null;
        extraFiles.clear();
        frozenExtraFiles.clear();
        logicalId = null;
        frozenText = null;
        frozenFile = null;
        uncertain = false;
      });
      await load();
    } on Object catch (e) {
      if (valid(current)) {
        setState(() {
          uncertain =
              LiveScope.of(context).chat.pending.containsKey(widget.id) ||
              e is ApiFailure && e.uncertain;
          sendError = safeError(e);
          if (!uncertain) {
            logicalId = null;
            frozenText = null;
            frozenFile = null;
          }
        });
      }
    } finally {
      if (valid(current)) setState(() => sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    final sorted = messages.values.toList()
      ..sort((a, b) {
        final order = DateTime.parse('${a['createdAt']}')
            .compareTo(DateTime.parse('${b['createdAt']}'));
        return order == 0 ? '${a['id']}'.compareTo('${b['id']}') : order;
      });
    return LiveScaffold(
      title: 'Trò chuyện',
      operational: widget.vendor,
      onRefresh: load,
      children: [
        if (conversation != null) ...[
          SCStatusBadge(
            '${conversation!['status']}',
            label: conversation!['status'] == 'OPEN'
                ? 'Đang trò chuyện'
                : 'Đã đóng',
          ),
          if (conversation!['cakeRequestId'] != null) SCButton(
            'Yêu cầu liên quan',
            outlined: true,
            onPressed: () => liveOpen(
              context,
              widget.vendor ? '/vendor-request-detail' : '/request-detail',
              id: apiId(conversation!['cakeRequestId']),
            ),
          ),
          const SCSection('Người tham gia'),
          for (final p in objects(conversation!['participants']))
            Text(
              '${statusLabels[p['participantType']] ?? 'Thành viên'} · ${p['lastReadAt'] == null ? 'Chưa có mốc đọc' : 'Đọc đến ${displayInstant(p['lastReadAt'])}'}',
            ),
        ],
        if (loading) const LinearProgressIndicator(),
        if (error != null) SCNotice(error!, warning: true),
        if (error != null)
          const Text(
            'Những tin nhắn cũ chưa tải được. Tin vừa gửi chỉ xuất hiện sau khi dịch vụ xác nhận.',
          ),
        TextButton(
          onPressed: loading ? null : load,
          child: const Text('Làm mới lịch sử'),
        ),
        if (more)
          TextButton(
            key: const ValueKey('chat-older'),
            onPressed: loading ? null : () => load(older: true),
            child: const Text('Tin nhắn trước'),
          ),
        if (sorted.isEmpty && error == null && !loading)
          const SCStateView(
            title: 'Chưa có tin nhắn',
            message: 'Gửi lời chào để bắt đầu trao đổi.',
          ),
        for (final message in sorted)
          SCCard(
            key: ValueKey('message-${message['id']}'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message['senderId'] == w.session.user?['id']
                      ? 'Bạn'
                      : 'Người tham gia',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  message['deleted'] == true
                      ? 'Tin nhắn đã xóa'
                      : '${message['content'] ?? ''}',
                ),
                Text(displayInstant(message['createdAt'])),
                if (message['deleted'] != true)
                  for (final file in objects(message['attachments'])) ...[
                    if ('${file['mediaType']}'.startsWith('image/') &&
                        usableChatAttachmentUrl(file['url']))
                      LiveMedia(file['url'] as String?, label: 'Ảnh đính kèm'),
                    if (!usableChatAttachmentUrl(file['url']))
                      const SCNotice(
                        'Tệp đã được dịch vụ nhận nhưng liên kết tải chưa dùng được trên thiết bị.',
                        warning: true,
                      ),
                    if (usableChatAttachmentUrl(file['url']))
                      LiveCommand(
                        'Lưu ${file['originalFileName'] ?? 'tệp đính kèm'}',
                        run: () => saveChatAttachment(file),
                      ),
                  ],
                if (message['senderId'] == w.session.user?['id'] &&
                    message['deleted'] != true)
                  LiveCommand(
                    'Xóa tin nhắn của tôi',
                    key: ValueKey('delete-message-${message['id']}'),
                    outlined: true,
                    run: () async {
                      if (await confirmLive(
                        context,
                        'Xóa nội dung tin nhắn?',
                      )) {
                        await w.chat.delete(widget.id, apiId(message['id']));
                        if (mounted) {
                          messages[apiId(message['id'])] = {
                            ...message,
                            'deleted': true,
                            'content': null,
                            'attachments': <Json>[],
                          };
                          setState(() {});
                        }
                      }
                    },
                  ),
              ],
            ),
          ),
        if (sorted.isNotEmpty && error == null)
          LiveCommand(
            'Đánh dấu đã đọc đến tin mới nhất',
            run: () => w.chat.read(widget.id, apiId(sorted.last['id'])),
          ),
        if (sendError != null) SCNotice(sendError!, warning: true),
        if (uncertain)
          const SCNotice(
            'Tin đang chờ được lưu an toàn trên máy. Làm mới lịch sử để đối chiếu; gửi lại giữ nguyên nội dung, tệp và mã tin nhắn. Đăng xuất sẽ xóa bản đang chờ trên thiết bị.',
            warning: true,
          ),
        if (conversation?['status'] == 'OPEN') ...[
          TextField(
            key: const ValueKey('chat-compose'),
            controller: text,
            enabled: !sending && !uncertain,
            maxLength: 10000,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Tin nhắn'),
          ),
          OutlinedButton.icon(
            key: const ValueKey('chat-pick-files'),
            onPressed: sending || uncertain
                ? null
                : () async {
                    try {
                      final file = await pickLiveFile('files', proof: true);
                      if (mounted && file != null) {
                        setState(() {
                          if (attachment == null) {
                            attachment = file;
                          } else if (extraFiles.length < 4) {
                            extraFiles.add(file);
                          } else {
                            sendError = 'Mỗi tin nhắn tối đa 5 tệp. Bỏ tệp đã chọn trước khi chọn lại.';
                          }
                        });
                      }
                    } on Object catch (e) {
                      if (mounted) setState(() => sendError = safeError(e));
                    }
                  },
            icon: const Icon(Icons.attach_file),
            label: Text(
              attachment == null
                  ? 'Ảnh / PDF · tối đa 5 tệp × 10 MiB'
                  : 'Đã chọn ${1 + extraFiles.length} tệp',
            ),
          ),
          if (attachment != null)
            TextButton(
              onPressed: sending || uncertain
                  ? null
                  : () => setState(() {
                      attachment = null;
                      extraFiles.clear();
                    }),
              child: const Text('Bỏ các tệp đã chọn'),
            ),
          SCButton(
            uncertain ? 'Gửi lại cùng mã tin nhắn' : 'Gửi tin nhắn',
            key: const ValueKey('chat-send'),
            busy: sending,
            onPressed: sending ? null : send,
          ),
          LiveCommand(
            'Đóng hội thoại',
            outlined: true,
            run: () async {
              final reason = await liveReason(
                context,
                'Đóng hội thoại',
                max: 500,
              );
              if (reason != null) {
                await w.chat.close(widget.id, reason);
                await load();
              }
            },
          ),
        ],
      ],
    );
  }
}
