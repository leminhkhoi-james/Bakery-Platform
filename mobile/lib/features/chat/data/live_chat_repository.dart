import 'dart:convert';
import 'dart:typed_data';

import '../../../core/api/api_client.dart';
import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/api/transport.dart';
import 'pending_chat_journal.dart';
import 'pending_chat_message.dart';
import 'pending_chat_recovery.dart';
export 'pending_chat_message.dart';

class LiveChatRepository {
  LiveChatRepository(this.api, {PendingChatJournal? journal})
    : recovery = PendingChatRecovery(
        api,
        journal ?? EncryptedPendingChatJournal(),
      );
  final ApiClient api;
  final PendingChatRecovery recovery;
  Map<String, PendingChatMessage> get pending => recovery.pending;
  void clearPending() => recovery.detach();
  Future<void> restorePending() => recovery.restore();
  Future<void> discardAccountPending() => recovery.discardAccount();
  Future<Json?> reconcile(String id, MessagePage page) => recovery.reconcile(
    id,
    page,
    (cursor) => messages(id, before: cursor, limit: 100),
  );
  String path(String id) => '/api/v1/conversations/${apiId(id)}';
  Future<ApiPage> list(Map<String, Object?> query) async => ApiPage.fromJson(
    await api.request(
      ApiService.chat,
      'GET',
      '/api/v1/conversations',
      query: query,
    ),
  );
  Future<Json> detail(String id) async => identified(
    await api.request(ApiService.chat, 'GET', path(id)),
    expected: id,
  );
  Future<Json> create(String requestId, String bakeryId) async => identified(
    await api.request(
      ApiService.chat,
      'POST',
      '/api/v1/conversations',
      body: {'cakeRequestId': apiId(requestId), 'bakeryId': apiId(bakeryId)},
    ),
  );
  Future<Json?> existingForRequest(String requestId, String bakeryId) async {
    for (var page = 1; page <= 100; page++) {
      final result = await list({
        'bakeryId': apiId(bakeryId),
        'page': page,
        'size': 100,
      });
      final matches = result.items
          .where(
            (c) => c['cakeRequestId'] == requestId && c['bakeryId'] == bakeryId,
          )
          .toList();
      if (matches.length > 1) {
        throw const FormatException(
          'Dịch vụ trả nhiều hội thoại cho cùng ngữ cảnh.',
        );
      }
      if (matches.isNotEmpty) return matches.single;
      if (!result.hasNext) return null;
    }
    throw const ApiFailure(
      422,
      'Danh sách lớn. Mở hội thoại từ danh sách trò chuyện để tiếp tục.',
    );
  }

  Future<Json> close(String id, String reason) async => identified(
    await api.request(
      ApiService.chat,
      'POST',
      '${path(id)}/close',
      body: {'reason': reason},
    ),
    expected: id,
  );
  Future<MessagePage> messages(
    String id, {
    String? before,
    int limit = 30,
  }) async => MessagePage.fromJson(
    await api.request(
      ApiService.chat,
      'GET',
      '${path(id)}/messages',
      query: {'before': before, 'limit': limit},
    ),
  );
  Future<Json> send(
    String id,
    String logicalId,
    String content, {
    UploadPart? attachment,
    List<UploadPart> attachments = const [],
  }) async {
    final files = [?attachment, ...attachments];
    if (content.trim().length > 10000 ||
        content.trim().isEmpty && files.isEmpty) {
      throw const ApiFailure(
        422,
        'Tin nhắn cần nội dung hoặc tệp; nội dung tối đa 10.000 ký tự.',
      );
    }
    if (files.length > 5 ||
        files.any(
          (f) =>
              f.bytes.isEmpty ||
              f.bytes.length > 10 * 1024 * 1024 ||
              ![
                'image/jpeg',
                'image/png',
                'image/webp',
                'application/pdf',
              ].contains(f.mime),
        )) {
      throw const ApiFailure(
        422,
        'Tối đa 5 tệp JPEG, PNG, WEBP hoặc PDF, mỗi tệp tối đa 10 MiB.',
      );
    }
    final attempt = await recovery.begin(
      apiId(id),
      PendingChatMessage(apiId(logicalId), content.trim(), files),
    );
    final metadata = {
      'clientMessageId': apiId(logicalId),
      'messageType': files.isEmpty
          ? 'TEXT'
          : files.every((f) => f.mime.startsWith('image/'))
          ? 'IMAGE'
          : 'FILE',
      'content': content.trim(),
    };
    try {
      final result = identified(
        await api.request(
          ApiService.chat,
          'POST',
          '${path(id)}/messages',
          multipart: true,
          files: [
            UploadPart(
              'metadata',
              'metadata.json',
              'application/json',
              Uint8List.fromList(utf8.encode(jsonEncode(metadata))),
            ),
            ...attempt.message.attachments,
          ],
        ),
      );
      if (result['clientMessageId'] != logicalId) {
        throw const ApiFailure(
          502,
          'Tin nhắn trả về chưa khớp mã gửi. Giữ nguyên mã để kiểm tra lại.',
          uncertain: true,
        );
      }
      await recovery.complete(attempt);
      return result;
    } on ApiFailure catch (e) {
      await recovery.failed(
        attempt,
        retain:
            e.uncertain || e.status == 0 || e.status == 403 || e.status == 409,
        uncertain: e.uncertain || e.status == 403 || e.status == 409,
      );
      if (e.status == 403) {
        throw const ApiFailure(
          403,
          'Dịch vụ từ chối phản hồi gửi tin. Chưa xác nhận được kết quả; giữ nguyên mã và kiểm tra lịch sử hoặc đăng nhập lại.',
          uncertain: true,
        );
      }
      rethrow;
    } on FormatException {
      throw const ApiFailure(
        502,
        'Phản hồi tin nhắn chưa đúng contract. Giữ nguyên mã để đối chiếu.',
        uncertain: true,
      );
    } on Object {
      throw const ApiFailure(
        0,
        'Chưa xác nhận được kết quả. Tin đã lưu được giữ để đối chiếu và gửi lại cùng mã.',
        uncertain: true,
      );
    } finally {
      recovery.release(attempt);
    }
  }

  Future<void> read(String id, String through) async {
    final result = object(
      await api.request(
        ApiService.chat,
        'POST',
        '${path(id)}/read',
        body: {'throughMessageId': apiId(through)},
      ),
    );
    if (result['conversationId'] != id) {
      throw const FormatException('Read state trả sai hội thoại.');
    }
  }

  Future<void> delete(String id, String message) async {
    await api.request(
      ApiService.chat,
      'DELETE',
      '${path(id)}/messages/${apiId(message)}',
    );
  }
}
