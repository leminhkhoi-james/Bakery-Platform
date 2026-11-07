import 'dart:async';
import 'dart:convert';

import 'package:crypto/crypto.dart';

import '../../features/auth/data/live_session.dart';
import 'contracts.dart';
import 'environment.dart';
import 'transport.dart';

class ApiClient {
  ApiClient(this.session);
  final LiveSession session;
  int context = 0;
  int requestScope = -1;
  final Map<String, String> _keys = {};
  void invalidate() {
    session.transport.cancel(requestScope);
    requestScope--;
    context++;
    _keys.clear();
  }

  void finishLogicalAction(String method, String path, Object? body) {
    final key = keyFor('$method $path', body, const []);
    _keys.removeWhere((_, value) => value == key);
  }

  String keyFor(String action, Object? body, List<UploadPart> files) {
    final signature = sha256
        .convert(
          utf8.encode(
            jsonEncode([
              session.generation,
              context,
              action,
              body,
              for (final f in files)
                [f.field, f.name, sha256.convert(f.bytes).toString()],
            ]),
          ),
        )
        .toString();
    return _keys.putIfAbsent(signature, commandId);
  }

  Future<Object?> request(
    ApiService service,
    String method,
    String path, {
    Map<String, Object?> query = const {},
    Object? body,
    bool authenticated = true,
    bool idempotent = false,
    List<UploadPart> files = const [],
    Map<String, String> fields = const {},
    bool multipart = false,
  }) async {
    final generation = session.generation,
        snapshot = context,
        scope = requestScope;
    if (authenticated) await session.ensureFresh();
    void fence() {
      if (authenticated &&
          (generation != session.generation || snapshot != context)) {
        throw const ApiFailure(0, 'Ngữ cảnh tài khoản hoặc tiệm đã thay đổi.');
      }
    }

    fence();
    final key = idempotent ? keyFor('$method $path', body, files) : null;
    var refreshed = false, retried = false;
    while (true) {
      WireResponse r;
      try {
        r = await session.transport.send(
          method,
          session.environment.endpoint(service, path, query),
          headers: {
            if (authenticated) 'Authorization': 'Bearer ${session.accessToken}',
            'Idempotency-Key': ?key,
          },
          body: body,
          files: files,
          fields: fields,
          multipart: multipart,
          scope: authenticated ? scope : null,
        );
      } on ApiFailure catch (e) {
        fence();
        if (method == 'GET' && e.transient && !retried) {
          retried = true;
          continue;
        }
        rethrow;
      }
      fence();
      if (r.status == 401 && authenticated && !refreshed) {
        refreshed = true;
        await session.refresh();
        fence();
        if (method == 'GET') continue;
        throw const ApiFailure(
          401,
          'Đã làm mới phiên. Kiểm tra trạng thái rồi gửi lại thao tác.',
        );
      }
      if (r.status >= 500 && method == 'GET' && !retried) {
        retried = true;
        continue;
      }
      if (r.status >= 400) {
        throw ApiFailure(
          r.status,
          ApiFailure.forStatus(r.status),
          uncertain: method != 'GET' && r.status >= 500,
        );
      }
      try {
        return r.data;
      } on FormatException {
        throw ApiFailure(
          502,
          'Dữ liệu dịch vụ không đúng contract. Đọc lại trạng thái trước khi gửi lại.',
          uncertain: method != 'GET',
        );
      }
    }
  }
}
