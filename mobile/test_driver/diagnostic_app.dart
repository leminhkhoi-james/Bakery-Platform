// Debug-only entrypoint. Uses isolated memory sessions, never the user's store.
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_driver/driver_extension.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:bakery_mobile/main.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/core/live/live_workspace.dart';
import 'package:bakery_mobile/features/auth/data/session_store.dart';
import 'package:bakery_mobile/app/router/screen_id.dart';

class DiagnosticMemoryStore implements SessionStore {
  String? value;
  @override
  Future<String?> read() async => value;
  @override
  Future<void> write(String? value) async {
    this.value = value;
  }
}

class DiagnosticSecureStore implements SessionStore {
  final storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      storageNamespace: 'sweetcake.diagnostic.v1',
      migrateWithBackup: true,
      resetOnError: false,
    ),
  );
  @override
  Future<String?> read() => storage.read(key: 'session');
  @override
  Future<void> write(String? value) => value == null
      ? storage.delete(key: 'session')
      : storage.write(key: 'session', value: value);
}

class DiagnosticTransport implements ApiTransport {
  var native = NativeTransport();
  final List<Json> events = [];
  String mode = 'real';
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
    final effective = mode == 'connection-refused' ? uri.replace(port: 1) : uri;
    final isRegistration = uri.path == '/api/v1/auth/register';
    try {
      final response = await native.send(
        method,
        effective,
        headers: headers,
        body: mode == 'invalid-body' && isRegistration
            ? {...object(body), 'displayName': ''}
            : body,
        files: files,
        fields: fields,
        multipart: multipart,
        scope: scope,
      );
      final ids = <String>[];
      if (response.status < 300 && response.data is Map) {
        final id = object(response.data)['id'];
        if (id is String) ids.add(id);
      }
      events.add({
        'method': method,
        'origin': effective.origin,
        'path': uri.path,
        'status': response.status,
        'ids': ids,
        'mode': mode,
        'layer': 'ANDROID_UI',
        'at': DateTime.now().toUtc().toIso8601String(),
      });
      if (mode == 'lost-register-response' &&
          isRegistration &&
          response.status == 201) {
        throw const ApiFailure(
          0,
          'Chưa nhận được phản hồi đăng ký.',
          uncertain: true,
        );
      }
      return response;
    } on ApiFailure catch (e) {
      events.add({
        'method': method,
        'origin': effective.origin,
        'path': uri.path,
        'status': e.status,
        'uncertain': e.uncertain,
        'kind': e.kind.name,
        'responseStatus': e.responseStatus,
        'mode': mode,
        'layer': 'ANDROID_UI_FAILURE',
        'at': DateTime.now().toUtc().toIso8601String(),
      });
      rethrow;
    }
  }

  @override
  void cancel(int scope) => native.cancel(scope);
  @override
  void close() => native.close();
}

void main() {
  final transport = DiagnosticTransport();
  final workspace = LiveWorkspace(
    transport: transport,
    store: const bool.fromEnvironment('DIAGNOSTIC_PERSISTENT')
        ? DiagnosticSecureStore()
        : DiagnosticMemoryStore(),
  );
  final navigator = GlobalKey<NavigatorState>();
  enableFlutterDriverExtension(
    handler: (message) async {
      final request = message == null
          ? <String, dynamic>{}
          : object(jsonDecode(message));
      if (request['mode'] is String) transport.mode = request['mode'] as String;
      if (request['resetConnections'] == true) {
        transport.native.close();
        transport.native = NativeTransport();
      }
      if (request['nav'] is String) {
        navigator.currentState!.pushNamed(
          request['nav'] as String,
          arguments: ScreenArguments(id: request['id'] as String?),
        );
      }
      if (request['expire'] == true) {
        workspace.session.expiresAt = DateTime.now().subtract(
          const Duration(seconds: 1),
        );
      }
      return jsonEncode({
        'events': transport.events,
        'userId': workspace.session.user?['id'],
        'roles': workspace.session.user?['roles'] ?? [],
        'restoring': workspace.session.restoring,
        'bakeryId': workspace.bakery?['id'],
        'origins': {
          'identity': workspace.session.environment.identity.origin,
          'bakery': workspace.session.environment.bakery.origin,
          'subscription': workspace.session.environment.subscription.origin,
        },
      });
    },
  );
  runApp(BakeryApp(liveWorkspace: workspace, navigatorKey: navigator));
}
