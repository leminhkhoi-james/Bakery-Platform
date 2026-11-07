import 'dart:convert';
import 'dart:io';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/api/contracts.dart';

abstract interface class SessionStore {
  Future<String?> read();
  Future<void> write(String? value);
}

class SecureSessionStore implements SessionStore {
  // Isolate app data and KeyStore aliases from the plugin's legacy default
  // preferences. Cold starts on API 36 exposed a legacy ESP migration collision.
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      storageNamespace: 'sweetcake.identity.v1',
      migrateWithBackup: true,
      resetOnError: false,
    ),
  );
  @override
  Future<String?> read() => _storage.read(key: 'sweetcake.identity.v1');
  @override
  Future<void> write(String? value) => value == null
      ? _storage.delete(key: 'sweetcake.identity.v1')
      : _storage.write(key: 'sweetcake.identity.v1', value: value);
}

/// Origin includes port deliberately; cookies must never cross microservice ports.
class RefreshCookie {
  RefreshCookie(this.raw, this.origin, this.expires);
  final String raw, origin;
  final DateTime expires;
  factory RefreshCookie.receive(String raw, Uri origin, DateTime now) {
    final cookie = Cookie.fromSetCookieValue(raw);
    if (cookie.name != 'refresh_token' ||
        !cookie.httpOnly ||
        cookie.path != '/api/v1/auth' ||
        cookie.domain != null && cookie.domain != origin.host) {
      throw const FormatException(
        'Refresh cookie không đúng contract Identity.',
      );
    }
    return RefreshCookie(
      raw,
      origin.origin,
      cookie.maxAge == null
          ? cookie.expires ?? now
          : now.add(Duration(seconds: cookie.maxAge!)),
    );
  }
  String? header(Uri destination, DateTime now) {
    final cookie = Cookie.fromSetCookieValue(raw);
    final path = cookie.path ?? '/';
    if (destination.origin != origin ||
        !expires.isAfter(now) ||
        !(destination.path == path || destination.path.startsWith('$path/')) ||
        cookie.secure && destination.scheme != 'https') {
      return null;
    }
    return '${cookie.name}=${cookie.value}';
  }

  Json toJson() => {
    'raw': raw,
    'origin': origin,
    'expires': expires.toIso8601String(),
  };
  static RefreshCookie decode(Json j) => RefreshCookie(
    requiredText(j, 'raw'),
    requiredText(j, 'origin'),
    DateTime.parse(requiredText(j, 'expires')),
  );
  static RefreshCookie? find(List<String> values, Uri origin, DateTime now) {
    for (final value in values) {
      if (value.startsWith('refresh_token=')) {
        return RefreshCookie.receive(value, origin, now);
      }
    }
    return null;
  }
}

String encodeSession(
  String token,
  DateTime expiry,
  RefreshCookie? cookie,
  Uri identity,
) => jsonEncode({
  'identity': identity.origin,
  'accessToken': token,
  'expiresAt': expiry.toIso8601String(),
  'cookie': cookie?.toJson(),
});
