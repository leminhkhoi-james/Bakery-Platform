import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';
import '../../../core/api/transport.dart';
import 'session_store.dart';

class LiveSession extends ChangeNotifier {
  LiveSession(this.environment, this.transport, this.store);
  final ApiEnvironment environment;
  final ApiTransport transport;
  final SessionStore store;
  String? accessToken;
  DateTime? expiresAt;
  RefreshCookie? cookie;
  Json? user;
  String? notice;
  bool restoring = true;
  int generation = 0;
  Future<void>? _refresh;
  Future<void> _storageQueue = Future.value();
  bool get authenticated => user != null;
  bool hasRole(String role) => (user?['roles'] as List? ?? []).contains(role);
  Future<void> _persist(int expected) {
    _storageQueue = _storageQueue.catchError((Object _) {}).then((_) async {
      if (expected != generation) return;
      await store.write(
        accessToken == null
            ? null
            : encodeSession(
                accessToken!,
                expiresAt!,
                cookie,
                environment.identity,
              ),
      );
    });
    return _storageQueue;
  }

  void _reset() {
    transport.cancel(generation);
    generation++;
    accessToken = null;
    expiresAt = null;
    cookie = null;
    user = null;
    _refresh = null;
    notifyListeners();
  }

  Future<void> restore() async {
    final expected = generation;
    try {
      final raw = await store.read();
      if (expected != generation || raw == null) return;
      final value = object(jsonDecode(raw));
      if (value['identity'] != environment.identity.origin) {
        await store.write(null);
        notice = 'Máy chủ xác thực đã thay đổi. Vui lòng đăng nhập lại.';
        return;
      }
      accessToken = requiredText(value, 'accessToken');
      expiresAt = DateTime.parse(requiredText(value, 'expiresAt'));
      cookie = value['cookie'] == null
          ? null
          : RefreshCookie.decode(object(value['cookie']));
      await refresh();
      await loadUser();
    } on ApiFailure catch (e) {
      notice = e.transient
          ? 'Chưa thể khôi phục phiên. Kết nối lại rồi thử khôi phục.'
          : e.message;
    } on Object {
      _reset();
      await _persist(generation);
      notice = 'Không đọc được phiên đã lưu. Vui lòng đăng nhập lại.';
    } finally {
      restoring = false;
      notifyListeners();
    }
  }

