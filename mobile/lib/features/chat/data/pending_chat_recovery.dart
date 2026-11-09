import 'dart:convert';

import '../../../core/api/api_client.dart';
import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';
import '../../../core/api/phase5_contracts.dart';
import 'pending_chat_journal.dart';
import 'pending_chat_message.dart';

class PendingChatAttempt {
  PendingChatAttempt(this.scope, this.epoch, this.conversation, this.message);
  final String scope, conversation;
  final int epoch;
  final PendingChatMessage message;
}

class PendingChatRecovery {
  PendingChatRecovery(this.api, this.journal);
  final ApiClient api;
  final PendingChatJournal journal;
  final Map<String, PendingChatMessage> pending = {};
  final Map<String, int> _inFlight = {};
  String? _scope, _loadingScope;
  Future<void>? _loading;
  int _epoch = 0;
  bool _discarding = false;

  String accountScope() => jsonEncode([
    api.session.environment.identity.origin,
    api.session.environment.origin(ApiService.chat).origin,
    apiId(api.session.user?['id']),
  ]);

  void detach({bool signingOut = false}) {
    _discarding = signingOut;
    _epoch++;
    pending.clear();
    _inFlight.clear();
    _scope = null;
    _loading = null;
    _loadingScope = null;
  }

  Future<void> restore() async {
    final scope = accountScope();
    if (_scope == scope) return;
    if (_loadingScope == scope && _loading != null) return _loading!;
    final epoch = _epoch;
    _loadingScope = scope;
    return _loading = (() async {
      try {
        final records = await journal.load(scope);
        if (epoch != _epoch || scope != accountScope()) {
          throw const ApiFailure(0, 'Tài khoản đã thay đổi.');
        }
        pending
          ..clear()
          ..addAll(records);
        _scope = scope;
      } on ApiFailure {
        rethrow;
      } on Object {
        throw const ApiFailure(
          0,
          'Chưa đọc được tin đang chờ đã lưu. Dữ liệu được giữ nguyên; thử lại trước khi gửi.',
          kind: ApiFailureKind.configuration,
        );
      } finally {
        if (epoch == _epoch) {
          _loadingScope = null;
          _loading = null;
        }
      }
    })();
  }

  Future<void> discardAccount() async {
    if (api.session.user == null) return;
    final scope = accountScope();
    detach(signingOut: true);
    try {
      await journal.clear(scope);
    } on Object {
      throw const ApiFailure(
        0,
        'Chưa xóa được tin đang chờ trên máy. Thử đăng xuất lại.',
        kind: ApiFailureKind.configuration,
      );
    }
  }

  bool _current(PendingChatAttempt attempt) =>
      attempt.epoch == _epoch &&
      attempt.scope == _scope &&
      attempt.scope == accountScope();

  Future<PendingChatAttempt> begin(
    String conversation,
    PendingChatMessage message,
  ) async {
    final epoch = _epoch;
    if (_discarding || _inFlight.containsKey(conversation)) {
      throw const ApiFailure(
        409,
        'Tin nhắn đang được gửi. Vui lòng chờ.',
        uncertain: true,
      );
    }
    _inFlight[conversation] = epoch;
    try {
      await restore();
      if (epoch != _epoch) {
        throw const ApiFailure(0, 'Tài khoản đã thay đổi.');
      }
      final previous = pending[conversation];
      if (previous != null &&
          (previous.id != message.id ||
              previous.signature != message.signature)) {
        throw const ApiFailure(
          409,
          'Đang có tin chưa rõ kết quả. Giữ nguyên nội dung và clientMessageId để đối chiếu.',
        );
      }
      final command = (previous ?? message).withState(
        'awaiting_response',
        attempt: true,
      );
      final attempt = PendingChatAttempt(_scope!, epoch, conversation, command);
      await journal.put(attempt.scope, conversation, command);
      if (!_current(attempt)) {
        throw const ApiFailure(0, 'Tài khoản đã thay đổi.');
      }
      pending[conversation] = command;
      return attempt;
    } catch (e) {
      if (_inFlight[conversation] == epoch) _inFlight.remove(conversation);
      if (e is ApiFailure) rethrow;
      throw const ApiFailure(
        0,
        'Chưa lưu an toàn tin nhắn trên máy; chưa gửi yêu cầu. Kiểm tra dung lượng và thử lại.',
        kind: ApiFailureKind.configuration,
      );
    }
  }

  void release(PendingChatAttempt attempt) {
    if (_inFlight[attempt.conversation] == attempt.epoch) {
      _inFlight.remove(attempt.conversation);
    }
  }

  Future<void> complete(PendingChatAttempt attempt) async {
    if (!_current(attempt)) return;
    await journal.remove(attempt.scope, attempt.conversation);
    if (_current(attempt)) pending.remove(attempt.conversation);
  }

  Future<void> failed(
    PendingChatAttempt attempt, {
    required bool retain,
    required bool uncertain,
  }) async {
    if (!_current(attempt)) return;
    if (!retain) {
      await complete(attempt);
      return;
    }
    final next = attempt.message.withState(
      uncertain ? 'uncertain' : 'not_sent',
    );
    await journal.put(attempt.scope, attempt.conversation, next);
    if (_current(attempt)) pending[attempt.conversation] = next;
  }

  /// Absence from a bounded history scan is never treated as proof of failure.
  Future<Json?> reconcile(
    String conversation,
    MessagePage first,
    Future<MessagePage> Function(String cursor) older,
  ) async {
    await restore();
    final command = pending[conversation];
    if (command == null || _inFlight.containsKey(conversation)) return null;
    final attempt = PendingChatAttempt(_scope!, _epoch, conversation, command);
    var page = first;
    final cursors = <String>{};
    for (var index = 0; index < 5; index++) {
      for (final message in page.items) {
        if (message['clientMessageId'] != command.id ||
            message['senderId'] != api.session.user?['id']) {
          continue;
        }
        final files = objects(message['attachments']);
        if (message['deleted'] != true &&
            ((message['content'] ?? '') != command.content ||
                files.length != command.attachments.length ||
                List.generate(
                  files.length,
                  (i) =>
                      files[i]['originalFileName'] !=
                          command.attachments[i].name ||
                      files[i]['mediaType'] != command.attachments[i].mime ||
                      files[i]['fileSize'] !=
                          command.attachments[i].bytes.length,
                ).any((mismatch) => mismatch))) {
          throw const ApiFailure(
            409,
            'Mã tin nhắn có dữ liệu chưa khớp. Giữ bản đang chờ để kiểm tra.',
            uncertain: true,
          );
        }
        await complete(attempt);
        return message;
      }
      if (!page.hasMore || !cursors.add(page.nextCursor!)) return null;
      page = await older(page.nextCursor!);
      if (!_current(attempt)) return null;
    }
    return null;
  }
}
