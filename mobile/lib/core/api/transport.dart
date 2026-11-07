import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'contracts.dart';

String commandId() {
  final bytes = List.generate(16, (_) => Random.secure().nextInt(256));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  final h = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  return '${h.substring(0, 8)}-${h.substring(8, 12)}-${h.substring(12, 16)}-${h.substring(16, 20)}-${h.substring(20)}';
}

class UploadPart {
  UploadPart(this.field, this.name, this.mime, this.bytes);
  final String field, name, mime;
  final Uint8List bytes;
  static UploadPart image(
    String field,
    String name,
    Uint8List bytes, {
    int limit = 5 * 1024 * 1024,
    bool proof = false,
  }) {
    if (bytes.isEmpty || bytes.length > limit) {
      throw const ApiFailure(400, 'Tệp rỗng hoặc vượt giới hạn dung lượng.');
    }
    String? mime;
    if (bytes.length >= 8 &&
        bytes[0] == 137 &&
        bytes[1] == 80 &&
        bytes[2] == 78 &&
        bytes[3] == 71) {
      mime = 'image/png';
    }
    if (bytes.length >= 3 &&
        bytes[0] == 255 &&
        bytes[1] == 216 &&
        bytes[2] == 255) {
      mime = 'image/jpeg';
    }
    if (bytes.length >= 12 &&
        ascii.decode(bytes.sublist(0, 4), allowInvalid: true) == 'RIFF' &&
        ascii.decode(bytes.sublist(8, 12), allowInvalid: true) == 'WEBP') {
      mime = 'image/webp';
    }
    if (proof &&
        bytes.length >= 4 &&
        ascii.decode(bytes.sublist(0, 4), allowInvalid: true) == '%PDF') {
      mime = 'application/pdf';
    }
    if (mime == null) {
      throw const ApiFailure(
        400,
        'Định dạng tệp không được hỗ trợ. Chọn JPEG, PNG, WEBP hoặc PDF cho chứng từ.',
      );
    }
    return UploadPart(
      field,
      name.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_'),
      mime,
      bytes,
    );
  }
}

class WireResponse {
  WireResponse(this.status, this.body, this.cookies);
  final int status;
  final Object? body;
  final List<String> cookies;
  Object? get data {
    if (status == 204 || body == null) return null;
    final json = object(body);
    if (!json.containsKey('data') || json['statusCode'] is! num) {
      throw const FormatException('Envelope API không hợp lệ.');
    }
    return json['data'];
  }
}

abstract interface class ApiTransport {
  Future<WireResponse> send(
    String method,
    Uri uri, {
    Map<String, String> headers,
    Object? body,
    List<UploadPart> files,
    Map<String, String> fields,
    bool multipart,
    int? scope,
  });
  void cancel(int scope);
  void close();
}

class NativeTransport implements ApiTransport {
  NativeTransport({this.timeout = const Duration(seconds: 20)});
  final Duration timeout;
  final HttpClient _client = HttpClient()
    ..connectionTimeout = const Duration(seconds: 8);
  final Map<int, Set<HttpClientRequest>> _requests = {};
  final Set<int> _cancelled = {};
  void Function(Json)? onEvidence;

  /// Sanitized evidence hook: no body, headers, query strings, cookies or PII.
  void Function(String method, String path, int status)? onResult;
  @override
  Future<WireResponse> send(
    String method,
    Uri uri, {
    Map<String, String> headers = const {},
    Object? body,
    List<UploadPart> files = const [],
    Map<String, String> fields = const {},
    bool multipart = false,
    int? scope,
  }) async {
    HttpClientRequest? request;
    try {
      request = await _client.openUrl(method, uri).timeout(timeout);
      if (scope != null && _cancelled.contains(scope)) {
        request.abort();
        throw const ApiFailure(0, 'Ngữ cảnh yêu cầu đã thay đổi.');
      }
      request.followRedirects =
          false; // Never forward auth to redirects/storage.
      if (scope != null) (_requests[scope] ??= {}).add(request);
      headers.forEach(request.headers.set);
      request.headers.set('Accept', 'application/json');
      if (multipart || files.isNotEmpty || fields.isNotEmpty) {
        final boundary = 'sweetcake-${commandId()}';
        request.headers.set(
          'Content-Type',
          'multipart/form-data; boundary=$boundary',
        );
        final data = BytesBuilder();
        void text(String s) => data.add(utf8.encode(s));
        for (final entry in fields.entries) {
          text(
            '--$boundary\r\nContent-Disposition: form-data; name="${entry.key}"\r\n\r\n${entry.value}\r\n',
          );
        }
        if (body != null) {
          text(
            '--$boundary\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n${jsonEncode(body)}\r\n',
          );
        }
        for (final file in files) {
          text(
            '--$boundary\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.name}"\r\nContent-Type: ${file.mime}\r\n\r\n',
          );
          data.add(file.bytes);
          text('\r\n');
        }
        text('--$boundary--\r\n');
        request.add(data.takeBytes());
      } else if (body != null) {
        request.headers.contentType = ContentType.json;
        request.write(jsonEncode(body));
      }
      final response = await request.close().timeout(timeout);
      final bytes = await response
          .fold<BytesBuilder>(BytesBuilder(), (a, b) => a..add(b))
          .timeout(timeout);
      final raw = utf8.decode(bytes.takeBytes());
      Object? decoded;
      try {
        decoded = raw.isEmpty ? null : jsonDecode(raw);
      } on FormatException {
        throw ApiFailure(
          response.statusCode >= 400 ? response.statusCode : 502,
          'Phản hồi dịch vụ không phải JSON hợp lệ.',
          uncertain: method != 'GET',
        );
      }
      onResult?.call(method, uri.path, response.statusCode);
      final ids = <String>[];
      final states = <String>[];
      void collect(Object? v) {
        if (v is Map) {
          for (final e in v.entries) {
            if (e.key == 'id' && e.value is String) ids.add(e.value as String);
            if (e.key == 'status' && e.value is String) {
              states.add(e.value as String);
            }
            if (e.value is List || e.value is Map) collect(e.value);
          }
        } else if (v is List) {
          for (final e in v) {
            collect(e);
          }
        }
      }

      collect(decoded);
      onEvidence?.call({
        'method': method,
        'path': uri.path,
        'status': response.statusCode,
        'ids': ids,
        'states': states,
      });
      return WireResponse(
        response.statusCode,
        decoded,
        response.headers[HttpHeaders.setCookieHeader] ?? [],
      );
    } on ApiFailure {
      rethrow;
    } on Object {
      request?.abort();
      onResult?.call(method, uri.path, 0);
      throw ApiFailure(
        0,
        method == 'GET'
            ? 'Không kết nối được dịch vụ. Kiểm tra mạng và thử lại.'
            : 'Chưa xác định kết quả. Làm mới dữ liệu trước khi thử lại.',
        uncertain: method != 'GET',
      );
    } finally {
      if (scope != null) _requests[scope]?.remove(request);
    }
  }

  @override
  void cancel(int scope) {
    _cancelled.add(scope);
    for (final r in _requests.remove(scope) ?? <HttpClientRequest>{}) {
      r.abort();
    }
  }

  @override
  void close() => _client.close(force: true);
}