  Future<Object?> authRequest(
    String action, {
    Object? body,
    String? cookieHeader,
    String? token,
  }) async {
    final r = await transport.send(
      action == 'me' ? 'GET' : 'POST',
      environment.endpoint(ApiService.identity, '/api/v1/auth/$action', {}),
      body: body,
      headers: {
        'Cookie': ?cookieHeader,
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );
    if (r.status >= 400) {
      throw ApiFailure(r.status, ApiFailure.forStatus(r.status));
    }
    return r.data;
  }

  Future<void> register(Json fields) async {
    await authRequest('register', body: fields);
  }

  Future<void> login(String email, String password) async {
    _reset();
    final expected = generation;
    notice = null;
    await _persist(expected);
    final r = await transport.send(
      'POST',
      environment.endpoint(ApiService.identity, '/api/v1/auth/login', {}),
      body: {'email': email.trim(), 'password': password},
      scope: expected,
    );
    if (expected != generation) throw const ApiFailure(0, 'Phiên đã thay đổi.');
    if (r.status >= 400) {
      throw ApiFailure(
        r.status,
        r.status == 401
            ? 'Email hoặc mật khẩu chưa đúng.'
            : ApiFailure.forStatus(r.status),
      );
    }
    _accept(r, expected);
    await _persist(expected);
    await loadUser();
  }

  void _accept(WireResponse r, int expected) {
    if (expected != generation) {
      throw const ApiFailure(0, 'Bỏ phản hồi của phiên cũ.');
    }
    final data = object(r.data);
    if (data['tokenType'] != 'Bearer' ||
        data['expiresIn'] is! num ||
        (data['expiresIn'] as num) <= 0) {
      throw const FormatException(
        'Token response không đúng contract expiresIn.',
      );
    }
    final nextToken = requiredText(data, 'accessToken');
    final nextExpiry = DateTime.now().toUtc().add(
      Duration(seconds: (data['expiresIn'] as num).toInt()),
    );
    final received = RefreshCookie.find(
      r.cookies,
      environment.identity,
      DateTime.now().toUtc(),
    );
    if (received == null) {
      throw const FormatException('Identity không gửi refresh cookie.');
    }
    // Commit a complete rotation only after every part passed validation.
    accessToken = nextToken;
    expiresAt = nextExpiry;
    cookie = received;
  }

  Future<void> refresh() {
    if (_refresh != null) return _refresh!;
    final expected = generation;
    final running = _refreshOnce(expected);
    _refresh = running;
    unawaited(
      running.then(
        (_) {
          if (expected == generation) _refresh = null;
        },
        onError: (Object _) {
          if (expected == generation) _refresh = null;
        },
      ),
    );
    return running;
  }

  Future<void> _refreshOnce(int expected) async {
    final uri = environment.endpoint(
      ApiService.identity,
      '/api/v1/auth/refresh',
      {},
    );
    final value = cookie?.header(uri, DateTime.now().toUtc());
    if (value == null) {
      _reset();
      await _persist(generation);
      throw const ApiFailure(401, 'Phiên đăng nhập đã hết hạn.');
    }
    final r = await transport.send(
      'POST',
      uri,
      headers: {'Cookie': value},
      scope: expected,
    );
    if (expected != generation) throw const ApiFailure(0, 'Phiên đã thay đổi.');
    if (r.status >= 400) {
      if (r.status == 401 || r.status == 403) {
        _reset();
        await _persist(generation);
      }
      throw ApiFailure(r.status, ApiFailure.forStatus(r.status));
    }
    _accept(r, expected);
    await _persist(expected);
  }

  Future<void> ensureFresh() async {
    if (accessToken == null) throw const ApiFailure(401, 'Vui lòng đăng nhập.');
    if (expiresAt == null ||
        expiresAt!.isBefore(DateTime.now().add(const Duration(seconds: 30)))) {
      await refresh();
    }
  }

  Future<void> loadUser() async {
    await ensureFresh();
    final expected = generation;
    final value = await authRequest('me', token: accessToken);
    if (expected != generation) return;
    final profile = object(value);
    requiredText(profile, 'id');
    if (profile['roles'] is! List) {
      throw const FormatException('API thiếu roles.');
    }
    user = profile;
    notice = null;
    notifyListeners();
  }

  Future<void> reloadRoles() async {
    await refresh();
    await loadUser();
  }

  Future<void> logout() async {
    final uri = environment.endpoint(
      ApiService.identity,
      '/api/v1/auth/logout',
      {},
    );
    final previous = cookie?.header(uri, DateTime.now().toUtc());
    final pending = _refresh != null;
    var revocationToken = accessToken;
    var revocationCookie = previous;
    final needsRefresh =
        expiresAt == null || expiresAt!.isBefore(DateTime.now());
    _reset();
    await _persist(generation);
    try {
      // Identity protects logout with a user JWT in addition to the cookie.
      // A detached rotation may obtain one after local cleanup; never restore it.
      if (needsRefresh && !pending && previous != null) {
        final refreshed = await transport.send(
          'POST',
          environment.endpoint(ApiService.identity, '/api/v1/auth/refresh', {}),
          headers: {'Cookie': previous},
        );
        if (refreshed.status >= 400) {
          throw ApiFailure(
            refreshed.status,
            ApiFailure.forStatus(refreshed.status),
          );
        }
        revocationToken = requiredText(object(refreshed.data), 'accessToken');
        revocationCookie = RefreshCookie.find(
          refreshed.cookies,
          environment.identity,
          DateTime.now().toUtc(),
        )?.header(uri, DateTime.now().toUtc());
      }
      if (revocationToken == null || revocationCookie == null) {
        throw const ApiFailure(401, 'Chưa có phiên server để thu hồi.');
      }
      await authRequest(
        'logout',
        cookieHeader: revocationCookie,
        token: revocationToken,
      );
      notice = pending
          ? 'Đã xóa phiên trên máy; có refresh đang dở nên chưa xác nhận thu hồi phiên server.'
          : 'Đã đăng xuất và server xác nhận thu hồi refresh token.';
    } on Object {
      notice = 'Đã xóa phiên trên máy. Chưa xác nhận thu hồi trên server do mất kết nối.';
    }
    notifyListeners();
  }
}
